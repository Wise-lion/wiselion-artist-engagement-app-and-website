import { Router, raw } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { stripe } from '../lib/stripe';
import { env } from '../lib/env';
import { creditCoins } from '../utils/coins';
import { TxnType, Tier, MembershipPlan } from '@prisma/client';

const router = Router();

/**
 * Stripe webhook. Mounted with a RAW body parser (signature verification needs
 * the exact bytes). Handles:
 *   - payment_intent.succeeded → fulfil merch orders / credit coin top-ups,
 *     recording the actual paymentMethodType used (card | paypal | venmo | cashapp).
 *   - invoice.paid → activate / renew Premium membership.
 *   - customer.subscription.deleted → downgrade to FREE.
 */
router.post('/stripe', raw({ type: 'application/json' }), async (req, res) => {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'] as string,
      env.stripe.webhookSecret
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook signature failed: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      // The method actually used (e.g. 'card', 'paypal', 'cashapp', 'venmo').
      const methodType = pi.payment_method_types?.[0];
      const resolvedType =
        (pi as any).charges?.data?.[0]?.payment_method_details?.type || methodType;
      const kind = pi.metadata.kind;

      if (kind === 'merch') {
        const orderId = pi.metadata.orderId;
        await prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
          if (!order || order.status === 'PAID' || order.status === 'FULFILLED') return;

          await tx.order.update({
            where: { id: orderId },
            data: { status: 'PAID', paymentMethodType: resolvedType },
          });
          // Decrement stock for each line item.
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
          await tx.transaction.create({
            data: {
              userId: order.userId,
              type: TxnType.MERCH_PURCHASE,
              cashCents: order.totalCents,
              paymentMethodType: resolvedType,
              description: `Merch order ${order.id}`,
            },
          });
        });
      } else if (kind === 'coin_topup') {
        const coins = parseInt(pi.metadata.coins || '0', 10);
        // Guard against double-credit if the event is delivered twice.
        const already = await prisma.transaction.findFirst({
          where: { description: `Coin top-up (PI ${pi.id})` },
        });
        if (coins > 0 && !already) {
          await creditCoins(
            prisma,
            pi.metadata.userId,
            coins,
            TxnType.COIN_TOPUP,
            `Coin top-up (PI ${pi.id})`,
            resolvedType,
            pi.amount
          );
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;
      if (!subId) break;
      const sub = await stripe.subscriptions.retrieve(subId);
      const userId = sub.metadata.userId;
      const plan = (sub.metadata.plan as MembershipPlan) || MembershipPlan.MONTHLY;
      if (!userId) break;

      const periodEnd = new Date(sub.current_period_end * 1000);
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: userId }, data: { tier: Tier.PREMIUM } });
        await tx.membership.upsert({
          where: { userId },
          create: { userId, plan, endDate: periodEnd, stripeSubscriptionId: subId, renewal: true },
          update: { plan, endDate: periodEnd, stripeSubscriptionId: subId, renewal: true },
        });
        await tx.transaction.create({
          data: {
            userId,
            type: TxnType.SUBSCRIPTION,
            cashCents: invoice.amount_paid,
            description: `Premium ${plan} subscription`,
          },
        });
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.userId;
      if (userId) {
        await prisma.user.update({ where: { id: userId }, data: { tier: Tier.FREE } });
        await prisma.membership.deleteMany({ where: { userId } });
      }
      break;
    }
  }

  res.json({ received: true });
});

export default router;

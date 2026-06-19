import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { stripe } from '../lib/stripe';
import { env } from '../lib/env';

const router = Router();

/**
 * Start a Premium subscription via Stripe Billing. We create a Subscription
 * with an incomplete PaymentIntent, return its clientSecret, and the mobile
 * Payment Sheet collects payment (card/PayPal/Venmo/Cash App). Tier flips to
 * PREMIUM in the webhook on `invoice.paid` / `payment_intent.succeeded`.
 */
const subSchema = z.object({ plan: z.enum(['MONTHLY', 'YEARLY']) });

router.post('/subscribe', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = subSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const c = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    stripeCustomerId = c.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
  }

  const priceId =
    parsed.data.plan === 'MONTHLY' ? env.stripe.pricePremiumMonthly : env.stripe.pricePremiumYearly;

  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      payment_method_types: ['card', 'paypal', 'cashapp'],
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
    metadata: { userId: user.id, plan: parsed.data.plan, kind: 'subscription' },
  });

  const invoice = subscription.latest_invoice as any;
  res.json({
    subscriptionId: subscription.id,
    clientSecret: invoice?.payment_intent?.client_secret,
    customerId: stripeCustomerId,
  });
});

router.post('/cancel', requireAuth, async (req: AuthedRequest, res) => {
  const m = await prisma.membership.findUnique({ where: { userId: req.user!.id } });
  if (m?.stripeSubscriptionId) {
    await stripe.subscriptions.update(m.stripeSubscriptionId, { cancel_at_period_end: true });
    await prisma.membership.update({ where: { userId: req.user!.id }, data: { renewal: false } });
  }
  res.json({ ok: true });
});

export default router;

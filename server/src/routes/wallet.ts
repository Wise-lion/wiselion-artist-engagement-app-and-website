import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { stripe, PAYMENT_METHOD_TYPES } from '../lib/stripe';
import { creditCoins } from '../utils/coins';
import { env } from '../lib/env';
import { TxnType } from '@prisma/client';

const router = Router();

router.get('/balance', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  res.json({ coinBalance: user.coinBalance });
});

/**
 * Web coin top-up via Stripe. Creates a PaymentIntent for `coins * COIN_USD_RATE`.
 * On webhook success the coins are credited. (Mobile uses RevenueCat IAP instead,
 * which routes through the device wallet and natively includes Chime debit cards.)
 */
const topupSchema = z.object({ coins: z.number().int().min(100) });

router.post('/topup', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = topupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const amountCents = Math.round(parsed.data.coins * env.coinUsdRate * 100);

  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const c = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    stripeCustomerId = c.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
  }

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    customer: stripeCustomerId,
    payment_method_types: PAYMENT_METHOD_TYPES,
    metadata: { userId: user.id, kind: 'coin_topup', coins: String(parsed.data.coins) },
  });

  res.json({ clientSecret: intent.client_secret, amount: amountCents, coins: parsed.data.coins });
});

/**
 * RevenueCat webhook → grant coins after a successful in-app purchase.
 * Map RevenueCat product identifiers to coin amounts. Secured by a shared
 * Authorization header configured in the RevenueCat dashboard.
 */
const RC_PRODUCT_COINS: Record<string, number> = {
  coins_500: 500,
  coins_1200: 1200,
  coins_3000: 3000,
};

router.post('/revenuecat-webhook', async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`) {
    return res.status(401).end();
  }
  const event = req.body?.event;
  if (event?.type === 'NON_RENEWING_PURCHASE' || event?.type === 'INITIAL_PURCHASE') {
    const coins = RC_PRODUCT_COINS[event.product_id];
    const user = await prisma.user.findUnique({ where: { firebaseUid: event.app_user_id } });
    if (coins && user) {
      await creditCoins(prisma, user.id, coins, TxnType.COIN_TOPUP, `IAP top-up (${event.product_id})`, 'device_wallet');
    }
  }
  res.json({ ok: true });
});

export default router;

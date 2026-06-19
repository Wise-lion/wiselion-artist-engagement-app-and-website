import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthedRequest } from '../middleware/auth';
import { stripe, PAYMENT_METHOD_TYPES } from '../lib/stripe';

const router = Router();

// Catalogue. Premium-only items are hidden from Free users.
router.get('/products', requireAuth, async (req: AuthedRequest, res) => {
  const isPremium = req.user!.tier === 'PREMIUM';
  const products = await prisma.product.findMany({
    where: { active: true, ...(isPremium ? {} : { premiumOnly: false }) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

router.get('/products/:id', requireAuth, async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// ---- Admin: inventory management ----
const productSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  priceCents: z.number().int().min(0),
  stock: z.number().int().min(0),
  premiumOnly: z.boolean().optional(),
  active: z.boolean().optional(),
});

router.post('/products', requireAdmin, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.status(201).json(await prisma.product.create({ data: parsed.data }));
});

router.patch('/products/:id', requireAdmin, async (req, res) => {
  res.json(await prisma.product.update({ where: { id: req.params.id }, data: req.body }));
});

/**
 * Checkout: create an Order (PENDING) and a Stripe PaymentIntent that offers
 * cards (incl. Chime debit), PayPal, Venmo, Cash App Pay. The mobile app drives
 * the Payment Sheet with the returned clientSecret — the sheet adapts to the
 * device/region and shows eligible methods. Fulfilment happens in the webhook.
 */
const checkoutSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })).min(1),
  shippingAddress: z.record(z.any()).optional(),
});

router.post('/checkout', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const products = await prisma.product.findMany({
    where: { id: { in: parsed.data.items.map((i) => i.productId) } },
  });

  // Compute total from server-side prices (never trust client amounts).
  let totalCents = 0;
  const orderItems = parsed.data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error('Invalid product');
    if (product.stock < item.quantity) throw new Error(`Out of stock: ${product.name}`);
    totalCents += product.priceCents * item.quantity;
    return { productId: product.id, quantity: item.quantity, priceCents: product.priceCents };
  });

  // Premium members get free shipping; Free users pay a flat $5.99.
  const shipping = user.tier === 'PREMIUM' ? 0 : 599;
  totalCents += shipping;

  // Ensure the user has a Stripe customer (so saved methods/Cash App pay persist).
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    stripeCustomerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      totalCents,
      shippingAddress: parsed.data.shippingAddress,
      items: { create: orderItems },
    },
  });

  const intent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'usd',
    customer: stripeCustomerId,
    payment_method_types: PAYMENT_METHOD_TYPES,
    metadata: { orderId: order.id, userId: user.id, kind: 'merch' },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: intent.id },
  });

  res.json({
    orderId: order.id,
    clientSecret: intent.client_secret,
    customerId: stripeCustomerId,
    amount: totalCents,
  });
});

// Order history + tracking.
router.get('/orders', requireAuth, async (req: AuthedRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  });
  res.json(orders);
});

export default router;

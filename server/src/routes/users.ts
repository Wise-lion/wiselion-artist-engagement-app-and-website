import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthedRequest, requireAuth } from '../middleware/auth';

const router = Router();

// Current user's full profile (tier badge, coin balance, membership).
router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { membership: true },
  });
  res.json(user);
});

const updateSchema = z.object({
  username: z.string().min(3).max(24).optional(),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().optional(),
});

router.patch('/me', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: parsed.data });
    res.json(user);
  } catch {
    res.status(409).json({ error: 'Username already taken' });
  }
});

// Transaction history for the wallet screen.
router.get('/me/transactions', requireAuth, async (req: AuthedRequest, res) => {
  const txns = await prisma.transaction.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(txns);
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthedRequest } from '../middleware/auth';
import { spendCoins, InsufficientCoinsError } from '../utils/coins';
import { runLottoDraw } from '../services/lotto';
import { autoPromoteDrop } from '../services/visibility';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const draws = await prisma.lottoDraw.findMany({
    where: { status: { in: ['SCHEDULED'] } },
    orderBy: { drawDate: 'asc' },
  });
  res.json(draws);
});

// ---- Prize Growth Engine: active round + composed displayed pot (XRP) ----
// Declared BEFORE '/:id' so 'status' isn't captured as a draw id.
router.get('/status', requireAuth, async (_req, res) => {
  const draw = await prisma.lottoDraw.findFirst({
    where: { status: 'SCHEDULED' },
    orderBy: { drawDate: 'asc' },
  });
  if (!draw) return res.status(404).json({ error: 'No active lotto round' });

  // Decimal columns come back as Prisma.Decimal — coerce to numbers for JSON.
  const base = Number(draw.initialPotXrp);
  const yieldAmm = Number(draw.ammYieldEarnedXrp);
  const boost = Number(draw.aiBoosterInjectedXrp);

  const tag = draw.isRolledOver
    ? '🔥 JACKPOT ROLLOVER!'
    : boost > 0
    ? '🎁 HOUSE BOOST ADDED!'
    : '💰 STANDARD PRIZE';

  res.json({
    roundId: draw.id,
    status: draw.status,
    drawTime: draw.drawDate,
    displayPot: {
      totalXRP: Number((base + yieldAmm + boost).toFixed(6)),
      baseFromTickets: base,
      yieldFromAMM: yieldAmm,
      boostedByHouse: boost,
    },
    isRollover: draw.isRolledOver,
    tag,
  });
});

router.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const draw = await prisma.lottoDraw.findUnique({ where: { id: req.params.id } });
  if (!draw) return res.status(404).json({ error: 'Not found' });
  const myTickets = await prisma.lottoTicket.count({
    where: { drawId: draw.id, userId: req.user!.id },
  });
  res.json({ ...draw, myTicketCount: myTickets });
});

// ---- Admin: schedule a draw ----
const createSchema = z.object({
  title: z.string(),
  drawDate: z.string().datetime(),
  ticketPrice: z.number().int().min(0),
  prize: z.number().int().min(0),
});

router.post('/', requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const draw = await prisma.lottoDraw.create({
    data: { ...parsed.data, drawDate: new Date(parsed.data.drawDate) },
  });
  // Auto-trigger the War Room @content agent to draft promo posts (non-blocking,
  // best-effort; opt-in via AUTO_PROMOTE). Drafts land in the Visibility queue.
  autoPromoteDrop({ title: draw.title, drawId: draw.id, productName: 'Like-King Tee', price: '$48' });
  res.status(201).json(draw);
});

// Admin: force-run a draw now (also runs automatically via cron at drawDate).
router.post('/:id/run', requireAdmin, async (req, res) => {
  await runLottoDraw(req.params.id);
  res.json({ ok: true });
});

// ---- User: buy a lotto ticket ----
router.post('/:id/buy-ticket', requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const draw = await prisma.lottoDraw.findUnique({ where: { id: req.params.id } });
  if (!draw) return res.status(404).json({ error: 'Not found' });
  if (draw.status !== 'SCHEDULED') return res.status(400).json({ error: 'Draw closed' });

  // Human-readable ticket number, e.g. WL-8F3A21.
  const number = `WL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  try {
    const ticket = await prisma.$transaction(async (tx) => {
      await spendCoins(prisma, userId, draw.ticketPrice, `Lotto ticket — ${draw.title}`, tx);
      return tx.lottoTicket.create({ data: { userId, drawId: draw.id, number } });
    });
    res.status(201).json(ticket);
  } catch (e) {
    if (e instanceof InsufficientCoinsError) return res.status(402).json({ error: 'Insufficient coins' });
    throw e;
  }
});

export default router;

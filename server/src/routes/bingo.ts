import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthedRequest } from '../middleware/auth';
import { generateUniqueCards, drawNextNumber, Grid } from '../utils/bingo';
import { spendCoins, InsufficientCoinsError } from '../utils/coins';
import { broadcastNewNumber } from '../socket';

const router = Router();

// ---- Admin: create a bingo game + generate 1000 unique cards ----
const createSchema = z.object({
  streamId: z.string(),
  title: z.string(),
  ticketPrice: z.number().int().min(0),
  prize: z.number().int().min(0),
  autoDrawSecs: z.number().int().min(5).optional(),
});

router.post('/', requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const game = await prisma.game.create({ data: parsed.data });

  // Generate 1000 unique cards and bulk-insert as templates for this game.
  const cards = generateUniqueCards(1000);
  await prisma.card.createMany({
    data: cards.map((gridJson) => ({ gameId: game.id, gridJson: gridJson as any })),
  });

  res.status(201).json(game);
});

router.get('/:id', requireAuth, async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { id: req.params.id },
    include: { stream: true },
  });
  if (!game) return res.status(404).json({ error: 'Not found' });
  res.json(game);
});

// ---- User: buy a bingo card (deduct coins, assign a random unused card) ----
router.post('/:id/buy-card', requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const game = await prisma.game.findUnique({ where: { id: req.params.id } });
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status === 'FINISHED') return res.status(400).json({ error: 'Game finished' });

  // Pick a card template not already assigned to this user in this game.
  const owned = await prisma.playerCard.findMany({
    where: { gameId: game.id, userId },
    select: { cardId: true },
  });
  const ownedIds = owned.map((o) => o.cardId);
  const card = await prisma.card.findFirst({
    where: { gameId: game.id, id: { notIn: ownedIds } },
  });
  if (!card) return res.status(409).json({ error: 'No cards available' });

  try {
    await prisma.$transaction(async (tx) => {
      await spendCoins(prisma, userId, game.ticketPrice, `Bingo card — ${game.title}`, tx);
      await tx.playerCard.create({ data: { userId, gameId: game.id, cardId: card.id } });
    });
  } catch (e) {
    if (e instanceof InsufficientCoinsError) return res.status(402).json({ error: 'Insufficient coins' });
    throw e;
  }

  res.status(201).json({ playerCard: { cardId: card.id, grid: card.gridJson as Grid } });
});

// User's cards for a game (for rendering + auto-daub).
router.get('/:id/my-cards', requireAuth, async (req: AuthedRequest, res) => {
  const cards = await prisma.playerCard.findMany({
    where: { gameId: req.params.id, userId: req.user!.id },
    include: { card: true },
  });
  res.json(cards.map((pc) => ({ id: pc.id, cardId: pc.cardId, grid: pc.card.gridJson, isWinner: pc.isWinner })));
});

// ---- Admin: start game / draw next number manually ----
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const status = req.body.status as 'SCHEDULED' | 'LIVE' | 'FINISHED';
  const game = await prisma.game.update({ where: { id: req.params.id }, data: { status } });
  res.json(game);
});

router.post('/:id/draw', requireAdmin, async (req, res) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } });
  if (!game) return res.status(404).json({ error: 'Not found' });

  const next = drawNextNumber(game.numbersDrawn);
  if (next == null) return res.status(400).json({ error: 'All numbers drawn' });

  const updated = await prisma.game.update({
    where: { id: game.id },
    data: { numbersDrawn: { push: next } },
  });
  // Broadcast → clients daub cards + trigger the Wiselion avatar to call the number.
  broadcastNewNumber(game.id, next);
  res.json({ number: next, numbersDrawn: updated.numbersDrawn });
});

export default router;

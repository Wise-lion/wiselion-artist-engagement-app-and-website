import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthedRequest } from '../middleware/auth';
import { getKickChannel } from '../services/kick';

const router = Router();

// Native Kick live feed for a channel slug (platform-independent HLS playback).
// Declared before '/:id' so 'kick' isn't read as a media id.
router.get('/kick/:slug', requireAuth, async (req, res) => {
  res.json(await getKickChannel(req.params.slug));
});

// List media, optionally filtered by kind (SONG | AUDIO_MESSAGE | VIDEO).
// Premium-only items are hidden from Free users.
router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const kind = req.query.kind as string | undefined;
  const isPremium = req.user!.tier === 'PREMIUM';
  const items = await prisma.mediaItem.findMany({
    where: {
      active: true,
      ...(kind ? { kind: kind as any } : {}),
      ...(isPremium ? {} : { premiumOnly: false }),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  res.json(items);
});

router.get('/:id', requireAuth, async (req, res) => {
  const item = await prisma.mediaItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// ---- Admin: manage the media library ----
const schema = z.object({
  kind: z.enum(['SONG', 'AUDIO_MESSAGE', 'VIDEO']),
  title: z.string(),
  artist: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  artworkUrl: z.string().url().optional(),
  durationSec: z.number().int().optional(),
  premiumOnly: z.boolean().optional(),
  platformLinks: z.record(z.string()).optional(),
  ownedBackupUrl: z.string().url().optional(),       // self-hosted fallback
  platformStatus: z.record(z.string()).optional(),   // { youtube: 'removed' }
  kickChannel: z.string().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

router.post('/', requireAdmin, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.status(201).json(await prisma.mediaItem.create({ data: parsed.data as any }));
});

router.patch('/:id', requireAdmin, async (req, res) => {
  res.json(await prisma.mediaItem.update({ where: { id: req.params.id }, data: req.body }));
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import Mux from '@mux/mux-node';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthedRequest } from '../middleware/auth';
import { env } from '../lib/env';

const router = Router();

const mux =
  env.mux.tokenId && env.mux.tokenSecret
    ? new Mux({ tokenId: env.mux.tokenId, tokenSecret: env.mux.tokenSecret })
    : null;

// List streams (upcoming + live). Premium-only streams are flagged so the
// client can gate playback for Free users.
router.get('/', requireAuth, async (_req, res) => {
  const streams = await prisma.stream.findMany({
    where: { status: { in: ['UPCOMING', 'LIVE'] } },
    orderBy: { scheduledAt: 'asc' },
    include: { games: true },
  });
  res.json(streams);
});

router.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const stream = await prisma.stream.findUnique({
    where: { id: req.params.id },
    include: { games: true },
  });
  if (!stream) return res.status(404).json({ error: 'Not found' });

  // Gate premium-only streams.
  if (stream.premiumOnly && req.user!.tier !== 'PREMIUM') {
    return res.status(403).json({ error: 'Premium membership required', premiumOnly: true });
  }
  res.json(stream);
});

// ---- Admin: schedule a stream (creates a Mux live stream) ----
const createSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
  premiumOnly: z.boolean().optional(),
  kickChannel: z.string().optional(), // native HLS fallback / alternative
});

router.post('/', requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let muxStreamId: string | undefined;
  let muxPlaybackId: string | undefined;
  if (mux) {
    const live = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: { playback_policy: ['public'] },
    });
    muxStreamId = live.id;
    muxPlaybackId = live.playback_ids?.[0]?.id;
  }

  const stream = await prisma.stream.create({
    data: { ...parsed.data, scheduledAt: new Date(parsed.data.scheduledAt), muxStreamId, muxPlaybackId },
  });
  res.status(201).json(stream);
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  const status = req.body.status as 'UPCOMING' | 'LIVE' | 'ENDED';
  const stream = await prisma.stream.update({ where: { id: req.params.id }, data: { status } });
  res.json(stream);
});

export default router;

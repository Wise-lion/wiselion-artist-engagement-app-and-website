// Public, read-only, no-auth endpoints for the marketing website. Expose ONLY
// safe fields — no user data, no order/payment internals, no premium-gated
// content beyond what's meant to be public. The website is a marketing surface:
// it reads from here, it never writes (checkout/gameplay stays in the app).
import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Active, non-premium products for the public merch grid.
router.get('/products', async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { active: true, premiumOnly: false },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, description: true, imageUrl: true, priceCents: true, stock: true },
  });
  res.json(products);
});

// Public songs/videos (excludes premium-only + audio messages meant for members).
router.get('/media', async (req, res) => {
  const kind = req.query.kind as string | undefined;
  const media = await prisma.mediaItem.findMany({
    where: { active: true, premiumOnly: false, ...(kind ? { kind: kind as any } : {}) },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, kind: true, title: true, artist: true, description: true,
      url: true, artworkUrl: true, durationSec: true, platformLinks: true,
    },
  });
  res.json(media);
});

// Upcoming/live streams — public schedule info only (no premium gating logic
// needed here since we're just listing dates/titles, not granting playback).
router.get('/streams', async (_req, res) => {
  const streams = await prisma.stream.findMany({
    where: { status: { in: ['UPCOMING', 'LIVE'] } },
    orderBy: { scheduledAt: 'asc' },
    select: { id: true, title: true, description: true, status: true, scheduledAt: true, premiumOnly: true },
  });
  res.json(streams);
});

export default router;

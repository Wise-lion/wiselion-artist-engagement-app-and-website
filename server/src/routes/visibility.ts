import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { draftDropPromo } from '../services/visibility';
import { sendToWarroom, isWarRoomOnline, WarRoomOfflineError } from '../services/warroom';
import { sendMail } from '../services/mailer';
import { publishToInstagram, instagramConfigured } from '../services/instagram';

const router = Router();

// War Room connectivity (so the admin panel can show online/offline).
router.get('/warroom/status', requireAdmin, async (_req, res) => {
  res.json({ online: await isWarRoomOnline() });
});

// Generate a promo draft set for a scheduled lotto draw / drop.
// Approve-first: this only DRAFTS — nothing is posted.
router.post('/draft/drop/:drawId', requireAdmin, async (req, res) => {
  const draw = await prisma.lottoDraw.findUnique({ where: { id: req.params.drawId } });
  if (!draw) return res.status(404).json({ error: 'Draw not found' });
  try {
    const drafts = await draftDropPromo({
      title: draw.title,
      drawId: draw.id,
      productName: 'Like-King Tee',
      price: '$48',
    });
    res.status(201).json({ count: drafts.length, drafts });
  } catch (e) {
    if (e instanceof WarRoomOfflineError) {
      return res.status(503).json({ error: 'War Room is offline — start the agent server (port 7860) and retry.' });
    }
    // Never rethrow from an async Express 4 handler — it becomes an unhandled
    // rejection and crashes the process. Respond 500 instead.
    console.error('Draft generation failed:', e);
    return res.status(500).json({ error: (e as Error).message || 'Draft generation failed' });
  }
});

// List drafts (optionally by status) for the review queue.
router.get('/drafts', requireAdmin, async (req, res) => {
  const status = req.query.status as any;
  const drafts = await prisma.promoDraft.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(drafts);
});

// Human gate: approve or reject a draft. Approving optionally hands it to @comms.
router.patch('/drafts/:id', requireAdmin, async (req, res) => {
  const action = req.body.action as 'approve' | 'reject';
  const draft = await prisma.promoDraft.findUnique({ where: { id: req.params.id } });
  if (!draft) return res.status(404).json({ error: 'Not found' });

  if (action === 'reject') {
    const updated = await prisma.promoDraft.update({ where: { id: draft.id }, data: { status: 'REJECTED' } });
    return res.json(updated);
  }

  // Approve → mark APPROVED, then DELIVER.
  const updated = await prisma.promoDraft.update({ where: { id: draft.id }, data: { status: 'APPROVED' } });

  // Instagram: if the Graph API is configured, post it for real.
  if (draft.channel === 'instagram' && instagramConfigured()) {
    try {
      const assetUrl = (draft.meta as any)?.asset as string | undefined;
      const mediaId = await publishToInstagram(draft.body, assetUrl);
      const meta = { ...((draft.meta as any) || {}), publishedRef: mediaId };
      const published = await prisma.promoDraft.update({
        where: { id: draft.id },
        data: { status: 'PUBLISHED', meta },
      });
      return res.json(published);
    } catch (e) {
      console.error('Instagram publish failed:', e);
      // Fall through to email/hold so the draft isn't lost.
    }
  }

  // Email channel = the campaign itself; other channels = ready-to-paste copy.
  const subject =
    draft.channel === 'email'
      ? draft.subject || 'Wiselion — new drop'
      : `[Wiselion] Approved ${draft.channel} post — ready to paste`;
  const delivered = await sendMail(subject, draft.body);

  if (delivered) {
    const published = await prisma.promoDraft.update({ where: { id: draft.id }, data: { status: 'PUBLISHED' } });
    return res.json(published);
  }

  // No mail credential (or send failed) → best-effort hand-off to @comms, and
  // stay APPROVED so it can be retried once a channel is configured.
  try {
    await sendToWarroom(
      'comms',
      `Publish this approved ${draft.channel} post${draft.subject ? ` (subject: ${draft.subject})` : ''}: ${draft.body}`
    );
  } catch {
    /* War Room offline — fine, draft remains APPROVED */
  }
  res.json(updated);
});

export default router;

// =============================================================================
// visibility.ts — the "generate visibility" automation.
//
// FLOW (approve-first, safe): a business event (a scheduled drop) → ask the War
// Room @content agent (the "Paperclip"/Royal Bard role) to draft platform-specific
// promo posts that repurpose the Drop Reel + tee designs and lean on the lion-
// conservation hook → save each as a PromoDraft (status DRAFT) for a human to
// approve in the admin panel → @comms publishes only after approval.
//
// Nothing is posted automatically. War Room generates; humans approve.
// =============================================================================
import { prisma } from '../lib/prisma';
import { requestDraft } from './warroom';

const CHANNELS = ['instagram', 'tiktok', 'x', 'email'] as const;
type Channel = (typeof CHANNELS)[number];

// Per-channel brief so @content writes natively for each platform.
const CHANNEL_BRIEF: Record<Channel, string> = {
  instagram: 'Instagram caption (punchy, 3-5 short lines, 4-6 hashtags, 1 CTA).',
  tiktok: 'TikTok caption (very short, trend-aware, 3-4 hashtags).',
  x: 'X/Twitter post (under 280 chars, 1-2 hashtags, link CTA).',
  email: 'Marketing email — first line is a subject prefixed "SUBJECT:", then a 120-180 word body.',
};

interface DropContext {
  title: string;
  drawId?: string;
  productName?: string;
  price?: string;
}

/**
 * Draft a full promo set for a drop across all channels and persist them as
 * PromoDrafts. Returns the created drafts. Throws WarRoomOfflineError if the
 * agent isn't reachable (caller surfaces a friendly message).
 */
export async function draftDropPromo(ctx: DropContext, trigger = 'drop.scheduled') {
  const created = [];

  for (const channel of CHANNELS) {
    const prompt = [
      `Write a ${CHANNEL_BRIEF[channel]}`,
      `Brand: WISELION — "Like a King" / Tribe of Kings. Cyberpunk-regal, gold + neon. No em dashes.`,
      `Promoting: ${ctx.title}${ctx.productName ? ` featuring the "${ctx.productName}"` : ''}${ctx.price ? ` (${ctx.price})` : ''}.`,
      `Hook into the new cinematic Drop Reel and the 8 tee designs.`,
      `Mention that purchases support lion conservation (Big Life Foundation).`,
      `Return ONLY the post copy, no preamble.`,
    ].join(' ');

    // Ask the @content agent (Royal Bard) for the draft.
    const text = await requestDraft('content', prompt);

    // For email, split the SUBJECT: line out.
    let subject: string | undefined;
    let body = text;
    if (channel === 'email') {
      const m = text.match(/SUBJECT:\s*(.+)/i);
      if (m) {
        subject = m[1].trim();
        body = text.replace(/SUBJECT:\s*.+/i, '').trim();
      }
    }

    const draft = await prisma.promoDraft.create({
      data: {
        trigger,
        channel,
        subject,
        body,
        meta: { drawId: ctx.drawId, asset: 'drop-reel' } as any,
      },
    });
    created.push(draft);
  }

  return created;
}

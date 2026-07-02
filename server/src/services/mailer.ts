// mailer.ts — minimal email delivery for approved marketing drafts.
// Uses Resend's REST API via plain fetch (no dependency). Credential-gated:
// if RESEND_API_KEY isn't set, sendMail() returns false and callers fall back
// (approve still works, just doesn't deliver). Free tier: resend.com → API key.
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
// Without a verified domain, Resend requires this sender on the free tier.
const MAIL_FROM = process.env.MAIL_FROM || 'Wiselion War Room <onboarding@resend.dev>';
const MAIL_TO = process.env.MAIL_TO || 'wlikeking@gmail.com';

export async function sendMail(subject: string, text: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: MAIL_FROM, to: [MAIL_TO], subject, text }),
    });
    if (!res.ok) {
      console.error('Resend send failed:', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (e) {
    console.error('Resend send error:', e);
    return false;
  }
}

// instagram.ts — publish an approved draft to Instagram via the Meta Graph API.
// Credential-gated: without IG_USER_ID + IG_ACCESS_TOKEN this is a no-op that
// returns false, so the approve flow degrades gracefully (email/hold instead).
//
// Instagram content publishing is TWO steps for a single image post:
//   1) POST /{ig-user-id}/media        { image_url, caption }  -> creation_id
//   2) POST /{ig-user-id}/media_publish { creation_id }        -> published id
// Requirements (set up on Meta's side, see WARROOM_SETUP.md):
//   - Instagram BUSINESS/CREATOR account linked to a Facebook Page
//   - A Meta app with instagram_content_publish permission (App Review)
//   - A long-lived Page access token
// The image must be a PUBLIC https URL (we default to the live drop-reel art).
const GRAPH = 'https://graph.facebook.com/v21.0';
const IG_USER_ID = process.env.IG_USER_ID || '';
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || '';
// Public image used when a draft has no image of its own (IG requires media).
const IG_DEFAULT_IMAGE_URL =
  process.env.IG_DEFAULT_IMAGE_URL ||
  'https://wiselion.shop/drop-reel/anime_tshirt_design.webp';

export function instagramConfigured(): boolean {
  return Boolean(IG_USER_ID && IG_ACCESS_TOKEN);
}

async function graphPost(path: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN });
  const res = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    throw new Error(`Graph API ${path} failed: ${msg}`);
  }
  return data;
}

// Publish a caption (+optional image) to Instagram. Returns the published media
// id on success. Throws on API error; returns null if not configured.
export async function publishToInstagram(
  caption: string,
  imageUrl?: string
): Promise<string | null> {
  if (!instagramConfigured()) return null;
  const image = imageUrl || IG_DEFAULT_IMAGE_URL;
  // 1) Create the media container.
  const container = await graphPost(`${IG_USER_ID}/media`, { image_url: image, caption });
  const creationId = container.id as string;
  if (!creationId) throw new Error('No creation_id returned from media step');
  // 2) Publish it.
  const published = await graphPost(`${IG_USER_ID}/media_publish`, { creation_id: creationId });
  return (published.id as string) || null;
}

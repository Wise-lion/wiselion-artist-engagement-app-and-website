// =============================================================================
// kick.ts — connect to Kick.com to fetch a channel's live status + HLS playback.
//
// WHY: gives the app a platform-INDEPENDENT live feed. If a creator is removed
// from YouTube/IG/TikTok, Kick (or any HLS source) keeps the live experience in
// our own app. We return a normalized shape the mobile player can consume.
//
// TWO PATHS:
//   1. Official Kick API (preferred): set KICK_CLIENT_ID + KICK_CLIENT_SECRET.
//      We mint an app access token (client_credentials) and call the public v1
//      channels endpoint.
//   2. Fallback: the public channel JSON endpoint. NOTE: this is fronted by
//      Cloudflare and may 403 from datacenter IPs — the official API is the
//      reliable production path.
// =============================================================================

export interface KickChannel {
  slug: string;
  isLive: boolean;
  title?: string;
  playbackUrl?: string; // HLS .m3u8 — playable by expo-av <Video>
  thumbnailUrl?: string;
  viewerCount?: number;
  followers?: number;
  source: 'official' | 'public' | 'unavailable';
}

const TOKEN_URL = 'https://id.kick.com/oauth/token';
const OFFICIAL_BASE = 'https://api.kick.com/public/v1';
const PUBLIC_BASE = 'https://kick.com/api/v2/channels';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string | null> {
  const id = process.env.KICK_CLIENT_ID;
  const secret = process.env.KICK_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.token;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: id,
    client_secret: secret,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  cachedToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return cachedToken.token;
}

async function viaOfficial(slug: string): Promise<KickChannel | null> {
  const token = await getAppToken();
  if (!token) return null;
  const res = await fetch(`${OFFICIAL_BASE}/channels?slug=${encodeURIComponent(slug)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  const ch = Array.isArray(json.data) ? json.data[0] : json.data;
  if (!ch) return null;
  const stream = ch.stream || {};
  return {
    slug,
    isLive: Boolean(stream.is_live),
    title: ch.stream_title || stream.stream_title,
    playbackUrl: ch.playback_url || stream.playback_url,
    thumbnailUrl: stream.thumbnail,
    viewerCount: stream.viewer_count,
    followers: ch.followers_count ?? ch.follower_count,
    source: 'official',
  };
}

async function viaPublic(slug: string): Promise<KickChannel | null> {
  // Browser-like UA to reduce (not eliminate) Cloudflare blocks.
  const res = await fetch(`${PUBLIC_BASE}/${encodeURIComponent(slug)}`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      Accept: 'application/json',
    },
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  const ls = json.livestream;
  return {
    slug,
    isLive: Boolean(ls?.is_live),
    title: ls?.session_title,
    playbackUrl: json.playback_url,
    thumbnailUrl: ls?.thumbnail?.url,
    viewerCount: ls?.viewer_count,
    followers: json.followers_count,
    source: 'public',
  };
}

/** Fetch normalized Kick channel info; official API first, public fallback. */
export async function getKickChannel(slug: string): Promise<KickChannel> {
  try {
    const official = await viaOfficial(slug);
    if (official) return official;
  } catch {
    /* fall through */
  }
  try {
    const pub = await viaPublic(slug);
    if (pub) return pub;
  } catch {
    /* fall through */
  }
  return { slug, isLive: false, source: 'unavailable' };
}

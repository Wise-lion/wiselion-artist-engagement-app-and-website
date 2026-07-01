// liveData — pulls real data from the Wiselion server's public API (read-only,
// no auth) and falls back to the static placeholder data in data.ts when the
// API is unreachable, empty, or VITE_API_URL isn't set. The website NEVER
// writes to the app's backend — gameplay/checkout/auth all stay in the app.
//
// Once the server is deployed, set VITE_API_URL in website/.env to its public
// URL (e.g. https://api.wiselion.app/api) and these calls switch on
// automatically. Until then, every function below returns the fallback.

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  if (!API_URL) return fallback;
  try {
    const res = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return fallback;
    const data = await res.json();
    return Array.isArray(data) && data.length === 0 ? fallback : (data as T);
  } catch {
    return fallback; // API down / CORS / timeout — never break the site
  }
}

export interface LiveProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  priceCents: number;
  stock: number;
}

export interface LiveMedia {
  id: string;
  kind: string;
  title: string;
  artist?: string;
  description?: string;
  url?: string;
  artworkUrl?: string;
  durationSec?: number;
  platformLinks?: Record<string, string>;
}

export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  status: 'UPCOMING' | 'LIVE' | 'ENDED';
  scheduledAt: string;
  premiumOnly: boolean;
}

export const getLiveProducts = (fallback: LiveProduct[]) =>
  safeFetch<LiveProduct[]>('/public/products', fallback);

export const getLiveSongs = (fallback: LiveMedia[]) =>
  safeFetch<LiveMedia[]>('/public/media?kind=SONG', fallback);

export const getLiveStreams = (fallback: LiveStream[]) =>
  safeFetch<LiveStream[]>('/public/streams', fallback);

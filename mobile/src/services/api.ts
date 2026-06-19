// Thin REST client that injects the Firebase ID token on every request.
import { config, DEV_MODE } from '../config';
import { getIdToken } from './firebase';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // DEV_MODE: skip Firebase token, send the dev-uid header the server expects.
  const token = DEV_MODE ? null : await getIdToken();
  const res = await fetch(`${config.apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(DEV_MODE ? { 'x-dev-uid': 'dev-uid' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || res.statusText, body);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
  }
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: any) => request<T>(p, { method: 'POST', body: JSON.stringify(body || {}) }),
  patch: <T>(p: string, body?: any) => request<T>(p, { method: 'PATCH', body: JSON.stringify(body || {}) }),
};

// Typed endpoint helpers used across screens.
export const Endpoints = {
  me: () => api.get<any>('/users/me'),
  updateMe: (data: any) => api.patch<any>('/users/me', data),
  transactions: () => api.get<any[]>('/users/me/transactions'),

  streams: () => api.get<any[]>('/streams'),
  stream: (id: string) => api.get<any>(`/streams/${id}`),

  game: (id: string) => api.get<any>(`/bingo/${id}`),
  buyCard: (id: string) => api.post<any>(`/bingo/${id}/buy-card`),
  myCards: (id: string) => api.get<any[]>(`/bingo/${id}/my-cards`),

  lottoDraws: () => api.get<any[]>('/lotto'),
  lottoDraw: (id: string) => api.get<any>(`/lotto/${id}`),
  buyTicket: (id: string) => api.post<any>(`/lotto/${id}/buy-ticket`),

  // Prize Growth Engine: active round with the composed displayed pot (XRP).
  lottoStatus: () =>
    api.get<{
      roundId: string;
      status: string;
      drawTime: string;
      displayPot: {
        totalXRP: number;
        baseFromTickets: number;
        yieldFromAMM: number;
        boostedByHouse: number;
      };
      isRollover: boolean;
      tag: string;
    }>('/lotto/status'),

  products: () => api.get<any[]>('/merch/products'),
  product: (id: string) => api.get<any>(`/merch/products/${id}`),
  checkout: (items: { productId: string; quantity: number }[], shippingAddress?: any) =>
    api.post<{ orderId: string; clientSecret: string; customerId: string; amount: number }>(
      '/merch/checkout',
      { items, shippingAddress }
    ),
  orders: () => api.get<any[]>('/merch/orders'),

  balance: () => api.get<{ coinBalance: number }>('/wallet/balance'),
  topup: (coins: number) => api.post<{ clientSecret: string; amount: number }>('/wallet/topup', { coins }),

  subscribe: (plan: 'MONTHLY' | 'YEARLY') =>
    api.post<{ clientSecret: string; customerId: string }>('/subscriptions/subscribe', { plan }),

  // Media library: songs, audio messages, videos.
  media: (kind?: 'SONG' | 'AUDIO_MESSAGE' | 'VIDEO') =>
    api.get<any[]>(`/media${kind ? `?kind=${kind}` : ''}`),

  // Native Kick live feed (platform-independent HLS).
  kick: (slug: string) =>
    api.get<{ slug: string; isLive: boolean; title?: string; playbackUrl?: string; source: string }>(
      `/media/kick/${slug}`
    ),
};

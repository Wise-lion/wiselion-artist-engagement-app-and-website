import { getIdToken } from './firebase';
import { demoRequest } from './demoData';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Demo mode: serve everything from the in-memory mock backend.
  if (DEMO_MODE) {
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    return demoRequest<T>(options.method || 'GET', path, body);
  }

  const token = await getIdToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: any) => request<T>(p, { method: 'POST', body: JSON.stringify(body || {}) }),
  patch: <T>(p: string, body?: any) => request<T>(p, { method: 'PATCH', body: JSON.stringify(body || {}) }),
};

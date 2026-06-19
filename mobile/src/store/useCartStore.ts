import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  totalCents: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  add: (item, qty = 1) =>
    set((s) => {
      const existing = s.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i
          ),
        };
      }
      return { items: [...s.items, { ...item, quantity: qty }] };
    }),
  remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
  setQty: (productId, qty) =>
    set((s) => ({
      items: s.items.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i)),
    })),
  clear: () => set({ items: [] }),
  totalCents: () => get().items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
}));

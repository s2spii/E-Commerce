'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** Minimal product shape persisted in the wishlist (subset of ProductSummary). */
export interface SavedProduct {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  brand: string | null;
  fromPrice: number | null;
  currency: string;
}

interface WishlistValue {
  items: SavedProduct[];
  count: number;
  ready: boolean;
  has: (id: string) => boolean;
  /** Toggles an item; returns true if it was added, false if removed. */
  toggle: (item: SavedProduct) => boolean;
  remove: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = 'luma-wishlist';
const WishlistContext = createContext<WishlistValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SavedProduct[]>([]);
  const [ready, setReady] = useState(false);

  // Load once on mount (avoids SSR/hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as SavedProduct[]);
    } catch {
      /* corrupt or unavailable — start empty */
    }
    setReady(true);
  }, []);

  // Persist on change (after the initial load).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota / unavailable */
    }
  }, [items, ready]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((item: SavedProduct) => {
    let added = false;
    setItems((list) => {
      if (list.some((i) => i.id === item.id)) {
        return list.filter((i) => i.id !== item.id);
      }
      added = true;
      return [item, ...list];
    });
    return added;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((list) => list.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<WishlistValue>(
    () => ({ items, count: items.length, ready, has, toggle, remove, clear }),
    [items, ready, has, toggle, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SavedProduct } from '@/context/WishlistContext';

const KEY = 'luma-recently-viewed';
const MAX = 8;

function read(): SavedProduct[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedProduct[]) : [];
  } catch {
    return [];
  }
}

/**
 * Tracks the most recently viewed products in localStorage. `track` is stable
 * and safe to call from an effect; `items` reflects the list read on mount.
 */
export function useRecentlyViewed() {
  const [items, setItems] = useState<SavedProduct[]>([]);

  useEffect(() => {
    setItems(read());
  }, []);

  const track = useCallback((item: SavedProduct) => {
    try {
      const next = [item, ...read().filter((i) => i.id !== item.id)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  return { items, track };
}

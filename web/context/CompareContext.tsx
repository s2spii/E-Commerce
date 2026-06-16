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
import type { SavedProduct } from '@/context/WishlistContext';

const STORAGE_KEY = 'luma-compare';
export const COMPARE_MAX = 4;

type ToggleResult = 'added' | 'removed' | 'full';

interface CompareValue {
  items: SavedProduct[];
  count: number;
  ready: boolean;
  has: (id: string) => boolean;
  /** Adds/removes an item; returns 'full' when the cap is reached. */
  toggle: (item: SavedProduct) => ToggleResult;
  remove: (id: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareValue | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SavedProduct[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as SavedProduct[]);
    } catch {
      /* start empty */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((item: SavedProduct): ToggleResult => {
    let result: ToggleResult = 'added';
    setItems((list) => {
      if (list.some((i) => i.id === item.id)) {
        result = 'removed';
        return list.filter((i) => i.id !== item.id);
      }
      if (list.length >= COMPARE_MAX) {
        result = 'full';
        return list;
      }
      return [...list, item];
    });
    return result;
  }, []);

  const remove = useCallback((id: string) => setItems((list) => list.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CompareValue>(
    () => ({ items, count: items.length, ready, has, toggle, remove, clear }),
    [items, ready, has, toggle, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider');
  return ctx;
}

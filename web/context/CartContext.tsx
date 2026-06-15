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
import { api } from '@/lib/api';
import type { CartSummary, CustomerType } from '@/lib/types';

/** Tax/customer context used to price the cart (passed as query params). */
export interface CartPricingContext {
  country?: string;
  customerType?: CustomerType;
  vatNumber?: string;
}

interface CartContextValue {
  cart: CartSummary | null;
  loading: boolean;
  /** Total number of units across all line items. */
  count: number;
  refresh: (ctx?: CartPricingContext) => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function paramsFromContext(ctx?: CartPricingContext) {
  if (!ctx) return undefined;
  return {
    country: ctx.country,
    customerType: ctx.customerType,
    vatNumber: ctx.vatNumber,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const apply = useCallback((summary: CartSummary | null) => {
    setCart(summary);
  }, []);

  const refresh = useCallback(
    async (ctx?: CartPricingContext) => {
      try {
        const summary = await api<CartSummary>('/cart', { params: paramsFromContext(ctx) });
        apply(summary);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Cart load failed', err);
      }
    },
    [apply],
  );

  // Load the cart once on mount (creates an anonymous cart cookie if needed).
  useEffect(() => {
    let active = true;
    (async () => {
      await refresh();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      const summary = await api<CartSummary>('/cart/items', {
        method: 'POST',
        body: { variantId, quantity },
      });
      apply(summary);
    },
    [apply],
  );

  const updateItem = useCallback(
    async (variantId: string, quantity: number) => {
      const summary = await api<CartSummary>(`/cart/items/${variantId}`, {
        method: 'PATCH',
        body: { quantity },
      });
      apply(summary);
    },
    [apply],
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      const summary = await api<CartSummary>(`/cart/items/${variantId}`, {
        method: 'DELETE',
      });
      apply(summary);
    },
    [apply],
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      const summary = await api<CartSummary>('/cart/coupon', {
        method: 'POST',
        body: { code },
      });
      apply(summary);
    },
    [apply],
  );

  const removeCoupon = useCallback(async () => {
    const summary = await api<CartSummary | null>('/cart/coupon', { method: 'DELETE' });
    apply(summary ?? null);
  }, [apply]);

  const count = useMemo(
    () => (cart?.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      count,
      refresh,
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      removeCoupon,
    }),
    [cart, loading, count, refresh, addItem, updateItem, removeItem, applyCoupon, removeCoupon],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

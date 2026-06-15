'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface CartUIValue {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartUIContext = createContext<CartUIValue | undefined>(undefined);

/**
 * Lightweight global UI state for the slide-in cart drawer, kept separate from
 * the data-focused CartContext. Lets the header button and the product page
 * open the same drawer instance mounted in the root layout.
 */
export function CartUIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartUIValue>(
    () => ({ isOpen, openCart, closeCart }),
    [isOpen, openCart, closeCart],
  );

  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>;
}

export function useCartUI(): CartUIValue {
  const ctx = useContext(CartUIContext);
  if (!ctx) throw new Error('useCartUI must be used within a CartUIProvider');
  return ctx;
}

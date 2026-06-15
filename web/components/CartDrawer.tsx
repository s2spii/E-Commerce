'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useCartUI } from '@/context/CartUIContext';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Button } from '@/components/Button';

/** Free-shipping threshold in cents (mirrors the announcement bar copy). */
const FREE_SHIPPING_THRESHOLD = 20000;

/**
 * Slide-in mini-cart. Mounted once in the root layout; opened by the header
 * bag button and automatically when an item is added from the product page.
 */
export function CartDrawer() {
  const { cart, loading, count, updateItem, removeItem } = useCart();
  const { isOpen, closeCart } = useCartUI();
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const pathname = usePathname();
  const firstRender = useRef(true);

  // Close on Escape + lock background scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  // Close whenever the route changes (e.g. a CTA or product link was followed).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    closeCart();
  }, [pathname, closeCart]);

  const items = cart?.items ?? [];
  const currency = cart?.currency ?? 'EUR';
  const grandTotal = cart?.totals.grandTotal ?? 0;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - grandTotal);
  const progress = Math.min(100, (grandTotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleQuantity = async (variantId: string, quantity: number) => {
    setBusyItem(variantId);
    try {
      await updateItem(variantId, quantity);
    } catch {
      /* surfaced on next cart load */
    } finally {
      setBusyItem(null);
    }
  };

  const handleRemove = async (variantId: string) => {
    setBusyItem(variantId);
    try {
      await removeItem(variantId);
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[60] ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-noir/50 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Votre panier"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-lift transition-transform duration-500 ease-spring ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif text-2xl">Votre panier</h2>
            <span className="text-sm tabular-nums text-muted">
              ({count} article{count > 1 ? 's' : ''})
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Fermer le panier"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-all duration-300 hover:rotate-90 hover:text-gold"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Free-shipping progress */}
        {items.length > 0 ? (
          <div className="border-b border-line px-6 py-4">
            {remaining > 0 ? (
              <p className="text-xs text-muted">
                Plus que{' '}
                <span className="font-medium text-ink">{formatPrice(remaining, currency)}</span> pour
                la <span className="text-gold">livraison offerte</span>
              </p>
            ) : (
              <p className="text-xs text-gold">✓ Vous bénéficiez de la livraison offerte</p>
            )}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gold-gradient transition-[width] duration-700 ease-spring"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6">
          {loading ? (
            <p className="py-16 text-center text-sm text-muted">Chargement…</p>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <span aria-hidden className="mb-5 text-4xl text-gold">
                ✦
              </span>
              <p className="font-serif text-xl">Votre panier est vide</p>
              <p className="mt-2 text-sm text-muted">Découvrez notre sélection de pièces.</p>
              <Button href="/boutique" variant="secondary" className="mt-7">
                Explorer la boutique
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item, i) => (
                <li
                  key={item.id}
                  style={{ transitionDelay: isOpen ? `${120 + i * 60}ms` : '0ms' }}
                  className={`flex gap-4 py-5 transition-all duration-500 ease-spring ${
                    isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`}
                >
                  <Link
                    href={`/produit/${item.slug}`}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-sand"
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    ) : null}
                  </Link>

                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <Link
                        href={`/produit/${item.slug}`}
                        className="font-serif text-base leading-snug hover:text-gold"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.variantId)}
                        disabled={busyItem === item.variantId}
                        aria-label="Retirer l'article"
                        className="shrink-0 text-muted transition-colors hover:text-gold disabled:opacity-40"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    {item.variantName ? (
                      <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted">
                        {item.variantName}
                      </p>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(q) => handleQuantity(item.variantId, q)}
                        disabled={busyItem === item.variantId}
                      />
                      <span className="text-sm font-medium tabular-nums text-ink">
                        {formatPrice(item.lineTotalInclTax, currency)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 ? (
          <div className="space-y-4 border-t border-line bg-surface/80 px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Total TTC</span>
              <span className="font-serif text-2xl">{formatPrice(grandTotal, currency)}</span>
            </div>
            <Button href="/commande" fullWidth size="lg">
              Passer la commande
            </Button>
            <Link
              href="/panier"
              className="block text-center text-xs uppercase tracking-widest text-muted transition-colors hover:text-gold"
            >
              Voir le panier détaillé
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

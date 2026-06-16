'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ApiError, formatPrice } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/Button';
import { QuantityStepper } from '@/components/QuantityStepper';
import { PageSpinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { OrderTotals } from '@/components/OrderTotals';

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  if (loading) return <PageSpinner />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-luxe py-20">
        <h1 className="mb-10 text-center text-5xl sm:text-6xl">Votre panier</h1>
        <EmptyState
          title="Votre panier est vide"
          description="Découvrez notre sélection de pièces d'exception."
        >
          <Button href="/boutique" variant="secondary">
            Explorer la boutique
          </Button>
        </EmptyState>
      </div>
    );
  }

  const handleQuantity = async (variantId: string, quantity: number) => {
    setBusyItem(variantId);
    try {
      await updateItem(variantId, quantity);
    } catch {
      /* error surfaced via cart state on next load */
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

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      await applyCoupon(couponInput.trim());
      setCouponInput('');
    } catch (err) {
      setCouponError(err instanceof ApiError ? err.message : 'Code promo invalide.');
    } finally {
      setCouponBusy(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponBusy(true);
    setCouponError(null);
    try {
      await removeCoupon();
    } finally {
      setCouponBusy(false);
    }
  };

  return (
    <div className="container-luxe py-14">
      <header className="mb-10">
        <span className="eyebrow">Votre sélection</span>
        <h1 className="mt-3 text-5xl sm:text-6xl">Votre panier</h1>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        {/* Line items */}
        <div className="divide-y divide-line">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-5 rounded-2xl py-6 transition-colors hover:bg-surface/60"
            >
              <Link
                href={`/produit/${item.slug}`}
                className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-sand shadow-sm"
              >
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                ) : null}
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link
                      href={`/produit/${item.slug}`}
                      className="font-serif text-lg leading-snug hover:text-gold"
                    >
                      {item.name}
                    </Link>
                    {item.variantName ? (
                      <p className="mt-1 text-xs uppercase tracking-widest text-muted">
                        {item.variantName}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted">{formatPrice(item.unitPrice, cart.currency)} l&apos;unité</p>
                  </div>
                  <p className="text-sm text-ink">{formatPrice(item.lineTotalInclTax, cart.currency)}</p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(q) => handleQuantity(item.variantId, q)}
                    disabled={busyItem === item.variantId}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(item.variantId)}
                    disabled={busyItem === item.variantId}
                    className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-gold disabled:opacity-40"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-6 rounded-3xl border border-line bg-surface p-7 shadow-soft lg:sticky lg:top-28">
          <h2 className="text-2xl">Récapitulatif</h2>

          {/* Coupon */}
          <div>
            <span className="eyebrow mb-2 block">Code promo</span>
            {cart.couponCode ? (
              <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/5 px-4 py-2.5 text-sm">
                <span className="uppercase tracking-wide text-gold">{cart.couponCode}</span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  disabled={couponBusy}
                  className="text-xs uppercase tracking-widest text-muted hover:text-gold"
                >
                  Retirer
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Votre code"
                  className="flex-1 rounded-xl border border-line bg-base px-4 py-2.5 text-sm uppercase tracking-wide transition-all focus:border-gold focus:outline-none"
                />
                <Button size="sm" onClick={handleApplyCoupon} disabled={couponBusy}>
                  Appliquer
                </Button>
              </div>
            )}
            {/* Coupon errors can come from the apply call or from the priced cart. */}
            {(couponError || cart.couponError) && !cart.couponCode ? (
              <p className="mt-2 text-xs text-red-700">{couponError ?? cart.couponError}</p>
            ) : null}
            {cart.couponError && cart.couponCode ? (
              <p className="mt-2 text-xs text-red-700">{cart.couponError}</p>
            ) : null}
          </div>

          <OrderTotals totals={cart.totals} currency={cart.currency} />

          <Button href="/commande" fullWidth size="lg">
            Passer la commande
          </Button>
          <Link
            href="/boutique"
            className="block text-center text-xs uppercase tracking-widest text-muted hover:text-gold"
          >
            Continuer mes achats
          </Link>
        </aside>
      </div>
    </div>
  );
}

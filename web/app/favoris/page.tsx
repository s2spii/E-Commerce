'use client';

import { useEffect } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Reveal } from '@/components/Reveal';
import { ProductGridSkeleton } from '@/components/Skeleton';
import { useWishlist } from '@/context/WishlistContext';
import type { ProductSummary } from '@/lib/types';

export default function FavorisPage() {
  const { items, ready, count, clear } = useWishlist();

  useEffect(() => {
    document.title = 'Favoris · Maison Luma';
  }, []);

  // Adapt the stored shape to the card's ProductSummary contract.
  const products: ProductSummary[] = items.map((i) => ({
    ...i,
    category: null,
    inStock: true,
    isFeatured: false,
  }));

  return (
    <div className="container-luxe py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <span className="eyebrow">Votre sélection</span>
          <h1 className="mt-3 text-5xl sm:text-6xl">
            Mes <span className="text-gradient-gold italic">favoris</span>
          </h1>
        </div>
        {count > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-gold"
          >
            Tout retirer
          </button>
        ) : null}
      </header>

      {!ready ? (
        <ProductGridSkeleton count={4} />
      ) : products.length === 0 ? (
        <EmptyState
          title="Aucun favori pour le moment"
          description="Parcourez la boutique et enregistrez les pièces qui vous inspirent en cliquant sur le cœur."
        >
          <Button href="/boutique" variant="secondary">
            Explorer la boutique
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

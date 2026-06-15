'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ProductListResponse, ProductSummary } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/Button';
import { Reveal } from '@/components/Reveal';
import { ProductGridSkeleton } from '@/components/Skeleton';

/** "Sélection" — featured products fetched client-side. */
export function FeaturedSection() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api<ProductListResponse>('/catalog/products', {
          params: { featured: true, pageSize: 6 },
        });
        if (active) setProducts(res?.items ?? []);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="container-luxe py-24">
      <Reveal className="mb-12 flex flex-col items-center text-center">
        <span className="eyebrow eyebrow-center before:hidden">La Sélection</span>
        <h2 className="mt-4 text-4xl sm:text-5xl">
          Pièces d&apos;<span className="text-gradient-gold">exception</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm text-muted">
          Une curation confidentielle de nos créations les plus désirées.
        </p>
        <span className="rule-gold mt-7" />
      </Reveal>

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : error ? (
        <p className="text-center text-sm text-muted">
          La sélection est momentanément indisponible.
        </p>
      ) : products.length === 0 ? (
        <p className="text-center text-sm text-muted">Aucune pièce en vedette pour le moment.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 120} direction="up">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}

      <Reveal className="mt-16 flex justify-center" delay={120}>
        <Button href="/boutique" variant="secondary">
          Découvrir la boutique
        </Button>
      </Reveal>
    </section>
  );
}

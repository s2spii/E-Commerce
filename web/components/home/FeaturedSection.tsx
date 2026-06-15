'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ProductListResponse, ProductSummary } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';

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
    <section className="container-luxe py-20">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="eyebrow">La Sélection</span>
        <h2 className="mt-3 text-4xl">Pièces d&apos;exception</h2>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Une curation confidentielle de nos créations les plus désirées.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-muted">
          La sélection est momentanément indisponible.
        </p>
      ) : products.length === 0 ? (
        <p className="text-center text-sm text-muted">Aucune pièce en vedette pour le moment.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className="mt-14 flex justify-center">
        <Button href="/boutique" variant="secondary">
          Découvrir la boutique
        </Button>
      </div>
    </section>
  );
}

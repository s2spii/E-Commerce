'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ProductListResponse, ProductSummary } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/Reveal';

/** "Vous aimerez aussi" — products from the same category, fetched client-side. */
export function RelatedProducts({
  categorySlug,
  currentId,
}: {
  categorySlug?: string;
  currentId: string;
}) {
  const [items, setItems] = useState<ProductSummary[]>([]);

  useEffect(() => {
    if (!categorySlug) return;
    let active = true;
    (async () => {
      try {
        const res = await api<ProductListResponse>('/catalog/products', {
          params: { category: categorySlug, pageSize: 5 },
        });
        if (active) {
          setItems((res?.items ?? []).filter((p) => p.id !== currentId).slice(0, 4));
        }
      } catch {
        /* non-fatal — hide the section */
      }
    })();
    return () => {
      active = false;
    };
  }, [categorySlug, currentId]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto mt-28 max-w-container">
      <Reveal className="mb-10 text-center">
        <span className="eyebrow eyebrow-center before:hidden">À découvrir</span>
        <h2 className="mt-4 text-3xl sm:text-4xl">Vous aimerez aussi</h2>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 90}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

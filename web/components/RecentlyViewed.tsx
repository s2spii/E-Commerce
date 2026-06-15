'use client';

import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/Reveal';
import { useRecentlyViewed } from '@/lib/useRecentlyViewed';
import type { ProductSummary } from '@/lib/types';

/** "Vu récemment" strip — hidden when there's nothing else to show. */
export function RecentlyViewed({ currentId }: { currentId: string }) {
  const { items } = useRecentlyViewed();
  const others = items.filter((i) => i.id !== currentId).slice(0, 4);

  if (others.length === 0) return null;

  const products: ProductSummary[] = others.map((i) => ({
    ...i,
    category: null,
    inStock: true,
    isFeatured: false,
  }));

  return (
    <section className="mx-auto mt-28 max-w-container">
      <Reveal className="mb-10 text-center">
        <span className="eyebrow eyebrow-center before:hidden">Votre parcours</span>
        <h2 className="mt-4 text-3xl sm:text-4xl">Vu récemment</h2>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 90}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

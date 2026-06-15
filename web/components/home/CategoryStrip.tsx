'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Category } from '@/lib/types';

/** Horizontal strip of category cards, fetched client-side. */
export function CategoryStrip() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api<Category[]>('/catalog/categories');
        if (active) setCategories(res ?? []);
      } catch {
        /* non-fatal — hide the strip on failure */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading || categories.length === 0) return null;

  return (
    <section className="bg-surface py-20">
      <div className="container-luxe">
        <div className="mb-10 text-center">
          <span className="eyebrow">Explorer</span>
          <h2 className="mt-3 text-4xl">Les Univers</h2>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              href={`/boutique?category=${encodeURIComponent(cat.slug)}`}
              className="group relative block aspect-[4/5] overflow-hidden bg-line/40"
            >
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-5 text-center font-serif text-lg text-ivory">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

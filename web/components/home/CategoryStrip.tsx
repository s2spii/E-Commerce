'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Category } from '@/lib/types';
import { Reveal } from '@/components/Reveal';

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
    <section className="bg-sand/60 py-24">
      <div className="container-luxe">
        <Reveal className="mb-12 text-center">
          <span className="eyebrow eyebrow-center before:hidden">Explorer</span>
          <h2 className="mt-4 text-4xl sm:text-5xl">Les Univers</h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {categories.slice(0, 8).map((cat, i) => (
            <Reveal key={cat.id} delay={(i % 4) * 100} direction="up">
              <Link
                href={`/boutique?category=${encodeURIComponent(cat.slug)}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-sand shadow-soft transition-shadow duration-500 hover:shadow-lift"
              >
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-[900ms] ease-spring group-hover:scale-110"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-noir/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-5 flex flex-col items-center text-ivory">
                  <span className="font-serif text-xl">{cat.name}</span>
                  <span className="mt-1 flex translate-y-1 items-center gap-1 text-[10px] uppercase tracking-widest text-gold opacity-0 transition-all duration-500 ease-spring group-hover:translate-y-0 group-hover:opacity-100">
                    Découvrir →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

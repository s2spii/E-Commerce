'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { formatPrice } from '@/lib/api';
import { useCompare } from '@/context/CompareContext';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';

export default function ComparateurPage() {
  const { items, count, remove, clear } = useCompare();

  useEffect(() => {
    document.title = 'Comparateur · Maison Luma';
  }, []);

  const cols = items.length;

  return (
    <div className="container-luxe py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <span className="eyebrow">Comparateur</span>
          <h1 className="mt-3 text-5xl sm:text-6xl">
            Comparer les <span className="text-gradient-gold italic">pièces</span>
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

      {count === 0 ? (
        <EmptyState
          title="Aucune pièce à comparer"
          description="Ajoutez des pièces au comparateur depuis leur fiche produit pour les comparer côte à côte."
        >
          <Button href="/boutique" variant="secondary">
            Explorer la boutique
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[640px] border-l border-t border-line"
            style={{ gridTemplateColumns: `150px repeat(${cols}, minmax(180px, 1fr))` }}
          >
            {/* Header row */}
            <Cell className="bg-sand/50" />
            {items.map((p) => (
              <Cell key={p.id} className="bg-sand/50">
                <div className="relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-xl bg-base">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill sizes="200px" className="object-cover" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    aria-label={`Retirer ${p.name}`}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-base/90 text-ink shadow-soft transition-colors hover:text-gold"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <Link href={`/produit/${p.slug}`} className="font-serif text-lg leading-snug hover:text-gold">
                  {p.name}
                </Link>
              </Cell>
            ))}

            {/* Brand row */}
            <RowLabel>Maison</RowLabel>
            {items.map((p) => (
              <Cell key={p.id} className="text-sm text-muted">
                {p.brand ?? '—'}
              </Cell>
            ))}

            {/* Price row */}
            <RowLabel>Prix</RowLabel>
            {items.map((p) => (
              <Cell key={p.id} className="text-sm font-medium text-ink">
                {p.fromPrice != null ? formatPrice(p.fromPrice, p.currency) : 'Sur demande'}
              </Cell>
            ))}

            {/* Action row */}
            <RowLabel> </RowLabel>
            {items.map((p) => (
              <Cell key={p.id}>
                <Button href={`/produit/${p.slug}`} variant="secondary" size="sm">
                  Voir la pièce
                </Button>
              </Cell>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Cell({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <div className={`border-b border-r border-line p-4 ${className}`}>{children}</div>;
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-r border-line bg-sand/30 p-4 text-xs uppercase tracking-widest text-gold">
      {children}
    </div>
  );
}

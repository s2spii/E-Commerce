'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCompare, COMPARE_MAX } from '@/context/CompareContext';

/** Floating bar listing the products queued for comparison. */
export function CompareBar() {
  const { items, count, remove, clear, ready } = useCompare();

  if (!ready || count === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-[45] w-[min(94vw,660px)] -translate-x-1/2">
      <div className="animate-fade-up flex items-center gap-3 rounded-2xl border border-line bg-base/95 p-3 shadow-lift backdrop-blur-xl">
        <span className="hidden shrink-0 pl-2 text-xs uppercase tracking-widest text-muted sm:block">
          Comparer
        </span>
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {items.map((p) => (
            <div key={p.id} className="group relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-sand">
              {p.image ? (
                <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
              ) : null}
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={`Retirer ${p.name}`}
                className="absolute inset-0 flex items-center justify-center bg-noir/60 text-ivory opacity-0 transition-opacity group-hover:opacity-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
          <span className="shrink-0 px-1 text-xs tabular-nums text-muted">
            {count}/{COMPARE_MAX}
          </span>
        </div>
        <Link
          href="/comparateur"
          className="shrink-0 rounded-full bg-noir px-5 py-2.5 text-xs uppercase tracking-widest text-ivory transition-transform hover:-translate-y-0.5"
        >
          Comparer
        </Link>
        <button
          type="button"
          onClick={clear}
          aria-label="Vider le comparateur"
          className="shrink-0 px-1 text-muted transition-colors hover:text-gold"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

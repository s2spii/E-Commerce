'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, formatPrice } from '@/lib/api';
import type { ProductListResponse, ProductSummary } from '@/lib/types';
import { Spinner } from '@/components/Spinner';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/** Spotlight-style product search. Debounced, keyboard-friendly (Esc closes). */
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input + lock scroll + Esc to close while open.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Reset when closed.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Debounced fetch.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let active = true;
    const t = setTimeout(async () => {
      try {
        const res = await api<ProductListResponse>('/catalog/products', {
          params: { q, pageSize: 6 },
        });
        if (active) setResults(res?.items ?? []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const trimmed = query.trim();

  return (
    <div
      className={`fixed inset-0 z-[65] flex justify-center px-4 pt-[12vh] ${
        open ? '' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-noir/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recherche"
        className={`relative w-full max-w-xl transition-all duration-300 ease-spring ${
          open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-line bg-ivory shadow-lift">
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-line px-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une pièce, une maison…"
              className="w-full bg-transparent py-4 text-base text-ink placeholder:text-muted/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted"
            >
              Esc
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[55vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : trimmed.length < 2 ? (
              <p className="px-5 py-12 text-center text-sm text-muted">
                Saisissez au moins deux caractères pour lancer la recherche.
              </p>
            ) : results.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted">
                Aucun résultat pour « {trimmed} ».
              </p>
            ) : (
              <ul className="p-2">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/produit/${p.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 rounded-xl p-2.5 transition-colors hover:bg-sand/70"
                    >
                      <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        {p.brand ? (
                          <span className="block text-[10px] uppercase tracking-widest text-muted">
                            {p.brand}
                          </span>
                        ) : null}
                        <span className="block truncate font-serif text-base text-ink">{p.name}</span>
                      </span>
                      <span className="shrink-0 text-sm text-ink">
                        {p.fromPrice != null ? formatPrice(p.fromPrice, p.currency) : '—'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer CTA */}
          {trimmed.length >= 2 ? (
            <Link
              href={`/boutique?q=${encodeURIComponent(trimmed)}`}
              onClick={onClose}
              className="block border-t border-line px-5 py-3.5 text-center text-xs uppercase tracking-widest text-gold transition-colors hover:bg-gold/5"
            >
              Voir tous les résultats →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

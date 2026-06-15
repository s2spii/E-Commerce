'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Category, ProductListResponse, ProductSummary, Pagination } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';

type Sort = 'newest' | 'name' | 'featured';

interface Filters {
  q: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sort: Sort;
  page: number;
}

const DEFAULT_FILTERS: Filters = {
  q: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
  sort: 'newest',
  page: 1,
};

function filtersFromParams(params: URLSearchParams): Filters {
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    inStock: params.get('inStock') === 'true',
    sort: sort === 'name' || sort === 'featured' ? sort : 'newest',
    page: Math.max(1, Number(params.get('page')) || 1),
  };
}

function BoutiqueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => filtersFromParams(searchParams));
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep local state in sync if the URL changes (e.g. category link from home).
  useEffect(() => {
    setFilters(filtersFromParams(searchParams));
  }, [searchParams]);

  // Load categories once.
  useEffect(() => {
    (async () => {
      try {
        const res = await api<Category[]>('/catalog/categories');
        setCategories(res ?? []);
      } catch {
        /* non-fatal */
      }
    })();
  }, []);

  // Reflect filters into the URL (shareable / back-button friendly).
  const pushFilters = useCallback(
    (next: Filters) => {
      const sp = new URLSearchParams();
      if (next.q) sp.set('q', next.q);
      if (next.category) sp.set('category', next.category);
      if (next.minPrice) sp.set('minPrice', next.minPrice);
      if (next.maxPrice) sp.set('maxPrice', next.maxPrice);
      if (next.inStock) sp.set('inStock', 'true');
      if (next.sort !== 'newest') sp.set('sort', next.sort);
      if (next.page > 1) sp.set('page', String(next.page));
      const qs = sp.toString();
      router.replace(qs ? `/boutique?${qs}` : '/boutique', { scroll: false });
    },
    [router],
  );

  // Fetch products whenever the active filters change.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await api<ProductListResponse>('/catalog/products', {
          params: {
            q: filters.q || undefined,
            category: filters.category || undefined,
            minPrice: filters.minPrice ? Number(filters.minPrice) * 100 : undefined,
            maxPrice: filters.maxPrice ? Number(filters.maxPrice) * 100 : undefined,
            inStock: filters.inStock ? true : undefined,
            sort: filters.sort,
            page: filters.page,
            pageSize: 12,
          },
        });
        if (!active) return;
        setProducts(res?.items ?? []);
        setPagination(res?.pagination ?? null);
      } catch {
        if (active) setError('Impossible de charger les produits pour le moment.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [filters]);

  // Update one or more fields; resets to page 1 unless paging explicitly.
  const update = (patch: Partial<Filters>, resetPage = true) => {
    const next = { ...filters, ...patch, page: resetPage ? 1 : (patch.page ?? filters.page) };
    setFilters(next);
    pushFilters(next);
  };

  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    pushFilters(DEFAULT_FILTERS);
  };

  const totalPages = pagination?.pages ?? 1;

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.q ||
          filters.category ||
          filters.minPrice ||
          filters.maxPrice ||
          filters.inStock ||
          filters.sort !== 'newest',
      ),
    [filters],
  );

  return (
    <div className="container-luxe py-14">
      <header className="mb-10 border-b border-line pb-8 text-center">
        <span className="eyebrow">La Boutique</span>
        <h1 className="mt-3 text-5xl">Toutes nos pièces</h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="space-y-8">
          <div>
            <label className="eyebrow mb-3 block" htmlFor="search">
              Recherche
            </label>
            <input
              id="search"
              type="search"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Rechercher…"
              className="w-full border border-line bg-surface px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <span className="eyebrow mb-3 block">Catégorie</span>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => update({ category: '' })}
                className={`block text-sm transition-colors ${
                  filters.category === '' ? 'text-gold' : 'text-muted hover:text-ink'
                }`}
              >
                Toutes les catégories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => update({ category: cat.slug })}
                  className={`block text-sm transition-colors ${
                    filters.category === cat.slug ? 'text-gold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="eyebrow mb-3 block">Prix (€)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={filters.minPrice}
                onChange={(e) => update({ minPrice: e.target.value })}
                placeholder="Min"
                className="w-full border border-line bg-surface px-2 py-2 text-sm focus:border-gold focus:outline-none"
              />
              <span className="text-muted">—</span>
              <input
                type="number"
                min={0}
                value={filters.maxPrice}
                onChange={(e) => update({ maxPrice: e.target.value })}
                placeholder="Max"
                className="w-full border border-line bg-surface px-2 py-2 text-sm focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => update({ inStock: e.target.checked })}
              className="h-4 w-4 accent-gold"
            />
            En stock uniquement
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={reset}
              className="text-xs uppercase tracking-widest text-gold underline-offset-4 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          ) : null}
        </aside>

        {/* Results */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted">
              {pagination ? `${pagination.total} pièce${pagination.total > 1 ? 's' : ''}` : ' '}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">Trier :</span>
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as Sort })}
                className="border border-line bg-surface px-3 py-2 text-sm focus:border-gold focus:outline-none"
              >
                <option value="newest">Nouveautés</option>
                <option value="name">Nom (A-Z)</option>
                <option value="featured">En vedette</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : error ? (
            <EmptyState title="Une erreur est survenue" description={error}>
              <Button variant="secondary" onClick={() => update({})}>
                Réessayer
              </Button>
            </EmptyState>
          ) : products.length === 0 ? (
            <EmptyState
              title="Aucun résultat"
              description="Essayez d'élargir vos critères de recherche."
            >
              {hasActiveFilters ? (
                <Button variant="secondary" onClick={reset}>
                  Réinitialiser
                </Button>
              ) : null}
            </EmptyState>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {totalPages > 1 ? (
                <nav className="mt-14 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    disabled={filters.page <= 1}
                    onClick={() => update({ page: filters.page - 1 }, false)}
                    className="text-xs uppercase tracking-widest text-ink transition-colors hover:text-gold disabled:opacity-30"
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-muted">
                    Page {filters.page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={filters.page >= totalPages}
                    onClick={() => update({ page: filters.page + 1 }, false)}
                    className="text-xs uppercase tracking-widest text-ink transition-colors hover:text-gold disabled:opacity-30"
                  >
                    Suivant
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function BoutiquePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <BoutiqueContent />
    </Suspense>
  );
}

'use client';

import { useCompare } from '@/context/CompareContext';
import { useToast } from '@/context/ToastContext';
import type { SavedProduct } from '@/context/WishlistContext';

/** Adds/removes a product from the comparison set (used on the product page). */
export function CompareButton({ product, className = '' }: { product: SavedProduct; className?: string }) {
  const { has, toggle } = useCompare();
  const { toast } = useToast();
  const active = has(product.id);

  const onClick = () => {
    const result = toggle(product);
    if (result === 'full') toast('Le comparateur est limité à 4 pièces', 'info');
    else toast(result === 'added' ? 'Ajouté au comparateur' : 'Retiré du comparateur', result === 'added' ? 'success' : 'info');
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? 'Retirer du comparateur' : 'Ajouter au comparateur'}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-3.5 text-xs uppercase tracking-widest transition-all duration-300 hover:-translate-y-0.5 ${
        active ? 'border-gold bg-gold/10 text-gold' : 'border-line text-ink hover:border-ink'
      } ${className}`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M3 6h7M3 18h7M17 4v16M14 8l3-3 3 3M7 16l-2 2-2-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {active ? 'Au comparateur' : 'Comparer'}
    </button>
  );
}

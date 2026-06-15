'use client';

import { useWishlist, type SavedProduct } from '@/context/WishlistContext';
import { useToast } from '@/context/ToastContext';

interface WishlistButtonProps {
  product: SavedProduct;
  /** Visual treatment: a floating chip (on cards) or a bordered pill (on PDP). */
  variant?: 'chip' | 'pill';
  className?: string;
}

/**
 * Heart toggle. Stops propagation so it can live inside a product-card link
 * without triggering navigation, and announces the change via a toast.
 */
export function WishlistButton({ product, variant = 'chip', className = '' }: WishlistButtonProps) {
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const active = has(product.id);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggle(product);
    toast(added ? 'Ajouté à vos favoris' : 'Retiré de vos favoris', added ? 'success' : 'info');
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-3.5 text-xs uppercase tracking-widest transition-all duration-300 hover:-translate-y-0.5 ${
          active ? 'border-gold bg-gold/10 text-gold' : 'border-line text-ink hover:border-ink'
        } ${className}`}
      >
        <Heart filled={active} />
        {active ? 'Favori' : 'Ajouter aux favoris'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 text-ink shadow-soft backdrop-blur transition-all duration-300 hover:scale-110 hover:text-gold ${
        active ? 'text-gold' : ''
      } ${className}`}
    >
      <Heart filled={active} />
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className="transition-all duration-300"
    >
      <path
        d="M12 20s-7-4.5-9.5-9A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

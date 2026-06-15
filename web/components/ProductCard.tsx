import Image from 'next/image';
import Link from 'next/link';
import { Price } from '@/components/Price';
import type { ProductSummary } from '@/lib/types';

/** Editorial product tile used across the home and shop grids. */
export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link href={`/produit/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-line/40">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-muted">
            Maison Luma
          </div>
        )}
        {!product.inStock ? (
          <span className="absolute left-3 top-3 bg-ink/85 px-3 py-1 text-[10px] uppercase tracking-widest text-ivory">
            Épuisé
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-1">
        {product.brand ? (
          <p className="text-[11px] uppercase tracking-widest text-muted">{product.brand}</p>
        ) : null}
        <h3 className="font-serif text-lg leading-snug text-ink transition-colors group-hover:text-gold">
          {product.name}
        </h3>
        <div className="pt-1 text-sm text-ink">
          {product.fromPrice != null ? (
            <Price amount={product.fromPrice} currency={product.currency} />
          ) : (
            <span className="text-muted">Sur demande</span>
          )}
        </div>
      </div>
    </Link>
  );
}

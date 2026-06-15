import Image from 'next/image';
import Link from 'next/link';
import { Price } from '@/components/Price';
import { WishlistButton } from '@/components/WishlistButton';
import type { ProductSummary } from '@/lib/types';

/** Editorial product tile used across the home and shop grids. */
export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/produit/${product.slug}`}
      className="group block transition-transform duration-500 ease-spring hover:-translate-y-1.5"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-sand shadow-soft transition-shadow duration-500 group-hover:shadow-lift">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[900ms] ease-spring group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-luxe text-muted">
            Maison Luma
          </div>
        )}

        {/* Hover veil + reveal */}
        <div className="absolute inset-0 bg-gradient-to-t from-noir/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="absolute inset-x-4 bottom-4 translate-y-3 rounded-full bg-ivory/95 py-2.5 text-center text-[11px] uppercase tracking-widest text-ink opacity-0 shadow-soft backdrop-blur transition-all duration-500 ease-spring group-hover:translate-y-0 group-hover:opacity-100">
          Découvrir la pièce
        </span>

        {!product.inStock ? (
          <span className="absolute left-3 top-3 rounded-full bg-noir/80 px-3 py-1 text-[10px] uppercase tracking-widest text-ivory backdrop-blur">
            Épuisé
          </span>
        ) : null}

        <WishlistButton
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            image: product.image,
            brand: product.brand,
            fromPrice: product.fromPrice,
            currency: product.currency,
          }}
          className="absolute right-3 top-3"
        />
      </div>

      <div className="mt-4 space-y-1">
        {product.brand ? (
          <p className="text-[11px] uppercase tracking-widest text-muted">{product.brand}</p>
        ) : null}
        <h3 className="font-serif text-lg leading-snug text-ink transition-colors group-hover:text-gold">
          {product.name}
        </h3>
        <div className="pt-1 text-sm font-medium text-ink">
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

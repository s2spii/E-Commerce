'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { api, ApiError, formatDate } from '@/lib/api';
import type { ProductDetail, Variant } from '@/lib/types';
import { Price } from '@/components/Price';
import { Button } from '@/components/Button';
import { QuantityStepper } from '@/components/QuantityStepper';
import { PageSpinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { useCart } from '@/context/CartContext';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    (async () => {
      try {
        const res = await api<ProductDetail>(`/catalog/products/${slug}`);
        if (!active) return;
        setProduct(res);
        // Default to the first in-stock variant, else the first variant.
        const firstAvailable = res.variants.find((v) => v.stock > 0) ?? res.variants[0];
        setSelectedVariantId(firstAvailable?.id ?? null);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const selectedVariant: Variant | null = useMemo(
    () => product?.variants.find((v) => v.id === selectedVariantId) ?? null,
    [product, selectedVariantId],
  );

  const averageRating = useMemo(() => {
    if (!product || product.reviews.length === 0) return null;
    const sum = product.reviews.reduce((a, r) => a + r.rating, 0);
    return sum / product.reviews.length;
  }, [product]);

  const handleAdd = async () => {
    if (!selectedVariant) return;
    setAdding(true);
    setCartError(null);
    setAdded(false);
    try {
      await addItem(selectedVariant.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setCartError(err instanceof ApiError ? err.message : 'Ajout au panier impossible.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <PageSpinner />;

  if (notFound || !product) {
    return (
      <div className="container-luxe py-20">
        <EmptyState
          title="Produit introuvable"
          description="Cette pièce n'est plus disponible ou l'adresse est incorrecte."
        >
          <Button href="/boutique" variant="secondary">
            Retour à la boutique
          </Button>
        </EmptyState>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [{ url: '', alt: product.name }];
  const displayPrice = selectedVariant?.price ?? product.variants[0]?.price ?? null;
  const outOfStock = selectedVariant ? selectedVariant.stock <= 0 : true;

  return (
    <div className="container-luxe py-10">
      <nav className="mb-8 text-xs uppercase tracking-widest text-muted">
        <Link href="/boutique" className="hover:text-gold">
          Boutique
        </Link>
        {product.category ? (
          <>
            <span className="mx-2">/</span>
            <Link href={`/boutique?category=${product.category.slug}`} className="hover:text-gold">
              {product.category.name}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-line/40">
            {images[activeImage]?.url ? (
              <Image
                src={images[activeImage].url}
                alt={images[activeImage].alt ?? product.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-muted">
                Maison Luma
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="mt-4 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={`${img.url}-${i}`}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-square w-20 overflow-hidden border ${
                    i === activeImage ? 'border-gold' : 'border-line'
                  }`}
                  aria-label={`Voir l'image ${i + 1}`}
                >
                  {img.url ? (
                    <Image src={img.url} alt={img.alt ?? ''} fill sizes="80px" className="object-cover" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div>
          {product.brand ? (
            <p className="text-xs uppercase tracking-widest text-muted">{product.brand}</p>
          ) : null}
          <h1 className="mt-2 text-4xl leading-tight">{product.name}</h1>

          {averageRating != null ? (
            <p className="mt-3 text-sm text-muted">
              <span className="text-gold">{'★'.repeat(Math.round(averageRating))}</span>{' '}
              {averageRating.toFixed(1)} · {product.reviews.length} avis
            </p>
          ) : null}

          <div className="mt-5 text-2xl text-ink">
            <Price
              amount={displayPrice}
              currency={product.currency}
              compareAt={selectedVariant?.compareAtPrice}
            />
            <span className="ml-2 text-xs uppercase tracking-widest text-muted">TTC</span>
          </div>

          {product.description ? (
            <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>
          ) : null}

          {/* Variant selector */}
          {product.variants.length > 0 ? (
            <div className="mt-8">
              <span className="eyebrow mb-3 block">Variante</span>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v) => {
                  const disabled = v.stock <= 0;
                  const selected = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`border px-4 py-2 text-sm transition-colors ${
                        selected
                          ? 'border-gold text-gold'
                          : 'border-line text-ink hover:border-ink'
                      } ${disabled ? 'cursor-not-allowed text-muted line-through opacity-60' : ''}`}
                    >
                      {v.name || v.sku}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Quantity + add to cart */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={selectedVariant ? Math.max(1, selectedVariant.stock) : 99}
              disabled={outOfStock}
            />
            <Button onClick={handleAdd} disabled={adding || outOfStock} size="lg">
              {outOfStock ? 'Épuisé' : adding ? 'Ajout…' : 'Ajouter au panier'}
            </Button>
          </div>

          {added ? (
            <p className="mt-4 text-sm text-gold">
              Ajouté au panier.{' '}
              <Link href="/panier" className="underline underline-offset-4">
                Voir le panier
              </Link>
            </p>
          ) : null}
          {cartError ? <p className="mt-4 text-sm text-red-700">{cartError}</p> : null}

          {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 ? (
            <p className="mt-4 text-xs uppercase tracking-widest text-muted">
              Plus que {selectedVariant.stock} en stock
            </p>
          ) : null}
        </div>
      </div>

      {/* Story */}
      {product.story ? (
        <section className="mx-auto mt-24 max-w-3xl text-center">
          <span className="eyebrow">L&apos;histoire</span>
          <h2 className="mt-3 text-3xl">Le récit de la pièce</h2>
          <div className="mt-6 space-y-4 text-left text-sm leading-relaxed text-muted">
            {product.story.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      ) : null}

      {/* Reviews */}
      <section className="mx-auto mt-24 max-w-3xl">
        <h2 className="mb-8 text-center text-3xl">Avis</h2>
        {product.reviews.length === 0 ? (
          <p className="text-center text-sm text-muted">
            Aucun avis pour le moment. Soyez le premier à partager le vôtre.
          </p>
        ) : (
          <ul className="space-y-8">
            {product.reviews.map((review, i) => (
              <li key={i} className="border-b border-line pb-8 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-gold">{'★'.repeat(review.rating)}</span>
                  <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
                </div>
                {review.title ? <h3 className="mt-2 font-serif text-lg">{review.title}</h3> : null}
                {review.body ? <p className="mt-2 text-sm text-muted">{review.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

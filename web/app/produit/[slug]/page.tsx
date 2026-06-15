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
import { Reveal } from '@/components/Reveal';
import { Lightbox } from '@/components/Lightbox';
import { WishlistButton } from '@/components/WishlistButton';
import { Accordion } from '@/components/Accordion';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { useCart } from '@/context/CartContext';
import { useCartUI } from '@/context/CartUIContext';
import { useRecentlyViewed } from '@/lib/useRecentlyViewed';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addItem } = useCart();
  const { openCart } = useCartUI();
  const { track } = useRecentlyViewed();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
        setActiveImage(0);
        setQuantity(1);
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

  // Remember this product for the "Vu récemment" strip.
  useEffect(() => {
    if (!product) return;
    track({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0]?.url ?? null,
      brand: product.brand,
      fromPrice: product.variants[0]?.price ?? null,
      currency: product.currency,
    });
  }, [product, track]);

  const handleAdd = async () => {
    if (!selectedVariant) return;
    setAdding(true);
    setCartError(null);
    setAdded(false);
    try {
      await addItem(selectedVariant.id, quantity);
      setAdded(true);
      openCart();
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
          <button
            type="button"
            onClick={() => images[activeImage]?.url && setLightboxOpen(true)}
            className="group relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-3xl bg-sand text-left shadow-lift"
            aria-label="Agrandir l'image"
          >
            {images[activeImage]?.url ? (
              <Image
                key={activeImage}
                src={images[activeImage].url}
                alt={images[activeImage].alt ?? product.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="animate-fade-in object-cover transition-transform duration-[1200ms] ease-spring group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs uppercase tracking-luxe text-muted">
                Maison Luma
              </div>
            )}
            {images[activeImage]?.url ? (
              <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-ivory/90 text-ink opacity-0 shadow-soft backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            ) : null}
          </button>
          {images.length > 1 ? (
            <div className="mt-4 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={`${img.url}-${i}`}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-square w-20 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    i === activeImage
                      ? 'border-gold shadow-gold'
                      : 'border-transparent opacity-70 hover:opacity-100'
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
        <div className="lg:sticky lg:top-28 lg:h-fit">
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

          <div className="mt-5 text-3xl font-medium text-ink">
            <Price
              amount={displayPrice}
              currency={product.currency}
              compareAt={selectedVariant?.compareAtPrice}
            />
            <span className="ml-2 align-middle text-xs uppercase tracking-widest text-muted">TTC</span>
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
                      className={`rounded-full border px-5 py-2.5 text-sm transition-all duration-300 ${
                        selected
                          ? 'border-gold bg-gold/10 text-gold shadow-sm'
                          : 'border-line text-ink hover:-translate-y-0.5 hover:border-ink'
                      } ${disabled ? 'cursor-not-allowed text-muted line-through opacity-60 hover:translate-y-0' : ''}`}
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
            <Button
              onClick={handleAdd}
              disabled={adding || outOfStock}
              size="lg"
              className="min-w-[210px]"
            >
              {outOfStock ? (
                'Épuisé'
              ) : adding ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Ajout…
                </>
              ) : added ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Ajouté
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                    <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
                    <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
                  </svg>
                  Ajouter au panier
                </>
              )}
            </Button>
            <WishlistButton
              variant="pill"
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images[0]?.url ?? null,
                brand: product.brand,
                fromPrice: product.variants[0]?.price ?? null,
                currency: product.currency,
              }}
            />
          </div>

          {cartError ? <p className="mt-4 text-sm text-red-700">{cartError}</p> : null}

          {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 ? (
            <p className="mt-4 text-xs uppercase tracking-widest text-muted">
              Plus que {selectedVariant.stock} en stock
            </p>
          ) : null}

          <div className="mt-10">
            <Accordion
              items={[
                {
                  q: 'Livraison & retours',
                  a: 'Livraison soignée offerte dès 200 € en France métropolitaine, préparée sous 1 à 2 jours ouvrés. Retours acceptés sous 14 jours.',
                },
                {
                  q: 'Paiement & sécurité',
                  a: 'Paiement 100 % sécurisé et chiffré de bout en bout. Vos données sont protégées conformément au RGPD.',
                },
                {
                  q: 'Authenticité & savoir-faire',
                  a: 'Chaque pièce est choisie pour la qualité de sa fabrication et façonnée par des maisons d’exception, dans le respect du geste juste.',
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Story */}
      {product.story ? (
        <Reveal as="section" className="mx-auto mt-28 max-w-3xl text-center">
          <span className="eyebrow eyebrow-center before:hidden">L&apos;histoire</span>
          <h2 className="mt-4 text-3xl sm:text-4xl">Le récit de la pièce</h2>
          <span className="rule-gold mx-auto mt-6" />
          <div className="mt-6 space-y-4 text-left text-sm leading-relaxed text-muted">
            {product.story.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Reveal>
      ) : null}

      {/* Reviews */}
      <Reveal as="section" className="mx-auto mt-28 max-w-3xl">
        <h2 className="mb-8 text-center text-3xl sm:text-4xl">Avis</h2>
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
      </Reveal>

      <RecentlyViewed currentId={product.id} />

      <Lightbox
        images={images}
        index={activeImage}
        open={lightboxOpen}
        onIndexChange={setActiveImage}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

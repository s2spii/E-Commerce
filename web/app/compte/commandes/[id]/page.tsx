'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError, formatDate, formatPrice } from '@/lib/api';
import type { OrderDetail } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { PageSpinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { profile, loading: authLoading } = useRequireAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    (async () => {
      try {
        const res = await api<OrderDetail>(`/orders/${id}`);
        if (active) setOrder(res);
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiError && err.status === 404
              ? 'Commande introuvable.'
              : 'Impossible de charger la commande.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [profile, id]);

  if (authLoading || !profile || loading) return <PageSpinner />;

  if (error || !order) {
    return (
      <div className="container-luxe py-20">
        <EmptyState title="Commande indisponible" description={error ?? undefined}>
          <Button href="/compte/commandes" variant="secondary">
            Retour aux commandes
          </Button>
        </EmptyState>
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="container-luxe py-14">
      <Link
        href="/compte/commandes"
        className="mb-8 inline-block text-xs uppercase tracking-widest text-muted hover:text-gold"
      >
        ← Mes commandes
      </Link>

      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-8">
        <div>
          <span className="eyebrow">Commande</span>
          <h1 className="mt-2 text-4xl">{order.number}</h1>
          <p className="mt-2 text-sm text-muted">Passée le {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <section>
          <h2 className="mb-6 text-2xl">Articles</h2>
          <div className="divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 py-5">
                <div>
                  <p className="font-serif text-lg">{item.productName}</p>
                  {item.variantName ? (
                    <p className="mt-1 text-xs uppercase tracking-widest text-muted">{item.variantName}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted">Quantité : {item.quantity}</p>
                </div>
                <p className="text-sm text-ink">{formatPrice(item.lineTotalInclTax, order.currency)}</p>
              </div>
            ))}
          </div>

          {/* Shipping address */}
          <h2 className="mb-4 mt-12 text-2xl">Adresse de livraison</h2>
          <address className="not-italic text-sm leading-relaxed text-muted">
            <span className="text-ink">{addr.fullName}</span>
            <br />
            {addr.company ? (
              <>
                {addr.company}
                <br />
              </>
            ) : null}
            {addr.line1}
            <br />
            {addr.line2 ? (
              <>
                {addr.line2}
                <br />
              </>
            ) : null}
            {addr.postalCode} {addr.city}
            {addr.region ? `, ${addr.region}` : ''}
            <br />
            {addr.countryCode}
            {addr.phone ? (
              <>
                <br />
                {addr.phone}
              </>
            ) : null}
          </address>
        </section>

        {/* Totals */}
        <aside className="h-fit space-y-3 border border-line bg-surface p-7 text-sm">
          <h2 className="mb-2 text-2xl">Récapitulatif</h2>
          <Row label="Sous-total HT" value={formatPrice(order.subtotalExclTax, order.currency)} />
          {order.discountTotal > 0 ? (
            <Row label="Remise" value={`− ${formatPrice(order.discountTotal, order.currency)}`} accent />
          ) : null}
          <Row
            label="Livraison"
            value={order.shippingExclTax === 0 ? 'Offerte' : formatPrice(order.shippingExclTax, order.currency)}
          />
          {order.taxBreakdown.length > 0 ? (
            order.taxBreakdown.map((line, i) => (
              <Row
                key={`${line.rate}-${i}`}
                label={`TVA ${(line.rate / 100).toLocaleString('fr-FR')} %`}
                value={formatPrice(line.tax, order.currency)}
                muted
              />
            ))
          ) : (
            <Row label="TVA" value={formatPrice(order.taxTotal, order.currency)} muted />
          )}
          {order.reverseCharge ? (
            <p className="text-xs leading-relaxed text-muted">
              Autoliquidation de la TVA — TVA due par le preneur.
            </p>
          ) : null}
          {order.customerType === 'B2B' && order.vatNumber ? (
            <Row label="N° TVA" value={order.vatNumber} muted />
          ) : null}
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-serif text-lg">Total TTC</span>
            <span className="font-serif text-lg">{formatPrice(order.grandTotal, order.currency)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={muted ? 'text-muted' : 'text-ink'}>{label}</span>
      <span className={accent ? 'text-gold' : muted ? 'text-muted' : 'text-ink'}>{value}</span>
    </div>
  );
}

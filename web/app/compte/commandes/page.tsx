'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, formatDate, formatPrice } from '@/lib/api';
import type { OrderSummary } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { PageSpinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

export default function OrdersPage() {
  const { profile, loading: authLoading } = useRequireAuth();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    (async () => {
      try {
        const res = await api<OrderSummary[]>('/orders');
        if (active) setOrders(res ?? []);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [profile]);

  if (authLoading || !profile) return <PageSpinner />;

  return (
    <div className="container-luxe py-14">
      <header className="mb-10 flex items-end justify-between border-b border-line pb-8">
        <div>
          <span className="eyebrow">Espace client</span>
          <h1 className="mt-3 text-5xl">Mes commandes</h1>
        </div>
        <Link href="/compte" className="hidden text-xs uppercase tracking-widest text-muted hover:text-gold sm:inline">
          Retour au compte
        </Link>
      </header>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <EmptyState title="Une erreur est survenue" description="Impossible de charger vos commandes." />
      ) : orders.length === 0 ? (
        <EmptyState title="Aucune commande" description="Vous n'avez pas encore passé de commande.">
          <Button href="/boutique" variant="secondary">
            Découvrir la boutique
          </Button>
        </EmptyState>
      ) : (
        <div className="divide-y divide-line border-y border-line">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/compte/commandes/${order.id}`}
              className="flex flex-col gap-3 py-6 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-serif text-lg">{order.number}</p>
                <p className="mt-1 text-sm text-muted">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-6">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm text-ink">{formatPrice(order.grandTotal, order.currency)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

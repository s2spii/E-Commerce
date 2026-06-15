'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError, formatDate, formatPrice } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { PageSpinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

export default function AdminDashboardPage() {
  const { profile, loading: authLoading } = useRequireAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    (async () => {
      try {
        const res = await api<DashboardStats>('/admin/dashboard');
        if (active) setStats(res);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && (err.status === 403 || err.status === 401)) setForbidden(true);
        else setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [profile]);

  if (authLoading || !profile || loading) return <PageSpinner />;

  if (forbidden) {
    return (
      <div className="container-luxe py-20">
        <EmptyState
          title="Accès réservé"
          description="Vous n'avez pas les autorisations nécessaires pour consulter le tableau de bord."
        />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container-luxe py-20">
        <EmptyState title="Tableau de bord indisponible" description="Impossible de charger les statistiques." />
      </div>
    );
  }

  const cards = [
    { label: 'Commandes aujourd’hui', value: stats.ordersToday },
    { label: 'Commandes en attente', value: stats.pendingOrders },
    { label: 'Clients', value: stats.customers },
    { label: 'Variantes en rupture', value: stats.lowStockVariants },
    { label: 'Chiffre d’affaires', value: formatPrice(stats.grossRevenue) },
  ];

  return (
    <div className="container-luxe py-14">
      <header className="mb-10 border-b border-line pb-8">
        <span className="eyebrow">Administration</span>
        <h1 className="mt-3 text-5xl">Tableau de bord</h1>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-line bg-surface p-6 shadow-soft transition-all duration-500 ease-spring hover:-translate-y-1 hover:shadow-lift"
          >
            <p className="text-xs uppercase tracking-widest text-muted">{card.label}</p>
            <p className="mt-3 font-serif text-3xl text-gradient-gold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <section className="mt-14">
        <h2 className="mb-6 text-2xl">Commandes récentes</h2>
        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-muted">Aucune commande récente.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/compte/commandes/${order.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-6 py-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lift"
              >
                <div>
                  <p className="font-serif text-lg">{order.number}</p>
                  <p className="mt-1 text-xs text-muted">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-6">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm text-ink">{formatPrice(order.grandTotal)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

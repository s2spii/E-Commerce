import type { OrderStatus } from '@/lib/types';

const LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
  PARTIALLY_REFUNDED: 'Remb. partiel',
};

const TONES: Record<OrderStatus, string> = {
  PENDING: 'border-line text-muted',
  PAID: 'border-gold text-gold',
  PROCESSING: 'border-gold text-gold',
  SHIPPED: 'border-ink text-ink',
  DELIVERED: 'border-green-700 text-green-700',
  CANCELLED: 'border-red-700 text-red-700',
  REFUNDED: 'border-red-700 text-red-700',
  PARTIALLY_REFUNDED: 'border-red-700 text-red-700',
};

/** French status pill used in order lists and detail headers. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block border px-3 py-1 text-[10px] uppercase tracking-widest ${
        TONES[status] ?? 'border-line text-muted'
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}

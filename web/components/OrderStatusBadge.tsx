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

// Soft pill tones: background tint + text + matching dot colour.
const TONES: Record<OrderStatus, { pill: string; dot: string }> = {
  PENDING: { pill: 'bg-line/50 text-muted', dot: 'bg-muted' },
  PAID: { pill: 'bg-gold/12 text-gold', dot: 'bg-gold' },
  PROCESSING: { pill: 'bg-gold/12 text-gold', dot: 'bg-gold' },
  SHIPPED: { pill: 'bg-ink/8 text-ink', dot: 'bg-ink' },
  DELIVERED: { pill: 'bg-green-600/12 text-green-700', dot: 'bg-green-600' },
  CANCELLED: { pill: 'bg-red-600/10 text-red-700', dot: 'bg-red-600' },
  REFUNDED: { pill: 'bg-red-600/10 text-red-700', dot: 'bg-red-600' },
  PARTIALLY_REFUNDED: { pill: 'bg-red-600/10 text-red-700', dot: 'bg-red-600' },
};

const FALLBACK = { pill: 'bg-line/50 text-muted', dot: 'bg-muted' };

/** French status pill used in order lists and detail headers. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = TONES[status] ?? FALLBACK;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {LABELS[status] ?? status}
    </span>
  );
}

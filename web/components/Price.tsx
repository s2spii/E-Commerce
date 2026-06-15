import { formatPrice } from '@/lib/api';

interface PriceProps {
  /** Amount in integer cents. */
  amount: number | null | undefined;
  currency?: string;
  /** Optional strikethrough "compare at" price (cents). */
  compareAt?: number | null;
  className?: string;
}

/** Renders a formatted EUR price with an optional struck-through original. */
export function Price({ amount, currency = 'EUR', compareAt, className = '' }: PriceProps) {
  const showCompare = compareAt != null && amount != null && compareAt > amount;
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span>{formatPrice(amount, currency)}</span>
      {showCompare ? (
        <span className="text-sm text-muted line-through">{formatPrice(compareAt, currency)}</span>
      ) : null}
    </span>
  );
}

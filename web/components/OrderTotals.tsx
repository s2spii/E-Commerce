import { formatPrice } from '@/lib/api';
import type { Totals } from '@/lib/types';

interface OrderTotalsProps {
  totals: Totals;
  currency?: string;
  /** Optional shipping line (cents) for the checkout/order views. */
  shipping?: number | null;
}

/**
 * Reusable totals panel: subtotal HT, discount, per-rate VAT lines and the
 * grand total TTC. Notes a reverse-charge scenario when applicable.
 */
export function OrderTotals({ totals, currency = 'EUR', shipping }: OrderTotalsProps) {
  return (
    <div className="space-y-3 border-t border-line pt-5 text-sm">
      <Row label="Sous-total HT" value={formatPrice(totals.subtotalExclTax, currency)} />

      {totals.discountTotal > 0 ? (
        <Row
          label="Remise"
          value={`− ${formatPrice(totals.discountTotal, currency)}`}
          accent
        />
      ) : null}

      {shipping != null ? (
        <Row
          label="Livraison"
          value={shipping === 0 ? 'Offerte' : formatPrice(shipping, currency)}
        />
      ) : null}

      {/* Per-rate VAT breakdown. `rate` is in basis points (2000 = 20%). */}
      {totals.taxBreakdown.length > 0 ? (
        totals.taxBreakdown.map((line, i) => (
          <Row
            key={`${line.rate}-${i}`}
            label={`TVA ${(line.rate / 100).toLocaleString('fr-FR')} %`}
            value={formatPrice(line.tax, currency)}
            muted
          />
        ))
      ) : (
        <Row label="TVA" value={formatPrice(totals.taxTotal, currency)} muted />
      )}

      {totals.reverseCharge ? (
        <p className="text-xs leading-relaxed text-muted">
          Autoliquidation de la TVA — TVA due par le preneur (article 196 de la directive
          2006/112/CE).
        </p>
      ) : null}

      <div className="flex items-baseline justify-between border-t border-line pt-4 text-base">
        <span className="font-serif text-lg">Total TTC</span>
        <span className="font-serif text-lg text-ink">
          {formatPrice(totals.grandTotal, currency)}
        </span>
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

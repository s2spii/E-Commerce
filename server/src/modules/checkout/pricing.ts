import { env } from '../../config/env';
import { computeTax, type TaxContext, type TaxLineInput } from '../tax/tax.engine';
import { buildRateResolver, validateVatNumber } from '../tax/tax.service';
import { evaluateCoupon } from '../promotions/promotions.service';

/**
 * Single source of truth for order pricing. Combines, in the correct order:
 *   1. tax determination (scenario, applicable rate per line),
 *   2. coupon discount (evaluated against the net product subtotal),
 *   3. proportional discount allocation across lines,
 *   4. shipping (taxed following the main supply),
 * then recomputes the definitive, per-line-rounded tax.
 *
 * Used by both the cart preview and order creation so what a customer is quoted
 * is exactly what they are charged.
 */

export interface PricingLine extends TaxLineInput {
  /** Opaque reference back to the cart item / variant for the caller. */
  ref?: string;
}

export interface PricingResult {
  scenario: string;
  reverseCharge: boolean;
  vatNumberValid: boolean;
  lines: Array<{
    id: string;
    ref?: string;
    appliedRate: number;
    netUnit: number;
    discount: number;
    netTotal: number;
    taxTotal: number;
    grossTotal: number;
  }>;
  subtotalExclTax: number; // products, before discount
  discountTotal: number;
  shippingExclTax: number;
  taxTotal: number;
  grandTotal: number;
  taxBreakdown: Array<{ rate: number; base: number; tax: number }>;
  notes: string[];
  coupon: { code: string; discountAmount: number } | null;
  couponError?: string;
}

export interface PriceCheckoutInput {
  lines: PricingLine[];
  destinationCountry: string;
  customerType?: 'B2C' | 'B2B';
  vatNumber?: string | null;
  couponCode?: string | null;
  userId?: string | null;
  /** Shipping price in the same tax convention as catalog prices. */
  shippingAmount?: number;
}

const SHIPPING_LINE_ID = '__shipping__';

function allocateDiscount(weights: { id: string; net: number }[], total: number): Map<string, number> {
  const out = new Map<string, number>();
  for (const w of weights) out.set(w.id, 0);
  if (total <= 0) return out;

  const sum = weights.reduce((a, w) => a + w.net, 0);
  if (sum <= 0) return out;

  let allocated = 0;
  weights.forEach((w, i) => {
    const isLast = i === weights.length - 1;
    let alloc = isLast ? total - allocated : Math.round((total * w.net) / sum);
    alloc = Math.min(alloc, w.net); // never discount below zero
    out.set(w.id, alloc);
    allocated += alloc;
  });
  return out;
}

export async function priceCheckout(input: PriceCheckoutInput): Promise<PricingResult> {
  const customerType = input.customerType ?? 'B2C';
  const resolver = await buildRateResolver();

  let vatNumberValid = false;
  if (customerType === 'B2B' && input.vatNumber) {
    vatNumberValid = (await validateVatNumber(input.vatNumber)).valid;
  }

  const ctx: TaxContext = {
    sellerCountry: env.TAX_HOME_COUNTRY,
    destinationCountry: input.destinationCountry,
    customerType,
    vatNumberValid,
    pricesIncludeTax: env.TAX_PRICES_INCLUDE_TAX,
    ossRegistered: true,
  };

  // Pass 1 — products only, no discount, to get the net base for the coupon.
  const pass1 = computeTax(input.lines, ctx, resolver);
  const subtotalExclTax = pass1.summary.netTotal;

  // Coupon evaluation against the net subtotal.
  let coupon: PricingResult['coupon'] = null;
  let couponError: string | undefined;
  if (input.couponCode) {
    try {
      const ev = await evaluateCoupon(input.couponCode, subtotalExclTax, input.userId);
      coupon = { code: ev.code, discountAmount: ev.discountAmount };
    } catch (err) {
      couponError = err instanceof Error ? err.message : 'Code promo invalide';
    }
  }

  const allocation = allocateDiscount(
    pass1.lines.map((l) => ({ id: l.id, net: l.netTotal })),
    coupon?.discountAmount ?? 0,
  );
  const discountTotal = [...allocation.values()].reduce((a, n) => a + n, 0);

  // Pass 2 — discounted products + shipping line, definitive tax.
  const lines2: TaxLineInput[] = input.lines.map((l) => ({
    ...l,
    discountAmount: allocation.get(l.id) ?? 0,
  }));
  if (input.shippingAmount && input.shippingAmount > 0) {
    lines2.push({ id: SHIPPING_LINE_ID, taxClass: 'STANDARD', unitAmount: input.shippingAmount, quantity: 1 });
  }
  const pass2 = computeTax(lines2, ctx, resolver);

  const refById = new Map(input.lines.map((l) => [l.id, l.ref]));
  const productLines = pass2.lines.filter((l) => l.id !== SHIPPING_LINE_ID);
  const shippingLine = pass2.lines.find((l) => l.id === SHIPPING_LINE_ID);

  return {
    scenario: pass2.scenario,
    reverseCharge: pass2.reverseCharge,
    vatNumberValid,
    lines: productLines.map((l) => ({
      id: l.id,
      ref: refById.get(l.id),
      appliedRate: l.appliedRate,
      netUnit: l.netUnit,
      discount: allocation.get(l.id) ?? 0,
      netTotal: l.netTotal,
      taxTotal: l.taxTotal,
      grossTotal: l.grossTotal,
    })),
    subtotalExclTax,
    discountTotal,
    shippingExclTax: shippingLine?.netTotal ?? 0,
    taxTotal: pass2.summary.taxTotal,
    grandTotal: pass2.summary.grossTotal,
    taxBreakdown: pass2.breakdown,
    notes: pass2.notes,
    coupon,
    couponError,
  };
}

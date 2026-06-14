import { isEuCountry } from './tax.data';

/**
 * Pure VAT computation engine — no database, no I/O, fully deterministic and
 * unit-tested. The service layer feeds it rates and validated VAT numbers.
 *
 * All monetary values are integer minor units (cents). Rates are basis points
 * (2000 = 20.00%). Rounding is performed per line to the nearest cent.
 */

export type TaxScenario =
  | 'DOMESTIC'
  | 'EU_B2C_OSS'
  | 'EU_B2C_ORIGIN'
  | 'EU_B2B_REVERSE_CHARGE'
  | 'EXPORT'
  | 'OUT_OF_SCOPE';

export interface TaxContext {
  /** Country from which the goods are supplied (the merchant's country). */
  sellerCountry: string;
  /** Destination (shipping) country — primary driver of the applicable rate. */
  destinationCountry: string;
  customerType: 'B2C' | 'B2B';
  /** Whether the B2B VAT number has been validated (format and ideally VIES). */
  vatNumberValid?: boolean;
  /** Stored prices already include tax at the seller's home rate. */
  pricesIncludeTax: boolean;
  /** Merchant registered for OSS (One-Stop-Shop). Defaults to true. */
  ossRegistered?: boolean;
}

export interface TaxLineInput {
  id: string;
  taxClass: string;
  /** Unit price in minor units (net or gross per `pricesIncludeTax`). */
  unitAmount: number;
  quantity: number;
  /** Total discount allocated to this line, expressed net of tax. */
  discountAmount?: number;
}

export interface TaxLineResult {
  id: string;
  taxClass: string;
  appliedRate: number;
  netUnit: number;
  netTotal: number;
  taxTotal: number;
  grossTotal: number;
  reverseCharge: boolean;
}

export interface TaxBreakdownEntry {
  rate: number;
  base: number;
  tax: number;
}

export interface TaxComputation {
  scenario: TaxScenario;
  reverseCharge: boolean;
  lines: TaxLineResult[];
  breakdown: TaxBreakdownEntry[];
  summary: { netTotal: number; taxTotal: number; grossTotal: number };
  notes: string[];
}

/** Resolves the VAT rate (basis points) for a country + tax class. */
export type RateResolver = (countryCode: string, taxClass: string) => number;

function roundCents(value: number): number {
  // Round half away from zero, the conventional rule for VAT amounts.
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** Classifies the transaction into a VAT scenario. */
export function determineScenario(ctx: TaxContext): TaxScenario {
  const seller = ctx.sellerCountry.toUpperCase();
  const dest = ctx.destinationCountry.toUpperCase();

  if (seller === dest) return 'DOMESTIC';

  const sellerEu = isEuCountry(seller);
  const destEu = isEuCountry(dest);

  if (sellerEu && destEu) {
    if (ctx.customerType === 'B2B' && ctx.vatNumberValid) return 'EU_B2B_REVERSE_CHARGE';
    return ctx.ossRegistered === false ? 'EU_B2C_ORIGIN' : 'EU_B2C_OSS';
  }
  if (sellerEu && !destEu) return 'EXPORT'; // zero-rated supply of goods
  return 'OUT_OF_SCOPE';
}

/** Country whose rate applies, plus whether VAT is charged at all. */
function rateCountryFor(scenario: TaxScenario, ctx: TaxContext): { country: string; charged: boolean } {
  switch (scenario) {
    case 'DOMESTIC':
      return { country: ctx.sellerCountry, charged: true };
    case 'EU_B2C_OSS':
      return { country: ctx.destinationCountry, charged: true };
    case 'EU_B2C_ORIGIN':
      return { country: ctx.sellerCountry, charged: true };
    case 'EU_B2B_REVERSE_CHARGE':
    case 'EXPORT':
    case 'OUT_OF_SCOPE':
      return { country: ctx.sellerCountry, charged: false };
  }
}

export function computeTax(
  lines: TaxLineInput[],
  ctx: TaxContext,
  resolveRate: RateResolver,
): TaxComputation {
  const scenario = determineScenario(ctx);
  const { country, charged } = rateCountryFor(scenario, ctx);
  const reverseCharge = scenario === 'EU_B2B_REVERSE_CHARGE';
  const notes: string[] = [];

  if (reverseCharge) {
    notes.push('Autoliquidation — TVA due par le preneur (art. 196 directive 2006/112/CE).');
  } else if (scenario === 'EXPORT') {
    notes.push('Exportation hors UE — exonération de TVA (art. 262 I du CGI).');
  } else if (scenario === 'EU_B2C_OSS') {
    notes.push('Vente à distance intra-UE — TVA du pays de destination (régime OSS).');
  } else if (scenario === 'OUT_OF_SCOPE') {
    notes.push('Opération hors champ — vérifier le régime applicable.');
  }

  const resultLines: TaxLineResult[] = lines.map((line) => {
    const appliedRate = charged ? resolveRate(country, line.taxClass) : 0;

    // Derive a canonical net unit price. When catalog prices include tax, strip
    // the seller's home-rate VAT once so the net base is stable across scenarios.
    let netUnit: number;
    if (ctx.pricesIncludeTax) {
      const homeRate = resolveRate(ctx.sellerCountry, line.taxClass);
      netUnit = roundCents((line.unitAmount * 10000) / (10000 + homeRate));
    } else {
      netUnit = line.unitAmount;
    }

    const discount = line.discountAmount ?? 0;
    const netTotal = Math.max(0, netUnit * line.quantity - discount);
    const taxTotal = roundCents((netTotal * appliedRate) / 10000);
    const grossTotal = netTotal + taxTotal;

    return {
      id: line.id,
      taxClass: line.taxClass,
      appliedRate,
      netUnit,
      netTotal,
      taxTotal,
      grossTotal,
      reverseCharge,
    };
  });

  // Aggregate a per-rate breakdown (required for invoices and e-reporting).
  const breakdownMap = new Map<number, TaxBreakdownEntry>();
  for (const l of resultLines) {
    const entry = breakdownMap.get(l.appliedRate) ?? { rate: l.appliedRate, base: 0, tax: 0 };
    entry.base += l.netTotal;
    entry.tax += l.taxTotal;
    breakdownMap.set(l.appliedRate, entry);
  }

  const summary = resultLines.reduce(
    (acc, l) => {
      acc.netTotal += l.netTotal;
      acc.taxTotal += l.taxTotal;
      acc.grossTotal += l.grossTotal;
      return acc;
    },
    { netTotal: 0, taxTotal: 0, grossTotal: 0 },
  );

  return {
    scenario,
    reverseCharge,
    lines: resultLines,
    breakdown: [...breakdownMap.values()].sort((a, b) => b.rate - a.rate),
    summary,
    notes,
  };
}

import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import {
  DEFAULT_TAX_RATES,
  VAT_NUMBER_PATTERNS,
  isEuCountry,
} from './tax.data';
import {
  computeTax,
  type RateResolver,
  type TaxComputation,
  type TaxContext,
  type TaxLineInput,
} from './tax.engine';

// --- Rate resolver (DB-backed with short-lived cache) -----------------------

interface RateCache {
  map: Map<string, number>;
  expiresAt: number;
}
let cache: RateCache | null = null;
const CACHE_TTL_MS = 60_000;

const key = (country: string, taxClass: string) => `${country.toUpperCase()}:${taxClass}`;

async function loadRateMap(): Promise<Map<string, number>> {
  if (cache && cache.expiresAt > Date.now()) return cache.map;

  const map = new Map<string, number>();
  // Seed with code defaults so the engine always has something to resolve.
  for (const r of DEFAULT_TAX_RATES) map.set(key(r.countryCode, r.taxClass), r.rate);

  try {
    const now = new Date();
    const rates = await prisma.taxRate.findMany({
      where: { validFrom: { lte: now }, OR: [{ validTo: null }, { validTo: { gt: now } }] },
    });
    for (const r of rates) map.set(key(r.countryCode, r.taxClass), r.rate);
  } catch (err) {
    logger.warn({ err }, 'Falling back to default tax rates (DB unavailable)');
  }

  cache = { map, expiresAt: Date.now() + CACHE_TTL_MS };
  return map;
}

export function invalidateRateCache(): void {
  cache = null;
}

/**
 * Builds a resolver: requested (country, class) → country STANDARD → 0.
 * Returning 0 (rather than throwing) keeps checkout resilient; an admin alert
 * should be raised separately when a country has no configured rate.
 */
export async function buildRateResolver(): Promise<RateResolver> {
  const map = await loadRateMap();
  return (country: string, taxClass: string): number => {
    const exact = map.get(key(country, taxClass));
    if (exact !== undefined) return exact;
    const std = map.get(key(country, 'STANDARD'));
    if (std !== undefined) return std;
    return 0;
  };
}

// --- VAT number validation --------------------------------------------------

export interface VatValidationResult {
  input: string;
  normalized: string;
  formatValid: boolean;
  viesChecked: boolean;
  valid: boolean;
}

/** Syntactic check against the per-country pattern table. */
export function validateVatNumberFormat(vat: string): VatValidationResult {
  const normalized = vat.replace(/[\s.-]/g, '').toUpperCase();
  const country = normalized.slice(0, 2);
  const pattern = VAT_NUMBER_PATTERNS[country];
  const formatValid = !!pattern && pattern.test(normalized) && isEuCountry(country);
  return { input: vat, normalized, formatValid, viesChecked: false, valid: formatValid };
}

/**
 * Authoritative validation via the EU VIES service. Network-guarded with a
 * timeout; on any failure we fall back to the format result so checkout never
 * hard-fails on a third-party outage (the order records `vatNumberValid`).
 */
export async function validateVatNumber(vat: string): Promise<VatValidationResult> {
  const base = validateVatNumberFormat(vat);
  if (!base.formatValid || env.isTest) return base;

  const country = base.normalized.slice(0, 2);
  const number = base.normalized.slice(2);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${country}/vat/${number}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);
    if (res.ok) {
      const body = (await res.json()) as { valid?: boolean };
      return { ...base, viesChecked: true, valid: !!body.valid };
    }
  } catch (err) {
    logger.warn({ err }, 'VIES check failed; using format-only validation');
  }
  return base;
}

// --- High-level tax quote ---------------------------------------------------

export interface QuoteInput {
  lines: TaxLineInput[];
  destinationCountry: string;
  customerType?: 'B2C' | 'B2B';
  vatNumber?: string | null;
}

/**
 * Computes a full tax breakdown for a set of lines and a destination. Used by
 * the cart/checkout services and exposed (read-only) for storefront previews.
 */
export async function quoteTax(input: QuoteInput): Promise<TaxComputation & { vatNumberValid: boolean }> {
  const customerType = input.customerType ?? 'B2C';
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

  const resolver = await buildRateResolver();
  return { ...computeTax(input.lines, ctx, resolver), vatNumberValid };
}

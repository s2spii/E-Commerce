/**
 * Reference tax data. These defaults seed the database and act as a safety-net
 * fallback. Rates DO change — the authoritative source at runtime is the
 * `TaxRate` table, editable from the admin panel (permission `tax:write`).
 *
 * Rates are expressed in basis points: 2000 = 20.00%.
 */

/** EU member states (ISO 3166-1 alpha-2). Used to classify cross-border flows. */
export const EU_COUNTRIES = new Set<string>([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

export function isEuCountry(code: string): boolean {
  return EU_COUNTRIES.has(code.toUpperCase());
}

export interface DefaultRate {
  countryCode: string;
  taxClass: string;
  name: string;
  rate: number;
  isDefault?: boolean;
}

/**
 * Standard-rate VAT per EU member state (indicative, maintain in DB).
 * A few reduced/zero classes are included for France to demonstrate tax classes.
 */
export const DEFAULT_TAX_RATES: DefaultRate[] = [
  // France — multiple classes
  { countryCode: 'FR', taxClass: 'STANDARD', name: 'TVA taux normal', rate: 2000, isDefault: true },
  { countryCode: 'FR', taxClass: 'REDUCED', name: 'TVA taux réduit', rate: 1000 },
  { countryCode: 'FR', taxClass: 'SUPER_REDUCED', name: 'TVA taux super réduit', rate: 550 },
  { countryCode: 'FR', taxClass: 'BOOKS', name: 'TVA livres', rate: 550 },
  { countryCode: 'FR', taxClass: 'ZERO', name: 'Exonéré', rate: 0 },

  // Other EU standard rates (indicative)
  { countryCode: 'DE', taxClass: 'STANDARD', name: 'Umsatzsteuer', rate: 1900, isDefault: true },
  { countryCode: 'BE', taxClass: 'STANDARD', name: 'BTW/TVA', rate: 2100, isDefault: true },
  { countryCode: 'ES', taxClass: 'STANDARD', name: 'IVA', rate: 2100, isDefault: true },
  { countryCode: 'IT', taxClass: 'STANDARD', name: 'IVA', rate: 2200, isDefault: true },
  { countryCode: 'NL', taxClass: 'STANDARD', name: 'BTW', rate: 2100, isDefault: true },
  { countryCode: 'LU', taxClass: 'STANDARD', name: 'TVA', rate: 1700, isDefault: true },
  { countryCode: 'IE', taxClass: 'STANDARD', name: 'VAT', rate: 2300, isDefault: true },
  { countryCode: 'PT', taxClass: 'STANDARD', name: 'IVA', rate: 2300, isDefault: true },
  { countryCode: 'AT', taxClass: 'STANDARD', name: 'USt', rate: 2000, isDefault: true },
  { countryCode: 'SE', taxClass: 'STANDARD', name: 'Moms', rate: 2500, isDefault: true },
  { countryCode: 'DK', taxClass: 'STANDARD', name: 'Moms', rate: 2500, isDefault: true },
  { countryCode: 'PL', taxClass: 'STANDARD', name: 'VAT', rate: 2300, isDefault: true },
];

/**
 * Per-country VAT identification number format checks. This is a syntactic
 * pre-screen only; authoritative validation MUST go through VIES (see
 * tax.service.ts → checkViesVatNumber).
 */
export const VAT_NUMBER_PATTERNS: Record<string, RegExp> = {
  FR: /^FR[A-Z0-9]{2}\d{9}$/,
  DE: /^DE\d{9}$/,
  BE: /^BE0\d{9}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  IT: /^IT\d{11}$/,
  NL: /^NL\d{9}B\d{2}$/,
  LU: /^LU\d{8}$/,
  IE: /^IE\d{7}[A-W]([A-I])?$/,
  PT: /^PT\d{9}$/,
  AT: /^ATU\d{8}$/,
  SE: /^SE\d{12}$/,
  DK: /^DK\d{8}$/,
  PL: /^PL\d{10}$/,
};

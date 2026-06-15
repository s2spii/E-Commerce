import { describe, expect, it } from 'vitest';
import {
  computeTax,
  determineScenario,
  type RateResolver,
  type TaxContext,
} from './tax.engine';

// Deterministic rate table for tests.
const rates: Record<string, number> = {
  'FR:STANDARD': 2000,
  'FR:BOOKS': 550,
  'FR:ZERO': 0,
  'DE:STANDARD': 1900,
  'ES:STANDARD': 2100,
};
const resolver: RateResolver = (c, cls) => rates[`${c}:${cls}`] ?? rates[`${c}:STANDARD`] ?? 0;

const baseCtx: TaxContext = {
  sellerCountry: 'FR',
  destinationCountry: 'FR',
  customerType: 'B2C',
  pricesIncludeTax: false,
};

describe('determineScenario', () => {
  it('detects a domestic sale', () => {
    expect(determineScenario(baseCtx)).toBe('DOMESTIC');
  });

  it('detects EU B2C distance selling (OSS)', () => {
    expect(determineScenario({ ...baseCtx, destinationCountry: 'DE' })).toBe('EU_B2C_OSS');
  });

  it('detects EU B2B reverse charge only with a valid VAT number', () => {
    expect(
      determineScenario({ ...baseCtx, destinationCountry: 'DE', customerType: 'B2B', vatNumberValid: true }),
    ).toBe('EU_B2B_REVERSE_CHARGE');
    expect(
      determineScenario({ ...baseCtx, destinationCountry: 'DE', customerType: 'B2B', vatNumberValid: false }),
    ).toBe('EU_B2C_OSS');
  });

  it('detects an export outside the EU', () => {
    expect(determineScenario({ ...baseCtx, destinationCountry: 'US' })).toBe('EXPORT');
  });
});

describe('computeTax — tax-exclusive pricing', () => {
  it('applies the domestic standard rate', () => {
    const r = computeTax([{ id: 'a', taxClass: 'STANDARD', unitAmount: 10000, quantity: 2 }], baseCtx, resolver);
    expect(r.summary.netTotal).toBe(20000);
    expect(r.summary.taxTotal).toBe(4000); // 20%
    expect(r.summary.grossTotal).toBe(24000);
    expect(r.reverseCharge).toBe(false);
  });

  it('applies a reduced rate per tax class', () => {
    const r = computeTax([{ id: 'b', taxClass: 'BOOKS', unitAmount: 2000, quantity: 1 }], baseCtx, resolver);
    expect(r.lines[0]!.appliedRate).toBe(550);
    expect(r.summary.taxTotal).toBe(110); // 5.5% of 20.00 = 1.10
  });

  it('uses the destination rate for EU B2C (OSS)', () => {
    const r = computeTax(
      [{ id: 'c', taxClass: 'STANDARD', unitAmount: 10000, quantity: 1 }],
      { ...baseCtx, destinationCountry: 'DE' },
      resolver,
    );
    expect(r.scenario).toBe('EU_B2C_OSS');
    expect(r.summary.taxTotal).toBe(1900); // German 19%
  });

  it('charges no VAT and flags reverse charge for valid EU B2B', () => {
    const r = computeTax(
      [{ id: 'd', taxClass: 'STANDARD', unitAmount: 10000, quantity: 1 }],
      { ...baseCtx, destinationCountry: 'DE', customerType: 'B2B', vatNumberValid: true },
      resolver,
    );
    expect(r.reverseCharge).toBe(true);
    expect(r.summary.taxTotal).toBe(0);
    expect(r.notes.some((n) => /autoliquidation/i.test(n))).toBe(true);
  });

  it('zero-rates exports outside the EU', () => {
    const r = computeTax(
      [{ id: 'e', taxClass: 'STANDARD', unitAmount: 10000, quantity: 1 }],
      { ...baseCtx, destinationCountry: 'US' },
      resolver,
    );
    expect(r.scenario).toBe('EXPORT');
    expect(r.summary.taxTotal).toBe(0);
  });

  it('applies discounts to the taxable base', () => {
    const r = computeTax(
      [{ id: 'f', taxClass: 'STANDARD', unitAmount: 10000, quantity: 1, discountAmount: 2000 }],
      baseCtx,
      resolver,
    );
    expect(r.summary.netTotal).toBe(8000);
    expect(r.summary.taxTotal).toBe(1600); // 20% of 80.00
  });
});

describe('computeTax — tax-inclusive pricing', () => {
  const incCtx: TaxContext = { ...baseCtx, pricesIncludeTax: true };

  it('strips the home VAT to recover a stable net base', () => {
    // 120.00 incl. 20% → net 100.00, tax 20.00
    const r = computeTax([{ id: 'g', taxClass: 'STANDARD', unitAmount: 12000, quantity: 1 }], incCtx, resolver);
    expect(r.summary.netTotal).toBe(10000);
    expect(r.summary.taxTotal).toBe(2000);
    expect(r.summary.grossTotal).toBe(12000);
  });

  it('a B2B reverse-charge buyer pays the net (VAT removed)', () => {
    const r = computeTax(
      [{ id: 'h', taxClass: 'STANDARD', unitAmount: 12000, quantity: 1 }],
      { ...incCtx, destinationCountry: 'DE', customerType: 'B2B', vatNumberValid: true },
      resolver,
    );
    expect(r.summary.netTotal).toBe(10000);
    expect(r.summary.taxTotal).toBe(0);
    expect(r.summary.grossTotal).toBe(10000);
  });
});

describe('computeTax — breakdown', () => {
  it('aggregates tax per applied rate', () => {
    const r = computeTax(
      [
        { id: 'i', taxClass: 'STANDARD', unitAmount: 10000, quantity: 1 },
        { id: 'j', taxClass: 'BOOKS', unitAmount: 2000, quantity: 1 },
      ],
      baseCtx,
      resolver,
    );
    expect(r.breakdown).toHaveLength(2);
    const standard = r.breakdown.find((b) => b.rate === 2000)!;
    expect(standard.base).toBe(10000);
    expect(standard.tax).toBe(2000);
  });
});

import { describe, expect, it } from 'vitest';
import { computeShipping } from './shipping';

describe('computeShipping', () => {
  it('charges a domestic flat rate below the free-shipping threshold', () => {
    expect(computeShipping('FR', 5000)).toBe(690);
  });

  it('is free domestically above the threshold', () => {
    expect(computeShipping('FR', 20000)).toBe(0);
  });

  it('charges more for EU destinations', () => {
    expect(computeShipping('DE', 5000)).toBe(1490);
    expect(computeShipping('DE', 30000)).toBe(0);
  });

  it('charges the rest-of-world rate outside the EU', () => {
    expect(computeShipping('US', 100000)).toBe(2490);
  });
});

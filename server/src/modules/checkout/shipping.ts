import { env } from '../../config/env';
import { isEuCountry } from '../tax/tax.data';

/**
 * Flat-rate shipping with free-shipping thresholds, by destination zone.
 * Amounts are in the same tax convention as catalog prices (minor units).
 * A real deployment would plug a carrier rate API here — kept deterministic
 * so checkout totals are predictable and testable.
 */
export function computeShipping(destinationCountry: string, netSubtotal: number): number {
  const dest = destinationCountry.toUpperCase();
  const home = env.TAX_HOME_COUNTRY.toUpperCase();

  if (dest === home) return netSubtotal >= 15000 ? 0 : 690; // free over 150€
  if (isEuCountry(dest)) return netSubtotal >= 25000 ? 0 : 1490;
  return 2490; // rest of world
}

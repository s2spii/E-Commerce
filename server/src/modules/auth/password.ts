import argon2 from 'argon2';
import { z } from 'zod';
import { env } from '../../config/env';

/**
 * Password hashing with Argon2id — the OWASP-recommended, memory-hard KDF.
 * Parameters are configurable via env so they can be tuned per deployment.
 */
const options: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: env.ARGON2_MEMORY_COST,
  timeCost: env.ARGON2_TIME_COST,
  parallelism: env.ARGON2_PARALLELISM,
};

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, options);
}

export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  // argon2.verify never throws on mismatch; it returns false. Guard anyway.
  return argon2.verify(hash, plain).catch(() => false);
}

/**
 * Password policy: length over complexity (NIST 800-63B). We require a
 * reasonable minimum length and screen out trivially weak passwords.
 */
const COMMON_PASSWORDS = new Set([
  'password', '12345678', 'azerty123', 'qwerty123', 'motdepasse', 'iloveyou',
  '123456789', 'password1', 'admin123', 'welcome1',
]);

export const passwordSchema = z
  .string()
  .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
  .max(128, 'Le mot de passe est trop long')
  .refine((v) => !COMMON_PASSWORDS.has(v.toLowerCase()), 'Ce mot de passe est trop courant')
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v), {
    message: 'Le mot de passe doit mêler minuscules, majuscules et chiffres',
  });

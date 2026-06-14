import { describe, expect, it } from 'vitest';
import { hashPassword, passwordSchema, verifyPassword } from './password';

describe('password hashing', () => {
  it('produces an argon2id hash that verifies', async () => {
    const hash = await hashPassword('Sup3rSecret!Phrase');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'Sup3rSecret!Phrase')).toBe(true);
  });

  it('rejects an incorrect password without throwing', async () => {
    const hash = await hashPassword('Sup3rSecret!Phrase');
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });

  it('never throws on a malformed hash', async () => {
    expect(await verifyPassword('not-a-hash', 'whatever')).toBe(false);
  });
});

describe('password policy', () => {
  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Sup3rSecret!Phrase').success).toBe(true);
  });

  it('rejects short passwords', () => {
    expect(passwordSchema.safeParse('Ab1cdef').success).toBe(false);
  });

  it('rejects common passwords', () => {
    expect(passwordSchema.safeParse('password').success).toBe(false);
  });

  it('requires mixed character classes', () => {
    expect(passwordSchema.safeParse('alllowercaseletters').success).toBe(false);
  });
});

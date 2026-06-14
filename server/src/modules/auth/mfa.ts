import crypto from 'crypto';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { env } from '../../config/env';

/**
 * TOTP-based multi-factor authentication (RFC 6238), compatible with Google
 * Authenticator, Authy, 1Password, etc. Mandatory for any account that holds
 * administrative permissions (enforced in the auth flow).
 */
authenticator.options = { window: 1 }; // tolerate ±1 step for clock drift

export function generateMfaSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl(secret: string, accountEmail: string): string {
  return authenticator.keyuri(accountEmail, env.MFA_ISSUER, secret);
}

export async function buildQrDataUrl(otpauthUrl: string): Promise<string> {
  return qrcode.toDataURL(otpauthUrl);
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s/g, ''), secret });
  } catch {
    return false;
  }
}

/**
 * One-time recovery codes for when the authenticator device is lost. We return
 * the plaintext codes once (to show the user) and their hashes (to store).
 */
export function generateRecoveryCodes(count = 10): { plain: string[]; hashed: string[] } {
  const plain: string[] = [];
  const hashed: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = `${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(4).toString('hex')}`;
    plain.push(code);
    hashed.push(crypto.createHash('sha256').update(code).digest('hex'));
  }
  return { plain, hashed };
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface AccessTokenPayload {
  sub: string; // user id
  role: string; // role name
  type: 'access';
}

/**
 * Short-lived stateless access token (JWT). Authorization is re-derived from
 * the database on each request (see auth middleware) so role/permission changes
 * and account deactivation take effect immediately despite the JWT being valid.
 */
export function signAccessToken(userId: string, roleName: string): string {
  const payload: AccessTokenPayload = { sub: userId, role: roleName, type: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
    issuer: 'maison-luma',
    audience: 'maison-luma-api',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'maison-luma',
    audience: 'maison-luma-api',
  }) as AccessTokenPayload;
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded;
}

/**
 * Refresh tokens are opaque random strings. Only their SHA-256 hash is stored,
 * so a database leak cannot be used to mint sessions. Tokens are rotated on
 * every use and grouped into a "family" to detect replay/theft.
 */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function newTokenFamily(): string {
  return crypto.randomUUID();
}

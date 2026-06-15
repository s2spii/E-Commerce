import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ForbiddenError } from '../lib/errors';

/**
 * Stateless CSRF protection using the double-submit-cookie pattern.
 *
 * - Issues a JS-readable `csrf_token` cookie so the SPA can echo it back.
 * - For state-changing methods that rely on ambient cookie auth, the request
 *   must carry an `x-csrf-token` header equal to the cookie. A cross-site
 *   attacker can neither read the cookie (same-origin policy) nor set a custom
 *   header, so forged requests are rejected.
 * - Requests authenticated with `Authorization: Bearer` (non-browser clients)
 *   are exempt — they are not subject to ambient-credential CSRF.
 *
 * This complements the SameSite cookie attributes already in place (defense in
 * depth).
 */
const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function newCsrfToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** Constant-time comparison of the submitted CSRF token against the cookie. */
function verifyCsrfToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};

  // Ensure a CSRF cookie exists so the client can read and resubmit it.
  if (!cookies[CSRF_COOKIE]) {
    const token = newCsrfToken();
    res.cookie('csrf_token', token, {
      httpOnly: false, // must be readable by the SPA for the double submit
      secure: env.isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    cookies[CSRF_COOKIE] = token;
  }

  // Safe methods and bearer-token (API) clients don't need the CSRF check.
  const isBearer = req.headers.authorization?.startsWith('Bearer ') ?? false;
  if (SAFE_METHODS.has(req.method) || isBearer) {
    next();
    return;
  }

  if (!verifyCsrfToken(cookies[CSRF_COOKIE], req.get(CSRF_HEADER))) {
    next(new ForbiddenError('Jeton CSRF manquant ou invalide'));
    return;
  }
  next();
}

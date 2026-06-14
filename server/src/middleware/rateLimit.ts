import rateLimit, { type Options } from 'express-rate-limit';
import { TooManyRequestsError } from '../lib/errors';

/**
 * Rate limiting. The defaults below use an in-memory store, which is correct for
 * a single instance. For horizontally-scaled deployments, inject a shared store
 * (e.g. `rate-limit-redis` backed by the Redis client in lib/redis.ts) so limits
 * are enforced cluster-wide. The factory keeps that swap to one place.
 */
function makeLimiter(opts: Partial<Options> & { windowMs: number; limit: number }) {
  return rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: () => {
      throw new TooManyRequestsError();
    },
    ...opts,
  });
}

/** Generous global limiter to blunt scraping / abuse. */
export const globalLimiter = makeLimiter({ windowMs: 60_000, limit: 300 });

/** Strict limiter for credential endpoints (brute-force protection). */
export const authLimiter = makeLimiter({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
});

/** Very strict limiter for password reset / MFA challenge endpoints. */
export const sensitiveLimiter = makeLimiter({ windowMs: 60 * 60_000, limit: 5 });

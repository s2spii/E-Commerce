import type { NextFunction, Request, Response } from 'express';
import { SUPER_ADMIN_ROLE, type PermissionKey } from '../config/permissions';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type { AuthContext } from '../types/express';
import { verifyAccessToken } from '../modules/auth/tokens';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  // Fall back to an HttpOnly cookie for browser sessions.
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.access_token;
  return cookie ?? null;
}

/**
 * Resolves the principal from the access token, then RE-DERIVES authorization
 * from the database (role + permissions, active flag). This makes revocation,
 * deactivation and role changes effective immediately, not only after the JWT
 * expires.
 */
async function resolveAuth(req: Request): Promise<AuthContext | null> {
  const token = extractToken(req);
  if (!token) return null;

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      isActive: true,
      role: {
        select: {
          name: true,
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
    },
  });

  if (!user || !user.isActive) return null;

  const isSuperAdmin = user.role.name === SUPER_ADMIN_ROLE;
  const permissions = new Set(user.role.permissions.map((rp) => rp.permission.key));

  return {
    userId: user.id,
    email: user.email,
    roleName: user.role.name,
    permissions,
    isSuperAdmin,
  };
}

/** Hard gate: 401 if there is no valid, active principal. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  resolveAuth(req)
    .then((ctx) => {
      if (!ctx) throw new UnauthorizedError();
      req.auth = ctx;
      next();
    })
    .catch(next);
}

/** Soft gate: attaches req.auth when present, but never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  resolveAuth(req)
    .then((ctx) => {
      if (ctx) req.auth = ctx;
      next();
    })
    .catch(() => next());
}

/**
 * Authorization guard. Must run after `authenticate`. SUPER_ADMIN bypasses the
 * check; everyone else must hold every requested permission.
 */
export function requirePermission(...required: PermissionKey[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new UnauthorizedError());
      return;
    }
    if (req.auth.isSuperAdmin) {
      next();
      return;
    }
    const missing = required.filter((p) => !req.auth!.permissions.has(p));
    if (missing.length > 0) {
      next(new ForbiddenError(`Missing permission(s): ${missing.join(', ')}`));
      return;
    }
    next();
  };
}

import type { CookieOptions, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../lib/errors';
import { passwordSchema } from './password';
import * as authService from './auth.service';

// --- Validation schemas ------------------------------------------------------

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaToken: z.string().min(6).max(20).optional(),
});

export const mfaEnableSchema = z.object({ token: z.string().min(6).max(10) });
export const mfaDisableSchema = z.object({ password: z.string().min(1) });

// --- Cookie helpers ----------------------------------------------------------

const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: env.isProd, // HTTPS-only in production
  sameSite: 'lax',
  signed: true,
};

function setAuthCookies(res: Response, tokens: authService.TokenBundle): void {
  res.cookie('access_token', tokens.accessToken, {
    ...baseCookie,
    maxAge: env.JWT_ACCESS_TTL * 1000,
  });
  res.cookie('refresh_token', tokens.refreshToken, {
    ...baseCookie,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: env.JWT_REFRESH_TTL * 1000,
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', { ...baseCookie });
  res.clearCookie('refresh_token', { ...baseCookie, sameSite: 'strict', path: '/api/auth' });
}

function reqMeta(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

function readRefreshToken(req: Request): string {
  const fromCookie = req.signedCookies?.refresh_token as string | undefined;
  const fromBody = (req.body?.refreshToken as string | undefined) ?? undefined;
  const token = fromCookie ?? fromBody;
  if (!token) throw new UnauthorizedError('Refresh token manquant');
  return token;
}

// --- Handlers ----------------------------------------------------------------

export async function register(req: Request, res: Response): Promise<void> {
  const user = await authService.register(req.body);
  res.status(201).json({ data: user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body, reqMeta(req));
  if (result.status === 'mfa_required') {
    res.status(200).json({ data: { mfaRequired: true } });
    return;
  }
  setAuthCookies(res, result.tokens!);
  res.status(200).json({
    data: {
      accessToken: result.tokens!.accessToken,
      expiresIn: result.tokens!.expiresIn,
      mustEnableMfa: result.mustEnableMfa ?? false,
    },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const tokens = await authService.refresh(readRefreshToken(req), reqMeta(req));
  setAuthCookies(res, tokens);
  res.status(200).json({ data: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn } });
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    await authService.logout(readRefreshToken(req));
  } catch {
    /* idempotent logout */
  }
  clearAuthCookies(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  const profile = await authService.getProfile(req.auth!.userId);
  res.json({ data: profile });
}

export async function setupMfa(req: Request, res: Response): Promise<void> {
  const data = await authService.beginMfaSetup(req.auth!.userId);
  res.json({ data });
}

export async function enableMfa(req: Request, res: Response): Promise<void> {
  const data = await authService.enableMfa(req.auth!.userId, req.body.token);
  res.json({ data });
}

export async function disableMfa(req: Request, res: Response): Promise<void> {
  await authService.disableMfa(req.auth!.userId, req.body.password);
  res.status(204).send();
}

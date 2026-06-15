import type { CookieOptions, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import * as cart from './cart.service';

export const addItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});
export const updateItemSchema = z.object({ quantity: z.coerce.number().int().min(0).max(99) });
export const couponSchema = z.object({ code: z.string().min(1).max(64) });
export const cartContextQuery = z.object({
  country: z.string().length(2).optional(),
  customerType: z.enum(['B2C', 'B2B']).optional(),
  vatNumber: z.string().max(20).optional(),
});

const CART_COOKIE = 'cart_token';
const cookieOpts: CookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  signed: true,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

function getToken(req: Request): string | undefined {
  return req.signedCookies?.[CART_COOKIE];
}
function setToken(res: Response, token: string): void {
  res.cookie(CART_COOKIE, token, cookieOpts);
}
function ctxFromQuery(req: Request): cart.CartContextInput {
  const q = req.query as { country?: string; customerType?: 'B2C' | 'B2B'; vatNumber?: string };
  return { destinationCountry: q.country, customerType: q.customerType, vatNumber: q.vatNumber };
}

export async function getCart(req: Request, res: Response): Promise<void> {
  const created = await cart.getOrCreateCart(getToken(req), req.auth?.userId);
  setToken(res, created.token);
  res.json({ data: await cart.summarizeCart(created.token, ctxFromQuery(req)) });
}

export async function addItem(req: Request, res: Response): Promise<void> {
  const created = await cart.getOrCreateCart(getToken(req), req.auth?.userId);
  setToken(res, created.token);
  await cart.addItem(created.token, req.auth?.userId, req.body.variantId, req.body.quantity);
  res.status(201).json({ data: await cart.summarizeCart(created.token, ctxFromQuery(req)) });
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  const created = await cart.getOrCreateCart(getToken(req), req.auth?.userId);
  setToken(res, created.token);
  await cart.setItemQuantity(created.token, req.params.variantId!, req.body.quantity);
  res.json({ data: await cart.summarizeCart(created.token, ctxFromQuery(req)) });
}

export async function removeItem(req: Request, res: Response): Promise<void> {
  const created = await cart.getOrCreateCart(getToken(req), req.auth?.userId);
  setToken(res, created.token);
  await cart.removeItem(created.token, req.params.variantId!);
  res.json({ data: await cart.summarizeCart(created.token, ctxFromQuery(req)) });
}

export async function applyCoupon(req: Request, res: Response): Promise<void> {
  const created = await cart.getOrCreateCart(getToken(req), req.auth?.userId);
  setToken(res, created.token);
  await cart.setCoupon(created.token, req.body.code);
  res.json({ data: await cart.summarizeCart(created.token, ctxFromQuery(req)) });
}

export async function removeCoupon(req: Request, res: Response): Promise<void> {
  const token = getToken(req);
  if (token) await cart.setCoupon(token, null);
  res.json({ data: token ? await cart.summarizeCart(token, ctxFromQuery(req)) : null });
}

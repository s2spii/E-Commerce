import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../lib/errors';
import { recordAudit } from '../../middleware/audit';
import * as orders from './orders.service';

const addressSchema = z.object({
  fullName: z.string().min(2).max(120),
  company: z.string().max(120).optional(),
  line1: z.string().min(2).max(160),
  line2: z.string().max(160).optional(),
  city: z.string().min(1).max(120),
  region: z.string().max(120).optional(),
  postalCode: z.string().min(2).max(20),
  countryCode: z.string().length(2),
  phone: z.string().max(40).optional(),
});

export const createOrderSchema = z.object({
  email: z.string().email().optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  customerType: z.enum(['B2C', 'B2B']).optional(),
  vatNumber: z.string().max(20).optional(),
});

export const refundSchema = z.object({
  amount: z.coerce.number().int().positive(),
  reason: z.string().max(500).optional(),
});

export const statusSchema = z.object({
  status: z.enum(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED']),
});

export const returnSchema = z.object({
  reason: z.string().max(500).optional(),
  items: z.array(z.object({ orderItemId: z.string(), quantity: z.coerce.number().int().positive() })).default([]),
});

export const adminOrdersQuery = z.object({
  status: z
    .enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const returnStatusSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED']) });

// --- Customer ----------------------------------------------------------------

export async function checkout(req: Request, res: Response): Promise<void> {
  const cartToken = req.signedCookies?.cart_token as string | undefined;
  if (!cartToken) throw new BadRequestError('Votre panier est vide');
  const order = await orders.createOrderFromCart(cartToken, req.body, req.auth!.userId);
  await recordAudit(req, { action: 'order.create', entityType: 'Order', entityId: order.id, metadata: { number: order.number, total: order.grandTotal } });
  res.status(201).json({ data: order });
}

export async function payOrder(req: Request, res: Response): Promise<void> {
  // Demo-only capture. Production uses a verified Stripe webhook.
  const order = await orders.getOrderForUser(req.params.id!, { userId: req.auth!.userId, canReadAll: false });
  await orders.markOrderPaid(order.id);
  await recordAudit(req, { action: 'order.pay.simulated', entityType: 'Order', entityId: order.id });
  res.json({ data: { id: order.id, status: 'PAID' } });
}

export async function listMyOrders(req: Request, res: Response): Promise<void> {
  res.json({ data: await orders.listOrdersForUser(req.auth!.userId) });
}

export async function getMyOrder(req: Request, res: Response): Promise<void> {
  const canReadAll = req.auth!.isSuperAdmin || req.auth!.permissions.has('order:read');
  res.json({ data: await orders.getOrderForUser(req.params.id!, { userId: req.auth!.userId, canReadAll }) });
}

export async function createReturn(req: Request, res: Response): Promise<void> {
  const ret = await orders.createReturnRequest(req.params.id!, req.auth!.userId, req.body.reason, req.body.items);
  await recordAudit(req, { action: 'return.request', entityType: 'Order', entityId: req.params.id });
  res.status(201).json({ data: ret });
}

// --- Admin -------------------------------------------------------------------

export async function adminList(req: Request, res: Response): Promise<void> {
  res.json({ data: await orders.adminListOrders(req.query as unknown as { status?: never; page: number; pageSize: number }) });
}

export async function adminGet(req: Request, res: Response): Promise<void> {
  res.json({ data: await orders.getOrderForUser(req.params.id!, { userId: req.auth!.userId, canReadAll: true }) });
}

export async function adminUpdateStatus(req: Request, res: Response): Promise<void> {
  if (req.body.status === 'PAID') await orders.markOrderPaid(req.params.id!);
  else await orders.updateOrderStatus(req.params.id!, req.body.status);
  await recordAudit(req, { action: 'order.status', entityType: 'Order', entityId: req.params.id, metadata: { status: req.body.status } });
  res.json({ data: { id: req.params.id, status: req.body.status } });
}

export async function adminRefund(req: Request, res: Response): Promise<void> {
  await orders.refundOrder(req.params.id!, req.body.amount, req.body.reason, req.auth!.userId);
  await recordAudit(req, { action: 'order.refund', entityType: 'Order', entityId: req.params.id, metadata: { amount: req.body.amount } });
  res.json({ data: { id: req.params.id } });
}

export async function adminUpdateReturn(req: Request, res: Response): Promise<void> {
  const ret = await orders.updateReturnStatus(req.params.id!, req.body.status);
  await recordAudit(req, { action: 'return.update', entityType: 'ReturnRequest', entityId: req.params.id, metadata: { status: req.body.status } });
  res.json({ data: ret });
}

export const schemas = { returnStatusSchema };

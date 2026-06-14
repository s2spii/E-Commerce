import type { Request, Response } from 'express';
import { z } from 'zod';
import { recordAudit } from '../../middleware/audit';
import * as promotions from './promotions.service';

export const couponSchema = z.object({
  code: z.string().min(2).max(64),
  description: z.string().max(240).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().int().positive(),
  minSubtotal: z.coerce.number().int().nonnegative().optional(),
  maxRedemptions: z.coerce.number().int().positive().nullable().optional(),
  perUserLimit: z.coerce.number().int().min(0).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export async function create(req: Request, res: Response): Promise<void> {
  const coupon = await promotions.createCoupon(req.body);
  await recordAudit(req, { action: 'promotion.create', entityType: 'Coupon', entityId: coupon.id, metadata: { code: coupon.code } });
  res.status(201).json({ data: coupon });
}

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ data: await promotions.listCoupons() });
}

import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';

export interface CouponEvaluation {
  couponId: string;
  code: string;
  discountAmount: number; // minor units, applied to the net subtotal
}

/**
 * Validates a coupon against the current subtotal and usage rules, returning the
 * discount it would grant. Throws a 4xx with a clear reason when not applicable.
 */
export async function evaluateCoupon(
  code: string,
  subtotalExclTax: number,
  userId?: string | null,
): Promise<CouponEvaluation> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
  if (!coupon || !coupon.isActive) throw new NotFoundError('Code promo invalide');

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestError('Ce code promo n’est pas encore actif');
  if (coupon.endsAt && coupon.endsAt < now) throw new BadRequestError('Ce code promo a expiré');
  if (coupon.maxRedemptions !== null && coupon.timesRedeemed >= coupon.maxRedemptions) {
    throw new BadRequestError('Ce code promo a atteint sa limite d’utilisation');
  }
  if (subtotalExclTax < coupon.minSubtotal) {
    throw new BadRequestError('Le montant minimum pour ce code promo n’est pas atteint');
  }
  if (userId && coupon.perUserLimit > 0) {
    const used = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId } });
    if (used >= coupon.perUserLimit) throw new BadRequestError('Vous avez déjà utilisé ce code promo');
  }

  const discountAmount =
    coupon.type === 'PERCENTAGE'
      ? Math.min(subtotalExclTax, Math.round((subtotalExclTax * coupon.value) / 10000))
      : Math.min(subtotalExclTax, coupon.value);

  return { couponId: coupon.id, code: coupon.code, discountAmount };
}

/** Records a redemption; call inside the order-creation transaction. */
export async function redeemCoupon(
  tx: Prisma.TransactionClient,
  couponId: string,
  userId: string | null,
  orderId: string,
): Promise<void> {
  await tx.coupon.update({ where: { id: couponId }, data: { timesRedeemed: { increment: 1 } } });
  await tx.couponRedemption.create({ data: { couponId, userId, orderId } });
}

// --- Admin CRUD --------------------------------------------------------------

export interface CouponInput {
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minSubtotal?: number;
  maxRedemptions?: number | null;
  perUserLimit?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export async function createCoupon(input: CouponInput) {
  return prisma.coupon.create({
    data: {
      code: input.code.toUpperCase().trim(),
      description: input.description,
      type: input.type,
      value: input.value,
      minSubtotal: input.minSubtotal ?? 0,
      maxRedemptions: input.maxRedemptions ?? null,
      perUserLimit: input.perUserLimit ?? 1,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      isActive: input.isActive ?? true,
    },
  });
}

export async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
}

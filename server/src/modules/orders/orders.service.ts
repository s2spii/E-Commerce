import { Prisma, type OrderStatus } from '@prisma/client';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { priceCheckout, type PricingLine } from '../checkout/pricing';
import { computeShipping } from '../checkout/shipping';
import { redeemCoupon, evaluateCoupon } from '../promotions/promotions.service';

export interface AddressInput {
  fullName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
}

export interface CreateOrderInput {
  email?: string;
  shippingAddress: AddressInput;
  billingAddress?: AddressInput;
  customerType?: 'B2C' | 'B2B';
  vatNumber?: string;
}

async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const number = `LUMA-${year}-${rand}`;
    const clash = await tx.order.findUnique({ where: { number }, select: { id: true } });
    if (!clash) return number;
  }
  throw new Error('Could not allocate an order number');
}

/**
 * Converts a cart into an order: re-prices server-side (never trust the client),
 * verifies and reserves stock, snapshots line/tax data for the invoice, redeems
 * the coupon, and opens a pending payment — all atomically.
 */
export async function createOrderFromCart(
  cartToken: string,
  input: CreateOrderInput,
  userId?: string,
): Promise<{ id: string; number: string; grandTotal: number; status: OrderStatus }> {
  const cart = await prisma.cart.findUnique({
    where: { token: cartToken },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!cart || cart.items.length === 0) throw new BadRequestError('Votre panier est vide');
  if (cart.status !== 'ACTIVE') throw new BadRequestError('Ce panier a déjà été utilisé');

  const billing = input.billingAddress ?? input.shippingAddress;
  const destination = input.shippingAddress.countryCode.toUpperCase();

  const lines: PricingLine[] = cart.items.map((item) => ({
    id: item.id,
    ref: item.variantId,
    taxClass: item.variant.product.taxClass,
    unitAmount: item.variant.price,
    quantity: item.quantity,
  }));

  // Price once without shipping to learn the net subtotal, then with shipping.
  const preview = await priceCheckout({
    lines,
    destinationCountry: destination,
    customerType: input.customerType,
    vatNumber: input.vatNumber,
    couponCode: cart.couponCode,
    userId: cart.userId,
  });
  const shippingAmount = computeShipping(destination, preview.subtotalExclTax);

  const pricing = await priceCheckout({
    lines,
    destinationCountry: destination,
    customerType: input.customerType,
    vatNumber: input.vatNumber,
    couponCode: cart.couponCode,
    userId: cart.userId,
    shippingAmount,
  });

  const email = input.email ?? (userId ? (await prisma.user.findUnique({ where: { id: userId } }))?.email : undefined);
  if (!email) throw new BadRequestError('Une adresse e-mail est requise');

  const order = await prisma.$transaction(async (tx) => {
    // Re-verify stock under the transaction to prevent oversell.
    for (const item of cart.items) {
      const fresh = await tx.productVariant.findUnique({ where: { id: item.variantId } });
      if (!fresh || fresh.stock < item.quantity) {
        throw new BadRequestError(`Stock insuffisant pour ${item.variant.product.name}`);
      }
    }

    const number = await generateOrderNumber(tx);
    const created = await tx.order.create({
      data: {
        number,
        userId: userId ?? null,
        email,
        status: 'PENDING',
        customerType: input.customerType ?? 'B2C',
        vatNumber: input.vatNumber,
        vatNumberValid: pricing.vatNumberValid,
        reverseCharge: pricing.reverseCharge,
        shippingAddress: input.shippingAddress as unknown as object,
        billingAddress: billing as unknown as object,
        currency: cart.currency,
        subtotalExclTax: pricing.subtotalExclTax,
        discountTotal: pricing.discountTotal,
        shippingExclTax: pricing.shippingExclTax,
        taxTotal: pricing.taxTotal,
        grandTotal: pricing.grandTotal,
        taxBreakdown: pricing.taxBreakdown as unknown as object,
        couponCode: pricing.coupon?.code,
        items: {
          create: cart.items.map((item) => {
            const line = pricing.lines.find((l) => l.ref === item.variantId)!;
            return {
              variantId: item.variantId,
              productName: item.variant.product.name,
              variantName: item.variant.name,
              sku: item.variant.sku,
              quantity: item.quantity,
              unitPriceExclTax: line.netUnit,
              taxClass: item.variant.product.taxClass,
              taxRate: line.appliedRate,
              taxAmount: line.taxTotal,
              discountAmount: line.discount,
              lineTotalExclTax: line.netTotal,
              lineTotalInclTax: line.grossTotal,
            };
          }),
        },
        payments: {
          create: { provider: 'stripe', amount: pricing.grandTotal, currency: cart.currency, status: 'PENDING' },
        },
      },
    });

    // Reserve stock and record movements.
    for (const item of cart.items) {
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
      await tx.stockMovement.create({ data: { variantId: item.variantId, delta: -item.quantity, reason: 'SALE', reference: number } });
    }

    // Redeem coupon (re-validate inside the tx for correctness).
    if (cart.couponCode) {
      try {
        const ev = await evaluateCoupon(cart.couponCode, pricing.subtotalExclTax, cart.userId);
        await redeemCoupon(tx, ev.couponId, cart.userId, created.id);
      } catch {
        /* coupon became invalid between preview and commit — order proceeds without it */
      }
    }

    await tx.cart.update({ where: { id: cart.id }, data: { status: 'CONVERTED' } });
    return created;
  });

  return { id: order.id, number: order.number, grandTotal: order.grandTotal, status: order.status };
}

/**
 * Simulates a successful payment capture. In production this is driven by a
 * verified Stripe webhook (see payments docs) — never by a client call.
 */
export async function markOrderPaid(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Commande introuvable');
    if (order.status !== 'PENDING') return;
    await tx.order.update({ where: { id: orderId }, data: { status: 'PAID', placedAt: new Date() } });
    await tx.payment.updateMany({ where: { orderId }, data: { status: 'CAPTURED' } });
    await tx.shipment.create({ data: { orderId, status: 'PREPARING' } });
  });
}

export async function getOrderForUser(orderId: string, auth: { userId: string; canReadAll: boolean }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true, shipments: true, refunds: true, returns: true },
  });
  if (!order) throw new NotFoundError('Commande introuvable');
  if (!auth.canReadAll && order.userId !== auth.userId) throw new ForbiddenError();
  return order;
}

export async function listOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, number: true, status: true, grandTotal: true, currency: true, createdAt: true },
  });
}

// --- Admin -------------------------------------------------------------------

export async function adminListOrders(filters: { status?: OrderStatus; page: number; pageSize: number }) {
  const where: Prisma.OrderWhereInput = {};
  if (filters.status) where.status = filters.status;
  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      select: { id: true, number: true, email: true, status: true, grandTotal: true, currency: true, createdAt: true },
    }),
  ]);
  return { items, pagination: { page: filters.page, pageSize: filters.pageSize, total, pages: Math.ceil(total / filters.pageSize) } };
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED', 'PARTIALLY_REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ['REFUNDED'],
};

export async function updateOrderStatus(orderId: string, next: OrderStatus): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Commande introuvable');
  if (!ALLOWED_TRANSITIONS[order.status].includes(next)) {
    throw new BadRequestError(`Transition ${order.status} → ${next} non autorisée`);
  }
  await prisma.order.update({ where: { id: orderId }, data: { status: next } });
}

export async function refundOrder(orderId: string, amount: number, reason: string | undefined, actorId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { refunds: true } });
    if (!order) throw new NotFoundError('Commande introuvable');
    const alreadyRefunded = order.refunds.reduce((a, r) => a + r.amount, 0);
    if (amount <= 0 || alreadyRefunded + amount > order.grandTotal) {
      throw new BadRequestError('Montant de remboursement invalide');
    }
    await tx.refund.create({ data: { orderId, amount, reason, createdById: actorId } });
    const totalRefunded = alreadyRefunded + amount;
    await tx.order.update({
      where: { id: orderId },
      data: { status: totalRefunded >= order.grandTotal ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
    });
    if (totalRefunded >= order.grandTotal) {
      await tx.payment.updateMany({ where: { orderId }, data: { status: 'REFUNDED' } });
    }
  });
}

export async function createReturnRequest(orderId: string, userId: string, reason: string | undefined, items: unknown[]) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) throw new NotFoundError('Commande introuvable');
  return prisma.returnRequest.create({ data: { orderId, reason, items: items as object } });
}

export async function updateReturnStatus(returnId: string, status: 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED') {
  return prisma.returnRequest.update({ where: { id: returnId }, data: { status } });
}

import crypto from 'crypto';
import { env } from '../../config/env';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { priceCheckout, type PricingLine } from '../checkout/pricing';

const cartInclude = {
  items: {
    include: {
      variant: {
        include: { product: { select: { name: true, slug: true, taxClass: true, images: { take: 1, orderBy: { position: 'asc' as const } } } } },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies object;

export function newCartToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export async function getOrCreateCart(token: string | undefined, userId?: string) {
  if (token) {
    const existing = await prisma.cart.findUnique({ where: { token }, include: cartInclude });
    if (existing && existing.status === 'ACTIVE') {
      // Attach to the user on login if it was anonymous.
      if (userId && !existing.userId) {
        return prisma.cart.update({ where: { id: existing.id }, data: { userId }, include: cartInclude });
      }
      return existing;
    }
  }
  const created = await prisma.cart.create({
    data: { token: newCartToken(), userId: userId ?? null },
    include: cartInclude,
  });
  return created;
}

export async function loadCart(token: string) {
  const cart = await prisma.cart.findUnique({ where: { token }, include: cartInclude });
  if (!cart) throw new NotFoundError('Panier introuvable');
  return cart;
}

export async function addItem(token: string, userId: string | undefined, variantId: string, quantity: number) {
  const cart = await getOrCreateCart(token, userId);
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || !variant.isActive) throw new NotFoundError('Article indisponible');

  const existing = cart.items.find((i) => i.variantId === variantId);
  const targetQty = (existing?.quantity ?? 0) + quantity;
  if (targetQty > variant.stock) throw new BadRequestError('Stock insuffisant pour cet article');

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity },
    update: { quantity: targetQty },
  });
  return loadCart(cart.token);
}

export async function setItemQuantity(token: string, variantId: string, quantity: number) {
  const cart = await loadCart(token);
  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
    return loadCart(token);
  }
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new NotFoundError('Article introuvable');
  if (quantity > variant.stock) throw new BadRequestError('Stock insuffisant');
  await prisma.cartItem.update({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    data: { quantity },
  });
  return loadCart(token);
}

export async function removeItem(token: string, variantId: string) {
  const cart = await loadCart(token);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  return loadCart(token);
}

export async function setCoupon(token: string, code: string | null) {
  const cart = await loadCart(token);
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: code ? code.toUpperCase().trim() : null } });
  return loadCart(token);
}

export interface CartContextInput {
  destinationCountry?: string;
  customerType?: 'B2C' | 'B2B';
  vatNumber?: string | null;
}

/** Cart + live pricing (subtotal, discount, VAT, total) for the storefront. */
export async function summarizeCart(token: string, ctx: CartContextInput = {}) {
  const cart = await loadCart(token);

  const lines: PricingLine[] = cart.items.map((item) => ({
    id: item.id,
    ref: item.variantId,
    taxClass: item.variant.product.taxClass,
    unitAmount: item.variant.price,
    quantity: item.quantity,
  }));

  const pricing = cart.items.length
    ? await priceCheckout({
        lines,
        destinationCountry: ctx.destinationCountry ?? env.TAX_HOME_COUNTRY,
        customerType: ctx.customerType,
        vatNumber: ctx.vatNumber,
        couponCode: cart.couponCode,
        userId: cart.userId,
      })
    : null;

  return {
    token: cart.token,
    couponCode: cart.couponCode,
    items: cart.items.map((item) => {
      const line = pricing?.lines.find((l) => l.id === item.id);
      return {
        id: item.id,
        variantId: item.variantId,
        sku: item.variant.sku,
        name: item.variant.product.name,
        slug: item.variant.product.slug,
        variantName: item.variant.name,
        image: item.variant.product.images[0]?.url ?? null,
        unitPrice: item.variant.price,
        quantity: item.quantity,
        lineTotalInclTax: line?.grossTotal ?? item.variant.price * item.quantity,
      };
    }),
    totals: pricing
      ? {
          subtotalExclTax: pricing.subtotalExclTax,
          discountTotal: pricing.discountTotal,
          taxTotal: pricing.taxTotal,
          grandTotal: pricing.grandTotal,
          taxBreakdown: pricing.taxBreakdown,
          reverseCharge: pricing.reverseCharge,
        }
      : { subtotalExclTax: 0, discountTotal: 0, taxTotal: 0, grandTotal: 0, taxBreakdown: [], reverseCharge: false },
    couponError: pricing?.couponError,
    currency: cart.currency,
  };
}

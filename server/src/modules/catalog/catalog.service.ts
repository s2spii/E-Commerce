import { Prisma, type ProductStatus } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { slugify, uniqueSlug } from '../../lib/slug';

// --- Public catalog reads ----------------------------------------------------

export interface ProductQuery {
  q?: string;
  category?: string; // slug
  minPrice?: number; // minor units
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sort?: 'newest' | 'name' | 'featured';
  page: number;
  pageSize: number;
}

export async function listProducts(query: ProductQuery) {
  const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { brand: { contains: query.q, mode: 'insensitive' } },
    ];
  }
  if (query.category) where.category = { slug: query.category };
  if (query.featured) where.isFeatured = true;

  const variantFilter: Prisma.ProductVariantWhereInput = { isActive: true };
  if (query.minPrice !== undefined) variantFilter.price = { gte: query.minPrice };
  if (query.maxPrice !== undefined) {
    variantFilter.price = { ...(variantFilter.price as object), lte: query.maxPrice };
  }
  if (query.inStock) variantFilter.stock = { gt: 0 };
  if (Object.keys(variantFilter).length > 1) where.variants = { some: variantFilter };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    query.sort === 'name'
      ? { name: 'asc' }
      : query.sort === 'featured'
        ? { isFeatured: 'desc' }
        : { publishedAt: 'desc' };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        images: { orderBy: { position: 'asc' }, take: 1 },
        category: { select: { name: true, slug: true } },
        variants: { where: { isActive: true }, select: { price: true, compareAtPrice: true, stock: true } },
      },
    }),
  ]);

  return {
    items: products.map(summarizeProduct),
    pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.ceil(total / query.pageSize) },
  };
}

type ProductListRow = Prisma.ProductGetPayload<{
  include: {
    images: true;
    category: { select: { name: true; slug: true } };
    variants: { select: { price: true; compareAtPrice: true; stock: true } };
  };
}>;

function summarizeProduct(p: ProductListRow) {
  const prices = p.variants.map((v) => v.price);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    image: p.images[0]?.url ?? null,
    category: p.category,
    fromPrice: prices.length ? Math.min(...prices) : null,
    inStock: p.variants.some((v) => v.stock > 0),
    isFeatured: p.isFeatured,
    currency: p.currency,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, status: 'ACTIVE' },
    include: {
      images: { orderBy: { position: 'asc' } },
      category: { select: { name: true, slug: true } },
      variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      reviews: { where: { isApproved: true }, select: { rating: true, title: true, body: true, createdAt: true } },
    },
  });
  if (!product) throw new NotFoundError('Produit introuvable');
  return product;
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
    select: { id: true, name: true, slug: true, parentId: true, imageUrl: true },
  });
}

/**
 * Creates (or updates) the authenticated user's review for a product. Reviews
 * are held for moderation (`isApproved: false`) before appearing publicly.
 * The unique [productId, userId] constraint means one review per user/product.
 */
export async function createReview(
  slug: string,
  userId: string,
  input: { rating: number; title?: string; body?: string },
) {
  const product = await prisma.product.findFirst({
    where: { slug, status: 'ACTIVE' },
    select: { id: true },
  });
  if (!product) throw new NotFoundError('Produit introuvable');

  return prisma.review.upsert({
    where: { productId_userId: { productId: product.id, userId } },
    create: {
      productId: product.id,
      userId,
      rating: input.rating,
      title: input.title,
      body: input.body,
      isApproved: false,
    },
    update: {
      rating: input.rating,
      title: input.title,
      body: input.body,
      isApproved: false,
    },
    select: { id: true, rating: true, title: true, body: true, isApproved: true, createdAt: true },
  });
}

// --- Admin catalog writes ----------------------------------------------------

export interface CreateProductInput {
  name: string;
  description?: string;
  story?: string;
  brand?: string;
  taxClass?: string;
  categoryId?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  images?: { url: string; alt?: string }[];
  variants?: { sku: string; name?: string; price: number; stock?: number; attributes?: Record<string, string> }[];
}

export async function createProduct(input: CreateProductInput) {
  let slug = slugify(input.name);
  if (await prisma.product.findUnique({ where: { slug } })) slug = uniqueSlug(input.name);

  return prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      story: input.story,
      brand: input.brand,
      taxClass: input.taxClass ?? 'STANDARD',
      categoryId: input.categoryId,
      status: input.status ?? 'DRAFT',
      isFeatured: input.isFeatured ?? false,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: input.status === 'ACTIVE' ? new Date() : null,
      images: input.images ? { create: input.images.map((img, i) => ({ ...img, position: i })) } : undefined,
      variants: input.variants
        ? {
            create: input.variants.map((v) => ({
              sku: v.sku,
              name: v.name,
              price: v.price,
              stock: v.stock ?? 0,
              attributes: (v.attributes ?? {}) as object,
            })),
          }
        : undefined,
    },
    include: { variants: true, images: true },
  });
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Produit introuvable');

  return prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      story: input.story,
      brand: input.brand,
      taxClass: input.taxClass,
      categoryId: input.categoryId,
      status: input.status,
      isFeatured: input.isFeatured,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt:
        input.status === 'ACTIVE' && !existing.publishedAt ? new Date() : undefined,
    },
  });
}

export async function deleteProduct(id: string) {
  await prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } });
}

export async function upsertCategory(input: { id?: string; name: string; parentId?: string; description?: string; imageUrl?: string; position?: number; isActive?: boolean }) {
  const slug = slugify(input.name);
  if (input.id) {
    return prisma.category.update({
      where: { id: input.id },
      data: { name: input.name, parentId: input.parentId, description: input.description, imageUrl: input.imageUrl, position: input.position, isActive: input.isActive },
    });
  }
  return prisma.category.create({
    data: {
      name: input.name,
      slug: (await prisma.category.findUnique({ where: { slug } })) ? uniqueSlug(input.name) : slug,
      parentId: input.parentId,
      description: input.description,
      imageUrl: input.imageUrl,
      position: input.position ?? 0,
    },
  });
}

/** Adjusts stock and records an auditable movement in one transaction. */
export async function adjustStock(variantId: string, delta: number, reason: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'RESERVATION_RELEASE', reference?: string) {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundError('Variante introuvable');
    const newStock = variant.stock + delta;
    if (newStock < 0) throw new BadRequestError('Stock insuffisant');
    await tx.productVariant.update({ where: { id: variantId }, data: { stock: newStock } });
    await tx.stockMovement.create({ data: { variantId, delta, reason, reference } });
    return { variantId, stock: newStock };
  });
}

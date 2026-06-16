import type { Request, Response } from 'express';
import { z } from 'zod';
import { recordAudit } from '../../middleware/audit';
import * as catalog from './catalog.service';

const money = z.coerce.number().int().nonnegative();

export const productQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().optional(),
  minPrice: money.optional(),
  maxPrice: money.optional(),
  inStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(['newest', 'name', 'featured']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().max(5000).optional(),
  story: z.string().max(20000).optional(),
  brand: z.string().max(120).optional(),
  taxClass: z.string().max(40).optional(),
  categoryId: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().max(160).optional() })).max(12).optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1).max(64),
        name: z.string().max(120).optional(),
        price: money,
        stock: z.coerce.number().int().nonnegative().optional(),
        attributes: z.record(z.string()).optional(),
      }),
    )
    .max(50)
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(160).optional(),
  body: z.string().trim().max(4000).optional(),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(120),
  parentId: z.string().optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  position: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const stockSchema = z.object({
  delta: z.coerce.number().int(),
  reason: z.enum(['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'RESERVATION_RELEASE']),
  reference: z.string().max(64).optional(),
});

// --- Public ------------------------------------------------------------------

export async function listProducts(req: Request, res: Response): Promise<void> {
  res.json({ data: await catalog.listProducts(req.query as unknown as catalog.ProductQuery) });
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  res.json({ data: await catalog.getProductBySlug(req.params.slug!) });
}

export async function listCategories(_req: Request, res: Response): Promise<void> {
  res.json({ data: await catalog.listCategories() });
}

export async function createReview(req: Request, res: Response): Promise<void> {
  const review = await catalog.createReview(req.params.slug!, req.auth!.userId, req.body);
  res.status(201).json({ data: review });
}

// --- Admin -------------------------------------------------------------------

export async function createProduct(req: Request, res: Response): Promise<void> {
  const product = await catalog.createProduct(req.body);
  await recordAudit(req, { action: 'product.create', entityType: 'Product', entityId: product.id, metadata: { name: product.name } });
  res.status(201).json({ data: product });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const product = await catalog.updateProduct(req.params.id!, req.body);
  await recordAudit(req, { action: 'product.update', entityType: 'Product', entityId: product.id });
  res.json({ data: product });
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  await catalog.deleteProduct(req.params.id!);
  await recordAudit(req, { action: 'product.delete', entityType: 'Product', entityId: req.params.id });
  res.status(204).send();
}

export async function upsertCategory(req: Request, res: Response): Promise<void> {
  const category = await catalog.upsertCategory(req.body);
  await recordAudit(req, { action: 'category.upsert', entityType: 'Category', entityId: category.id });
  res.status(req.body.id ? 200 : 201).json({ data: category });
}

export async function adjustStock(req: Request, res: Response): Promise<void> {
  const result = await catalog.adjustStock(req.params.id!, req.body.delta, req.body.reason, req.body.reference);
  await recordAudit(req, { action: 'inventory.adjust', entityType: 'ProductVariant', entityId: req.params.id, metadata: { delta: req.body.delta, reason: req.body.reason } });
  res.json({ data: result });
}

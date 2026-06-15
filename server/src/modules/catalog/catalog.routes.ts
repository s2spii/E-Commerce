import { Router } from 'express';
import { PERMISSIONS } from '../../config/permissions';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { idParam, validate } from '../../middleware/validate';
import { z } from 'zod';
import * as c from './catalog.controller';

// Public, read-only storefront catalog.
export const catalogRouter = Router();
catalogRouter.get('/products', validate({ query: c.productQuerySchema }), asyncHandler(c.listProducts));
catalogRouter.get('/products/:slug', validate({ params: z.object({ slug: z.string() }) }), asyncHandler(c.getProduct));
catalogRouter.get('/categories', asyncHandler(c.listCategories));

// Admin catalog management (guarded by RBAC permissions).
export const adminCatalogRouter = Router();
adminCatalogRouter.use(authenticate);

adminCatalogRouter.post('/products', requirePermission(PERMISSIONS.PRODUCT_WRITE), validate({ body: c.createProductSchema }), asyncHandler(c.createProduct));
adminCatalogRouter.patch('/products/:id', requirePermission(PERMISSIONS.PRODUCT_WRITE), validate({ params: idParam, body: c.updateProductSchema }), asyncHandler(c.updateProduct));
adminCatalogRouter.delete('/products/:id', requirePermission(PERMISSIONS.PRODUCT_DELETE), validate({ params: idParam }), asyncHandler(c.deleteProduct));

adminCatalogRouter.post('/categories', requirePermission(PERMISSIONS.CATEGORY_WRITE), validate({ body: c.categorySchema }), asyncHandler(c.upsertCategory));

adminCatalogRouter.post('/variants/:id/stock', requirePermission(PERMISSIONS.INVENTORY_WRITE), validate({ params: idParam, body: c.stockSchema }), asyncHandler(c.adjustStock));

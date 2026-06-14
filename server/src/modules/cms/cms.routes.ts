import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '../../config/permissions';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as c from './cms.controller';

// Public content
export const cmsRouter = Router();
cmsRouter.get('/banners', asyncHandler(c.listBanners));
cmsRouter.get('/pages/:slug', validate({ params: z.object({ slug: z.string() }) }), asyncHandler(c.getPage));

// Admin content management
export const adminCmsRouter = Router();
adminCmsRouter.use(authenticate, requirePermission(PERMISSIONS.CMS_WRITE));
adminCmsRouter.get('/pages', asyncHandler(c.listPages));
adminCmsRouter.put('/pages', validate({ body: c.pageSchema }), asyncHandler(c.upsertPage));
adminCmsRouter.put('/banners', validate({ body: c.bannerSchema }), asyncHandler(c.upsertBanner));

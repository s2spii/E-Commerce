import { Router, type Request, type Response } from 'express';
import { prisma } from './lib/prisma';
import { authRouter } from './modules/auth/auth.routes';
import { catalogRouter, adminCatalogRouter } from './modules/catalog/catalog.routes';
import { cartRouter } from './modules/cart/cart.routes';
import { orderRouter, adminOrderRouter } from './modules/orders/orders.routes';
import { taxRouter, adminTaxRouter } from './modules/tax/tax.routes';
import { cmsRouter, adminCmsRouter } from './modules/cms/cms.routes';
import { adminPromotionsRouter } from './modules/promotions/promotions.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { asyncHandler } from './middleware/asyncHandler';

export const apiRouter = Router();

// Liveness — always cheap and dependency-free.
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// CSRF token priming: the csrf middleware sets the `csrf_token` cookie on this
// (safe) request. We also return the token in the body so a cross-origin SPA
// (which cannot read the API's cookie via document.cookie) can echo it in the
// `x-csrf-token` header for the double-submit check.
apiRouter.get('/csrf', (req: Request, res: Response) => {
  const token = (req as Request & { cookies?: Record<string, string> }).cookies?.csrf_token;
  res.json({ data: { csrfToken: token } });
});

// Readiness — verifies the database is reachable.
apiRouter.get(
  '/health/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  }),
);

// --- Public / customer API ---------------------------------------------------
apiRouter.use('/auth', authRouter);
apiRouter.use('/catalog', catalogRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/tax', taxRouter);
apiRouter.use('/cms', cmsRouter);

// --- Admin API (each sub-router enforces authentication + RBAC) --------------
const admin = Router();
admin.use('/catalog', adminCatalogRouter);
admin.use('/orders', adminOrderRouter);
admin.use('/tax', adminTaxRouter);
admin.use('/promotions', adminPromotionsRouter);
admin.use('/cms', adminCmsRouter);
admin.use('/', adminRouter); // dashboard, users, roles, audit, settings
apiRouter.use('/admin', admin);

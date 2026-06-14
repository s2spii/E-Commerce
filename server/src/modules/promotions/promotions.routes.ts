import { Router } from 'express';
import { PERMISSIONS } from '../../config/permissions';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as c from './promotions.controller';

export const adminPromotionsRouter = Router();
adminPromotionsRouter.use(authenticate, requirePermission(PERMISSIONS.PROMOTION_WRITE));

adminPromotionsRouter.get('/coupons', asyncHandler(c.list));
adminPromotionsRouter.post('/coupons', validate({ body: c.couponSchema }), asyncHandler(c.create));

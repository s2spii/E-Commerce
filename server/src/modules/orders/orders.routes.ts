import { Router } from 'express';
import { PERMISSIONS } from '../../config/permissions';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { idParam, validate } from '../../middleware/validate';
import * as c from './orders.controller';

// Customer-facing order endpoints (authenticated accounts).
export const orderRouter = Router();
orderRouter.use(authenticate);

orderRouter.post('/checkout', validate({ body: c.createOrderSchema }), asyncHandler(c.checkout));
orderRouter.get('/', asyncHandler(c.listMyOrders));
orderRouter.get('/:id', validate({ params: idParam }), asyncHandler(c.getMyOrder));
orderRouter.post('/:id/pay', validate({ params: idParam }), asyncHandler(c.payOrder));
orderRouter.post('/:id/returns', validate({ params: idParam, body: c.returnSchema }), asyncHandler(c.createReturn));

// Admin order management (RBAC-guarded).
export const adminOrderRouter = Router();
adminOrderRouter.use(authenticate);

adminOrderRouter.get('/', requirePermission(PERMISSIONS.ORDER_READ), validate({ query: c.adminOrdersQuery }), asyncHandler(c.adminList));
adminOrderRouter.get('/:id', requirePermission(PERMISSIONS.ORDER_READ), validate({ params: idParam }), asyncHandler(c.adminGet));
adminOrderRouter.patch('/:id/status', requirePermission(PERMISSIONS.ORDER_WRITE), validate({ params: idParam, body: c.statusSchema }), asyncHandler(c.adminUpdateStatus));
adminOrderRouter.post('/:id/refund', requirePermission(PERMISSIONS.ORDER_REFUND), validate({ params: idParam, body: c.refundSchema }), asyncHandler(c.adminRefund));
adminOrderRouter.patch('/returns/:id', requirePermission(PERMISSIONS.RETURN_MANAGE), validate({ params: idParam, body: c.schemas.returnStatusSchema }), asyncHandler(c.adminUpdateReturn));

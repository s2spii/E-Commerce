import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import * as c from './cart.controller';

export const cartRouter = Router();

// Carts work for anonymous and authenticated shoppers alike.
cartRouter.use(optionalAuth);

cartRouter.get('/', validate({ query: c.cartContextQuery }), asyncHandler(c.getCart));
cartRouter.post('/items', validate({ body: c.addItemSchema, query: c.cartContextQuery }), asyncHandler(c.addItem));
cartRouter.patch('/items/:variantId', validate({ params: z.object({ variantId: z.string() }), body: c.updateItemSchema }), asyncHandler(c.updateItem));
cartRouter.delete('/items/:variantId', validate({ params: z.object({ variantId: z.string() }) }), asyncHandler(c.removeItem));
cartRouter.post('/coupon', validate({ body: c.couponSchema }), asyncHandler(c.applyCoupon));
cartRouter.delete('/coupon', asyncHandler(c.removeCoupon));

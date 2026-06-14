import { Router } from 'express';
import { PERMISSIONS } from '../../config/permissions';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate, requirePermission } from '../../middleware/auth';
import { idParam, validate } from '../../middleware/validate';
import * as c from './tax.controller';

// Public tax helpers (storefront price/VAT previews).
export const taxRouter = Router();
taxRouter.post('/quote', validate({ body: c.quoteSchema }), asyncHandler(c.quote));
taxRouter.post('/vat/validate', validate({ body: c.vatCheckSchema }), asyncHandler(c.checkVat));

// Admin tax-rate configuration.
export const adminTaxRouter = Router();
adminTaxRouter.use(authenticate, requirePermission(PERMISSIONS.TAX_WRITE));
adminTaxRouter.get('/rates', asyncHandler(c.listRates));
adminTaxRouter.put('/rates', validate({ body: c.rateSchema }), asyncHandler(c.upsertRate));
adminTaxRouter.delete('/rates/:id', validate({ params: idParam }), asyncHandler(c.deleteRate));

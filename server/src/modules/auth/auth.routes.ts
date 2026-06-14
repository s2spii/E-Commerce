import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authLimiter, sensitiveLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import * as c from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: c.registerSchema }), asyncHandler(c.register));
authRouter.post('/login', authLimiter, validate({ body: c.loginSchema }), asyncHandler(c.login));
authRouter.post('/refresh', asyncHandler(c.refresh));
authRouter.post('/logout', asyncHandler(c.logout));

authRouter.get('/me', authenticate, asyncHandler(c.me));

// MFA lifecycle (authenticated user managing their own factor).
authRouter.post('/mfa/setup', authenticate, sensitiveLimiter, asyncHandler(c.setupMfa));
authRouter.post('/mfa/enable', authenticate, validate({ body: c.mfaEnableSchema }), asyncHandler(c.enableMfa));
authRouter.post(
  '/mfa/disable',
  authenticate,
  sensitiveLimiter,
  validate({ body: c.mfaDisableSchema }),
  asyncHandler(c.disableMfa),
);

import crypto from 'crypto';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { globalLimiter } from './middleware/rateLimit';
import { csrfProtection } from './middleware/csrf';
import { errorHandler, notFoundHandler } from './middleware/error';
import { apiRouter } from './routes';

/**
 * Builds the Express application with the full defense-in-depth middleware
 * stack. Order matters: security headers and parsers first, then logging and
 * rate limiting, then routes, and finally the 404 + error handlers.
 */
export function createApp(): Express {
  const app = express();

  // Correctly resolve client IPs behind a reverse proxy / load balancer
  // (needed for rate limiting and audit logging).
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Security headers: HSTS, no-sniff, frameguard, referrer policy, etc.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      hsts: env.isProd ? { maxAge: 15552000, includeSubDomains: true, preload: true } : false,
    }),
  );

  // CORS — explicit allow-list, credentials enabled for cookie auth.
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        cb(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '100kb' })); // bound request bodies (DoS guard)
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(hpp()); // HTTP parameter pollution protection

  // Structured request logging with a correlation id.
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
        res.setHeader('x-request-id', id);
        (req as express.Request).id = id;
        return id;
      },
      autoLogging: !env.isTest,
    }),
  );

  // Baseline rate limiting across the whole API.
  app.use(globalLimiter);

  // CSRF protection (double-submit cookie) for cookie-authenticated requests.
  app.use(csrfProtection);

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

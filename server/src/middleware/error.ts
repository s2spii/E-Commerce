import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

/** 404 fallback for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}

/**
 * Central error handler. Maps known error types to safe responses and masks
 * everything else as a generic 500 — internal messages and stack traces are
 * never sent to clients.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown;

  if (err instanceof AppError) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'BAD_REQUEST';
    message = 'Validation failed';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      code = 'CONFLICT';
      message = 'A record with these unique values already exists';
    } else if (err.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'Resource not found';
    } else {
      status = 400;
      code = 'DATABASE_ERROR';
      message = 'Database request error';
    }
  }

  if (status >= 500) {
    logger.error({ err, reqId: req.id, path: req.path }, 'Unhandled error');
  } else {
    logger.warn({ code, reqId: req.id, path: req.path }, message);
  }

  res.status(status).json({
    error: { code, message, ...(details ? { details } : {}) },
  });
}

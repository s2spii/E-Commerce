import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny, z } from 'zod';
import { BadRequestError } from '../lib/errors';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Server-side input validation with Zod. Defense-in-depth: even if the client
 * validates, the server is the source of truth. Parsed (and coerced) values
 * replace the raw input so handlers receive trusted, typed data.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) Object.assign(req.query, schemas.query.parse(req.query));
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          new BadRequestError('Validation failed', {
            fields: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          }),
        );
        return;
      }
      next(err);
    }
  };
}

/** Reusable primitives. */
export const idParam = z.object({ id: z.string().min(1) });
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

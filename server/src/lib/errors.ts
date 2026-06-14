/**
 * Typed application errors. Controllers and services throw these; the central
 * error middleware turns them into safe JSON responses. Unknown errors are
 * always masked as a generic 500 so internals never leak to clients.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly expose: boolean;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.expose = statusCode < 500; // only client errors are safe to expose
    Error.captureStackTrace?.(this, new.target);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, 'TOO_MANY_REQUESTS', message);
  }
}

export class UnprocessableError extends AppError {
  constructor(message = 'Unprocessable entity', details?: unknown) {
    super(422, 'UNPROCESSABLE_ENTITY', message, details);
  }
}

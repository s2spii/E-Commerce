import pino from 'pino';
import { env } from '../config/env';

/**
 * Structured logger. In production we emit JSON (machine-ingestible by Loki,
 * Datadog, CloudWatch...). Sensitive fields are redacted globally so secrets
 * never leak into logs — a core defense-in-depth requirement.
 */
export const logger = pino({
  level: env.isProd ? 'info' : env.isTest ? 'silent' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.mfaSecret',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  transport: env.isProd
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } },
});

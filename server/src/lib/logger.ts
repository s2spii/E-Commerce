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
  transport: prettyTransport(),
});

/**
 * Use pino-pretty for human-readable logs in dev, but only if it is installed.
 * Production (and the pruned Docker image) falls back to structured JSON instead
 * of crashing when the optional dev dependency is absent.
 */
function prettyTransport(): pino.TransportSingleOptions | undefined {
  if (env.isProd) return undefined;
  try {
    require.resolve('pino-pretty');
    return { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } };
  } catch {
    return undefined;
  }
}

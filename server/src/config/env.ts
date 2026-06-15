import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from the repository root so the whole monorepo shares one file.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Also allow a server-local .env (overrides root) for advanced setups.
dotenv.config();

/**
 * Strongly-typed, validated environment. The process refuses to boot if a
 * required secret is missing or obviously insecure — fail fast, fail loud.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional().default(''),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be >= 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be >= 32 chars'),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2_592_000),

  MFA_ISSUER: z.string().default('Maison Luma'),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be >= 16 chars'),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(19_456),
  ARGON2_TIME_COST: z.coerce.number().int().positive().default(2),
  ARGON2_PARALLELISM: z.coerce.number().int().positive().default(1),

  TAX_HOME_COUNTRY: z.string().length(2).default('FR'),
  TAX_PRICES_INCLUDE_TAX: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  COMPANY_VAT_NUMBER: z.string().default('FR00000000000'),
  COMPANY_LEGAL_NAME: z.string().default('Maison Luma SAS'),

  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),

  // Overrides the `Secure` cookie flag. Defaults to true in production; set
  // false to run the stack over plain HTTP locally (e.g. Docker on localhost).
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    '[31m✖ Invalid environment configuration:[0m\n' +
      parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n'),
  );
  process.exit(1);
}

const data = parsed.data;

// In production, reject the placeholder secrets shipped in .env.example.
if (data.NODE_ENV === 'production') {
  const weak = [data.JWT_ACCESS_SECRET, data.JWT_REFRESH_SECRET, data.COOKIE_SECRET].some((s) =>
    /replace_with|change_me|example/i.test(s),
  );
  if (weak) {
    // eslint-disable-next-line no-console
    console.error('✖ Refusing to start in production with placeholder secrets.');
    process.exit(1);
  }
}

export const env = {
  ...data,
  isProd: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
  // Secure cookies follow COOKIE_SECURE when set, else production status.
  cookieSecure: data.COOKIE_SECURE ? data.COOKIE_SECURE === 'true' : data.NODE_ENV === 'production',
  corsOrigins: data.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
};

export type Env = typeof env;

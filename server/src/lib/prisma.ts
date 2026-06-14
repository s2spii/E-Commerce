import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/**
 * Single shared Prisma client. Re-used across hot reloads in development to
 * avoid exhausting the database connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ['warn', 'error'] : ['warn', 'error'],
  });

if (!env.isProd) globalForPrisma.prisma = prisma;

import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { closeRedis, getRedis } from './lib/redis';

async function main(): Promise<void> {
  // Warm optional dependencies (no-op if REDIS_URL is unset).
  await getRedis().catch((err) => logger.warn({ err }, 'Redis unavailable, continuing without it'));

  const app = createApp();
  const server = app.listen(env.API_PORT, () => {
    logger.info(`Maison Luma API listening on :${env.API_PORT} (${env.NODE_ENV})`);
  });

  // Graceful shutdown — drain connections, then release resources.
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
      process.exit(0);
    });
    // Hard exit if graceful shutdown stalls.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});

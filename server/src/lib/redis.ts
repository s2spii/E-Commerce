import { createClient, type RedisClientType } from 'redis';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Optional Redis client. Used for distributed rate limiting and (later) caching.
 * When REDIS_URL is empty we degrade gracefully to in-memory equivalents so the
 * app still runs in a minimal local setup.
 */
let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType | null> {
  if (!env.REDIS_URL) return null;
  if (client) return client;

  client = createClient({ url: env.REDIS_URL });
  client.on('error', (err) => logger.error({ err }, 'Redis error'));
  await client.connect();
  logger.info('Connected to Redis');
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

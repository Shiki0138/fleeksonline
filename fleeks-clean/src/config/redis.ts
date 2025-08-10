import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
}

const config: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      socket: {
        host: config.host,
        port: config.port,
        retryDelayOnFailover: config.retryDelayOnFailover,
      },
      password: config.password,
      database: config.db,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('📡 Connected to Redis server');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis client ready');
    });

    redisClient.on('end', () => {
      logger.info('🔌 Redis connection closed');
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    logger.info('✅ Redis connection tested successfully');
    
  } catch (error) {
    logger.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
}

// Cache utilities
export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  const client = getRedisClient();
  const serializedValue = JSON.stringify(value);
  await client.setEx(key, ttlSeconds, serializedValue);
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const value = await client.get(key);
  
  if (!value) {
    return null;
  }
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error(`Failed to parse cached value for key ${key}:`, error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  const keys = await client.keys(pattern);
  
  if (keys.length > 0) {
    await client.del(keys);
  }
}

// Session utilities
export async function setSession(sessionId: string, data: any, ttlSeconds: number = 86400): Promise<void> {
  await setCache(`session:${sessionId}`, data, ttlSeconds);
}

export async function getSession<T>(sessionId: string): Promise<T | null> {
  return getCache<T>(`session:${sessionId}`);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await deleteCache(`session:${sessionId}`);
}

// Rate limiting utilities
export async function incrementRateLimit(identifier: string, windowSeconds: number): Promise<number> {
  const client = getRedisClient();
  const key = `ratelimit:${identifier}`;
  
  const multi = client.multi();
  multi.incr(key);
  multi.expire(key, windowSeconds);
  
  const results = await multi.exec();
  return results?.[0] as number || 0;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    logger.info('🔌 Redis connection closed');
  }
}

export { redisClient };
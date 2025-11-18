/**
 * Redis Caching Layer (Upstash)
 *
 * Provides caching for:
 * - Analytics queries (getInvoiceStats, getRevenueByMonth)
 * - Leaderboard data
 * - User stats
 * - Dashboard summary data
 */

import { Redis } from '@upstash/redis';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { measurePerformance } from './performance';

/**
 * Initialize Upstash Redis client
 */
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logWarn('Redis credentials not configured, caching disabled');
    return null;
  }

  try {
    redis = new Redis({
      url,
      token,
    });
    logInfo('Redis client initialized');
    return redis;
  } catch (error) {
    logError('Failed to initialize Redis client', error as Error);
    return null;
  }
}

/**
 * Cache key prefixes
 */
export const CACHE_KEYS = {
  INVOICE_STATS: 'invoice_stats',
  REVENUE_BY_MONTH: 'revenue_by_month',
  COLLECTION_STATS: 'collection_stats',
  CLIENT_BREAKDOWN: 'client_breakdown',
  USER_RANK: 'user_rank',
  TOP_USERS: 'top_users',
  DASHBOARD_SUMMARY: 'dashboard_summary',
  AT_RISK_INVOICES: 'at_risk_invoices',
  INSIGHTS: 'insights',
} as const;

/**
 * Cache TTL (in seconds)
 */
export const CACHE_TTL = {
  INVOICE_STATS: 300,       // 5 minutes
  REVENUE_BY_MONTH: 1800,   // 30 minutes (changes less frequently)
  COLLECTION_STATS: 300,    // 5 minutes
  CLIENT_BREAKDOWN: 600,    // 10 minutes
  USER_RANK: 3600,          // 1 hour (leaderboard updates slowly)
  TOP_USERS: 3600,          // 1 hour
  DASHBOARD_SUMMARY: 180,   // 3 minutes
  AT_RISK_INVOICES: 900,    // 15 minutes
  INSIGHTS: 900,            // 15 minutes
} as const;

/**
 * Generate cache key
 */
function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `recoup:${prefix}:${parts.join(':')}`;
}

/**
 * Get cached value
 */
export async function getCache<T>(
  prefix: string,
  ...keyParts: (string | number)[]
): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const key = getCacheKey(prefix, ...keyParts);
    const value = await measurePerformance(
      'cache.get',
      async () => await client.get<T>(key),
      { key }
    );

    if (value) {
      logInfo(`Cache HIT: ${key}`);
    } else {
      logInfo(`Cache MISS: ${key}`);
    }

    return value;
  } catch (error) {
    logError('Cache get failed', error as Error);
    return null;
  }
}

/**
 * Set cached value
 */
export async function setCache<T>(
  prefix: string,
  value: T,
  ttl: number,
  ...keyParts: (string | number)[]
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const key = getCacheKey(prefix, ...keyParts);
    await measurePerformance(
      'cache.set',
      async () => await client.set(key, value, { ex: ttl }),
      { key, ttl }
    );

    logInfo(`Cache SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    logError('Cache set failed', error as Error);
    return false;
  }
}

/**
 * Delete cached value
 */
export async function deleteCache(
  prefix: string,
  ...keyParts: (string | number)[]
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const key = getCacheKey(prefix, ...keyParts);
    await client.del(key);
    logInfo(`Cache DELETE: ${key}`);
    return true;
  } catch (error) {
    logError('Cache delete failed', error as Error);
    return false;
  }
}

/**
 * Invalidate all user-related caches
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    // Delete all cache keys for this user
    const patterns = [
      getCacheKey(CACHE_KEYS.INVOICE_STATS, userId),
      getCacheKey(CACHE_KEYS.REVENUE_BY_MONTH, userId, '*'),
      getCacheKey(CACHE_KEYS.COLLECTION_STATS, userId),
      getCacheKey(CACHE_KEYS.CLIENT_BREAKDOWN, userId),
      getCacheKey(CACHE_KEYS.USER_RANK, userId),
      getCacheKey(CACHE_KEYS.DASHBOARD_SUMMARY, userId),
      getCacheKey(CACHE_KEYS.AT_RISK_INVOICES, userId),
      getCacheKey(CACHE_KEYS.INSIGHTS, userId),
    ];

    await Promise.all(patterns.map((pattern) => client.del(pattern)));
    logInfo(`Invalidated cache for user: ${userId}`);
  } catch (error) {
    logError('Failed to invalidate user cache', error as Error);
  }
}

/**
 * Invalidate leaderboard cache
 */
export async function invalidateLeaderboardCache(): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(getCacheKey(CACHE_KEYS.TOP_USERS, '*'));
    logInfo('Invalidated leaderboard cache');
  } catch (error) {
    logError('Failed to invalidate leaderboard cache', error as Error);
  }
}

/**
 * Cache wrapper function
 * Handles get/set logic automatically
 */
export async function withCache<T>(
  prefix: string,
  ttl: number,
  keyParts: (string | number)[],
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache
  const cached = await getCache<T>(prefix, ...keyParts);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache (don't await to avoid blocking)
  setCache(prefix, data, ttl, ...keyParts).catch((error) => {
    logError('Failed to cache data', error);
  });

  return data;
}

/**
 * Batch cache get
 */
export async function batchGetCache<T>(
  prefix: string,
  keyPartsList: Array<(string | number)[]>
): Promise<Array<T | null>> {
  const client = getRedisClient();
  if (!client) return keyPartsList.map(() => null);

  try {
    const keys = keyPartsList.map((parts) => getCacheKey(prefix, ...parts));
    const values = await client.mget<T>(...keys);
    return values;
  } catch (error) {
    logError('Batch cache get failed', error as Error);
    return keyPartsList.map(() => null);
  }
}

/**
 * Batch cache set
 */
export async function batchSetCache<T>(
  prefix: string,
  items: Array<{
    keyParts: (string | number)[];
    value: T;
    ttl: number;
  }>
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await Promise.all(
      items.map((item) =>
        setCache(prefix, item.value, item.ttl, ...item.keyParts)
      )
    );
    return true;
  } catch (error) {
    logError('Batch cache set failed', error as Error);
    return false;
  }
}

/**
 * Increment a counter in cache (for rate limiting, etc.)
 */
export async function incrementCache(
  prefix: string,
  ttl: number,
  ...keyParts: (string | number)[]
): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    const key = getCacheKey(prefix, ...keyParts);
    const value = await client.incr(key);

    // Set TTL if this is the first increment
    if (value === 1) {
      await client.expire(key, ttl);
    }

    return value;
  } catch (error) {
    logError('Cache increment failed', error as Error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  info: string;
  dbsize: number;
}> {
  const client = getRedisClient();
  if (!client) {
    return { info: 'Redis not configured', dbsize: 0 };
  }

  try {
    const [info, dbsize] = await Promise.all([
      client.info() as Promise<string>,
      client.dbsize() as Promise<number>,
    ]);

    return { info, dbsize };
  } catch (error) {
    logError('Failed to get cache stats', error as Error);
    return { info: 'Error fetching stats', dbsize: 0 };
  }
}

/**
 * Warm up cache for a user
 * Pre-populate frequently accessed data
 */
export async function warmUserCache(
  userId: string,
  dataFetchers: {
    invoiceStats?: () => Promise<any>;
    revenueByMonth?: () => Promise<any>;
    collectionStats?: () => Promise<any>;
  }
): Promise<void> {
  logInfo(`Warming cache for user: ${userId}`);

  const promises = [];

  if (dataFetchers.invoiceStats) {
    promises.push(
      dataFetchers.invoiceStats().then((data) =>
        setCache(CACHE_KEYS.INVOICE_STATS, data, CACHE_TTL.INVOICE_STATS, userId)
      )
    );
  }

  if (dataFetchers.revenueByMonth) {
    promises.push(
      dataFetchers.revenueByMonth().then((data) =>
        setCache(CACHE_KEYS.REVENUE_BY_MONTH, data, CACHE_TTL.REVENUE_BY_MONTH, userId, 12)
      )
    );
  }

  if (dataFetchers.collectionStats) {
    promises.push(
      dataFetchers.collectionStats().then((data) =>
        setCache(CACHE_KEYS.COLLECTION_STATS, data, CACHE_TTL.COLLECTION_STATS, userId)
      )
    );
  }

  await Promise.all(promises);
  logInfo(`Cache warmed for user: ${userId}`);
}

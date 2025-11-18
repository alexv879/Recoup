import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { logInfo, logError, logPerformance } from '@/utils/logger';

/**
 * Upstash Redis client for caching and rate limiting
 */

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Rate limiters for different endpoints
 */
export const rateLimiters = {
  // Dashboard endpoints - generous limits
  dashboard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    analytics: true,
    prefix: 'ratelimit:dashboard',
  }),

  // API endpoints - moderate limits
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Analytics endpoints - stricter limits (more expensive)
  analytics: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
    analytics: true,
    prefix: 'ratelimit:analytics',
  }),

  // Predictions endpoints - very strict (most expensive)
  predictions: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'ratelimit:predictions',
  }),
};

/**
 * Cache key generators
 */
export const cacheKeys = {
  invoiceStats: (userId: string) => `cache:invoice-stats:${userId}`,
  revenueByMonth: (userId: string) => `cache:revenue-by-month:${userId}`,
  clientBreakdown: (userId: string) => `cache:client-breakdown:${userId}`,
  topUsers: () => 'cache:top-users',
  userRank: (userId: string) => `cache:user-rank:${userId}`,
  dashboardSummary: (userId: string) => `cache:dashboard-summary:${userId}`,
  dashboardCharts: (userId: string) => `cache:dashboard-charts:${userId}`,
  collectionMetrics: (userId: string) => `cache:collection-metrics:${userId}`,
  predictions: (userId: string) => `cache:predictions:${userId}`,
};

/**
 * Cache TTLs (in seconds)
 */
export const cacheTTL = {
  invoiceStats: 300,        // 5 minutes
  revenueByMonth: 300,      // 5 minutes
  clientBreakdown: 600,     // 10 minutes
  topUsers: 900,            // 15 minutes (global data)
  userRank: 900,            // 15 minutes (global data)
  dashboardSummary: 180,    // 3 minutes (frequently changing)
  dashboardCharts: 300,     // 5 minutes
  collectionMetrics: 300,   // 5 minutes
  predictions: 1800,        // 30 minutes (expensive calculation)
};

/**
 * Generic cache getter with automatic fetching
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const startTime = Date.now();

  try {
    // Try to get from cache
    const cached = await redis.get<T>(key);

    if (cached !== null) {
      const duration = Date.now() - startTime;
      logPerformance({
        operation: 'redis-cache-hit',
        duration,
        metadata: { key },
      });

      return cached;
    }

    // Cache miss - fetch fresh data
    const fetchStart = Date.now();
    const data = await fetcher();
    const fetchDuration = Date.now() - fetchStart;

    // Store in cache
    await redis.set(key, data, { ex: ttl });

    const totalDuration = Date.now() - startTime;

    logPerformance({
      operation: 'redis-cache-miss',
      duration: totalDuration,
      metadata: {
        key,
        fetchDuration,
        ttl,
      },
    });

    return data;
  } catch (error) {
    const duration = Date.now() - startTime;

    logError('Redis cache error', error, {
      key,
      duration,
    });

    // Fall back to fetching without cache
    return await fetcher();
  }
}

/**
 * Invalidate cache for a user
 */
export async function invalidateUserCache(userId: string) {
  const keys = [
    cacheKeys.invoiceStats(userId),
    cacheKeys.revenueByMonth(userId),
    cacheKeys.clientBreakdown(userId),
    cacheKeys.userRank(userId),
    cacheKeys.dashboardSummary(userId),
    cacheKeys.dashboardCharts(userId),
    cacheKeys.collectionMetrics(userId),
    cacheKeys.predictions(userId),
  ];

  try {
    await Promise.all(keys.map(key => redis.del(key)));
    logInfo('Cache invalidated', { userId, keysCount: keys.length });
  } catch (error) {
    logError('Cache invalidation error', error, { userId });
  }
}

/**
 * Invalidate global caches (top users, leaderboard, etc.)
 */
export async function invalidateGlobalCache() {
  const keys = [
    cacheKeys.topUsers(),
  ];

  try {
    await Promise.all(keys.map(key => redis.del(key)));
    logInfo('Global cache invalidated', { keysCount: keys.length });
  } catch (error) {
    logError('Global cache invalidation error', error);
  }
}

/**
 * Batch cache getter - get multiple keys at once
 */
export async function batchGetCached<T>(
  keys: string[]
): Promise<Map<string, T>> {
  const startTime = Date.now();
  const result = new Map<string, T>();

  try {
    if (keys.length === 0) return result;

    // Use mget for batch retrieval
    const values = await redis.mget<T[]>(...keys);

    keys.forEach((key, index) => {
      if (values[index] !== null) {
        result.set(key, values[index]!);
      }
    });

    const duration = Date.now() - startTime;
    logPerformance({
      operation: 'redis-batch-get',
      duration,
      metadata: {
        keysRequested: keys.length,
        keysFound: result.size,
        hitRate: result.size / keys.length,
      },
    });

    return result;
  } catch (error) {
    logError('Redis batch get error', error, {
      keysCount: keys.length,
    });
    return result;
  }
}

/**
 * Batch cache setter - set multiple keys at once
 */
export async function batchSetCached(
  entries: Array<{ key: string; value: any; ttl?: number }>
): Promise<void> {
  const startTime = Date.now();

  try {
    // Use pipeline for batch operations
    const pipeline = redis.pipeline();

    for (const { key, value, ttl } of entries) {
      if (ttl) {
        pipeline.set(key, value, { ex: ttl });
      } else {
        pipeline.set(key, value);
      }
    }

    await pipeline.exec();

    const duration = Date.now() - startTime;
    logPerformance({
      operation: 'redis-batch-set',
      duration,
      metadata: {
        keysCount: entries.length,
      },
    });
  } catch (error) {
    logError('Redis batch set error', error, {
      keysCount: entries.length,
    });
  }
}

/**
 * Cache statistics
 */
export async function getCacheStats(): Promise<{
  size: number;
  keys: string[];
}> {
  try {
    // Get all cache keys
    const keys: string[] = [];
    let cursor = 0;

    do {
      const result = await redis.scan(cursor, {
        match: 'cache:*',
        count: 100,
      });

      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== 0);

    return {
      size: keys.length,
      keys,
    };
  } catch (error) {
    logError('Error getting cache stats', error);
    return { size: 0, keys: [] };
  }
}

/**
 * Clear all caches (use with caution)
 */
export async function clearAllCaches(): Promise<void> {
  try {
    const stats = await getCacheStats();

    if (stats.keys.length > 0) {
      await redis.del(...stats.keys);
    }

    logInfo('All caches cleared', { keysDeleted: stats.keys.length });
  } catch (error) {
    logError('Error clearing caches', error);
  }
}

/**
 * Wrapper for rate limiting
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const startTime = Date.now();

  try {
    const result = await limiter.limit(identifier);
    const duration = Date.now() - startTime;

    logPerformance({
      operation: 'rate-limit-check',
      duration,
      metadata: {
        identifier,
        success: result.success,
        remaining: result.remaining,
      },
    });

    return result;
  } catch (error) {
    logError('Rate limit check error', error, { identifier });

    // Fail open - allow request if rate limit check fails
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }
}

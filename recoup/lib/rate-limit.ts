/**
 * Rate Limiting Middleware
 * Protects against DDoS and abuse
 */

import { RateLimitError } from '../utils/error';
import { logger } from '../utils/logger';

/**
 * Simple in-memory rate limiter (for development)
 * In production, use Redis-based rate limiting (Upstash)
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  async limit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this identifier
    const existingRequests = this.requests.get(identifier) || [];

    // Remove requests outside the time window
    const recentRequests = existingRequests.filter((time) => time > windowStart);

    // Check if limit exceeded
    const success = recentRequests.length < maxRequests;

    if (success) {
      // Add this request
      recentRequests.push(now);
      this.requests.set(identifier, recentRequests);
    }

    const remaining = Math.max(0, maxRequests - recentRequests.length);
    const reset = windowStart + windowMs;

    return {
      success,
      limit: maxRequests,
      remaining,
      reset,
    };
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter((time) => time > now - maxAge);

      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

const memoryLimiter = new InMemoryRateLimiter();

// Cleanup every hour
setInterval(() => memoryLimiter.cleanup(), 60 * 60 * 1000);

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  global: {
    maxRequests: 100,
    windowMs: 10 * 1000, // 10 seconds
  },
  user: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  ai: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute (prevent brute force)
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
};

/**
 * Apply rate limiting
 */
export async function ratelimitMiddleware(
  identifier: string,
  type: keyof typeof RATE_LIMITS = 'user'
): Promise<{
  limit: number;
  remaining: number;
  reset: number;
}> {
  const config = RATE_LIMITS[type];

  // In production, use Redis-based rate limiting
  // For now, use in-memory limiter
  const result = await memoryLimiter.limit(
    `${type}:${identifier}`,
    config.maxRequests,
    config.windowMs
  );

  if (!result.success) {
    logger.warn('Rate limit exceeded', {
      identifier,
      type,
      limit: result.limit,
      reset: new Date(result.reset).toISOString(),
    });

    throw new RateLimitError('Rate limit exceeded. Please try again later.');
  }

  logger.info('Rate limit check passed', {
    identifier,
    type,
    remaining: result.remaining,
    limit: result.limit,
  });

  return {
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Redis-based rate limiter (for production)
 * Uncomment and configure when deploying to production
 */
/*
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Global rate limit: 100 requests per 10 seconds
const globalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '10 s'),
  analytics: true,
  prefix: 'recoup:ratelimit',
});

// Per-user rate limit: 1000 requests per hour
const userRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 h'),
  analytics: true,
  prefix: 'recoup:ratelimit',
});

// AI endpoint rate limit: 10 requests per minute
const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'recoup:ratelimit',
});

export async function ratelimitMiddleware(
  identifier: string,
  type: 'global' | 'user' | 'ai' = 'user'
) {
  const limiter = type === 'global' ? globalRatelimit :
                  type === 'ai' ? aiRatelimit : userRatelimit;

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    throw new RateLimitError('Rate limit exceeded', {
      limit,
      remaining,
      reset,
    });
  }

  return { limit, remaining, reset };
}
*/

/**
 * Rate limit headers for API responses
 */
export function getRateLimitHeaders(rateLimit: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': rateLimit.limit.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimit.reset).toISOString(),
  };
}

/**
 * Combine multiple rate limits (check all, fail if any exceed)
 */
export async function checkMultipleRateLimits(checks: Array<{
  identifier: string;
  type: keyof typeof RATE_LIMITS;
}>): Promise<{
  limit: number;
  remaining: number;
  reset: number;
}> {
  const results = await Promise.all(
    checks.map(({ identifier, type }) => ratelimitMiddleware(identifier, type))
  );

  // Return the most restrictive limit
  return results.reduce((min, current) =>
    current.remaining < min.remaining ? current : min
  );
}

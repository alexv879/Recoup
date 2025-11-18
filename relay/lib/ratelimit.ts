/**
 * [SECURITY FIX] Rate Limiting with Upstash Redis
 *
 * Implements distributed rate limiting to prevent DoS attacks and abuse
 *
 * Security Features:
 * - Sliding window rate limiting
 * - Per-user and per-IP rate limiting
 * - Different limits for different endpoint types
 * - Redis-based (works across Vercel serverless functions)
 * - Retry-After header support
 *
 * SECURITY AUDIT FIX: HIGH-2
 * Issue: No rate limiting implementation despite constants defined
 * Fix: Implement Upstash Redis-based rate limiting
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';
import { logWarn, logInfo } from '@/utils/logger';

/**
 * [SECURITY FIX] Initialize Upstash Redis
 * Falls back to memory-based rate limiting if Redis not configured
 */
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    logInfo('✅ Upstash Redis initialized for rate limiting');
  } else {
    logWarn('⚠️  UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured');
    logWarn('⚠️  Falling back to in-memory rate limiting (not recommended for production)');
  }
} catch (error) {
  logWarn('⚠️  Failed to initialize Upstash Redis for rate limiting', { error });
}

/**
 * [SECURITY FIX] In-memory fallback for development
 * Note: This is NOT suitable for production (doesn't work across serverless functions)
 */
class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map();

  async limit(identifier: string, options: { requests: number; window: number }): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // Clean up expired entries
    if (entry && now > entry.resetAt) {
      this.store.delete(identifier);
    }

    const current = this.store.get(identifier) || {
      count: 0,
      resetAt: now + options.window,
    };

    if (current.count >= options.requests) {
      return {
        success: false,
        limit: options.requests,
        remaining: 0,
        reset: current.resetAt,
      };
    }

    current.count++;
    this.store.set(identifier, current);

    return {
      success: true,
      limit: options.requests,
      remaining: options.requests - current.count,
      reset: current.resetAt,
    };
  }

  async reset(identifier: string): Promise<void> {
    this.store.delete(identifier);
  }
}

const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * [SECURITY FIX] Rate limit configurations
 */
export const RATE_LIMITS = {
  // General API endpoints (10 requests per 10 seconds)
  general: {
    requests: 10,
    window: 10 * 1000, // 10 seconds in ms
  },

  // Authentication endpoints (5 requests per 60 seconds)
  auth: {
    requests: 5,
    window: 60 * 1000, // 1 minute
  },

  // AI endpoints (OpenAI, Whisper, etc.) - 3 requests per 60 seconds
  ai: {
    requests: 3,
    window: 60 * 1000,
  },

  // Webhook endpoints (100 requests per 60 seconds)
  webhook: {
    requests: 100,
    window: 60 * 1000,
  },

  // File upload endpoints (5 requests per 60 seconds)
  upload: {
    requests: 5,
    window: 60 * 1000,
  },

  // Email sending (20 requests per 60 seconds)
  email: {
    requests: 20,
    window: 60 * 1000,
  },

  // Payment endpoints (10 requests per 60 seconds)
  payment: {
    requests: 10,
    window: 60 * 1000,
  },
} as const;

/**
 * [SECURITY FIX] Create rate limiter instance
 */
function createRateLimiter(config: { requests: number; window: number }) {
  if (!redis) {
    // Use in-memory fallback
    return inMemoryLimiter;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, `${config.window}ms`),
    analytics: true,
    prefix: 'ratelimit',
  });
}

/**
 * [SECURITY FIX] Rate limiter instances
 */
export const ratelimit = {
  general: createRateLimiter(RATE_LIMITS.general),
  auth: createRateLimiter(RATE_LIMITS.auth),
  ai: createRateLimiter(RATE_LIMITS.ai),
  webhook: createRateLimiter(RATE_LIMITS.webhook),
  upload: createRateLimiter(RATE_LIMITS.upload),
  email: createRateLimiter(RATE_LIMITS.email),
  payment: createRateLimiter(RATE_LIMITS.payment),
};

/**
 * [SECURITY FIX] Get client identifier from request
 * Uses user ID if authenticated, otherwise IP address
 */
export function getClientIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP address from various headers (Vercel, Cloudflare, etc.)
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * [SECURITY FIX] Check rate limit
 *
 * @param identifier - User ID or IP address
 * @param limiter - Rate limiter instance
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  limiter: ReturnType<typeof createRateLimiter>
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  try {
    const result = await limiter.limit(identifier);

    // Log rate limit hits
    if (!result.success) {
      logWarn('Rate limit exceeded', {
        identifier,
        limit: result.limit,
        reset: new Date(result.reset).toISOString(),
      });
    }

    return result;
  } catch (error) {
    // On error, allow request but log warning
    logWarn('Rate limit check failed, allowing request', { error, identifier });

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60000,
    };
  }
}

/**
 * [SECURITY FIX] Rate limit middleware for API routes
 *
 * Usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const { userId } = await auth();
 *   const identifier = getClientIdentifier(req, userId);
 *
 *   const result = await checkRateLimit(identifier, ratelimit.general);
 *   if (!result.success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       {
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Limit': result.limit.toString(),
 *           'X-RateLimit-Remaining': result.remaining.toString(),
 *           'X-RateLimit-Reset': result.reset.toString(),
 *           'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
 *         },
 *       }
 *     );
 *   }
 *
 *   // Continue with request...
 * }
 * ```
 */
export function getRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
  };
}

/**
 * [SECURITY FIX] Reset rate limit for a specific identifier
 * Useful for clearing limits after successful authentication, etc.
 */
export async function resetRateLimit(
  identifier: string,
  limiter: ReturnType<typeof createRateLimiter>
): Promise<void> {
  try {
    if ('reset' in limiter && typeof limiter.reset === 'function') {
      await limiter.reset(identifier);
      logInfo('Rate limit reset', { identifier });
    }
  } catch (error) {
    logWarn('Failed to reset rate limit', { error, identifier });
  }
}

/**
 * [SECURITY FIX] Typed rate limit check with automatic identifier resolution
 */
export async function withRateLimit(
  req: NextRequest,
  userId: string | undefined,
  limiterType: keyof typeof ratelimit = 'general'
): Promise<{
  allowed: boolean;
  headers: Record<string, string>;
}> {
  const identifier = getClientIdentifier(req, userId);
  const limiter = ratelimit[limiterType];

  const result = await checkRateLimit(identifier, limiter);

  return {
    allowed: result.success,
    headers: getRateLimitHeaders(result),
  };
}

/**
 * Rate Limiting Utilities
 * Provides rate limiting functionality for API endpoints using Upstash Redis
 *
 * ✅ SECURITY FIX: Replaced in-memory rate limiting with Redis-backed implementation
 * to prevent abuse across serverless function instances.
 */

import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// ✅ Initialize Upstash Redis client
// Falls back to in-memory for development when Redis is not configured
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// In-memory fallback for development (when Redis is not configured)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitOptions {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
    keyGenerator?: (req: NextRequest) => string; // Function to generate rate limit key
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalRequests: number;
}

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return ip;
}

/**
 * Check if request is within rate limits (Redis-backed with in-memory fallback)
 */
export async function checkRateLimit(
    req: NextRequest,
    options: RateLimitOptions
): Promise<RateLimitResult> {
    const keyGenerator = options.keyGenerator || defaultKeyGenerator;
    const key = keyGenerator(req);

    // Use Redis if available (production), otherwise fall back to in-memory (development)
    if (redis) {
        return await checkRateLimitRedis(key, options);
    } else {
        return checkRateLimitMemory(key, options);
    }
}

/**
 * Redis-backed rate limiting (production)
 */
async function checkRateLimitRedis(
    key: string,
    options: RateLimitOptions
): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = options.windowMs;
    const maxRequests = options.maxRequests;
    const redisKey = `ratelimit:${key}`;

    // Get current count and expiry
    const [count, ttl] = await Promise.all([
        redis!.get<number>(redisKey),
        redis!.pttl(redisKey),
    ]);

    const currentCount = count || 0;
    const resetTime = ttl > 0 ? now + ttl : now + windowMs;

    if (currentCount >= maxRequests) {
        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetTime,
            totalRequests: currentCount,
        };
    }

    // Increment counter with expiry
    const newCount = currentCount + 1;
    if (currentCount === 0) {
        // First request - set with expiry
        await redis!.set(redisKey, newCount, { px: windowMs });
    } else {
        // Subsequent request - just increment
        await redis!.incr(redisKey);
    }

    return {
        allowed: true,
        remaining: maxRequests - newCount,
        resetTime,
        totalRequests: newCount,
    };
}

/**
 * In-memory rate limiting (development fallback)
 */
function checkRateLimitMemory(
    key: string,
    options: RateLimitOptions
): RateLimitResult {
    const now = Date.now();
    const windowMs = options.windowMs;
    const maxRequests = options.maxRequests;

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
        // First request or window expired
        record = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitStore.set(key, record);
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetTime: record.resetTime,
            totalRequests: 1,
        };
    }

    if (record.count >= maxRequests) {
        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetTime: record.resetTime,
            totalRequests: record.count,
        };
    }

    // Increment counter
    record.count++;
    rateLimitStore.set(key, record);

    return {
        allowed: true,
        remaining: maxRequests - record.count,
        resetTime: record.resetTime,
        totalRequests: record.count,
    };
}

/**
 * Rate limiter middleware function (now async for Redis support)
 */
export function ratelimit(options: RateLimitOptions) {
    return async (req: NextRequest) => {
        return await checkRateLimit(req, options);
    };
}

/**
 * Check rate limit for a user (not tied to HTTP request)
 */
export async function checkUserRateLimit(
    userId: string,
    options: RateLimitOptions
): Promise<RateLimitResult> {
    const key = `user:${userId}`;

    // Use Redis if available, otherwise fall back to in-memory
    if (redis) {
        return await checkRateLimitRedis(key, options);
    } else {
        return checkRateLimitMemory(key, options);
    }
}

/**
 * Create a pre-configured rate limiter for specific use cases
 */
export const createRateLimiter = (options: RateLimitOptions) => {
    if (!redis) {
        console.warn('[Rate Limit] Redis not configured - using in-memory fallback');
    }

    return {
        check: async (identifier: string) => {
            if (redis) {
                return await checkRateLimitRedis(identifier, options);
            } else {
                return checkRateLimitMemory(identifier, options);
            }
        }
    };
};

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
    // Expensive AI endpoints (voice, transcription)
    ai: createRateLimiter({ windowMs: 60 * 1000, maxRequests: 10 }), // 10 req/min

    // SMS/Twilio endpoints
    sms: createRateLimiter({ windowMs: 60 * 1000, maxRequests: 5 }), // 5 req/min

    // General API endpoints
    api: createRateLimiter({ windowMs: 60 * 1000, maxRequests: 60 }), // 60 req/min

    // Authentication endpoints
    auth: createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 }), // 5 req/15min
};
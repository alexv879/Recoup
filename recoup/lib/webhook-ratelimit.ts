/**
 * Webhook rate limiting utilities
 * Prevents abuse of webhook endpoints
 */

import { NextRequest } from 'next/server';

interface RateLimitRecord {
    count: number;
    resetTime: number;
    lastRequest: Date;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitRecord>();

export interface WebhookRateLimitOptions {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
    keyGenerator?: (req: NextRequest) => string;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}

/**
 * Default key generator for webhooks (uses IP + user agent)
 */
function defaultWebhookKeyGenerator(req: NextRequest): string {
    const ip = req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `${ip}:${userAgent}`;
}

/**
 * Check webhook rate limit
 */
export function checkWebhookRateLimit(
    req: NextRequest,
    options: WebhookRateLimitOptions
): RateLimitResult {
    const keyGenerator = options.keyGenerator || defaultWebhookKeyGenerator;
    const key = keyGenerator(req);

    const now = Date.now();
    const windowMs = options.windowMs;
    const maxRequests = options.maxRequests;

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
        // First request or window expired
        record = {
            count: 1,
            resetTime: now + windowMs,
            lastRequest: new Date(),
        };
        rateLimitStore.set(key, record);
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetTime: record.resetTime,
        };
    }

    if (record.count >= maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        return {
            allowed: false,
            remaining: 0,
            resetTime: record.resetTime,
            retryAfter,
        };
    }

    // Increment counter
    record.count++;
    record.lastRequest = new Date();
    rateLimitStore.set(key, record);

    return {
        allowed: true,
        remaining: maxRequests - record.count,
        resetTime: record.resetTime,
    };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': '100', // Default limit
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
        ...(result.retryAfter && {
            'Retry-After': result.retryAfter.toString(),
        }),
    };
}

// Clean up expired records periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Clean up every minute
/**
 * Rate Limiting Utilities
 * Provides rate limiting functionality for API endpoints
 */

import { NextRequest } from 'next/server';

// Simple in-memory rate limiter (for production, use Redis or similar)
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
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
}

/**
 * Check if request is within rate limits
 */
export function checkRateLimit(
    req: NextRequest,
    options: RateLimitOptions
): RateLimitResult {
    const keyGenerator = options.keyGenerator || defaultKeyGenerator;
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
 * Rate limiter middleware function
 */
export function ratelimit(options: RateLimitOptions) {
    return (req: NextRequest) => {
        return checkRateLimit(req, options);
    };
}

/**
 * Check rate limit for a user (not tied to HTTP request)
 */
export function checkUserRateLimit(
    userId: string,
    options: RateLimitOptions
): RateLimitResult {
    const key = `user:${userId}`;

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
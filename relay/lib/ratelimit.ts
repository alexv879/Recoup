/**
 * Rate limiting utilities (backward compatibility wrapper)
 *
 * This file provides backward compatibility for existing code
 * that uses the old rate limiting interface.
 */

import { rateLimiters, checkRateLimit as redisCheckRateLimit } from './redis';

// Default rate limiter for API endpoints
export const ratelimit = rateLimiters.api;

/**
 * Check rate limit for a user (backward compatibility)
 */
export async function checkRateLimit(
  identifier: string,
  limiter: any = ratelimit
): Promise<{ success: boolean; remaining: number }> {
  const result = await redisCheckRateLimit(limiter, identifier);
  return {
    success: result.success,
    remaining: result.remaining,
  };
}

// Export all rate limiters
export { rateLimiters };

/**
 * Cron Job Authentication Middleware
 *
 * Provides standardized authentication for cron endpoints
 * using the CRON_SECRET environment variable.
 *
 * Security Features:
 * - Prevents unauthorized access to cron endpoints
 * - Supports two authentication methods:
 *   1. x-cron-secret header
 *   2. Bearer token in Authorization header
 * - Logs unauthorized access attempts
 *
 * Usage:
 * ```typescript
 * import { verifyCronAuth } from '@/middleware/cronAuth';
 *
 * export async function GET(req: NextRequest) {
 *   const authResult = verifyCronAuth(req);
 *   if (!authResult.authorized) {
 *     return NextResponse.json(authResult.error, { status: authResult.status });
 *   }
 *
 *   // Process cron job...
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { logInfo, logError, logWarn } from '@/utils/logger';

export interface CronAuthResult {
  authorized: boolean;
  status?: number;
  error?: {
    error: string;
    message?: string;
  };
}

/**
 * Verify cron job authentication
 *
 * Accepts authentication via:
 * - x-cron-secret header
 * - Authorization: Bearer <secret> header
 */
export function verifyCronAuth(req: NextRequest): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET;

  // Check if CRON_SECRET is configured
  if (!cronSecret) {
    logError('CRON_SECRET not configured', new Error('Missing environment variable'));
    return {
      authorized: false,
      status: 500,
      error: {
        error: 'Configuration error',
        message: 'Cron secret not configured. Please set CRON_SECRET environment variable.'
      }
    };
  }

  // Method 1: Check x-cron-secret header
  const xCronSecret = req.headers.get('x-cron-secret');
  if (xCronSecret && xCronSecret === cronSecret) {
    logInfo('Cron job authenticated via x-cron-secret header');
    return { authorized: true };
  }

  // Method 2: Check Authorization header (Bearer token)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader === `Bearer ${cronSecret}`) {
    logInfo('Cron job authenticated via Authorization Bearer header');
    return { authorized: true };
  }

  // Authentication failed
  logWarn('Unauthorized cron job access attempt', {
    headers: {
      hasXCronSecret: !!xCronSecret,
      hasAuthHeader: !!authHeader
    },
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    userAgent: req.headers.get('user-agent')
  });

  return {
    authorized: false,
    status: 401,
    error: {
      error: 'Unauthorized',
      message: 'Invalid or missing cron authentication credentials'
    }
  };
}

/**
 * Create a standardized unauthorized response
 */
export function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message: 'Invalid or missing cron authentication credentials'
    },
    { status: 401 }
  );
}

/**
 * Higher-order function to wrap cron endpoints with authentication
 *
 * Usage:
 * ```typescript
 * export const GET = withCronAuth(async (req: NextRequest) => {
 *   // Your cron job logic here
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withCronAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authResult = verifyCronAuth(req);

    if (!authResult.authorized) {
      return NextResponse.json(authResult.error, { status: authResult.status });
    }

    return handler(req);
  };
}

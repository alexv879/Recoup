/**
 * CRON JOB: Reset Monthly Usage
 * GET /api/cron/reset-monthly-usage
 *
 * Scheduled to run on the 1st of every month at 00:00 UTC
 * Resets collectionsUsedThisMonth for all users to 0
 *
 * Security:
 * - Requires CRON_SECRET header to prevent unauthorized access
 * - Should be called only by Vercel Cron or authorized scheduler
 *
 * Setup in Vercel:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/reset-monthly-usage",
 *        "schedule": "0 0 1 * *"
 *      }]
 *    }
 * 2. Add CRON_SECRET to environment variables
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetMonthlyUsage } from '@/middleware/clerkPremiumGating';
import { logInfo, logError } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * Reset monthly usage for all users
 * GET /api/cron/reset-monthly-usage
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Verify cron secret
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      logError('CRON_SECRET not configured', new Error('Missing env var'));
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (cronSecret !== expectedSecret) {
      logError('Invalid cron secret', new Error('Unauthorized cron access'));
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logInfo('Monthly usage reset cron job started');

    // 2. Reset monthly usage for all users
    await resetMonthlyUsage();

    const duration = Date.now() - startTime;

    logInfo('Monthly usage reset completed', {
      duration,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Monthly usage reset completed',
      timestamp: new Date().toISOString(),
      duration,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;

    logError('Monthly usage reset failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to reset monthly usage',
        timestamp: new Date().toISOString(),
        duration,
      },
      { status: 500 }
    );
  }
}

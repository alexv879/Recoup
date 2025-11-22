/**
 * Revenue Recovery Metrics API
 * GET /api/revenue-recovery/metrics - Get user's revenue recovery metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  calculateRevenueRecovery,
  getQuickRecoverySummary,
  calculateGrowthMetrics,
} from '@/lib/revenue-recovery-calculator';

/**
 * GET /api/revenue-recovery/metrics
 * Get complete revenue recovery metrics
 * Query params:
 * - taxBracket: User's tax bracket (default 0.20)
 * - quick: If true, return quick summary only
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taxBracket = parseFloat(searchParams.get('taxBracket') || '0.20');
    const quick = searchParams.get('quick') === 'true';

    // Quick summary (faster)
    if (quick) {
      const summary = await getQuickRecoverySummary(userId);
      return NextResponse.json(summary);
    }

    // Full metrics
    const metrics = await calculateRevenueRecovery(userId, taxBracket);
    const growth = await calculateGrowthMetrics(userId);

    return NextResponse.json({
      ...metrics,
      growth,
    });
  } catch (error: any) {
    console.error('Revenue recovery metrics failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate metrics' },
      { status: 500 }
    );
  }
}

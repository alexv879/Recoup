/**
 * Cron Job: Process Recurring Invoices
 *
 * This endpoint should be called daily by a cron scheduler (e.g., Vercel Cron, GitHub Actions)
 * to automatically generate invoices from active recurring invoice schedules.
 *
 * Schedule: Run daily at 00:00 UTC
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-recurring-invoices",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processRecurringInvoices } from '@/lib/recurring-invoices';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Processing recurring invoices...');

    const results = await processRecurringInvoices();

    console.log('[CRON] Recurring invoices processed:', results);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CRON] Process recurring invoices error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process recurring invoices',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST method for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

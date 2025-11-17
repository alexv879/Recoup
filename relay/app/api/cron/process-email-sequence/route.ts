/**
 * Email Sequence Cron Job
 * 
 * GET /api/cron/process-email-sequence
 * 
 * Hourly cron job that triggers the email sequence worker to:
 * - Scan overdue invoices
 * - Send Day 5/15/30 reminders based on days overdue
 * - Track delivery and analytics
 * 
 * This endpoint should be configured in Vercel Cron or similar scheduler
 * 
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-email-sequence",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 * 
 * Per MASTER_IMPLEMENTATION_AUDIT_V1.md §4.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { runEmailSequenceWorker } from '@/jobs/emailSequenceWorker';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            logger.warn('Unauthorized cron job access attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        logger.info('Email sequence cron job started');

        // Run the worker
        const result = await runEmailSequenceWorker();

        logger.info('Email sequence cron job completed', result);

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        logger.error('Email sequence cron job failed', {
            error: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Allow POST as well for manual testing
export async function POST(request: NextRequest) {
    return GET(request);
}

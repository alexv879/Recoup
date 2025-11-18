/**
 * Collections Escalation Cron Job
 * 
 * Runs every 6 hours to automatically escalate overdue invoices
 * 
 * Schedule: every 6 hours
 * 
 * Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { runEscalationWorker } from '@/jobs/collectionsEscalator';
import { logInfo, logError } from '@/utils/logger';
import { handleApiError } from '@/utils/error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        // 1. Verify cron secret
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            throw new Error('CRON_SECRET not configured');
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            logError('Unauthorized cron job attempt', new Error('Invalid cron secret'));
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        logInfo('Starting collections escalation cron job');

        // 2. Run escalation worker
        const result = await runEscalationWorker();

        const duration = Date.now() - startTime;

        logInfo('Collections escalation cron job completed', {
            ...result,
            durationMs: duration,
        });

        return NextResponse.json({
            success: true,
            ...result,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        const duration = Date.now() - startTime;
        logError('Collections escalation cron job failed', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

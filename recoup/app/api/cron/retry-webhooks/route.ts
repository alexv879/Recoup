import { NextRequest, NextResponse } from 'next/server';
import { getWebhooksReadyForRetry, retryWebhook } from '@/lib/webhook-retry';
import { logInfo, logError } from '@/utils/logger';
import { withCronLock } from '@/lib/cronLock';

export const dynamic = 'force-dynamic';

/**
 * Retry Failed Webhooks Cron Job
 * POST /api/cron/retry-webhooks
 *
 * Retries webhooks that failed previously with exponential backoff
 * Should run every minute via Vercel Cron
 *
 * Cron schedule: * * * * * (every minute)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    logInfo('[cron/retry-webhooks] Starting webhook retry job');

    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      logError('[cron/retry-webhooks] Unauthorized - invalid CRON_SECRET');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Wrap job execution with distributed lock
    return await withCronLock(
      {
        jobName: 'retry-webhooks',
        lockDuration: 120, // 2 minutes max (job runs every minute)
        heartbeatInterval: 30, // Send heartbeat every 30s
      },
      async () => {
        // Get webhooks ready for retry
        const webhooks = await getWebhooksReadyForRetry();

        if (webhooks.length === 0) {
          logInfo('[cron/retry-webhooks] No webhooks ready for retry');
          return NextResponse.json({
            success: true,
            webhooksRetried: 0,
            duration: Date.now() - startTime,
          });
        }

        logInfo(`[cron/retry-webhooks] Found ${webhooks.length} webhooks to retry`);

        // Retry each webhook
        let successCount = 0;
        let failureCount = 0;

        for (const webhook of webhooks) {
          const success = await retryWebhook(webhook);
          if (success) {
            successCount++;
          } else {
            failureCount++;
          }
        }

        const duration = Date.now() - startTime;

        logInfo('[cron/retry-webhooks] Webhook retry job completed', {
          total: webhooks.length,
          successful: successCount,
          failed: failureCount,
          duration: `${duration}ms`,
        });

        return NextResponse.json({
          success: true,
          webhooksRetried: webhooks.length,
          successful: successCount,
          failed: failureCount,
          duration,
        });
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('[cron/retry-webhooks] Error in webhook retry job:', error);

    return NextResponse.json(
      {
        error: 'Webhook retry job failed',
        duration,
      },
      { status: 500 }
    );
  }
}

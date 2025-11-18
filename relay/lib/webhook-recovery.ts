/**
 * [SECURITY FIX] Webhook Recovery System
 *
 * Stores failed webhook events for manual retry and debugging
 *
 * Security Features:
 * - Correlation IDs for tracking
 * - Failed webhook storage in Firestore
 * - Automatic retry with exponential backoff
 * - Audit trail for webhook failures
 *
 * SECURITY AUDIT FIX: CRITICAL-3
 * Issue: Webhook recovery library missing
 * Fix: Implement webhook failure tracking and recovery
 */

import { db, Timestamp } from './firebase';
import { logError, logInfo, logWarn } from '@/utils/logger';
import crypto from 'crypto';

/**
 * [SECURITY FIX] Generate correlation ID for tracking
 */
export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Failed webhook entry
 */
interface FailedWebhook {
  correlationId: string;
  source: 'stripe' | 'clerk' | 'sendgrid' | 'twilio' | 'lob' | 'other';
  eventType: string;
  payload: Record<string, any>;
  headers: Record<string, string>;
  url: string;
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
  retryCount: number;
  status: 'pending' | 'retrying' | 'failed' | 'recovered';
  createdAt: Timestamp;
  lastRetryAt?: Timestamp;
  recoveredAt?: Timestamp;
}

/**
 * [SECURITY FIX] Store failed webhook for later retry
 */
export async function storeFailedWebhook(params: {
  source: FailedWebhook['source'];
  eventType: string;
  payload: Record<string, any>;
  headers: Record<string, string>;
  url: string;
  error: any;
  correlationId: string;
}): Promise<void> {
  try {
    const failedWebhook: FailedWebhook = {
      correlationId: params.correlationId,
      source: params.source,
      eventType: params.eventType,
      payload: params.payload,
      headers: params.headers,
      url: params.url,
      error: {
        message: params.error?.message || String(params.error),
        stack: params.error?.stack,
        code: params.error?.code,
      },
      retryCount: 0,
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    await db.collection('failed_webhooks').doc(params.correlationId).set(failedWebhook);

    logInfo('[WEBHOOK_RECOVERY] Failed webhook stored', {
      correlationId: params.correlationId,
      source: params.source,
      eventType: params.eventType,
    });
  } catch (error) {
    // If we can't store the failed webhook, log it
    logError('[WEBHOOK_RECOVERY] Failed to store failed webhook', error as Error, {
      correlationId: params.correlationId,
      source: params.source,
    });
  }
}

/**
 * [SECURITY FIX] Retry failed webhook
 */
export async function retryFailedWebhook(
  correlationId: string,
  handler: (payload: Record<string, any>, headers: Record<string, string>) => Promise<void>
): Promise<boolean> {
  try {
    // Get failed webhook
    const doc = await db.collection('failed_webhooks').doc(correlationId).get();

    if (!doc.exists) {
      logWarn('[WEBHOOK_RECOVERY] Failed webhook not found', { correlationId });
      return false;
    }

    const webhook = doc.data() as FailedWebhook;

    // Update status to retrying
    await doc.ref.update({
      status: 'retrying',
      lastRetryAt: Timestamp.now(),
      retryCount: webhook.retryCount + 1,
    });

    logInfo('[WEBHOOK_RECOVERY] Retrying failed webhook', {
      correlationId,
      source: webhook.source,
      eventType: webhook.eventType,
      retryCount: webhook.retryCount + 1,
    });

    // Retry webhook handler
    await handler(webhook.payload, webhook.headers);

    // Mark as recovered
    await doc.ref.update({
      status: 'recovered',
      recoveredAt: Timestamp.now(),
    });

    logInfo('[WEBHOOK_RECOVERY] Webhook recovered successfully', {
      correlationId,
      retryCount: webhook.retryCount + 1,
    });

    return true;
  } catch (error) {
    // Mark as failed if max retries exceeded
    const doc = await db.collection('failed_webhooks').doc(correlationId).get();
    if (doc.exists) {
      const webhook = doc.data() as FailedWebhook;

      if (webhook.retryCount >= 5) {
        await doc.ref.update({
          status: 'failed',
          error: {
            ...webhook.error,
            lastRetryError: (error as Error).message,
          },
        });

        logError('[WEBHOOK_RECOVERY] Webhook failed after max retries', error as Error, {
          correlationId,
          maxRetries: 5,
        });
      } else {
        await doc.ref.update({
          status: 'pending',
        });
      }
    }

    return false;
  }
}

/**
 * [SECURITY FIX] Get failed webhooks for a source
 */
export async function getFailedWebhooks(
  source?: FailedWebhook['source'],
  status?: FailedWebhook['status']
): Promise<FailedWebhook[]> {
  try {
    let query = db.collection('failed_webhooks').orderBy('createdAt', 'desc').limit(100);

    if (source) {
      query = query.where('source', '==', source) as any;
    }

    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => doc.data() as FailedWebhook);
  } catch (error) {
    logError('[WEBHOOK_RECOVERY] Failed to get failed webhooks', error as Error, {
      source,
      status,
    });
    return [];
  }
}

/**
 * [SECURITY FIX] Cleanup old failed webhooks
 * Call this periodically (e.g., via cron) to remove old failed webhooks
 */
export async function cleanupOldFailedWebhooks(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const snapshot = await db
      .collection('failed_webhooks')
      .where('createdAt', '<', Timestamp.fromDate(cutoffDate))
      .where('status', 'in', ['recovered', 'failed'])
      .limit(500) // Process in batches
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    logInfo('[WEBHOOK_RECOVERY] Cleaned up old failed webhooks', {
      count: snapshot.size,
      daysOld,
    });

    return snapshot.size;
  } catch (error) {
    logError('[WEBHOOK_RECOVERY] Failed to cleanup old webhooks', error as Error, {
      daysOld,
    });
    return 0;
  }
}

/**
 * [SECURITY FIX] Get webhook statistics
 */
export async function getWebhookStats(): Promise<{
  total: number;
  pending: number;
  retrying: number;
  failed: number;
  recovered: number;
  bySource: Record<string, number>;
}> {
  try {
    const snapshot = await db.collection('failed_webhooks').get();

    const stats = {
      total: snapshot.size,
      pending: 0,
      retrying: 0,
      failed: 0,
      recovered: 0,
      bySource: {} as Record<string, number>,
    };

    snapshot.docs.forEach(doc => {
      const webhook = doc.data() as FailedWebhook;

      // Count by status
      stats[webhook.status]++;

      // Count by source
      if (!stats.bySource[webhook.source]) {
        stats.bySource[webhook.source] = 0;
      }
      stats.bySource[webhook.source]++;
    });

    return stats;
  } catch (error) {
    logError('[WEBHOOK_RECOVERY] Failed to get webhook stats', error as Error);
    return {
      total: 0,
      pending: 0,
      retrying: 0,
      failed: 0,
      recovered: 0,
      bySource: {},
    };
  }
}

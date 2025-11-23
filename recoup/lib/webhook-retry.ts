/**
 * Webhook Retry Logic with Dead Letter Queue
 *
 * Handles failed webhooks with exponential backoff and dead letter queue
 */

import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';
import { FailedWebhook } from '@/types/models';
import { logInfo, logError, logWarn } from '@/utils/logger';

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 60000; // 1 minute

/**
 * Calculate next retry time with exponential backoff
 * Retry delays: 1min, 2min, 4min, 8min, 16min
 */
function calculateNextRetryTime(retryCount: number): Date {
  const delayMs = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
  return new Date(Date.now() + delayMs);
}

/**
 * Store a failed webhook for retry
 */
export async function storeFailedWebhook(params: {
  source: 'stripe' | 'clerk' | 'sendgrid' | 'twilio';
  eventType: string;
  eventId?: string;
  payload: any;
  signature?: string;
  error: string;
}): Promise<void> {
  try {
    const webhookId = `${params.source}_${params.eventType}_${Date.now()}`;

    const failedWebhook: FailedWebhook = {
      webhookId,
      source: params.source,
      eventType: params.eventType,
      eventId: params.eventId,
      payload: params.payload,
      signature: params.signature,
      error: params.error,
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: Timestamp.fromDate(calculateNextRetryTime(0)),
      lastAttemptAt: Timestamp.now(),
      status: 'pending_retry',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection(COLLECTIONS.FAILED_WEBHOOKS).doc(webhookId).set(failedWebhook);

    logWarn('Webhook failed - stored for retry', {
      webhookId,
      source: params.source,
      eventType: params.eventType,
      error: params.error,
    });
  } catch (error) {
    logError('Failed to store failed webhook', error);
    // Don't throw - this is a backup mechanism
  }
}

/**
 * Retry a failed webhook
 */
export async function retryWebhook(webhook: FailedWebhook): Promise<boolean> {
  try {
    logInfo('Retrying webhook', {
      webhookId: webhook.webhookId,
      source: webhook.source,
      eventType: webhook.eventType,
      retryCount: webhook.retryCount,
    });

    // Mark as retrying
    await db.collection(COLLECTIONS.FAILED_WEBHOOKS).doc(webhook.webhookId).update({
      status: 'retrying',
      updatedAt: Timestamp.now(),
    });

    // Route to appropriate handler based on source
    let success = false;
    switch (webhook.source) {
      case 'stripe':
        success = await retryStripeWebhook(webhook);
        break;
      case 'clerk':
        // Clerk webhook retry not yet implemented - skip retry
        logWarn('Clerk webhook retry not implemented yet', { webhookId: webhook.webhookId });
        success = false;
        break;
      case 'sendgrid':
        // SendGrid webhooks not yet implemented - skip retry
        logWarn('SendGrid webhook retry not implemented yet', { webhookId: webhook.webhookId });
        success = false;
        break;
      case 'twilio':
        // Twilio webhooks not yet implemented - skip retry
        logWarn('Twilio webhook retry not implemented yet', { webhookId: webhook.webhookId });
        success = false;
        break;
      default:
        logError('Unknown webhook source', { source: webhook.source });
        success = false;
    }

    if (success) {
      // Delete successful retry
      await db.collection(COLLECTIONS.FAILED_WEBHOOKS).doc(webhook.webhookId).delete();
      logInfo('Webhook retry successful - removed from queue', {
        webhookId: webhook.webhookId,
      });
      return true;
    } else {
      // Increment retry count
      const newRetryCount = webhook.retryCount + 1;

      if (newRetryCount >= MAX_RETRIES) {
        // Move to dead letter queue
        await db.collection(COLLECTIONS.FAILED_WEBHOOKS).doc(webhook.webhookId).update({
          status: 'dead_letter',
          retryCount: newRetryCount,
          updatedAt: Timestamp.now(),
        });

        logError('Webhook moved to dead letter queue after max retries', {
          webhookId: webhook.webhookId,
          source: webhook.source,
          eventType: webhook.eventType,
          retries: newRetryCount,
        });
      } else {
        // Schedule next retry
        await db.collection(COLLECTIONS.FAILED_WEBHOOKS).doc(webhook.webhookId).update({
          status: 'pending_retry',
          retryCount: newRetryCount,
          nextRetryAt: Timestamp.fromDate(calculateNextRetryTime(newRetryCount)),
          lastAttemptAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        logWarn('Webhook retry failed - scheduled for next retry', {
          webhookId: webhook.webhookId,
          nextRetryAt: calculateNextRetryTime(newRetryCount),
          retryCount: newRetryCount,
        });
      }
      return false;
    }
  } catch (error) {
    logError('Error during webhook retry', error);
    return false;
  }
}

/**
 * Retry Stripe webhook
 */
async function retryStripeWebhook(webhook: FailedWebhook): Promise<boolean> {
  try {
    // Import the webhook handler dynamically
    const { handleStripeWebhookEvent } = await import('@/app/api/webhook/stripe/route');

    // Re-process the webhook event
    await handleStripeWebhookEvent(webhook.payload);

    return true;
  } catch (error) {
    logError('Stripe webhook retry failed', error);
    return false;
  }
}

/**
 * Retry Clerk webhook
 * COMMENTED OUT: Clerk webhook handlers not yet implemented
 */
// async function retryClerkWebhook(webhook: FailedWebhook): Promise<boolean> {
//   try {
//     // Import the webhook handler dynamically
//     const { handleClerkWebhook } = await import('@/app/api/webhooks/clerk/route');
//
//     // Re-process the webhook
//     await handleClerkWebhook(webhook.payload);
//
//     return true;
//   } catch (error) {
//     logError('Clerk webhook retry failed', error);
//     return false;
//   }
// }

/**
 * Retry SendGrid webhook
 * COMMENTED OUT: SendGrid webhook handlers not yet implemented
 */
// async function retrySendGridWebhook(webhook: FailedWebhook): Promise<boolean> {
//   try {
//     // Import the webhook handler dynamically
//     const { handleSendGridWebhook } = await import('@/app/api/webhooks/sendgrid/route');
//
//     // Re-process the webhook
//     await handleSendGridWebhook(webhook.payload);
//
//     return true;
//   } catch (error) {
//     logError('SendGrid webhook retry failed', error);
//     return false;
//   }
// }

/**
 * Retry Twilio webhook
 * COMMENTED OUT: Twilio webhook handlers not yet implemented
 */
// async function retryTwilioWebhook(webhook: FailedWebhook): Promise<boolean> {
//   try {
//     // Import the webhook handler dynamically
//     const { handleTwilioWebhook } = await import('@/app/api/webhooks/twilio/route');
//
//     // Re-process the webhook
//     await handleTwilioWebhook(webhook.payload);
//
//     return true;
//   } catch (error) {
//     logError('Twilio webhook retry failed', error);
//     return false;
//   }
// }

/**
 * Get all webhooks ready for retry
 */
export async function getWebhooksReadyForRetry(): Promise<FailedWebhook[]> {
  try {
    const now = Timestamp.now();

    const snapshot = await db
      .collection(COLLECTIONS.FAILED_WEBHOOKS)
      .where('status', '==', 'pending_retry')
      .where('nextRetryAt', '<=', now)
      .limit(50) // Process max 50 at a time
      .get();

    return snapshot.docs.map(doc => doc.data() as FailedWebhook);
  } catch (error) {
    logError('Failed to get webhooks ready for retry', error);
    return [];
  }
}

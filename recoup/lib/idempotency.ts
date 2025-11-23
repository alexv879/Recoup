import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';
import { logInfo, logError } from '@/utils/logger';

/**
 * Processed Event tracking for webhook idempotency
 *
 * Ensures webhooks are processed exactly once even if delivered multiple times by providers.
 * Stripe, SendGrid, Twilio, and other webhook providers may retry deliveries if they don't
 * receive a 2xx response, which could cause duplicate transactions, emails, or other side effects.
 */

export interface ProcessedEvent {
  eventId: string;
  source: 'stripe' | 'sendgrid' | 'twilio' | 'clerk';
  eventType: string;
  processedAt: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp; // Auto-delete after 30 days
  metadata?: {
    userId?: string;
    invoiceId?: string;
    customerId?: string;
    [key: string]: any;
  };
}

/**
 * Check if an event has already been processed
 * Returns true if the event was already processed
 */
export async function isEventProcessed(
  eventId: string,
  source: ProcessedEvent['source']
): Promise<boolean> {
  try {
    const docId = `${source}_${eventId}`;
    const doc = await db
      .collection(COLLECTIONS.PROCESSED_EVENTS)
      .doc(docId)
      .get();

    if (doc.exists) {
      const data = doc.data() as ProcessedEvent;
      logInfo(`[idempotency] Event ${eventId} from ${source} already processed at ${data.processedAt.toDate().toISOString()}`);
      return true;
    }

    return false;
  } catch (error) {
    logError('[idempotency] Error checking event processing status:', error);
    // On error, assume not processed to avoid losing events
    // The atomic transaction in markEventAsProcessed will prevent duplicates
    return false;
  }
}

/**
 * Mark an event as processed (atomic operation)
 * Returns true if successfully marked, false if already processed
 *
 * This uses Firestore transactions to ensure atomicity - if two webhook
 * deliveries arrive simultaneously, only one will succeed in marking the event.
 */
export async function markEventAsProcessed(
  eventId: string,
  source: ProcessedEvent['source'],
  eventType: string,
  metadata?: ProcessedEvent['metadata']
): Promise<boolean> {
  try {
    const docId = `${source}_${eventId}`;
    const docRef = db.collection(COLLECTIONS.PROCESSED_EVENTS).doc(docId);

    // Use transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      // If document already exists, event was already processed
      if (doc.exists) {
        logInfo(`[idempotency] Event ${eventId} from ${source} already marked as processed`);
        return false;
      }

      // Mark as processed
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(
        now.toMillis() + 30 * 24 * 60 * 60 * 1000 // 30 days
      );

      const processedEvent: ProcessedEvent = {
        eventId,
        source,
        eventType,
        processedAt: now,
        createdAt: now,
        expiresAt,
        metadata,
      };

      transaction.set(docRef, processedEvent);
      logInfo(`[idempotency] Marked event ${eventId} from ${source} as processed`);
      return true;
    });

    return result;
  } catch (error) {
    logError('[idempotency] Error marking event as processed:', error);
    throw error;
  }
}

/**
 * Process an event with idempotency protection
 *
 * This is a higher-order function that wraps event handlers to ensure
 * they only execute once per event ID, even with duplicate deliveries.
 *
 * Usage:
 * ```typescript
 * await processWithIdempotency(
 *   event.id,
 *   'stripe',
 *   event.type,
 *   async () => {
 *     // Your event handler logic here
 *     await handleCheckoutCompleted(session);
 *   },
 *   { invoiceId: 'inv_123', freelancerId: 'user_456' }
 * );
 * ```
 */
export async function processWithIdempotency<T>(
  eventId: string,
  source: ProcessedEvent['source'],
  eventType: string,
  handler: () => Promise<T>,
  metadata?: ProcessedEvent['metadata']
): Promise<{ processed: boolean; result?: T; alreadyProcessed: boolean }> {
  try {
    // First check if already processed (fast path)
    const alreadyProcessed = await isEventProcessed(eventId, source);
    if (alreadyProcessed) {
      return { processed: false, alreadyProcessed: true };
    }

    // Try to mark as processed atomically
    const marked = await markEventAsProcessed(eventId, source, eventType, metadata);

    if (!marked) {
      // Another concurrent request marked it first
      return { processed: false, alreadyProcessed: true };
    }

    // Now safe to process - we have the lock
    const result = await handler();

    return { processed: true, result, alreadyProcessed: false };
  } catch (error) {
    logError('[idempotency] Error in processWithIdempotency:', error);
    throw error;
  }
}

/**
 * Clean up old processed events (for maintenance cron job)
 * Deletes events older than expiresAt timestamp
 */
export async function cleanupOldProcessedEvents(): Promise<number> {
  try {
    const now = Timestamp.now();
    const snapshot = await db
      .collection(COLLECTIONS.PROCESSED_EVENTS)
      .where('expiresAt', '<=', now)
      .limit(500) // Process in batches
      .get();

    if (snapshot.empty) {
      return 0;
    }

    // Batch delete
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    logInfo(`[idempotency] Cleaned up ${snapshot.size} expired processed events`);
    return snapshot.size;
  } catch (error) {
    logError('[idempotency] Error cleaning up processed events:', error);
    return 0;
  }
}

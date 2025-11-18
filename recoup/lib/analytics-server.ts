/**
 * SERVER-SIDE ANALYTICS
 * Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.8
 *
 * Server-side event tracking for:
 * - API routes (payment_received, collections_escalated, etc.)
 * - Background jobs (k_factor_report_generated)
 * - Email workers (reminder_scheduled)
 *
 * Features:
 * - Firestore backup for all events (cohort queries)
 * - Mixpanel server-side tracking
 * - Event validation & enrichment
 */

import { logInfo, logError } from '@/utils/logger';
import type { AnalyticsEvent, EventProperties } from './analytics';

// Environment check
const ANALYTICS_ENABLED =
  process.env.NODE_ENV === 'production' ||
  process.env.ENABLE_ANALYTICS === 'true';

const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN || process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

// ============================================================
// FIRESTORE BACKUP (for cohort queries & retention analysis)
// ============================================================

interface AnalyticsEventRecord {
  event: string;
  user_id?: string;
  properties: Record<string, any>;
  timestamp: number;
  created_at: Date;
}

/**
 * Save event to Firestore for backup & cohort analysis
 * Collection: analytics_events
 */
async function saveToFirestore(
  event: AnalyticsEvent,
  userId: string | undefined,
  properties: EventProperties
): Promise<void> {
  if (!ANALYTICS_ENABLED) {
    return;
  }

  try {
    // Lazy import Firestore (only when needed)
    const { db } = await import('@/lib/firebaseAdmin');

    const eventRecord: AnalyticsEventRecord = {
      event,
      user_id: userId,
      properties: properties as Record<string, any>,
      timestamp: Date.now(),
      created_at: new Date(),
    };

    await db.collection('analytics_events').add(eventRecord);

    logInfo('Event saved to Firestore', { event, userId });
  } catch (error) {
    // Don't fail the main operation if analytics fails
    logError('Failed to save event to Firestore', error as Error);
  }
}

// ============================================================
// MIXPANEL SERVER-SIDE TRACKING
// ============================================================

let mixpanel: any = null;

async function initializeMixpanel() {
  if (mixpanel) return mixpanel;

  if (!MIXPANEL_TOKEN) {
    logError('MIXPANEL_TOKEN not configured', new Error('Missing env var'));
    return null;
  }

  try {
    const Mixpanel = await import('mixpanel');
    mixpanel = Mixpanel.init(MIXPANEL_TOKEN, {
      protocol: 'https',
    });

    logInfo('Mixpanel server-side initialized');
    return mixpanel;
  } catch (error) {
    logError('Failed to initialize Mixpanel server-side', error as Error);
    return null;
  }
}

// ============================================================
// SERVER-SIDE TRACKING FUNCTIONS
// ============================================================

/**
 * Track server-side event
 * Automatically forwards to both Mixpanel and Firestore
 */
export async function trackServerEvent(
  event: AnalyticsEvent,
  properties?: EventProperties,
  userId?: string
): Promise<void> {
  if (!ANALYTICS_ENABLED) {
    console.log('[Server Analytics Debug]', event, properties);
    return;
  }

  try {
    // Enrich with server-side metadata
    const enrichedProperties = {
      ...properties,
      timestamp: Date.now(),
      server_side: true,
    };

    // 1. Save to Firestore (backup for cohort queries)
    await saveToFirestore(event, userId, enrichedProperties);

    // 2. Send to Mixpanel
    const mp = await initializeMixpanel();
    if (mp && userId) {
      mp.track(event, {
        distinct_id: userId,
        ...enrichedProperties,
      });
    }

    logInfo('Server event tracked', { event, userId, properties: enrichedProperties });
  } catch (error) {
    // Don't fail the main operation if analytics fails
    logError('Failed to track server event', error as Error);
  }
}

/**
 * Identify user on server (e.g., after signup)
 */
export async function identifyServerUser(
  userId: string,
  properties?: Record<string, any>
): Promise<void> {
  if (!ANALYTICS_ENABLED) {
    console.log('[Server Analytics Debug] Identify:', userId, properties);
    return;
  }

  try {
    const mp = await initializeMixpanel();
    if (mp) {
      mp.people.set(userId, {
        $distinct_id: userId,
        ...properties,
      });

      logInfo('Server user identified', { userId, properties });
    }
  } catch (error) {
    logError('Failed to identify server user', error as Error);
  }
}

/**
 * Increment user property on server (e.g., total_invoices_created)
 */
export async function incrementServerUserProperty(
  userId: string,
  property: string,
  value: number = 1
): Promise<void> {
  if (!ANALYTICS_ENABLED) {
    console.log('[Server Analytics Debug] Increment:', userId, property, value);
    return;
  }

  try {
    const mp = await initializeMixpanel();
    if (mp) {
      mp.people.increment(userId, property, value);
      logInfo('Server user property incremented', { userId, property, value });
    }
  } catch (error) {
    logError('Failed to increment server user property', error as Error);
  }
}

// ============================================================
// BATCH EVENT TRACKING (for jobs & cron)
// ============================================================

/**
 * Track multiple events in batch (for weekly reports, etc.)
 */
export async function trackBatchEvents(
  events: Array<{ event: AnalyticsEvent; properties?: EventProperties; userId?: string }>
): Promise<void> {
  if (!ANALYTICS_ENABLED) {
    console.log('[Server Analytics Debug] Batch:', events.length, 'events');
    return;
  }

  try {
    await Promise.all(
      events.map(({ event, properties, userId }) =>
        trackServerEvent(event, properties, userId)
      )
    );

    logInfo('Batch events tracked', { count: events.length });
  } catch (error) {
    logError('Failed to track batch events', error as Error);
  }
}

// ============================================================
// COHORT QUERY HELPERS (Firestore)
// ============================================================

/**
 * Query events for a specific user (cohort analysis)
 */
export async function getUserEvents(
  userId: string,
  options?: {
    eventType?: AnalyticsEvent;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<AnalyticsEventRecord[]> {
  try {
    const { db } = await import('@/lib/firebaseAdmin');

    let query = db
      .collection('analytics_events')
      .where('user_id', '==', userId)
      .orderBy('timestamp', 'desc');

    if (options?.eventType) {
      query = query.where('event', '==', options.eventType);
    }

    if (options?.startDate) {
      query = query.where('created_at', '>=', options.startDate);
    }

    if (options?.endDate) {
      query = query.where('created_at', '<=', options.endDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => doc.data() as AnalyticsEventRecord);
  } catch (error) {
    logError('Failed to query user events', error as Error);
    return [];
  }
}

/**
 * Get funnel conversion rates (for weekly reports)
 * Example: signup_completed → first_invoice_created → invoice_sent → payment_received
 */
export async function getFunnelStats(
  startDate: Date,
  endDate: Date
): Promise<{
  signups: number;
  firstInvoice: number;
  invoiceSent: number;
  paymentReceived: number;
  conversionRate: number;
}> {
  try {
    const { db } = await import('@/lib/firebaseAdmin');

    const eventsRef = db
      .collection('analytics_events')
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate);

    const [signupDocs, firstInvoiceDocs, invoiceSentDocs, paymentDocs] = await Promise.all([
      eventsRef.where('event', '==', 'signup_completed').get(),
      eventsRef.where('event', '==', 'first_invoice_created').get(),
      eventsRef.where('event', '==', 'invoice_sent').get(),
      eventsRef.where('event', '==', 'payment_received').get(),
    ]);

    const signups = signupDocs.size;
    const firstInvoice = firstInvoiceDocs.size;
    const invoiceSent = invoiceSentDocs.size;
    const paymentReceived = paymentDocs.size;

    const conversionRate = signups > 0 ? (paymentReceived / signups) * 100 : 0;

    return {
      signups,
      firstInvoice,
      invoiceSent,
      paymentReceived,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  } catch (error) {
    logError('Failed to get funnel stats', error as Error);
    return {
      signups: 0,
      firstInvoice: 0,
      invoiceSent: 0,
      paymentReceived: 0,
      conversionRate: 0,
    };
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  track: trackServerEvent,
  identify: identifyServerUser,
  increment: incrementServerUserProperty,
  trackBatch: trackBatchEvents,
  getUserEvents,
  getFunnelStats,
};

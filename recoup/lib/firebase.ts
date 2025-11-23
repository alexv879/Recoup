import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logInfo, logError } from '@/utils/logger';

// Only initialize Firebase on the server side
if (typeof window === 'undefined') {
  // Initialize Firebase Admin SDK (only once)
  // During build, Firebase may not be fully configured - this is expected
  if (!getApps().length) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      // Only initialize if credentials are provided
      if (projectId && clientEmail && privateKey) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        logInfo('Firebase Admin initialized successfully');
      } else {
        logInfo('Firebase credentials not configured - app will not function at runtime');
      }
    } catch (error) {
      logError('Firebase Admin initialization error', error);
      // Don't throw during build - allow build to complete
      if (process.env.NODE_ENV !== 'production') {
        logInfo('Continuing despite Firebase error (build mode)');
      }
    }
  }
}

// Export Firestore instance with lazy initialization
let dbInstance: ReturnType<typeof getFirestore> | null = null;

function getDb() {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin SDK cannot be used on the client side');
  }

  if (!dbInstance) {
    if (!getApps().length) {
      throw new Error('Firebase is not initialized. Make sure environment variables are configured.');
    }
    dbInstance = getFirestore();
  }
  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(target, prop) {
    return (getDb() as any)[prop];
  }
});

// Alias for backward compatibility
export const firestore = db;

// Export Timestamp and FieldValue for convenience
export { Timestamp, FieldValue };

// Export Firebase Storage instance (server-side only)
export const storage = typeof window === 'undefined' ? getStorage() : null;

// Collection names (for type safety)
export const COLLECTIONS = {
  USERS: 'users',
  INVOICES: 'invoices',
  PAYMENT_CONFIRMATIONS: 'payment_confirmations',
  PAYMENT_CLAIMS: 'payment_claims',
  COLLECTION_ATTEMPTS: 'collection_attempts',
  CLIENTS: 'clients',
  NOTIFICATIONS: 'notifications',
  TRANSACTIONS: 'transactions',
  REFERRALS: 'referrals',
  REFERRAL_CREDITS: 'referral_credits',
  REFERRAL_PAYOUTS: 'referral_payouts',
  USER_BEHAVIOR_PROFILE: 'user_behavior_profile',
  USER_STATS: 'user_stats',
  USER_EVENTS: 'user_events',
  DAILY_SUMMARIES: 'daily_summaries',
  EMAILS_SENT: 'emails_sent',
  ONBOARDING_PROGRESS: 'onboarding_progress',
  AGENCY_HANDOFFS: 'agency_handoffs',
  FAILED_WEBHOOKS: 'failed_webhooks',
  ESCALATION_STATES: 'escalation_states',
  ESCALATION_TIMELINE: 'escalation_timeline',
  PROCESSED_EVENTS: 'processed_events',
  SMS_OPT_OUTS: 'sms_opt_outs',
  SMS_OPT_OUT_AUDIT: 'sms_opt_out_audit',
  SMS_REPLIES: 'sms_replies',
} as const;

// Helper function to convert Firestore Timestamp to Date
export function timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  return timestamp.toDate();
}

// Helper function to convert Date to Firestore Timestamp
export function dateToTimestamp(date: Date | string | null | undefined): Timestamp | null {
  if (!date) return null;
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date));
  }
  return Timestamp.fromDate(date);
}

// Server timestamp helper
export function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

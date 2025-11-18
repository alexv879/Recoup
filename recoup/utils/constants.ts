// ============ APPLICATION CONSTANTS ============

export const APP_NAME = 'Recoup';
export const APP_DESCRIPTION = 'Smart invoicing and payment tracking for freelancers';

// ============ COMMISSION & PRICING ============

export const RECOUP_COMMISSION_RATE = 0.03; // 3%
export const COLLECTIONS_DEMO_LIMIT_FREE = 1; // 1 free collection per month

// ============ TIMING CONSTANTS ============

export const COLLECTION_DAY_5_REMINDER = 5; // Days after due date (Email - Friendly)
export const COLLECTION_DAY_15_REMINDER = 15; // Days after due date (Email + SMS - Firm)
export const COLLECTION_DAY_30_REMINDER = 30; // Days after due date (Email + SMS + Letter - Final/Physical Letter - PREMIUM)
export const COLLECTION_DAY_45_AGENCY_HANDOFF = 45; // Days after due date (Agency Escalation - PREMIUM)
export const PAYMENT_CONFIRMATION_TOKEN_EXPIRY_DAYS = 30;
export const NOTIFICATION_EXPIRY_DAYS = 30;

// ============ NOTIFICATION CONSTANTS ============

export const NOTIFICATION_TYPES = {
  INVOICE_DROUGHT: 'invoice_drought',
  PAYMENT_DELAY: 'payment_delay',
  WIN: 'win',
  PREDICTION: 'prediction',
  OPPORTUNITY: 'opportunity',
  DAILY_DIGEST: 'daily_digest',
} as const;

export const MAX_NOTIFICATIONS_PER_DAY = 3;
export const NOTIFICATION_CONFIDENCE_THRESHOLD = 0.6;

// ============ STATUS CONSTANTS ============

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  IN_COLLECTIONS: 'in_collections',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_CONFIRMATION_STATUS = {
  PENDING_CLIENT: 'pending_client',
  CLIENT_CONFIRMED: 'client_confirmed',
  BOTH_CONFIRMED: 'both_confirmed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

// ============ PAYMENT METHODS ============

export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
} as const;

// ============ SUBSCRIPTION TIERS ============

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PAID: 'paid',        // ✅ KEPT for backward compatibility
  STARTER: 'starter',  // ✨ NEW - £19 founding / £38 standard
  GROWTH: 'growth',    // ✨ NEW - £39 founding / £78 standard (Most Popular)
  PRO: 'pro'           // ✨ NEW - £75 founding / £150 standard
} as const;

// Type helper for subscription tiers
export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];

/**
 * Normalize legacy 'paid' tier to new tier system
 * Maps old 'paid' tier to 'pro' (default paid tier)
 * @param tier - User's subscription tier
 * @returns Normalized tier string
 */
export function normalizeTier(tier: string): SubscriptionTier {
  if (tier === 'paid') return 'pro'; // Legacy support: paid → pro
  return tier as SubscriptionTier;
}

/**
 * Tier hierarchy levels (for upgrade logic)
 * Higher number = higher tier
 */
export const TIER_LEVELS = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
  // Legacy support
  paid: 2, // Map old 'paid' to 'growth' level
} as const;

/**
 * Collection limits per tier (monthly)
 * Based on invoice volume percentiles from business plan
 */
export const COLLECTIONS_LIMITS = {
  free: 1,           // 1 demo collection per month
  starter: 10,       // 50th percentile: 6-8 invoices/month
  growth: 25,        // 75th percentile: 12-15 invoices/month
  pro: Number.MAX_SAFE_INTEGER, // 90th percentile: 20+ invoices/month (unlimited)
  // Legacy support
  paid: 25,          // Old 'paid' tier gets growth limits
} as const;

/**
 * Founding member pricing (50% off for life)
 * First 50 signups lock in these prices forever
 */
export const FOUNDING_MEMBER_PRICING = {
  starter: 9.50,  // £9.50/month (vs £19 standard)
  growth: 19.50,  // £19.50/month (vs £39 standard)
  pro: 37.50,     // £37.50/month (vs £75 standard)
} as const;

/**
 * Standard pricing (after founding 50)
 */
export const STANDARD_PRICING = {
  starter: 19,   // £19/month
  growth: 39,   // £39/month
  pro: 75,      // £75/month
} as const;

/**
 * Founding member program limit
 */
export const FOUNDING_MEMBER_LIMIT = 50;

// ============ BUSINESS TYPES ============

export const BUSINESS_TYPES = {
  FREELANCER: 'freelancer',
  AGENCY: 'agency',
  CONSULTANT: 'consultant',
} as const;

// ============ GAMIFICATION CONSTANTS ============

export const ACHIEVEMENTS = {
  FIRST_INVOICE: {
    id: 'first_invoice',
    name: 'First Invoice',
    description: 'Created your first invoice',
    threshold: 500,
  },
  COLLECTOR_5K: {
    id: 'collector_5k',
    name: 'Collector 5K',
    description: 'Collected £5,000',
    threshold: 5000,
  },
  COLLECTOR_50K: {
    id: 'collector_50k',
    name: 'Collector 50K',
    description: 'Collected £50,000',
    threshold: 50000,
  },
  RELIABLE: {
    id: 'reliable',
    name: 'Reliable',
    description: '90% on-time payments',
    threshold: 90,
  },
  WEEK_STREAK: {
    id: 'week_streak',
    name: 'Week Streak',
    description: '7 days without overdue',
    threshold: 7,
  },
  MONTH_STREAK: {
    id: 'month_streak',
    name: 'Month Streak',
    description: '30 days without overdue',
    threshold: 30,
  },
  TOP_100: {
    id: 'top_100',
    name: 'Top 100',
    description: 'Ranked in top 100 users',
    threshold: 100,
  },
} as const;

export const POINTS_PER_1000_COLLECTED = 1;
export const POINTS_PER_STREAK_DAY = 1;
export const POINTS_PER_BADGE = 10;
export const POINTS_PER_LEVEL = 100;

// ============ REFERRAL CONSTANTS ============

export const REFERRAL_CREDIT_REFERRER = 5; // £5
export const REFERRAL_CREDIT_REFERRED = 5; // £5

// ============ RATE LIMITING ============

export const RATE_LIMIT = {
  GENERAL: { requests: 10, window: '10s' },
  AUTH: { requests: 5, window: '60s' },
  AI: { requests: 3, window: '60s' },
} as const;

// ============ CURRENCY ============

export const DEFAULT_CURRENCY = 'GBP';
export const SUPPORTED_CURRENCIES = ['GBP', 'USD', 'EUR'] as const;

// ============ LANGUAGES ============

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'] as const;
export const DEFAULT_LANGUAGE = 'en';

// ============ TIMEZONES ============

export const DEFAULT_TIMEZONE = 'Europe/London';

// ============ DEFAULT QUIET HOURS ============

export const DEFAULT_QUIET_HOURS = {
  start: '21:00',
  end: '08:00',
} as const;

// ============ EMAIL TEMPLATES ============

export const EMAIL_TEMPLATES = {
  INVOICE: 'invoice',
  REMINDER_DAY_7: 'reminder_day_7',
  REMINDER_DAY_21: 'reminder_day_21',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  NOTIFICATION: 'notification',
} as const;

// ============ VALIDATION CONSTANTS ============

export const VALIDATION = {
  MAX_INVOICE_DESCRIPTION_LENGTH: 500,
  MAX_CLIENT_NAME_LENGTH: 100,
  MAX_BUSINESS_NAME_LENGTH: 100,
  MAX_NOTE_LENGTH: 1000,
  MIN_INVOICE_AMOUNT: 0.01,
  MAX_INVOICE_AMOUNT: 1000000,
  UK_ACCOUNT_NUMBER_LENGTH: 8,
  UK_SORT_CODE_LENGTH: 6,
} as const;

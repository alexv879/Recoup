// This is a placeholder for a real Timestamp type, e.g., from Firebase
export interface Timestamp {
  toDate: () => Date;
}

export interface BusinessAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country?: string;
}

/**
 * SMS Opt-Out Record
 *
 * UK PECR Compliance: Tracks when a client opted out of SMS communications
 * from a specific freelancer. Must be honored immediately.
 *
 * Task 1.2 - Production Readiness Refactoring
 */
export interface SmsOptOutRecord {
  optedOutAt: string; // ISO 8601 timestamp
  reason: 'user_request' | 'bounce' | 'complaint' | 'manual';
  keyword?: string; // e.g., "STOP", "UNSUBSCRIBE"
  twilioMessageSid?: string; // Twilio message ID that triggered opt-out
}

/**
 * Collections Consent
 *
 * Tracks user consent for various collections activities.
 * GDPR and UK PECR compliant.
 */
export interface CollectionsConsent {
  // Freelancer-level consent flags
  smsConsent?: boolean;
  smsOptedOut?: boolean; // Global SMS disable for this freelancer
  callConsent?: boolean;
  callRecordingConsent?: boolean;
  physicalMailConsent?: boolean;
  physicalMailOptedOut?: boolean;
  dataStorageConsent?: boolean;

  // Consent metadata
  consentDate?: Date | Timestamp;
  consentVersion?: string;
  ipAddress?: string;
  lastUpdated?: string; // ISO 8601 timestamp

  // Client-specific opt-outs (UK PECR compliance - Task 1.2)
  // Maps normalized phone number → opt-out record
  // Example: { "+447700900123": { optedOutAt: "2025-01-15T10:30:00Z", reason: "user_request", keyword: "STOP" } }
  smsOptOuts?: {
    [normalizedClientPhone: string]: SmsOptOutRecord;
  };
}

export interface User {
  userId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  businessType?: 'freelancer' | 'agency' | 'consultant';
  subscriptionTier: 'free' | 'starter' | 'growth' | 'pro';
  subscriptionStatus?: 'active' | 'inactive' | 'cancelled';
  stripeCustomerId?: string; // Stripe customer ID for subscription management
  collectionsEnabled: boolean;
  collectionsUsage?: { [key: string]: number }; // e.g. { 'sms': 5, 'letters': 1 }
  collectionsConsent?: CollectionsConsent; // Whether user has consented to collections
  monthlyUsageResetDate?: Date | Timestamp; // Last time monthly usage was reset
  isFoundingMember?: boolean; // Whether user is a founding member (50% discount for life)
  foundingMemberNumber?: string; // Unique founding member number
  foundingMemberJoinedAt?: Date | Timestamp; // When they became a founding member
  lockedInPrice?: number; // Locked-in price for founding members
  phoneNumber?: string; // User's phone number for SMS notifications
  businessAddress?: BusinessAddress; // Business address for formal letters
  referralCode?: string;
  // HMRC Making Tax Digital Add-on
  hmrcAddonEnabled?: boolean; // Whether user has HMRC MTD add-on active
  hmrcAddonSubscriptionId?: string; // Stripe subscription ID for HMRC addon
  vatRegistrationNumber?: string; // VAT registration number for MTD submissions
  profilePicture?: string;
  timezone: string;
  language: string;
  notifications: {
    emailNotifications: boolean;
    inAppNotifications: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    notificationTypes: string[];
    onVacation: boolean;
  };
  isActive: boolean;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  lastLoginAt?: Date | Timestamp;
  lastActiveAt?: Date | Timestamp;
}

export interface UserStats {
  userId: string;
  totalInvoiced: number;
  totalCollected: number;
  averagePaymentDays: number;
  onTimePercentage: number;
  streak: number;
  badges: string[];
  level: number;
  rank?: number;
  achievements: any[];
  gamificationXP?: number; // Gamification experience points
  totalReferrals?: number; // Total referrals made
  collectionAttempts?: number; // Total collection attempts
  collectionSuccess?: number; // Successful collection attempts
  churnRiskScore?: number;
  engagementLevel?: 'low' | 'medium' | 'high';
  calculatedAt: Date | Timestamp;
}

export interface Invoice {
  invoiceId: string;
  freelancerId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string; // Client phone number for SMS collections
  reference: string;
  amount: number; // in pence
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'in_collections' | 'disputed' | 'cancelled';
  dueDate: Date | Timestamp;
  invoiceDate: Date | Timestamp;
  paidAt?: Date | Timestamp;
  collectionsEnabled: boolean;
  collectionsEnabledAt?: Date | Timestamp;
  collectionsAttempts?: number; // Number of collection attempts made
  firstReminderSentAt?: Date | Timestamp;
  secondReminderSentAt?: Date | Timestamp;
  paymentClaimStatus?: 'pending_verification' | 'verified' | 'rejected';
  stripePaymentLinkUrl?: string;
  currency: 'GBP' | 'USD' | 'EUR';
  industryCode?: number; // Industry code copied from client for ML features
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface Client {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  poNumber?: string;
  billingAddress?: {
    street: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  totalOwed?: number;              // Total amount owed by client
  totalPaid?: number;              // Total amount paid by client
  invoiceCount?: number;           // Total number of invoices
  lastInvoiceDate?: string;        // Date of last invoice
  paymentTerms?: number;           // Payment terms in days
  preferredPaymentMethod?: string; // Preferred payment method
  currency?: string;               // Client currency preference
  taxId?: string;                  // Client tax ID
  tags?: string[];                 // Client tags/categories
  notes?: string;                  // Additional client notes
  industry?: string;               // Client industry (for ML benchmarking)
  industryCode?: number;           // Numeric industry code for ML features
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  status: 'active' | 'archived';
}

export interface Notification {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
}

export interface Referral {
  referralId: string;
  // ... other properties
}

export interface Transaction {
  transactionId: string;
  invoiceId: string;
  freelancerId: string;
  amount: number;
  paymentMethod: string;
  commission: number;
  freelancerNet: number;
  commissionRate: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripeChargeId?: string;
  transactionDate: Date | Timestamp;
  completedAt?: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface CollectionAttempt {
  attemptId: string;
  invoiceId: string;
  freelancerId: string;
  attemptType: 'email_reminder' | 'sms_reminder' | 'physical_letter' | 'phone_call' | 'ai_call';
  attemptDate: Date | Timestamp;
  attemptNumber: number;
  reminderLevel?: number;
  result?: 'success' | 'failed' | 'pending' | 'bounced';
  resultDetails?: string; // Additional details about the result
  paymentRecovered?: number; // Amount recovered from this attempt
  errorMessage?: string;
  sms_day_14_sent?: boolean;
  sms_day_14_sid?: string;
  letter_day_30_sent?: boolean;
  letter_day_30_lob_id?: string;
  createdAt?: Date | Timestamp;
}

export interface AgencyHandoff {
  handoffId: string;
  invoiceId: string;
  freelancerId: string;
  agencyId: string;
  handoffDate: Date | Timestamp;
  handoffStatus: 'pending' | 'in_progress' | 'collected' | 'failed' | 'withdrawn' | 'closed';

  // Agency info
  agencyName: string;
  agencyContactEmail: string;
  agencyContactPhone?: string;

  // Invoice details
  originalAmount: number;
  outstandingAmount: number;
  daysPastDue: number;

  // Documents & Evidence
  documents: string[];
  communicationHistory: any[];

  // Financial terms
  commissionPercentage: number;
  commissionAmount?: number;

  // Recovery details
  recoveryAmount?: number;
  recoveryDate?: Date | Timestamp;
  recoveryOutcome?: 'full_recovery' | 'partial_recovery' | 'settlement' | 'unrecoverable';

  // Notes
  notes?: string;

  // Status updates
  agencyUpdates: Array<{
    date: Date | Timestamp;
    note: string;
    actionTaken?: string;
  }>;

  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpRequired: number;
  category: string;
  unlockedAt?: Date | Timestamp;
  dateAwarded?: Date | Timestamp; // Alias for unlockedAt
}

export interface PaymentConfirmation {
  confirmationId: string;
  invoiceId: string;
  freelancerId: string;
  clientEmail?: string;
  confirmationToken?: string;
  amount?: number;
  expectedAmount: number;
  clientConfirmedAmount?: number;
  freelancerVerifiedReceived?: boolean;
  paymentMethod?: string;
  clientPaymentMethod?: string;
  transactionId?: string;
  status: 'pending' | 'pending_client' | 'client_confirmed' | 'both_confirmed' | 'verified' | 'rejected' | 'completed';
  confirmedAt?: Date | Timestamp;
  confirmedBy?: string;
  tokenExpiresAt?: Date | Timestamp;
  expiresAt?: Date | Timestamp;
  createdAt?: Date | Timestamp;
}

export interface AgencyRecoveryTransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface FailedWebhook {
  webhookId: string;
  source: 'stripe' | 'clerk' | 'sendgrid' | 'twilio';
  eventType: string;
  eventId?: string;
  payload: any;
  signature?: string;
  error: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date | Timestamp;
  lastAttemptAt: Date | Timestamp;
  status: 'pending_retry' | 'retrying' | 'failed' | 'dead_letter';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

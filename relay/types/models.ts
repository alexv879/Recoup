import { Timestamp } from 'firebase-admin/firestore';

// ============ USERS COLLECTION ============

export interface User {
  // Authentication
  userId: string; // Clerk user ID (document ID)
  email: string;
  name: string;
  phoneNumber?: string; // E.164 format: +44xxxxxxxxxx (for SMS)

  // Admin & Roles
  isAdmin?: boolean; // Admin user with full system access
  adminRole?: 'super_admin' | 'support_admin' | 'finance_admin' | 'readonly_admin'; // Admin role type

  // Business
  businessName?: string;
  businessType: 'freelancer' | 'agency' | 'consultant';

  // Subscription (PRICING V3 - Phase 2 Task 8)
  // Legacy tiers: 'free' | 'paid' | 'business' (deprecated, mapped to V3 tiers)
  // V3 tiers: 'starter' | 'growth' | 'pro'
  subscriptionTier: 'free' | 'paid' | 'starter' | 'growth' | 'pro' | 'business';
  subscriptionStartDate?: Timestamp;
  collectionsEnabled: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;        // Stripe subscription ID (from Clerk Billing)
  clerkSubscriptionId?: string;         // Clerk subscription reference
  pricingModel?: 'commission' | 'subscription' | 'hybrid';

  // Pricing V3 Billing (Phase 2 Task 8)
  billingCycle?: 'monthly' | 'annual';  // NEW - Monthly or annual billing
  annualDiscountApplied?: boolean;      // NEW - Whether 20% annual discount was applied
  nextBillingDate?: Timestamp;          // NEW - Next billing date
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'; // NEW - Stripe status

  // Founding Member Tracking (NEW)
  isFoundingMember?: boolean;           // ✨ NEW - Is this user a founding member?
  foundingMemberNumber?: number;        // ✨ NEW - Founding member number (1-50)
  foundingMemberJoinedAt?: Timestamp;   // ✨ NEW - When they became a founding member
  lockedInPrice?: number;               // ✨ NEW - Locked-in price (£12/£22/£75 for life)

  // Banking (Encrypted)
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string; // encrypted
    sortCode: string; // encrypted
    bankName: string;
  };

  // Business Address (for physical letters)
  businessAddress?: {
    companyName?: string; // Optional company name
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string; // UK postcode format
    country: string; // Default: "United Kingdom"
  };

  // Collections Demo Tracking (EXTENDED)
  collectionsDemoUsedThisMonth: number; // ✅ Already exists (for free demo)
  lastDemoResetDate?: Timestamp;        // ✅ Already exists

  // Usage Tracking for Paid Tiers (Pricing V3)
  collectionsUsedThisMonth?: number;    // Total collections used this month (all tiers)
  monthlyUsageResetDate?: Timestamp;    // Last time monthly usage was reset
  collectionsLimitPerMonth?: number;    // Tier-based limit (Starter: 10, Growth: 50, Pro: unlimited/null)

  // Referral Tracking
  referralCode: string; // Unique code for this user
  referredBy?: string; // User ID of referrer
  referralCreditsEarned?: number; // Total credits earned from referrals
  referralCreditsSpent?: number; // Credits used for subscriptions/payouts
  referralCreditsBalance?: number; // Available credits

  // Profile
  profilePicture?: string;
  timezone: string; // User's timezone
  language: 'en' | 'es' | 'fr';

  // Preferences
  notifications: {
    emailNotifications: boolean;
    inAppNotifications: boolean;
    quietHoursStart: string; // "21:00"
    quietHoursEnd: string; // "08:00"
    notificationTypes: string[];
    onVacation: boolean;
    vacationUntil?: Timestamp;
    invoiceDroughtReminder?: boolean; // Send reminders when user hasn't invoiced
    paymentDelayAlert?: boolean; // Alert when payment is delayed
    opportunityAlert?: boolean; // Alert about opportunities
  };

  // Alias for backward compatibility
  notificationPreferences?: {
    emailNotifications?: boolean;
    inAppNotifications?: boolean;
    invoiceDroughtReminder?: boolean;
    paymentDelayAlert?: boolean;
    opportunityAlert?: boolean;
  };

  // Premium Collections Consent (GDPR/UK Communications Law)
  collectionsConsent?: {
    smsConsent: boolean; // Consent to receive SMS reminders
    callConsent: boolean; // Consent to receive AI voice calls
    callRecordingConsent: boolean; // Consent to record calls
    physicalMailConsent: boolean; // Consent to send physical letters
    dataStorageConsent: boolean; // Consent to store call transcripts/recordings
    consentDate?: Timestamp; // When consent was given
    consentVersion?: string; // Version of terms agreed to
    ipAddress?: string; // IP address when consent given

    // Opt-out tracking (PECR compliance)
    smsOptedOut?: boolean; // User opted out by replying STOP
    smsOptOutDate?: Timestamp; // When user opted out
    callOptedOut?: boolean; // User opted out from calls
    callOptOutDate?: Timestamp; // When user opted out
    physicalMailOptedOut?: boolean; // User opted out from letters
    physicalMailOptOutDate?: Timestamp; // When user opted out
  };

  // Collections Automation Settings (NEW - Phase 2)
  collectionsAutomation?: {
    enabled: boolean; // Enable/disable auto-escalation
    customSchedule?: {
      gentle?: number; // Override day 5 default
      firm?: number;   // Override day 15 default
      final?: number;  // Override day 30 default
      agency?: number; // Override day 60 default
    };
  };

  // Status
  isActive: boolean;
  status: 'active' | 'suspended' | 'deleted';

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  lastActiveAt?: Timestamp;
}

// ============ INVOICES COLLECTION ============

export interface Invoice {
  // Identifiers
  invoiceId: string; // document ID
  reference: string; // INV-YYYYMMDD-XXXXX
  freelancerId: string; // User ID

  // Client Info
  clientName: string;
  clientEmail: string;
  clientId?: string; // If repeat client

  // Invoice Details
  amount: number;
  currency: string; // "GBP"
  description?: string;

  // Dates
  invoiceDate: Timestamp;
  dueDate: Timestamp;
  sentAt?: Timestamp;
  paidAt?: Timestamp;

  // Status
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'in_collections' | 'disputed' | 'cancelled';

  // Escalation Tracking (NEW - Phase 2)
  escalationLevel?: 'pending' | 'gentle' | 'firm' | 'final' | 'agency'; // Current escalation stage
  template_level?: string; // Template level for collections

  // Payment Options
  paymentMethods: ('bank_transfer' | 'card')[];
  stripePaymentLinkId?: string;
  stripePaymentLinkUrl?: string;

  // Collection Tracking
  collectionsEnabled: boolean;
  firstReminderSentAt?: Timestamp;
  secondReminderSentAt?: Timestamp;
  collectionsAttempts: number;

  // BACS Payment Claims (NEW)
  paymentClaimId?: string; // Reference to payment_claims document
  paymentClaimStatus?: 'pending_verification' | 'verified' | 'rejected';
  paymentClaimDate?: Timestamp;
  verifiedAt?: Timestamp;
  verificationNotes?: string;

  // Confirmation
  dualConfirmationRequired: boolean;

  // Notes
  internalNotes?: string;

  // Metadata
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ PAYMENT_CONFIRMATIONS COLLECTION ============

export interface PaymentConfirmation {
  // Identifiers
  confirmationId: string; // document ID
  invoiceId: string;
  freelancerId: string;
  clientEmail: string;

  // Token (for unauthenticated client confirmation)
  confirmationToken: string;
  tokenExpiresAt: Timestamp;

  // Confirmation Status
  status: 'pending_client' | 'client_confirmed' | 'both_confirmed' | 'expired' | 'cancelled';

  // Client Confirmation
  clientConfirmedAt?: Timestamp;
  clientConfirmedAmount?: number;
  clientPaymentMethod?: 'bank_transfer' | 'card';
  clientConfirmedDate?: string; // Date they say they paid
  clientNotes?: string;

  // Freelancer Confirmation
  freelancerConfirmedAt?: Timestamp;
  freelancerVerifiedReceived: boolean;

  // Payment Details
  expectedAmount: number;
  actualAmountPaid?: number;

  // Timestamps
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// ============ PAYMENT_CLAIMS COLLECTION (NEW) ============

export interface PaymentClaim {
  // Identifiers
  claimId: string; // document ID
  invoiceId: string;
  freelancerId: string;
  clientName: string;
  clientEmail: string;

  // Claim Details
  amount: number; // Amount claimed to be paid
  paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'card' | 'paypal' | 'other';
  paymentReference?: string; // Optional reference from client
  paymentDate: Timestamp; // Date client claims they paid
  clientNotes?: string; // Optional notes from client

  // Verification Status
  status: 'pending_verification' | 'verified' | 'rejected';
  verifiedAt?: Timestamp;
  verifiedBy?: string; // User ID who verified
  rejectedAt?: Timestamp;
  rejectedBy?: string; // User ID who rejected
  rejectionReason?: string;
  autoRejected?: boolean; // True if rejected due to deadline expiry

  // Evidence Fields (Phase 2 Task 7)
  evidenceFileUrl?: string; // Firebase Storage download URL
  evidenceFileName?: string; // Original filename
  evidenceFileSize?: number; // File size in bytes
  evidenceFileType?: string; // MIME type
  evidenceUploadedAt?: Timestamp;
  evidenceUploadedBy?: string; // User ID who uploaded

  // Verification Deadline (Phase 2 Task 7)
  verificationDeadline?: Timestamp; // 48 hours after creation
  reminder24hSent?: boolean; // 24h reminder sent flag
  reminder24hSentAt?: Timestamp;
  reminder6hSent?: boolean; // 6h urgent reminder sent flag
  reminder6hSentAt?: Timestamp;

  // Verification Details
  actualAmount?: number; // Actual amount received (if different)
  verificationNotes?: string; // Notes from freelancer

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ COLLECTIONS_ATTEMPTS COLLECTION ============

export interface CollectionAttempt {
  // Identifiers
  attemptId: string; // document ID
  invoiceId: string;
  freelancerId: string;

  // Attempt Details
  attemptType: 'email_reminder' | 'sms_reminder' | 'physical_letter' | 'ai_call' | 'manual_contact' | 'payment_received';
  attemptDate: Timestamp;
  attemptNumber: number;

  // Results
  result: 'success' | 'failed' | 'pending' | 'ignored';
  resultDetails?: string;

  // Email Specifics
  emailType?: 'day7' | 'day21' | 'follow_up';
  emailSentAt?: Timestamp;
  emailOpenedAt?: Timestamp;
  emailClickedAt?: Timestamp;

  // SMS Specifics (PREMIUM - Twilio)
  sms_day_14_sent?: boolean; // Day 14 SMS reminder flag
  sms_day_14_sid?: string; // Twilio message SID for Day 14
  sms_day_14_sent_at?: Timestamp; // When Day 14 SMS was sent
  twilioMessageId?: string;
  smsSentAt?: Timestamp;
  smsStatus?: 'sent' | 'failed' | 'delivered' | 'undelivered';
  smsDeliveredAt?: Timestamp;
  smsErrorCode?: string;
  smsErrorMessage?: string;

  // Physical Letter Specifics (PREMIUM - Lob.com UK ready)
  letter_day_30_sent?: boolean; // Day 30 letter reminder flag
  letter_day_30_lob_id?: string; // Lob API reference for Day 30
  letter_day_30_sent_at?: Timestamp; // When Day 30 letter was sent
  letterApiRef?: string; // Lob letter ID
  letterSentAt?: Timestamp;
  letterStatus?: 'sent' | 'failed' | 'delivered' | 'returned';
  templateUsed?: 'gentle' | 'final_warning' | 'lba'; // Letter Before Action
  recipientAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  letterTrackingUrl?: string;
  letterExpectedDelivery?: Timestamp;

  // AI Voice Agent Call Specifics (PREMIUM - OpenAI Realtime + Twilio)
  callSID?: string; // Twilio call session ID
  callDuration?: number; // seconds
  callRecordingUrl?: string;
  callTranscript?: string; // Full transcript from OpenAI Whisper (AUDIT TASK #3)
  transcribedAt?: Timestamp; // When transcription completed (AUDIT TASK #3)
  callOutcome?: 'paid' | 'promise' | 'partial' | 'refused' | 'no_answer' | 'voicemail' | 'error';
  callNotes?: string; // AI-generated summary
  clientProposedDate?: string; // If client promises payment by date
  partialAmountAgreed?: number; // If partial payment agreed
  paymentLinkSentInCall?: boolean; // If SMS/IVR payment link sent during call
  paymentMethod?: 'sms_link' | 'ivr' | 'bank_transfer'; // How payment was arranged
  ivrConfirmed?: boolean; // If IVR payment confirmed
  callStartedAt?: Timestamp;
  callEndedAt?: Timestamp;
  callErrorMessage?: string;

  // Post-Call Actions (PREMIUM)
  nextAction?: 'accept_partial' | 'schedule_followup' | 'escalate' | 'pause' | 'complete' | 'agency_handoff';
  scheduledFollowupDate?: Timestamp;
  directDebitSetup?: boolean;
  partialAmountCollected?: number;

  // Agency Escalation (PREMIUM)
  escalatedToAgency?: boolean;
  agencyHandoffId?: string; // Links to AgencyHandoff collection
  escalationDate?: Timestamp;

  // Outcomes
  paymentRecovered?: number;
  paymentDate?: Timestamp;

  // Metadata
  isPremiumFeature?: boolean; // Flag if this attempt used premium features
  consentGiven?: boolean; // GDPR/UK comms law consent for recording/storing
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ============ NOTIFICATIONS COLLECTION ============

export interface Notification {
  // Identifiers
  notificationId: string; // document ID
  userId: string;

  // Content
  type: 'invoice_drought' | 'payment_delay' | 'win' | 'prediction' | 'opportunity' | 'daily_digest'
  | 'behavioral_trigger_incomplete_invoice' | 'behavioral_trigger_invoice_created_not_sent';
  title: string;
  message: string;
  actionUrl?: string;

  // Context Data
  contextData?: {
    daysSinceLast?: number;
    lastAmount?: number;
    clientName?: string;
    relevantResources?: string[];
    actionSuggestions?: string[];
    percentile?: number;
    predictedOutcome?: string;
  };

  // Delivery
  channel?: 'email' | 'in_app' | 'both';
  sentAt?: Timestamp;
  openedAt?: Timestamp;
  clickedAt?: Timestamp;

  // Status
  status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  deliveryAttempts?: number;
  lastAttemptAt?: Timestamp;

  // Tracking
  efficacy?: 'pending' | 'effective' | 'ignored' | 'negative';
  actionTaken?: string;

  // Read Status (simplified for API convenience)
  read: boolean;
  readAt?: Timestamp;

  // Optional metadata for contextual notifications
  metadata?: Record<string, any>;

  // Metadata
  createdAt: Timestamp;
  expiresAt?: Timestamp; // Auto-delete after 30 days (optional)
}

// ============ TRANSACTIONS COLLECTION ============

export interface Transaction {
  // Identifiers
  transactionId: string; // document ID
  invoiceId: string;
  freelancerId: string;

  // Payment Details
  amount: number;
  paymentMethod: 'bank_transfer' | 'card';

  // Commission Calculation
  recoupCommission: number; // 3% of amount
  freelancerNet: number; // 97% of amount
  commissionRate: number; // 0.03 (3%)

  // Status
  status: 'pending' | 'completed' | 'failed' | 'refunded';

  // Stripe Details
  stripeChargeId?: string;
  stripeTransferId?: string;

  // Timestamps
  transactionDate: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
}

// ============ REFERRALS COLLECTION ============

export interface Referral {
  // Identifiers
  referralId: string; // document ID
  referrerId: string; // User who referred
  referredUserId?: string; // User who was referred
  referralCode: string;

  // Status
  status: 'pending' | 'active' | 'paid' | 'cancelled';

  // Rewards
  referrerCredit: number; // £ earned by referrer
  referredCredit: number; // £ earned by referred user
  creditType: 'account_credit' | 'cash_back' | 'discount';

  // Tracking
  signupDate?: Timestamp;
  activationDate?: Timestamp;
  firstInvoiceDate?: Timestamp;
  commissionEarnedDate?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// ============ USER_BEHAVIOR_PROFILE COLLECTION ============

export interface UserBehaviorProfile {
  // Identifiers
  userId: string; // document ID

  // Invoicing Patterns
  invoicing: {
    averagePerWeek: number;
    averagePerMonth: number;
    daysOfWeekPreferred: string[];
    timeOfDayPreferred: string;
    averageAmount: number;
    lastInvoiceDate: Timestamp;
    invoicingGaps: number[];
  };

  // Payment Patterns
  payments: {
    averageDaysToPayment: number;
    bestPayingClients: string[];
    worstPayingClients: string[];
    seasonality: Record<string, number>;
    paymentReliability: number;
  };

  // Engagement Patterns
  engagement: {
    averageOpenPerWeek: number;
    lastOpenDate: Timestamp;
    daysOfWeekMostActive: string[];
    featureUsage: Record<string, number>;
  };

  // Current Context
  currentContext: {
    daysWithoutInvoice: number;
    invoiceDebtStatus: string;
    recentSuccesses: number;
    churnRiskScore: number;
  };

  // Timestamps
  lastUpdated: Timestamp;
}

// ============ USER_STATS COLLECTION ============

export interface UserStats {
  // Identifiers
  userId: string; // document ID

  // Financial Metrics
  totalInvoiced: number; // Total amount invoiced (aka totalRevenue)
  totalCollected: number; // Total amount collected (aka totalPaid)
  totalInvoices: number; // Count of invoices created
  averagePaymentDays: number;
  onTimePercentage: number;

  // Gamification
  streak: number; // Days without overdue (aka currentStreak)
  badges: string[];
  level: number;
  rank: number;
  gamificationXP: number; // Experience points for level calculation
  gamificationLevel: number; // Cached level (same as level, for backward compat)
  currentStreak: number; // Alias for streak
  longestStreak: number; // Longest payment streak achieved
  lastStreakDate?: Timestamp; // Last date streak was updated

  // Achievements
  achievements: {
    badge: string;
    earnedAt: Timestamp;
    progress: number; // 0-100 for in-progress
  }[];

  // Engagement
  daysActivePastMonth: number;
  sessionsThisMonth: number;
  avgSessionDuration: number;

  // Calculated Metrics
  churnRiskScore: number; // 0-100
  engagementLevel: 'high' | 'medium' | 'low';

  // Timestamps
  calculatedAt: Timestamp;
}

// ============ EMAILS_SENT COLLECTION ============

export interface EmailSent {
  // Identifiers
  emailId: string; // document ID
  freelancerId: string;

  // Email Details
  toEmail: string;
  subject: string;
  emailType: 'invoice' | 'reminder' | 'notification' | 'promotion';

  // Tracking
  sentAt: Timestamp;
  openedAt?: Timestamp;
  clickedAt?: Timestamp;
  bounced: boolean;
  complained: boolean;

  // Engagement
  openRate: number;
  clickRate: number;

  // Links Clicked
  linksClicked: {
    url: string;
    clickedAt: Timestamp;
  }[];
}

// ============ EMAIL_EVENTS COLLECTION ============
// NEW - For Day 5/15/30 reminder email tracking (Phase 1 Task 5)

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  billingAddress?: BillingAddress;
  currency?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  tags?: string[];
  contacts?: Contact[];
  archived?: boolean;
  status?: string;
  totalOwed?: number;
  lastInvoiceDate?: string;
  invoiceCount?: number;
  totalPaid?: number;
  preferredPaymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
  poNumber?: string;
}

// ============ ONBOARDING_PROGRESS COLLECTION ============

export interface OnboardingProgress {
  // Identifiers
  userId: string; // document ID

  // Steps
  completedSteps: string[];
  currentStep: string;
  completedAt?: Timestamp;

  // Timing
  stepsStartedAt: Record<string, Timestamp>;
  stepsCompletedAt: Record<string, Timestamp>;

  // Status
  status: 'in_progress' | 'completed' | 'abandoned';
}

// ============ AGENCY_HANDOFF COLLECTION (PREMIUM) ============

export interface AgencyHandoff {
  // Identifiers
  handoffId: string; // document ID
  invoiceId: string;
  freelancerId: string;
  agencyId: string; // ID of collection agency partner

  // Handoff Details
  handoffDate: Timestamp;
  handoffStatus: 'pending' | 'in_progress' | 'collected' | 'failed' | 'closed';

  // Agency Info
  agencyName: string;
  agencyContactEmail: string;
  agencyContactPhone?: string;

  // Invoice Details at Handoff
  originalAmount: number;
  outstandingAmount: number;
  daysPastDue: number;

  // Documents & Evidence (AUDIT TASK #5: Enhanced with Firebase Storage)
  documents: string[]; // Storage paths to Firebase Storage (comms, proofs, invoices)
  documentUrls?: { // Detailed document metadata
    storagePath: string;
    uploadedAt: Timestamp;
    documentType: 'invoice' | 'communication_history' | 'evidence';
  }[];
  communicationHistory: {
    date: Timestamp;
    type: 'email' | 'sms' | 'call' | 'letter';
    summary: string;
  }[];

  // Financial Terms
  commissionPercentage: number; // e.g., 25 = 25%
  commissionAmount?: number; // Calculated on recovery
  minimumRecovery?: number; // Agency minimum threshold

  // Notes & Updates
  notes?: string;
  lastUpdate?: Timestamp;
  agencyNotes?: string;

  // Recovery Outcome
  recoveryOutcome?: 'full_recovery' | 'partial_recovery' | 'no_recovery' | 'settlement' | 'legal_action';
  recoveryAmount?: number;
  recoveryDate?: Timestamp;
  settlementDetails?: string;

  // Transaction Link (AUDIT TASK #6)
  transactionId?: string; // Links to payment_transactions collection
  transactionCreatedAt?: Timestamp;

  // Legal Escalation
  legalActionTaken?: boolean;
  legalActionDate?: Timestamp;
  courtReference?: string;

  // Status Updates from Agency
  agencyUpdates: {
    date: Timestamp;
    status: string;
    notes: string;
    actionTaken?: string;
  }[];

  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  closedAt?: Timestamp;
}

// ============ ADMIN AUDIT LOGS COLLECTION ============

export interface AdminAuditLog {
  // Identifiers
  auditLogId?: string; // document ID (auto-generated)

  // Action Details
  action: string; // e.g., 'user_updated', 'payment_overridden', 'invoice_deleted'
  actionType: 'create' | 'read' | 'update' | 'delete' | 'override' | 'export';

  // Admin Who Performed Action
  adminUserId: string;
  adminEmail: string;
  adminRole?: 'super_admin' | 'support_admin' | 'finance_admin' | 'readonly_admin';

  // Target Resource
  targetUserId?: string;
  targetResource?: string; // e.g., 'user', 'invoice', 'payment', 'system_config'
  targetResourceId?: string;

  // Change Details
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  // Additional Context
  reason?: string;
  notes?: string;

  // Request Metadata
  ipAddress?: string;
  userAgent?: string;
  requestUrl?: string;
  requestMethod?: string;

  // Status
  status: 'success' | 'failed' | 'partial';
  errorMessage?: string;

  // Timestamps
  timestamp: Date;
  createdAt: Date;
}

// ============ SYSTEM ALERTS COLLECTION ============

export interface SystemAlert {
  // Identifiers
  alertId?: string; // document ID (auto-generated)

  // Alert Details
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: 'system_error' | 'payment_failure' | 'api_failure' | 'rate_limit' | 'security' | 'performance' | 'integration';
  title: string;
  message: string;

  // Source
  source: 'sentry' | 'stripe' | 'twilio' | 'sendgrid' | 'firebase' | 'system' | 'manual';
  sourceEventId?: string; // E.g., Sentry event ID

  // Affected Resources
  affectedUsers?: string[]; // User IDs
  affectedInvoices?: string[]; // Invoice IDs
  affectedPayments?: string[]; // Payment IDs

  // Error Details
  errorCode?: string;
  errorMessage?: string;
  stackTrace?: string;
  context?: Record<string, any>;

  // Status
  status: 'active' | 'acknowledged' | 'investigating' | 'resolved' | 'ignored';
  acknowledgedBy?: string; // Admin user ID
  acknowledgedAt?: Timestamp;
  resolvedBy?: string; // Admin user ID
  resolvedAt?: Timestamp;
  resolution?: string;

  // Notification
  notificationSent: boolean;
  notificationChannels?: ('email' | 'slack' | 'sms')[];
  notifiedAdmins?: string[]; // Admin user IDs

  // Recurrence
  isRecurring?: boolean;
  occurrenceCount?: number;
  firstOccurrence?: Timestamp;
  lastOccurrence?: Timestamp;

  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

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

export interface CollectionsConsent {
  smsConsent?: boolean;
  smsOptedOut?: boolean;
  callConsent?: boolean;
  callRecordingConsent?: boolean;
  physicalMailConsent?: boolean;
  physicalMailOptedOut?: boolean;
  dataStorageConsent?: boolean;
  consentDate?: Date | Timestamp;
  consentVersion?: string;
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
  collectionsDemoUsedThisMonth?: number;
  collectionsUsedThisMonth?: number; // Total collections used this month (all tiers)
  collectionsConsent?: boolean | CollectionsConsent; // Whether user has consented to collections
  monthlyUsageResetDate?: Date | Timestamp; // Last time monthly usage was reset
  lastDemoResetDate?: Date | Timestamp; // Last time demo was reset
  isFoundingMember?: boolean; // Whether user is a founding member (50% discount for life)
  foundingMemberNumber?: string; // Unique founding member number
  foundingMemberJoinedAt?: Date | Timestamp; // When they became a founding member
  lockedInPrice?: number; // Locked-in price for founding members
  phoneNumber?: string; // User's phone number for SMS notifications
  businessAddress?: string | BusinessAddress; // Business address for formal letters
  referralCode?: string;
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
  relayCommission: number;
  recoupCommission?: number; // Alternative commission field name
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


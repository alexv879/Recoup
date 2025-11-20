// This is a placeholder for a real Timestamp type, e.g., from Firebase
export interface Timestamp {
  toDate: () => Date;
}

export interface User {
  userId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  businessType?: 'freelancer' | 'agency' | 'consultant';
  phoneNumber?: string;
  subscriptionTier: 'free' | 'starter' | 'growth' | 'pro';
  subscriptionStatus?: 'active' | 'inactive' | 'cancelled';
  collectionsEnabled: boolean;
  collectionsDemoUsedThisMonth?: number;
  lastDemoResetDate?: Date | Timestamp;
  collectionsConsent?: {
    smsConsent?: boolean;
    smsOptedOut?: boolean;
  };
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
  gamificationXP?: number;
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
  attemptType: 'email_reminder' | 'sms_reminder' | 'physical_letter' | 'ai_call' | 'manual_contact' | 'payment_received';
  attemptDate: Date | Timestamp;
  attemptNumber: number;
  result: 'success' | 'pending' | 'failed' | 'no_response';
  resultDetails?: string;
  paymentRecovered?: number;
  reminderLevel?: number | string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface AgencyHandoff {
  handoffId: string;
  invoiceId: string;
  freelancerId: string;
  agencyId: string;
  handoffDate: Date | Timestamp;
  handoffStatus: 'pending' | 'in_progress' | 'collected' | 'closed' | 'failed';

  // Agency info
  agencyName: string;
  agencyContactEmail: string;
  agencyContactPhone: string;

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
  recoveryOutcome?: string;

  // Notes
  notes?: string;

  // Status updates
  agencyUpdates: any[];

  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
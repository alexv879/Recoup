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
  stripeCustomerId?: string;
  isFoundingMember?: boolean; // Locked into 50% discount pricing
  collectionsEnabled: boolean;
  collectionsDemoUsedThisMonth?: number;
  lastDemoResetDate?: Date | Timestamp;
  collectionsConsent?: {
    smsOptedOut?: boolean;
    emailOptedOut?: boolean;
    callOptedOut?: boolean;
    smsConsent?: boolean;
    emailConsent?: boolean;
    callConsent?: boolean;
    callRecordingConsent?: boolean;
    physicalMailConsent?: boolean;
    physicalMailOptedOut?: boolean;
    consentVersion?: string;
    consentGivenAt?: Date | Timestamp;
    smsOptOuts?: Record<string, { optedOutAt?: string | Date; reason?: string }>;
    emailOptOuts?: Record<string, { optedOutAt?: string | Date; reason?: string }>;
  };
  referralCode?: string;
  profilePicture?: string;
  businessAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    country?: string;
  };
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

  // Expense tracking quotas (NEW)
  expensesLimitPerMonth?: number; // Free: 50, Pro: unlimited
  expensesUsedThisMonth?: number;
  receiptStorageLimitMB?: number; // Free: 100MB, Pro: 1GB
  receiptStorageUsedMB?: number;

  // MTD features (NEW - feature flagged)
  mtdEnabled?: boolean; // Default: false (activate when HMRC approves)
  mtdSandboxMode?: boolean; // For testing

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
  clientPhone?: string;
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
  industry?: string;
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

// ============================================================================
// EXPENSE TRACKING (NEW)
// ============================================================================

export type ExpenseCategory =
  | 'travel' // Travel costs (trains, taxis, hotels)
  | 'office' // Office supplies, software, equipment
  | 'marketing' // Advertising, website, business cards
  | 'professional' // Accountant, legal, insurance
  | 'training' // Courses, books, conferences
  | 'utilities' // Phone, internet, electricity (business portion)
  | 'vehicle' // Vehicle expenses (fuel, repairs, insurance)
  | 'mileage' // Mileage allowance (45p/25p per mile)
  | 'subsistence' // Meals while traveling
  | 'client_entertainment' // Client meals/events (partially deductible)
  | 'premises' // Rent, rates (business use of home)
  | 'financial' // Bank charges, interest
  | 'other'; // Other business expenses

export interface OCRData {
  extractedText: string;
  confidence: number; // 0-1
  merchant?: string;
  amount?: number;
  currency?: string;
  date?: string;
  category?: ExpenseCategory;
  processingTime: number; // ms
  provider: 'textract' | 'openai-vision' | 'manual';
}

export interface Expense {
  expenseId: string;
  userId: string;

  // Core fields
  amount: number; // in pence
  currency: 'GBP' | 'USD' | 'EUR';
  date: Date | Timestamp; // when expense occurred
  merchant: string;
  description: string;

  // UK HMRC Categories
  category: ExpenseCategory;
  subcategory?: string;

  // Receipts
  receiptUrl?: string; // Firebase Storage path
  receiptThumbnailUrl?: string;
  ocrStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  ocrData?: OCRData;

  // Client recharging (THE MOAT)
  billable: boolean; // Can this be recharged to a client?
  clientId?: string; // Which client to bill
  clientName?: string;
  billingStatus: 'unbilled' | 'invoiced' | 'paid';
  invoiceId?: string; // Once converted to invoice
  invoicedAt?: Date | Timestamp;
  paidAt?: Date | Timestamp;

  // Tax recoupment
  taxDeductible: boolean;
  taxYear: string; // e.g., "2025-26"
  capitalAllowance: boolean;
  simplifiedExpense: boolean;
  mileageRate?: number; // for mileage claims
  mileageDistance?: number; // in miles

  // Metadata
  status: 'draft' | 'active' | 'deleted';
  tags?: string[];
  notes?: string;
  attachments?: string[]; // additional files

  // Audit
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string; // userId
  lastModifiedBy?: string;
}

export interface ExpenseReceipt {
  receiptId: string;
  expenseId: string;
  userId: string;

  // File info
  fileName: string;
  fileSize: number; // bytes
  mimeType: string; // image/jpeg, image/png, application/pdf
  storageUrl: string; // Firebase Storage path
  thumbnailUrl?: string;

  // OCR
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrData?: OCRData;
  ocrError?: string;

  // Metadata
  uploadedAt: Date | Timestamp;
  processedAt?: Date | Timestamp;
}

// ============================================================================
// MTD (MAKING TAX DIGITAL) - FEATURE FLAGGED
// ============================================================================

export interface MTDAuthorization {
  authId: string;
  userId: string;

  // OAuth tokens (ENCRYPTED)
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  tokenType: 'Bearer';
  expiresAt: Date | Timestamp;
  scope: string[]; // e.g., ['read:vat', 'write:vat', 'read:self-assessment']

  // User identifiers (ENCRYPTED)
  nino?: string; // National Insurance Number (encrypted)
  vrn?: string; // VAT Registration Number (encrypted)
  utr?: string; // Unique Taxpayer Reference (encrypted)

  // HMRC metadata
  hmrcUserId?: string;
  hmrcTokenId?: string;

  // Status
  status: 'active' | 'expired' | 'revoked';

  // Audit
  authorizedAt: Date | Timestamp;
  lastRefreshedAt?: Date | Timestamp;
  revokedAt?: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface MTDSubmission {
  submissionId: string;
  userId: string;
  authId: string;

  // Submission type
  type: 'quarterly' | 'annual' | 'vat';
  taxYear: string; // e.g., "2025-26"

  // Period
  periodStart: Date | Timestamp;
  periodEnd: Date | Timestamp;

  // Financial data
  income: number; // Total income in period (pence)
  expenses: number; // Total expenses (pence)
  profit: number; // income - expenses

  // Detailed breakdown
  incomeBreakdown?: {
    invoiceIncome: number;
    otherIncome: number;
  };
  expenseBreakdown?: Record<string, number>; // By category

  // VAT-specific (if applicable)
  vatData?: {
    vatDueSales: number;
    vatDueAcquisitions: number;
    totalVatDue: number;
    vatReclaimedCurrPeriod: number;
    netVatDue: number;
    totalValueSalesExVAT: number;
    totalValuePurchasesExVAT: number;
    totalValueGoodsSuppliedExVAT: number;
    totalAcquisitionsExVAT: number;
  };

  // Submission status
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'error';

  // HMRC response
  hmrcReceiptId?: string; // HMRC confirmation ID
  hmrcResponse?: any; // Full HMRC API response
  hmrcError?: string;

  // Fraud prevention headers (required by HMRC)
  fraudPreventionHeaders?: Record<string, string>;

  // Timestamps
  submittedAt?: Date | Timestamp;
  acceptedAt?: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface MTDObligation {
  obligationId: string;
  userId: string;

  // Obligation details
  type: 'quarterly' | 'annual' | 'vat';
  periodStart: Date | Timestamp;
  periodEnd: Date | Timestamp;
  dueDate: Date | Timestamp;

  // Status
  status: 'open' | 'fulfilled' | 'overdue';
  fulfilledAt?: Date | Timestamp;
  submissionId?: string; // Link to submission

  // HMRC data
  hmrcObligationId?: string;

  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Revenue Recovery Metrics (for dashboard calculations)
export interface RevenueRecoveryMetrics {
  // Client recharges
  totalBillableExpenses: number;
  unbilledExpenses: number;
  invoicedExpenses: number;
  paidExpenses: number;

  // Tax recoupment
  totalTaxDeductible: number;
  estimatedTaxSavings: number;

  // Combined
  totalRecouped: number;
  potentialRecovery: number;

  // Breakdown by category
  byCategory: Record<string, {
    total: number;
    billable: number;
    taxDeductible: number;
  }>;

  // Breakdown by client
  byClient: Array<{
    clientId: string;
    clientName: string;
    unbilled: number;
    invoiced: number;
    paid: number;
  }>;

  // Time-based
  thisMonth: number;
  lastMonth: number;
  thisYear: number;
}

// ============================================================================
// COLLECTION ATTEMPTS
// ============================================================================

export interface CollectionAttempt {
  attemptId: string;
  invoiceId: string;
  freelancerId: string;
  attemptType: 'email_reminder' | 'sms_reminder' | 'whatsapp_message' | 'ai_call' | 'phone_call' | 'physical_letter' | 'manual_contact';
  attemptDate: Date | Timestamp;
  attemptNumber: number;
  result: 'pending' | 'success' | 'failed' | 'bounced' | 'no_answer';
  resultDetails?: string;
  paymentRecovered?: number; // Amount recovered in pence
  reminderLevel?: number; // Escalation level (1 = first reminder, 2 = second, etc.)
  escalatedToAgency?: boolean;
  agencyHandoffId?: string;
  escalationDate?: Date | Timestamp;
  isPremiumFeature?: boolean;
  createdAt: Date | Timestamp;
}

// ============================================================================
// AGENCY HANDOFF (PREMIUM FEATURE)
// ============================================================================

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
  originalAmount: number; // in pence
  outstandingAmount: number; // in pence
  daysPastDue: number;

  // Documents & Evidence
  documents: string[]; // Cloud storage URLs
  communicationHistory: any[];

  // Financial terms
  commissionPercentage: number; // e.g., 25 for 25%
  commissionAmount?: number; // Calculated after recovery
  recoveryAmount?: number; // Amount recovered by agency
  recoveryDate?: Date | Timestamp;
  recoveryOutcome?: 'full_recovery' | 'partial_recovery' | 'settlement' | 'failed' | 'written_off';

  // Notes
  notes?: string;

  // Status updates from agency
  agencyUpdates: Array<{
    date: Date | Timestamp;
    status: string;
    notes: string;
    actionTaken?: string;
  }>;

  // Timestamps
  lastUpdate?: Date | Timestamp;
  closedAt?: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// ============================================================================
// WEBHOOK RETRY SYSTEM
// ============================================================================

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
  nextRetryAt: Date | Timestamp;
  lastAttemptAt: Date | Timestamp;
  status: 'pending_retry' | 'dead_letter' | 'resolved';
  resolvedAt?: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
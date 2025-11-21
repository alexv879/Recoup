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
  subscriptionTier: 'free' | 'starter' | 'growth' | 'pro';
  subscriptionStatus?: 'active' | 'inactive' | 'cancelled';
  collectionsEnabled: boolean;
  collectionsDemoUsedThisMonth?: number;
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

/**
 * ✅ MTD-COMPLIANT MODELS
 * Making Tax Digital for Income Tax & VAT (UK HMRC)
 */

/**
 * Expense Record - MTD-compliant digital record
 * HMRC requires: Digital storage, 6-year retention, digital links
 */
export interface Expense {
  expenseId: string;
  userId: string;

  // Basic expense details
  description: string;
  category: string; // UK expense categories
  amount: number; // in pence
  currency: 'GBP' | 'USD' | 'EUR';
  expenseDate: Date | Timestamp;

  // VAT information (required for MTD VAT)
  vatAmount?: number; // VAT amount in pence
  vatRate?: 0 | 5 | 20; // UK VAT rates: 0%, 5%, 20%
  vatReclaimable: boolean; // Can VAT be reclaimed?

  // Receipt/evidence (MTD digital record requirement)
  receiptUrl?: string; // Storage URL for receipt image
  receiptStoragePath?: string;
  ocrExtractedData?: {
    merchantName?: string;
    date?: string;
    amount?: number;
    confidence?: number;
  };

  // Expense classification (HMRC "wholly and exclusively")
  businessPercentage: number; // 0-100 for dual-purpose items
  isCapitalExpense: boolean; // Capital allowances apply
  capitalAllowanceRate?: 18 | 6; // Writing down allowance %

  // Recoup tracking
  clientRechargeableexpense?: boolean; // Can be billed to client
  rechargedToInvoiceId?: string; // Digital link to invoice
  rechargedAt?: Date | Timestamp;

  // Tax claim status
  claimedInTaxYear?: string; // e.g., "2024-2025"
  claimedInQuarter?: string; // e.g., "2024-Q3"
  submittedToHMRC: boolean;
  submittedAt?: Date | Timestamp;

  // MTD digital links
  linkedInvoiceId?: string; // If recharged to client
  linkedVATReturnId?: string; // VAT return this was included in
  linkedIncomeSubmissionId?: string; // Income Tax quarterly update

  // Notes and tags
  notes?: string;
  tags?: string[];

  // Audit trail
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdByMethod: 'manual' | 'receipt_ocr' | 'bank_import' | 'api';
}

/**
 * MTD Registration Record
 * Tracks user's Making Tax Digital status
 */
export interface MTDRegistration {
  registrationId: string;
  userId: string;

  // VAT registration
  vatRegistered: boolean;
  vatNumber?: string;
  vatAccountingScheme?: 'standard' | 'cash' | 'flat_rate';
  vatSubmissionPeriod?: 'monthly' | 'quarterly' | 'annual';
  vatThreshold: number; // Current £90,000

  // Income Tax registration (MTD ITSA)
  incomeTaxMTDEnabled: boolean;
  incomeTaxQualifyingIncome?: number; // Annual gross income
  incomeTaxStartDate?: Date | Timestamp; // When MTD obligation starts
  utr?: string; // Unique Taxpayer Reference
  nino?: string; // National Insurance Number

  // HMRC API credentials
  hmrcClientId?: string;
  hmrcClientSecret?: string; // Encrypted
  hmrcAccessToken?: string; // Encrypted
  hmrcRefreshToken?: string; // Encrypted
  hmrcTokenExpiry?: Date | Timestamp;

  // Software credentials
  softwareId?: string; // Registered MTD software ID
  softwareVendorId?: string;

  // Compliance status
  mtdCompliant: boolean;
  lastVATSubmission?: Date | Timestamp;
  lastIncomeSubmission?: Date | Timestamp;
  nextVATDue?: Date | Timestamp;
  nextIncomeDue?: Date | Timestamp;

  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

/**
 * VAT Return - MTD VAT submission
 * Maps to HMRC 9-box VAT return
 */
export interface VATReturn {
  vatReturnId: string;
  userId: string;
  mtdRegistrationId: string;

  // Period covered
  periodKey: string; // HMRC period key (e.g., "24A1")
  periodStart: Date | Timestamp;
  periodEnd: Date | Timestamp;

  // 9-box VAT return (all amounts in pence)
  vatDueSales: number; // Box 1: VAT due on sales
  vatDueAcquisitions: number; // Box 2: VAT due on acquisitions from EU
  totalVATDue: number; // Box 3: Total VAT due (Box 1 + Box 2)
  vatReclaimedCurrPeriod: number; // Box 4: VAT reclaimed on purchases
  netVATDue: number; // Box 5: Net VAT due (Box 3 - Box 4)
  totalValueSalesExVAT: number; // Box 6: Total sales excluding VAT
  totalValuePurchasesExVAT: number; // Box 7: Total purchases excluding VAT
  totalValueGoodsSuppliedExVAT: number; // Box 8: Goods supplied to EU excluding VAT
  totalAcquisitionsExVAT: number; // Box 9: Acquisitions from EU excluding VAT

  // Submission status
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  submittedAt?: Date | Timestamp;
  acceptedAt?: Date | Timestamp;
  hmrcProcessingDate?: string;
  hmrcReceiptId?: string;

  // Payment status
  paymentDue: number; // Amount due to HMRC (or refund if negative)
  paymentStatus: 'unpaid' | 'paid' | 'refund_pending' | 'refund_received';
  paidAt?: Date | Timestamp;

  // Digital links
  linkedExpenseIds: string[]; // All expenses included
  linkedInvoiceIds: string[]; // All invoices included

  // Audit trail
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  submittedByMethod: 'api' | 'manual';
}

/**
 * Income Tax Quarterly Update - MTD ITSA submission
 */
export interface IncomeTaxQuarterlyUpdate {
  updateId: string;
  userId: string;
  mtdRegistrationId: string;

  // Tax year and quarter
  taxYear: string; // e.g., "2024-2025"
  quarter: 1 | 2 | 3 | 4;
  quarterStart: Date | Timestamp;
  quarterEnd: Date | Timestamp;

  // Income (all amounts in pence)
  totalIncome: number;
  invoiceIncome: number;
  otherIncome: number;

  // Expenses
  totalExpenses: number;
  expensesByCategory: {
    [category: string]: number;
  };

  // Profit/loss
  taxableProfit: number; // Income - Expenses

  // Capital allowances
  capitalAllowancesClaimed: number;

  // Adjustments
  adjustments: number;
  lossesApplied: number;

  // Final figures
  netProfit: number;

  // Submission status
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  submittedAt?: Date | Timestamp;
  acceptedAt?: Date | Timestamp;
  hmrcCalculationId?: string;

  // Digital links
  linkedExpenseIds: string[];
  linkedInvoiceIds: string[];

  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

/**
 * Digital Link Record
 * HMRC requires audit trail of digital links between records
 * No manual rekeying allowed - all data must flow digitally
 */
export interface DigitalLink {
  linkId: string;
  userId: string;

  // Source and destination
  sourceType: 'expense' | 'invoice' | 'bank_transaction';
  sourceId: string;
  destinationType: 'invoice' | 'vat_return' | 'income_submission';
  destinationId: string;

  // Link metadata
  linkType: 'recharge' | 'vat_claim' | 'income_claim' | 'payment';
  amount: number; // Amount transferred
  description: string;

  // Audit trail
  createdAt: Date | Timestamp;
  createdByMethod: 'automatic' | 'user_action';
  verifiedDigital: boolean; // Confirms no manual rekeying
}
/**
 * Recurring Invoice & Estimates
 * Essential features for self-employed/freelancers
 */

export enum RecurrenceFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum EstimateStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CONVERTED = 'converted', // Converted to invoice
}

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number; // e.g., every 2 weeks, every 3 months
  startDate: Date;
  endDate?: Date; // Optional: null means indefinite
  endAfterOccurrences?: number; // Alternative: end after N invoices
  dayOfMonth?: number; // For monthly: 1-31 (use -1 for last day)
  dayOfWeek?: number; // For weekly: 0-6 (Sunday-Saturday)
  customDays?: number; // For custom frequency: days between invoices
}

export interface RecurringInvoice {
  id: string;
  userId: string;
  clientId: string;

  // Template data (used to generate invoices)
  templateName: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxRate?: number;
  }>;

  // Amounts
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;

  // Recurrence settings
  recurrence: RecurrencePattern;

  // Status
  isActive: boolean;
  isPaused: boolean;
  pausedUntil?: Date;

  // History
  nextInvoiceDate: Date;
  lastInvoiceDate?: Date;
  invoicesGenerated: number;
  totalInvoicesPlanned?: number;
  generatedInvoiceIds: string[]; // References to actual invoices

  // Payment terms
  dueInDays: number;
  lateFeesEnabled: boolean;
  lateFeePercentage?: number;

  // Notifications
  autoSendInvoice: boolean; // Auto-send generated invoices
  notifyBeforeGeneration: boolean;
  notifyDaysBeforeGeneration: number;

  // Notes
  notes?: string;
  clientNotes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  userId: string;
  clientId: string;

  // Client details (snapshot at time of estimate)
  client: {
    name: string;
    email: string;
    address?: string;
  };

  // Business details (snapshot)
  business: {
    name: string;
    address?: string;
    taxId?: string;
  };

  // Line items
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxRate?: number;
    taxAmount?: number;
  }>;

  // Amounts
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;

  // Validity
  issueDate: Date;
  validUntil: Date; // Estimates expire
  expiryDays: number; // Default: 30 days

  // Status
  status: EstimateStatus;
  sentDate?: Date;
  viewedDate?: Date;
  acceptedDate?: Date;
  declinedDate?: Date;
  declineReason?: string;
  convertedInvoiceId?: string;

  // Terms & conditions
  terms?: string;
  notes?: string;
  clientNotes?: string; // Visible to client

  // Files
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
  }>;

  // Branding
  brandColor?: string;
  logoUrl?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface EstimateTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;

  // Default settings
  defaultLineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;

  defaultTerms?: string;
  defaultNotes?: string;
  defaultExpiryDays: number;

  // Usage stats
  timesUsed: number;
  lastUsed?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// Helper types
export interface RecurrencePreview {
  dates: Date[];
  count: number;
  nextThreeDates: Date[];
  estimatedRevenue: number;
  endDate?: Date;
}

export interface EstimateAcceptance {
  estimateId: string;
  acceptedDate: Date;
  clientName: string;
  clientEmail: string;
  clientSignature?: string;
  ipAddress: string;
  userAgent: string;
  comments?: string;
}

export interface RecurringInvoiceHistory {
  recurringInvoiceId: string;
  action: 'created' | 'paused' | 'resumed' | 'cancelled' | 'invoice_generated' | 'settings_updated';
  timestamp: Date;
  details: string;
  generatedInvoiceId?: string;
}

// Tier limits for recurring invoices and estimates
export interface RecurringLimits {
  maxRecurringInvoices: number | 'unlimited';
  maxEstimatesPerMonth: number | 'unlimited';
  autoSendInvoices: boolean;
  estimateTemplates: boolean;
  customBranding: boolean;
}

export const RECURRING_TIER_LIMITS: Record<string, RecurringLimits> = {
  free: {
    maxRecurringInvoices: 0, // Not available
    maxEstimatesPerMonth: 0, // Not available
    autoSendInvoices: false,
    estimateTemplates: false,
    customBranding: false,
  },
  starter: {
    maxRecurringInvoices: 10,
    maxEstimatesPerMonth: 20,
    autoSendInvoices: true,
    estimateTemplates: true,
    customBranding: true,
  },
  professional: {
    maxRecurringInvoices: 'unlimited',
    maxEstimatesPerMonth: 'unlimited',
    autoSendInvoices: true,
    estimateTemplates: true,
    customBranding: true,
  },
  business: {
    maxRecurringInvoices: 'unlimited',
    maxEstimatesPerMonth: 'unlimited',
    autoSendInvoices: true,
    estimateTemplates: true,
    customBranding: true,
  },
};

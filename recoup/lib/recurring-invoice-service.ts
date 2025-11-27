/**
 * Recurring Invoice & Estimate Service
 * Handles recurring billing and estimate management
 */

import { logger } from '@/utils/logger';
import {
  RecurringInvoice,
  RecurrencePattern,
  RecurrenceFrequency,
  RecurrencePreview,
  Estimate,
  EstimateStatus,
  EstimateAcceptance,
  RECURRING_TIER_LIMITS,
} from '@/types/recurring-invoice';

// ==============================================================================
// RECURRING INVOICES
// ==============================================================================

/**
 * Calculate next invoice date based on recurrence pattern
 */
export function calculateNextInvoiceDate(
  pattern: RecurrencePattern,
  fromDate: Date = new Date()
): Date | null {
  const next = new Date(fromDate);

  switch (pattern.frequency) {
    case RecurrenceFrequency.WEEKLY:
      next.setDate(next.getDate() + 7 * pattern.interval);
      if (pattern.dayOfWeek !== undefined) {
        const currentDay = next.getDay();
        const daysToAdd = (pattern.dayOfWeek - currentDay + 7) % 7;
        next.setDate(next.getDate() + daysToAdd);
      }
      break;

    case RecurrenceFrequency.BIWEEKLY:
      next.setDate(next.getDate() + 14 * pattern.interval);
      break;

    case RecurrenceFrequency.MONTHLY:
      next.setMonth(next.getMonth() + pattern.interval);
      if (pattern.dayOfMonth !== undefined) {
        if (pattern.dayOfMonth === -1) {
          // Last day of month
          next.setMonth(next.getMonth() + 1);
          next.setDate(0);
        } else {
          next.setDate(Math.min(pattern.dayOfMonth, getLastDayOfMonth(next)));
        }
      }
      break;

    case RecurrenceFrequency.QUARTERLY:
      next.setMonth(next.getMonth() + 3 * pattern.interval);
      break;

    case RecurrenceFrequency.YEARLY:
      next.setFullYear(next.getFullYear() + pattern.interval);
      break;

    case RecurrenceFrequency.CUSTOM:
      if (pattern.customDays) {
        next.setDate(next.getDate() + pattern.customDays);
      }
      break;
  }

  // Check if we've exceeded end conditions
  if (pattern.endDate && next > pattern.endDate) {
    return null;
  }

  return next;
}

/**
 * Get last day of month
 */
function getLastDayOfMonth(date: Date): number {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return next.getDate();
}

/**
 * Generate preview of recurring invoice schedule
 */
export function generateRecurrencePreview(
  pattern: RecurrencePattern,
  totalAmount: number,
  maxPreview: number = 12
): RecurrencePreview {
  const dates: Date[] = [];
  let currentDate = new Date(pattern.startDate);
  let count = 0;

  while (dates.length < maxPreview) {
    const nextDate = calculateNextInvoiceDate(pattern, currentDate);
    if (!nextDate) break;

    // Check occurrence limit
    if (pattern.endAfterOccurrences && count >= pattern.endAfterOccurrences) {
      break;
    }

    dates.push(nextDate);
    currentDate = nextDate;
    count++;
  }

  // Calculate total expected occurrences
  let totalCount = count;
  if (pattern.endAfterOccurrences) {
    totalCount = pattern.endAfterOccurrences;
  }

  return {
    dates,
    count: totalCount,
    nextThreeDates: dates.slice(0, 3),
    estimatedRevenue: totalAmount * totalCount,
    endDate: dates[dates.length - 1],
  };
}

/**
 * Check if recurring invoice should generate today
 */
export function shouldGenerateInvoice(
  recurringInvoice: RecurringInvoice,
  today: Date = new Date()
): boolean {
  if (!recurringInvoice.isActive || recurringInvoice.isPaused) {
    return false;
  }

  if (recurringInvoice.pausedUntil && today < recurringInvoice.pausedUntil) {
    return false;
  }

  const nextDate = new Date(recurringInvoice.nextInvoiceDate);
  nextDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return today >= nextDate;
}

/**
 * Generate invoice from recurring template
 */
export function generateInvoiceFromRecurring(params: {
  recurringInvoice: RecurringInvoice;
  invoiceNumber?: string;
}): {
  invoice: any; // Use actual Invoice type
  nextInvoiceDate: Date | null;
} {
  const { recurringInvoice, invoiceNumber } = params;

  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + recurringInvoice.dueInDays);

  const invoice = {
    invoiceNumber: invoiceNumber || generateInvoiceNumber(),
    userId: recurringInvoice.userId,
    clientId: recurringInvoice.clientId,
    recurringInvoiceId: recurringInvoice.id,

    lineItems: recurringInvoice.lineItems,
    subtotal: recurringInvoice.subtotal,
    taxAmount: recurringInvoice.taxAmount,
    totalAmount: recurringInvoice.totalAmount,
    currency: recurringInvoice.currency,

    issueDate,
    dueDate,
    status: 'pending' as const,

    notes: recurringInvoice.notes,
    clientNotes: recurringInvoice.clientNotes,

    lateFeesEnabled: recurringInvoice.lateFeesEnabled,
    lateFeePercentage: recurringInvoice.lateFeePercentage,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Calculate next invoice date
  const nextDate = calculateNextInvoiceDate(
    recurringInvoice.recurrence,
    recurringInvoice.nextInvoiceDate
  );

  logger.info('Generated invoice from recurring template', {
    recurringInvoiceId: recurringInvoice.id,
    invoiceNumber: invoice.invoiceNumber,
    nextInvoiceDate: nextDate,
  });

  return { invoice, nextInvoiceDate: nextDate };
}

/**
 * Pause recurring invoice
 */
export function pauseRecurringInvoice(params: {
  recurringInvoice: RecurringInvoice;
  pauseUntil?: Date;
  reason?: string;
}): RecurringInvoice {
  return {
    ...params.recurringInvoice,
    isPaused: true,
    pausedUntil: params.pauseUntil,
    updatedAt: new Date(),
  };
}

/**
 * Resume recurring invoice
 */
export function resumeRecurringInvoice(
  recurringInvoice: RecurringInvoice
): RecurringInvoice {
  return {
    ...recurringInvoice,
    isPaused: false,
    pausedUntil: undefined,
    updatedAt: new Date(),
  };
}

/**
 * Check tier limits for recurring invoices
 */
export function checkRecurringInvoiceLimit(params: {
  userId: string;
  tier: 'free' | 'starter' | 'professional' | 'business';
  currentCount: number;
}): {
  allowed: boolean;
  reason?: string;
  limit: number | 'unlimited';
} {
  const limits = RECURRING_TIER_LIMITS[params.tier];
  const limit = limits.maxRecurringInvoices;

  if (limit === 'unlimited') {
    return { allowed: true, limit };
  }

  if (params.currentCount >= limit) {
    return {
      allowed: false,
      reason: `Recurring invoice limit reached (${limit}). Upgrade to add more.`,
      limit,
    };
  }

  return { allowed: true, limit };
}

// ==============================================================================
// ESTIMATES
// ==============================================================================

/**
 * Create estimate from template
 */
export function createEstimate(params: {
  userId: string;
  clientId: string;
  client: {
    name: string;
    email: string;
    address?: string;
  };
  business: {
    name: string;
    address?: string;
    taxId?: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    taxRate?: number;
  }>;
  expiryDays?: number;
  terms?: string;
  notes?: string;
  clientNotes?: string;
}): Estimate {
  const {
    userId,
    clientId,
    client,
    business,
    lineItems,
    expiryDays = 30,
    terms,
    notes,
    clientNotes,
  } = params;

  // Calculate amounts
  const itemsWithAmounts = lineItems.map((item) => {
    const amount = item.quantity * item.rate;
    const taxAmount = item.taxRate ? amount * (item.taxRate / 100) : 0;
    return {
      id: generateId(),
      ...item,
      amount,
      taxAmount,
    };
  });

  const subtotal = itemsWithAmounts.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = itemsWithAmounts.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const totalAmount = subtotal + taxAmount;

  const issueDate = new Date();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + expiryDays);

  return {
    id: generateId(),
    estimateNumber: generateEstimateNumber(),
    userId,
    clientId,
    client,
    business,
    lineItems: itemsWithAmounts,
    subtotal,
    taxAmount,
    discountAmount: 0,
    totalAmount,
    currency: 'GBP',
    issueDate,
    validUntil,
    expiryDays,
    status: EstimateStatus.DRAFT,
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    terms,
    notes,
    clientNotes,
  };
}

/**
 * Send estimate to client
 */
export async function sendEstimate(params: {
  estimate: Estimate;
  sendEmail?: boolean;
  emailMessage?: string;
}): Promise<Estimate> {
  const { estimate, sendEmail = true } = params;

  // Update status
  const updatedEstimate: Estimate = {
    ...estimate,
    status: EstimateStatus.SENT,
    sentDate: new Date(),
    updatedAt: new Date(),
  };

  if (sendEmail) {
    // Send email notification (integrate with notification service)
    logger.info('Sending estimate email', {
      estimateId: estimate.id,
      clientEmail: estimate.client.email,
    });

    // TODO: Call notification service
  }

  return updatedEstimate;
}

/**
 * Mark estimate as viewed (when client opens it)
 */
export function markEstimateViewed(estimate: Estimate): Estimate {
  if (estimate.status === EstimateStatus.DRAFT) {
    return estimate; // Can't view draft
  }

  return {
    ...estimate,
    status:
      estimate.status === EstimateStatus.SENT ? EstimateStatus.VIEWED : estimate.status,
    viewedDate: estimate.viewedDate || new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Accept estimate
 */
export function acceptEstimate(params: {
  estimate: Estimate;
  acceptance: Omit<EstimateAcceptance, 'estimateId'>;
}): {
  estimate: Estimate;
  acceptance: EstimateAcceptance;
} {
  const { estimate, acceptance: acceptanceData } = params;

  // Check if expired
  if (new Date() > estimate.validUntil) {
    throw new Error('Estimate has expired');
  }

  const updatedEstimate: Estimate = {
    ...estimate,
    status: EstimateStatus.ACCEPTED,
    acceptedDate: new Date(),
    updatedAt: new Date(),
  };

  const acceptance: EstimateAcceptance = {
    estimateId: estimate.id,
    ...acceptanceData,
  };

  logger.info('Estimate accepted', {
    estimateId: estimate.id,
    clientEmail: acceptance.clientEmail,
  });

  return { estimate: updatedEstimate, acceptance };
}

/**
 * Decline estimate
 */
export function declineEstimate(params: {
  estimate: Estimate;
  reason?: string;
}): Estimate {
  return {
    ...params.estimate,
    status: EstimateStatus.DECLINED,
    declinedDate: new Date(),
    declineReason: params.reason,
    updatedAt: new Date(),
  };
}

/**
 * Convert estimate to invoice
 */
export function convertEstimateToInvoice(params: {
  estimate: Estimate;
  invoiceNumber?: string;
  dueInDays?: number;
}): {
  invoice: any; // Use actual Invoice type
  estimate: Estimate;
} {
  const { estimate, invoiceNumber, dueInDays = 30 } = params;

  if (estimate.status !== EstimateStatus.ACCEPTED) {
    throw new Error('Can only convert accepted estimates to invoices');
  }

  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueInDays);

  const invoice = {
    invoiceNumber: invoiceNumber || generateInvoiceNumber(),
    userId: estimate.userId,
    clientId: estimate.clientId,
    estimateId: estimate.id,

    // Copy line items
    lineItems: estimate.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
      taxRate: item.taxRate,
    })),

    subtotal: estimate.subtotal,
    taxAmount: estimate.taxAmount,
    totalAmount: estimate.totalAmount,
    currency: estimate.currency,

    issueDate,
    dueDate,
    status: 'pending' as const,

    notes: estimate.notes,
    clientNotes: estimate.clientNotes,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const updatedEstimate: Estimate = {
    ...estimate,
    status: EstimateStatus.CONVERTED,
    convertedInvoiceId: invoice.invoiceNumber,
    updatedAt: new Date(),
  };

  logger.info('Converted estimate to invoice', {
    estimateId: estimate.id,
    invoiceNumber: invoice.invoiceNumber,
  });

  return { invoice, estimate: updatedEstimate };
}

/**
 * Check if estimate is expired
 */
export function isEstimateExpired(estimate: Estimate): boolean {
  return new Date() > estimate.validUntil && estimate.status !== EstimateStatus.ACCEPTED;
}

/**
 * Check tier limits for estimates
 */
export function checkEstimateLimit(params: {
  userId: string;
  tier: 'free' | 'starter' | 'professional' | 'business';
  monthlyCount: number;
}): {
  allowed: boolean;
  reason?: string;
  limit: number | 'unlimited';
} {
  const limits = RECURRING_TIER_LIMITS[params.tier];
  const limit = limits.maxEstimatesPerMonth;

  if (limit === 'unlimited') {
    return { allowed: true, limit };
  }

  if (params.monthlyCount >= limit) {
    return {
      allowed: false,
      reason: `Monthly estimate limit reached (${limit}). Upgrade for unlimited estimates.`,
      limit,
    };
  }

  return { allowed: true, limit };
}

// ==============================================================================
// UTILITIES
// ==============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

function generateEstimateNumber(): string {
  const prefix = 'EST';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

// ==============================================================================
// BATCH PROCESSING
// ==============================================================================

/**
 * Process all active recurring invoices (run daily via cron)
 */
export async function processRecurringInvoices(params: {
  recurringInvoices: RecurringInvoice[];
  onInvoiceGenerated: (invoice: any, recurringInvoice: RecurringInvoice) => Promise<void>;
}): Promise<{
  generated: number;
  failed: number;
  errors: Array<{ recurringInvoiceId: string; error: string }>;
}> {
  const { recurringInvoices, onInvoiceGenerated } = params;
  let generated = 0;
  let failed = 0;
  const errors: Array<{ recurringInvoiceId: string; error: string }> = [];

  for (const recurring of recurringInvoices) {
    try {
      if (shouldGenerateInvoice(recurring)) {
        const { invoice, nextInvoiceDate } = generateInvoiceFromRecurring({
          recurringInvoice: recurring,
        });

        await onInvoiceGenerated(invoice, recurring);
        generated++;

        logger.info('Generated recurring invoice', {
          recurringInvoiceId: recurring.id,
          invoiceNumber: invoice.invoiceNumber,
          nextInvoiceDate,
        });
      }
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({ recurringInvoiceId: recurring.id, error: errorMessage });

      logger.error('Failed to generate recurring invoice', {
        recurringInvoiceId: recurring.id,
        error: errorMessage,
      });
    }
  }

  return { generated, failed, errors };
}

/**
 * Mark expired estimates (run daily via cron)
 */
export function markExpiredEstimates(estimates: Estimate[]): Estimate[] {
  return estimates.map((estimate) => {
    if (isEstimateExpired(estimate) && estimate.status !== EstimateStatus.EXPIRED) {
      return {
        ...estimate,
        status: EstimateStatus.EXPIRED,
        updatedAt: new Date(),
      };
    }
    return estimate;
  });
}

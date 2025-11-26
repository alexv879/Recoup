/**
 * Recurring Invoice System
 *
 * Automatically generates invoices on a schedule for retainer clients
 *
 * Features:
 * - Weekly, monthly, quarterly, and annual recurring invoices
 * - Automatic invoice generation via cron job
 * - Pause/resume functionality
 * - Email notifications for generated invoices
 * - Track all generated invoices
 */

import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

export enum RecurrenceFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

export enum RecurringInvoiceStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface RecurringInvoice {
  id?: string;
  userId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;

  // Invoice details
  description: string;
  lineItems: LineItem[];
  subtotal: number; // In pence
  vatRate: number; // Percentage (e.g., 20 for 20%)
  vatAmount: number; // In pence
  total: number; // In pence

  // Recurrence settings
  frequency: RecurrenceFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // Optional end date (YYYY-MM-DD)
  nextInvoiceDate: string; // YYYY-MM-DD

  // Payment terms
  paymentTermsDays: number; // e.g., 30 for Net 30

  // Status
  status: RecurringInvoiceStatus;

  // Tracking
  generatedInvoiceIds: string[]; // IDs of invoices created from this recurring invoice
  lastGeneratedDate?: string; // YYYY-MM-DD
  totalInvoicesGenerated: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  pausedAt?: string;
  pausedReason?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number; // In pence
  amount: number; // In pence (quantity * unitPrice)
}

export interface GeneratedInvoice {
  recurringInvoiceId: string;
  invoiceId: string;
  generatedAt: string;
  periodStart?: string;
  periodEnd?: string;
}

/**
 * Create a new recurring invoice
 */
export async function createRecurringInvoice(
  data: Omit<RecurringInvoice, 'id' | 'createdAt' | 'updatedAt' | 'generatedInvoiceIds' | 'totalInvoicesGenerated'>
): Promise<string> {
  const db = getFirestore();

  const recurringInvoice: Omit<RecurringInvoice, 'id'> = {
    ...data,
    generatedInvoiceIds: [],
    totalInvoicesGenerated: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await db.collection('recurring_invoices').add(recurringInvoice);
  return docRef.id;
}

/**
 * Get recurring invoice by ID
 */
export async function getRecurringInvoice(id: string): Promise<RecurringInvoice | null> {
  const db = getFirestore();
  const doc = await db.collection('recurring_invoices').doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  } as RecurringInvoice;
}

/**
 * Get all recurring invoices for a user
 */
export async function getUserRecurringInvoices(
  userId: string,
  status?: RecurringInvoiceStatus
): Promise<RecurringInvoice[]> {
  const db = getFirestore();
  let query = db.collection('recurring_invoices').where('userId', '==', userId);

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as RecurringInvoice[];
}

/**
 * Get all active recurring invoices that are due for generation
 */
export async function getDueRecurringInvoices(): Promise<RecurringInvoice[]> {
  const db = getFirestore();
  const today = new Date().toISOString().split('T')[0];

  const snapshot = await db
    .collection('recurring_invoices')
    .where('status', '==', RecurringInvoiceStatus.ACTIVE)
    .where('nextInvoiceDate', '<=', today)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as RecurringInvoice[];
}

/**
 * Update recurring invoice
 */
export async function updateRecurringInvoice(
  id: string,
  updates: Partial<RecurringInvoice>
): Promise<void> {
  const db = getFirestore();

  await db.collection('recurring_invoices').doc(id).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Pause a recurring invoice
 */
export async function pauseRecurringInvoice(id: string, reason?: string): Promise<void> {
  await updateRecurringInvoice(id, {
    status: RecurringInvoiceStatus.PAUSED,
    pausedAt: new Date().toISOString(),
    pausedReason: reason,
  });
}

/**
 * Resume a paused recurring invoice
 */
export async function resumeRecurringInvoice(id: string): Promise<void> {
  const recurringInvoice = await getRecurringInvoice(id);

  if (!recurringInvoice) {
    throw new Error('Recurring invoice not found');
  }

  // Calculate next invoice date from today
  const nextDate = calculateNextInvoiceDate(new Date().toISOString().split('T')[0], recurringInvoice.frequency);

  await updateRecurringInvoice(id, {
    status: RecurringInvoiceStatus.ACTIVE,
    nextInvoiceDate: nextDate,
    pausedAt: undefined,
    pausedReason: undefined,
  });
}

/**
 * Cancel a recurring invoice
 */
export async function cancelRecurringInvoice(id: string): Promise<void> {
  await updateRecurringInvoice(id, {
    status: RecurringInvoiceStatus.CANCELLED,
  });
}

/**
 * Complete a recurring invoice (reached end date)
 */
export async function completeRecurringInvoice(id: string): Promise<void> {
  await updateRecurringInvoice(id, {
    status: RecurringInvoiceStatus.COMPLETED,
  });
}

/**
 * Calculate next invoice date based on frequency
 */
export function calculateNextInvoiceDate(currentDate: string, frequency: RecurrenceFrequency): string {
  const date = new Date(currentDate);

  switch (frequency) {
    case RecurrenceFrequency.WEEKLY:
      date.setDate(date.getDate() + 7);
      break;

    case RecurrenceFrequency.BIWEEKLY:
      date.setDate(date.getDate() + 14);
      break;

    case RecurrenceFrequency.MONTHLY:
      date.setMonth(date.getMonth() + 1);
      break;

    case RecurrenceFrequency.QUARTERLY:
      date.setMonth(date.getMonth() + 3);
      break;

    case RecurrenceFrequency.ANNUALLY:
      date.setFullYear(date.getFullYear() + 1);
      break;

    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }

  return date.toISOString().split('T')[0];
}

/**
 * Generate invoice from recurring invoice
 */
export async function generateInvoiceFromRecurring(recurringInvoiceId: string): Promise<string> {
  const db = getFirestore();
  const recurringInvoice = await getRecurringInvoice(recurringInvoiceId);

  if (!recurringInvoice) {
    throw new Error('Recurring invoice not found');
  }

  if (recurringInvoice.status !== RecurringInvoiceStatus.ACTIVE) {
    throw new Error(`Cannot generate invoice from ${recurringInvoice.status} recurring invoice`);
  }

  // Calculate invoice period (for monthly retainers)
  const periodStart = recurringInvoice.nextInvoiceDate;
  const periodEnd = calculateNextInvoiceDate(periodStart, recurringInvoice.frequency);
  const nextNextDate = calculateNextInvoiceDate(recurringInvoice.nextInvoiceDate, recurringInvoice.frequency);

  // Calculate due date
  const dueDate = new Date(recurringInvoice.nextInvoiceDate);
  dueDate.setDate(dueDate.getDate() + recurringInvoice.paymentTermsDays);

  // Generate invoice number (simple sequential for now)
  const invoiceCount = await getInvoiceCount(recurringInvoice.userId);
  const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

  // Create invoice document
  const invoice = {
    userId: recurringInvoice.userId,
    invoiceNumber,
    clientId: recurringInvoice.clientId,
    clientName: recurringInvoice.clientName,
    clientEmail: recurringInvoice.clientEmail,

    description: recurringInvoice.description,
    lineItems: recurringInvoice.lineItems,
    subtotal: recurringInvoice.subtotal,
    vatRate: recurringInvoice.vatRate,
    vatAmount: recurringInvoice.vatAmount,
    total: recurringInvoice.total,

    invoiceDate: recurringInvoice.nextInvoiceDate,
    dueDate: dueDate.toISOString().split('T')[0],

    status: 'draft',
    paymentStatus: 'unpaid',

    // Link back to recurring invoice
    recurringInvoiceId,
    isRecurring: true,
    recurringPeriodStart: periodStart,
    recurringPeriodEnd: periodEnd,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const invoiceRef = await db.collection('invoices').add(invoice);

  // Update recurring invoice
  await db.collection('recurring_invoices').doc(recurringInvoiceId).update({
    generatedInvoiceIds: FieldValue.arrayUnion(invoiceRef.id),
    lastGeneratedDate: recurringInvoice.nextInvoiceDate,
    totalInvoicesGenerated: FieldValue.increment(1),
    nextInvoiceDate: nextNextDate,
    updatedAt: new Date().toISOString(),
  });

  // Check if end date reached
  if (recurringInvoice.endDate && nextNextDate > recurringInvoice.endDate) {
    await completeRecurringInvoice(recurringInvoiceId);
  }

  // Log generation
  await db.collection('recurring_invoice_history').add({
    recurringInvoiceId,
    invoiceId: invoiceRef.id,
    generatedAt: new Date().toISOString(),
    periodStart,
    periodEnd,
  });

  return invoiceRef.id;
}

/**
 * Get invoice count for user (for invoice numbering)
 */
async function getInvoiceCount(userId: string): Promise<number> {
  const db = getFirestore();
  const snapshot = await db.collection('invoices').where('userId', '==', userId).get();
  return snapshot.size;
}

/**
 * Process all due recurring invoices (called by cron job)
 */
export async function processRecurringInvoices(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ recurringInvoiceId: string; error: string }>;
}> {
  const dueInvoices = await getDueRecurringInvoices();

  const results = {
    processed: dueInvoices.length,
    succeeded: 0,
    failed: 0,
    errors: [] as Array<{ recurringInvoiceId: string; error: string }>,
  };

  for (const recurringInvoice of dueInvoices) {
    try {
      const newInvoiceId = await generateInvoiceFromRecurring(recurringInvoice.id!);
      results.succeeded++;

      // Send email notification to user
      try {
        const { sendNotificationEmail } = await import('@/lib/sendgrid');
        await sendNotificationEmail({
          toEmail: recurringInvoice.userId!,
          subject: `New recurring invoice generated: ${recurringInvoice.reference}`,
          message: `A new invoice has been automatically generated from your recurring invoice template.`,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${newInvoiceId}`,
        });
      } catch (emailError) {
        // Log but don't fail the job if email fails
        console.error('Failed to send recurring invoice notification:', emailError);
      }
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        recurringInvoiceId: recurringInvoice.id!,
        error: error.message || 'Unknown error',
      });

      console.error(`Failed to generate recurring invoice ${recurringInvoice.id}:`, error);
    }
  }

  return results;
}

/**
 * Get history of generated invoices for a recurring invoice
 */
export async function getRecurringInvoiceHistory(recurringInvoiceId: string): Promise<GeneratedInvoice[]> {
  const db = getFirestore();

  const snapshot = await db
    .collection('recurring_invoice_history')
    .where('recurringInvoiceId', '==', recurringInvoiceId)
    .orderBy('generatedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => doc.data()) as GeneratedInvoice[];
}

/**
 * Validate recurring invoice data
 */
export function validateRecurringInvoice(data: Partial<RecurringInvoice>): string[] {
  const errors: string[] = [];

  if (!data.clientId) errors.push('Client ID is required');
  if (!data.clientName) errors.push('Client name is required');
  if (!data.clientEmail) errors.push('Client email is required');
  if (!data.description) errors.push('Description is required');
  if (!data.lineItems || data.lineItems.length === 0) errors.push('At least one line item is required');
  if (!data.startDate) errors.push('Start date is required');
  if (!data.frequency) errors.push('Frequency is required');
  if (!data.paymentTermsDays || data.paymentTermsDays < 0) errors.push('Valid payment terms required');

  // Validate line items
  if (data.lineItems) {
    data.lineItems.forEach((item, index) => {
      if (!item.description) errors.push(`Line item ${index + 1}: Description required`);
      if (item.quantity <= 0) errors.push(`Line item ${index + 1}: Quantity must be positive`);
      if (item.unitPrice < 0) errors.push(`Line item ${index + 1}: Unit price must be non-negative`);
    });
  }

  // Validate dates
  if (data.startDate && data.endDate) {
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      errors.push('End date must be after start date');
    }
  }

  return errors;
}

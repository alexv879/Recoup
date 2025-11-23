/**
 * Email Sequence Worker
 * 
 * Hourly cron job that scans overdue invoices and triggers Day 5/15/30 reminder emails
 * based on days overdue. Implements idempotency to prevent duplicate sends.
 * 
 * Trigger Logic:
 * - Day 5: Invoice 5+ days overdue, no Day 5 email sent yet
 * - Day 15: Invoice 15+ days overdue, no Day 15 email sent yet
 * - Day 30: Invoice 30+ days overdue, no Day 30 email sent yet
 * 
 * Per MASTER_IMPLEMENTATION_AUDIT_V1.md §4.6
 */

import { firestore } from '@/lib/firebase';
import { sendReminderEmail } from '@/lib/sendgrid';
import { trackServerEvent } from '@/lib/analytics-server';
import { logInfo, logError } from '@/utils/logger';

interface Invoice {
    id: string;
    invoiceNumber: string;
    userId: string;
    clientName: string;
    clientEmail: string;
    amount: number; // in pence
    dueDate: Date;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

interface EmailEvent {
    id?: string;
    invoiceId: string;
    userId: string;
    level: 'day5' | 'day15' | 'day30';
    sentAt: Date;
    deliveryStatus: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
    sendgridMessageId?: string;
    error?: string;
    metadata?: {
        clientEmail: string;
        invoiceNumber: string;
        amount: number;
        daysOverdue: number;
    };
}

interface ReminderLevel {
    level: 'day5' | 'day15' | 'day30';
    minDays: number;
    displayName: string;
}

const REMINDER_LEVELS: ReminderLevel[] = [
    { level: 'day5', minDays: 5, displayName: 'Day 5 Friendly' },
    { level: 'day15', minDays: 15, displayName: 'Day 15 Firm' },
    { level: 'day30', minDays: 30, displayName: 'Day 30 Legal' },
];

/**
 * Calculate days overdue for an invoice
 */
function calculateDaysOverdue(dueDate: Date): number {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = now.getTime() - due.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

/**
 * Check if a specific reminder level has already been sent for an invoice
 */
async function hasReminderBeenSent(
    invoiceId: string,
    level: 'day5' | 'day15' | 'day30'
): Promise<boolean> {
    const emailEventsRef = firestore.collection('emailEvents');
    const query = emailEventsRef
        .where('invoiceId', '==', invoiceId)
        .where('level', '==', level)
        .where('deliveryStatus', 'in', ['queued', 'sent', 'delivered'])
        .limit(1);

    const snapshot = await query.get();
    return !snapshot.empty;
}

/**
 * Get the appropriate reminder level for the current days overdue
 * Returns null if no reminder should be sent yet
 */
function getReminderLevelForDays(daysOverdue: number): ReminderLevel | null {
    // Return the highest level that should have been triggered
    // but only if we haven't reached the next level yet

    if (daysOverdue >= 30) {
        return REMINDER_LEVELS[2]; // Day 30
    } else if (daysOverdue >= 15) {
        return REMINDER_LEVELS[1]; // Day 15
    } else if (daysOverdue >= 5) {
        return REMINDER_LEVELS[0]; // Day 5
    }

    return null;
}

/**
 * Get all reminder levels that should be checked for an invoice
 * Returns levels in order from highest to lowest priority
 */
function getReminderLevelsToCheck(daysOverdue: number): ReminderLevel[] {
    const levels: ReminderLevel[] = [];

    if (daysOverdue >= 30) {
        levels.push(REMINDER_LEVELS[2]); // Check Day 30 first
    }
    if (daysOverdue >= 15) {
        levels.push(REMINDER_LEVELS[1]); // Then Day 15
    }
    if (daysOverdue >= 5) {
        levels.push(REMINDER_LEVELS[0]); // Then Day 5
    }

    return levels;
}

/**
 * Record an email event in Firestore
 */
async function recordEmailEvent(event: Omit<EmailEvent, 'id'>): Promise<string> {
    const emailEventsRef = firestore.collection('emailEvents');
    const docRef = await emailEventsRef.add({
        ...event,
        sentAt: event.sentAt,
        createdAt: new Date(),
    });

    return docRef.id;
}

/**
 * Process a single invoice for reminder emails
 * Returns the level sent (if any) or null
 */
async function processInvoice(invoice: Invoice): Promise<string | null> {
    const daysOverdue = calculateDaysOverdue(invoice.dueDate);

    // Skip if not overdue
    if (daysOverdue < 5) {
        return null;
    }

    // Get all levels that could be sent for this days overdue count
    const levelsToCheck = getReminderLevelsToCheck(daysOverdue);

    // Check each level in priority order (highest first)
    for (const reminderLevel of levelsToCheck) {
        const alreadySent = await hasReminderBeenSent(invoice.id, reminderLevel.level);

        if (!alreadySent) {
            // Found a level that should be sent but hasn't been yet
            try {
                logInfo(`Sending ${reminderLevel.displayName} reminder for invoice ${invoice.invoiceNumber}`, {
                    invoiceId: invoice.id,
                    daysOverdue,
                    level: reminderLevel.level,
                });

                // Record event as queued first (for idempotency)
                const emailEventId = await recordEmailEvent({
                    invoiceId: invoice.id,
                    userId: invoice.userId,
                    level: reminderLevel.level,
                    sentAt: new Date(),
                    deliveryStatus: 'queued',
                    metadata: {
                        clientEmail: invoice.clientEmail,
                        invoiceNumber: invoice.invoiceNumber,
                        amount: invoice.amount,
                        daysOverdue,
                    },
                });

                // Send the email
                const result = await sendReminderEmail({
                    invoiceId: invoice.id,
                    level: reminderLevel.level,
                    clientEmail: invoice.clientEmail,
                });

                // Update email event with SendGrid message ID
                await firestore.collection('emailEvents').doc(emailEventId).update({
                    deliveryStatus: 'sent',
                    sendgridMessageId: result.messageId,
                });

                // Track analytics event
                await trackServerEvent('email_sent', {
                    invoice_id: invoice.id,
                    reminder_level: reminderLevel.level,
                    days_overdue: daysOverdue,
                    recipient_email: invoice.clientEmail,
                    amount: invoice.amount / 100, // Convert to pounds
                });

                logInfo(`Successfully sent ${reminderLevel.displayName} reminder`, {
                    invoiceId: invoice.id,
                    messageId: result.messageId,
                });

                return reminderLevel.level;
            } catch (error) {
                logError(`Failed to send ${reminderLevel.displayName} reminder`, {
                    invoiceId: invoice.id,
                    error: error instanceof Error ? error.message : String(error),
                });

                // Record the failure
                await recordEmailEvent({
                    invoiceId: invoice.id,
                    userId: invoice.userId,
                    level: reminderLevel.level,
                    sentAt: new Date(),
                    deliveryStatus: 'failed',
                    error: error instanceof Error ? error.message : String(error),
                    metadata: {
                        clientEmail: invoice.clientEmail,
                        invoiceNumber: invoice.invoiceNumber,
                        amount: invoice.amount,
                        daysOverdue,
                    },
                });

                // Track analytics failure event
                await trackServerEvent('email_failed', {
                    invoice_id: invoice.id,
                    reminder_level: reminderLevel.level,
                    error_message: error instanceof Error ? error.message : String(error),
                });

                // Don't try lower priority levels if sending failed
                // We'll retry this level on the next run
                return null;
            }
        }
    }

    // All applicable levels have already been sent
    return null;
}

/**
 * Main worker function - run hourly via cron
 */
export async function runEmailSequenceWorker(): Promise<{
    processed: number;
    sent: number;
    skipped: number;
    failed: number;
}> {
    const startTime = Date.now();
    logInfo('Email sequence worker started');

    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    // Rate limiting configuration
    const MAX_INVOICES_PER_RUN = 50; // Process max 50 invoices per run
    const DELAY_BETWEEN_EMAILS_MS = 100; // 100ms delay between sends

    try {
        // Query all overdue invoices that are not paid or cancelled
        const invoicesRef = firestore.collection('invoices');
        const query = invoicesRef
            .where('status', 'in', ['sent', 'overdue'])
            .where('dueDate', '<', new Date())
            .limit(MAX_INVOICES_PER_RUN); // Add limit to prevent processing too many

        const snapshot = await query.get();

        logInfo(`Found ${snapshot.size} potentially overdue invoices to process (max ${MAX_INVOICES_PER_RUN} per run)`);

        // Process each invoice with rate limiting
        for (const doc of snapshot.docs) {
            const invoice = { id: doc.id, ...doc.data() } as Invoice;
            processed++;

            const levelSent = await processInvoice(invoice);

            if (levelSent) {
                sent++;

                // Rate limiting: Add delay after sending emails to avoid hitting SendGrid limits
                if (processed < snapshot.size) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS));
                }
            } else {
                skipped++;
            }
        }

        const duration = Date.now() - startTime;
        logInfo('Email sequence worker completed', {
            processed,
            sent,
            skipped,
            failed,
            durationMs: duration,
        });

        return { processed, sent, skipped, failed };
    } catch (error) {
        logError('Email sequence worker failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}

/**
 * Manually trigger a reminder email for a specific invoice
 * Used by the manual send API endpoint
 */
export async function sendManualReminder(
    invoiceId: string,
    level: 'day5' | 'day15' | 'day30',
    overrideCheck: boolean = false
): Promise<{ success: boolean; messageId?: string; error?: string; recipientEmail?: string; invoiceAmount?: number }> {
    try {
        // Get invoice
        const invoiceDoc = await firestore.collection('invoices').doc(invoiceId).get();

        if (!invoiceDoc.exists) {
            return { success: false, error: 'Invoice not found' };
        }

        const invoice = { id: invoiceDoc.id, ...invoiceDoc.data() } as Invoice;

        // Check if already sent (unless override)
        if (!overrideCheck) {
            const alreadySent = await hasReminderBeenSent(invoiceId, level);
            if (alreadySent) {
                return { success: false, error: 'This reminder has already been sent' };
            }
        }

        const daysOverdue = calculateDaysOverdue(invoice.dueDate);

        // Record event as queued
        const emailEventId = await recordEmailEvent({
            invoiceId: invoice.id,
            userId: invoice.userId,
            level,
            sentAt: new Date(),
            deliveryStatus: 'queued',
            metadata: {
                clientEmail: invoice.clientEmail,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.amount,
                daysOverdue,
            },
        });

        // Send the email
        const result = await sendReminderEmail({
            invoiceId: invoice.id,
            level,
            clientEmail: invoice.clientEmail,
        });

        // Update email event
        await firestore.collection('emailEvents').doc(emailEventId).update({
            deliveryStatus: 'sent',
            sendgridMessageId: result.messageId,
        });

        // Track analytics
        await trackServerEvent('email_sent', {
            invoice_id: invoice.id,
            reminder_level: level,
            days_overdue: daysOverdue,
            recipient_email: invoice.clientEmail,
            amount: invoice.amount / 100,
            manual_trigger: true,
        });

        return { success: true, messageId: result.messageId, recipientEmail: invoice.clientEmail, invoiceAmount: invoice.amount / 100 };
    } catch (error) {
        logError('Failed to send manual reminder', {
            invoiceId,
            level,
            error: error instanceof Error ? error.message : String(error),
        });

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email',
        };
    }
}

/**
 * Get email history for an invoice
 */
export async function getInvoiceEmailHistory(invoiceId: string): Promise<EmailEvent[]> {
    const emailEventsRef = firestore.collection('emailEvents');
    const query = emailEventsRef
        .where('invoiceId', '==', invoiceId)
        .orderBy('sentAt', 'desc');

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as EmailEvent[];
}

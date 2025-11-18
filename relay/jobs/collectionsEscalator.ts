/**
 * Collections Escalation Automation Worker
 * 
 * Based on:
 * - collections_implementation_guide.md (Complete Implementation Guide)
 * - late-payment-escalation-flow.md (Escalation Decision Tree)
 * - MASTER_IMPLEMENTATION_AUDIT_V1.md §4.7
 * 
 * Runs on cron schedule to:
 * 1. Scan all overdue invoices
 * 2. Calculate appropriate escalation level
 * 3. Auto-escalate if criteria met and automation enabled
 * 4. Trigger reminders at each escalation stage
 * 5. Respect pause conditions (payment claims, disputes)
 * 6. Emit timeline events for audit trail
 * 
 * State Machine:
 * pending (0-4d) → gentle (5-14d) → firm (15-29d) → final (30-59d) → agency (60+d)
 */

import { db, Timestamp, FieldValue } from '@/lib/firebase';
import { Invoice, User, CollectionAttempt } from '@/types/models';
import {
    EscalationLevel,
    EscalationState,
    EscalationTimelineEvent,
    EscalationAutomationConfig,
    calculateEscalationLevel,
    shouldEscalate,
    ESCALATION_CONFIGS,
} from '@/types/escalation';
import { sendReminderEmail } from '@/lib/sendgrid';
import { sendCollectionSMS } from '@/lib/twilio-sms';
import { trackEvent } from '@/lib/analytics';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { BatchPerformanceTracker, measurePerformance } from '@/lib/performance';

const COLLECTIONS = {
    USERS: 'users',
    INVOICES: 'invoices',
    ESCALATION_STATES: 'escalation_states',
    ESCALATION_TIMELINE: 'escalation_timeline',
    COLLECTION_ATTEMPTS: 'collection_attempts',
};

interface EscalationWorkerResult {
    scannedCount: number;
    escalatedCount: number;
    pausedCount: number;
    skippedCount: number;
    errors: string[];
    duration: number;
    batchSize?: number;
}

/**
 * Batch processing configuration
 */
const BATCH_CONFIG = {
    SIZE: 50,              // Process 50 invoices at a time
    MAX_RETRIES: 3,        // Retry failed operations 3 times
    RETRY_DELAY_MS: 1000,  // 1 second delay between retries
    PARALLEL_LIMIT: 10,    // Max 10 parallel operations within batch
};

/**
 * Main escalation worker - scans all overdue invoices
 * OPTIMIZED: Uses batch processing, parallel operations, and retry logic
 */
export async function runEscalationWorker(): Promise<EscalationWorkerResult> {
    const tracker = new BatchPerformanceTracker('escalation_worker');
    const result: EscalationWorkerResult = {
        scannedCount: 0,
        escalatedCount: 0,
        pausedCount: 0,
        skippedCount: 0,
        errors: [],
        duration: 0,
        batchSize: BATCH_CONFIG.SIZE,
    };

    try {
        logInfo('Starting collections escalation worker (OPTIMIZED)', {
            batchSize: BATCH_CONFIG.SIZE,
            parallelLimit: BATCH_CONFIG.PARALLEL_LIMIT,
        });

        // 1. Get all overdue invoices
        const now = Timestamp.now();
        const overdueInvoicesSnapshot = await measurePerformance(
            'fetch_overdue_invoices',
            async () =>
                await db
                    .collection(COLLECTIONS.INVOICES)
                    .where('status', 'in', ['overdue', 'in_collections'])
                    .get()
        );

        result.scannedCount = overdueInvoicesSnapshot.size;
        logInfo(`Found ${result.scannedCount} overdue invoices to process`);

        if (result.scannedCount === 0) {
            result.duration = Date.now();
            tracker.logSummary();
            return result;
        }

        // 2. Convert to array and batch process
        const allInvoices = overdueInvoicesSnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data() as Invoice,
        }));

        // OPTIMIZATION: Process in batches to avoid memory issues
        const batches = chunkArray(allInvoices, BATCH_CONFIG.SIZE);

        logInfo(`Processing ${batches.length} batches of ${BATCH_CONFIG.SIZE} invoices`);

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            logInfo(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} invoices)`);

            // OPTIMIZATION: Process batch with controlled parallelism
            const batchResult = await processBatchWithRetry(
                batch,
                now,
                BATCH_CONFIG.MAX_RETRIES
            );

            // Aggregate results
            result.escalatedCount += batchResult.escalated;
            result.pausedCount += batchResult.paused;
            result.skippedCount += batchResult.skipped;
            result.errors.push(...batchResult.errors);

            tracker.increment();

            // Log progress
            logInfo(`Batch ${batchIndex + 1} complete`, {
                escalated: batchResult.escalated,
                paused: batchResult.paused,
                skipped: batchResult.skipped,
                errors: batchResult.errors.length,
            });
        }

        result.duration = Date.now();
        tracker.logSummary();

        logInfo('Collections escalation worker completed', result);

        return result;
    } catch (error: any) {
        result.duration = Date.now();
        tracker.error();
        tracker.logSummary();
        logError('Collections escalation worker failed', error);
        throw error;
    }
}

/**
 * Process a batch of invoices with retry logic
 */
async function processBatchWithRetry(
    batch: Array<{ id: string; data: Invoice }>,
    now: Timestamp,
    maxRetries: number
): Promise<{
    escalated: number;
    paused: number;
    skipped: number;
    errors: string[];
}> {
    const result = {
        escalated: 0,
        paused: 0,
        skipped: 0,
        errors: [] as string[],
    };

    // OPTIMIZATION: Process batch items with controlled parallelism
    const chunks = chunkArray(batch, BATCH_CONFIG.PARALLEL_LIMIT);

    for (const chunk of chunks) {
        const promises = chunk.map(async (item) => {
            return processInvoiceWithRetry(item.data, now, maxRetries);
        });

        const results = await Promise.allSettled(promises);

        // Aggregate results
        results.forEach((res, index) => {
            if (res.status === 'fulfilled') {
                const invoiceResult = res.value;
                if (invoiceResult.escalated) result.escalated++;
                if (invoiceResult.paused) result.paused++;
                if (invoiceResult.skipped) result.skipped++;
                if (invoiceResult.error) result.errors.push(invoiceResult.error);
            } else {
                const invoice = chunk[index].data;
                result.errors.push(`Failed to process invoice ${invoice.reference}: ${res.reason}`);
            }
        });
    }

    return result;
}

/**
 * Process a single invoice with exponential backoff retry
 */
async function processInvoiceWithRetry(
    invoice: Invoice,
    now: Timestamp,
    maxRetries: number,
    attempt: number = 0
): Promise<{
    escalated: boolean;
    paused: boolean;
    skipped: boolean;
    error?: string;
}> {
    try {
        const daysOverdue = Math.floor(
            (now.toMillis() - invoice.dueDate.toMillis()) / (1000 * 60 * 60 * 24)
        );

        // Skip if not truly overdue yet
        if (daysOverdue < 0) {
            return { escalated: false, paused: false, skipped: true };
        }

        // Get or create escalation state
        const escalationState = await getOrCreateEscalationState(invoice.invoiceId, daysOverdue);

        // Check if paused
        if (escalationState.isPaused) {
            // Check if should auto-resume
            if (escalationState.pauseUntil && now.toMillis() > escalationState.pauseUntil.getTime()) {
                await resumeEscalation(invoice.invoiceId, 'auto_resume_deadline_passed');
                logInfo(`Auto-resumed escalation for invoice ${invoice.reference}`);
            } else {
                return { escalated: false, paused: true, skipped: false };
            }
        }

        // Get user automation config
        const userConfig = await getUserAutomationConfig(invoice.freelancerId);
        if (!userConfig.enabled) {
            return { escalated: false, paused: false, skipped: true };
        }

        // Calculate target escalation level
        const targetLevel = calculateEscalationLevel(daysOverdue);

        // Check if should escalate
        if (shouldEscalate(escalationState.currentLevel, daysOverdue)) {
            await escalateInvoice(
                invoice,
                targetLevel,
                daysOverdue,
                userConfig,
                escalationState
            );
            return { escalated: true, paused: false, skipped: false };
        } else {
            return { escalated: false, paused: false, skipped: true };
        }
    } catch (error: any) {
        // Retry with exponential backoff
        if (attempt < maxRetries) {
            const delay = BATCH_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
            logWarn(`Retrying invoice ${invoice.reference} (attempt ${attempt + 1}/${maxRetries})`, {
                error: error.message,
                delay,
            });

            await sleep(delay);
            return processInvoiceWithRetry(invoice, now, maxRetries, attempt + 1);
        }

        const errorMsg = `Failed to process invoice ${invoice.reference} after ${maxRetries} retries: ${error.message}`;
        logError(errorMsg, error);
        return {
            escalated: false,
            paused: false,
            skipped: false,
            error: errorMsg,
        };
    }
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Sleep helper for retry delay
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get or create escalation state for an invoice
 */
async function getOrCreateEscalationState(
    invoiceId: string,
    daysOverdue: number
): Promise<EscalationState> {
    const stateDoc = await db.collection(COLLECTIONS.ESCALATION_STATES).doc(invoiceId).get();

    if (stateDoc.exists) {
        const data = stateDoc.data()!;
        return {
            invoiceId,
            currentLevel: data.currentLevel,
            isPaused: data.isPaused || false,
            pauseReason: data.pauseReason,
            pausedAt: data.pausedAt?.toDate(),
            pauseUntil: data.pauseUntil?.toDate(),
            lastEscalatedAt: data.lastEscalatedAt.toDate(),
            nextEscalationDue: data.nextEscalationDue?.toDate(),
            timeline: [], // Timeline stored separately for scalability
        };
    }

    // Create new state
    const initialLevel = calculateEscalationLevel(daysOverdue);
    const state: EscalationState = {
        invoiceId,
        currentLevel: initialLevel,
        isPaused: false,
        lastEscalatedAt: new Date(),
        timeline: [],
    };

    await db.collection(COLLECTIONS.ESCALATION_STATES).doc(invoiceId).set({
        currentLevel: initialLevel,
        isPaused: false,
        lastEscalatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    // Create initial timeline event
    await addTimelineEvent(invoiceId, {
        eventId: `${invoiceId}-init-${Date.now()}`,
        invoiceId,
        escalationLevel: initialLevel,
        eventType: 'escalated',
        timestamp: new Date(),
        message: `Collections started at ${ESCALATION_CONFIGS[initialLevel].badgeText} level`,
        metadata: { daysOverdue },
    });

    return state;
}

/**
 * Get user's automation configuration
 */
async function getUserAutomationConfig(userId: string): Promise<EscalationAutomationConfig> {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.data() as User | undefined;

    // Default config if not set
    return {
        enabled: userData?.collectionsAutomation?.enabled ?? true,
        userId,
        channels: {
            emailEnabled: true,
            smsEnabled: userData?.collectionsConsent?.smsConsent ?? false,
            phoneEnabled: false, // Manual only by default
            agencyEnabled: false, // Manual only by default
        },
        pauseConditions: {
            onPaymentClaim: true,
            onDispute: true,
        },
    };
}

/**
 * Escalate invoice to target level
 */
async function escalateInvoice(
    invoice: Invoice,
    targetLevel: EscalationLevel,
    daysOverdue: number,
    config: EscalationAutomationConfig,
    currentState: EscalationState
): Promise<void> {
    const levelConfig = ESCALATION_CONFIGS[targetLevel];

    logInfo(`Escalating invoice ${invoice.reference} to ${targetLevel}`, {
        invoiceId: invoice.invoiceId,
        from: currentState.currentLevel,
        to: targetLevel,
        daysOverdue,
    });

    // 1. Update escalation state
    await db.collection(COLLECTIONS.ESCALATION_STATES).doc(invoice.invoiceId).update({
        currentLevel: targetLevel,
        lastEscalatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Update invoice status
    if (targetLevel !== 'pending') {
        await db.collection(COLLECTIONS.INVOICES).doc(invoice.invoiceId).update({
            status: 'in_collections',
            escalationLevel: targetLevel,
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    // 3. Add timeline event
    await addTimelineEvent(invoice.invoiceId, {
        eventId: `${invoice.invoiceId}-escalate-${Date.now()}`,
        invoiceId: invoice.invoiceId,
        escalationLevel: targetLevel,
        eventType: 'escalated',
        timestamp: new Date(),
        message: `Escalated to ${levelConfig.badgeText} (${daysOverdue} days overdue)`,
        metadata: {
            previousLevel: currentState.currentLevel,
            daysOverdue,
            tone: levelConfig.tone,
            channels: levelConfig.channels,
        },
    });

    // 4. Send appropriate reminders based on channels
    if (levelConfig.channels.includes('email') && config.channels.emailEnabled) {
        await sendEscalationEmail(invoice, targetLevel, daysOverdue);
    }

    if (levelConfig.channels.includes('sms') && config.channels.smsEnabled) {
        await sendEscalationSMS(invoice, targetLevel, daysOverdue);
    }

    // 5. Track analytics event
    await trackEvent('collections_escalated', {
        invoice_id: invoice.invoiceId,
        invoice_reference: invoice.reference,
        escalation_level: targetLevel,
        days_overdue: daysOverdue,
        previous_level: currentState.currentLevel,
        amount: invoice.amount,
        freelancer_id: invoice.freelancerId,
    });

    logInfo(`Successfully escalated invoice ${invoice.reference} to ${targetLevel}`);
}

/**
 * Send escalation email reminder
 */
async function sendEscalationEmail(
    invoice: Invoice,
    level: EscalationLevel,
    daysOverdue: number
): Promise<void> {
    try {
        // Map escalation level to email template level
        // gentle → day5, firm → day15, final → day30
        let templateLevel: 5 | 15 | 30 = 5; // Moved to top level of function
        if (level === 'final' || level === 'agency') templateLevel = 30;
        else if (level === 'firm') templateLevel = 15;

        const mappedLevel = templateLevel === 5 ? 'day5' : templateLevel === 15 ? 'day15' : 'day30';
        const result = await sendReminderEmail({
            invoiceId: invoice.invoiceId,
            level: mappedLevel,
            clientEmail: invoice.clientEmail,
        });

        if (result.messageId) {
            // Add timeline event for sent email
            await addTimelineEvent(invoice.invoiceId, {
                eventId: `${invoice.invoiceId}-email-${Date.now()}`,
                invoiceId: invoice.invoiceId,
                escalationLevel: level,
                eventType: 'reminder_sent',
                channel: 'email',
                timestamp: new Date(),
                message: `${ESCALATION_CONFIGS[level].badgeText} reminder sent via email`,
                metadata: {
                    messageId: result.messageId,
                    templateLevel,
                    daysOverdue,
                },
            });

            // Track analytics
            await trackEvent('email_sent', {
                email_type: 'collections_reminder',
                escalation_level: level,
                invoice_id: invoice.invoiceId,
                template_level: templateLevel,
                days_overdue: daysOverdue,
            });
        } else {
            // Handle failure case
        }
    } catch (error: any) {
        logError(`Failed to send escalation email for ${invoice.reference}`, error);
        throw error;
    }
}

/**
 * Send escalation SMS reminder
 */
async function sendEscalationSMS(
    invoice: Invoice,
    level: EscalationLevel,
    daysOverdue: number
): Promise<void> {
    try {
        // Get user phone number
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(invoice.freelancerId).get();
        const user = userDoc.data() as User;

        if (!user.phoneNumber) {
            logWarn(`No phone number for user ${invoice.freelancerId}, skipping SMS`);
            return;
        }

        // Check SMS consent
        if (!user.collectionsConsent?.smsConsent || user.collectionsConsent?.smsOptedOut) {
            logWarn(`User ${invoice.freelancerId} has not consented to SMS, skipping`);
            return;
        }

        const updatedInvoice = {
            ...invoice,
            template_level: (level === 'final' || level === 'agency') ? '30' : (level === 'firm') ? '15' : '5', // Correct inline logic applied
            dueDate: invoice.dueDate.toDate().toLocaleDateString('en-GB'), // Format dueDate
            paymentLink: invoice.stripePaymentLinkUrl || undefined, // Resolve paymentLink
        };

        const result = await sendCollectionSMS({
            recipientPhone: user.phoneNumber,
            invoiceReference: updatedInvoice.reference,
            amount: updatedInvoice.amount,
            dueDate: updatedInvoice.dueDate, // Use formatted dueDate
            template: 'gentle_reminder', // Use a valid SMSTemplate value
            paymentLink: updatedInvoice.paymentLink, // No changes needed
            businessName: user.businessName || 'Relay', // Provide default value
            invoiceId: updatedInvoice.invoiceId,
            freelancerId: updatedInvoice.freelancerId,
        });

        if (result.success) {
            // Add timeline event
            await addTimelineEvent(invoice.invoiceId, {
                eventId: `${invoice.invoiceId}-sms-${Date.now()}`,
                invoiceId: invoice.invoiceId,
                escalationLevel: level,
                eventType: 'reminder_sent',
                channel: 'sms',
                timestamp: new Date(),
                message: `${ESCALATION_CONFIGS[level].badgeText} reminder sent via SMS`,
                metadata: {
                    messageSid: result.messageSid,
                    daysOverdue,
                },
            });

            // Track analytics
            await trackEvent('sms_sent', {
                sms_type: 'collections_reminder',
                escalation_level: level,
                invoice_id: invoice.invoiceId,
                days_overdue: daysOverdue,
            });
        }
    } catch (error: any) {
        logError(`Failed to send escalation SMS for ${invoice.reference}`, error);
        // Don't throw - SMS failure shouldn't stop escalation
    }
}

/**
 * Pause escalation (e.g., when payment claim filed)
 */
export async function pauseEscalation(
    invoiceId: string,
    reason: 'payment_claim' | 'manual' | 'dispute',
    pauseUntil?: Date
): Promise<void> {
    await db.collection(COLLECTIONS.ESCALATION_STATES).doc(invoiceId).update({
        isPaused: true,
        pauseReason: reason,
        pausedAt: FieldValue.serverTimestamp(),
        pauseUntil: pauseUntil ? Timestamp.fromDate(pauseUntil) : null,
        updatedAt: FieldValue.serverTimestamp(),
    });

    await addTimelineEvent(invoiceId, {
        eventId: `${invoiceId}-pause-${Date.now()}`,
        invoiceId,
        escalationLevel: 'pending', // Not relevant for pause event
        eventType: 'paused',
        timestamp: new Date(),
        message: `Collections paused due to ${reason.replace('_', ' ')}`,
        metadata: {
            reason,
            pauseUntil: pauseUntil?.toISOString(),
        },
    });

    logInfo(`Paused escalation for invoice ${invoiceId}`, { reason, pauseUntil });
}

/**
 * Resume escalation
 */
export async function resumeEscalation(
    invoiceId: string,
    reason: string
): Promise<void> {
    await db.collection(COLLECTIONS.ESCALATION_STATES).doc(invoiceId).update({
        isPaused: false,
        pauseReason: null,
        pausedAt: null,
        pauseUntil: null,
        updatedAt: FieldValue.serverTimestamp(),
    });

    await addTimelineEvent(invoiceId, {
        eventId: `${invoiceId}-resume-${Date.now()}`,
        invoiceId,
        escalationLevel: 'pending', // Not relevant for resume event
        eventType: 'resumed',
        timestamp: new Date(),
        message: `Collections resumed: ${reason}`,
        metadata: { reason },
    });

    logInfo(`Resumed escalation for invoice ${invoiceId}`, { reason });
}

/**
 * Add timeline event
 */
async function addTimelineEvent(
    invoiceId: string,
    event: EscalationTimelineEvent
): Promise<void> {
    await db
        .collection(COLLECTIONS.ESCALATION_TIMELINE)
        .doc(event.eventId)
        .set({
            ...event,
            timestamp: Timestamp.fromDate(event.timestamp),
            createdAt: FieldValue.serverTimestamp(),
        });
}

/**
 * Get timeline for an invoice
 */
export async function getEscalationTimeline(
    invoiceId: string
): Promise<EscalationTimelineEvent[]> {
    const snapshot = await db
        .collection(COLLECTIONS.ESCALATION_TIMELINE)
        .where('invoiceId', '==', invoiceId)
        .orderBy('timestamp', 'desc')
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            eventId: data.eventId,
            invoiceId: data.invoiceId,
            escalationLevel: data.escalationLevel,
            eventType: data.eventType,
            channel: data.channel,
            timestamp: data.timestamp.toDate(),
            message: data.message,
            metadata: data.metadata,
        };
    });
}

/**
 * Get current escalation state for an invoice
 */
export async function getEscalationState(invoiceId: string): Promise<EscalationState | null> {
    const stateDoc = await db.collection(COLLECTIONS.ESCALATION_STATES).doc(invoiceId).get();

    if (!stateDoc.exists) return null;

    const data = stateDoc.data()!;
    const timeline = await getEscalationTimeline(invoiceId);

    return {
        invoiceId,
        currentLevel: data.currentLevel,
        isPaused: data.isPaused || false,
        pauseReason: data.pauseReason,
        pausedAt: data.pausedAt?.toDate(),
        pauseUntil: data.pauseUntil?.toDate(),
        lastEscalatedAt: data.lastEscalatedAt.toDate(),
        nextEscalationDue: data.nextEscalationDue?.toDate(),
        timeline,
    };
}

import { db, Timestamp, COLLECTIONS, FieldValue } from '@/lib/firebase';
import { Invoice, CollectionAttempt, User } from '@/types/models';
import { sendReminderEmail } from '@/lib/sendgrid';
import { sendCollectionSMS } from '@/lib/twilio-sms';
import { sendCollectionLetter } from '@/lib/lob-letters';
import { NotFoundError } from '@/utils/error';
import { logDbOperation, logInfo, logError } from '@/utils/logger';
import { nanoid } from 'nanoid';
import {
  COLLECTIONS_DEMO_LIMIT_FREE,
  COLLECTION_DAY_5_REMINDER,
  COLLECTION_DAY_15_REMINDER,
  COLLECTION_DAY_30_REMINDER,
} from '@/utils/constants';
import { isCollectionsConsentObject, isBusinessAddressObject } from '@/utils/helpers';

// Alias for backward compatibility
const COLLECTION_DAY_14_REMINDER = COLLECTION_DAY_15_REMINDER;

/**
 * Helper function to convert Date | Timestamp to Date
 */
function toDate(date: Date | Timestamp | any): Date {
  if (date instanceof Date) {
    return date;
  }
  // It's a Timestamp
  return (date as any).toDate ? (date as any).toDate() : new Date((date as any).seconds * 1000);
}

/**
 * Check if user can use collections demo (1 free per month for free users)
 */
export async function canUseCollectionsDemo(userId: string): Promise<{
  canUse: boolean;
  remaining: number;
  resetDate: Date;
  reason?: string;
}> {
  const startTime = Date.now();

  // Get user document
  const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
  if (!userDoc.exists) {
    throw new NotFoundError('User not found');
  }

  const user = userDoc.data() as User;

  // Paid users (non-free tiers) have unlimited or higher collection limits
  if (user.subscriptionTier !== 'free') {
    return {
      canUse: true,
      remaining: -1, // -1 means unlimited (or handled by tier-specific limits)
      resetDate: new Date(), // Not applicable
    };
  }

  // Free users: check monthly quota
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Calculate reset date (1st of next month)
  const resetDate = new Date(currentYear, currentMonth + 1, 1);

  // Get collections count for current month
  const collectionsCount = user.collectionsDemoUsedThisMonth || 0;
  const lastResetDate = user.lastDemoResetDate ? toDate(user.lastDemoResetDate) : undefined;

  // Check if we need to reset the count (new month)
  let actualCollectionsCount = collectionsCount;
  if (lastResetDate) {
    const lastResetMonth = lastResetDate.getMonth();
    const lastResetYear = lastResetDate.getFullYear();

    if (lastResetMonth !== currentMonth || lastResetYear !== currentYear) {
      // Reset count for new month
      actualCollectionsCount = 0;
      await db.collection(COLLECTIONS.USERS).doc(userId).update({
        collectionsDemoUsedThisMonth: 0,
        lastDemoResetDate: Timestamp.fromDate(new Date(currentYear, currentMonth, 1)),
      });
    }
  } else {
    // First time using collections, initialize
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      collectionsDemoUsedThisMonth: 0,
      lastDemoResetDate: Timestamp.fromDate(new Date(currentYear, currentMonth, 1)),
    });
    actualCollectionsCount = 0;
  }

  const remaining = Math.max(0, COLLECTIONS_DEMO_LIMIT_FREE - actualCollectionsCount);
  const canUse = actualCollectionsCount < COLLECTIONS_DEMO_LIMIT_FREE;

  logDbOperation('check_collections_quota', COLLECTIONS.USERS, userId, Date.now() - startTime);

  return {
    canUse,
    remaining,
    resetDate,
    reason: canUse ? undefined : 'Monthly collections limit reached. Upgrade to Premium for unlimited collections.',
  };
}

/**
 * Enable collections for an invoice
 */
export async function enableCollections(invoiceId: string, userId: string): Promise<Invoice> {
  const startTime = Date.now();

  // Get invoice
  const invoiceDoc = await db.collection(COLLECTIONS.INVOICES).doc(invoiceId).get();
  if (!invoiceDoc.exists) {
    throw new NotFoundError('Invoice not found');
  }

  const invoice = invoiceDoc.data() as Invoice;

  // Verify ownership
  if (invoice.freelancerId !== userId) {
    throw new NotFoundError('Invoice not found');
  }

  // Check if already enabled
  if (invoice.collectionsEnabled) {
    throw new Error('Collections already enabled for this invoice');
  }

  // Check quota
  const quota = await canUseCollectionsDemo(userId);
  if (!quota.canUse) {
    throw new Error(quota.reason || 'Cannot enable collections');
  }

  // Enable collections
  await invoiceDoc.ref.update({
    collectionsEnabled: true,
    collectionsEnabledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Increment user's collections count (atomic operation to prevent race conditions)
  await db.collection(COLLECTIONS.USERS).doc(userId).update({
    collectionsDemoUsedThisMonth: FieldValue.increment(1),
  });

  logDbOperation('enable_collections', COLLECTIONS.INVOICES, invoiceId, Date.now() - startTime);

  return { ...invoice, collectionsEnabled: true };
}

/**
 * Process collections reminders (day 7 and day 21)
 * This is called by the cron job
 */
export async function processCollections(): Promise<{
  day7Count: number;
  day21Count: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const now = Timestamp.now();
  const errors: string[] = [];
  let day7Count = 0;
  let day21Count = 0;

  try {
    // Get all overdue invoices with collections enabled
    const snapshot = await db
      .collection(COLLECTIONS.INVOICES)
      .where('status', '==', 'overdue')
      .where('collectionsEnabled', '==', true)
      .get();

    logInfo('Processing overdue invoices for collections', { invoiceCount: snapshot.size });

    for (const doc of snapshot.docs) {
      const invoice = doc.data() as Invoice;

      try {
        // Skip if payment claim is pending verification
        if (invoice.paymentClaimStatus === 'pending_verification') {
          logInfo('Skipping collections - payment claim pending', { invoiceRef: invoice.reference });
          continue;
        }

        // Calculate days overdue
        const dueDate = toDate(invoice.dueDate);
        const nowDate = new Date(now.toDate());
        const daysOverdue = Math.floor((nowDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        logInfo('Invoice overdue check', { invoiceRef: invoice.reference, daysOverdue });

        // Check if we should send day 7 reminder
        if (daysOverdue >= COLLECTION_DAY_5_REMINDER && !invoice.firstReminderSentAt) {
          logInfo('Sending day 7 reminder', { invoiceRef: invoice.reference });

          // Get freelancer details
          const userDoc = await db.collection(COLLECTIONS.USERS).doc(invoice.freelancerId).get();
          const freelancerName = userDoc.exists ? userDoc.data()?.fullName || 'Freelancer' : 'Freelancer';

          // Send email using new reminder system
          await sendReminderEmail({
            invoiceId: invoice.invoiceId,
            level: 'day5',
            clientEmail: invoice.clientEmail,
          });

          // Create collection attempt record
          await db.collection(COLLECTIONS.COLLECTION_ATTEMPTS).add({
            attemptId: nanoid(),
            invoiceId: invoice.invoiceId,
            freelancerId: invoice.freelancerId,
            attemptType: 'email_reminder',
            attemptDate: now,
            attemptNumber: 1,
            result: 'success',


            createdAt: now,
          });

          // Update invoice (atomic increment to prevent race conditions)
          await doc.ref.update({
            firstReminderSentAt: now,
            collectionsAttempts: FieldValue.increment(1),
            updatedAt: now,
          });

          day7Count++;
        }

        // Check if we should send day 14 SMS reminder (PREMIUM)
        if (daysOverdue >= COLLECTION_DAY_14_REMINDER) {
          // Get existing attempt to check if SMS already sent
          const attemptQuery = await db
            .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
            .where('invoiceId', '==', invoice.invoiceId)
            .where('sms_day_14_sent', '==', true)
            .limit(1)
            .get();

          if (attemptQuery.empty) {
            logInfo('Checking Day 14 SMS eligibility', { invoiceRef: invoice.reference });

            // Get user details for SMS consent and phone
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(invoice.freelancerId).get();
            if (!userDoc.exists) {
              logError('User not found for SMS', new Error('User not found'), { userId: invoice.freelancerId });
            } else {
              const user = userDoc.data() as User;

              // Check SMS consent and subscription tier
              const hasConsent = isCollectionsConsentObject(user.collectionsConsent)
                && user.collectionsConsent.smsConsent
                && !user.collectionsConsent.smsOptedOut;
              const isPaidUser = user.subscriptionTier !== 'free';

              if (hasConsent && isPaidUser && user.phoneNumber) {
                try {
                  // Send SMS via Twilio
                  const smsResult = await sendCollectionSMS({
                    recipientPhone: user.phoneNumber,
                    invoiceReference: invoice.reference,
                    amount: invoice.amount,
                    dueDate: toDate(invoice.dueDate).toLocaleDateString('en-GB'),
                    template: 'urgent_reminder',
                    paymentLink: invoice.stripePaymentLinkUrl,
                    businessName: user.businessName || 'Recoup',
                    invoiceId: invoice.invoiceId,
                    freelancerId: invoice.freelancerId,
                  });

                  if (smsResult.success) {
                    // Create collection attempt record with SMS flag
                    await db.collection(COLLECTIONS.COLLECTION_ATTEMPTS).add({
                      attemptId: nanoid(),
                      invoiceId: invoice.invoiceId,
                      freelancerId: invoice.freelancerId,
                      attemptType: 'sms_reminder',
                      attemptDate: now,
                      attemptNumber: 2, // Day 14 is attempt #2
                      result: 'success',
                      sms_day_14_sent: true,
                      sms_day_14_sid: smsResult.messageSid,
                      sms_day_14_sent_at: now,
                      createdAt: now,
                    });

                    logInfo('SMS Day 14 sent successfully', {
                      invoiceRef: invoice.reference,
                      messageSid: smsResult.messageSid,
                    });
                  } else {
                    logError('SMS Day 14 failed', new Error(smsResult.error || 'Unknown error'), {
                      invoiceRef: invoice.reference,
                    });
                  }
                } catch (error) {
                  logError('SMS Day 14 exception', error, { invoiceRef: invoice.reference });
                }
              } else {
                logInfo('SMS Day 14 skipped - no consent or not paid tier', {
                  invoiceRef: invoice.reference,
                  hasConsent,
                  isPaidUser,
                  hasPhone: !!user.phoneNumber,
                });
              }
            }
          }
        }

        // Check if we should send day 21 reminder
        if (daysOverdue >= COLLECTION_DAY_15_REMINDER && !invoice.secondReminderSentAt) {
          logInfo('Sending day 21 reminder', { invoiceRef: invoice.reference });

          // Get freelancer details
          const userDoc = await db.collection(COLLECTIONS.USERS).doc(invoice.freelancerId).get();
          const freelancerName = userDoc.exists ? userDoc.data()?.fullName || 'Freelancer' : 'Freelancer';

          // Send email using new reminder system
          await sendReminderEmail({
            invoiceId: invoice.invoiceId,
            level: 'day15',
            clientEmail: invoice.clientEmail,
          });

          // Create collection attempt record
          await db.collection(COLLECTIONS.COLLECTION_ATTEMPTS).add({
            attemptId: nanoid(),
            invoiceId: invoice.invoiceId,
            freelancerId: invoice.freelancerId,
            attemptType: 'email_reminder',
            attemptDate: now,
            attemptNumber: 2,
            result: 'success',
            createdAt: now,
          });

          // Update invoice (atomic increment to prevent race conditions)
          await doc.ref.update({
            secondReminderSentAt: now,
            collectionsAttempts: FieldValue.increment(1),
            updatedAt: now,
            status: 'in_collections', // Move to collections status
          });

          day21Count++;
        }

        // Check if we should send day 30 physical letter (PREMIUM)
        if (daysOverdue >= COLLECTION_DAY_30_REMINDER) {
          // Get existing attempt to check if letter already sent
          const attemptQuery = await db
            .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
            .where('invoiceId', '==', invoice.invoiceId)
            .where('letter_day_30_sent', '==', true)
            .limit(1)
            .get();

          if (attemptQuery.empty) {
            logInfo('Checking Day 30 Letter eligibility', { invoiceRef: invoice.reference });

            // Get user details
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(invoice.freelancerId).get();
            if (!userDoc.exists) {
              logError('User not found for letter', new Error('User not found'), { userId: invoice.freelancerId });
            } else {
              const user = userDoc.data() as User;

              // Check consent, subscription tier, and business address
              const hasConsent = isCollectionsConsentObject(user.collectionsConsent)
                && user.collectionsConsent.physicalMailConsent
                && !user.collectionsConsent.physicalMailOptedOut;
              const isPaidUser = user.subscriptionTier !== 'free';
              const hasAddress = !!user.businessAddress && isBusinessAddressObject(user.businessAddress);

              if (!hasAddress) {
                // Notify user to set business address
                logInfo('Day 30 Letter skipped - no business address', { invoiceRef: invoice.reference });
                // TODO: Send email notification to user to add business address
              } else if (hasConsent && isPaidUser && isBusinessAddressObject(user.businessAddress)) {
                try {
                  const businessAddr = user.businessAddress;
                  const invoiceDateObj = toDate(invoice.invoiceDate);

                  // Send physical letter via Lob
                  const letterResult = await sendCollectionLetter({
                    recipient: {
                      recipientName: invoice.clientName,
                      line1: businessAddr.addressLine1,
                      line2: businessAddr.addressLine2,
                      city: businessAddr.city,
                      postcode: businessAddr.postcode,
                      country: 'GB',
                    },
                    invoiceReference: invoice.reference,
                    amount: invoice.amount,
                    dueDate: toDate(invoice.dueDate).toLocaleDateString('en-GB'),
                    daysPastDue: daysOverdue,
                    invoiceDate: invoiceDateObj.toLocaleDateString('en-GB'),
                    template: 'final_warning',
                    businessName: user.businessName || 'Recoup',
                    businessAddress: `${businessAddr.addressLine1}\n${businessAddr.addressLine2 || ''}\n${businessAddr.city}\n${businessAddr.postcode}`,
                    invoiceId: invoice.invoiceId,
                    freelancerId: invoice.freelancerId,
                  });

                  if (letterResult.success) {
                    // Create collection attempt record with letter flag
                    await db.collection(COLLECTIONS.COLLECTION_ATTEMPTS).add({
                      attemptId: nanoid(),
                      invoiceId: invoice.invoiceId,
                      freelancerId: invoice.freelancerId,
                      attemptType: 'physical_letter',
                      attemptDate: now,
                      attemptNumber: 3, // Day 30 is attempt #3
                      result: 'success',
                      letter_day_30_sent: true,
                      letter_day_30_lob_id: letterResult.letterId,
                      letter_day_30_sent_at: now,
                      letterTrackingUrl: letterResult.trackingUrl,
                      createdAt: now,
                    });

                    logInfo('Letter Day 30 sent successfully', {
                      invoiceRef: invoice.reference,
                      letterId: letterResult.letterId,
                    });
                  } else {
                    logError('Letter Day 30 failed', new Error(letterResult.error || 'Unknown error'), {
                      invoiceRef: invoice.reference,
                    });
                  }
                } catch (error) {
                  logError('Letter Day 30 exception', error, { invoiceRef: invoice.reference });
                }
              } else {
                logInfo('Letter Day 30 skipped - no consent or not paid tier', {
                  invoiceRef: invoice.reference,
                  hasConsent,
                  isPaidUser,
                  hasAddress,
                });
              }
            }
          }
        }
      } catch (error) {
        const errorMsg = `Failed to process invoice ${invoice.reference}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logError(errorMsg, error);
        errors.push(errorMsg);
      }
    }

    logDbOperation('process_collections', COLLECTIONS.INVOICES, undefined, Date.now() - startTime);

    logInfo('Collections processing complete', { day7Count, day21Count });

    return { day7Count, day21Count, errors };
  } catch (error) {
    logError('Collections processing failed', error);
    throw error;
  }
}

/**
 * Get collections history for an invoice
 */
export async function getCollectionsHistory(
  invoiceId: string,
  userId: string
): Promise<CollectionAttempt[]> {
  const startTime = Date.now();

  // Verify invoice ownership
  const invoiceDoc = await db.collection(COLLECTIONS.INVOICES).doc(invoiceId).get();
  if (!invoiceDoc.exists) {
    throw new NotFoundError('Invoice not found');
  }

  const invoice = invoiceDoc.data() as Invoice;
  if (invoice.freelancerId !== userId) {
    throw new NotFoundError('Invoice not found');
  }

  // Get collection attempts
  const snapshot = await db
    .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
    .where('invoiceId', '==', invoiceId)
    .orderBy('sentAt', 'desc')
    .get();

  logDbOperation('get_collections_history', COLLECTIONS.COLLECTION_ATTEMPTS, undefined, Date.now() - startTime);

  return snapshot.docs.map((doc) => doc.data() as CollectionAttempt);
}

/**
 * Disable collections for an invoice
 */
export async function disableCollections(invoiceId: string, userId: string): Promise<Invoice> {
  const startTime = Date.now();

  // Get invoice
  const invoiceDoc = await db.collection(COLLECTIONS.INVOICES).doc(invoiceId).get();
  if (!invoiceDoc.exists) {
    throw new NotFoundError('Invoice not found');
  }

  const invoice = invoiceDoc.data() as Invoice;

  // Verify ownership
  if (invoice.freelancerId !== userId) {
    throw new NotFoundError('Invoice not found');
  }

  // Disable collections
  await invoiceDoc.ref.update({
    collectionsEnabled: false,
    updatedAt: Timestamp.now(),
  });

  logDbOperation('disable_collections', COLLECTIONS.INVOICES, invoiceId, Date.now() - startTime);

  return { ...invoice, collectionsEnabled: false };
}


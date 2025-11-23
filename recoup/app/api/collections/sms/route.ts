/**
 * PREMIUM API: Send SMS Collection Reminder
 * POST /api/collections/sms
 *
 * Sends an SMS reminder to a client for an overdue invoice.
 * Requires paid subscription and user consent.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, FieldValue } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { sendCollectionSMS, SMSTemplate } from '@/lib/twilio-sms';
import { requirePremiumAccess, logPremiumFeatureUsage } from '@/middleware/premiumGating';
import { requireClerkFeature, incrementUsageCounter } from '@/middleware/clerkPremiumGating'; // ✨ NEW Clerk gating
import { validateConsentOrThrow } from '@/services/consentService';
import { errors, handleApiError, UnauthorizedError, NotFoundError, ForbiddenError, ValidationError } from '@/utils/error';
import { logApiRequest, logApiResponse, logInfo } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * Send SMS collection reminder
 * POST /api/collections/sms
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logApiRequest('POST', '/api/collections/sms', userId);

    // 2. Check premium access (NEW: Clerk Billing + usage quota)
    await requireClerkFeature(userId, 'sms_reminders');

    // 3. Check user consent
    await validateConsentOrThrow(userId, ['sms', 'data_storage']);

    // 4. Parse request body
    const body = await req.json();
    const {
      invoiceId,
      recipientPhone,
      template = 'gentle_reminder',
    }: {
      invoiceId: string;
      recipientPhone: string;
      template?: string;
    } = body;

    if (!invoiceId || !recipientPhone) {
      throw new ValidationError('Missing required fields: invoiceId, recipientPhone');
    }

    // 5. Get invoice
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      throw new NotFoundError('Invoice not found');
    }

    const invoice = invoiceDoc.data() as Invoice;

    // 6. Verify ownership
    if (invoice.freelancerId !== userId) {
      throw new ForbiddenError('You do not have access to this invoice');
    }

    // 7. Check invoice status
    if (invoice.status === 'paid') {
      throw new ValidationError('Invoice is already paid');
    }

    // 8. Get user for business name and verify SMS opt-out status
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const businessName = userData?.businessName || userData?.name || 'Your Freelancer';

    // CRITICAL: Check if freelancer's consent includes smsOptedOut flag
    // This field tracks if the FREELANCER has globally disabled SMS for their account
    if (userData?.collectionsConsent && typeof userData.collectionsConsent === 'object') {
      if (userData.collectionsConsent.smsOptedOut === true) {
        throw new ForbiddenError(
          'SMS sending is disabled for your account. Please contact support to re-enable.'
        );
      }
    }

    // CRITICAL: Check if CLIENT has opted out of receiving SMS (UK PECR compliance)
    // Must honor client's opt-out immediately to comply with UK regulations
    // We track opt-outs in User.collectionsConsent.smsOptOuts by normalized phone number
    const normalizedPhone = recipientPhone.replace(/[\s\-\(\)]/g, ''); // Remove spaces, dashes, parentheses

    // Check if this client phone number has opted out from this freelancer's messages
    const smsOptOuts = userData?.collectionsConsent?.smsOptOuts || {};

    if (smsOptOuts[normalizedPhone]) {
      const optOutData = smsOptOuts[normalizedPhone];
      const optedOutDate = optOutData.optedOutAt ? new Date(optOutData.optedOutAt).toLocaleDateString('en-GB') : 'unknown date';

      throw new ForbiddenError(
        `This phone number opted out of SMS on ${optedOutDate}. Cannot send SMS (UK PECR compliance).`
      );
    }

    // 9. Calculate days past due
    const dueDateMillis = invoice.dueDate instanceof Date ? invoice.dueDate.getTime() : (invoice.dueDate as any).toMillis();
    const daysPastDue = Math.floor(
      (Date.now() - dueDateMillis) / (1000 * 60 * 60 * 24)
    );

    // 10. Send SMS
    const smsResult = await sendCollectionSMS({
      recipientPhone,
      invoiceReference: invoice.reference,
      amount: invoice.amount,
      dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toLocaleDateString('en-GB') : invoice.dueDate.toDate().toLocaleDateString('en-GB'),
      template,
      paymentLink: invoice.stripePaymentLinkUrl,
      businessName,
      invoiceId,
      freelancerId: userId,
    });

    if (!smsResult.success) {
      throw new Error(smsResult.error || 'Failed to send SMS');
    }

    // 11. Record collection attempt
    const attemptRef = db.collection('collection_attempts').doc();
    await attemptRef.set({
      attemptId: attemptRef.id,
      invoiceId,
      freelancerId: userId,
      attemptType: 'sms_reminder',
      attemptDate: FieldValue.serverTimestamp(),
      attemptNumber: (invoice.collectionsAttempts || 0) + 1,
      result: 'pending',
      resultDetails: `SMS sent via Twilio (${template})`,

      // SMS specifics
      twilioMessageId: smsResult.messageSid,
      smsSentAt: FieldValue.serverTimestamp(),
      smsStatus: smsResult.status,

      // Metadata
      isPremiumFeature: true,
      consentGiven: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 12. Update invoice collections count
    await db.collection('invoices').doc(invoiceId).update({
      collectionsAttempts: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 13. Increment usage counter (NEW: Track for monthly quota)
    await incrementUsageCounter(userId, 'collection');

    // 14. Log premium feature usage (legacy - kept for backwards compatibility)
    await logPremiumFeatureUsage({
      userId,
      feature: 'sms_reminders',
      invoiceId,
      cost: 0.04, // £0.04 per SMS
    });

    logInfo('SMS collection reminder sent', {
      invoiceId,
      messageSid: smsResult.messageSid,
      template,
    });

    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/sms', 200, { duration, userId });

    return NextResponse.json({
      success: true,
      message: 'SMS reminder sent successfully',
      attemptId: attemptRef.id,
      messageSid: smsResult.messageSid,
      cost: 0.04,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/sms', error.statusCode || 500, { duration });

    // Handle premium access errors with upgrade CTA
    if (error.statusCode === 402) {
      return NextResponse.json(
        {
          error: error.message,
          upgradeRequired: true,
          upgradeUrl: '/settings/billing/upgrade',
        },
        { status: 402 }
      );
    }

    const errorResponse = await handleApiError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

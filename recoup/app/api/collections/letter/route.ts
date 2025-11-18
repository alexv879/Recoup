/**
 * PREMIUM API: Send Physical Collection Letter
 * POST /api/collections/letter
 *
 * Sends a physical letter via postal mail for invoice collection.
 * UK-ready with legal templates (gentle, final warning, Letter Before Action).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, FieldValue } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { sendCollectionLetter, LetterTemplate, UKAddress } from '@/lib/lob-letters';
import { requirePremiumAccess, logPremiumFeatureUsage } from '@/middleware/premiumGating';
import { requireClerkFeature, incrementUsageCounter } from '@/middleware/clerkPremiumGating';
import { validateConsentOrThrow } from '@/services/consentService';
import { errors, handleApiError, UnauthorizedError, NotFoundError, ForbiddenError, ValidationError } from '@/utils/error';
import { logApiRequest, logApiResponse, logInfo } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * Send physical collection letter
 * POST /api/collections/letter
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logApiRequest('POST', '/api/collections/letter', userId);

    // 2. Check premium access (NEW: Clerk Billing + usage quota)
    await requireClerkFeature(userId, 'physical_letters_15_per_month');

    // 3. Check user consent
    await validateConsentOrThrow(userId, ['physical_mail', 'data_storage']);

    // 4. Parse request body
    const body = await req.json();
    const {
      invoiceId,
      recipientAddress,
      template = 'gentle',
      sendCertified = false,
    }: {
      invoiceId: string;
      recipientAddress: UKAddress;
      template?: string;
      sendCertified?: boolean;
    } = body;

    if (!invoiceId || !recipientAddress) {
      throw new ValidationError('Missing required fields: invoiceId, recipientAddress');
    }

    // Validate address fields
    if (
      !recipientAddress.recipientName ||
      !recipientAddress.line1 ||
      !recipientAddress.city ||
      !recipientAddress.postcode
    ) {
      throw new ValidationError('Incomplete recipient address');
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

    // 8. Get user details and business address
    // AUDIT TASK #1: Use user-supplied business address instead of hardcoded value
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const businessName = userData?.businessName || userData?.name || 'Your Freelancer';

    // Retrieve user's business address (added in Phase 2)
    const userAddress = userData?.businessAddress;

    // Validation: Ensure business address is configured
    if (!userAddress || !userAddress.addressLine1 || !userAddress.city || !userAddress.postcode) {
      throw new ValidationError(
        'Business address not configured. Please update your address in Settings before sending letters.'
      );
    }

    // Format address for Lob (UK format)
    const businessAddress = [
      userAddress.companyName || businessName,
      userAddress.addressLine1,
      userAddress.addressLine2,
      userAddress.city,
      userAddress.postcode,
      userAddress.country || 'United Kingdom'
    ].filter(Boolean).join('\n');

    // 9. Calculate days past due
    const dueDateMillis = invoice.dueDate instanceof Date ? invoice.dueDate.getTime() : (invoice.dueDate as any).toMillis();
    const daysPastDue = Math.floor(
      (Date.now() - dueDateMillis) / (1000 * 60 * 60 * 24)
    );

    // 10. Check template appropriateness
    if (template === 'lba' && daysPastDue < 90) {
      throw new ValidationError(
        'Letter Before Action should only be sent after 90+ days overdue'
      );
    }

    // 11. Send letter
    const letterResult = await sendCollectionLetter({
      recipient: recipientAddress,
      invoiceReference: invoice.reference,
      amount: invoice.amount,
      dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toLocaleDateString('en-GB') : invoice.dueDate.toDate().toLocaleDateString('en-GB'),
      daysPastDue,
      invoiceDate: invoice.invoiceDate instanceof Date ? invoice.invoiceDate.toLocaleDateString('en-GB') : invoice.invoiceDate.toDate().toLocaleDateString('en-GB'),
      template,
      businessName,
      businessAddress,
      invoiceId,
      freelancerId: userId,
      sendCertified,
    });

    if (!letterResult.success) {
      throw new Error(letterResult.error || 'Failed to send letter');
    }

    // 12. Record collection attempt
    const attemptRef = db.collection('collection_attempts').doc();
    await attemptRef.set({
      attemptId: attemptRef.id,
      invoiceId,
      freelancerId: userId,
      attemptType: 'physical_letter',
      attemptDate: FieldValue.serverTimestamp(),
      attemptNumber: (invoice.collectionsAttempts || 0) + 1,
      result: 'pending',
      resultDetails: `Physical letter sent via Lob (${template})`,

      // Letter specifics
      letterApiRef: letterResult.letterId,
      letterSentAt: FieldValue.serverTimestamp(),
      letterStatus: 'sent',
      templateUsed: template,
      recipientAddress: {
        line1: recipientAddress.line1,
        line2: recipientAddress.line2,
        city: recipientAddress.city,
        postcode: recipientAddress.postcode,
        country: recipientAddress.country,
      },
      letterTrackingUrl: letterResult.trackingUrl,
      letterExpectedDelivery: letterResult.expectedDeliveryDate
        ? new Date(letterResult.expectedDeliveryDate)
        : null,

      // Metadata
      isPremiumFeature: true,
      consentGiven: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 13. Update invoice collections count
    await db.collection('invoices').doc(invoiceId).update({
      collectionsAttempts: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 14. Calculate cost
    const cost = sendCertified ? 1.20 + 1.50 : 1.20; // Base + certified tracking

    // 15. Increment usage counter (NEW: Track for monthly quota)
    await incrementUsageCounter(userId, 'letter');

    // 16. Log premium feature usage
    await logPremiumFeatureUsage({
      userId,
      feature: 'physical_letters',
      invoiceId,
      cost,
    });

    logInfo('Physical letter sent', {
      invoiceId,
      letterId: letterResult.letterId,
      template,
      certified: sendCertified,
    });

    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/letter', 200, { duration, userId });

    return NextResponse.json({
      success: true,
      message: 'Physical letter sent successfully',
      attemptId: attemptRef.id,
      letterId: letterResult.letterId,
      trackingUrl: letterResult.trackingUrl,
      expectedDelivery: letterResult.expectedDeliveryDate,
      cost,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/letter', error.statusCode || 500, { duration });

    // Handle premium access errors
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

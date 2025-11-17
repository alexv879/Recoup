/**
 * PREMIUM API: Initiate AI Voice Collection Call
 * POST /api/collections/ai-call
 *
 * Initiates an AI-powered voice call to collect payment.
 * Uses OpenAI Realtime API + Twilio for automated, empathetic collection calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, FieldValue } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { initiateAICollectionCall, estimateAICallCost } from '@/lib/ai-voice-agent';
import { requirePremiumAccess, logPremiumFeatureUsage } from '@/middleware/premiumGating';
import { requireClerkFeature, incrementUsageCounter } from '@/middleware/clerkPremiumGating';
import { validateConsentOrThrow } from '@/services/consentService';
import { errors, handleApiError } from '@/utils/error';
import { logApiRequest, logApiResponse, logInfo } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * Initiate AI collection call
 * POST /api/collections/ai-call
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw errors.unauthorized();
    }

    logApiRequest('POST', '/api/collections/ai-call', userId);

    // 2. Check premium access (NEW: Clerk Billing + usage quota)
    await requireClerkFeature(userId, 'ai_voice_calls_5_per_month');

    // 3. Check user consent (requires call, recording, and data storage)
    await validateConsentOrThrow(userId, ['call', 'call_recording', 'data_storage']);

    // 4. Parse request body
    const body = await req.json();
    const {
      invoiceId,
      recipientPhone,
      recipientName,
      enablePaymentDuringCall = true,
    }: {
      invoiceId: string;
      recipientPhone: string;
      recipientName: string;
      enablePaymentDuringCall?: boolean;
    } = body;

    if (!invoiceId || !recipientPhone || !recipientName) {
      throw errors.badRequest('Missing required fields: invoiceId, recipientPhone, recipientName');
    }

    // 5. Get invoice
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      throw errors.notFound('Invoice not found');
    }

    const invoice = invoiceDoc.data() as Invoice;

    // 6. Verify ownership
    if (invoice.freelancerId !== userId) {
      throw errors.forbidden('You do not have access to this invoice');
    }

    // 7. Check invoice status
    if (invoice.status === 'paid') {
      throw errors.badRequest('Invoice is already paid');
    }

    // 8. Check minimum amount (calls cost money, don't waste on tiny debts)
    if (invoice.amount < 50) {
      throw errors.badRequest('Invoice amount too low for AI call (minimum £50)');
    }

    // 9. Get user details
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const businessName = userData?.businessName || userData?.name || 'Your Freelancer';

    // 10. Calculate days past due
    const daysPastDue = Math.floor(
      (Date.now() - invoice.dueDate.toMillis()) / (1000 * 60 * 60 * 24)
    );

    // 11. Check if already called recently (prevent spam)
    const recentCalls = await db
      .collection('collection_attempts')
      .where('invoiceId', '==', invoiceId)
      .where('attemptType', '==', 'ai_call')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!recentCalls.empty) {
      const lastCall = recentCalls.docs[0].data();
      const hoursSinceLastCall = (Date.now() - lastCall.createdAt.toMillis()) / (1000 * 60 * 60);

      if (hoursSinceLastCall < 24) {
        throw errors.badRequest(
          'Cannot make another AI call within 24 hours of the last call'
        );
      }
    }

    // 12. Initiate call
    const callResult = await initiateAICollectionCall({
      recipientPhone,
      recipientName,
      invoiceReference: invoice.reference,
      amount: invoice.amount,
      dueDate: invoice.dueDate.toDate().toLocaleDateString('en-GB'),
      daysPastDue,
      businessName,
      invoiceId,
      freelancerId: userId,
      enablePaymentDuringCall,
    });

    if (!callResult.success) {
      throw new Error(callResult.error || 'Failed to initiate call');
    }

    // 13. Record collection attempt
    const attemptRef = db.collection('collection_attempts').doc();
    await attemptRef.set({
      attemptId: attemptRef.id,
      invoiceId,
      freelancerId: userId,
      attemptType: 'ai_call',
      attemptDate: FieldValue.serverTimestamp(),
      attemptNumber: invoice.collectionsAttempts + 1,
      result: 'pending',
      resultDetails: 'AI call initiated, awaiting completion',

      // Call specifics
      callSID: callResult.callSid,
      callStartedAt: FieldValue.serverTimestamp(),
      callOutcome: undefined, // Will be updated by webhook

      // Metadata
      isPremiumFeature: true,
      consentGiven: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 14. Update invoice collections count
    await db.collection('invoices').doc(invoiceId).update({
      collectionsAttempts: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 15. Estimate cost (actual cost logged by webhook when call completes)
    const costEstimate = estimateAICallCost({
      estimatedDurationMinutes: 5,
      includeSMS: enablePaymentDuringCall,
      includeRecording: true,
    });

    // 16. Increment usage counter (NEW: Track for monthly quota)
    await incrementUsageCounter(userId, 'ai_call');

    // 17. Log premium feature usage (estimated)
    await logPremiumFeatureUsage({
      userId,
      feature: 'ai_voice_calls',
      invoiceId,
      cost: costEstimate.total,
    });

    logInfo('AI collection call initiated', {
      invoiceId,
      callSid: callResult.callSid,
      estimatedCost: costEstimate.total,
    });

    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/ai-call', 200, duration, userId);

    return NextResponse.json({
      success: true,
      message: 'AI collection call initiated',
      attemptId: attemptRef.id,
      callSid: callResult.callSid,
      estimatedCost: costEstimate.total,
      costBreakdown: costEstimate,
      note: 'Call is in progress. You will receive a notification when it completes.',
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/ai-call', error.statusCode || 500, duration);

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

    return handleApiError(error);
  }
}

/**
 * Get AI call status
 * GET /api/collections/ai-call?attemptId=xxx
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw errors.unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get('attemptId');

    if (!attemptId) {
      throw errors.badRequest('Missing attemptId parameter');
    }

    // Get attempt
    const attemptDoc = await db.collection('collection_attempts').doc(attemptId).get();

    if (!attemptDoc.exists) {
      throw errors.notFound('Call attempt not found');
    }

    const attempt = attemptDoc.data();

    // Verify ownership
    if (attempt?.freelancerId !== userId) {
      throw errors.forbidden('You do not have access to this call');
    }

    return NextResponse.json({
      success: true,
      attempt: {
        attemptId: attempt.attemptId,
        callSid: attempt.callSID,
        status: attempt.result,
        outcome: attempt.callOutcome,
        duration: attempt.callDuration,
        transcript: attempt.callTranscript,
        summary: attempt.callNotes,
        recordingUrl: attempt.callRecordingUrl,
        startedAt: attempt.callStartedAt,
        endedAt: attempt.callEndedAt,
        nextAction: attempt.nextAction,
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}

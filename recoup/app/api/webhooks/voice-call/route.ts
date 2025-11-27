/**
 * Voice Call Completion Webhook
 * POST /api/webhooks/voice-call
 *
 * This webhook is called by the render-server when an AI voice call completes.
 * It receives the call summary including transcript, outcome, and payment commitment.
 *
 * Architecture:
 * 1. Render-server completes call with debtor
 * 2. Render-server sends POST to this endpoint with CallSummary
 * 3. This endpoint stores outcome in Firestore
 * 4. Updates invoice escalation state based on outcome
 * 5. Logs collection activity for ML benchmarking
 * 6. Sends payment link SMS if payment was committed
 */

import { NextRequest, NextResponse } from 'next/server';
import { logInfo, logError } from '@/utils/logger';
import { generateCorrelationId } from '@/lib/webhook-recovery';
import { validateWebhookOrigin, validateContentType } from '@/lib/csrf-protection';
import { checkWebhookRateLimit, getRateLimitHeaders } from '@/lib/webhook-ratelimit';
import { db } from '@/lib/firebase-admin';
import { sendCollectionSMS } from '@/lib/twilio-sms';

export const dynamic = 'force-dynamic';

/**
 * Call summary from render-server
 */
interface CallSummary {
  callSid: string;
  callContext: {
    invoiceReference: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
    clientName: string;
    businessName: string;
  };
  startTime: string;
  endTime: string;
  durationSeconds: number;
  outcome: 'payment_committed' | 'payment_plan' | 'dispute' | 'no_resolution' | 'error';
  transcripts: Array<{
    role: 'assistant' | 'user';
    content: string;
    timestamp: string;
  }>;
  paymentCommitment?: {
    amount: number;
    agreedDate: string;
    planType: 'full' | 'partial' | 'installments';
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const correlationId = generateCorrelationId();

  try {
    // 1. Rate limiting
    const rateLimit = await checkWebhookRateLimit(req, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
    });

    if (!rateLimit.allowed) {
      logError('Rate limit exceeded for voice-call webhook', new Error('Rate limit exceeded'));
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // 2. CSRF Protection
    if (!validateWebhookOrigin(req)) {
      logError('CSRF: Invalid origin on webhook', new Error('Invalid origin'));
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!validateContentType(req, ['application/json'])) {
      logError('CSRF: Invalid Content-Type', new Error('Invalid content type'));
      return NextResponse.json({ error: 'Invalid Content-Type' }, { status: 400 });
    }

    // 3. Verify webhook secret (render-server authentication)
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = process.env.RENDER_WEBHOOK_SECRET;

    if (!expectedSecret) {
      logError('RENDER_WEBHOOK_SECRET not configured', new Error('Missing webhook secret'));
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (webhookSecret !== expectedSecret) {
      logError('Invalid webhook secret', new Error('Authentication failed'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Parse call summary
    const body = await req.json();
    const callSummary: CallSummary = body.callSummary;
    const invoiceId = body.invoiceId;

    if (!callSummary || !invoiceId) {
      logError('Missing required fields', new Error('Invalid payload'));
      return NextResponse.json({ error: 'Missing callSummary or invoiceId' }, { status: 400 });
    }

    logInfo('Voice call completed', {
      invoiceId,
      outcome: callSummary.outcome,
      duration: callSummary.durationSeconds,
      correlationId,
    });

    // 5. Store call outcome in Firestore
    const collectionActivityRef = db.collection('collectionActivities').doc();
    await collectionActivityRef.set({
      invoiceId,
      activityType: 'voice_call_ai',
      outcome: callSummary.outcome,
      callSid: callSummary.callSid,
      durationSeconds: callSummary.durationSeconds,
      transcript: callSummary.transcripts,
      paymentCommitment: callSummary.paymentCommitment || null,
      timestamp: new Date(),
      createdAt: new Date(),
    });

    // 6. Update invoice escalation state based on outcome
    const invoiceRef = db.collection('invoices').doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      logError('Invoice not found', new Error(`Invoice ${invoiceId} not found`));
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceData = invoiceDoc.data();

    // Update invoice based on outcome
    const updates: any = {
      lastContactDate: new Date(),
      'escalation.lastCallDate': new Date(),
      'escalation.callCount': (invoiceData?.escalation?.callCount || 0) + 1,
    };

    switch (callSummary.outcome) {
      case 'payment_committed':
        updates['escalation.status'] = 'payment_committed';
        updates['escalation.paymentCommitment'] = callSummary.paymentCommitment;
        updates['escalation.nextActionDate'] = callSummary.paymentCommitment?.agreedDate
          ? new Date(callSummary.paymentCommitment.agreedDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;

      case 'payment_plan':
        updates['escalation.status'] = 'payment_plan';
        updates['escalation.paymentCommitment'] = callSummary.paymentCommitment;
        updates['escalation.nextActionDate'] = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
        break;

      case 'dispute':
        updates['escalation.status'] = 'dispute';
        updates['escalation.disputeRaised'] = true;
        updates['escalation.nextActionDate'] = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;

      case 'no_resolution':
        updates['escalation.status'] = 'no_contact';
        updates['escalation.nextActionDate'] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;

      case 'error':
        updates['escalation.status'] = 'error';
        updates['escalation.lastError'] = 'Call failed';
        updates['escalation.nextActionDate'] = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
        break;
    }

    await invoiceRef.update(updates);

    // 7. Send payment link SMS if payment was committed
    if (
      callSummary.outcome === 'payment_committed' &&
      callSummary.paymentCommitment &&
      invoiceData?.clientPhone
    ) {
      try {
        // Get payment link
        const paymentLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoiceId}`;

        // Send SMS with payment link
        await sendCollectionSMS({
          recipientPhone: invoiceData.clientPhone,
          invoiceReference: callSummary.callContext.invoiceReference,
          amount: invoiceData.amount,
          dueDate: invoiceData.dueDate?.toDate?.()?.toISOString() || new Date().toISOString(),
          template: 'payment_link',
          paymentLink: paymentLinkUrl,
          businessName: callSummary.callContext.businessName,
          invoiceId,
          freelancerId: invoiceData.freelancerId,
        });

        logInfo('Payment link SMS sent', { invoiceId, correlationId });
      } catch (smsError: any) {
        logError('Failed to send payment link SMS', smsError, { invoiceId });
        // Don't fail the webhook if SMS fails
      }
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      activityId: collectionActivityRef.id,
      correlationId,
    });

  } catch (error: any) {
    logError('Voice call webhook error', error, { correlationId });

    return NextResponse.json(
      {
        error: 'Internal server error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/webhooks/voice-call',
    timestamp: new Date().toISOString(),
  });
}

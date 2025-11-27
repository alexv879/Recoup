/**
 * AI Voice Call API Route (Python Integration)
 * Initiates AI-powered collection calls via Python service
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { UnauthorizedError, handleApiError } from '@/utils/error';
import { checkUserRateLimit } from '@/lib/ratelimit';
import { logApiRequest, logApiResponse } from '@/utils/logger';
import { differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

const PYTHON_AI_VOICE_SERVICE_URL = process.env.PYTHON_AI_VOICE_SERVICE_URL || 'http://localhost:8003';

/**
 * POST /api/collections/ai-call-python
 * Initiate AI collection call using Python service
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logApiRequest('POST', '/api/collections/ai-call-python', userId);

    // 2. Rate limit check (very strict for calls)
    const { allowed, remaining } = checkUserRateLimit(userId, {
      windowMs: 3600000, // 1 hour
      maxRequests: 5
    });

    if (!allowed) {
      throw new Error('Rate limit exceeded. Maximum 5 calls per hour.');
    }

    // 3. Parse request body
    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      throw new Error('Invoice ID required');
    }

    // 4. Get invoice from Firestore
    const invoiceDoc = await db
      .collection(COLLECTIONS.INVOICES)
      .doc(invoiceId)
      .get();

    if (!invoiceDoc.exists) {
      throw new Error('Invoice not found');
    }

    const invoice = invoiceDoc.data();

    // 5. Authorization check
    if (invoice.freelancerId !== userId) {
      throw new UnauthorizedError();
    }

    // 6. Validate invoice eligibility
    if (invoice.amount < 50) {
      throw new Error('Minimum invoice amount for AI calls is £50');
    }

    const daysOverdue = differenceInDays(
      new Date(),
      invoice.dueDate?.toDate() || new Date()
    );

    if (daysOverdue < 7) {
      throw new Error('Invoice must be at least 7 days overdue for AI calls');
    }

    // 7. Get user details
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const user = userDoc.data();

    // 8. Call Python AI voice service
    const response = await fetch(`${PYTHON_AI_VOICE_SERVICE_URL}/initiate-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient_phone: invoice.clientPhone || body.clientPhone,
        recipient_name: invoice.clientName,
        invoice_reference: invoice.reference,
        amount: invoice.amount / 100, // Convert pence to pounds
        due_date: invoice.dueDate?.toDate()?.toISOString().split('T')[0],
        days_past_due: daysOverdue,
        business_name: user?.businessName || user?.name || 'Your Business',
        invoice_id: invoiceId,
        freelancer_id: userId,
        enable_payment_during_call: body.enablePayment !== false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'AI voice service error');
    }

    const result = await response.json();

    // 9. Log collection attempt to Firestore
    if (result.success) {
      await db.collection(COLLECTIONS.COLLECTION_ATTEMPTS).add({
        invoiceId,
        freelancerId: userId,
        type: 'ai_voice_call',
        callSid: result.call_sid,
        status: 'initiated',
        estimatedCost: result.estimated_cost?.total || 0,
        createdAt: new Date()
      });
    }

    // 10. Log and return
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/ai-call-python', 200, { duration, userId });

    return NextResponse.json({
      ...result,
      remainingCalls: remaining
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/ai-call-python', 500, { duration });
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}


/**
 * GET /api/collections/ai-call-python/[callSid]
 * Get AI call status and transcript
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ callSid: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    const { callSid } = await params;

    // Call Python service to get status
    const response = await fetch(`${PYTHON_AI_VOICE_SERVICE_URL}/call-status/${callSid}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get call status');
    }

    const callStatus = await response.json();

    const duration = Date.now() - startTime;
    logApiResponse('GET', '/api/collections/ai-call-python', 200, { duration, userId });

    return NextResponse.json(callStatus);

  } catch (error) {
    const duration = Date.now() - startTime;
    logApiResponse('GET', '/api/collections/ai-call-python', 500, { duration });
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

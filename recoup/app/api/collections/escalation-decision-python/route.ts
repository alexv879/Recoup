/**
 * Escalation Decision API Route (Python Integration)
 * Gets escalation recommendations from Python decision engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { UnauthorizedError, handleApiError } from '@/utils/error';
import { checkUserRateLimit } from '@/lib/ratelimit';
import { logApiRequest, logApiResponse } from '@/utils/logger';
import { differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

const PYTHON_DECISION_ENGINE_URL = process.env.PYTHON_DECISION_ENGINE_URL || 'http://localhost:8004';

/**
 * POST /api/collections/escalation-decision-python
 * Get escalation recommendation from Python decision engine
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logApiRequest('POST', '/api/collections/escalation-decision-python', userId);

    // 2. Rate limit check
    const { allowed, remaining } = checkUserRateLimit(userId, {
      windowMs: 60000,
      maxRequests: 20
    });

    if (!allowed) {
      throw new Error('Rate limit exceeded');
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

    if (!invoice) {
      throw new Error('Invoice data not found');
    }

    // 5. Authorization check
    if (invoice.freelancerId !== userId) {
      throw new UnauthorizedError();
    }

    // 6. Calculate days overdue
    const daysOverdue = differenceInDays(
      new Date(),
      invoice.dueDate?.toDate() || new Date()
    );

    // 7. Get collection attempts count
    const attemptsSnapshot = await db
      .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
      .where('invoiceId', '==', invoiceId)
      .get();

    const previousAttempts = attemptsSnapshot.size;

    // 8. Prepare request for Python service
    const decisionRequest = {
      invoice_amount: invoice.amount / 100, // Convert pence to pounds
      days_overdue: daysOverdue,
      is_disputed_debt: body.isDisputed || false,
      debtor_type: body.debtorType || invoice.clientType || 'unknown',
      previous_attempts: previousAttempts,
      relationship_value: body.relationshipValue || 'medium',
      has_written_contract: body.hasContract || invoice.hasContract || false,
      has_proof_of_delivery: body.hasProof || invoice.hasProof || false,
      debtor_has_assets: body.hasAssets ? 'true' : body.hasAssets === false ? 'false' : 'unknown'
    };

    // 9. Call Python decision engine
    const response = await fetch(`${PYTHON_DECISION_ENGINE_URL}/recommend-escalation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(decisionRequest)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Decision engine error');
    }

    const recommendation = await response.json();

    // 10. Log and return
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/escalation-decision-python', 200, { duration, userId });

    return NextResponse.json({
      ...recommendation,
      invoice: {
        id: invoiceId,
        reference: invoice.reference,
        amount: invoice.amount,
        clientName: invoice.clientName
      },
      remainingRequests: remaining
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/escalation-decision-python', 500, { duration });
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

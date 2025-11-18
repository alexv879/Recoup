/**
 * Predictions API Route (Python Integration)
 * Uses Python ML models for better forecasting
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { UnauthorizedError, handleApiError } from '@/utils/error';
import { checkUserRateLimit } from '@/lib/ratelimit';
import { logApiRequest, logApiResponse } from '@/utils/logger';
import { subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

const PYTHON_ANALYTICS_SERVICE_URL = process.env.PYTHON_ANALYTICS_SERVICE_URL || 'http://localhost:8002';

/**
 * GET /api/dashboard/predictions-python
 * Get ML-powered predictions from Python service
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logApiRequest('GET', '/api/dashboard/predictions-python', userId);

    // 2. Rate limit check
    const { allowed, remaining } = checkUserRateLimit(userId, {
      windowMs: 60000,
      maxRequests: 10
    });

    if (!allowed) {
      throw new Error('Rate limit exceeded');
    }

    // 3. Get historical invoices from Firestore
    const sixMonthsAgo = subMonths(new Date(), 6);
    const invoicesSnapshot = await db
      .collection(COLLECTIONS.INVOICES)
      .where('freelancerId', '==', userId)
      .where('createdAt', '>=', sixMonthsAgo)
      .get();

    // 4. Convert to plain objects for Python service
    const invoices = invoicesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        invoice_id: data.invoiceId,
        freelancer_id: data.freelancerId,
        client_name: data.clientName,
        client_email: data.clientEmail,
        amount: data.amount,
        status: data.status,
        invoice_date: data.invoiceDate?.toDate?.()?.toISOString() || data.invoiceDate,
        due_date: data.dueDate?.toDate?.()?.toISOString() || data.dueDate,
        paid_at: data.paidAt?.toDate?.()?.toISOString() || data.paidAt || null,
        collections_enabled: data.collectionsEnabled || false,
        currency: data.currency || 'GBP'
      };
    });

    // 5. Call Python analytics service
    const response = await fetch(`${PYTHON_ANALYTICS_SERVICE_URL}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        invoices: invoices,
        months_history: 6
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Python analytics service error');
    }

    const predictions = await response.json();

    // 6. Log and return
    const duration = Date.now() - startTime;
    logApiResponse('GET', '/api/dashboard/predictions-python', 200, { duration, userId });

    return NextResponse.json({
      ...predictions,
      remainingRequests: remaining
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logApiResponse('GET', '/api/dashboard/predictions-python', 500, { duration });
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

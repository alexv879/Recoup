/**
 * Collection Outcome Logging API
 * POST /api/collections/log-outcome
 *
 * Logs collection attempt outcomes for ML benchmarking and analysis.
 * This data is used to:
 * - Calculate success rates by industry
 * - Train predictive models for collection likelihood
 * - Generate industry benchmark reports
 * - Optimize escalation strategies
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase-admin';
import { logInfo, logError } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * Collection outcome data structure
 */
interface CollectionOutcome {
  invoiceId: string;
  attemptType: 'email' | 'sms' | 'letter' | 'call' | 'ai_call' | 'manual';
  outcome: 'paid' | 'partial' | 'promise' | 'dispute' | 'no_response' | 'refused';
  amountCollected?: number;
  daysPastDue: number;
  invoiceAmount: number;
  industryCode?: number;
  attemptNumber: number;
  responseTime?: number; // Hours until response
  metadata?: Record<string, any>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const outcome: CollectionOutcome = body;

    // 3. Validate required fields
    if (!outcome.invoiceId || !outcome.attemptType || !outcome.outcome) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceId, attemptType, outcome' },
        { status: 400 }
      );
    }

    // 4. Verify invoice belongs to user
    const invoiceRef = db.collection('invoices').doc(outcome.invoiceId);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoiceData = invoiceDoc.data();

    if (invoiceData?.freelancerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to invoice' },
        { status: 403 }
      );
    }

    // 5. Get client industry code if not provided
    let industryCode = outcome.industryCode;
    if (!industryCode && invoiceData?.clientId) {
      const clientRef = db.collection('clients').doc(invoiceData.clientId);
      const clientDoc = await clientRef.get();

      if (clientDoc.exists) {
        industryCode = clientDoc.data()?.industryCode;
      }
    }

    // 6. Store collection outcome in dedicated collection for ML
    const collectionOutcomeRef = db.collection('collectionOutcomes').doc();
    await collectionOutcomeRef.set({
      userId,
      invoiceId: outcome.invoiceId,
      clientId: invoiceData?.clientId,
      attemptType: outcome.attemptType,
      outcome: outcome.outcome,
      amountCollected: outcome.amountCollected || 0,
      daysPastDue: outcome.daysPastDue,
      invoiceAmount: outcome.invoiceAmount,
      industryCode: industryCode || null,
      attemptNumber: outcome.attemptNumber,
      responseTime: outcome.responseTime || null,
      metadata: outcome.metadata || {},
      timestamp: new Date(),
      createdAt: new Date(),
    });

    // 7. Update invoice with outcome
    await invoiceRef.update({
      lastCollectionAttempt: new Date(),
      lastCollectionOutcome: outcome.outcome,
      updatedAt: new Date(),
    });

    // 8. If payment collected, update invoice status
    if (outcome.outcome === 'paid' && outcome.amountCollected) {
      await invoiceRef.update({
        status: 'paid',
        paidAt: new Date(),
      });
    }

    logInfo('Collection outcome logged', {
      outcomeId: collectionOutcomeRef.id,
      invoiceId: outcome.invoiceId,
      outcome: outcome.outcome,
    });

    return NextResponse.json({
      success: true,
      outcomeId: collectionOutcomeRef.id,
    });

  } catch (error: any) {
    logError('Failed to log collection outcome', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve collection outcomes for an invoice
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get invoice ID from query params
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoiceId parameter' },
        { status: 400 }
      );
    }

    // 3. Verify invoice belongs to user
    const invoiceRef = db.collection('invoices').doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoiceData = invoiceDoc.data();

    if (invoiceData?.freelancerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to invoice' },
        { status: 403 }
      );
    }

    // 4. Fetch collection outcomes for this invoice
    const outcomesSnapshot = await db
      .collection('collectionOutcomes')
      .where('invoiceId', '==', invoiceId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const outcomes = outcomesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      outcomes,
      count: outcomes.length,
    });

  } catch (error: any) {
    logError('Failed to retrieve collection outcomes', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * ML Payment Outcome Recording API
 *
 * Records actual payment outcomes for continuous learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { recordPaymentOutcome } from '@/lib/ml-payment-predictor';
import { logError, logInfo } from '@/utils/logger';

/**
 * POST /api/ml/record-outcome
 *
 * Record actual payment outcome for ML learning
 *
 * Body:
 * {
 *   invoiceId: string;
 *   actualDaysToPayment: number;
 *   wasPaid: boolean;
 * }
 */
export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { invoiceId, actualDaysToPayment, wasPaid } = body;

        if (!invoiceId || actualDaysToPayment === undefined || wasPaid === undefined) {
            return NextResponse.json(
                { error: 'invoiceId, actualDaysToPayment, and wasPaid are required' },
                { status: 400 }
            );
        }

        logInfo('Recording payment outcome for ML learning', {
            userId,
            invoiceId,
            actualDaysToPayment,
            wasPaid,
        });

        // Record outcome
        await recordPaymentOutcome(invoiceId, actualDaysToPayment, wasPaid);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        logError('Failed to record payment outcome', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

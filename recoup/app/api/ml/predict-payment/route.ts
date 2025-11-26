/**
 * ML Payment Prediction API
 *
 * Proxies requests to Python ML service for payment time prediction
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { extractPaymentFeatures } from '@/lib/ml-payment-predictor';
import { logError, logInfo } from '@/utils/logger';

/**
 * POST /api/ml/predict-payment
 *
 * Predict payment time for an invoice
 *
 * Body:
 * {
 *   invoiceId: string;
 * }
 *
 * Returns:
 * {
 *   predictedDaysUntilPayment: number;
 *   paymentProbability: number;
 *   confidenceScore: number;
 *   recommendedStrategy: string;
 *   riskLevel: string;
 *   factors: Array<{feature: string, impact: number, value: any}>;
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
        const { invoiceId } = body;

        if (!invoiceId) {
            return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
        }

        logInfo('ML payment prediction requested', { userId, invoiceId });

        // Extract features from invoice
        const features = await extractPaymentFeatures(invoiceId, userId);

        // Call Python ML service
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
        const response = await fetch(`${mlServiceUrl}/ml/predict-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(features),
        });

        if (!response.ok) {
            throw new Error(`ML service error: ${response.status}`);
        }

        const prediction = await response.json();

        logInfo('ML payment prediction completed', {
            userId,
            invoiceId,
            predictedDays: prediction.predictedDaysUntilPayment,
            riskLevel: prediction.riskLevel,
        });

        return NextResponse.json(prediction, { status: 200 });
    } catch (error) {
        logError('ML payment prediction failed', error);

        // Return fallback prediction on error
        return NextResponse.json(
            {
                predictedDaysUntilPayment: 30,
                paymentProbability: 0.5,
                confidenceScore: 0.3,
                recommendedStrategy: 'standard',
                riskLevel: 'medium',
                factors: [],
                error: 'ML service unavailable, using fallback prediction',
            },
            { status: 200 }
        );
    }
}

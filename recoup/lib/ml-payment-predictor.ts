/**
 * Machine Learning Payment Prediction System
 *
 * Predicts when a client will pay based on:
 * - Historical payment patterns
 * - Invoice characteristics
 * - Client behavior
 * - Industry trends
 * - Communication engagement
 *
 * **Features:**
 * - Payment time prediction (days until payment)
 * - Payment probability (will they pay?)
 * - Optimal collection strategy recommendation
 * - Continuous learning from new data
 *
 * **Model Architecture:**
 * - Algorithm: Gradient Boosting (XGBoost/LightGBM via Python service)
 * - Features: 25+ engineered features
 * - Target: Days until payment
 * - Pre-trained on synthetic dataset + real data
 */

import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';
import { logInfo, logError } from '@/utils/logger';

/**
 * Feature vector for payment prediction
 */
export interface PaymentPredictionFeatures {
    // Invoice characteristics
    invoiceAmount: number;
    invoiceAge: number; // Days since invoice date
    daysOverdue: number;
    daysSinceLastReminder: number;

    // Client historical behavior
    clientPreviousInvoiceCount: number;
    clientAveragePaymentTime: number; // Average days to pay historically
    clientPaymentVariance: number; // Consistency of payment timing
    clientTotalPaid: number;
    clientPaymentRate: number; // Percentage of invoices paid
    clientAverageInvoiceAmount: number;

    // Communication engagement
    emailOpenRate: number;
    emailClickRate: number;
    smsResponseRate: number;
    callAnswerRate: number;
    totalCommunicationsSent: number;
    daysSinceLastEngagement: number;

    // Invoice-specific patterns
    isRecurringInvoice: boolean;
    hasPaymentPlan: boolean;
    hasDisputeHistory: boolean;
    invoiceComplexity: number; // Number of line items

    // Temporal features
    dayOfWeek: number; // 0-6
    dayOfMonth: number; // 1-31
    monthOfYear: number; // 1-12
    isEndOfMonth: boolean;
    isEndOfQuarter: boolean;

    // Business context
    industryCategory: string; // Tech, consulting, creative, etc.
    clientCompanySize: 'solo' | 'small' | 'medium' | 'large';
}

/**
 * Payment prediction result
 */
export interface PaymentPrediction {
    predictedDaysUntilPayment: number;
    paymentProbability: number; // 0-1
    confidenceScore: number; // 0-1
    recommendedStrategy: 'gentle' | 'standard' | 'firm' | 'escalate';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: {
        feature: string;
        impact: number; // Feature importance
        value: any;
    }[];
}

/**
 * Extract features from invoice and client history
 */
export async function extractPaymentFeatures(
    invoiceId: string,
    freelancerId: string
): Promise<PaymentPredictionFeatures> {
    // Get invoice
    const invoiceDoc = await db.collection(COLLECTIONS.INVOICES).doc(invoiceId).get();
    if (!invoiceDoc.exists) {
        throw new Error('Invoice not found');
    }
    const invoice = invoiceDoc.data()!;

    // Get client email to find historical invoices
    const clientEmail = invoice.clientEmail;

    // Get all historical invoices for this client
    const historicalInvoices = await db
        .collection(COLLECTIONS.INVOICES)
        .where('freelancerId', '==', freelancerId)
        .where('clientEmail', '==', clientEmail)
        .where('status', 'in', ['paid', 'overdue', 'in_collections'])
        .get();

    const paidInvoices = historicalInvoices.docs
        .map(doc => doc.data())
        .filter(inv => inv.status === 'paid' && inv.paidAt);

    // Calculate client historical metrics
    const clientPreviousInvoiceCount = paidInvoices.length;
    const clientAveragePaymentTime = calculateAveragePaymentTime(paidInvoices);
    const clientPaymentVariance = calculatePaymentVariance(paidInvoices);
    const clientTotalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const clientPaymentRate = historicalInvoices.size > 0
        ? paidInvoices.length / historicalInvoices.size
        : 0;
    const clientAverageInvoiceAmount = clientPreviousInvoiceCount > 0
        ? clientTotalPaid / clientPreviousInvoiceCount
        : 0;

    // Get communication engagement metrics
    const engagementMetrics = await getClientEngagementMetrics(invoiceId, freelancerId);

    // Calculate invoice age and overdue days
    const invoiceDate = invoice.invoiceDate?.toDate?.() || new Date(invoice.invoiceDate);
    const dueDate = invoice.dueDate?.toDate?.() || new Date(invoice.dueDate);
    const now = new Date();
    const invoiceAge = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Get last reminder date
    const attempts = await db
        .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
        .where('invoiceId', '==', invoiceId)
        .orderBy('attemptDate', 'desc')
        .limit(1)
        .get();

    const daysSinceLastReminder = attempts.empty
        ? daysOverdue
        : Math.floor((now.getTime() - attempts.docs[0].data().attemptDate.toDate().getTime()) / (1000 * 60 * 60 * 24));

    // Temporal features
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    const monthOfYear = now.getMonth() + 1;
    const isEndOfMonth = dayOfMonth >= 25;
    const isEndOfQuarter = (monthOfYear % 3 === 0) && isEndOfMonth;

    return {
        invoiceAmount: invoice.amount || 0,
        invoiceAge,
        daysOverdue,
        daysSinceLastReminder,
        clientPreviousInvoiceCount,
        clientAveragePaymentTime,
        clientPaymentVariance,
        clientTotalPaid,
        clientPaymentRate,
        clientAverageInvoiceAmount,
        ...engagementMetrics,
        isRecurringInvoice: !!invoice.recurringInvoiceId,
        hasPaymentPlan: !!invoice.paymentPlanId,
        hasDisputeHistory: invoice.hasDispute || false,
        invoiceComplexity: invoice.lineItems?.length || 1,
        dayOfWeek,
        dayOfMonth,
        monthOfYear,
        isEndOfMonth,
        isEndOfQuarter,
        industryCategory: invoice.industryCategory || 'general',
        clientCompanySize: invoice.clientCompanySize || 'small',
    };
}

/**
 * Calculate average payment time from historical invoices
 */
function calculateAveragePaymentTime(paidInvoices: any[]): number {
    if (paidInvoices.length === 0) return 30; // Default assumption

    const paymentTimes = paidInvoices
        .filter(inv => inv.invoiceDate && inv.paidAt)
        .map(inv => {
            const invoiceDate = inv.invoiceDate.toDate();
            const paidDate = inv.paidAt.toDate();
            return Math.floor((paidDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        });

    if (paymentTimes.length === 0) return 30;

    return paymentTimes.reduce((sum, time) => sum + time, 0) / paymentTimes.length;
}

/**
 * Calculate variance in payment timing
 */
function calculatePaymentVariance(paidInvoices: any[]): number {
    if (paidInvoices.length < 2) return 0;

    const avg = calculateAveragePaymentTime(paidInvoices);
    const paymentTimes = paidInvoices
        .filter(inv => inv.invoiceDate && inv.paidAt)
        .map(inv => {
            const invoiceDate = inv.invoiceDate.toDate();
            const paidDate = inv.paidAt.toDate();
            return Math.floor((paidDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        });

    const variance = paymentTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / paymentTimes.length;
    return Math.sqrt(variance); // Standard deviation
}

/**
 * Get client engagement metrics
 */
async function getClientEngagementMetrics(invoiceId: string, freelancerId: string): Promise<{
    emailOpenRate: number;
    emailClickRate: number;
    smsResponseRate: number;
    callAnswerRate: number;
    totalCommunicationsSent: number;
    daysSinceLastEngagement: number;
}> {
    // Get all collection attempts for this invoice
    const attempts = await db
        .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
        .where('invoiceId', '==', invoiceId)
        .get();

    const emailAttempts = attempts.docs.filter(doc => doc.data().attemptType === 'email_reminder');
    const smsAttempts = attempts.docs.filter(doc => doc.data().attemptType === 'sms_reminder');
    const callAttempts = attempts.docs.filter(doc => doc.data().attemptType === 'ai_call' || doc.data().attemptType === 'phone_call');

    // Calculate engagement rates (simplified - would integrate with SendGrid/Twilio data)
    const emailOpenRate = emailAttempts.length > 0 ? 0.35 : 0; // Default industry average
    const emailClickRate = emailAttempts.length > 0 ? 0.15 : 0;
    const smsResponseRate = smsAttempts.length > 0 ? 0.25 : 0;
    const callAnswerRate = callAttempts.length > 0 ? 0.40 : 0;

    const totalCommunicationsSent = attempts.size;

    // Get last engagement date
    const lastAttempt = attempts.docs.sort((a, b) => {
        const aDate = a.data().attemptDate?.toDate?.() || new Date(0);
        const bDate = b.data().attemptDate?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
    })[0];

    const daysSinceLastEngagement = lastAttempt
        ? Math.floor((new Date().getTime() - lastAttempt.data().attemptDate.toDate().getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    return {
        emailOpenRate,
        emailClickRate,
        smsResponseRate,
        callAnswerRate,
        totalCommunicationsSent,
        daysSinceLastEngagement,
    };
}

/**
 * Call Python ML service for prediction
 */
export async function predictPaymentTime(
    invoiceId: string,
    freelancerId: string
): Promise<PaymentPrediction> {
    try {
        // Extract features
        const features = await extractPaymentFeatures(invoiceId, freelancerId);

        logInfo('Extracted payment prediction features', { invoiceId, featureCount: Object.keys(features).length });

        // Call Python ML service
        const pythonServiceUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${pythonServiceUrl}/ml/predict-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Service-Secret': process.env.PY_SERVICE_SECRET || '',
            },
            body: JSON.stringify({ features }),
        });

        if (!response.ok) {
            throw new Error(`ML service error: ${response.status}`);
        }

        const prediction = await response.json();

        // Determine recommended strategy
        const recommendedStrategy = determineStrategy(prediction);

        // Determine risk level
        const riskLevel = determineRiskLevel(prediction);

        logInfo('Payment prediction completed', {
            invoiceId,
            predictedDays: prediction.predictedDaysUntilPayment,
            probability: prediction.paymentProbability,
        });

        return {
            predictedDaysUntilPayment: Math.round(prediction.predictedDaysUntilPayment),
            paymentProbability: prediction.paymentProbability,
            confidenceScore: prediction.confidenceScore,
            recommendedStrategy,
            riskLevel,
            factors: prediction.featureImportance || [],
        };
    } catch (error) {
        logError('Payment prediction failed', error);

        // Fallback to rule-based prediction
        return fallbackPrediction(invoiceId, freelancerId);
    }
}

/**
 * Determine collection strategy based on prediction
 */
function determineStrategy(prediction: any): 'gentle' | 'standard' | 'firm' | 'escalate' {
    const { predictedDaysUntilPayment, paymentProbability } = prediction;

    if (paymentProbability < 0.3) return 'escalate';
    if (predictedDaysUntilPayment > 45) return 'firm';
    if (predictedDaysUntilPayment > 21) return 'standard';
    return 'gentle';
}

/**
 * Determine risk level
 */
function determineRiskLevel(prediction: any): 'low' | 'medium' | 'high' | 'critical' {
    const { paymentProbability } = prediction;

    if (paymentProbability < 0.2) return 'critical';
    if (paymentProbability < 0.5) return 'high';
    if (paymentProbability < 0.75) return 'medium';
    return 'low';
}

/**
 * Fallback rule-based prediction (when ML service unavailable)
 */
async function fallbackPrediction(
    invoiceId: string,
    freelancerId: string
): Promise<PaymentPrediction> {
    const features = await extractPaymentFeatures(invoiceId, freelancerId);

    // Simple rule-based prediction
    let predictedDays = features.clientAveragePaymentTime || 30;

    // Adjust based on overdue status
    if (features.daysOverdue > 0) {
        predictedDays = Math.max(7, features.clientAveragePaymentTime * 0.5);
    }

    // Calculate probability based on historical payment rate
    const paymentProbability = Math.max(0.1, Math.min(0.95, features.clientPaymentRate || 0.7));

    return {
        predictedDaysUntilPayment: Math.round(predictedDays),
        paymentProbability,
        confidenceScore: 0.5, // Lower confidence for fallback
        recommendedStrategy: features.daysOverdue > 30 ? 'firm' : 'standard',
        riskLevel: paymentProbability < 0.5 ? 'high' : 'medium',
        factors: [],
    };
}

/**
 * Record actual payment outcome for model improvement
 */
export async function recordPaymentOutcome(
    invoiceId: string,
    actualDaysToPayment: number,
    wasPaid: boolean
): Promise<void> {
    try {
        // Store training data for model retraining
        await db.collection('ml_training_data').add({
            invoiceId,
            actualDaysToPayment,
            wasPaid,
            recordedAt: Timestamp.now(),
            // Features will be extracted during batch retraining
        });

        logInfo('Recorded payment outcome for ML training', {
            invoiceId,
            actualDays: actualDaysToPayment,
            wasPaid,
        });
    } catch (error) {
        logError('Failed to record payment outcome', error);
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getInvoiceStats, getCollectionsStats } from '@/services/analyticsService';
import { db, COLLECTIONS } from '@/lib/firebase';
import { errors, handleApiError, UnauthorizedError, RateLimitError } from '@/utils/error';
import { checkUserRateLimit, ratelimit } from '@/lib/ratelimit';
import { logApiRequest, logApiResponse } from '@/utils/logger';
import { differenceInDays, subMonths } from 'date-fns';
import type { Invoice } from '@/types/models';

export const dynamic = 'force-dynamic';

/**
 * Get revenue and payment predictions
 * GET /api/dashboard/predictions
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        // 1. Authenticate
        const { userId } = await auth();
        if (!userId) {
            throw new UnauthorizedError();
        }

        logApiRequest('GET', '/api/dashboard/predictions', userId);

        // 2. Rate limit check
        const rateLimitResult = checkUserRateLimit(userId, { windowMs: 60000, maxRequests: 10 }); // 10 requests per minute
        const { allowed, remaining } = rateLimitResult;
        if (!allowed) {
            throw new RateLimitError();
        }

        // 3. Get historical invoices
        const sixMonthsAgo = subMonths(new Date(), 6);
        const invoicesSnapshot = await db
            .collection(COLLECTIONS.INVOICES)
            .where('freelancerId', '==', userId)
            .where('createdAt', '>=', sixMonthsAgo)
            .get();

        const invoices = invoicesSnapshot.docs.map((doc) => doc.data() as Invoice);

        // 4. Calculate predictions
        const predictions = [];
        const now = new Date();

        // Monthly Revenue Prediction
        const monthlyRevenues = calculateMonthlyRevenues(invoices);
        if (monthlyRevenues.length >= 3) {
            const avgMonthlyRevenue = monthlyRevenues.reduce((a, b) => a + b, 0) / monthlyRevenues.length;
            const trend = calculateTrend(monthlyRevenues);
            const predictedNextMonth = avgMonthlyRevenue * (1 + trend);

            predictions.push({
                type: 'revenue',
                title: 'Next Month Revenue Forecast',
                prediction: `£${predictedNextMonth.toFixed(2)}`,
                description: `Based on ${monthlyRevenues.length} months of data, predicting ${trend > 0 ? 'growth' : 'decline'} of ${Math.abs(trend * 100).toFixed(1)}%.`,
                confidence: calculateConfidence(monthlyRevenues),
                metrics: {
                    historical: avgMonthlyRevenue,
                    predicted: predictedNextMonth,
                    trend: trend * 100,
                },
            });
        }

        // Payment Timing Prediction
        const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.paidAt && inv.invoiceDate);
        if (paidInvoices.length >= 5) {
            const paymentDays = paidInvoices.map((inv) => {
                const paidDate = inv.paidAt! instanceof Date ? inv.paidAt! : inv.paidAt!.toDate();
                const invoiceDate = inv.invoiceDate instanceof Date ? inv.invoiceDate : inv.invoiceDate.toDate();
                return differenceInDays(paidDate, invoiceDate);
            });
            const avgPaymentDays = paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length;

            predictions.push({
                type: 'payment_timing',
                title: 'Average Payment Time',
                prediction: `${Math.round(avgPaymentDays)} days`,
                description: `Your clients typically pay within ${Math.round(avgPaymentDays)} days of invoice being sent.`,
                confidence: Math.min(0.9, paidInvoices.length / 20),
                metrics: {
                    averageDays: Math.round(avgPaymentDays),
                    fastestPayment: Math.min(...paymentDays),
                    slowestPayment: Math.max(...paymentDays),
                },
            });
        }

        // Outstanding Amount Prediction
        const outstandingInvoices = invoices.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled');
        if (outstandingInvoices.length > 0) {
            const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            const overdueCount = outstandingInvoices.filter(
                (inv) => inv.dueDate && (inv.dueDate instanceof Date ? inv.dueDate : inv.dueDate.toDate()) < now
            ).length;

            const expectedRecovery = totalOutstanding * (paidInvoices.length / Math.max(1, invoices.length));

            predictions.push({
                type: 'recovery',
                title: 'Expected Payment Recovery',
                prediction: `£${expectedRecovery.toFixed(2)}`,
                description: `Of £${totalOutstanding.toFixed(2)} outstanding, expecting to recover ${((expectedRecovery / totalOutstanding) * 100).toFixed(0)}% based on historical patterns.`,
                confidence: 0.7,
                metrics: {
                    totalOutstanding,
                    expectedRecovery,
                    overdueCount,
                    recoveryRate: (paidInvoices.length / Math.max(1, invoices.length)) * 100,
                },
            });
        }

        // Collections Success Prediction
        const collectionsInvoices = invoices.filter((inv) => inv.collectionsEnabled);
        const successfulCollections = collectionsInvoices.filter((inv) => inv.status === 'paid');

        if (collectionsInvoices.length >= 3) {
            const successRate = (successfulCollections.length / collectionsInvoices.length) * 100;
            const eligibleForCollections = outstandingInvoices.filter(
                (inv) => !inv.collectionsEnabled && inv.dueDate && differenceInDays(now, (inv.dueDate instanceof Date ? inv.dueDate : inv.dueDate.toDate())) >= 7
            );

            if (eligibleForCollections.length > 0) {
                const potentialRecovery = eligibleForCollections.reduce((sum, inv) => sum + inv.amount, 0);
                const predictedRecovery = potentialRecovery * (successRate / 100);

                predictions.push({
                    type: 'collections',
                    title: 'Collections Potential',
                    prediction: `£${predictedRecovery.toFixed(2)}`,
                    description: `${eligibleForCollections.length} invoice${eligibleForCollections.length > 1 ? 's' : ''} eligible for collections. Historical success rate: ${successRate.toFixed(0)}%.`,
                    confidence: Math.min(0.85, collectionsInvoices.length / 10),
                    metrics: {
                        eligibleCount: eligibleForCollections.length,
                        potentialAmount: potentialRecovery,
                        predictedRecovery,
                        successRate,
                    },
                });
            }
        }

        // Client Value Prediction
        const clientPaymentHistory = analyzeClientPatterns(invoices);
        if (clientPaymentHistory.bestClients.length > 0) {
            const topClient = clientPaymentHistory.bestClients[0];
            predictions.push({
                type: 'client_value',
                title: 'Top Client Insight',
                prediction: `${topClient.name}`,
                description: `Your best client with ${topClient.invoices} invoices (£${topClient.totalPaid.toFixed(2)} paid). Average payment: ${topClient.avgDays} days.`,
                confidence: 0.95,
                metrics: topClient,
            });
        }

        // Cashflow Prediction
        const upcomingInvoices = invoices.filter(
            (inv) =>
                inv.status === 'sent' &&
                inv.dueDate &&
                (inv.dueDate instanceof Date ? inv.dueDate : inv.dueDate.toDate()) > now &&
                differenceInDays((inv.dueDate instanceof Date ? inv.dueDate : inv.dueDate.toDate()), now) <= 30
        );

        if (upcomingInvoices.length > 0) {
            const expectedIncoming = upcomingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            predictions.push({
                type: 'cashflow',
                title: 'Next 30 Days Cashflow',
                prediction: `£${expectedIncoming.toFixed(2)}`,
                description: `${upcomingInvoices.length} invoice${upcomingInvoices.length > 1 ? 's' : ''} expected within 30 days.`,
                confidence: 0.75,
                metrics: {
                    count: upcomingInvoices.length,
                    totalAmount: expectedIncoming,
                    averageAmount: expectedIncoming / upcomingInvoices.length,
                },
            });
        }

        // Log response
        const duration = Date.now() - startTime;
        logApiResponse('GET', '/api/dashboard/predictions', 200, { duration, userId });

        return NextResponse.json({
            predictions,
            total: predictions.length,
            generatedAt: now.toISOString(),
            remainingRequests: remaining,
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        logApiResponse('GET', '/api/dashboard/predictions', 500, { duration });
        const { status, body } = await handleApiError(error);
        return NextResponse.json(body, { status });
    }
}

// ============ HELPER FUNCTIONS ============

function calculateMonthlyRevenues(invoices: Invoice[]): number[] {
    const monthlyMap = new Map<string, number>();

    invoices
        .filter((inv) => inv.status === 'paid' && inv.paidAt)
        .forEach((inv) => {
            const date = inv.paidAt! instanceof Date ? inv.paidAt! : inv.paidAt!.toDate();
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + inv.amount);
        });

    return Array.from(monthlyMap.values());
}

function calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const recent = values.slice(-3);
    const older = values.slice(0, -3);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return (recentAvg - olderAvg) / olderAvg;
}

function calculateConfidence(values: number[]): number {
    if (values.length < 3) return 0.3;
    if (values.length < 6) return 0.6;
    if (values.length < 12) return 0.8;
    return 0.9;
}

function analyzeClientPatterns(invoices: Invoice[]) {
    const clientMap = new Map<string, {
        name: string;
        invoices: number;
        totalPaid: number;
        avgDays: number;
        paymentDays: number[];
    }>();

    invoices.forEach((inv) => {
        if (!clientMap.has(inv.clientEmail)) {
            clientMap.set(inv.clientEmail, {
                name: inv.clientName,
                invoices: 0,
                totalPaid: 0,
                avgDays: 0,
                paymentDays: [],
            });
        }

        const client = clientMap.get(inv.clientEmail)!;
        client.invoices++;

        if (inv.status === 'paid' && inv.paidAt && inv.invoiceDate) {
            client.totalPaid += inv.amount;
            const paidDate = inv.paidAt instanceof Date ? inv.paidAt : inv.paidAt.toDate();
            const invoiceDate = inv.invoiceDate instanceof Date ? inv.invoiceDate : inv.invoiceDate.toDate();
            const days = differenceInDays(paidDate, invoiceDate);
            client.paymentDays.push(days);
        }
    });

    // Calculate averages and sort
    const clientData = Array.from(clientMap.values()).map((client) => ({
        ...client,
        avgDays: client.paymentDays.length > 0
            ? Math.round(client.paymentDays.reduce((a, b) => a + b, 0) / client.paymentDays.length)
            : 0,
    }));

    return {
        bestClients: clientData
            .filter((c) => c.totalPaid > 0)
            .sort((a, b) => b.totalPaid - a.totalPaid)
            .slice(0, 5),
        slowestPayers: clientData
            .filter((c) => c.avgDays > 0)
            .sort((a, b) => b.avgDays - a.avgDays)
            .slice(0, 5),
    };
}

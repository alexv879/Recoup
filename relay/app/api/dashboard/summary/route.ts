import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
    getInvoiceStats,
    getCollectionsStats,
    getRecentActivity,
} from '@/services/analyticsService';
import { calculateUserStats } from '@/services/gamificationService';
import { db, COLLECTIONS } from '@/lib/firebase';
import { errors, handleApiError } from '@/utils/error';
import { checkRateLimit, ratelimit } from '@/lib/ratelimit';
import { logApiRequest, logApiResponse } from '@/utils/logger';
import type { User } from '@/types/models';

export const dynamic = 'force-dynamic';

/**
 * Get dashboard summary
 * GET /api/dashboard/summary
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        // 1. Authenticate
        const { userId } = await auth();
        if (!userId) {
            throw errors.unauthorized();
        }

        logApiRequest('GET', '/api/dashboard/summary', userId);

        // 2. Rate limit check
        const { success, remaining } = await checkRateLimit(userId, ratelimit);
        if (!success) {
            throw errors.rateLimit();
        }

        // 3. Get user data
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        if (!userDoc.exists) {
            throw errors.notFound('User not found');
        }
        const user = userDoc.data() as User;

        // 4. Fetch all stats in parallel
        const [invoiceStats, collectionsStats, recentActivity, gamificationStats] = await Promise.all([
            getInvoiceStats(userId),
            getCollectionsStats(userId),
            getRecentActivity(userId, 10),
            calculateUserStats(userId),
        ]);

        // 5. Calculate financial metrics
        const totalRevenue = invoiceStats.totalPaid || 0;
        const outstandingAmount = invoiceStats.totalOutstanding || 0;
        const collectionsRevenue = collectionsStats.totalRecovered || 0;

        // 6. Calculate this month's metrics
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const invoicesSnapshot = await db
            .collection(COLLECTIONS.INVOICES)
            .where('freelancerId', '==', userId)
            .where('createdAt', '>=', startOfMonth)
            .get();

        const thisMonthInvoices = invoicesSnapshot.docs.length;
        const thisMonthRevenue = invoicesSnapshot.docs
            .map((doc) => doc.data())
            .filter((inv: any) => inv.status === 'paid')
            .reduce((sum: number, inv: any) => sum + inv.amount, 0);

        // 7. Build summary response
        const summary = {
            user: {
                userId: user.userId,
                email: user.email,
                fullName: user.fullName,
                businessName: user.businessName,
                subscriptionTier: user.subscriptionTier,
                collectionsEnabled: user.collectionsEnabled,
            },
            financial: {
                totalRevenue,
                outstandingAmount,
                collectionsRevenue,
                thisMonthRevenue,
                averageInvoiceValue: invoiceStats.avgAmount || 0,
            },
            invoices: {
                total: invoiceStats.total,
                paid: invoiceStats.paid,
                overdue: invoiceStats.overdue,
                draft: invoiceStats.draft || 0,
                thisMonth: thisMonthInvoices,
                averagePaymentDays: Math.round(invoiceStats.avgPaymentDays || 0),
            },
            collections: {
                enabled: collectionsStats.enabled,
                attempts: collectionsStats.attempts,
                successful: collectionsStats.successful,
                quotaRemaining: collectionsStats.quotaRemaining || 0,
                quotaResetDate: collectionsStats.quotaResetDate || null,
            },
            gamification: {
                xp: gamificationStats.xp,
                level: gamificationStats.level,
                streak: gamificationStats.streak,
                badges: gamificationStats.badges,
                nextLevelXP: gamificationStats.nextLevelXP,
                rank: gamificationStats.rank || 0,
            },
            recentActivity,
        };

        // Log response
        const duration = Date.now() - startTime;
        logApiResponse('GET', '/api/dashboard/summary', 200, duration, userId);

        return NextResponse.json({
            summary,
            remainingRequests: remaining,
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        logApiResponse('GET', '/api/dashboard/summary', 500, duration);
        return handleApiError(error);
    }
}

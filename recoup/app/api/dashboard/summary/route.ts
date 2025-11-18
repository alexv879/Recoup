import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
    getInvoiceStats,
    getCollectionsStats,
    getRecentActivity,
} from '@/services/analyticsService';
import { calculateUserStats } from '@/services/gamificationService';
import { db, COLLECTIONS } from '@/lib/firebase';
import { errors, handleApiError, UnauthorizedError, RateLimitError, NotFoundError } from '@/utils/error';
import { checkUserRateLimit, ratelimit } from '@/lib/ratelimit';
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
            throw new UnauthorizedError();
        }

        logApiRequest('GET', '/api/dashboard/summary', userId);

        // 2. Rate limit check
        const rateLimitResult = checkUserRateLimit(userId, { windowMs: 60000, maxRequests: 10 }); // 10 requests per minute
        const { allowed, remaining } = rateLimitResult;
        if (!allowed) {
            throw new RateLimitError();
        }

        // 3. Get user data
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        if (!userDoc.exists) {
            throw new NotFoundError('User not found');
        }
        const user = userDoc.data() as User;

        // 4. Fetch all stats in parallel
        const [invoiceStats, collectionsStats, recentActivity, gamificationStats, allInvoicesQuery] = await Promise.all([
            getInvoiceStats(userId),
            getCollectionsStats(userId),
            getRecentActivity(userId, 10),
            calculateUserStats(userId),
            db.collection(COLLECTIONS.INVOICES).where('freelancerId', '==', userId).get(),
        ]);

        // 5. Calculate financial metrics
        const allInvoices = allInvoicesQuery.docs.map((doc) => doc.data());
        const totalRevenue = allInvoices
            .filter((inv: any) => inv.status === 'paid')
            .reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const outstandingAmount = allInvoices
            .filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const collectionsRevenue = collectionsStats.revenue || 0;

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
                fullName: user.name,
                businessName: user.businessName,
                subscriptionTier: user.subscriptionTier,
                collectionsEnabled: user.collectionsEnabled,
            },
            financial: {
                totalRevenue,
                outstandingAmount,
                collectionsRevenue,
                thisMonthRevenue,
                averageInvoiceValue: invoiceStats.total > 0 ? allInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0) / invoiceStats.total : 0,
            },
            invoices: {
                total: invoiceStats.total,
                paid: invoiceStats.paid,
                overdue: invoiceStats.overdue,
                draft: allInvoices.filter((inv: any) => inv.status === 'draft').length,
                thisMonth: thisMonthInvoices,
                averagePaymentDays: Math.round(invoiceStats.avgPaymentDays || 0),
            },
            collections: {
                attempts: collectionsStats.attempts,
                successRate: collectionsStats.successRate,
                revenue: collectionsStats.revenue,
                outcomes: collectionsStats.outcomes,
            },
            gamification: {
                xp: 0, // Placeholder - need to implement gamification tracking
                level: gamificationStats.level || 1,
                streak: gamificationStats.streak || 0,
                badges: gamificationStats.badges || [],
                nextLevelXP: 0, // Placeholder
                rank: gamificationStats.rank || 0,
            },
            recentActivity,
        };

        // Log response
        const duration = Date.now() - startTime;
        logApiResponse('GET', '/api/dashboard/summary', 200, { duration, userId });

        return NextResponse.json({
            summary,
            remainingRequests: remaining,
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        logApiResponse('GET', '/api/dashboard/summary', 500, { duration });
        const { status, body } = await handleApiError(error);
        return NextResponse.json(body, { status });
    }
}

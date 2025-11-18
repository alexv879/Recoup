/**
 * ADMIN API: Business Analytics
 * GET /api/admin/analytics - Revenue, user growth, collection rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { User, Invoice } from '@/types/models';
import { requireAdmin, requireAdminPermission, createAdminAuditLog, getRequestMetadata } from '@/middleware/adminAuth';
import { formatErrorResponse } from '@/utils/error';
import { logError } from '@/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify admin access
    const admin = await requireAdmin();
    await requireAdminPermission(admin.userId, 'analytics:read');

    // 2. Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, all

    // 3. Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    // 4. Fetch all users
    const usersSnapshot = await db.collection('users').get();
    const allUsers = usersSnapshot.docs.map((doc) => ({
      userId: doc.id,
      ...doc.data(),
    })) as User[];

    // Filter users by date if not 'all'
    const users = timeframe === 'all'
      ? allUsers
      : allUsers.filter((user) => {
          const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          return createdAt >= startDate;
        });

    // 5. Fetch invoices
    let invoicesQuery = db.collection('invoices').orderBy('createdAt', 'desc');
    if (timeframe !== 'all') {
      invoicesQuery = invoicesQuery.where('createdAt', '>=', startDate);
    }

    const invoicesSnapshot = await invoicesQuery.get();
    const invoices = invoicesSnapshot.docs.map((doc) => ({
      invoiceId: doc.id,
      ...doc.data(),
    })) as Invoice[];

    // 6. Calculate user growth metrics
    const totalUsers = allUsers.length;
    const newUsers = users.length;
    const activeUsers = allUsers.filter((u) => u.status === 'active').length;
    const paidUsers = allUsers.filter((u) =>
      u.subscriptionTier !== 'free' && u.subscriptionStatus === 'active'
    ).length;

    // User growth by day
    const userGrowthByDay: Record<string, number> = {};
    users.forEach((user) => {
      const date = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      userGrowthByDay[dateKey] = (userGrowthByDay[dateKey] || 0) + 1;
    });

    // 7. Calculate revenue metrics
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    paidInvoices.forEach((inv) => {
      if (inv.paidAt) {
        const date = inv.paidAt.toDate ? inv.paidAt.toDate() : new Date(inv.paidAt);
        const dateKey = date.toISOString().split('T')[0];
        revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + (inv.amount || 0);
      }
    });

    // 8. Calculate subscription metrics
    const subscriptionRevenue = allUsers.reduce((sum, user) => {
      if (user.subscriptionTier === 'free' || !user.subscriptionStatus || user.subscriptionStatus !== 'active') {
        return sum;
      }

      // Rough monthly subscription value (actual should come from Stripe)
      const tierPricing: Record<string, number> = {
        starter: 19,
        growth: 39,
        pro: 75,
        business: 150,
      };

      const basePrice = tierPricing[user.subscriptionTier] || 0;
      const price = user.isFoundingMember ? basePrice * 0.5 : basePrice;

      return sum + price;
    }, 0);

    const mrr = subscriptionRevenue; // Monthly Recurring Revenue
    const arr = mrr * 12; // Annual Recurring Revenue

    // 9. Calculate collection metrics
    const totalInvoices = invoices.length;
    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue').length;
    const collectionsInvoices = invoices.filter((inv) => inv.status === 'in_collections').length;

    const collectionRate = totalInvoices > 0 ? (paidInvoices.length / totalInvoices) * 100 : 0;
    const overdueRate = totalInvoices > 0 ? (overdueInvoices / totalInvoices) * 100 : 0;

    // Collection attempts
    const collectionAttemptsSnapshot = await db
      .collection('collection_attempts')
      .where('attemptDate', '>=', startDate)
      .get();

    const collectionAttempts = collectionAttemptsSnapshot.docs.map((doc) => doc.data());
    const successfulAttempts = collectionAttempts.filter((a) => a.result === 'success').length;
    const collectionSuccessRate = collectionAttempts.length > 0
      ? (successfulAttempts / collectionAttempts.length) * 100
      : 0;

    // 10. Tier distribution
    const tierDistribution = {
      free: allUsers.filter((u) => u.subscriptionTier === 'free').length,
      starter: allUsers.filter((u) => u.subscriptionTier === 'starter').length,
      growth: allUsers.filter((u) => u.subscriptionTier === 'growth').length,
      pro: allUsers.filter((u) => u.subscriptionTier === 'pro').length,
      business: allUsers.filter((u) => u.subscriptionTier === 'business').length,
    };

    // 11. Churn analysis
    const canceledUsers = allUsers.filter((u) => u.subscriptionStatus === 'canceled').length;
    const churnRate = paidUsers > 0 ? (canceledUsers / (paidUsers + canceledUsers)) * 100 : 0;

    // 12. Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAdminAuditLog('analytics_viewed', {
      adminUserId: admin.userId,
      adminEmail: admin.email,
      targetResource: 'analytics',
      ipAddress,
      userAgent,
    });

    // 13. Return analytics data
    return NextResponse.json({
      success: true,
      data: {
        userMetrics: {
          totalUsers,
          newUsers,
          activeUsers,
          paidUsers,
          churnRate,
          userGrowthByDay,
        },
        revenueMetrics: {
          totalRevenue,
          mrr,
          arr,
          subscriptionRevenue,
          revenueByDay,
        },
        collectionMetrics: {
          totalInvoices,
          paidInvoices: paidInvoices.length,
          overdueInvoices,
          collectionsInvoices,
          collectionRate,
          overdueRate,
          collectionAttempts: collectionAttempts.length,
          collectionSuccessRate,
        },
        subscriptionMetrics: {
          tierDistribution,
          conversionRate: totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0,
        },
      },
    });
  } catch (error) {
    logError('Error fetching analytics', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

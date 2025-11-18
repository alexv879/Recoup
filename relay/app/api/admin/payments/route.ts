/**
 * ADMIN API: Payment Tracking Dashboard
 * GET /api/admin/payments - Real-time payment metrics and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { requireAdmin, requireAdminPermission, createAdminAuditLog, getRequestMetadata } from '@/middleware/adminAuth';
import { formatErrorResponse } from '@/utils/error';
import { logError } from '@/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify admin access
    const admin = await requireAdmin();
    await requireAdminPermission(admin.userId, 'payments:read');

    // 2. Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, all
    const status = searchParams.get('status') || '';

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
        startDate = new Date(0); // Beginning of time
        break;
    }

    // 4. Fetch invoices
    let query = db.collection('invoices').orderBy('createdAt', 'desc');

    if (timeframe !== 'all') {
      query = query.where('createdAt', '>=', startDate);
    }

    const snapshot = await query.get();
    let invoices = snapshot.docs.map((doc) => ({
      invoiceId: doc.id,
      ...doc.data(),
    })) as Invoice[];

    // Filter by status if specified
    if (status) {
      invoices = invoices.filter((inv) => inv.status === status);
    }

    // 5. Calculate payment metrics
    const totalInvoices = invoices.length;
    const totalValue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');
    const collectionsInvoices = invoices.filter((inv) => inv.status === 'in_collections');
    const draftInvoices = invoices.filter((inv) => inv.status === 'draft');
    const sentInvoices = invoices.filter((inv) => inv.status === 'sent');

    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalInCollections = collectionsInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Collection success rate
    const collectionRate = totalInvoices > 0 ? (paidInvoices.length / totalInvoices) * 100 : 0;

    // Average payment time (for paid invoices)
    const avgPaymentTime = paidInvoices.length > 0
      ? paidInvoices.reduce((sum, inv) => {
          if (inv.paidAt && inv.invoiceDate) {
            const paidDate = inv.paidAt.toDate ? inv.paidAt.toDate() : new Date(inv.paidAt);
            const invoiceDate = inv.invoiceDate.toDate ? inv.invoiceDate.toDate() : new Date(inv.invoiceDate);
            return sum + (paidDate.getTime() - invoiceDate.getTime());
          }
          return sum;
        }, 0) / paidInvoices.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // 6. Get recent payment claims
    const claimsSnapshot = await db
      .collection('payment_claims')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const recentClaims = claimsSnapshot.docs.map((doc) => ({
      claimId: doc.id,
      ...doc.data(),
    }));

    const pendingClaims = recentClaims.filter((claim) => claim.status === 'pending_verification').length;
    const verifiedClaims = recentClaims.filter((claim) => claim.status === 'verified').length;

    // 7. Revenue by day (for charts)
    const revenueByDay: Record<string, number> = {};
    paidInvoices.forEach((inv) => {
      if (inv.paidAt) {
        const date = inv.paidAt.toDate ? inv.paidAt.toDate() : new Date(inv.paidAt);
        const dateKey = date.toISOString().split('T')[0];
        revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + (inv.amount || 0);
      }
    });

    // 8. Top users by volume
    const userRevenue: Record<string, { amount: number; count: number; userId: string }> = {};
    invoices.forEach((inv) => {
      if (!userRevenue[inv.freelancerId]) {
        userRevenue[inv.freelancerId] = {
          userId: inv.freelancerId,
          amount: 0,
          count: 0,
        };
      }
      userRevenue[inv.freelancerId].amount += inv.amount || 0;
      userRevenue[inv.freelancerId].count += 1;
    });

    const topUsers = Object.values(userRevenue)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // 9. Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAdminAuditLog('payments_viewed', {
      adminUserId: admin.userId,
      adminEmail: admin.email,
      targetResource: 'payments',
      ipAddress,
      userAgent,
    });

    // 10. Return payment metrics
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalInvoices,
          totalValue,
          totalPaid,
          totalOverdue,
          totalInCollections,
          collectionRate,
          avgPaymentTime: Math.round(avgPaymentTime),
        },
        breakdown: {
          paid: paidInvoices.length,
          overdue: overdueInvoices.length,
          inCollections: collectionsInvoices.length,
          sent: sentInvoices.length,
          draft: draftInvoices.length,
        },
        claims: {
          total: recentClaims.length,
          pending: pendingClaims,
          verified: verifiedClaims,
        },
        revenueByDay,
        topUsers,
        recentInvoices: invoices.slice(0, 10),
      },
    });
  } catch (error) {
    logError('Error fetching payment metrics', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

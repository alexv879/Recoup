/**
 * Send Test Report API Endpoint
 * POST /api/reports/send-test
 *
 * Sends a test report email to verify report generation and delivery
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase-admin';
import { logInfo, logError } from '@/utils/logger';
import { sendEmail } from '@/lib/sendgrid';
import { generateReport } from '@/lib/reports/generator';

export const dynamic = 'force-dynamic';

interface SendTestReportRequest {
  reportType: 'collections' | 'invoices' | 'revenue' | 'performance';
  format?: 'pdf' | 'excel' | 'csv';
  email?: string;
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

    // 2. Get user email from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (!user.primaryEmailAddress) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // 3. Parse request body
    const body: SendTestReportRequest = await req.json();

    if (!body.reportType) {
      return NextResponse.json(
        { error: 'Missing required field: reportType' },
        { status: 400 }
      );
    }

    const recipientEmail = body.email || user.primaryEmailAddress.emailAddress;
    const format = body.format || 'pdf';

    // 4. Generate test report with sample/recent data
    const reportData = await generateTestReportData(userId, body.reportType);

    // 5. Generate report file
    const reportBuffer = await generateReport({
      type: body.reportType,
      format,
      data: reportData,
      userId,
    });

    // 6. Send test report email
    await sendEmail({
      to: recipientEmail,
      subject: `Test ${body.reportType} Report`,
      html: `
        <h2>Test Report - ${body.reportType}</h2>
        <p>This is a test ${body.reportType} report generated at ${new Date().toLocaleString()}.</p>
        <p>The report has been generated successfully in ${format} format.</p>
        <p>In production, this would be attached to the email.</p>
      `,
      fallbackText: `Test ${body.reportType} report generated successfully.`,
    });

    // 7. Log test send
    const activityRef = db.collection('reportActivities').doc();
    await activityRef.set({
      userId,
      activityType: 'test_report_sent',
      reportType: body.reportType,
      format,
      recipient: recipientEmail,
      timestamp: new Date(),
    });

    logInfo('Test report sent successfully', {
      userId,
      reportType: body.reportType,
      recipient: recipientEmail,
    });

    return NextResponse.json({
      success: true,
      message: `Test ${body.reportType} report sent to ${recipientEmail}`,
    });

  } catch (error: any) {
    logError('Failed to send test report', error);

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate test report data
 */
async function generateTestReportData(
  userId: string,
  reportType: string
): Promise<any> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  switch (reportType) {
    case 'collections': {
      // Get recent collection activities
      const activitiesSnapshot = await db
        .collection('collectionActivities')
        .where('userId', '==', userId)
        .where('timestamp', '>=', thirtyDaysAgo)
        .limit(100)
        .get();

      const activities = activitiesSnapshot.docs.map(doc => doc.data());

      return {
        period: { start: thirtyDaysAgo, end: now },
        totalAttempts: activities.length,
        successfulCollections: activities.filter(a => a.outcome === 'paid').length,
        totalCollected: activities.reduce((sum, a) => sum + (a.amountCollected || 0), 0),
        byType: groupBy(activities, 'activityType'),
        recentActivities: activities.slice(0, 10),
      };
    }

    case 'invoices': {
      // Get recent invoices
      const invoicesSnapshot = await db
        .collection('invoices')
        .where('freelancerId', '==', userId)
        .where('createdAt', '>=', thirtyDaysAgo)
        .limit(100)
        .get();

      const invoices = invoicesSnapshot.docs.map(doc => doc.data());

      return {
        period: { start: thirtyDaysAgo, end: now },
        totalInvoices: invoices.length,
        totalValue: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
        overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length,
        byStatus: groupBy(invoices, 'status'),
        recentInvoices: invoices.slice(0, 10),
      };
    }

    case 'revenue': {
      // Get paid invoices
      const revenueSnapshot = await db
        .collection('invoices')
        .where('freelancerId', '==', userId)
        .where('status', '==', 'paid')
        .where('paidAt', '>=', thirtyDaysAgo)
        .get();

      const paidInvoices = revenueSnapshot.docs.map(doc => doc.data());

      return {
        period: { start: thirtyDaysAgo, end: now },
        totalRevenue: paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        invoiceCount: paidInvoices.length,
        averageInvoiceValue: paidInvoices.length > 0
          ? paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0) / paidInvoices.length
          : 0,
        byMonth: groupByMonth(paidInvoices),
      };
    }

    case 'performance': {
      // Get user stats
      const userStatsRef = db.collection('userStats').doc(userId);
      const userStatsDoc = await userStatsRef.get();
      const stats = userStatsDoc.data() || {};

      return {
        period: { start: thirtyDaysAgo, end: now },
        totalInvoiced: stats.totalInvoiced || 0,
        totalCollected: stats.totalCollected || 0,
        onTimePercentage: stats.onTimePercentage || 0,
        averagePaymentDays: stats.averagePaymentDays || 0,
        collectionAttempts: stats.collectionAttempts || 0,
        collectionSuccess: stats.collectionSuccess || 0,
      };
    }

    default:
      return {
        period: { start: thirtyDaysAgo, end: now },
        message: 'Sample test data',
      };
  }
}

// Helper to group array by field
function groupBy(array: any[], field: string): Record<string, number> {
  return array.reduce((acc, item) => {
    const key = item[field] || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

// Helper to group by month
function groupByMonth(invoices: any[]): Record<string, number> {
  return invoices.reduce((acc, inv) => {
    const paidDate = inv.paidAt?.toDate?.() || new Date(inv.paidAt);
    const monthKey = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + (inv.amount || 0);
    return acc;
  }, {});
}

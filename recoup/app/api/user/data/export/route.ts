/**
 * GDPR Data Export Endpoint
 * POST /api/user/data/export
 *
 * Implements GDPR Article 15 (Right of Access)
 * Allows users to export all their personal data in a structured,
 * commonly used, and machine-readable format.
 *
 * Export includes:
 * - User profile data
 * - Invoices and transactions
 * - Client information
 * - Collection attempts
 * - Notifications
 * - Payment plans
 * - Consent records
 * - Analytics data
 * - SMS and voice call records
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase';
import { logApiRequest, logApiResponse, logInfo, logError } from '@/utils/logger';
import { errors, handleApiError, UnauthorizedError } from '@/utils/error';

export const dynamic = 'force-dynamic';

/**
 * Request data export
 * POST /api/user/data/export
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logApiRequest('POST', '/api/user/data/export', userId);

    // 2. Check if export already in progress
    const existingExport = await db
      .collection('data_exports')
      .where('userId', '==', userId)
      .where('status', '==', 'processing')
      .limit(1)
      .get();

    if (!existingExport.empty) {
      return NextResponse.json(
        {
          success: false,
          error: 'A data export is already in progress. Please wait for it to complete.',
          exportId: existingExport.docs[0].id
        },
        { status: 409 }
      );
    }

    logInfo('Starting GDPR data export', { userId });

    // 3. Collect all user data
    const exportData: any = {
      exportDate: new Date().toISOString(),
      userId,
      gdprCompliance: {
        regulation: 'GDPR Article 15 - Right of Access',
        jurisdiction: 'UK/EU',
        dataController: 'Recoup Ltd'
      }
    };

    // 3.1. User profile data
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      exportData.profile = {
        ...userDoc.data(),
        note: 'Personal information you provided during registration and profile updates'
      };
    }

    // 3.2. Invoices
    const invoicesSnapshot = await db
      .collection('invoices')
      .where('freelancerId', '==', userId)
      .get();

    exportData.invoices = {
      count: invoicesSnapshot.size,
      data: invoicesSnapshot.docs.map((doc) => ({
        ...doc.data(),
        invoiceId: doc.id
      })),
      note: 'All invoices created by you'
    };

    // 3.3. Transactions
    const transactionsSnapshot = await db
      .collection('transactions')
      .where('freelancerId', '==', userId)
      .get();

    exportData.transactions = {
      count: transactionsSnapshot.size,
      data: transactionsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        transactionId: doc.id
      })),
      note: 'All financial transactions associated with your account'
    };

    // 3.4. Clients
    const clientsSnapshot = await db
      .collection('clients')
      .where('freelancerId', '==', userId)
      .get();

    exportData.clients = {
      count: clientsSnapshot.size,
      data: clientsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        clientId: doc.id
      })),
      note: 'Client information you have stored'
    };

    // 3.5. Collection attempts (SMS, calls, letters)
    const collectionAttemptsSnapshot = await db
      .collection('collection_attempts')
      .where('freelancerId', '==', userId)
      .get();

    exportData.collectionAttempts = {
      count: collectionAttemptsSnapshot.size,
      data: collectionAttemptsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        attemptId: doc.id
      })),
      note: 'Records of collection attempts made on your behalf'
    };

    // 3.6. Notifications
    const notificationsSnapshot = await db
      .collection('notifications')
      .where('userId', '==', userId)
      .get();

    exportData.notifications = {
      count: notificationsSnapshot.size,
      data: notificationsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        notificationId: doc.id
      })),
      note: 'System notifications sent to you'
    };

    // 3.7. Payment plans
    const paymentPlansSnapshot = await db
      .collection('payment_plans')
      .where('freelancerId', '==', userId)
      .get();

    exportData.paymentPlans = {
      count: paymentPlansSnapshot.size,
      data: paymentPlansSnapshot.docs.map((doc) => ({
        ...doc.data(),
        planId: doc.id
      })),
      note: 'Payment plans you have created or offered'
    };

    // 3.8. Disputes
    const disputesSnapshot = await db
      .collection('disputes')
      .where('freelancerId', '==', userId)
      .get();

    exportData.disputes = {
      count: disputesSnapshot.size,
      data: disputesSnapshot.docs.map((doc) => ({
        ...doc.data(),
        disputeId: doc.id
      })),
      note: 'Invoice disputes raised by your clients'
    };

    // 3.9. Consent records
    const consentSnapshot = await db
      .collection('user_consents')
      .where('userId', '==', userId)
      .get();

    exportData.consents = {
      count: consentSnapshot.size,
      data: consentSnapshot.docs.map((doc) => ({
        ...doc.data(),
        consentId: doc.id
      })),
      note: 'Records of your consent for data processing activities'
    };

    // 3.10. Analytics events
    const analyticsSnapshot = await db
      .collection('analytics_events')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(1000) // Limit to last 1000 events
      .get();

    exportData.analytics = {
      count: analyticsSnapshot.size,
      data: analyticsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        eventId: doc.id
      })),
      note: 'Analytics events tracked for your account (last 1000 events)'
    };

    // 3.11. Scheduled tasks
    const scheduledTasksSnapshot = await db
      .collection('scheduled_tasks')
      .where('freelancerId', '==', userId)
      .get();

    exportData.scheduledTasks = {
      count: scheduledTasksSnapshot.size,
      data: scheduledTasksSnapshot.docs.map((doc) => ({
        ...doc.data(),
        taskId: doc.id
      })),
      note: 'Scheduled tasks and reminders for your account'
    };

    // 3.12. SMS opt-outs (if applicable)
    const smsOptOutsSnapshot = await db
      .collection('sms_opt_outs')
      .where('userId', '==', userId)
      .get();

    exportData.smsOptOuts = {
      count: smsOptOutsSnapshot.size,
      data: smsOptOutsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        optOutId: doc.id
      })),
      note: 'Records of SMS opt-outs from your clients'
    };

    // 3.13. Subscription information
    const subscriptionSnapshot = await db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    exportData.subscriptions = {
      count: subscriptionSnapshot.size,
      data: subscriptionSnapshot.docs.map((doc) => ({
        ...doc.data(),
        subscriptionId: doc.id
      })),
      note: 'Your subscription and billing information'
    };

    // 4. Calculate total data size
    const exportJson = JSON.stringify(exportData, null, 2);
    const exportSizeKb = Buffer.byteLength(exportJson, 'utf8') / 1024;

    // 5. Save export record
    const exportRecord = await db.collection('data_exports').add({
      userId,
      requestedAt: new Date(),
      status: 'completed',
      exportSizeKb: Math.round(exportSizeKb),
      recordCounts: {
        invoices: exportData.invoices.count,
        transactions: exportData.transactions.count,
        clients: exportData.clients.count,
        collectionAttempts: exportData.collectionAttempts.count,
        notifications: exportData.notifications.count,
        paymentPlans: exportData.paymentPlans.count,
        disputes: exportData.disputes.count,
        consents: exportData.consents.count,
        analytics: exportData.analytics.count,
        scheduledTasks: exportData.scheduledTasks.count,
        smsOptOuts: exportData.smsOptOuts.count,
        subscriptions: exportData.subscriptions.count
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      downloadedAt: null,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent')
    });

    // 6. Log export for compliance
    await db.collection('compliance_audit_log').add({
      eventType: 'gdpr_data_export',
      userId,
      timestamp: new Date(),
      exportId: exportRecord.id,
      recordCounts: exportData,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent')
    });

    logInfo('GDPR data export completed', {
      userId,
      exportId: exportRecord.id,
      sizeKb: Math.round(exportSizeKb),
      totalRecords: Object.values(exportData)
        .filter((v: any) => v && v.count !== undefined)
        .reduce((sum: number, v: any) => sum + v.count, 0)
    });

    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/user/data/export', 200, { duration, userId });

    // 7. Return export data
    return NextResponse.json(
      {
        success: true,
        message: 'Your data has been exported successfully',
        exportId: exportRecord.id,
        exportDate: new Date().toISOString(),
        dataSizeKb: Math.round(exportSizeKb),
        gdprNotice: 'This export contains all personal data we hold about you as per GDPR Article 15. You have the right to rectify inaccurate data and request deletion.',
        data: exportData
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="recoup-data-export-${userId}-${Date.now()}.json"`
        }
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/user/data/export', error.statusCode || 500, { duration });

    logError('GDPR data export failed', error);

    const errorResponse = await handleApiError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

/**
 * Get export history
 * GET /api/user/data/export
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    // Get user's export history (last 10)
    const exportsSnapshot = await db
      .collection('data_exports')
      .where('userId', '==', userId)
      .orderBy('requestedAt', 'desc')
      .limit(10)
      .get();

    const exports = exportsSnapshot.docs.map((doc) => ({
      exportId: doc.id,
      requestedAt: doc.data().requestedAt,
      status: doc.data().status,
      exportSizeKb: doc.data().exportSizeKb,
      expiresAt: doc.data().expiresAt,
      downloadedAt: doc.data().downloadedAt
    }));

    return NextResponse.json({
      success: true,
      exports
    });
  } catch (error) {
    const errorResponse = await handleApiError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

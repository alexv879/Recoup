/**
 * GDPR Data Export API
 *
 * Implements Right of Access (Art. 15 GDPR)
 * Users can request a complete export of their personal data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore } from 'firebase-admin/firestore';
import { logError } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const format = request.nextUrl.searchParams.get('format') || 'json';

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use json or csv' },
        { status: 400 }
      );
    }

    // Export all user data
    const userData = await exportAllUserData(userId);

    if (format === 'json') {
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        userId,
        data: userData,
        notice: 'This export contains all personal data we hold about you as required by GDPR Article 15.',
      });
    }

    // CSV format
    const csv = convertToCSV(userData);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="recoup-data-export-${userId}-${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    logError('Data export error', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    );
  }
}

/**
 * Export all user data from Firestore
 */
async function exportAllUserData(userId: string) {
  const db = getFirestore();

  // 1. User profile
  const userDoc = await db.collection('users').doc(userId).get();
  const userProfile = userDoc.exists ? userDoc.data() : null;

  // 2. Invoices
  const invoicesSnapshot = await db
    .collection('invoices')
    .where('userId', '==', userId)
    .get();
  const invoices = invoicesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // 3. Clients
  const clientsSnapshot = await db
    .collection('clients')
    .where('userId', '==', userId)
    .get();
  const clients = clientsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // 4. Payments
  const paymentsSnapshot = await db
    .collection('payments')
    .where('userId', '==', userId)
    .get();
  const payments = paymentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // 5. VAT Returns
  const vatReturnsSnapshot = await db
    .collection('vat_returns')
    .where('userId', '==', userId)
    .get();
  const vatReturns = vatReturnsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // 6. Recurring Invoices
  const recurringSnapshot = await db
    .collection('recurring_invoices')
    .where('userId', '==', userId)
    .get();
  const recurringInvoices = recurringSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // 7. Email logs (last 90 days)
  const emailLogsSnapshot = await db
    .collection('email_logs')
    .where('userId', '==', userId)
    .orderBy('sentAt', 'desc')
    .limit(1000)
    .get();
  const emailLogs = emailLogsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // 8. SMS logs (last 90 days)
  const smsLogsSnapshot = await db
    .collection('sms_logs')
    .where('userId', '==', userId)
    .orderBy('sentAt', 'desc')
    .limit(1000)
    .get();
  const smsLogs = smsLogsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // 9. Audit logs
  const auditLogsSnapshot = await db
    .collection('audit_logs')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(1000)
    .get();
  const auditLogs = auditLogsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return {
    profile: userProfile,
    invoices: {
      count: invoices.length,
      data: invoices,
    },
    clients: {
      count: clients.length,
      data: clients,
    },
    payments: {
      count: payments.length,
      data: payments,
    },
    vatReturns: {
      count: vatReturns.length,
      data: vatReturns,
    },
    recurringInvoices: {
      count: recurringInvoices.length,
      data: recurringInvoices,
    },
    emailLogs: {
      count: emailLogs.length,
      data: emailLogs,
      notice: 'Last 90 days only (GDPR retention period)',
    },
    smsLogs: {
      count: smsLogs.length,
      data: smsLogs,
      notice: 'Last 90 days only (GDPR retention period)',
    },
    auditLogs: {
      count: auditLogs.length,
      data: auditLogs,
      notice: 'Last 1000 entries only',
    },
  };
}

/**
 * Convert user data to CSV format
 */
function convertToCSV(userData: any): string {
  const sections = [];

  // User Profile
  if (userData.profile) {
    sections.push('=== USER PROFILE ===');
    sections.push(Object.entries(userData.profile)
      .map(([key, value]) => `${key},${JSON.stringify(value)}`)
      .join('\n'));
    sections.push('');
  }

  // Invoices
  if (userData.invoices.count > 0) {
    sections.push('=== INVOICES ===');
    sections.push('Invoice Number,Client,Date,Amount,Status');
    sections.push(userData.invoices.data
      .map((inv: any) => `${inv.invoiceNumber},${inv.clientName},${inv.invoiceDate},${inv.total},${inv.status}`)
      .join('\n'));
    sections.push('');
  }

  // Clients
  if (userData.clients.count > 0) {
    sections.push('=== CLIENTS ===');
    sections.push('Name,Email,Company,Created');
    sections.push(userData.clients.data
      .map((client: any) => `${client.name},${client.email},${client.companyName || ''},${client.createdAt}`)
      .join('\n'));
    sections.push('');
  }

  // Add other sections as needed...

  return sections.join('\n');
}

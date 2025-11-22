/**
 * GDPR Data Export API
 * GET /api/gdpr/export
 *
 * Exports all user data in compliance with GDPR Article 20 (Right to data portability)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';

/**
 * Export all user data as JSON
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data from different collections
    const [
      userDoc,
      invoices,
      expenses,
      clients,
      transactions,
      notifications,
      mtdAuthorizations,
      mtdSubmissions,
    ] = await Promise.all([
      db.collection(COLLECTIONS.USERS).doc(userId).get(),
      db.collection(COLLECTIONS.INVOICES).where('freelancerId', '==', userId).get(),
      db.collection(COLLECTIONS.EXPENSES).where('userId', '==', userId).get(),
      db.collection(COLLECTIONS.CLIENTS).where('ownerId', '==', userId).get(),
      db.collection(COLLECTIONS.TRANSACTIONS).where('freelancerId', '==', userId).get(),
      db.collection(COLLECTIONS.NOTIFICATIONS).where('userId', '==', userId).get(),
      db.collection(COLLECTIONS.MTD_AUTHORIZATIONS).where('userId', '==', userId).get(),
      db.collection(COLLECTIONS.MTD_SUBMISSIONS).where('userId', '==', userId).get(),
    ]);

    // Build export object
    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      user: userDoc.exists ? userDoc.data() : null,
      invoices: invoices.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      expenses: expenses.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      clients: clients.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      transactions: transactions.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      notifications: notifications.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      mtdAuthorizations: mtdAuthorizations.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Remove encrypted tokens from export
        accessToken: '[ENCRYPTED]',
        refreshToken: '[ENCRYPTED]',
      })),
      mtdSubmissions: mtdSubmissions.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    };

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="recoup-data-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    console.error('GDPR export failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    );
  }
}

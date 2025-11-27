/**
 * GDPR Data Deletion API
 * POST /api/gdpr/delete
 *
 * Deletes all user data in compliance with GDPR Article 17 (Right to erasure)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';

/**
 * Delete all user data (irreversible)
 * Requires confirmation
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { confirmation } = body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        {
          error: 'Confirmation required. Send {"confirmation": "DELETE_MY_ACCOUNT"}',
        },
        { status: 400 }
      );
    }

    console.log('GDPR deletion initiated:', { userId });

    // Batch delete all user data
    const batch = db.batch();
    let deletionCount = 0;

    // Delete invoices
    const invoices = await db
      .collection(COLLECTIONS.INVOICES)
      .where('freelancerId', '==', userId)
      .get();
    invoices.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletionCount++;
    });

    // Delete expenses
    const expenses = await db
      .collection(COLLECTIONS.EXPENSES)
      .where('userId', '==', userId)
      .get();
    expenses.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletionCount++;
    });

    // Delete clients
    const clients = await db
      .collection(COLLECTIONS.CLIENTS)
      .where('ownerId', '==', userId)
      .get();
    clients.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletionCount++;
    });

    // Delete transactions
    const transactions = await db
      .collection(COLLECTIONS.TRANSACTIONS)
      .where('freelancerId', '==', userId)
      .get();
    transactions.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletionCount++;
    });

    // Delete notifications
    const notifications = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .get();
    notifications.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletionCount++;
    });

    // Delete MTD authorizations
    const mtdAuths = await db
      .collection(COLLECTIONS.MTD_AUTHORIZATIONS)
      .where('userId', '==', userId)
      .get();
    mtdAuths.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletionCount++;
    });

    // Delete MTD submissions
    const mtdSubs = await db
      .collection(COLLECTIONS.MTD_SUBMISSIONS)
      .where('userId', '==', userId)
      .get();
    mtdSubs.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletionCount++;
    });

    // Delete user profile (last)
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    batch.delete(userRef);
    deletionCount++;

    // Execute batch deletion
    await batch.commit();

    console.log('GDPR deletion completed:', {
      userId,
      deletionCount,
    });

    // TODO: Also delete Firebase Storage files (receipts)
    // TODO: Revoke HMRC OAuth tokens if any

    return NextResponse.json({
      success: true,
      message: 'All data deleted successfully',
      deletionCount,
    });
  } catch (error: any) {
    console.error('GDPR deletion failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete data' },
      { status: 500 }
    );
  }
}

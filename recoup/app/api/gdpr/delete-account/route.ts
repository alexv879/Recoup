/**
 * GDPR Account Deletion API
 *
 * Implements Right to Erasure (Art. 17 GDPR)
 * Users can request deletion of their account and personal data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { confirmEmail, reason } = body;

    // Get user profile to verify email
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;

    // Verify email confirmation (extra security)
    if (confirmEmail !== userData.email) {
      return NextResponse.json(
        { error: 'Email confirmation does not match. Please enter your email address to confirm deletion.' },
        { status: 400 }
      );
    }

    // Check if user has financial records that must be retained
    const hasFinancialRecords = await checkFinancialRecords(userId);

    if (hasFinancialRecords) {
      // Soft delete (anonymization) - keep records for legal compliance
      await anonymizeUserData(userId, reason);

      return NextResponse.json({
        success: true,
        type: 'soft_delete',
        message: 'Your account has been anonymized. Financial records are retained for 6 years as required by UK law (HMRC). All personal data has been removed.',
        retentionPeriod: '6 years',
        hardDeleteDate: calculateHardDeleteDate(),
      });
    } else {
      // Hard delete - complete removal (user has no financial history)
      await hardDeleteUserData(userId);

      return NextResponse.json({
        success: true,
        type: 'hard_delete',
        message: 'Your account and all personal data have been permanently deleted.',
      });
    }
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has financial records that must be retained
 */
async function checkFinancialRecords(userId: string): Promise<boolean> {
  const db = getFirestore();

  // Check for invoices
  const invoicesSnapshot = await db
    .collection('invoices')
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (!invoicesSnapshot.empty) {
    return true;
  }

  // Check for VAT returns
  const vatSnapshot = await db
    .collection('vat_returns')
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (!vatSnapshot.empty) {
    return true;
  }

  // Check for payments
  const paymentsSnapshot = await db
    .collection('payments')
    .where('userId', '==', userId)
    .limit(1)
    .get();

  return !paymentsSnapshot.empty;
}

/**
 * Anonymize user data (soft delete)
 * Keeps financial records but removes personal identifiers
 */
async function anonymizeUserData(userId: string, reason?: string): Promise<void> {
  const db = getFirestore();
  const anonymousId = `deleted_${generateRandomId()}`;

  // Update user profile
  await db.collection('users').doc(userId).update({
    // Anonymize personal data
    name: `[Deleted User ${anonymousId}]`,
    email: `${anonymousId}@deleted.recoup.com`,
    phoneNumber: '[Deleted]',
    address: {
      street: '[Deleted]',
      city: '[Deleted]',
      postcode: '[Deleted]',
      country: 'UK',
    },
    companyName: '[Deleted]',

    // Remove sensitive data
    bankDetails: FieldValue.delete(),
    stripeCustomerId: FieldValue.delete(),

    // Mark as deleted
    deleted: true,
    deletedAt: new Date().toISOString(),
    deletionReason: reason || 'User requested account deletion',
    anonymizedId: anonymousId,

    // Keep minimal data for legal compliance
    // VAT number, invoices, payments retained as required by law
  });

  // Anonymize clients
  const clientsSnapshot = await db
    .collection('clients')
    .where('userId', '==', userId)
    .get();

  const batch = db.batch();
  clientsSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      email: `client_${anonymousId}@deleted.recoup.com`,
      phoneNumber: '[Deleted]',
    });
  });
  await batch.commit();

  // Delete non-essential data
  await deleteNonEssentialData(userId);

  // Log deletion for audit trail
  await db.collection('audit_logs').add({
    userId,
    action: 'account_deleted',
    type: 'soft_delete',
    timestamp: new Date().toISOString(),
    anonymousId,
    reason: reason || 'User requested',
  });
}

/**
 * Hard delete user data (complete removal)
 */
async function hardDeleteUserData(userId: string): Promise<void> {
  const db = getFirestore();

  // Delete user profile
  await db.collection('users').doc(userId).delete();

  // Delete all user data
  const collections = [
    'clients',
    'invoices',
    'payments',
    'recurring_invoices',
    'vat_returns',
    'email_logs',
    'sms_logs',
    'hmrc_tokens',
  ];

  for (const collectionName of collections) {
    const snapshot = await db
      .collection(collectionName)
      .where('userId', '==', userId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  // Log deletion for audit trail (then delete after 30 days)
  await db.collection('audit_logs').add({
    userId,
    action: 'account_deleted',
    type: 'hard_delete',
    timestamp: new Date().toISOString(),
    deleteAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  });
}

/**
 * Delete non-essential data (email logs, SMS logs, etc.)
 */
async function deleteNonEssentialData(userId: string): Promise<void> {
  const db = getFirestore();

  const nonEssentialCollections = [
    'email_logs',
    'sms_logs',
    'hmrc_tokens',
    'recurring_invoices', // Can be deleted as user won't use them anymore
  ];

  for (const collectionName of nonEssentialCollections) {
    const snapshot = await db
      .collection(collectionName)
      .where('userId', '==', userId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

/**
 * Calculate hard delete date (6 years from now)
 */
function calculateHardDeleteDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 6);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Generate random ID for anonymization
 */
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

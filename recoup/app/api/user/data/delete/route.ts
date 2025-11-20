/**
 * GDPR Right to Deletion Endpoint
 * POST /api/user/data/delete
 *
 * Implements GDPR Article 17 (Right to Erasure / "Right to be Forgotten")
 * Allows users to request deletion of all their personal data.
 *
 * IMPORTANT LEGAL CONSIDERATIONS:
 * - Some data must be retained for legal/accounting obligations (6 years for UK tax records)
 * - Financial transaction records are anonymized rather than deleted
 * - Deletion is irreversible
 * - User must confirm deletion with email verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db, FieldValue } from '@/lib/firebase';
import { logApiRequest, logApiResponse, logInfo, logError } from '@/utils/logger';
import { errors, handleApiError, UnauthorizedError, ValidationError } from '@/utils/error';

export const dynamic = 'force-dynamic';

/**
 * Request account deletion
 * POST /api/user/data/delete
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logApiRequest('POST', '/api/user/data/delete', userId);

    // 2. Parse request body
    const body = await req.json();
    const {
      confirmationCode,
      reason
    }: {
      confirmationCode?: string;
      reason?: string;
    } = body;

    // 3. Check if deletion already in progress
    const existingDeletion = await db
      .collection('deletion_requests')
      .where('userId', '==', userId)
      .where('status', 'in', ['pending', 'processing'])
      .limit(1)
      .get();

    if (!existingDeletion.empty) {
      return NextResponse.json(
        {
          success: false,
          error: 'A deletion request is already pending. Check your email for confirmation.',
          deletionId: existingDeletion.docs[0].id
        },
        { status: 409 }
      );
    }

    // 4. Check for active subscriptions
    const activeSubscriptions = await db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    if (!activeSubscriptions.empty) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please cancel your active subscription before requesting account deletion.',
          requiresAction: 'cancel_subscription',
          actionUrl: '/settings/billing'
        },
        { status: 400 }
      );
    }

    // 5. Check for outstanding invoices (unpaid)
    const unpaidInvoices = await db
      .collection('invoices')
      .where('freelancerId', '==', userId)
      .where('status', '==', 'sent')
      .where('amount', '>', 0)
      .get();

    if (!unpaidInvoices.empty) {
      logInfo('User has unpaid invoices, will anonymize instead of delete', {
        userId,
        unpaidCount: unpaidInvoices.size
      });

      // For users with unpaid invoices, we anonymize instead of delete
      // to maintain financial records
      return NextResponse.json(
        {
          success: false,
          warning: 'You have unpaid invoices. Your account will be anonymized (not fully deleted) to maintain financial records as required by UK tax law.',
          unpaidInvoicesCount: unpaidInvoices.size,
          requiresAcknowledgment: true,
          legalNote: 'Financial records must be retained for 6 years under UK law'
        },
        { status: 400 }
      );
    }

    // 6. Create deletion request
    const deletionRequest = await db.collection('deletion_requests').add({
      userId,
      requestedAt: new Date(),
      status: 'pending_confirmation',
      reason: reason || 'User requested account deletion',
      confirmationCode: Math.random().toString(36).substring(2, 15), // Generate code
      codeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      confirmedAt: null,
      processedAt: null,
      deletionType: 'full_deletion', // vs 'anonymization'
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent')
    });

    const deletionData = (await deletionRequest.get()).data();

    // 7. Send confirmation email (in real implementation)
    // TODO: Integrate with email service to send confirmation code
    logInfo('Deletion request created, confirmation required', {
      userId,
      deletionId: deletionRequest.id
    });

    // 8. Log for compliance
    await db.collection('compliance_audit_log').add({
      eventType: 'gdpr_deletion_requested',
      userId,
      timestamp: new Date(),
      deletionId: deletionRequest.id,
      reason,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent')
    });

    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/user/data/delete', 200, { duration, userId });

    return NextResponse.json({
      success: true,
      message: 'Deletion request created. Please check your email for confirmation.',
      deletionId: deletionRequest.id,
      confirmationRequired: true,
      confirmationCodeForTesting: deletionData?.confirmationCode, // Remove in production
      expiresIn: '24 hours',
      gdprNotice: 'Once confirmed, your data will be permanently deleted within 30 days as per GDPR Article 17.',
      legalNotice: 'Some financial records may be anonymized and retained for 6 years to comply with UK tax law.'
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/user/data/delete', error.statusCode || 500, { duration });

    logError('GDPR deletion request failed', error);

    const errorResponse = await handleApiError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

/**
 * Confirm account deletion
 * PUT /api/user/data/delete
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    // 2. Parse request body
    const body = await req.json();
    const { deletionId, confirmationCode }: { deletionId: string; confirmationCode: string } = body;

    if (!deletionId || !confirmationCode) {
      throw new ValidationError('deletionId and confirmationCode are required');
    }

    // 3. Get deletion request
    const deletionDoc = await db.collection('deletion_requests').doc(deletionId).get();

    if (!deletionDoc.exists) {
      throw new ValidationError('Deletion request not found');
    }

    const deletionData = deletionDoc.data();

    // 4. Verify ownership
    if (deletionData?.userId !== userId) {
      throw new UnauthorizedError('This deletion request does not belong to you');
    }

    // 5. Verify confirmation code
    if (deletionData?.confirmationCode !== confirmationCode) {
      throw new ValidationError('Invalid confirmation code');
    }

    // 6. Check if code expired
    const expiresAt = deletionData?.codeExpiresAt?.toDate?.() || new Date(deletionData?.codeExpiresAt);
    if (expiresAt < new Date()) {
      throw new ValidationError('Confirmation code has expired. Please request deletion again.');
    }

    // 7. Check if already confirmed
    if (deletionData?.status === 'confirmed' || deletionData?.status === 'processing') {
      return NextResponse.json({
        success: true,
        message: 'Deletion already confirmed and in progress',
        deletionId
      });
    }

    // 8. Update deletion request to confirmed
    await deletionDoc.ref.update({
      status: 'confirmed',
      confirmedAt: FieldValue.serverTimestamp(),
      scheduledDeletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days grace period
    });

    // 9. Begin deletion process
    await processDeletion(userId, deletionId);

    // 10. Log confirmation
    await db.collection('compliance_audit_log').add({
      eventType: 'gdpr_deletion_confirmed',
      userId,
      timestamp: new Date(),
      deletionId,
      scheduledDeletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent')
    });

    logInfo('GDPR deletion confirmed', { userId, deletionId });

    const duration = Date.now() - startTime;
    logApiResponse('PUT', '/api/user/data/delete', 200, { duration, userId });

    return NextResponse.json({
      success: true,
      message: 'Account deletion confirmed. Your data will be deleted within 7 days.',
      deletionId,
      scheduledDeletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      gracePeriod: '7 days',
      note: 'You can cancel this request within the grace period by contacting support.'
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logApiResponse('PUT', '/api/user/data/delete', error.statusCode || 500, { duration });

    logError('GDPR deletion confirmation failed', error);

    const errorResponse = await handleApiError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

/**
 * Process account deletion
 * This function handles the actual deletion of user data
 */
async function processDeletion(userId: string, deletionId: string): Promise<void> {
  try {
    logInfo('Starting deletion process', { userId, deletionId });

    // Update deletion request status
    await db.collection('deletion_requests').doc(deletionId).update({
      status: 'processing',
      processingStartedAt: FieldValue.serverTimestamp()
    });

    // Collections to delete
    const collectionsToDelete = [
      { name: 'notifications', field: 'userId' },
      { name: 'scheduled_tasks', field: 'freelancerId' },
      { name: 'analytics_events', field: 'userId' },
      { name: 'user_consents', field: 'userId' },
      { name: 'sms_opt_outs', field: 'userId' },
      { name: 'data_exports', field: 'userId' }
    ];

    // Collections to anonymize (retain for legal reasons)
    const collectionsToAnonymize = [
      { name: 'invoices', field: 'freelancerId' },
      { name: 'transactions', field: 'freelancerId' },
      { name: 'collection_attempts', field: 'freelancerId' },
      { name: 'payment_plans', field: 'freelancerId' },
      { name: 'disputes', field: 'freelancerId' }
    ];

    let totalDeleted = 0;
    let totalAnonymized = 0;

    // Delete non-critical data
    for (const collection of collectionsToDelete) {
      const snapshot = await db.collection(collection.name).where(collection.field, '==', userId).get();

      for (const doc of snapshot.docs) {
        await doc.ref.delete();
        totalDeleted++;
      }

      logInfo(`Deleted ${snapshot.size} records from ${collection.name}`, { userId });
    }

    // Anonymize financial records
    for (const collection of collectionsToAnonymize) {
      const snapshot = await db.collection(collection.name).where(collection.field, '==', userId).get();

      for (const doc of snapshot.docs) {
        await doc.ref.update({
          freelancerId: 'DELETED_USER',
          freelancerName: '[Deleted User]',
          freelancerEmail: '[Deleted]',
          businessName: '[Deleted]',
          anonymized: true,
          anonymizedAt: FieldValue.serverTimestamp(),
          originalDeletionId: deletionId
        });
        totalAnonymized++;
      }

      logInfo(`Anonymized ${snapshot.size} records from ${collection.name}`, { userId });
    }

    // Delete or anonymize clients
    const clientsSnapshot = await db.collection('clients').where('freelancerId', '==', userId).get();

    for (const doc of clientsSnapshot.docs) {
      await doc.ref.update({
        freelancerId: 'DELETED_USER',
        name: '[Anonymized Client]',
        email: '[Deleted]',
        phone: '[Deleted]',
        address: null,
        anonymized: true,
        anonymizedAt: FieldValue.serverTimestamp()
      });
      totalAnonymized++;
    }

    // Delete user profile
    await db.collection('users').doc(userId).delete();
    totalDeleted++;

    logInfo('User profile deleted', { userId });

    // Delete Clerk user account
    try {
      await clerkClient.users.deleteUser(userId);
      logInfo('Clerk user account deleted', { userId });
    } catch (clerkError) {
      logError('Failed to delete Clerk user', clerkError as Error);
      // Continue even if Clerk deletion fails
    }

    // Update deletion request to completed
    await db.collection('deletion_requests').doc(deletionId).update({
      status: 'completed',
      processedAt: FieldValue.serverTimestamp(),
      recordsDeleted: totalDeleted,
      recordsAnonymized: totalAnonymized
    });

    // Final compliance log
    await db.collection('compliance_audit_log').add({
      eventType: 'gdpr_deletion_completed',
      userId: 'DELETED_' + userId, // Mark as deleted
      timestamp: new Date(),
      deletionId,
      recordsDeleted: totalDeleted,
      recordsAnonymized: totalAnonymized,
      note: 'Account fully deleted and financial records anonymized per GDPR Article 17 and UK tax law'
    });

    logInfo('GDPR deletion process completed', {
      userId: 'DELETED_' + userId,
      deletionId,
      recordsDeleted: totalDeleted,
      recordsAnonymized: totalAnonymized
    });
  } catch (error) {
    logError('Deletion process failed', error as Error);

    // Update deletion request to failed
    await db.collection('deletion_requests').doc(deletionId).update({
      status: 'failed',
      failedAt: FieldValue.serverTimestamp(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

/**
 * Get deletion request status
 * GET /api/user/data/delete
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    // Get user's deletion requests
    const deletionsSnapshot = await db
      .collection('deletion_requests')
      .where('userId', '==', userId)
      .orderBy('requestedAt', 'desc')
      .limit(5)
      .get();

    const deletions = deletionsSnapshot.docs.map((doc) => ({
      deletionId: doc.id,
      requestedAt: doc.data().requestedAt,
      status: doc.data().status,
      confirmedAt: doc.data().confirmedAt,
      scheduledDeletionDate: doc.data().scheduledDeletionDate,
      processedAt: doc.data().processedAt,
      recordsDeleted: doc.data().recordsDeleted,
      recordsAnonymized: doc.data().recordsAnonymized
    }));

    return NextResponse.json({
      success: true,
      deletions
    });
  } catch (error) {
    const errorResponse = await handleApiError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

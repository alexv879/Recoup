/**
 * ADMIN API: User Details & Management
 * GET /api/admin/users/[userId] - Get user details
 * PATCH /api/admin/users/[userId] - Update user
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, FieldValue } from '@/lib/firebase';
import { User, Invoice } from '@/types/models';
import { requireAdmin, requireAdminPermission, createAdminAuditLog, getRequestMetadata } from '@/middleware/adminAuth';
import { formatErrorResponse, errors } from '@/utils/error';
import { logError } from '@/utils/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // 1. Verify admin access
    const admin = await requireAdmin();
    await requireAdminPermission(admin.userId, 'users:read');

    // 2. Get user data
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw errors.notFound('User not found');
    }

    const user = { userId: userDoc.id, ...userDoc.data() } as User;

    // 3. Get user's invoices
    const invoicesSnapshot = await db
      .collection('invoices')
      .where('freelancerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const invoices = invoicesSnapshot.docs.map((doc) => ({
      invoiceId: doc.id,
      ...doc.data(),
    })) as Invoice[];

    // 4. Get user's payment claims
    const claimsSnapshot = await db
      .collection('payment_claims')
      .where('freelancerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const claims = claimsSnapshot.docs.map((doc) => ({
      claimId: doc.id,
      ...doc.data(),
    }));

    // 5. Calculate user statistics
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue').length;
    const collectionsInvoices = invoices.filter((inv) => inv.status === 'in_collections').length;

    const userStats = {
      totalInvoices,
      totalAmount,
      paidInvoices,
      overdueInvoices,
      collectionsInvoices,
      collectionRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
      totalClaims: claims.length,
    };

    // 6. Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAdminAuditLog('user_viewed', {
      adminUserId: admin.userId,
      adminEmail: admin.email,
      targetUserId: userId,
      targetResource: 'user',
      ipAddress,
      userAgent,
    });

    // 7. Return user details
    return NextResponse.json({
      success: true,
      data: {
        user,
        invoices,
        claims,
        stats: userStats,
      },
    });
  } catch (error) {
    logError('Error fetching user details', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // 1. Verify admin access
    const admin = await requireAdmin();
    await requireAdminPermission(admin.userId, 'users:write');

    // 2. Get request body
    const body = await req.json();
    const { updates, reason } = body;

    if (!updates || typeof updates !== 'object') {
      throw errors.badRequest('Updates object required');
    }

    // 3. Get current user data
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw errors.notFound('User not found');
    }

    const currentUser = userDoc.data() as User;

    // 4. Build changes array for audit log
    const changes = Object.entries(updates).map(([field, newValue]) => ({
      field,
      oldValue: (currentUser as any)[field],
      newValue,
    }));

    // 5. Update user
    await db.collection('users').doc(userId).update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 6. Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAdminAuditLog('user_updated', {
      adminUserId: admin.userId,
      adminEmail: admin.email,
      targetUserId: userId,
      targetResource: 'user',
      changes,
      reason,
      ipAddress,
      userAgent,
    });

    // 7. Return updated user
    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const updatedUser = { userId: updatedUserDoc.id, ...updatedUserDoc.data() } as User;

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        changes,
      },
    });
  } catch (error) {
    logError('Error updating user', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

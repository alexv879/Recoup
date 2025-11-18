/**
 * ADMIN API: Support Tools - User Lookup
 * POST /api/admin/support/user-lookup - Search for user by email, ID, or name
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { User } from '@/types/models';
import { requireAdmin, requireAdminPermission, createAdminAuditLog, getRequestMetadata } from '@/middleware/adminAuth';
import { formatErrorResponse, errors } from '@/utils/error';
import { logError } from '@/utils/logger';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin access
    const admin = await requireAdmin();
    await requireAdminPermission(admin.userId, 'support:access');

    // 2. Get request body
    const body = await req.json();
    const { searchTerm } = body;

    if (!searchTerm || typeof searchTerm !== 'string') {
      throw errors.badRequest('Search term required');
    }

    const searchLower = searchTerm.toLowerCase().trim();

    // 3. Search for users
    // Try exact match first (by ID)
    let users: User[] = [];

    // Check if it's a user ID
    const userDoc = await db.collection('users').doc(searchTerm).get();
    if (userDoc.exists) {
      users.push({
        userId: userDoc.id,
        ...userDoc.data(),
      } as User);
    }

    // Search by email (partial match)
    const emailSnapshot = await db.collection('users').get();
    const emailMatches = emailSnapshot.docs
      .filter((doc) => {
        const email = doc.data().email?.toLowerCase() || '';
        return email.includes(searchLower);
      })
      .map((doc) => ({
        userId: doc.id,
        ...doc.data(),
      })) as User[];

    // Search by name (partial match)
    const nameMatches = emailSnapshot.docs
      .filter((doc) => {
        const name = doc.data().name?.toLowerCase() || '';
        return name.includes(searchLower);
      })
      .map((doc) => ({
        userId: doc.id,
        ...doc.data(),
      })) as User[];

    // Combine results and remove duplicates
    const allMatches = [...users, ...emailMatches, ...nameMatches];
    const uniqueUsers = Array.from(
      new Map(allMatches.map((user) => [user.userId, user])).values()
    );

    // 4. Get recent activity for each user
    const usersWithActivity = await Promise.all(
      uniqueUsers.slice(0, 10).map(async (user) => {
        // Get recent invoices
        const invoicesSnapshot = await db
          .collection('invoices')
          .where('freelancerId', '==', user.userId)
          .orderBy('createdAt', 'desc')
          .limit(5)
          .get();

        const recentInvoices = invoicesSnapshot.docs.map((doc) => ({
          invoiceId: doc.id,
          ...doc.data(),
        }));

        // Calculate quick stats
        const totalInvoices = invoicesSnapshot.size;
        const totalAmount = recentInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

        return {
          ...user,
          recentActivity: {
            totalInvoices,
            totalAmount,
            recentInvoices: recentInvoices.slice(0, 3),
            lastActive: user.lastActiveAt,
          },
        };
      })
    );

    // 5. Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAdminAuditLog('user_lookup', {
      adminUserId: admin.userId,
      adminEmail: admin.email,
      targetResource: 'user',
      ipAddress,
      userAgent,
    });

    // 6. Return results
    return NextResponse.json({
      success: true,
      data: {
        users: usersWithActivity,
        total: uniqueUsers.length,
      },
    });
  } catch (error) {
    logError('Error in user lookup', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

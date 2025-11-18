/**
 * ADMIN API: User Management
 * GET /api/admin/users - List all users with search and filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { User } from '@/types/models';
import { requireAdmin, requireAdminPermission, createAdminAuditLog, getRequestMetadata } from '@/middleware/adminAuth';
import { formatErrorResponse } from '@/utils/error';
import { logError } from '@/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify admin access
    const admin = await requireAdmin();
    await requireAdminPermission(admin.userId, 'users:read');

    // 2. Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || '';
    const status = searchParams.get('status') || '';
    const isAdmin = searchParams.get('isAdmin') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. Build Firestore query
    let query = db.collection('users').orderBy('createdAt', 'desc');

    // Apply filters
    if (tier) {
      query = query.where('subscriptionTier', '==', tier);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (isAdmin === 'true') {
      query = query.where('isAdmin', '==', true);
    }

    // Get all matching documents
    const snapshot = await query.get();

    // Filter by search term (email, name) in-memory
    let users = snapshot.docs.map((doc) => ({
      userId: doc.id,
      ...doc.data(),
    })) as User[];

    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower) ||
          user.userId?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const total = users.length;
    const paginatedUsers = users.slice(offset, offset + limit);

    // 4. Calculate summary statistics
    const stats = {
      total,
      active: users.filter((u) => u.status === 'active').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      admins: users.filter((u) => u.isAdmin).length,
      byTier: {
        free: users.filter((u) => u.subscriptionTier === 'free').length,
        starter: users.filter((u) => u.subscriptionTier === 'starter').length,
        growth: users.filter((u) => u.subscriptionTier === 'growth').length,
        pro: users.filter((u) => u.subscriptionTier === 'pro').length,
        business: users.filter((u) => u.subscriptionTier === 'business').length,
      },
      foundingMembers: users.filter((u) => u.isFoundingMember).length,
    };

    // 5. Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAdminAuditLog('users_listed', {
      adminUserId: admin.userId,
      adminEmail: admin.email,
      targetResource: 'users',
      ipAddress,
      userAgent,
    });

    // 6. Return users list
    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        stats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    logError('Error fetching users', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

/**
 * ADMIN API: Audit Logs
 * GET /api/admin/audit-logs - View audit logs with search and filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { AdminAuditLog } from '@/types/models';
import { requireAdmin, requireAdminPermission, getRequestMetadata } from '@/middleware/adminAuth';
import { formatErrorResponse } from '@/utils/error';
import { logError } from '@/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify admin access
    const admin = await requireAdmin();
    await requireAdminPermission(admin.userId, 'audit_logs:read');

    // 2. Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action') || '';
    const adminUserId = searchParams.get('adminUserId') || '';
    const targetUserId = searchParams.get('targetUserId') || '';
    const targetResource = searchParams.get('targetResource') || '';
    const actionType = searchParams.get('actionType') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. Build Firestore query
    let query = db.collection('admin_audit_logs').orderBy('timestamp', 'desc');

    // Apply filters
    if (adminUserId) {
      query = query.where('adminUserId', '==', adminUserId);
    }
    if (targetUserId) {
      query = query.where('targetUserId', '==', targetUserId);
    }
    if (targetResource) {
      query = query.where('targetResource', '==', targetResource);
    }
    if (actionType) {
      query = query.where('actionType', '==', actionType);
    }

    // Date range filter
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }

    // 4. Execute query
    const snapshot = await query.limit(limit + offset).get();

    // Map to audit logs
    let logs = snapshot.docs.map((doc) => ({
      auditLogId: doc.id,
      ...doc.data(),
    })) as AdminAuditLog[];

    // Filter by action text if specified (in-memory filter)
    if (action) {
      const actionLower = action.toLowerCase();
      logs = logs.filter((log) => log.action.toLowerCase().includes(actionLower));
    }

    // Apply pagination
    const total = logs.length;
    const paginatedLogs = logs.slice(offset, offset + limit);

    // 5. Get admin user names for display
    const adminIds = [...new Set(paginatedLogs.map((log) => log.adminUserId))];
    const adminUsers = await Promise.all(
      adminIds.map(async (id) => {
        const userDoc = await db.collection('users').doc(id).get();
        return {
          userId: id,
          name: userDoc.exists ? userDoc.data()?.name : 'Unknown',
          email: userDoc.exists ? userDoc.data()?.email : '',
        };
      })
    );

    const adminUserMap = Object.fromEntries(
      adminUsers.map((u) => [u.userId, { name: u.name, email: u.email }])
    );

    // 6. Enrich logs with admin names
    const enrichedLogs = paginatedLogs.map((log) => ({
      ...log,
      adminName: adminUserMap[log.adminUserId]?.name || 'Unknown',
    }));

    // 7. Calculate summary statistics
    const stats = {
      total,
      byAction: logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byAdmin: logs.reduce((acc, log) => {
        acc[log.adminUserId] = (acc[log.adminUserId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byResource: logs.reduce((acc, log) => {
        if (log.targetResource) {
          acc[log.targetResource] = (acc[log.targetResource] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
    };

    // 8. Return audit logs
    return NextResponse.json({
      success: true,
      data: {
        logs: enrichedLogs,
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
    logError('Error fetching audit logs', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

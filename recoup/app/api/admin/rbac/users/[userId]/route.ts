/**
 * User RBAC Management API
 *
 * GET /api/admin/rbac/users/[userId] - Get user's role and permissions
 * PATCH /api/admin/rbac/users/[userId] - Update user's role
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware/rbac-middleware';
import {
  getUserRole,
  getUserPermissions,
  assignRole,
  getPermissionAuditLogs,
  Role,
} from '@/lib/rbac';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

// ============================================================================
// GET - Get user's role and permissions
// ============================================================================

export const GET = withAdmin(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const { userId } = await params;
    const organizationId = request.nextUrl.searchParams.get('organizationId') || undefined;
    const includeAuditLogs = request.nextUrl.searchParams.get('includeAuditLogs') === 'true';

    const role = await getUserRole(userId, organizationId);
    const permissions = await getUserPermissions(userId, organizationId);

    const response: any = {
      userId: userId,
      role,
      permissions,
      permissionCount: permissions.length,
    };

    if (includeAuditLogs) {
      const auditLogs = await getPermissionAuditLogs(userId);
      response.auditLogs = auditLogs;
      response.auditLogCount = auditLogs.length;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// ============================================================================
// PATCH - Update user's role
// ============================================================================

export const PATCH = withAdmin(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const { userId } = await params;
    const { userId: adminUserId } = await auth();

    if (!adminUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.role) {
      return NextResponse.json(
        { error: 'Missing required field: role' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(Role).includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const success = await assignRole(
      userId,
      body.role as Role,
      adminUserId,
      body.organizationId,
      body.expiresAt
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }

    const permissions = await getUserPermissions(userId, body.organizationId);

    return NextResponse.json({
      success: true,
      userId: userId,
      role: body.role,
      permissions,
      organizationId: body.organizationId,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

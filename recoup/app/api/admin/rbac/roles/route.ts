/**
 * RBAC Role Management API
 *
 * GET /api/admin/rbac/roles - List all roles and their permissions
 * POST /api/admin/rbac/roles - Assign role to user
 */

import { auth } from '@clerk/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdmin } from '@/lib/middleware/rbac-middleware';
import {
  ROLE_PERMISSIONS,
  assignRole,
  getUserRole,
  Role,
} from '@/lib/rbac';

// ============================================================================
// GET - List all roles and permissions
// ============================================================================

export const GET = withSuperAdmin(async (request: NextRequest) => {
  try {
    // Return role-permission mapping
    const roles = Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
      role,
      permissionCount: permissions.length,
      permissions,
    }));

    return NextResponse.json({
      roles,
      totalRoles: roles.length,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// ============================================================================
// POST - Assign role to user
// ============================================================================

export const POST = withSuperAdmin(async (request: NextRequest) => {
  try {
    const { userId: adminUserId } = auth();

    if (!adminUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, role' },
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

    // Assign role
    const success = await assignRole(
      body.userId,
      body.role as Role,
      adminUserId,
      body.organizationId,
      body.expiresAt
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to assign role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: body.userId,
      role: body.role,
      organizationId: body.organizationId,
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

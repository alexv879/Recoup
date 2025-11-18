/**
 * ADMIN AUTHORIZATION MIDDLEWARE
 *
 * Provides role-based access control for admin dashboard and operations.
 * Only users with isAdmin=true can access admin routes.
 *
 * Admin Roles:
 * - super_admin: Full system access (user management, system config, billing)
 * - support_admin: Customer support access (user lookup, payment overrides)
 * - finance_admin: Financial operations (revenue, analytics, payment tracking)
 * - readonly_admin: Read-only access (monitoring, analytics, audit logs)
 */

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase';
import { User } from '@/types/models';
import { errors } from '@/utils/error';
import { logError, logInfo, logWarn } from '@/utils/logger';
import { NextRequest } from 'next/server';

export type AdminRole = 'super_admin' | 'support_admin' | 'finance_admin' | 'readonly_admin';

/**
 * Admin permission matrix
 * Defines what each admin role can access
 */
const ADMIN_PERMISSIONS = {
  super_admin: [
    'users:read',
    'users:write',
    'users:delete',
    'payments:read',
    'payments:write',
    'payments:override',
    'analytics:read',
    'audit_logs:read',
    'system:configure',
    'alerts:manage',
    'support:access',
  ],
  support_admin: [
    'users:read',
    'users:write',
    'payments:read',
    'payments:override',
    'audit_logs:read',
    'support:access',
  ],
  finance_admin: [
    'users:read',
    'payments:read',
    'payments:write',
    'analytics:read',
    'audit_logs:read',
  ],
  readonly_admin: [
    'users:read',
    'payments:read',
    'analytics:read',
    'audit_logs:read',
  ],
};

/**
 * Check if authenticated user is an admin
 * @returns Admin user data or throws unauthorized error
 */
export async function requireAdmin(): Promise<{
  userId: string;
  email: string;
  name: string;
  adminRole: AdminRole;
}> {
  const { userId } = await auth();

  if (!userId) {
    throw errors.unauthorized('Authentication required');
  }

  // Get user from Firestore
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    throw errors.unauthorized('User not found');
  }

  const user = userDoc.data() as User;

  // Check if user is an admin
  if (!user.isAdmin) {
    logWarn('Non-admin user attempted to access admin route', {
      userId,
      email: user.email,
    });
    throw errors.forbidden('Admin access required');
  }

  // Default to readonly if no role specified
  const adminRole = user.adminRole || 'readonly_admin';

  logInfo('Admin access granted', {
    userId,
    email: user.email,
    adminRole,
  });

  return {
    userId,
    email: user.email,
    name: user.name,
    adminRole,
  };
}

/**
 * Check if admin user has specific permission
 * @param userId - User ID to check
 * @param permission - Permission to check (e.g., 'users:write', 'payments:override')
 * @returns true if user has permission, false otherwise
 */
export async function hasAdminPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return false;
    }

    const user = userDoc.data() as User;

    if (!user.isAdmin) {
      return false;
    }

    const adminRole = user.adminRole || 'readonly_admin';
    const permissions = ADMIN_PERMISSIONS[adminRole];

    return permissions.includes(permission);
  } catch (error) {
    logError('Error checking admin permission', error as Error, {
      userId,
      permission,
    });
    return false;
  }
}

/**
 * Require specific admin permission or throw forbidden error
 * Use this in API routes to enforce granular permissions
 * @param userId - User ID to check
 * @param permission - Required permission
 * @throws ForbiddenError if user doesn't have permission
 */
export async function requireAdminPermission(
  userId: string,
  permission: string
): Promise<void> {
  const hasPermission = await hasAdminPermission(userId, permission);

  if (!hasPermission) {
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.exists ? (userDoc.data() as User) : null;
    const adminRole = user?.adminRole || 'none';

    logWarn('Admin permission denied', {
      userId,
      permission,
      adminRole,
    });

    throw errors.forbidden(
      `Insufficient permissions. Required: ${permission}, Your role: ${adminRole}`
    );
  }
}

/**
 * Get admin user info for current session
 * @returns Admin user info or null if not admin
 */
export async function getAdminUser(): Promise<{
  userId: string;
  email: string;
  name: string;
  adminRole: AdminRole;
  permissions: string[];
} | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    const user = userDoc.data() as User;

    if (!user.isAdmin) {
      return null;
    }

    const adminRole = user.adminRole || 'readonly_admin';
    const permissions = ADMIN_PERMISSIONS[adminRole];

    return {
      userId,
      email: user.email,
      name: user.name,
      adminRole,
      permissions,
    };
  } catch (error) {
    logError('Error getting admin user', error as Error);
    return null;
  }
}

/**
 * Create audit log entry for admin actions
 * @param action - Action performed (e.g., 'user_updated', 'payment_overridden')
 * @param details - Details of the action
 */
export async function createAdminAuditLog(
  action: string,
  details: {
    adminUserId: string;
    adminEmail: string;
    targetUserId?: string;
    targetResource?: string;
    changes?: Record<string, any>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    await db.collection('admin_audit_logs').add({
      action,
      ...details,
      timestamp: new Date(),
      createdAt: new Date(),
    });

    logInfo('Admin audit log created', {
      action,
      adminUserId: details.adminUserId,
      targetUserId: details.targetUserId,
    });
  } catch (error) {
    logError('Error creating admin audit log', error as Error, {
      action,
      adminUserId: details.adminUserId,
    });
    // Don't throw - audit log failure shouldn't block the operation
  }
}

/**
 * Extract IP address and user agent from request
 * @param req - Next.js request object
 * @returns IP address and user agent
 */
export function getRequestMetadata(req: NextRequest): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = req.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

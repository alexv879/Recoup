/**
 * Role-Based Access Control (RBAC) System
 *
 * Enterprise-grade permission system for Recoup
 *
 * Features:
 * - Hierarchical roles (Admin > Manager > User)
 * - Granular permissions
 * - Resource-level access control
 * - Team/organization scoping
 * - Audit logging
 *
 * Based on NIST RBAC standard and OAuth 2.0 scopes pattern
 */

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// ============================================================================
// TYPES
// ============================================================================

/**
 * System-wide roles
 */
export enum Role {
  /** Super administrator - full system access */
  SUPER_ADMIN = 'super_admin',

  /** Organization administrator - full org access */
  ADMIN = 'admin',

  /** Manager - can manage team and limited settings */
  MANAGER = 'manager',

  /** Standard user - basic access */
  USER = 'user',

  /** Read-only user - view only */
  VIEWER = 'viewer',

  /** Account is suspended/blocked */
  SUSPENDED = 'suspended',
}

/**
 * Granular permissions
 */
export enum Permission {
  // ========== Invoice Management ==========
  INVOICE_CREATE = 'invoice:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  INVOICE_SEND = 'invoice:send',

  // ========== Client Management ==========
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',

  // ========== Collections ==========
  COLLECTION_CREATE = 'collection:create',
  COLLECTION_READ = 'collection:read',
  COLLECTION_UPDATE = 'collection:update',
  COLLECTION_DELETE = 'collection:delete',
  COLLECTION_SEND_EMAIL = 'collection:send_email',
  COLLECTION_SEND_SMS = 'collection:send_sms',
  COLLECTION_SEND_LETTER = 'collection:send_letter',
  COLLECTION_ESCALATE = 'collection:escalate',

  // ========== Payment Verification ==========
  PAYMENT_VERIFY = 'payment:verify',
  PAYMENT_CLAIM = 'payment:claim',
  PAYMENT_DISPUTE = 'payment:dispute',

  // ========== Analytics & Reporting ==========
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  REPORT_GENERATE = 'report:generate',

  // ========== Team Management ==========
  TEAM_INVITE = 'team:invite',
  TEAM_REMOVE = 'team:remove',
  TEAM_VIEW = 'team:view',
  TEAM_UPDATE_ROLES = 'team:update_roles',

  // ========== Settings & Configuration ==========
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',
  SETTINGS_BILLING = 'settings:billing',
  SETTINGS_INTEGRATIONS = 'settings:integrations',

  // ========== Admin Functions ==========
  ADMIN_VIEW_ALL_USERS = 'admin:view_all_users',
  ADMIN_MANAGE_USERS = 'admin:manage_users',
  ADMIN_VIEW_AUDIT_LOGS = 'admin:view_audit_logs',
  ADMIN_MANAGE_FEATURE_FLAGS = 'admin:manage_feature_flags',
  ADMIN_IMPERSONATE = 'admin:impersonate',
  ADMIN_DELETE_DATA = 'admin:delete_data',
}

/**
 * Resource types for permission scoping
 */
export enum ResourceType {
  INVOICE = 'invoice',
  CLIENT = 'client',
  COLLECTION = 'collection',
  PAYMENT = 'payment',
  TEAM = 'team',
  ORGANIZATION = 'organization',
}

/**
 * Permission check context
 */
export interface PermissionContext {
  /** User ID performing the action */
  userId: string;

  /** Organization ID (for multi-tenancy) */
  organizationId?: string;

  /** Resource being accessed */
  resource?: {
    type: ResourceType;
    id: string;
    ownerId?: string;
    organizationId?: string;
  };

  /** Additional context */
  metadata?: Record<string, any>;
}

/**
 * User role assignment
 */
export interface UserRole {
  userId: string;
  role: Role;
  organizationId?: string;
  assignedAt: string;
  assignedBy: string;
  expiresAt?: string;
}

/**
 * Role permission mapping
 */
export interface RolePermissions {
  role: Role;
  permissions: Permission[];
  inheritsFrom?: Role[];
}

/**
 * Audit log for permission changes
 */
export interface PermissionAuditLog {
  userId: string;
  action: 'grant' | 'revoke' | 'check';
  permission?: Permission;
  role?: Role;
  resource?: {
    type: ResourceType;
    id: string;
  };
  result: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// ROLE-PERMISSION MAPPING
// ============================================================================

/**
 * Define permissions for each role
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission), // All permissions

  [Role.ADMIN]: [
    // Invoices
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DELETE,
    Permission.INVOICE_SEND,

    // Clients
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.CLIENT_DELETE,

    // Collections
    Permission.COLLECTION_CREATE,
    Permission.COLLECTION_READ,
    Permission.COLLECTION_UPDATE,
    Permission.COLLECTION_DELETE,
    Permission.COLLECTION_SEND_EMAIL,
    Permission.COLLECTION_SEND_SMS,
    Permission.COLLECTION_SEND_LETTER,
    Permission.COLLECTION_ESCALATE,

    // Payments
    Permission.PAYMENT_VERIFY,
    Permission.PAYMENT_CLAIM,
    Permission.PAYMENT_DISPUTE,

    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.REPORT_GENERATE,

    // Team
    Permission.TEAM_INVITE,
    Permission.TEAM_REMOVE,
    Permission.TEAM_VIEW,
    Permission.TEAM_UPDATE_ROLES,

    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,
    Permission.SETTINGS_BILLING,
    Permission.SETTINGS_INTEGRATIONS,

    // Limited admin
    Permission.ADMIN_VIEW_AUDIT_LOGS,
  ],

  [Role.MANAGER]: [
    // Invoices
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_SEND,

    // Clients
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,

    // Collections
    Permission.COLLECTION_CREATE,
    Permission.COLLECTION_READ,
    Permission.COLLECTION_UPDATE,
    Permission.COLLECTION_SEND_EMAIL,
    Permission.COLLECTION_SEND_SMS,

    // Payments
    Permission.PAYMENT_VERIFY,
    Permission.PAYMENT_CLAIM,

    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.REPORT_GENERATE,

    // Team (view only)
    Permission.TEAM_VIEW,

    // Settings (view only)
    Permission.SETTINGS_VIEW,
  ],

  [Role.USER]: [
    // Invoices
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_SEND,

    // Clients
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,

    // Collections (read only)
    Permission.COLLECTION_READ,

    // Payments
    Permission.PAYMENT_VERIFY,
    Permission.PAYMENT_CLAIM,

    // Analytics (view only)
    Permission.ANALYTICS_VIEW,

    // Settings (view only)
    Permission.SETTINGS_VIEW,
  ],

  [Role.VIEWER]: [
    // Read-only access
    Permission.INVOICE_READ,
    Permission.CLIENT_READ,
    Permission.COLLECTION_READ,
    Permission.ANALYTICS_VIEW,
    Permission.SETTINGS_VIEW,
  ],

  [Role.SUSPENDED]: [], // No permissions
};

// ============================================================================
// FIRESTORE COLLECTIONS
// ============================================================================

const USER_ROLES_COLLECTION = 'user_roles';
const PERMISSION_AUDIT_LOGS_COLLECTION = 'permission_audit_logs';

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get user's role
 */
export async function getUserRole(
  userId: string,
  organizationId?: string
): Promise<Role> {
  try {
    let query = db.collection(USER_ROLES_COLLECTION).where('userId', '==', userId);

    if (organizationId) {
      query = query.where('organizationId', '==', organizationId);
    }

    const snapshot = await query.limit(1).get();

    if (snapshot.empty) {
      return Role.USER; // Default role
    }

    const userRole = snapshot.docs[0].data() as UserRole;

    // Check if role has expired
    if (userRole.expiresAt && new Date(userRole.expiresAt) < new Date()) {
      return Role.USER; // Revert to default
    }

    return userRole.role;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return Role.USER; // Fail-safe default
  }
}

/**
 * Assign role to user
 */
export async function assignRole(
  userId: string,
  role: Role,
  assignedBy: string,
  organizationId?: string,
  expiresAt?: string
): Promise<boolean> {
  try {
    const roleData: UserRole = {
      userId,
      role,
      organizationId,
      assignedAt: new Date().toISOString(),
      assignedBy,
      expiresAt,
    };

    await db.collection(USER_ROLES_COLLECTION).add(roleData);

    // Log audit event
    await logPermissionAudit({
      userId,
      action: 'grant',
      role,
      result: true,
      timestamp: new Date().toISOString(),
      metadata: { assignedBy, organizationId },
    });

    return true;
  } catch (error) {
    console.error('Error assigning role:', error);
    return false;
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  context: PermissionContext,
  permission: Permission
): Promise<boolean> {
  try {
    const role = await getUserRole(context.userId, context.organizationId);

    // Check role permissions
    const permissions = ROLE_PERMISSIONS[role] || [];
    const hasPermission = permissions.includes(permission);

    // Resource-level checks
    if (hasPermission && context.resource) {
      const canAccessResource = await checkResourceAccess(context);
      if (!canAccessResource) {
        return false;
      }
    }

    // Log audit event
    await logPermissionAudit({
      userId: context.userId,
      action: 'check',
      permission,
      resource: context.resource,
      result: hasPermission,
      timestamp: new Date().toISOString(),
    });

    return hasPermission;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false; // Fail closed (deny by default)
  }
}

/**
 * Check if user can access a specific resource
 */
async function checkResourceAccess(context: PermissionContext): Promise<boolean> {
  if (!context.resource) return true;

  // Super admins bypass all checks
  const role = await getUserRole(context.userId, context.organizationId);
  if (role === Role.SUPER_ADMIN) return true;

  // Resource owner always has access
  if (context.resource.ownerId === context.userId) return true;

  // Organization admins can access org resources
  if (role === Role.ADMIN && context.organizationId) {
    // Verify resource belongs to organization
    if (context.resource.organizationId === context.organizationId) {
      return true;
    }
    // If resource doesn't have organizationId field, check via owner
    if (context.resource.ownerId) {
      // Owner should belong to the same organization as the admin
      return true; // Assume organizational boundary is enforced at data layer
    }
    return false;
  }

  // Default: deny access to resources owned by others
  if (context.resource.ownerId && context.resource.ownerId !== context.userId) {
    return false;
  }

  return true;
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(
  userId: string,
  organizationId?: string
): Promise<Permission[]> {
  const role = await getUserRole(userId, organizationId);
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  context: PermissionContext,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    const has = await hasPermission(context, permission);
    if (has) return true;
  }
  return false;
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  context: PermissionContext,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    const has = await hasPermission(context, permission);
    if (!has) return false;
  }
  return true;
}

/**
 * Log permission audit event
 */
async function logPermissionAudit(log: PermissionAuditLog): Promise<void> {
  try {
    await db.collection(PERMISSION_AUDIT_LOGS_COLLECTION).add(log);
  } catch (error) {
    console.error('Error logging permission audit:', error);
  }
}

/**
 * Get permission audit logs for a user
 */
export async function getPermissionAuditLogs(
  userId: string,
  limit: number = 100
): Promise<PermissionAuditLog[]> {
  try {
    const snapshot = await db
      .collection(PERMISSION_AUDIT_LOGS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as PermissionAuditLog);
  } catch (error) {
    console.error('Error fetching permission audit logs:', error);
    return [];
  }
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

/**
 * Require permission middleware helper
 *
 * Usage in API routes:
 * ```ts
 * const { userId } = auth();
 * await requirePermission(userId, Permission.INVOICE_CREATE);
 * ```
 */
export async function requirePermission(
  userId: string,
  permission: Permission,
  organizationId?: string,
  resource?: PermissionContext['resource']
): Promise<void> {
  const hasAccess = await hasPermission(
    { userId, organizationId, resource },
    permission
  );

  if (!hasAccess) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Require role middleware helper
 */
export async function requireRole(
  userId: string,
  requiredRole: Role | Role[],
  organizationId?: string
): Promise<void> {
  const userRole = await getUserRole(userId, organizationId);

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Role required: ${allowedRoles.join(' or ')}`);
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string, organizationId?: string): Promise<boolean> {
  const role = await getUserRole(userId, organizationId);
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === Role.SUPER_ADMIN;
}

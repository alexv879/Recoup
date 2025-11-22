/**
 * RBAC Middleware for API Route Protection
 *
 * Usage in API routes:
 * ```ts
 * import { withPermission, withRole } from '@/lib/middleware/rbac-middleware';
 *
 * export const GET = withPermission(Permission.INVOICE_READ, async (request, context) => {
 *   // Your protected route logic
 * });
 * ```
 */

import { auth } from '@clerk/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  hasPermission,
  getUserRole,
  Permission,
  Role,
  type PermissionContext,
  type ResourceType,
} from '@/lib/rbac';

/**
 * Route handler type
 */
type RouteHandler = (
  request: NextRequest,
  context?: any
) => Promise<Response | NextResponse>;

/**
 * Wrap route handler with permission check
 */
export function withPermission(
  permission: Permission,
  handler: RouteHandler,
  options?: {
    organizationId?: string;
    resourceType?: ResourceType;
    resourceIdParam?: string; // e.g., 'id' to extract from params.id
  }
): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      const { userId } = auth();

      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Build permission context
      const permissionContext: PermissionContext = {
        userId,
        organizationId: options?.organizationId,
      };

      // Extract resource from route params if specified
      if (options?.resourceType && options?.resourceIdParam && context?.params) {
        const resourceId = context.params[options.resourceIdParam];
        if (resourceId) {
          permissionContext.resource = {
            type: options.resourceType,
            id: resourceId,
          };
        }
      }

      // Check permission
      const hasAccess = await hasPermission(permissionContext, permission);

      if (!hasAccess) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: `Missing required permission: ${permission}`,
          },
          { status: 403 }
        );
      }

      // Permission granted - execute handler
      return handler(request, context);
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrap route handler with role check
 */
export function withRole(
  requiredRole: Role | Role[],
  handler: RouteHandler,
  options?: {
    organizationId?: string;
  }
): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      const { userId } = auth();

      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get user's role
      const userRole = await getUserRole(userId, options?.organizationId);

      // Check if user has required role
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: `Required role: ${allowedRoles.join(' or ')}`,
          },
          { status: 403 }
        );
      }

      // Role check passed - execute handler
      return handler(request, context);
    } catch (error) {
      console.error('Role middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrap route handler with admin check
 */
export function withAdmin(handler: RouteHandler): RouteHandler {
  return withRole([Role.ADMIN, Role.SUPER_ADMIN], handler);
}

/**
 * Wrap route handler with super admin check
 */
export function withSuperAdmin(handler: RouteHandler): RouteHandler {
  return withRole(Role.SUPER_ADMIN, handler);
}

/**
 * Combine multiple permission checks (OR logic)
 */
export function withAnyPermission(
  permissions: Permission[],
  handler: RouteHandler,
  options?: {
    organizationId?: string;
  }
): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      const { userId } = auth();

      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const permissionContext: PermissionContext = {
        userId,
        organizationId: options?.organizationId,
      };

      // Check if user has any of the permissions
      let hasAccess = false;
      for (const permission of permissions) {
        const access = await hasPermission(permissionContext, permission);
        if (access) {
          hasAccess = true;
          break;
        }
      }

      if (!hasAccess) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: `Missing required permissions: ${permissions.join(' or ')}`,
          },
          { status: 403 }
        );
      }

      return handler(request, context);
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

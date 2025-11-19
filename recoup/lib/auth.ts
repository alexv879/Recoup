/**
 * Authentication & Authorization Helpers
 * Replaces mock auth with real Clerk integration
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/error';
import { db } from './firebase';
import { logger } from '../utils/logger';

/**
 * Get authenticated user ID
 * Throws UnauthorizedError if not authenticated
 */
export async function getAuthenticatedUser(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }

  return userId;
}

/**
 * Require authentication and return user details
 */
export async function requireAuth() {
  const userId = await getAuthenticatedUser();
  const user = await currentUser();

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return { userId, user };
}

/**
 * Require resource ownership
 * Ensures user can only access their own resources
 */
export async function requireResourceOwnership(
  userId: string,
  resourceType: 'invoice' | 'client' | 'proposal' | 'ir35Assessment' | 'project',
  resourceId: string
) {
  const collectionName = resourceType + 's';
  const resourceDoc = await db.collection(collectionName).doc(resourceId).get();

  if (!resourceDoc.exists) {
    throw new NotFoundError(`${resourceType} not found`);
  }

  const data = resourceDoc.data();

  // Check ownership via userId or freelancerId field
  if (data?.userId !== userId && data?.freelancerId !== userId) {
    logger.warn('Unauthorized resource access attempt', {
      userId,
      resourceType,
      resourceId,
      ownerId: data?.userId || data?.freelancerId,
    });

    throw new ForbiddenError('You do not have access to this resource');
  }

  return resourceDoc;
}

/**
 * Check if user has permission for an action
 */
export async function checkPermission(
  userId: string,
  action: string,
  resource?: string
): Promise<boolean> {
  // For now, basic ownership check
  // Can be extended to RBAC (Role-Based Access Control)

  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    return false;
  }

  const userData = userDoc.data();

  // Check if user is admin
  if (userData?.role === 'admin') {
    return true;
  }

  // Check subscription tier for premium features
  if (action === 'ai_proposal_generation') {
    return ['pro', 'business'].includes(userData?.subscriptionTier || 'free');
  }

  if (action === 'ir35_assessment') {
    return ['growth', 'pro', 'business'].includes(userData?.subscriptionTier || 'free');
  }

  // Default: allow access to own resources
  return true;
}

/**
 * Require specific permission
 */
export async function requirePermission(
  userId: string,
  action: string,
  resource?: string
) {
  const hasPermission = await checkPermission(userId, action, resource);

  if (!hasPermission) {
    throw new ForbiddenError(`You do not have permission to ${action}`);
  }
}

/**
 * Get user's IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

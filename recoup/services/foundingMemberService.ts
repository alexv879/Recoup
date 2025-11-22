/**
 * FOUNDING MEMBER SERVICE
 *
 * Manages the "Founding 50" program:
 * - First 50 users get 50% off for life
 * - Locked-in pricing: £12/£22/£75 (vs £24/£45/£150 standard)
 * - Founding member badge/status
 * - Real-time counter for remaining spots
 *
 * Business Plan Context:
 * - Oversubscribed methodology (Daniel Priestley)
 * - Creates FOMO and urgency
 * - Generates early adopter testimonials
 * - Viral marketing from founding members
 */

import { db, FieldValue, Timestamp } from '@/lib/firebase';
import { User } from '@/types/models';
import { FOUNDING_MEMBER_LIMIT, FOUNDING_MEMBER_PRICING, SubscriptionTier } from '@/utils/constants';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { toDate } from '@/utils/helpers';

/**
 * Check founding member program status
 * Returns current availability and remaining spots
 */
export async function getFoundingMemberStatus(): Promise<{
  spotsRemaining: number;
  totalFoundingMembers: number;
  isAvailable: boolean;
  percentageFilled: number;
}> {
  try {
    // Count current founding members
    const foundingMembersSnapshot = await db
      .collection('users')
      .where('isFoundingMember', '==', true)
      .count()
      .get();

    const total = foundingMembersSnapshot.data().count;
    const remaining = Math.max(0, FOUNDING_MEMBER_LIMIT - total);
    const percentageFilled = (total / FOUNDING_MEMBER_LIMIT) * 100;

    logInfo('Founding member status checked', {
      total,
      remaining,
      percentageFilled,
    });

    return {
      totalFoundingMembers: total,
      spotsRemaining: remaining,
      isAvailable: remaining > 0,
      percentageFilled,
    };
  } catch (error) {
    logError('Error getting founding member status', error as Error);
    throw error;
  }
}

/**
 * Register user as founding member (atomic transaction)
 * Ensures no race conditions when multiple users sign up simultaneously
 *
 * @param userId - Clerk user ID
 * @param tier - Subscription tier user is signing up for
 * @returns Success status with member number or failure reason
 */
export async function registerAsFoundingMember(
  userId: string,
  tier: 'starter' | 'growth' | 'pro'
): Promise<{
  success: boolean;
  memberNumber?: string;
  lockedInPrice?: number;
  reason?: string;
  alreadyMember?: boolean;
}> {
  try {
    logInfo('Attempting to register founding member', { userId, tier });

    // Use Firestore transaction for atomic operation
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const user = userDoc.data() as User;

      // Check if already a founding member
      if (user.isFoundingMember) {
        logInfo('User is already a founding member', {
          userId,
          memberNumber: user.foundingMemberNumber,
        });
        return {
          success: true,
          memberNumber: user.foundingMemberNumber,
          lockedInPrice: user.lockedInPrice,
          alreadyMember: true,
        };
      }

      // Count current founding members within transaction
      const foundingMembersSnapshot = await transaction.get(
        db.collection('users').where('isFoundingMember', '==', true)
      );

      const currentCount = foundingMembersSnapshot.size;

      // Check if limit reached
      if (currentCount >= FOUNDING_MEMBER_LIMIT) {
        logWarn('Founding member limit reached', {
          currentCount,
          limit: FOUNDING_MEMBER_LIMIT,
          userId,
        });
        throw new Error('All founding member spots have been claimed');
      }

      // Assign member number (1-indexed) as string
      const memberNumber = String(currentCount + 1);

      // Get locked-in price (50% off)
      const lockedInPrice = FOUNDING_MEMBER_PRICING[tier];

      // Update user with founding member status
      transaction.update(userRef, {
        isFoundingMember: true,
        foundingMemberNumber: memberNumber,
        foundingMemberJoinedAt: FieldValue.serverTimestamp(),
        lockedInPrice,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logInfo('Founding member registered successfully', {
        userId,
        memberNumber,
        tier,
        lockedInPrice,
      });

      return {
        success: true,
        memberNumber,
        lockedInPrice,
      };
    });

    return result;
  } catch (error) {
    logError('Error registering founding member', error as Error, {
      userId,
      tier,
    });

    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get founding member details for a specific user
 *
 * @param userId - Clerk user ID
 * @returns Founding member details or null if not a founding member
 */
export async function getFoundingMemberDetails(userId: string): Promise<{
  isFoundingMember: boolean;
  memberNumber?: string;
  joinedAt?: Date;
  lockedInPrice?: number;
} | null> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    const user = userDoc.data() as User;

    if (!user.isFoundingMember) {
      return {
        isFoundingMember: false,
      };
    }

    return {
      isFoundingMember: true,
      memberNumber: user.foundingMemberNumber,
      joinedAt: user.foundingMemberJoinedAt
        ? toDate(user.foundingMemberJoinedAt)
        : undefined,
      lockedInPrice: user.lockedInPrice,
    };
  } catch (error) {
    logError('Error getting founding member details', error as Error, {
      userId,
    });
    return null;
  }
}

/**
 * Get list of all founding members (for admin/leaderboard)
 * Returns basic info without sensitive data
 */
export async function getAllFoundingMembers(): Promise<
  Array<{
    userId: string;
    memberNumber: number;
    name: string;
    joinedAt: Date;
    tier: SubscriptionTier;
  }>
> {
  try {
    const foundingMembersSnapshot = await db
      .collection('users')
      .where('isFoundingMember', '==', true)
      .orderBy('foundingMemberNumber', 'asc')
      .get();

    const members = foundingMembersSnapshot.docs.map((doc) => {
      const user = doc.data() as User;
      return {
        userId: doc.id,
        memberNumber: typeof user.foundingMemberNumber === 'string'
          ? parseInt(user.foundingMemberNumber, 10)
          : user.foundingMemberNumber || 0,
        name: user.name,
        joinedAt: user.foundingMemberJoinedAt
          ? toDate(user.foundingMemberJoinedAt)
          : new Date(),
        tier: user.subscriptionTier as SubscriptionTier,
      };
    });

    return members;
  } catch (error) {
    logError('Error getting all founding members', error as Error);
    return [];
  }
}

/**
 * Check if founding member spots are running low (< 10 remaining)
 * Used to trigger urgency messaging
 */
export async function isFoundingSpotsLow(): Promise<boolean> {
  const status = await getFoundingMemberStatus();
  return status.spotsRemaining > 0 && status.spotsRemaining <= 10;
}

/**
 * Get founding member pricing for a tier
 * Returns locked-in price if founding member, otherwise standard price
 *
 * @param userId - Clerk user ID
 * @param tier - Subscription tier
 * @returns Price in GBP
 */
export async function getFoundingMemberPrice(
  userId: string,
  tier: 'starter' | 'growth' | 'pro'
): Promise<number> {
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    // Not a founding member, return standard price
    const { STANDARD_PRICING } = await import('@/utils/constants');
    return STANDARD_PRICING[tier];
  }

  const user = userDoc.data() as User;

  // If founding member with locked-in price, return that
  if (user.isFoundingMember && user.lockedInPrice) {
    return user.lockedInPrice;
  }

  // Otherwise return founding price if spots available, else standard
  const status = await getFoundingMemberStatus();
  if (status.isAvailable) {
    return FOUNDING_MEMBER_PRICING[tier];
  }

  const { STANDARD_PRICING } = await import('@/utils/constants');
  return STANDARD_PRICING[tier];
}

/**
 * Validate founding member eligibility before subscription checkout
 * Ensures user can claim a founding spot
 */
export async function validateFoundingEligibility(userId: string): Promise<{
  isEligible: boolean;
  reason?: string;
}> {
  try {
    // Check if already a founding member
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        isEligible: false,
        reason: 'User not found',
      };
    }

    const user = userDoc.data() as User;

    if (user.isFoundingMember) {
      return {
        isEligible: true, // Already founding member, always eligible
      };
    }

    // Check if spots available
    const status = await getFoundingMemberStatus();

    if (!status.isAvailable) {
      return {
        isEligible: false,
        reason: 'All founding member spots have been claimed',
      };
    }

    return {
      isEligible: true,
    };
  } catch (error) {
    logError('Error validating founding eligibility', error as Error, {
      userId,
    });
    return {
      isEligible: false,
      reason: 'Error validating eligibility',
    };
  }
}

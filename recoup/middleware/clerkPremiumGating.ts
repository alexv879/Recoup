/**
 * CLERK BILLING PREMIUM GATING
 *
 * Uses Clerk's built-in subscription features (has() helper) combined with
 * local usage quota tracking to enforce feature access and collection limits.
 *
 * Subscription Tiers (4-tier freemium model):
 * - FREE: Unlimited invoices, 1 email reminder/month (demo), BACS button
 * - STARTER (£19/£38): 10 collections/month, email reminders only
 * - GROWTH (£39/£78): 25 collections/month, email + SMS + 15 AI calls
 * - PRO (£75/£150): Unlimited collections, SMS + letters + 50 AI calls
 *
 * Premium Features (defined in Clerk Dashboard):
 * - sms_reminders: Available on Pro+ tiers
 * - ai_voice_calls_5_per_month: Available on Pro tier
 * - ai_voice_calls_20_per_month: Available on Business tier
 * - physical_letters_15_per_month: Available on Business tier
 * - collections_limit_10: Starter tier
 * - collections_limit_25: Pro tier
 * - collections_unlimited: Business tier
 * - advanced_analytics: Pro+ tiers
 */

import { auth } from '@clerk/nextjs/server';
import { db, FieldValue } from '@/lib/firebase';
import { User } from '@/types/models';
import { errors } from '@/utils/error';
import { COLLECTIONS_LIMITS, TIER_LEVELS, normalizeTier, SubscriptionTier } from '@/utils/constants';
import { logError, logInfo, logWarn } from '@/utils/logger';

/**
 * Feature slugs matching Clerk dashboard configuration
 * These should be created as features in Clerk Dashboard > Subscription Plans
 */
export type ClerkFeature =
  | 'sms_reminders'
  | 'ai_voice_calls_5_per_month'
  | 'ai_voice_calls_20_per_month'
  | 'physical_letters_15_per_month'
  | 'collections_limit_10'
  | 'collections_limit_25'
  | 'collections_unlimited'
  | 'advanced_analytics'
  | 'priority_support'
  | 'dedicated_account_manager';

/**
 * Check if user has access to a Clerk Billing feature
 * Combines Clerk's subscription check with local usage quota tracking
 *
 * @param userId - Clerk user ID
 * @param feature - Feature slug from Clerk dashboard
 * @returns Access status with reason and upgrade suggestion
 */
export async function checkClerkFeatureAccess(
  userId: string,
  feature: ClerkFeature
): Promise<{
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  suggestedTier?: SubscriptionTier;
  quotaInfo?: {
    used: number;
    limit: number;
    remaining: number;
  };
}> {
  try {
    // 1. Check Clerk subscription status using has() helper
    const { has } = await auth();

    if (!has) {
      logWarn('Clerk auth not available in checkClerkFeatureAccess', { userId });
      throw errors.unauthorized('User not authenticated');
    }

    const hasFeature = has({ feature });

    // 2. Get user from Firestore for usage tracking
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        hasAccess: false,
        reason: 'User not found',
      };
    }

    const user = userDoc.data() as User;
    const tier = normalizeTier(user.subscriptionTier);

    // 3. Check usage quota for collection features
    if (feature.startsWith('collections_limit_')) {
      const limit = COLLECTIONS_LIMITS[tier as keyof typeof COLLECTIONS_LIMITS];
      const used = user.collectionsUsedThisMonth || 0;
      const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);

      // Check if quota exceeded
      if (limit !== Infinity && used >= limit) {
        return {
          hasAccess: false,
          reason: `Monthly quota exceeded (${used}/${limit} collections used this month)`,
          upgradeRequired: true,
          suggestedTier: getSuggestedTierForUpgrade(tier),
          quotaInfo: {
            used,
            limit,
            remaining: 0,
          },
        };
      }

      // Has access, return quota info
      return {
        hasAccess: true,
        quotaInfo: {
          used,
          limit: limit === Infinity ? 999999 : limit,
          remaining: limit === Infinity ? 999999 : remaining,
        },
      };
    }

    // 4. For non-quota features, return Clerk's feature check result
    if (!hasFeature) {
      return {
        hasAccess: false,
        reason: `Feature '${feature}' not available on your ${tier} plan`,
        upgradeRequired: true,
        suggestedTier: getSuggestedTierForFeature(feature),
      };
    }

    return {
      hasAccess: true,
    };
  } catch (error) {
    logError('Error checking Clerk feature access', error as Error, {
      userId,
      feature,
    });
    return {
      hasAccess: false,
      reason: 'Error checking subscription status',
    };
  }
}

/**
 * Require Clerk feature access or throw 402 Payment Required error
 * Use this in API routes to enforce premium features
 *
 * @param userId - Clerk user ID
 * @param feature - Feature slug from Clerk dashboard
 * @throws PaymentRequiredError if user doesn't have access
 */
export async function requireClerkFeature(
  userId: string,
  feature: ClerkFeature
): Promise<void> {
  const { hasAccess, reason, suggestedTier, quotaInfo } = await checkClerkFeatureAccess(
    userId,
    feature
  );

  if (!hasAccess) {
    throw errors.paymentRequired(reason || 'Upgrade required to access this feature', {
      feature,
      suggestedTier,
      quotaInfo,
    });
  }

  logInfo('Premium feature access granted', {
    userId,
    feature,
    quotaInfo,
  });
}

/**
 * Increment usage counter for collections
 * Call this AFTER a collection action succeeds (SMS sent, AI call made, letter sent)
 *
 * @param userId - Clerk user ID
 * @param usageType - Type of usage to increment
 */
export async function incrementUsageCounter(
  userId: string,
  usageType: 'collection' | 'ai_call' | 'letter'
): Promise<void> {
  try {
    const userRef = db.collection('users').doc(userId);

    await userRef.update({
      collectionsUsedThisMonth: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logInfo('Usage counter incremented', {
      userId,
      usageType,
    });
  } catch (error) {
    logError('Error incrementing usage counter', error as Error, {
      userId,
      usageType,
    });
    // Don't throw - usage tracking failure shouldn't block the operation
  }
}

/**
 * Reset monthly usage counters (called by cron job on 1st of month)
 *
 * @param userId - Clerk user ID (optional - if not provided, resets all users)
 */
export async function resetMonthlyUsage(userId?: string): Promise<void> {
  try {
    if (userId) {
      // Reset single user
      await db.collection('users').doc(userId).update({
        collectionsUsedThisMonth: 0,
        monthlyUsageResetDate: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      logInfo('Monthly usage reset for user', { userId });
    } else {
      // Reset all users (batch operation)
      const usersSnapshot = await db.collection('users').get();
      const batch = db.batch();

      usersSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          collectionsUsedThisMonth: 0,
          monthlyUsageResetDate: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      logInfo('Monthly usage reset for all users', {
        totalUsers: usersSnapshot.size,
      });
    }
  } catch (error) {
    logError('Error resetting monthly usage', error as Error, { userId });
    throw error;
  }
}

/**
 * Get user's current usage quota info
 *
 * @param userId - Clerk user ID
 * @returns Quota information
 */
export async function getUserQuotaInfo(userId: string): Promise<{
  tier: SubscriptionTier;
  used: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
  isNearLimit: boolean;
}> {
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    throw errors.notFound('User not found');
  }

  const user = userDoc.data() as User;
  const tier = normalizeTier(user.subscriptionTier);
  const limit = COLLECTIONS_LIMITS[tier as keyof typeof COLLECTIONS_LIMITS];
  const used = user.collectionsUsedThisMonth || 0;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
  const percentageUsed = limit === Infinity ? 0 : (used / limit) * 100;
  const isNearLimit = percentageUsed >= 80;

  return {
    tier,
    used,
    limit: limit === Infinity ? 999999 : limit,
    remaining: limit === Infinity ? 999999 : remaining,
    percentageUsed,
    isNearLimit,
  };
}

/**
 * Helper: Suggest next tier for upgrade based on current tier
 */
function getSuggestedTierForUpgrade(currentTier: SubscriptionTier): SubscriptionTier {
  const tierOrder: SubscriptionTier[] = ['free', 'starter', 'growth', 'pro'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) {
    return 'business'; // Already at top or unknown tier
  }

  return tierOrder[currentIndex + 1];
}

/**
 * Helper: Suggest tier based on feature requirement
 */
function getSuggestedTierForFeature(feature: ClerkFeature): SubscriptionTier {
  if (
    feature === 'physical_letters_15_per_month' ||
    feature === 'ai_voice_calls_20_per_month' ||
    feature === 'collections_unlimited' ||
    feature === 'dedicated_account_manager'
  ) {
    return 'business';
  }

  if (
    feature === 'sms_reminders' ||
    feature === 'ai_voice_calls_5_per_month' ||
    feature === 'collections_limit_25' ||
    feature === 'advanced_analytics'
  ) {
    return 'pro';
  }

  if (feature === 'collections_limit_10') {
    return 'starter';
  }

  return 'pro'; // Default to Pro for unknown features
}

/**
 * Check if user can upgrade to a specific tier
 * Used to validate upgrade paths (can't downgrade, founding members locked in)
 */
export async function canUpgradeToTier(
  userId: string,
  targetTier: SubscriptionTier
): Promise<{
  canUpgrade: boolean;
  reason?: string;
}> {
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    return {
      canUpgrade: false,
      reason: 'User not found',
    };
  }

  const user = userDoc.data() as User;
  const currentTier = normalizeTier(user.subscriptionTier);
  const currentLevel = TIER_LEVELS[currentTier as keyof typeof TIER_LEVELS];
  const targetLevel = TIER_LEVELS[targetTier as keyof typeof TIER_LEVELS];

  // Can't downgrade
  if (targetLevel <= currentLevel) {
    return {
      canUpgrade: false,
      reason: 'Cannot downgrade to a lower tier. Please contact support to change your plan.',
    };
  }

  // Founding members are locked into their pricing but can still upgrade
  if (user.isFoundingMember) {
    return {
      canUpgrade: true,
      reason: 'As a founding member, you will keep your 50% discount on the new tier.',
    };
  }

  return {
    canUpgrade: true,
  };
}

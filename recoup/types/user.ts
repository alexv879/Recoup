/**
 * User tier definitions for Recoup
 * Aligns with subscription plans
 */

export type UserTier = 'free' | 'starter' | 'pro';

/**
 * Feature access matrix by tier
 */
export interface TierFeatures {
  invoiceLimit: number;
  collectionsEnabled: boolean;
  advancedAnalytics: boolean;
  ir35Assessment: boolean;
  voiceCalling: boolean;
  aiExpenseCategorization: 'basic' | 'advanced' | 'premium';
  aiOCR: boolean;
  prioritySupport: boolean;
}

export const TIER_FEATURES: Record<UserTier, TierFeatures> = {
  free: {
    invoiceLimit: 5,
    collectionsEnabled: false,
    advancedAnalytics: false,
    ir35Assessment: false,
    voiceCalling: false,
    aiExpenseCategorization: 'basic',
    aiOCR: true,
    prioritySupport: false
  },
  starter: {
    invoiceLimit: 50,
    collectionsEnabled: true,
    advancedAnalytics: true,
    ir35Assessment: false,
    voiceCalling: false,
    aiExpenseCategorization: 'advanced',
    aiOCR: true,
    prioritySupport: false
  },
  pro: {
    invoiceLimit: Infinity,
    collectionsEnabled: true,
    advancedAnalytics: true,
    ir35Assessment: true,
    voiceCalling: true,
    aiExpenseCategorization: 'premium',
    aiOCR: true,
    prioritySupport: true
  }
};

/**
 * Check if a user has access to a specific feature
 */
export function hasFeatureAccess(tier: UserTier, feature: keyof TierFeatures): boolean {
  return !!TIER_FEATURES[tier][feature];
}

/**
 * Get tier from subscription tier string (handles variations)
 */
export function getTierFromSubscription(subscriptionTier: string): UserTier {
  const normalized = subscriptionTier.toLowerCase();

  if (normalized.includes('pro')) return 'pro';
  if (normalized.includes('starter') || normalized.includes('growth')) return 'starter';

  return 'free';
}

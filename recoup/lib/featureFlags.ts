/**
 * Feature Flag System
 * 
 * Purpose: Enable gradual rollout and A/B testing for new features
 * 
 * Usage:
 * - PRICING_V3_ENABLED: Controls visibility of new 3-tier pricing page
 * - PRICING_MIGRATION_MODE: Tracks migration progress (preview → active → complete)
 * 
 * Phase 2 Task 8
 */

import { db } from '@/lib/firebase';

export type PricingMigrationMode = 'preview' | 'active' | 'complete';

export interface FeatureFlags {
    // Pricing V3 (Phase 2 Task 8)
    PRICING_V3_ENABLED: boolean;
    PRICING_MIGRATION_MODE: PricingMigrationMode;
    PRICING_V3_ROLLOUT_PERCENTAGE: number; // 0-100: gradual rollout percentage

    // Collections Features
    AGENCY_HANDOFF_ENABLED: boolean; // Agency handoff integration (INCOMPLETE - Coming Soon)
    VOICE_AI_ENABLED: boolean; // Voice AI calling feature (BETA - Needs testing)
    SMS_COLLECTIONS_ENABLED: boolean; // SMS collections via Twilio

    // Future flags can be added here
    // Example: EMAIL_SEQUENCE_V2_ENABLED: boolean;
}

// Default feature flags (updated for production readiness - Task 1.1)
const DEFAULT_FLAGS: FeatureFlags = {
    PRICING_V3_ENABLED: true, // ENABLED: Pricing V3 is now the official pricing model
    PRICING_MIGRATION_MODE: 'active', // Migration in active mode
    PRICING_V3_ROLLOUT_PERCENTAGE: 100, // 100% rollout - all users see V3

    // Collections features - disabled by default until fully tested
    AGENCY_HANDOFF_ENABLED: false, // COMING SOON: Integration incomplete (40% built)
    VOICE_AI_ENABLED: false, // BETA: Voice AI needs production testing
    SMS_COLLECTIONS_ENABLED: true, // READY: SMS collections now fully implemented
};

/**
 * Get all feature flags from Firestore
 * 
 * @returns FeatureFlags object with current flag values
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
    try {
        const flagsDoc = await db.collection('system_config').doc('feature_flags').get();

        if (flagsDoc.exists) {
            return { ...DEFAULT_FLAGS, ...flagsDoc.data() } as FeatureFlags;
        }

        return DEFAULT_FLAGS;
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        return DEFAULT_FLAGS;
    }
}

/**
 * Get a specific feature flag value
 * 
 * @param flagName - Name of the feature flag
 * @returns Flag value or default
 */
export async function getFeatureFlag<K extends keyof FeatureFlags>(
    flagName: K
): Promise<FeatureFlags[K]> {
    const flags = await getFeatureFlags();
    return flags[flagName];
}

/**
 * Update feature flags (admin only)
 * 
 * @param updates - Partial FeatureFlags object with updates
 * @returns Success boolean
 */
export async function updateFeatureFlags(
    updates: Partial<FeatureFlags>
): Promise<boolean> {
    try {
        const currentFlags = await getFeatureFlags();

        await db.collection('system_config').doc('feature_flags').set(
            {
                ...currentFlags,
                ...updates,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        console.log('Feature flags updated:', updates);
        return true;
    } catch (error) {
        console.error('Error updating feature flags:', error);
        return false;
    }
}

/**
 * Check if user should see Pricing V3 based on rollout percentage
 * 
 * Uses deterministic hash of user ID to ensure consistent experience
 * 
 * @param userId - Clerk user ID
 * @param rolloutPercentage - 0-100 percentage of users who should see V3
 * @returns true if user should see Pricing V3
 */
export function shouldShowPricingV3(userId: string, rolloutPercentage: number): boolean {
    if (rolloutPercentage >= 100) return true;
    if (rolloutPercentage <= 0) return false;

    // Simple hash function to deterministically assign users to buckets
    const hash = userId.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);

    const bucket = hash % 100;
    return bucket < rolloutPercentage;
}

/**
 * Pricing V3 Migration Helper
 * 
 * Returns appropriate pricing tier based on old tier and migration mode
 * 
 * Migration mapping:
 * - free → starter (with 30-day trial)
 * - paid → growth (legacy catch-all)
 * - starter → starter (already V3)
 * - pro → pro (already V3)
 * - business → pro (upgrade path)
 * 
 * @param oldTier - User's current subscription tier
 * @returns New tier for Pricing V3
 */
export function mapOldTierToV3(
    oldTier: 'free' | 'paid' | 'starter' | 'pro' | 'business'
): 'starter' | 'growth' | 'pro' {
    switch (oldTier) {
        case 'free':
            return 'starter';
        case 'paid':
            return 'growth'; // Legacy tier maps to Growth
        case 'starter':
            return 'starter';
        case 'pro':
            return 'pro';
        case 'business':
            return 'pro'; // Business users upgrade to Pro
        default:
            return 'starter'; // Default fallback
    }
}

/**
 * Get pricing for a tier (monthly or annual)
 * 
 * Based on: pricing-implementation-framework.md §1
 * 
 * @param tier - Tier name
 * @param isAnnual - Whether annual billing
 * @returns Price in GBP
 */
export function getTierPrice(tier: 'starter' | 'growth' | 'pro', isAnnual: boolean): number {
    const monthlyPrices = {
        starter: 19,
        growth: 39,
        pro: 75,
    };

    const annualPrices = {
        starter: 182, // £19 × 12 × 0.8 = £182.40 (rounded down)
        growth: 374, // £39 × 12 × 0.8 = £374.40 (rounded down)
        pro: 720, // £75 × 12 × 0.8 = £720
    };

    return isAnnual ? annualPrices[tier] : monthlyPrices[tier];
}

/**
 * Get collections limit for a tier
 * 
 * @param tier - Tier name
 * @returns Collections per month (null = unlimited)
 */
export function getTierCollectionsLimit(tier: 'starter' | 'growth' | 'pro'): number | null {
    const limits = {
        starter: 10,
        growth: 50,
        pro: null, // Unlimited
    };

    return limits[tier];
}

/**
 * Calculate annual savings
 * 
 * @param tier - Tier name
 * @returns Savings in GBP when paying annually
 */
export function getAnnualSavings(tier: 'starter' | 'growth' | 'pro'): number {
    const monthly = getTierPrice(tier, false);
    const annual = getTierPrice(tier, true);

    return monthly * 12 - annual;
}

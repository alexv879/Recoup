/**
 * Stripe Price ID to Subscription Tier Mapping
 *
 * Maps Stripe price IDs to internal subscription tiers.
 * Update these IDs after creating prices in Stripe Dashboard or via API.
 */

import type { AllTiers } from './pricing';

/**
 * Stripe price IDs for each tier and billing period
 * Set these in environment variables for different environments
 */
export const STRIPE_PRICE_IDS = {
  // Starter tier
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_starter_annual',
  },
  // Growth tier
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || 'price_growth_monthly',
    annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL || 'price_growth_annual',
  },
  // Pro tier
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual',
  },
  // Legacy tiers (if still in use)
  paid: {
    monthly: process.env.STRIPE_PRICE_PAID_MONTHLY || 'price_paid_monthly',
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
    annual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL || 'price_business_annual',
  },
} as const;

/**
 * Add-on price IDs (separate subscriptions)
 */
export const ADDON_PRICE_IDS = {
  // HMRC Making Tax Digital add-on
  hmrc_mtd: {
    monthly: process.env.STRIPE_PRICE_HMRC_ADDON_MONTHLY || 'price_hmrc_mtd_monthly',
    annual: process.env.STRIPE_PRICE_HMRC_ADDON_ANNUAL || 'price_hmrc_mtd_annual',
  },
} as const;

/**
 * Reverse mapping: Stripe price ID -> tier
 */
const PRICE_ID_TO_TIER_MAP = new Map<string, AllTiers>();

// Build the reverse map
Object.entries(STRIPE_PRICE_IDS).forEach(([tier, prices]) => {
  Object.values(prices).forEach((priceId) => {
    PRICE_ID_TO_TIER_MAP.set(priceId, tier as AllTiers);
  });
});

/**
 * Get subscription tier from Stripe price ID
 *
 * @param priceId - Stripe price ID
 * @returns Subscription tier or null if not found
 */
export function getTierFromStripePriceId(priceId: string): AllTiers | null {
  return PRICE_ID_TO_TIER_MAP.get(priceId) || null;
}

/**
 * Get all price IDs for a tier
 *
 * @param tier - Subscription tier
 * @returns Array of Stripe price IDs (monthly and annual if available)
 */
export function getStripePriceIdsForTier(tier: AllTiers): string[] {
  const tierPrices = STRIPE_PRICE_IDS[tier as keyof typeof STRIPE_PRICE_IDS];
  if (!tierPrices) return [];
  return Object.values(tierPrices);
}

/**
 * Check if a price ID is monthly or annual
 *
 * @param priceId - Stripe price ID
 * @returns 'monthly' | 'annual' | null
 */
export function getBillingPeriodFromPriceId(priceId: string): 'monthly' | 'annual' | null {
  for (const [_tier, prices] of Object.entries(STRIPE_PRICE_IDS)) {
    if (prices.monthly === priceId) return 'monthly';
    if ('annual' in prices && prices.annual === priceId) return 'annual';
  }
  return null;
}

/**
 * Get tier from Stripe subscription object
 * Looks at all subscription items and returns the highest tier
 *
 * @param subscription - Stripe subscription object
 * @returns Subscription tier or 'free' as fallback
 */
export function getTierFromSubscription(subscription: { items: { data: Array<{ price: { id: string } }> } }): AllTiers {
  const tierPriority: AllTiers[] = ['pro', 'business', 'growth', 'starter', 'paid'];

  // Extract all price IDs from subscription items
  const priceIds = subscription.items.data.map((item) => item.price.id);

  // Find highest priority tier from price IDs
  for (const tier of tierPriority) {
    for (const priceId of priceIds) {
      if (getTierFromStripePriceId(priceId) === tier) {
        return tier;
      }
    }
  }

  // Fallback to free if no matching price ID found
  return 'free';
}

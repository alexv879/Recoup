/**
 * Pricing Utilities & Calculations
 *
 * Based on: pricing-implementation-framework.md §1-2
 * Research: saas-pricing-optimization-guide.md
 *
 * Pricing V3 Structure:
 * - FREE: 5 collections/month (truly free, not just demo)
 * - Starter: £19/month or £182/year (10 collections)
 * - Growth: £39/month or £374/year (50 collections)
 * - Pro: £75/month or £720/year (unlimited)
 *
 * Optional Add-ons:
 * - HMRC MTD: £20/month or £200/year (VAT submissions, can be added to any tier)
 *
 * Annual discount: 20% (equivalent to 2.4 months free)
 *
 * Phase 2 Task 8
 */

export type PricingTier = 'free' | 'starter' | 'growth' | 'pro';
export type LegacyTier = 'paid' | 'business';
export type AllTiers = PricingTier | LegacyTier;
export type AddonType = 'hmrc_mtd';

export interface TierPricing {
    monthly: number;
    annual: number;
    annualSavings: number;
    collectionsLimit: number | null; // null = unlimited
    teamMembers: number | null; // null = unlimited
    features: string[];
}

export const PRICING_TIERS: Record<PricingTier, TierPricing> = {
    free: {
        monthly: 0,
        annual: 0,
        annualSavings: 0,
        collectionsLimit: 5, // Increased from 1 to 5 - truly usable free tier
        teamMembers: 1,
        features: [
            'Unlimited invoices',
            '5 collections per month',
            'Email reminders',
            'BACS "I Paid" button',
            'Manual payment tracking',
            'Community support',
        ],
    },
    starter: {
        monthly: 19,
        annual: 182, // £19 × 12 × 0.8 = £182.40 (rounded down)
        annualSavings: 46, // £228 - £182 = £46
        collectionsLimit: 10,
        teamMembers: 1,
        features: [
            'Email reminders',
            'Manual collection tracking',
            'Invoice management',
            'Payment claims',
            'Email support (48h response)',
        ],
    },
    growth: {
        monthly: 39,
        annual: 374, // £39 × 12 × 0.8 = £374.40 (rounded down)
        annualSavings: 94, // £468 - £374 = £94
        collectionsLimit: 50,
        teamMembers: 5,
        features: [
            'Smart reminders (Email + SMS + WhatsApp)',
            'Payment verification system',
            'Collections escalation automation',
            'Basic AI analytics',
            'Behavioral email sequences',
            'Email support (24h response)',
        ],
    },
    pro: {
        monthly: 75,
        annual: 720, // £75 × 12 × 0.8 = £720
        annualSavings: 180, // £900 - £720 = £180
        collectionsLimit: null, // Unlimited
        teamMembers: null, // Unlimited
        features: [
            'All channels (Email/SMS/WhatsApp/Phone)',
            'AI-powered recovery strategies',
            'Advanced analytics & insights',
            'Custom escalation workflows',
            'API access & integrations',
            'Dedicated account manager',
            'Priority support (2h response)',
        ],
    },
};

/**
 * Add-on Pricing (HMRC Making Tax Digital)
 *
 * Separate subscription that can be added to any tier
 */
export interface AddonPricing {
    monthly: number;
    annual: number;
    annualSavings: number;
    features: string[];
}

export const ADDON_PRICING: Record<AddonType, AddonPricing> = {
    hmrc_mtd: {
        monthly: 20,
        annual: 200, // £20 × 12 × 0.833 = £200 (17% discount)
        annualSavings: 40, // £240 - £200 = £40
        features: [
            'Unlimited VAT return submissions',
            'Automated obligation tracking',
            'Quarterly deadline reminders',
            'VAT calculation dashboard',
            'HMRC OAuth integration',
            'FCA-compliant audit trail',
        ],
    },
};

/**
 * Get price for a tier
 *
 * @param tier - Tier name
 * @param isAnnual - Whether annual billing
 * @returns Price in GBP
 */
export function getTierPrice(tier: PricingTier, isAnnual: boolean = false): number {
    const pricing = PRICING_TIERS[tier];
    return isAnnual ? pricing.annual : pricing.monthly;
}

/**
 * Get collections limit for a tier
 * 
 * @param tier - Tier name
 * @returns Collections per month (null = unlimited)
 */
export function getTierCollectionsLimit(tier: PricingTier): number | null {
    return PRICING_TIERS[tier].collectionsLimit;
}

/**
 * Get team members limit for a tier
 * 
 * @param tier - Tier name
 * @returns Team members allowed (null = unlimited)
 */
export function getTierTeamMembersLimit(tier: PricingTier): number | null {
    return PRICING_TIERS[tier].teamMembers;
}

/**
 * Calculate annual savings
 * 
 * @param tier - Tier name
 * @returns Savings in GBP when paying annually
 */
export function getAnnualSavings(tier: PricingTier): number {
    return PRICING_TIERS[tier].annualSavings;
}

/**
 * Calculate monthly equivalent price for annual plans
 * 
 * @param tier - Tier name
 * @returns Monthly equivalent price (annual / 12)
 */
export function getMonthlyEquivalentPrice(tier: PricingTier): number {
    return Math.round(PRICING_TIERS[tier].annual / 12);
}

/**
 * Map legacy tier to Pricing V3 tier
 * 
 * Migration mapping:
 * - free → starter (with trial)
 * - paid → growth (legacy catch-all)
 * - business → pro (upgrade path)
 * 
 * @param legacyTier - Old subscription tier
 * @returns Equivalent V3 tier
 */
export function mapLegacyTierToV3(legacyTier: LegacyTier): PricingTier {
    const mapping: Record<LegacyTier, PricingTier> = {
        free: 'starter',
        paid: 'growth',
        business: 'pro',
    };

    return mapping[legacyTier];
}

/**
 * Check if user has exceeded their collections limit
 * 
 * @param tier - User's subscription tier
 * @param collectionsUsed - Collections used this month
 * @returns true if limit exceeded
 */
export function hasExceededCollectionsLimit(
    tier: PricingTier,
    collectionsUsed: number
): boolean {
    const limit = getTierCollectionsLimit(tier);

    // Unlimited tiers never exceed
    if (limit === null) return false;

    return collectionsUsed >= limit;
}

/**
 * Calculate overage cost for additional collections
 * 
 * Based on: pricing-implementation-framework.md (£1-2 per collection)
 * 
 * @param tier - User's subscription tier
 * @param collectionsUsed - Collections used this month
 * @returns Overage cost in GBP
 */
export function calculateOverageCost(
    tier: PricingTier,
    collectionsUsed: number
): number {
    const limit = getTierCollectionsLimit(tier);

    // No overage for unlimited tiers
    if (limit === null) return 0;

    // No overage if under limit
    if (collectionsUsed <= limit) return 0;

    const overage = collectionsUsed - limit;

    // Tiered overage pricing
    if (tier === 'starter') {
        return overage * 2; // £2 per collection for Starter
    } else if (tier === 'growth') {
        return overage * 1.5; // £1.50 per collection for Growth
    }

    return 0; // Pro has unlimited, no overage
}

/**
 * Get recommended upgrade tier
 * 
 * Suggests upgrade if user is consistently hitting limits
 * 
 * @param currentTier - User's current tier
 * @param collectionsUsed - Collections used this month
 * @returns Recommended tier or null if no upgrade needed
 */
export function getRecommendedUpgrade(
    currentTier: PricingTier,
    collectionsUsed: number
): PricingTier | null {
    const limit = getTierCollectionsLimit(currentTier);

    // No upgrade needed for Pro tier
    if (currentTier === 'pro') return null;

    // If no limit, no upgrade needed
    if (limit === null) return null;

    // Recommend upgrade if using >80% of limit
    const usagePercentage = (collectionsUsed / limit) * 100;

    if (usagePercentage >= 80) {
        if (currentTier === 'starter') return 'growth';
        if (currentTier === 'growth') return 'pro';
    }

    return null;
}

/**
 * Calculate LTV (Lifetime Value) for a tier
 * 
 * Assumptions:
 * - Average retention: 12 months (industry standard for SMB SaaS)
 * - Churn rate: ~8.3% per month (1/12)
 * 
 * @param tier - Subscription tier
 * @param isAnnual - Whether annual billing
 * @returns Estimated LTV in GBP
 */
export function calculateLTV(tier: PricingTier, isAnnual: boolean = false): number {
    const monthlyPrice = getTierPrice(tier, false);
    const averageRetentionMonths = 12;

    if (isAnnual) {
        // Annual customers typically have 1.5x longer retention
        return getTierPrice(tier, true) * 1.5;
    }

    return monthlyPrice * averageRetentionMonths;
}

/**
 * Format price for display
 * 
 * @param price - Price in GBP
 * @param showPence - Whether to show .00 decimals
 * @returns Formatted price string (e.g., "£39" or "£39.00")
 */
export function formatPrice(price: number, showPence: boolean = false): string {
    if (showPence || price % 1 !== 0) {
        return `£${price.toFixed(2)}`;
    }
    return `£${price}`;
}

/**
 * Calculate discount percentage for annual plans
 *
 * @param tier - Tier name
 * @returns Discount percentage (e.g., 20 for 20%)
 */
export function getAnnualDiscountPercentage(tier: PricingTier): number {
    const monthly = getTierPrice(tier, false);
    const annual = getTierPrice(tier, true);

    const fullYearCost = monthly * 12;
    const savings = fullYearCost - annual;

    return Math.round((savings / fullYearCost) * 100);
}

// ============================================================================
// NEW: EXPENSE TRACKING & REVENUE RECOVERY PRICING (V4)
// ============================================================================

/**
 * NEW PRICING STRUCTURE (Post-Expense Feature Launch)
 *
 * Focus: Revenue Recovery (Client Recharges + Tax Savings)
 * Positioning: "Find money you're leaving on the table"
 *
 * Tiers:
 * - Free: £0 - Basic expense tracking + invoicing
 * - Pro: £10/month - Unlimited expenses, OCR, advanced features
 * - MTD-Pro: £20/month - All Pro + HMRC quarterly filing
 */

export type ExpensePricingTier = 'free' | 'pro' | 'mtd-pro';

export interface ExpenseTierPricing {
    id: ExpensePricingTier;
    name: string;
    monthly: number;
    annual: number;
    annualSavings: number;

    // Expense limits
    expensesPerMonth: number | null; // null = unlimited
    receiptStorageMB: number;
    ocrProcessing: number | null; // null = unlimited

    // Invoice limits (keep existing functionality)
    invoicesPerMonth: number | null;
    collectionsPerMonth: number | null;
    collectionsChannels: string[];

    // Features
    features: string[];

    // Stripe Price IDs (TODO: Create in Stripe Dashboard)
    stripeMonthlyPriceId?: string;
    stripeYearlyPriceId?: string;
}

export const EXPENSE_PRICING_TIERS: Record<ExpensePricingTier, ExpenseTierPricing> = {
    free: {
        id: 'free',
        name: 'Free',
        monthly: 0,
        annual: 0,
        annualSavings: 0,

        // Expenses
        expensesPerMonth: 50,
        receiptStorageMB: 100,
        ocrProcessing: 10,

        // Invoices (limited)
        invoicesPerMonth: 10,
        collectionsPerMonth: 1,
        collectionsChannels: ['email'],

        features: [
            '50 expenses per month',
            '10 invoices per month',
            'Receipt upload & OCR (10/month)',
            'Billable expense tracking',
            'Revenue recovery dashboard',
            'Basic collections (1/month)',
            'Export data (CSV)',
        ],
    },

    pro: {
        id: 'pro',
        name: 'Pro',
        monthly: 10,
        annual: 96, // 20% discount = £8/month
        annualSavings: 24,

        // Expenses
        expensesPerMonth: null, // Unlimited
        receiptStorageMB: 1000, // 1GB
        ocrProcessing: null, // Unlimited

        // Invoices
        invoicesPerMonth: null, // Unlimited
        collectionsPerMonth: 25,
        collectionsChannels: ['email', 'sms'],

        features: [
            'Unlimited expenses & invoices',
            'Unlimited receipt OCR',
            '1GB receipt storage',
            'Advanced collections (25/month)',
            'Email + SMS reminders',
            'Bulk expense import',
            'AI revenue forecasting',
            'Branded invoices',
            'Client expense reports',
        ],

        stripeMonthlyPriceId: 'price_xxx', // TODO: Replace with real Stripe price IDs
        stripeYearlyPriceId: 'price_yyy',
    },

    'mtd-pro': {
        id: 'mtd-pro',
        name: 'MTD-Pro',
        monthly: 20,
        annual: 192, // 20% discount = £16/month
        annualSavings: 48,

        // All Pro features
        expensesPerMonth: null,
        receiptStorageMB: 1000,
        ocrProcessing: null,
        invoicesPerMonth: null,
        collectionsPerMonth: null, // Unlimited
        collectionsChannels: ['email', 'sms', 'phone'],

        features: [
            'All Pro features',
            'HMRC quarterly submissions',
            'VAT filing integration',
            'Annual tax declarations',
            'Audit-proof digital records',
            'Compliance reports',
            'Priority support',
            'Early access to new features',
        ],

        stripeMonthlyPriceId: 'price_zzz', // TODO: Replace with real Stripe price IDs
        stripeYearlyPriceId: 'price_aaa',
    },
};

/**
 * Get expense pricing for a tier
 */
export function getExpenseTierPrice(tier: ExpensePricingTier, isAnnual: boolean = false): number {
    const pricing = EXPENSE_PRICING_TIERS[tier];
    return isAnnual ? pricing.annual : pricing.monthly;
}

/**
 * Get expense limit for a tier
 */
export function getExpensesLimit(tier: ExpensePricingTier): number | null {
    return EXPENSE_PRICING_TIERS[tier].expensesPerMonth;
}

/**
 * Check if user has exceeded expense limit
 */
export function hasExceededExpenseLimit(
    tier: ExpensePricingTier,
    expensesUsed: number
): boolean {
    const limit = getExpensesLimit(tier);

    // Unlimited tiers never exceed
    if (limit === null) return false;

    return expensesUsed >= limit;
}

/**
 * Get recommended expense tier upgrade
 */
export function getRecommendedExpenseTierUpgrade(
    currentTier: ExpensePricingTier,
    expensesUsed: number
): ExpensePricingTier | null {
    // Already on top tier
    if (currentTier === 'mtd-pro') return null;

    const limit = getExpensesLimit(currentTier);

    // No limit = no upgrade needed
    if (limit === null) return null;

    // Recommend upgrade if using >80% of limit
    const usagePercentage = (expensesUsed / limit) * 100;

    if (usagePercentage >= 80) {
        if (currentTier === 'free') return 'pro';
        if (currentTier === 'pro') return 'mtd-pro';
    }

    return null;
}

/**
 * Format expense tier for display
 */
export function formatExpenseTier(tier: ExpensePricingTier): string {
    const tierMap: Record<ExpensePricingTier, string> = {
        free: 'Free',
        pro: 'Pro',
        'mtd-pro': 'MTD-Pro',
    };

    return tierMap[tier];
}

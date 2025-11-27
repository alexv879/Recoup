// Central subscription plan config for Clerk/Stripe sync, UI, and API
// Used for pricing page, plan selection, and backend enforcement

export type SubscriptionPlan = {
    id: string; // Local plan ID
    clerkPlanId?: string; // Clerk plan ID (if applicable)
    stripeProductId?: string; // Stripe product ID
    stripePriceId?: string; // Stripe price ID (for subscription mapping)
    name: string;
    description: string;
    monthlyPrice: number;
    annualPrice?: number;
    foundingMemberPrice?: number;
    collectionsLimit: number | null; // null = unlimited
    features: string[];
    isFoundingMemberEligible?: boolean;
    tier?: 'free' | 'starter' | 'growth' | 'pro'; // Pricing tier
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Free',
        description: 'Unlimited invoicing, 1 free collection/month, email reminders',
        monthlyPrice: 0,
        collectionsLimit: 1,
        features: [
            'Unlimited invoices',
            '1 free collection per month',
            'Email reminders',
            'BACS verification',
        ],
    },
    {
        id: 'starter',
        name: 'Starter',
        description: '10 collections/month, email reminders only',
        monthlyPrice: 24,
        foundingMemberPrice: 12,
        collectionsLimit: 10,
        features: [
            '10 collections per month',
            'Email reminders',
            'Custom reminder templates',
            'BACS verification',
        ],
        isFoundingMemberEligible: true,
    },
    {
        id: 'pro',
        name: 'Pro',
        description: '25 collections/month, email + SMS + 5 AI calls',
        monthlyPrice: 45,
        foundingMemberPrice: 22,
        collectionsLimit: 25,
        features: [
            '25 collections per month',
            'Email + SMS reminders',
            '5 AI voice calls',
            'Advanced analytics',
            'Priority support',
        ],
        isFoundingMemberEligible: true,
    },
    {
        id: 'business',
        name: 'Business',
        description: 'Unlimited collections, email + SMS + 20 AI calls + 15 letters/month',
        monthlyPrice: 150,
        foundingMemberPrice: 75,
        collectionsLimit: null,
        features: [
            'Unlimited collections',
            'Email + SMS reminders',
            '20 AI voice calls',
            '15 physical letters per month',
            'Agency escalation',
            'Priority support',
        ],
        isFoundingMemberEligible: true,
    },
];

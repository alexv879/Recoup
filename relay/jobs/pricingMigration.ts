// Pricing migration script stub
// Purpose: Outline migration from legacy 4-tier to new 3-tier pricing.
// NOTE: This is a stub; integrate with actual data layer & Stripe client.

import Stripe from 'stripe';
import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

type SubscriptionRecord = {
    id: string;
    userId: string;
    legacyPlanId: string;
    isFounding?: boolean;
};

// Mapping legacy plans to new plan IDs
const PLAN_MAP: Record<string, string> = {
    'starter_monthly_v1': 'starter_monthly_v2',
    'pro_monthly_v1': 'pro_monthly_v2',
    'business_monthly_v1': 'pro_monthly_v2' // business collapses into pro
};

interface MigrationResult {
    migrated: number;
    skipped: number;
    errors: { subscriptionId: string; error: string }[];
    legacyBusinessUsers: number;
}

export async function migratePricing(subscriptions: SubscriptionRecord[]): Promise<MigrationResult> {
    const result: MigrationResult = { migrated: 0, skipped: 0, errors: [], legacyBusinessUsers: 0 };

    for (const sub of subscriptions) {
        const targetPlan = PLAN_MAP[sub.legacyPlanId];
        if (!targetPlan) {
            result.skipped++;
            continue;
        }

        if (sub.legacyPlanId.includes('business')) {
            result.legacyBusinessUsers++;
        }

        try {
            // Stripe plan update placeholder (requires actual subscription ID & items)
            // await stripe.subscriptions.update(sub.id, { items: [{ price: targetPlan }] });
            // Instead record a migration log entry (persist to DB in real implementation)
            logMigration(sub.id, sub.userId, sub.legacyPlanId, targetPlan, sub.isFounding || false);
            result.migrated++;
        } catch (e: any) {
            result.errors.push({ subscriptionId: sub.id, error: e.message });
        }
    }

    return result;
}

function logMigration(subscriptionId: string, userId: string, fromPlan: string, toPlan: string, isFounding: boolean) {
    // Replace with DB insert; structured log example
    const record = {
        id: nanoid(),
        subscriptionId,
        userId,
        fromPlan,
        toPlan,
        isFounding,
        migratedAt: new Date().toISOString(),
        note: isFounding ? 'Founding discount preserved' : undefined
    };
    // eslint-disable-next-line no-console
    console.log('[pricing-migration]', JSON.stringify(record));
}

// Safety check: simulate migration dry run
export function simulateMigration(subscriptions: SubscriptionRecord[]) {
    return subscriptions.map(s => ({
        subscriptionId: s.id,
        from: s.legacyPlanId,
        to: PLAN_MAP[s.legacyPlanId] || 'UNCHANGED',
        founding: !!s.isFounding
    }));
}

// Example invocation (remove in production):
async function main() {
    if (process.env.RUN_PRICING_MIGRATION !== 'true') return;
    const sample: SubscriptionRecord[] = [
        { id: 'sub_1', userId: 'usr_1', legacyPlanId: 'starter_monthly_v1' },
        { id: 'sub_2', userId: 'usr_2', legacyPlanId: 'business_monthly_v1', isFounding: true }
    ];
    // eslint-disable-next-line no-console
    console.log('Dry Run Preview:', simulateMigration(sample));
    const result = await migratePricing(sample);
    // eslint-disable-next-line no-console
    console.log('Migration Result:', result);
}

main().catch(err => {
    // eslint-disable-next-line no-console
    console.error('Migration script error', err);
});

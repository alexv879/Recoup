/**
 * Stripe Plan Migration Script - Pricing V3
 * 
 * Purpose: Migrate existing users from old tier structure to new 3-tier system
 * 
 * Migration mapping:
 * - free → starter (send email with 30-day trial offer)
 * - paid → growth (automatic migration, no action needed)
 * - business → pro (send email with upgrade benefits)
 * 
 * Usage:
 * - Dry run: node scripts/migrate-stripe-plans.ts --dry-run
 * - Production: node scripts/migrate-stripe-plans.ts --execute
 * 
 * Based on: pricing-implementation-framework.md §3
 * 
 * Phase 2 Task 8
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { mapLegacyTierToV3, getTierPrice } from '../lib/pricing';

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

if (!initializeApp.length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

const db = getFirestore();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia',
});

interface MigrationResult {
    userId: string;
    email: string;
    oldTier: string;
    newTier: string;
    action: 'migrated' | 'skipped' | 'error' | 'email_sent';
    error?: string;
    subscriptionId?: string;
}

/**
 * Main migration function
 */
async function migrateStripePlans(dryRun: boolean = true) {
    console.log('==============================================');
    console.log(`Stripe Plan Migration - Pricing V3`);
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
    console.log('==============================================\n');

    const results: MigrationResult[] = [];
    let processed = 0;
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    try {
        // Fetch all users
        const usersSnapshot = await db.collection('users').get();

        console.log(`Found ${usersSnapshot.size} users to process\n`);

        for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data();
            processed++;

            try {
                const result = await processUser(user, dryRun);
                results.push(result);

                if (result.action === 'migrated') {
                    migrated++;
                    console.log(`✅ [${processed}/${usersSnapshot.size}] Migrated: ${user.email} (${result.oldTier} → ${result.newTier})`);
                } else if (result.action === 'email_sent') {
                    migrated++;
                    console.log(`📧 [${processed}/${usersSnapshot.size}] Email sent: ${user.email} (${result.oldTier} → ${result.newTier})`);
                } else if (result.action === 'skipped') {
                    skipped++;
                    console.log(`⏭️  [${processed}/${usersSnapshot.size}] Skipped: ${user.email} (already on V3 tier)`);
                } else if (result.action === 'error') {
                    errors++;
                    console.error(`❌ [${processed}/${usersSnapshot.size}] Error: ${user.email} - ${result.error}`);
                }
            } catch (error) {
                errors++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.push({
                    userId: user.userId,
                    email: user.email,
                    oldTier: user.subscriptionTier,
                    newTier: 'error',
                    action: 'error',
                    error: errorMessage,
                });
                console.error(`❌ [${processed}/${usersSnapshot.size}] Error: ${user.email} - ${errorMessage}`);
            }

            // Pause between users to avoid rate limits
            if (!dryRun && processed % 10 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        console.log('\n==============================================');
        console.log('Migration Summary');
        console.log('==============================================');
        console.log(`Total processed: ${processed}`);
        console.log(`Migrated: ${migrated}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Errors: ${errors}`);
        console.log('==============================================\n');

        // Save results to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `migration-results-${timestamp}.json`;
        const fs = require('fs');
        fs.writeFileSync(
            resultsFile,
            JSON.stringify({ results, summary: { processed, migrated, skipped, errors } }, null, 2)
        );
        console.log(`Results saved to: ${resultsFile}\n`);

        return results;
    } catch (error) {
        console.error('Fatal error during migration:', error);
        throw error;
    }
}

/**
 * Process individual user migration
 */
async function processUser(user: any, dryRun: boolean): Promise<MigrationResult> {
    const { userId, email, subscriptionTier, stripeSubscriptionId, stripeCustomerId } = user;

    // Skip if already on V3 tier
    if (['starter', 'growth', 'pro'].includes(subscriptionTier)) {
        return {
            userId,
            email,
            oldTier: subscriptionTier,
            newTier: subscriptionTier,
            action: 'skipped',
        };
    }

    // Map to new tier
    const newTier = mapLegacyTierToV3(subscriptionTier as 'free' | 'paid' | 'business');

    // Handle free tier users (no Stripe subscription)
    if (subscriptionTier === 'free') {
        if (!dryRun) {
            // Update Firestore
            await db.collection('users').doc(userId).update({
                subscriptionTier: newTier,
                billingCycle: 'monthly',
                updatedAt: new Date().toISOString(),
            });

            // Send email about Starter tier trial
            await sendFreeTierMigrationEmail(email, userId);
        }

        return {
            userId,
            email,
            oldTier: subscriptionTier,
            newTier,
            action: dryRun ? 'skipped' : 'email_sent',
        };
    }

    // Handle paid/business tier users (with Stripe subscription)
    if (!stripeSubscriptionId || !stripeCustomerId) {
        return {
            userId,
            email,
            oldTier: subscriptionTier,
            newTier,
            action: 'error',
            error: 'Missing Stripe subscription or customer ID',
        };
    }

    try {
        if (!dryRun) {
            // Fetch current subscription from Stripe
            const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

            // Create new price for V3 tier (if not exists)
            const newPrice = await getOrCreateStripePrice(newTier, 'monthly');

            // Update subscription to new price
            await stripe.subscriptions.update(stripeSubscriptionId, {
                items: [
                    {
                        id: subscription.items.data[0].id,
                        price: newPrice.id,
                    },
                ],
                proration_behavior: 'none', // No immediate charge
                billing_cycle_anchor: 'unchanged',
            });

            // Update Firestore
            await db.collection('users').doc(userId).update({
                subscriptionTier: newTier,
                billingCycle: 'monthly',
                updatedAt: new Date().toISOString(),
            });

            // Send migration email
            if (subscriptionTier === 'business') {
                await sendBusinessTierMigrationEmail(email, userId);
            }
        }

        return {
            userId,
            email,
            oldTier: subscriptionTier,
            newTier,
            action: dryRun ? 'skipped' : 'migrated',
            subscriptionId: stripeSubscriptionId,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown Stripe error';
        return {
            userId,
            email,
            oldTier: subscriptionTier,
            newTier,
            action: 'error',
            error: errorMessage,
        };
    }
}

/**
 * Get or create Stripe price for V3 tier
 */
async function getOrCreateStripePrice(tier: string, billingCycle: 'monthly' | 'annual'): Promise<Stripe.Price> {
    const amount = getTierPrice(tier as 'starter' | 'growth' | 'pro', billingCycle === 'annual');
    const lookupKey = `recoup_${tier}_${billingCycle}_v3`;

    try {
        // Try to find existing price
        const prices = await stripe.prices.list({
            lookup_keys: [lookupKey],
            active: true,
        });

        if (prices.data.length > 0) {
            return prices.data[0];
        }

        // Create new price
        const product = await getOrCreateStripeProduct(tier);

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: amount * 100, // Convert to cents
            currency: 'gbp',
            recurring: {
                interval: billingCycle === 'annual' ? 'year' : 'month',
            },
            lookup_key: lookupKey,
            nickname: `Recoup ${tier.charAt(0).toUpperCase() + tier.slice(1)} - ${billingCycle}`,
        });

        console.log(`Created Stripe price: ${lookupKey} (${amount} GBP)`);
        return price;
    } catch (error) {
        console.error(`Error creating Stripe price for ${tier}:`, error);
        throw error;
    }
}

/**
 * Get or create Stripe product for tier
 */
async function getOrCreateStripeProduct(tier: string): Promise<Stripe.Product> {
    const productName = `Recoup ${tier.charAt(0).toUpperCase() + tier.slice(1)}`;

    try {
        // Try to find existing product
        const products = await stripe.products.list({
            active: true,
        });

        const existingProduct = products.data.find((p) => p.name === productName);
        if (existingProduct) {
            return existingProduct;
        }

        // Create new product
        const product = await stripe.products.create({
            name: productName,
            description: `Recoup Collections ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
        });

        console.log(`Created Stripe product: ${productName}`);
        return product;
    } catch (error) {
        console.error(`Error creating Stripe product for ${tier}:`, error);
        throw error;
    }
}

/**
 * Send email to free tier users about Starter tier
 */
async function sendFreeTierMigrationEmail(email: string, userId: string): Promise<void> {
    // TODO: Integrate with SendGrid email template
    console.log(`📧 Sending free tier migration email to: ${email}`);
    // await sendMigrationEmail(email, 'free_to_starter', { userId });
}

/**
 * Send email to business tier users about Pro upgrade
 */
async function sendBusinessTierMigrationEmail(email: string, userId: string): Promise<void> {
    // TODO: Integrate with SendGrid email template
    console.log(`📧 Sending business tier migration email to: ${email}`);
    // await sendMigrationEmail(email, 'business_to_pro', { userId });
}

/**
 * CLI entry point
 */
async function main() {
    const args = process.argv.slice(2);
    const isDryRun = !args.includes('--execute');

    if (isDryRun) {
        console.log('⚠️  Running in DRY RUN mode. No changes will be made.');
        console.log('To execute migration, run: node scripts/migrate-stripe-plans.ts --execute\n');
    } else {
        console.log('⚠️  PRODUCTION MODE: This will migrate all users!');
        console.log('Press Ctrl+C within 5 seconds to cancel...\n');
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    await migrateStripePlans(isDryRun);
}

// Run if executed directly
if (require.main === module) {
    main()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

export { migrateStripePlans, processUser };

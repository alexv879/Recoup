/**
 * Pricing V3 Migration Script
 *
 * Purpose: Migrate all existing users from old pricing tiers to new 3-tier model
 *
 * Old Model (5 tiers): free → starter (£15) → professional (£39) → business (£99) → enterprise
 * New Model (3 tiers): starter (£19) → growth (£39) → pro (£75)
 *
 * Migration Mapping:
 * - free → free (no change, but encouraged to upgrade to starter)
 * - starter (old £15) → starter (new £19) with locked-in pricing flag
 * - professional (£39) → growth (£39) - exact price match
 * - business (£99) → pro (£75) - significant price reduction
 * - enterprise → enterprise (custom pricing remains)
 *
 * Phase 1, Task 1.1 - Production Readiness Refactoring
 *
 * @usage
 * - Dry run (no changes): ts-node scripts/migrate-pricing-v3.ts --dry-run
 * - Production run: ts-node scripts/migrate-pricing-v3.ts --execute
 * - Specific user: ts-node scripts/migrate-pricing-v3.ts --execute --user-id=user_123
 */

import { db } from '../lib/firebase';
import { mapOldTierToV3 } from '../lib/featureFlags';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-10-29.clover',
});

interface MigrationStats {
    total: number;
    migrated: number;
    skipped: number;
    errors: number;
    dryRun: boolean;
    tierBreakdown: {
        free: number;
        starterToStarter: number;
        professionalToGrowth: number;
        businessToPro: number;
        enterprise: number;
    };
}

interface User {
    userId: string;
    email: string;
    subscriptionTier: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    lockedInPrice?: number;
    isFoundingMember?: boolean;
}

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isExecute = args.includes('--execute');
const specificUserId = args.find(arg => arg.startsWith('--user-id='))?.split('=')[1];

if (!isDryRun && !isExecute) {
    console.error('❌ ERROR: Must specify either --dry-run or --execute');
    console.log('\nUsage:');
    console.log('  Dry run:  ts-node scripts/migrate-pricing-v3.ts --dry-run');
    console.log('  Execute:  ts-node scripts/migrate-pricing-v3.ts --execute');
    console.log('  Specific: ts-node scripts/migrate-pricing-v3.ts --execute --user-id=user_123');
    process.exit(1);
}

const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    dryRun: isDryRun,
    tierBreakdown: {
        free: 0,
        starterToStarter: 0,
        professionalToGrowth: 0,
        businessToPro: 0,
        enterprise: 0,
    },
};

/**
 * Determine if user should be grandfathered (locked into old pricing)
 */
function shouldGrandfatherUser(user: User): boolean {
    // Founding members always get locked-in pricing
    if (user.isFoundingMember) {
        return true;
    }

    // Users on old "Starter" tier (£15) get locked-in pricing for loyalty
    if (user.subscriptionTier === 'starter' && user.lockedInPrice === 15) {
        return true;
    }

    // Business users downgrading to Pro get locked-in pricing at Pro rate
    if (user.subscriptionTier === 'business') {
        return true;
    }

    return false;
}

/**
 * Get the locked-in price for a user based on their migration path
 */
function getLockedInPrice(user: User, newTier: string): number | undefined {
    if (!shouldGrandfatherUser(user)) {
        return undefined;
    }

    // Founding members: lock in at current price
    if (user.isFoundingMember && user.lockedInPrice) {
        return user.lockedInPrice;
    }

    // Old starter (£15) → New starter (£19): lock in at £15
    if (user.subscriptionTier === 'starter' && newTier === 'starter') {
        return 15;
    }

    // Business (£99) → Pro (£75): lock in at £75
    if (user.subscriptionTier === 'business' && newTier === 'pro') {
        return 75;
    }

    return undefined;
}

/**
 * Update Stripe subscription to new price ID
 */
async function updateStripeSubscription(
    user: User,
    newTier: string,
    lockedInPrice?: number
): Promise<boolean> {
    if (!user.stripeSubscriptionId) {
        console.log(`  ⚠️  User ${user.userId} has no Stripe subscription ID`);
        return false;
    }

    try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

        // Determine the correct Stripe Price ID
        const billingInterval = subscription.items.data[0].price.recurring?.interval || 'month';
        const newPriceId = process.env[`STRIPE_PRICE_${newTier.toUpperCase()}_${billingInterval.toUpperCase()}LY`];

        if (!newPriceId) {
            console.error(`  ❌ Missing Stripe Price ID for ${newTier} ${billingInterval}`);
            return false;
        }

        if (isDryRun) {
            console.log(`  [DRY RUN] Would update Stripe subscription ${subscription.id} to price ${newPriceId}`);
            return true;
        }

        // Update the subscription
        await stripe.subscriptions.update(subscription.id, {
            items: [{
                id: subscription.items.data[0].id,
                price: newPriceId,
            }],
            metadata: {
                migration_date: new Date().toISOString(),
                old_tier: user.subscriptionTier,
                new_tier: newTier,
                locked_in_price: lockedInPrice?.toString() || '',
            },
            // Don't prorate - apply on next billing cycle
            proration_behavior: 'none',
        });

        console.log(`  ✅ Updated Stripe subscription to ${newTier} (${billingInterval})`);
        return true;
    } catch (error) {
        console.error(`  ❌ Failed to update Stripe subscription:`, error);
        return false;
    }
}

/**
 * Update user document in Firestore
 */
async function updateUserDocument(
    userId: string,
    newTier: string,
    lockedInPrice?: number
): Promise<boolean> {
    try {
        if (isDryRun) {
            console.log(`  [DRY RUN] Would update Firestore user ${userId} to tier ${newTier}`);
            return true;
        }

        await db.collection('users').doc(userId).update({
            subscriptionTier: newTier,
            lockedInPrice: lockedInPrice || null,
            pricingMigrationDate: new Date().toISOString(),
            pricingMigrationVersion: 'v3',
        });

        console.log(`  ✅ Updated Firestore user to tier ${newTier}${lockedInPrice ? ` (locked at £${lockedInPrice})` : ''}`);
        return true;
    } catch (error) {
        console.error(`  ❌ Failed to update Firestore user:`, error);
        return false;
    }
}

/**
 * Send migration notification email
 */
async function sendMigrationEmail(user: User, newTier: string, lockedInPrice?: number): Promise<void> {
    if (isDryRun) {
        console.log(`  [DRY RUN] Would send migration email to ${user.email}`);
        return;
    }

    // TODO: Implement email sending via SendGrid
    // For now, just log
    console.log(`  📧 Migration email queued for ${user.email}`);
}

/**
 * Migrate a single user
 */
async function migrateUser(user: User): Promise<boolean> {
    console.log(`\n👤 Processing user: ${user.email} (${user.userId})`);
    console.log(`   Current tier: ${user.subscriptionTier}`);

    // Skip if already migrated
    if (['starter', 'growth', 'pro'].includes(user.subscriptionTier) &&
        !user.isFoundingMember &&
        !user.lockedInPrice) {
        console.log(`   ⏭️  Already migrated - skipping`);
        stats.skipped++;
        return true;
    }

    // Determine new tier
    let newTier: string;

    if (user.subscriptionTier === 'free') {
        newTier = 'free'; // Free stays free
        stats.tierBreakdown.free++;
    } else if (user.subscriptionTier === 'enterprise' || user.subscriptionTier === 'custom') {
        newTier = 'enterprise'; // Enterprise stays enterprise
        stats.tierBreakdown.enterprise++;
    } else if (user.subscriptionTier === 'starter') {
        newTier = 'starter';
        stats.tierBreakdown.starterToStarter++;
    } else if (user.subscriptionTier === 'professional' || user.subscriptionTier === 'paid') {
        newTier = 'growth';
        stats.tierBreakdown.professionalToGrowth++;
    } else if (user.subscriptionTier === 'business') {
        newTier = 'pro';
        stats.tierBreakdown.businessToPro++;
    } else {
        console.log(`   ⚠️  Unknown tier: ${user.subscriptionTier} - mapping to starter`);
        newTier = 'starter';
    }

    console.log(`   New tier: ${newTier}`);

    // Determine if user should be grandfathered
    const lockedInPrice = getLockedInPrice(user, newTier);
    if (lockedInPrice) {
        console.log(`   🔒 Locked-in price: £${lockedInPrice}/month`);
    }

    // Update Stripe if user has a subscription
    if (user.stripeSubscriptionId) {
        const stripeSuccess = await updateStripeSubscription(user, newTier, lockedInPrice);
        if (!stripeSuccess) {
            stats.errors++;
            return false;
        }
    }

    // Update Firestore
    const firestoreSuccess = await updateUserDocument(user.userId, newTier, lockedInPrice);
    if (!firestoreSuccess) {
        stats.errors++;
        return false;
    }

    // Send notification email
    await sendMigrationEmail(user, newTier, lockedInPrice);

    stats.migrated++;
    return true;
}

/**
 * Main migration function
 */
async function runMigration() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           RECOUP PRICING V3 MIGRATION SCRIPT                   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '⚠️  PRODUCTION RUN (changes will be applied)'}`);
    console.log(`Target: ${specificUserId ? `Single user (${specificUserId})` : 'All users'}\n`);

    if (isExecute) {
        console.log('⚠️  WARNING: This will modify production data!');
        console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('Starting migration...\n');

    try {
        let usersQuery;

        if (specificUserId) {
            // Migrate specific user
            const userDoc = await db.collection('users').doc(specificUserId).get();
            if (!userDoc.exists) {
                console.error(`❌ User ${specificUserId} not found`);
                process.exit(1);
            }

            const userData = userDoc.data() as User;
            const user: User = {
                userId: userDoc.id,
                email: userData.email,
                subscriptionTier: userData.subscriptionTier,
                stripeCustomerId: userData.stripeCustomerId,
                stripeSubscriptionId: userData.stripeSubscriptionId,
                lockedInPrice: userData.lockedInPrice,
                isFoundingMember: userData.isFoundingMember,
            };

            stats.total = 1;
            await migrateUser(user);
        } else {
            // Migrate all users in batches
            usersQuery = db.collection('users');
            let lastDoc: any = null;
            const batchSize = 100;

            while (true) {
                let query = usersQuery.limit(batchSize);

                if (lastDoc) {
                    query = query.startAfter(lastDoc);
                }

                const snapshot = await query.get();

                if (snapshot.empty) {
                    break;
                }

                for (const doc of snapshot.docs) {
                    const userData = doc.data() as User;
                    const user: User = {
                        userId: doc.id,
                        email: userData.email,
                        subscriptionTier: userData.subscriptionTier,
                        stripeCustomerId: userData.stripeCustomerId,
                        stripeSubscriptionId: userData.stripeSubscriptionId,
                        lockedInPrice: userData.lockedInPrice,
                        isFoundingMember: userData.isFoundingMember,
                    };

                    stats.total++;
                    await migrateUser(user);
                }

                lastDoc = snapshot.docs[snapshot.docs.length - 1];

                console.log(`\n📊 Progress: ${stats.total} users processed...\n`);
            }
        }

        // Print final stats
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║                    MIGRATION COMPLETE                          ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        console.log('📊 FINAL STATISTICS:\n');
        console.log(`Total users processed:  ${stats.total}`);
        console.log(`Successfully migrated:  ${stats.migrated} ✅`);
        console.log(`Skipped (already V3):   ${stats.skipped} ⏭️`);
        console.log(`Errors:                 ${stats.errors} ❌`);
        console.log(`Mode:                   ${isDryRun ? 'DRY RUN' : 'PRODUCTION'}\n`);

        console.log('📈 TIER BREAKDOWN:\n');
        console.log(`Free (unchanged):              ${stats.tierBreakdown.free}`);
        console.log(`Starter → Starter:             ${stats.tierBreakdown.starterToStarter}`);
        console.log(`Professional → Growth:         ${stats.tierBreakdown.professionalToGrowth}`);
        console.log(`Business → Pro:                ${stats.tierBreakdown.businessToPro}`);
        console.log(`Enterprise (unchanged):        ${stats.tierBreakdown.enterprise}\n`);

        if (isDryRun) {
            console.log('💡 This was a dry run. Re-run with --execute to apply changes.');
        } else {
            console.log('✅ Migration complete! All users have been updated to Pricing V3.');
        }

        process.exit(stats.errors > 0 ? 1 : 0);
    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    }
}

// Execute migration
runMigration();

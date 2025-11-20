/**
 * Setup Stripe Products and Prices
 * Run this script once to create Stripe products and prices for all subscription tiers
 *
 * Usage:
 *   npm run setup-stripe -- --test (for test mode)
 *   npm run setup-stripe -- --live (for live mode)
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-10-29.clover',
});

interface PricingPlan {
    tier: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    description: string;
}

const PRICING_PLANS: PricingPlan[] = [
    {
        tier: 'free',
        name: 'Free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        description: 'Perfect for getting started with up to 5 clients',
    },
    {
        tier: 'starter',
        name: 'Starter',
        monthlyPrice: 9,
        yearlyPrice: 90, // £90/year = £7.50/month (17% discount)
        description: 'For growing freelancers managing up to 15 clients',
    },
    {
        tier: 'professional',
        name: 'Professional',
        monthlyPrice: 19,
        yearlyPrice: 190, // £190/year = £15.83/month (17% discount)
        description: 'Complete toolkit with AI features for established freelancers',
    },
];

async function setupStripeProducts() {
    console.log('🚀 Setting up Stripe products and prices...\n');

    const priceMapping: Record<string, { monthly: string; yearly: string }> = {};

    for (const plan of PRICING_PLANS) {
        console.log(`\n📦 Creating product: ${plan.name} (${plan.tier})`);

        try {
            // Create or retrieve product
            const product = await stripe.products.create({
                name: `Recoup ${plan.name}`,
                description: plan.description,
                metadata: {
                    tier: plan.tier,
                },
            });

            console.log(`   ✅ Product created: ${product.id}`);

            // Create monthly price (if not free)
            let monthlyPriceId = '';
            if (plan.monthlyPrice > 0) {
                const monthlyPrice = await stripe.prices.create({
                    product: product.id,
                    unit_amount: plan.monthlyPrice * 100, // Convert to pence
                    currency: 'gbp',
                    recurring: {
                        interval: 'month',
                    },
                    metadata: {
                        tier: plan.tier,
                        billing: 'monthly',
                    },
                });

                monthlyPriceId = monthlyPrice.id;
                console.log(`   ✅ Monthly price created: ${monthlyPriceId} (£${plan.monthlyPrice}/month)`);
            } else {
                console.log(`   ℹ️  Free tier - no price needed`);
            }

            // Create yearly price (if not free)
            let yearlyPriceId = '';
            if (plan.yearlyPrice > 0) {
                const yearlyPrice = await stripe.prices.create({
                    product: product.id,
                    unit_amount: plan.yearlyPrice * 100, // Convert to pence
                    currency: 'gbp',
                    recurring: {
                        interval: 'year',
                    },
                    metadata: {
                        tier: plan.tier,
                        billing: 'yearly',
                    },
                });

                yearlyPriceId = yearlyPrice.id;
                console.log(`   ✅ Yearly price created: ${yearlyPriceId} (£${plan.yearlyPrice}/year)`);
            }

            if (monthlyPriceId || yearlyPriceId) {
                priceMapping[plan.tier] = {
                    monthly: monthlyPriceId,
                    yearly: yearlyPriceId,
                };
            }
        } catch (error: any) {
            console.error(`   ❌ Error creating ${plan.name}:`, error.message);
        }
    }

    console.log('\n\n🎉 Setup complete!\n');
    console.log('📋 Price ID Mapping for your .env file:\n');
    console.log('# Stripe Price IDs');

    Object.entries(priceMapping).forEach(([tier, prices]) => {
        const tierUpper = tier.toUpperCase();
        console.log(`STRIPE_PRICE_${tierUpper}_MONTHLY=${prices.monthly}`);
        console.log(`STRIPE_PRICE_${tierUpper}_YEARLY=${prices.yearly}`);
    });

    console.log('\n📝 Add this mapping to your webhook handler:\n');
    console.log('const STRIPE_PRICE_TO_TIER: Record<string, SubscriptionTier> = {');
    Object.entries(priceMapping).forEach(([tier, prices]) => {
        console.log(`  '${prices.monthly}': '${tier}',`);
        console.log(`  '${prices.yearly}': '${tier}',`);
    });
    console.log('};\n');

    return priceMapping;
}

// Run the script
setupStripeProducts()
    .then(() => {
        console.log('✅ All done! Update your .env and webhook handler with the price IDs above.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

// Stripe product/price sync utility and webhook handler stub
// Syncs Stripe products/prices with local config and handles subscription events

import Stripe from 'stripe';
import { SUBSCRIPTION_PLANS } from './subscriptionPlans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
});

export async function syncStripeProducts(): Promise<void> {
    for (const plan of SUBSCRIPTION_PLANS) {
        // Check if product exists
        let product = null;
        const products = await stripe.products.list({ limit: 100 });
        product = products.data.find(p => p.name === plan.name);
        if (!product) {
            // Create product
            product = await stripe.products.create({
                name: plan.name,
                description: plan.description,
            });
        }
        // Check if price exists
        const prices = await stripe.prices.list({ product: product.id, limit: 100 });
        const monthlyPrice = prices.data.find(p => p.unit_amount === plan.monthlyPrice * 100 && p.recurring?.interval === 'month');
        if (!monthlyPrice) {
            await stripe.prices.create({
                product: product.id,
                unit_amount: plan.monthlyPrice * 100,
                currency: 'gbp',
                recurring: { interval: 'month' },
            });
        }
        // Optionally handle annual and founding member prices
    }
}

/**
 * Webhook handler for subscription events
 *
 * NOTE: This is a legacy stub. All webhook handling is now done in:
 * /app/api/webhook/stripe/route.ts
 *
 * That handler implements:
 * - customer.subscription.created -> Updates user tier and enables features
 * - customer.subscription.updated -> Tracks tier changes and upgrades/downgrades
 * - customer.subscription.deleted -> Downgrades to free tier
 * - checkout.session.completed -> Activates subscription
 * - invoice.payment_succeeded -> Records recurring payment
 *
 * This function is kept for backwards compatibility but should not be used.
 * @deprecated Use /app/api/webhook/stripe/route.ts instead
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
    console.warn('DEPRECATED: handleStripeWebhook() called. Use /app/api/webhook/stripe/route.ts instead');

    // All subscription lifecycle events are now handled in the main webhook route:
    // - customer.subscription.created: Creates subscription, maps price to tier, enables features
    // - customer.subscription.updated: Updates tier on upgrade/downgrade
    // - customer.subscription.deleted: Downgrades user to free tier

    // This stub does nothing - the real implementation is in /app/api/webhook/stripe/route.ts
}

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

// Webhook handler stub for subscription events
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
        case 'customer.subscription.created': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id;

            // Update user subscription status in Firestore
            await updateUserSubscription(customerId, {
                subscriptionStatus: 'active',
                subscriptionId: subscription.id,
                subscriptionTier: mapStripePriceToTier(subscription.items.data[0]?.price.id),
                subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id;

            // Update user subscription status to cancelled
            await updateUserSubscription(customerId, {
                subscriptionStatus: 'cancelled',
                subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
            break;
        }
        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id;

            // Update user subscription details
            await updateUserSubscription(customerId, {
                subscriptionStatus: subscription.status === 'active' ? 'active' : 'inactive',
                subscriptionTier: mapStripePriceToTier(subscription.items.data[0]?.price.id),
                subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
            break;
        }
        default:
            // Ignore other events
            break;
    }
}

// Helper function to update user subscription in Firestore
async function updateUserSubscription(
    stripeCustomerId: string,
    updates: Partial<{
        subscriptionStatus: string;
        subscriptionId: string;
        subscriptionTier: string;
        subscriptionPeriodEnd: Date;
    }>
): Promise<void> {
    const { db, COLLECTIONS } = await import('./firebase');
    const usersRef = db.collection(COLLECTIONS.USERS);
    const snapshot = await usersRef.where('stripeCustomerId', '==', stripeCustomerId).limit(1).get();

    if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        await userDoc.ref.update({
            ...updates,
            updatedAt: new Date(),
        });
    }
}

// Helper function to map Stripe price ID to subscription tier
function mapStripePriceToTier(priceId?: string): string {
    if (!priceId) return 'free';

    // Map Stripe price IDs to tiers based on subscription plans
    for (const plan of SUBSCRIPTION_PLANS) {
        if (plan.stripePriceId === priceId) {
            return plan.tier;
        }
    }

    return 'free';
}

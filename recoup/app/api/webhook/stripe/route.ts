import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';
import { logInfo, logError } from '@/utils/logger';
import type { User, Transaction } from '@/types/models';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-10-29.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const dynamic = 'force-dynamic';

/**
 * Stripe Webhook Handler
 * POST /api/webhook/stripe
 * 
 * Handles events from Stripe:
 * - checkout.session.completed: Payment successful
 * - invoice.payment_succeeded: Subscription payment successful
 * - customer.subscription.created: New subscription
 * - customer.subscription.updated: Subscription changed
 * - customer.subscription.deleted: Subscription cancelled
 * - payment_intent.succeeded: One-time payment successful
 * - payment_intent.payment_failed: Payment failed
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    logInfo('[webhook/stripe] Received webhook request');

    try {
        // 1. Get the request body
        const body = await req.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            logError('[webhook/stripe] No signature found in headers');
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        // 2. Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            logError('[webhook/stripe] Signature verification failed:', err);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        logInfo(`[webhook/stripe] Event type: ${event.type}`);

        // 3. Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentSucceeded(invoice);
                break;
            }

            case 'customer.subscription.created': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionCreated(subscription);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentIntentSucceeded(paymentIntent);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentIntentFailed(paymentIntent);
                break;
            }

            default:
                logInfo(`[webhook/stripe] Unhandled event type: ${event.type}`);
        }

        const duration = Date.now() - startTime;
        logInfo(`[webhook/stripe] Webhook processed in ${duration}ms`);

        return NextResponse.json({ received: true });
    } catch (error) {
        const duration = Date.now() - startTime;
        logError('[webhook/stripe] Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

// ============ EVENT HANDLERS ============

/**
 * Handle checkout session completed
 * When a customer completes a payment via Checkout
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    logInfo(`[webhook/stripe] Processing checkout.session.completed: ${session.id}`);

    try {
        const customerId = session.customer as string;
        const metadata = session.metadata || {};
        const freelancerId = metadata.freelancerId;
        const invoiceId = metadata.invoiceId;

        if (!freelancerId) {
            logError('[webhook/stripe] No freelancerId in session metadata');
            return;
        }

        // Create transaction record
        if (invoiceId && session.amount_total) {
            const amount = session.amount_total / 100; // Convert from cents
            const commission = amount * 0.03; // 3% commission
            const freelancerNet = amount * 0.97;

            const transaction: Transaction = {
                transactionId: `txn_${Date.now()}`,
                invoiceId,
                freelancerId,
                amount,
                paymentMethod: 'card',
                recoupCommission: commission,
                freelancerNet,
                commissionRate: 0.03,
                status: 'completed',
                stripeChargeId: session.payment_intent as string,
                transactionDate: Timestamp.now(),
                completedAt: Timestamp.now(),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            await db.collection(COLLECTIONS.TRANSACTIONS).doc(transaction.transactionId).set(transaction);

            // Update invoice status to paid
            await db.collection(COLLECTIONS.INVOICES).doc(invoiceId).update({
                status: 'paid',
                paidAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });

            logInfo(`[webhook/stripe] Transaction created: ${transaction.transactionId}`);
        }

        // Update subscription if this was a subscription payment
        if (session.subscription) {
            const subscriptionId = session.subscription as string;
            await db.collection(COLLECTIONS.USERS).doc(freelancerId).update({
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: customerId,
                subscriptionTier: 'paid',
                collectionsEnabled: true,
                updatedAt: Timestamp.now(),
            });

            logInfo(`[webhook/stripe] Subscription activated for user: ${freelancerId}`);
        }
    } catch (error) {
        logError('[webhook/stripe] Error handling checkout completed:', error);
        throw error;
    }
}

/**
 * Handle invoice payment succeeded
 * When a subscription invoice is paid
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    logInfo(`[webhook/stripe] Processing invoice.payment_succeeded: ${invoice.id}`);

    try {
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription as string;

        if (!subscriptionId) return;

        // Find user by Stripe customer ID
        const usersSnapshot = await db
            .collection(COLLECTIONS.USERS)
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            logError('[webhook/stripe] No user found for customer:', customerId);
            return;
        }

        const userId = usersSnapshot.docs[0].id;

        // Update user subscription status
        await db.collection(COLLECTIONS.USERS).doc(userId).update({
            subscriptionStatus: 'active',
            lastPaymentDate: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        logInfo(`[webhook/stripe] Subscription payment recorded for user: ${userId}`);
    } catch (error) {
        logError('[webhook/stripe] Error handling invoice payment:', error);
        throw error;
    }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
    logInfo(`[webhook/stripe] Processing customer.subscription.created: ${subscription.id}`);

    try {
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const usersSnapshot = await db
            .collection(COLLECTIONS.USERS)
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            logError('[webhook/stripe] No user found for customer:', customerId);
            return;
        }

        const userId = usersSnapshot.docs[0].id;

        // Determine subscription tier from price
        let tier: 'free' | 'paid' | 'starter' | 'growth' | 'pro' | 'business' = 'paid';
        // TODO: Map Stripe price IDs to tiers

        await db.collection(COLLECTIONS.USERS).doc(userId).update({
            stripeSubscriptionId: subscription.id,
            subscriptionTier: tier,
            subscriptionStatus: subscription.status,
            collectionsEnabled: true,
            subscriptionStartDate: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        logInfo(`[webhook/stripe] Subscription created for user: ${userId}`);
    } catch (error) {
        logError('[webhook/stripe] Error handling subscription created:', error);
        throw error;
    }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    logInfo(`[webhook/stripe] Processing customer.subscription.updated: ${subscription.id}`);

    try {
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const usersSnapshot = await db
            .collection(COLLECTIONS.USERS)
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            logError('[webhook/stripe] No user found for customer:', customerId);
            return;
        }

        const userId = usersSnapshot.docs[0].id;

        await db.collection(COLLECTIONS.USERS).doc(userId).update({
            subscriptionStatus: subscription.status,
            updatedAt: Timestamp.now(),
        });

        logInfo(`[webhook/stripe] Subscription updated for user: ${userId}`);
    } catch (error) {
        logError('[webhook/stripe] Error handling subscription updated:', error);
        throw error;
    }
}

/**
 * Handle subscription deleted (cancelled)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    logInfo(`[webhook/stripe] Processing customer.subscription.deleted: ${subscription.id}`);

    try {
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const usersSnapshot = await db
            .collection(COLLECTIONS.USERS)
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            logError('[webhook/stripe] No user found for customer:', customerId);
            return;
        }

        const userId = usersSnapshot.docs[0].id;

        await db.collection(COLLECTIONS.USERS).doc(userId).update({
            subscriptionTier: 'free',
            subscriptionStatus: 'cancelled',
            collectionsEnabled: false,
            updatedAt: Timestamp.now(),
        });

        logInfo(`[webhook/stripe] Subscription cancelled for user: ${userId}`);
    } catch (error) {
        logError('[webhook/stripe] Error handling subscription deleted:', error);
        throw error;
    }
}

/**
 * Handle payment intent succeeded
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    logInfo(`[webhook/stripe] Processing payment_intent.succeeded: ${paymentIntent.id}`);

    try {
        const metadata = paymentIntent.metadata || {};
        const invoiceId = metadata.invoiceId;
        const freelancerId = metadata.freelancerId;

        if (!invoiceId || !freelancerId) {
            logInfo('[webhook/stripe] No invoice/freelancer metadata, skipping');
            return;
        }

        // Payment already handled in checkout.session.completed
        // This is a backup handler
        logInfo(`[webhook/stripe] Payment intent succeeded for invoice: ${invoiceId}`);
    } catch (error) {
        logError('[webhook/stripe] Error handling payment intent:', error);
        throw error;
    }
}

/**
 * Handle payment intent failed
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    logInfo(`[webhook/stripe] Processing payment_intent.payment_failed: ${paymentIntent.id}`);

    try {
        const metadata = paymentIntent.metadata || {};
        const invoiceId = metadata.invoiceId;
        const freelancerId = metadata.freelancerId;

        if (!invoiceId || !freelancerId) {
            logInfo('[webhook/stripe] No invoice/freelancer metadata, skipping');
            return;
        }

        // TODO: Send notification to freelancer about failed payment
        // TODO: Update invoice with failed payment attempt

        logInfo(`[webhook/stripe] Payment failed for invoice: ${invoiceId}`);
    } catch (error) {
        logError('[webhook/stripe] Error handling payment failed:', error);
        throw error;
    }
}

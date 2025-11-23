import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';
import { logInfo, logError } from '@/utils/logger';
import type { User, Transaction } from '@/types/models';
import { getTierFromSubscription } from '@/lib/stripePriceMapping';
import { processWithIdempotency } from '@/lib/idempotency';

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

        // 3. Handle different event types with idempotency protection
        try {
            // Check if event was already processed
            const { processed, alreadyProcessed } = await processWithIdempotency(
                event.id,
                'stripe',
                event.type,
                async () => {
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
                },
                {
                    // Store metadata for debugging
                    customerId: (event.data.object as any).customer,
                    subscriptionId: (event.data.object as any).subscription,
                }
            );

            if (alreadyProcessed) {
                logInfo(`[webhook/stripe] Event ${event.id} already processed - returning success`);
                return NextResponse.json({ received: true, alreadyProcessed: true });
            }

            if (!processed) {
                logError(`[webhook/stripe] Event ${event.id} was not processed due to race condition`);
            }

            const duration = Date.now() - startTime;
            logInfo(`[webhook/stripe] Webhook processed in ${duration}ms`);

            return NextResponse.json({ received: true });
        } catch (handlerError) {
            // Store failed webhook for retry
            const { storeFailedWebhook } = await import('@/lib/webhook-retry');
            await storeFailedWebhook({
                source: 'stripe',
                eventType: event.type,
                eventId: event.id,
                payload: event,
                signature: signature,
                error: handlerError instanceof Error ? handlerError.message : 'Unknown error',
            });

            // Still return 500 so Stripe knows it failed
            logError('[webhook/stripe] Error processing webhook (stored for retry):', handlerError);
            return NextResponse.json(
                { error: 'Webhook handler failed - stored for retry' },
                { status: 500 }
            );
        }
    } catch (error) {
        const duration = Date.now() - startTime;
        logError('[webhook/stripe] Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

/**
 * Handle Stripe webhook event (for retries)
 * Called by webhook retry mechanism
 */
export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
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
            logInfo(`[webhook/stripe] Unhandled event type during retry: ${event.type}`);
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

        // Create transaction record and update invoice atomically
        if (invoiceId && session.amount_total) {
            const amount = session.amount_total / 100; // Convert from cents
            const commission = amount * 0.03; // 3% commission
            const freelancerNet = amount * 0.97;

            const transactionId = `txn_${Date.now()}_${session.id.slice(-8)}`;

            const transaction: Transaction = {
                transactionId,
                invoiceId,
                freelancerId,
                amount,
                paymentMethod: 'card',
                relayCommission: commission,
                freelancerNet,
                commissionRate: 0.03,
                status: 'completed',
                stripeChargeId: session.payment_intent ? String(session.payment_intent) : undefined,
                transactionDate: Timestamp.now(),
                completedAt: Timestamp.now(),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            // Use transaction to atomically create transaction and update invoice
            await db.runTransaction(async (txn) => {
                const invoiceRef = db.collection(COLLECTIONS.INVOICES).doc(invoiceId);
                const invoiceDoc = await txn.get(invoiceRef);

                if (!invoiceDoc.exists) {
                    throw new Error(`Invoice ${invoiceId} not found`);
                }

                const invoiceData = invoiceDoc.data();

                // Only update if not already paid (extra safety)
                if (invoiceData?.status === 'paid') {
                    logInfo(`[webhook/stripe] Invoice ${invoiceId} already marked as paid - skipping`);
                    return;
                }

                // Create transaction
                const txnRef = db.collection(COLLECTIONS.TRANSACTIONS).doc(transactionId);
                txn.set(txnRef, transaction);

                // Update invoice
                txn.update(invoiceRef, {
                    status: 'paid',
                    paidAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });
            });

            logInfo(`[webhook/stripe] Transaction created atomically: ${transactionId}`);
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

        // Determine subscription tier from price IDs
        const tier = getTierFromSubscription(subscription);
        logInfo(`[webhook/stripe] Mapped subscription to tier: ${tier}`);

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
        const failureReason = paymentIntent.last_payment_error?.message || 'Payment declined';

        if (!invoiceId || !freelancerId) {
            logInfo('[webhook/stripe] No invoice/freelancer metadata, skipping');
            return;
        }

        // Get invoice and freelancer data
        const [invoiceDoc, freelancerDoc] = await Promise.all([
            db.collection(COLLECTIONS.INVOICES).doc(invoiceId).get(),
            db.collection(COLLECTIONS.USERS).doc(freelancerId).get(),
        ]);

        if (!invoiceDoc.exists || !freelancerDoc.exists) {
            logError('[webhook/stripe] Invoice or freelancer not found');
            return;
        }

        const invoice = invoiceDoc.data();
        const freelancer = freelancerDoc.data() as User;

        // Update invoice with failed payment attempt
        await db.collection(COLLECTIONS.INVOICES).doc(invoiceId).update({
            lastPaymentAttempt: Timestamp.now(),
            lastPaymentError: failureReason,
            paymentFailedCount: (invoice?.paymentFailedCount || 0) + 1,
            updatedAt: Timestamp.now(),
        });

        // Send notification to freelancer
        try {
            const { sendNotificationEmail } = await import('@/lib/sendgrid');
            await sendNotificationEmail({
                toEmail: freelancer.email,
                subject: `Payment Failed - Invoice ${invoice?.reference}`,
                message: `A payment attempt for invoice ${invoice?.reference} from ${invoice?.clientName} has failed.\n\nReason: ${failureReason}\n\nThe client has been notified and may attempt payment again. You can view the invoice details in your dashboard.`,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${invoiceId}`,
            });

            logInfo(`[webhook/stripe] Sent failed payment notification to freelancer ${freelancerId}`);
        } catch (emailError) {
            // Don't throw on email error - log and continue
            logError('[webhook/stripe] Failed to send notification email:', emailError);
        }

        logInfo(`[webhook/stripe] Payment failed for invoice ${invoiceId}: ${failureReason}`);
    } catch (error) {
        logError('[webhook/stripe] Error handling payment failed:', error);
        throw error;
    }
}

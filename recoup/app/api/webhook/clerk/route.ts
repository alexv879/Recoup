import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { db, COLLECTIONS, Timestamp, FieldValue } from '@/lib/firebase';
import { logInfo, logError } from '@/utils/logger';
import type { User } from '@/types/models';
import type { ClerkUserData, ClerkSessionData } from '@/types/webhooks';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
});

export const dynamic = 'force-dynamic';

/**
 * Clerk Webhook Handler
 * POST /api/webhook/clerk
 * 
 * Handles user lifecycle events from Clerk:
 * - user.created: New user signed up
 * - user.updated: User profile updated
 * - user.deleted: User account deleted
 * - session.created: User logged in
 * - session.ended: User logged out
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    logInfo('[webhook/clerk] Received webhook request');

    try {
        // 1. Get the headers
        const headersList = await headers();
        const svixId = headersList.get('svix-id');
        const svixTimestamp = headersList.get('svix-timestamp');
        const svixSignature = headersList.get('svix-signature');

        if (!svixId || !svixTimestamp || !svixSignature) {
            logError('[webhook/clerk] Missing svix headers');
            return NextResponse.json(
                { error: 'Missing svix headers' },
                { status: 400 }
            );
        }

        // 2. Get the body
        const body = await req.text();

        // 3. Verify the webhook signature
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            logError('[webhook/clerk] CLERK_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        const wh = new Webhook(webhookSecret);
        let event: WebhookEvent;

        try {
            event = wh.verify(body, {
                'svix-id': svixId,
                'svix-timestamp': svixTimestamp,
                'svix-signature': svixSignature,
            }) as WebhookEvent;
        } catch (err) {
            logError('[webhook/clerk] Error verifying webhook:', err);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        logInfo(`[webhook/clerk] Event type: ${event.type}`);

        // 4. Handle different event types
        switch (event.type) {
            case 'user.created':
                await handleUserCreated(event.data);
                break;

            case 'user.updated':
                await handleUserUpdated(event.data);
                break;

            case 'user.deleted':
                await handleUserDeleted(event.data);
                break;

            case 'session.created':
                await handleSessionCreated(event.data);
                break;

            case 'session.ended':
                await handleSessionEnded(event.data);
                break;

            default:
                logInfo(`[webhook/clerk] Unhandled event type: ${event.type}`);
        }

        const duration = Date.now() - startTime;
        logInfo(`[webhook/clerk] Webhook processed in ${duration}ms`);

        return NextResponse.json({ received: true });
    } catch (error) {
        const duration = Date.now() - startTime;
        logError('[webhook/clerk] Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

// ============ EVENT HANDLERS ============

/**
 * Handle user created event
 * Create user document in Firestore
 */
async function handleUserCreated(userData: ClerkUserData) {
    const userId = userData.id;
    if (!userId) {
        logError('[webhook/clerk] User ID missing in user.created event');
        return;
    }

    logInfo(`[webhook/clerk] Processing user.created: ${userId}`);

    try {
        const email = userData.email_addresses?.[0]?.email_address || '';
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || email.split('@')[0];

        // Generate unique referral code
        const referralCode = generateReferralCode();

        const user: User = {
            userId,
            email,
            name: fullName,
            firstName,
            lastName,
            businessName: '',
            businessType: 'freelancer',

            // Subscription
            subscriptionTier: 'free',
            subscriptionStatus: 'active',
            collectionsEnabled: false,
            collectionsDemoUsedThisMonth: 0,

            // Referral
            referralCode,

            // Profile
            profilePicture: userData.image_url || '',
            timezone: 'Europe/London',
            language: 'en',

            // Preferences
            notifications: {
                emailNotifications: true,
                inAppNotifications: true,
                quietHoursStart: '21:00',
                quietHoursEnd: '08:00',
                notificationTypes: ['invoice_drought', 'payment_delay', 'opportunity'],
                onVacation: false,
            },

            // Status
            isActive: true,
            status: 'active',

            // Timestamps
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            lastLoginAt: Timestamp.now(),
            lastActiveAt: Timestamp.now(),
        };

        // Create user document
        await db.collection(COLLECTIONS.USERS).doc(userId).set(user);

        // Initialize user stats
        await db.collection(COLLECTIONS.USER_STATS).doc(userId).set({
            userId,
            totalInvoiced: 0,
            totalCollected: 0,
            totalOutstanding: 0,
            averageInvoiceAmount: 0,
            averagePaymentDays: 0,
            onTimePercentage: 0,
            totalInvoices: 0,
            paidInvoices: 0,
            overdueInvoices: 0,
            draftInvoices: 0,
            collectionsEnabled: 0,
            successfulCollections: 0,
            collectionsRevenue: 0,
            xp: 0,
            level: 1,
            streak: 0,
            badges: [],
            rank: 0,
            achievements: [],
            daysActivePastMonth: 0,
            sessionsThisMonth: 0,
            avgSessionDuration: 0,
            lastActiveAt: Timestamp.now(),
            churnRiskScore: 0,
            engagementLevel: 'low',
            calculatedAt: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        logInfo(`[webhook/clerk] User created successfully: ${userId}`);
    } catch (error) {
        logError('[webhook/clerk] Error creating user:', error);
        throw error;
    }
}

/**
 * Handle user updated event
 * Update user document in Firestore
 */
async function handleUserUpdated(userData: ClerkUserData) {
    const userId = userData.id;
    if (!userId) {
        logError('[webhook/clerk] User ID missing in user.updated event');
        return;
    }

    logInfo(`[webhook/clerk] Processing user.updated: ${userId}`);

    try {
        const email = userData.email_addresses?.[0]?.email_address || '';
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || email.split('@')[0];

        // Check if user exists
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        if (!userDoc.exists) {
            logInfo(`[webhook/clerk] User not found, creating: ${userId}`);
            await handleUserCreated(userData);
            return;
        }

        // Update user document
        await db.collection(COLLECTIONS.USERS).doc(userId).update({
            email,
            name: fullName,
            firstName,
            lastName,
            profilePicture: userData.image_url || '',
            updatedAt: Timestamp.now(),
        });

        logInfo(`[webhook/clerk] User updated successfully: ${userId}`);
    } catch (error) {
        logError('[webhook/clerk] Error updating user:', error);
        throw error;
    }
}

/**
 * Handle user deleted event
 * Soft delete user and anonymize data
 */
async function handleUserDeleted(userData: ClerkUserData) {
    const userId = userData.id;
    if (!userId) {
        logError('[webhook/clerk] User ID missing in user.deleted event');
        return;
    }

    logInfo(`[webhook/clerk] Processing user.deleted: ${userId}`);

    try {

        // Get user data to find Stripe customer ID
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        const user = userDoc.exists ? (userDoc.data() as User) : null;

        // Cancel any active Stripe subscriptions
        if (user?.stripeCustomerId) {
            try {
                logInfo(`[webhook/clerk] Cancelling Stripe subscriptions for customer: ${user.stripeCustomerId}`);

                // List all active subscriptions for this customer
                const subscriptions = await stripe.subscriptions.list({
                    customer: user.stripeCustomerId,
                    status: 'active',
                    limit: 100,
                });

                // Cancel each active subscription
                for (const subscription of subscriptions.data) {
                    await stripe.subscriptions.cancel(subscription.id);
                    logInfo(`[webhook/clerk] Cancelled subscription: ${subscription.id}`);
                }

                logInfo(`[webhook/clerk] Cancelled ${subscriptions.data.length} Stripe subscription(s)`);
            } catch (stripeError) {
                logError('[webhook/clerk] Error cancelling Stripe subscriptions:', stripeError);
                // Don't throw - continue with user deletion even if Stripe fails
            }
        }

        // Soft delete user (set status to deleted, keep data for compliance)
        await db.collection(COLLECTIONS.USERS).doc(userId).update({
            isActive: false,
            status: 'deleted',
            email: `deleted_${userId}@relay.com`,
            name: 'Deleted User',
            firstName: 'Deleted',
            lastName: 'User',
            encryptedBankDetails: null,
            updatedAt: Timestamp.now(),
        });

        // Update invoices to mark as archived
        const invoicesSnapshot = await db
            .collection(COLLECTIONS.INVOICES)
            .where('freelancerId', '==', userId)
            .get();

        const batch = db.batch();
        invoicesSnapshot.docs.forEach((doc) => {
            batch.update(doc.ref, {
                status: 'cancelled',
                updatedAt: Timestamp.now(),
            });
        });
        await batch.commit();

        logInfo(`[webhook/clerk] User deleted successfully: ${userId}`);
    } catch (error) {
        logError('[webhook/clerk] Error deleting user:', error);
        throw error;
    }
}

/**
 * Handle session created event
 * Track user login
 */
async function handleSessionCreated(sessionData: ClerkSessionData) {
    const userId = sessionData.user_id;
    if (!userId) return;

    logInfo(`[webhook/clerk] Processing session.created for user: ${userId}`);

    try {
        // Update last login timestamp
        await db.collection(COLLECTIONS.USERS).doc(userId).update({
            lastLoginAt: Timestamp.now(),
            lastActiveAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        // Increment sessions count
        await db.collection(COLLECTIONS.USER_STATS).doc(userId).update({
            sessionsThisMonth: FieldValue.increment(1),
            daysActivePastMonth: FieldValue.increment(1),
            updatedAt: Timestamp.now(),
        });

        logInfo(`[webhook/clerk] Session tracked for user: ${userId}`);
    } catch (error) {
        logError('[webhook/clerk] Error tracking session:', error);
        // Don't throw - session tracking is non-critical
    }
}

/**
 * Handle session ended event
 * Track session duration
 */
async function handleSessionEnded(sessionData: ClerkSessionData) {
    const userId = sessionData.user_id;
    if (!userId) return;

    logInfo(`[webhook/clerk] Processing session.ended for user: ${userId}`);

    try {
        // TODO: Calculate session duration if needed
        // For now, just log the event
        logInfo(`[webhook/clerk] Session ended for user: ${userId}`);
    } catch (error) {
        logError('[webhook/clerk] Error handling session end:', error);
        // Don't throw - session tracking is non-critical
    }
}

// ============ HELPER FUNCTIONS ============

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars
    let code = 'REL-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

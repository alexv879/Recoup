/**
 * CLERK WEBHOOK HANDLER
 * POST /api/webhooks/clerk
 *
 * Handles subscription events from Clerk Billing:
 * - subscription.created: New subscription starts
 * - subscription.updated: Subscription plan changed (upgrade/downgrade)
 * - subscription.deleted: Subscription cancelled
 *
 * Auto-syncs subscription tier from Clerk to Firestore User model
 * Ensures local DB always matches Clerk's subscription state
 *
 * Setup:
 * 1. Add endpoint in Clerk Dashboard > Webhooks
 * 2. URL: https://your-domain.com/api/webhooks/clerk
 * 3. Events: subscription.created, subscription.updated, subscription.deleted
 * 4. Copy webhook secret to CLERK_WEBHOOK_SECRET env var
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db, FieldValue } from '@/lib/firebase';
import { User } from '@/types/models';
import { COLLECTIONS_LIMITS, normalizeTier, SubscriptionTier } from '@/utils/constants';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { handleApiError } from '@/utils/error';
import { BadRequestError, UnauthorizedError } from '@/utils/error';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/clerk
 * Process Clerk subscription webhooks
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify webhook signature
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      logError('CLERK_WEBHOOK_SECRET not configured', new Error('Missing env var'));
      throw new BadRequestError('Webhook secret not configured');
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      logWarn('Missing svix headers in Clerk webhook');
      throw new BadRequestError('Missing svix headers');
    }

    const body = await req.text();

    // 2. Verify webhook with Svix
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: any;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      logError('Clerk webhook verification failed', err as Error);
      throw new UnauthorizedError('Invalid webhook signature');
    }

    logInfo('Clerk webhook received', {
      eventType: evt.type,
      eventId: svix_id,
    });

    // 3. Handle different event types
    switch (evt.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(evt.data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(evt.data);
        break;

      case 'subscription.deleted':
        await handleSubscriptionDeleted(evt.data);
        break;

      default:
        logInfo('Unhandled Clerk webhook event type', { eventType: evt.type });
    }

    logInfo('Clerk webhook processed successfully', {
      eventType: evt.type,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorResponse = await handleApiError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

/**
 * Handle subscription.created event
 * New user subscribes to a paid plan
 */
async function handleSubscriptionCreated(data: any): Promise<void> {
  const { user_id, plan_slug, subscription_id, status } = data;

  logInfo('Processing subscription.created', {
    userId: user_id,
    planSlug: plan_slug,
    subscriptionId: subscription_id,
  });

  // Map Clerk plan slug to our tier system
  const tier = mapPlanSlugToTier(plan_slug);

  if (!tier) {
    logWarn('Unknown plan slug in subscription.created', { planSlug: plan_slug });
    return;
  }

  // Get collection limit for tier
  const limit = COLLECTIONS_LIMITS[tier as keyof typeof COLLECTIONS_LIMITS];

  // Update user in Firestore
  await db.collection('users').doc(user_id).update({
    subscriptionTier: tier,
    clerkSubscriptionId: subscription_id,
    stripeSubscriptionId: data.stripe_subscription_id, // If Clerk provides it
    subscriptionStartDate: FieldValue.serverTimestamp(),
    collectionsEnabled: true,
    collectionsLimitPerMonth: limit === Infinity ? 999999 : limit,
    collectionsUsedThisMonth: 0, // Reset on subscription start
    monthlyUsageResetDate: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logInfo('User upgraded to paid tier', {
    userId: user_id,
    tier,
    subscriptionId: subscription_id,
  });
}

/**
 * Handle subscription.updated event
 * User upgrades/downgrades their plan
 */
async function handleSubscriptionUpdated(data: any): Promise<void> {
  const { user_id, plan_slug, subscription_id } = data;

  logInfo('Processing subscription.updated', {
    userId: user_id,
    planSlug: plan_slug,
    subscriptionId: subscription_id,
  });

  const tier = mapPlanSlugToTier(plan_slug);

  if (!tier) {
    logWarn('Unknown plan slug in subscription.updated', { planSlug: plan_slug });
    return;
  }

  const limit = COLLECTIONS_LIMITS[tier as keyof typeof COLLECTIONS_LIMITS];

  // Get current user data to check if upgrading or downgrading
  const userDoc = await db.collection('users').doc(user_id).get();
  const currentUser = userDoc.data() as User;

  const wasUpgrade =
    currentUser &&
    getTierLevel(tier) > getTierLevel(normalizeTier(currentUser.subscriptionTier));

  // Update user tier
  await db.collection('users').doc(user_id).update({
    subscriptionTier: tier,
    clerkSubscriptionId: subscription_id,
    collectionsLimitPerMonth: limit === Infinity ? 999999 : limit,
    // Reset usage only if downgrading to prevent abuse
    ...(wasUpgrade ? {} : { collectionsUsedThisMonth: 0 }),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logInfo('User subscription tier updated', {
    userId: user_id,
    newTier: tier,
    wasUpgrade,
  });
}

/**
 * Handle subscription.deleted event
 * User cancels their subscription
 */
async function handleSubscriptionDeleted(data: any): Promise<void> {
  const { user_id, subscription_id } = data;

  logInfo('Processing subscription.deleted', {
    userId: user_id,
    subscriptionId: subscription_id,
  });

  // Downgrade to free tier
  await db.collection('users').doc(user_id).update({
    subscriptionTier: 'free',
    clerkSubscriptionId: null,
    stripeSubscriptionId: null,
    collectionsLimitPerMonth: 1, // Free tier limit
    collectionsUsedThisMonth: 0,
    updatedAt: FieldValue.serverTimestamp(),
  });

  logInfo('User downgraded to free tier', {
    userId: user_id,
  });
}

/**
 * Map Clerk plan slug to our tier system
 * Handles both founding and standard pricing plans
 */
function mapPlanSlugToTier(planSlug: string): SubscriptionTier | null {
  const tierMap: Record<string, SubscriptionTier> = {
    // Free tier
    free: 'free',

    // Starter tier (founding & standard)
    starter_founding: 'starter',
    starter_standard: 'starter',
    starter: 'starter',

    // Pro tier (founding & standard)
    pro_founding: 'pro',
    pro_standard: 'pro',
    pro: 'pro',

    // Business tier (founding & standard)
    business_founding: 'pro',
    business_standard: 'pro',
    business: 'pro',
  };

  return tierMap[planSlug.toLowerCase()] || null;
}

/**
 * Get tier level for comparison (used to detect upgrades/downgrades)
 */
function getTierLevel(tier: SubscriptionTier): number {
  const levels: Record<SubscriptionTier, number> = {
    free: 0,
    starter: 1,
    growth: 2,
    pro: 3,
    // Legacy support
    paid: 2, // Map old 'paid' to 'growth' level
  };
  return levels[tier] || 0;
}

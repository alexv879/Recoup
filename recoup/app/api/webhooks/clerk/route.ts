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
 * IMPORTANT: Clerk handles BOTH authentication AND subscription billing
 * - Subscriptions configured in Clerk Dashboard
 * - Expense tiers: free (£0), pro (£10/month), mtd-pro (£20/month)
 * - Stripe is ONLY for client payment links (not subscriptions)
 *
 * Setup:
 * 1. Add endpoint in Clerk Dashboard > Webhooks
 * 2. URL: https://your-domain.com/api/webhooks/clerk
 * 3. Events: subscription.created, subscription.updated, subscription.deleted, user.created, user.updated, user.deleted
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
import type { ClerkWebhookEvent, ClerkSubscriptionData } from '@/types/webhooks';

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
    let evt: ClerkWebhookEvent<ClerkSubscriptionData>;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent<ClerkSubscriptionData>;
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
      // Subscription events (billing)
      case 'subscription.created':
        await handleSubscriptionCreated(evt.data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(evt.data);
        break;

      case 'subscription.deleted':
        await handleSubscriptionDeleted(evt.data);
        break;

      // User events (authentication)
      case 'user.created':
        await handleUserCreated(evt.data);
        break;

      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(evt.data);
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
async function handleSubscriptionCreated(data: ClerkSubscriptionData): Promise<void> {
  const { user_id, plan_slug, subscription_id, status } = data;

  logInfo('Processing subscription.created', {
    userId: user_id,
    planSlug: plan_slug,
    subscriptionId: subscription_id,
  });

  // Map Clerk plan slug to our tier system
  if (!plan_slug) {
    logWarn('No plan slug in subscription.created', { data });
    return;
  }

  const tier = mapPlanSlugToTier(plan_slug);

  if (!tier) {
    logWarn('Unknown plan slug in subscription.created', { planSlug: plan_slug });
    return;
  }

  // Get quotas based on tier
  const quotas = getExpenseQuotasForTier(tier, plan_slug);
  const collectionsLimit = COLLECTIONS_LIMITS[tier as keyof typeof COLLECTIONS_LIMITS];

  // Update user in Firestore
  await db.collection('users').doc(user_id).update({
    subscriptionTier: tier,
    clerkSubscriptionId: subscription_id,
    clerkPlanSlug: plan_slug, // Store original plan slug for MTD detection
    stripeSubscriptionId: data.stripe_subscription_id, // If Clerk provides it
    subscriptionStartDate: FieldValue.serverTimestamp(),

    // Expense tracking quotas
    expensesPerMonth: quotas.expensesPerMonth,
    receiptStorageMB: quotas.receiptStorageMB,
    ocrProcessingPerMonth: quotas.ocrProcessingPerMonth,
    expensesUsedThisMonth: 0, // Reset on subscription start
    ocrUsedThisMonth: 0,

    // MTD feature flag
    mtdEnabled: quotas.mtdEnabled,

    // Collections (legacy)
    collectionsEnabled: tier !== 'free',
    collectionsLimitPerMonth: collectionsLimit === Infinity ? 999999 : collectionsLimit,
    collectionsUsedThisMonth: 0,

    monthlyUsageResetDate: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logInfo('User upgraded to paid tier', {
    userId: user_id,
    tier,
    mtdEnabled: quotas.mtdEnabled,
    subscriptionId: subscription_id,
  });
}

/**
 * Handle subscription.updated event
 * User upgrades/downgrades their plan
 */
async function handleSubscriptionUpdated(data: ClerkSubscriptionData): Promise<void> {
  const { user_id, plan_slug, subscription_id } = data;

  logInfo('Processing subscription.updated', {
    userId: user_id,
    planSlug: plan_slug,
    subscriptionId: subscription_id,
  });

  if (!plan_slug) {
    logWarn('No plan slug in subscription.updated', { data });
    return;
  }

  const tier = mapPlanSlugToTier(plan_slug);

  if (!tier) {
    logWarn('Unknown plan slug in subscription.updated', { planSlug: plan_slug });
    return;
  }

  // Get quotas based on new tier
  const quotas = getExpenseQuotasForTier(tier, plan_slug);
  const collectionsLimit = COLLECTIONS_LIMITS[tier as keyof typeof COLLECTIONS_LIMITS];

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
    clerkPlanSlug: plan_slug,

    // Expense tracking quotas
    expensesPerMonth: quotas.expensesPerMonth,
    receiptStorageMB: quotas.receiptStorageMB,
    ocrProcessingPerMonth: quotas.ocrProcessingPerMonth,

    // MTD feature flag
    mtdEnabled: quotas.mtdEnabled,

    // Collections (legacy)
    collectionsLimitPerMonth: collectionsLimit === Infinity ? 999999 : collectionsLimit,

    // Reset usage only if downgrading to prevent abuse
    ...(wasUpgrade ? {} : {
      collectionsUsedThisMonth: 0,
      expensesUsedThisMonth: 0,
      ocrUsedThisMonth: 0
    }),

    updatedAt: FieldValue.serverTimestamp(),
  });

  logInfo('User subscription tier updated', {
    userId: user_id,
    newTier: tier,
    mtdEnabled: quotas.mtdEnabled,
    wasUpgrade,
  });
}

/**
 * Handle subscription.deleted event
 * User cancels their subscription
 */
async function handleSubscriptionDeleted(data: ClerkSubscriptionData): Promise<void> {
  const { user_id, subscription_id } = data;

  logInfo('Processing subscription.deleted', {
    userId: user_id,
    subscriptionId: subscription_id,
  });

  // Get free tier quotas
  const quotas = getExpenseQuotasForTier('free', 'free');

  // Downgrade to free tier
  await db.collection('users').doc(user_id).update({
    subscriptionTier: 'free',
    clerkSubscriptionId: null,
    clerkPlanSlug: null,
    stripeSubscriptionId: null,

    // Expense tracking quotas (free tier)
    expensesPerMonth: quotas.expensesPerMonth,
    receiptStorageMB: quotas.receiptStorageMB,
    ocrProcessingPerMonth: quotas.ocrProcessingPerMonth,
    expensesUsedThisMonth: 0,
    ocrUsedThisMonth: 0,

    // MTD disabled
    mtdEnabled: false,

    // Collections (legacy)
    collectionsLimitPerMonth: 1, // Free tier limit
    collectionsUsedThisMonth: 0,
    collectionsEnabled: false,

    updatedAt: FieldValue.serverTimestamp(),
  });

  logInfo('User downgraded to free tier', {
    userId: user_id,
  });
}

/**
 * Get expense tracking quotas for a tier
 * Based on pricing.ts EXPENSE_PRICING_TIERS
 */
function getExpenseQuotasForTier(tier: SubscriptionTier, planSlug: string): {
  expensesPerMonth: number | null;
  receiptStorageMB: number;
  ocrProcessingPerMonth: number | null;
  mtdEnabled: boolean;
} {
  // Check if plan includes MTD
  const isMTDPlan = planSlug.toLowerCase().includes('mtd');

  // Free tier
  if (tier === 'free') {
    return {
      expensesPerMonth: 50,
      receiptStorageMB: 100, // 100MB
      ocrProcessingPerMonth: 10,
      mtdEnabled: false,
    };
  }

  // Pro tier (£10/month) OR MTD-Pro tier (£20/month)
  if (tier === 'pro') {
    return {
      expensesPerMonth: null, // Unlimited
      receiptStorageMB: 1000, // 1GB
      ocrProcessingPerMonth: null, // Unlimited
      mtdEnabled: isMTDPlan, // MTD enabled only for MTD-Pro plans
    };
  }

  // Legacy collections tiers (Starter/Growth)
  return {
    expensesPerMonth: 50, // Same as free for legacy tiers
    receiptStorageMB: 500,
    ocrProcessingPerMonth: 50,
    mtdEnabled: false,
  };
}

/**
 * Map Clerk plan slug to our tier system
 * Handles both expense tiers and legacy collections-based tiers
 */
function mapPlanSlugToTier(planSlug: string): SubscriptionTier | null {
  const tierMap: Record<string, SubscriptionTier> = {
    // === EXPENSE TIERS (NEW - Revenue Recovery SaaS) ===
    // Free tier
    free: 'free',
    expense_free: 'free',

    // Pro tier (£10/month - unlimited expenses)
    pro: 'pro',
    expense_pro: 'pro',
    pro_monthly: 'pro',
    pro_annual: 'pro',

    // MTD-Pro tier (£20/month - HMRC filing)
    'mtd-pro': 'pro', // Map to 'pro' since SubscriptionTier type doesn't have mtd-pro
    mtd_pro: 'pro',
    mtd_pro_monthly: 'pro',
    mtd_pro_annual: 'pro',
    expense_mtd_pro: 'pro',

    // === LEGACY COLLECTIONS TIERS (OLD - keep for backwards compatibility) ===
    // Starter tier (founding & standard)
    starter_founding: 'starter',
    starter_standard: 'starter',
    starter: 'starter',

    // Growth tier
    growth_founding: 'growth',
    growth_standard: 'growth',
    growth: 'growth',

    // Business tier (map to pro)
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

/**
 * Handle user.created event
 * Create Firestore user document on signup
 */
async function handleUserCreated(data: any): Promise<void> {
  const { id: userId, email_addresses, first_name, last_name } = data;

  logInfo('Processing user.created', { userId });

  const primaryEmail = email_addresses?.find((e: any) => e.id === data.primary_email_address_id);

  // Create initial user document with free tier
  await db.collection('users').doc(userId).set({
    userId,
    email: primaryEmail?.email_address || '',
    firstName: first_name || '',
    lastName: last_name || '',
    displayName: `${first_name || ''} ${last_name || ''}`.trim(),

    // Subscription (default to free tier)
    subscriptionTier: 'free',

    // Expense tracking quotas (free tier)
    expensesPerMonth: 50,
    receiptStorageMB: 100,
    ocrProcessingPerMonth: 10,
    expensesUsedThisMonth: 0,
    ocrUsedThisMonth: 0,

    // Collections quotas (legacy - keep for backwards compatibility)
    collectionsEnabled: false,
    collectionsLimitPerMonth: 1,
    collectionsUsedThisMonth: 0,

    // Timestamps
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logInfo('User created in Firestore', { userId });
}

/**
 * Handle user.updated event
 * Sync profile changes to Firestore
 */
async function handleUserUpdated(data: any): Promise<void> {
  const { id: userId, email_addresses, first_name, last_name } = data;

  logInfo('Processing user.updated', { userId });

  const primaryEmail = email_addresses?.find((e: any) => e.id === data.primary_email_address_id);

  // Update user profile
  await db.collection('users').doc(userId).update({
    email: primaryEmail?.email_address || '',
    firstName: first_name || '',
    lastName: last_name || '',
    displayName: `${first_name || ''} ${last_name || ''}`.trim(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logInfo('User profile updated in Firestore', { userId });
}

/**
 * Handle user.deleted event
 * Soft delete or anonymize user data (GDPR compliance)
 */
async function handleUserDeleted(data: any): Promise<void> {
  const { id: userId } = data;

  logInfo('Processing user.deleted', { userId });

  // Soft delete: Mark as deleted but keep data for compliance
  await db.collection('users').doc(userId).update({
    deleted: true,
    deletedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logInfo('User marked as deleted in Firestore', { userId });
}

/**
 * Create Clerk Checkout Session
 * POST /api/billing/create-checkout
 *
 * Creates a Clerk subscription checkout URL
 *
 * IMPORTANT: This is a placeholder implementation.
 * You need to replace this with actual Clerk subscription API calls
 * or redirect directly to Clerk's subscription URL from the frontend.
 *
 * See CLERK_SUBSCRIPTION_SETUP.md for configuration instructions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { plan, billingCycle } = await req.json();

    // Validate plan
    if (!['pro', 'mtd-pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    // ========================================================================
    // TODO: REPLACE WITH ACTUAL CLERK SUBSCRIPTION API
    // ========================================================================
    //
    // Option 1: Use Clerk's subscription URL (if configured in Clerk Dashboard)
    // const clerkDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN || 'your-app.clerk.accounts.dev';
    // const planSlug = `${plan}_${billingCycle}`; // e.g., "pro_monthly"
    // const checkoutUrl = `https://${clerkDomain}/subscribe?plan=${planSlug}`;
    //
    // Option 2: Use Clerk SDK to create subscription (if available)
    // const clerk = await createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    // const subscription = await clerk.subscriptions.create({
    //   userId,
    //   planId: planSlug,
    //   successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    //   cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    // });
    // const checkoutUrl = subscription.checkoutUrl;
    //
    // ========================================================================

    // PLACEHOLDER: Construct Clerk subscription URL
    // Replace 'your-clerk-domain' with your actual Clerk domain from dashboard
    const clerkDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN || 'your-app.clerk.accounts.dev';
    const planSlug = billingCycle === 'annual' ? `${plan}_annual` : `${plan}_monthly`;

    const checkoutUrl = `https://${clerkDomain}/subscribe?plan=${planSlug}&redirect_url=${encodeURIComponent(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?upgraded=true`
    )}`;

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

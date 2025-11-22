/**
 * Push Notification Subscription API
 *
 * Handles push notification subscriptions from PWA clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse subscription data
    const subscription = await req.json();

    // Validate subscription format
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Save subscription to user profile
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      pushSubscription: subscription,
      pushSubscriptionUpdatedAt: new Date(),
    });

    console.log('[Push] Subscription saved for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Push subscription saved successfully'
    });

  } catch (error) {
    console.error('[Push] Failed to save subscription:', error);

    return NextResponse.json(
      { error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove subscription from user profile
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      pushSubscription: null,
      pushSubscriptionUpdatedAt: new Date(),
    });

    console.log('[Push] Subscription removed for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Push subscription removed successfully'
    });

  } catch (error) {
    console.error('[Push] Failed to remove subscription:', error);

    return NextResponse.json(
      { error: 'Failed to remove push subscription' },
      { status: 500 }
    );
  }
}

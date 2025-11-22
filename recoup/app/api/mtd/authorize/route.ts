/**
 * MTD OAuth Authorization Initiation
 * GET /api/mtd/authorize
 *
 * Status: ⏳ Feature Flagged (Awaiting HMRC Approval)
 * This endpoint is ready but inactive until HMRC approves production access
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { HMRCClient } from '@/lib/hmrc-client';
import { db, COLLECTIONS } from '@/lib/firebase';

/**
 * Initiate MTD authorization flow
 * Redirects user to HMRC Government Gateway for OAuth
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has MTD-Pro subscription
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const user = userDoc.data();

    if (!user?.mtdEnabled) {
      return NextResponse.json(
        {
          error:
            'MTD features not enabled. Please upgrade to MTD-Pro tier or join the waitlist.',
        },
        { status: 403 }
      );
    }

    // Generate state token (CSRF protection)
    const state = `${userId}:${Date.now()}:${Math.random().toString(36).substring(7)}`;

    // TODO: Store state token in session/database for validation
    // For now, we'll just pass it through

    // Determine if using sandbox or production
    const useSandbox = user.mtdSandboxMode !== false; // Default to sandbox

    const hmrcClient = new HMRCClient(useSandbox);

    // Scopes needed for Recoup
    const scopes = [
      'read:vat',
      'write:vat',
      'read:self-assessment',
      'write:self-assessment',
    ];

    const authUrl = hmrcClient.getAuthorizationUrl(state, scopes);

    console.log('MTD authorization initiated:', {
      userId,
      state,
      sandbox: useSandbox,
    });

    // Redirect to HMRC
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('MTD authorization failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate MTD authorization' },
      { status: 500 }
    );
  }
}

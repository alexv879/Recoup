/**
 * MTD OAuth Callback
 * GET /api/mtd/callback
 *
 * Receives authorization code from HMRC and exchanges for access token
 * Status: ⏳ Feature Flagged (Awaiting HMRC Approval)
 */

import { NextRequest, NextResponse } from 'next/server';
import { HMRCClient } from '@/lib/hmrc-client';
import { encrypt } from '@/lib/encryption';
import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';
import type { MTDAuthorization } from '@/types/models';

/**
 * Handle OAuth callback from HMRC
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle error from HMRC
    if (error) {
      console.error('HMRC authorization error:', {
        error,
        description: errorDescription,
      });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?mtd=error&message=${encodeURIComponent(error)}`
      );
    }

    // Validate params
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    // Extract userId from state token
    const [userId, timestamp] = state.split(':');
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid state token' },
        { status: 400 }
      );
    }

    // TODO: Validate state token was issued by us (check against stored value)
    // For now, we just verify it has the right format

    // Check if user exists
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userDoc.data();
    const useSandbox = user?.mtdSandboxMode !== false;

    // Exchange code for tokens
    const hmrcClient = new HMRCClient(useSandbox);
    const tokens = await hmrcClient.exchangeCodeForToken(code);

    // Encrypt sensitive tokens before storing
    const authData: Partial<MTDAuthorization> = {
      userId,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      tokenType: 'Bearer',
      expiresAt: Timestamp.fromDate(
        new Date(Date.now() + tokens.expires_in * 1000)
      ),
      scope: tokens.scope.split(' '),
      status: 'active',
      authorizedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Save to database
    const authRef = await db
      .collection(COLLECTIONS.MTD_AUTHORIZATIONS)
      .add(authData);

    console.log('MTD authorization completed:', {
      userId,
      authId: authRef.id,
      scopes: authData.scope,
    });

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?mtd=success`
    );
  } catch (error: any) {
    console.error('MTD callback failed:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?mtd=error&message=${encodeURIComponent(error.message)}`
    );
  }
}

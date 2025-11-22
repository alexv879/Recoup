/**
 * HMRC OAuth Connection Endpoint
 *
 * Initiates OAuth flow to connect user's HMRC account
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAuthorizationUrl } from '@/lib/hmrc-oauth';
import { randomBytes } from 'crypto';
import { logError } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = randomBytes(32).toString('hex');

    // Store state in session (you may want to use a proper session store)
    const response = NextResponse.redirect(getAuthorizationUrl(state));
    response.cookies.set('hmrc_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    logError('HMRC connection error', error);
    return NextResponse.json(
      { error: 'Failed to initiate HMRC connection' },
      { status: 500 }
    );
  }
}

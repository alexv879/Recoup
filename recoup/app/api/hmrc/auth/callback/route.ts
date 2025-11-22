/**
 * HMRC OAuth Callback Endpoint
 *
 * Handles OAuth callback from HMRC and stores tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { exchangeCodeForToken, storeHMRCTokens } from '@/lib/hmrc-oauth';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=unauthorized`);
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('HMRC OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=hmrc_auth_failed`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=invalid_callback`
      );
    }

    // Verify state parameter (CSRF protection)
    const storedState = request.cookies.get('hmrc_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=invalid_state`
      );
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForToken(code);

    // Store tokens in Firestore
    await storeHMRCTokens(userId, tokens);

    // Clear state cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?success=hmrc_connected`
    );
    response.cookies.delete('hmrc_oauth_state');

    return response;
  } catch (error) {
    console.error('HMRC callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=token_exchange_failed`
    );
  }
}

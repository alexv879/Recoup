/**
 * HMRC OAuth 2.0 Callback Handler
 * POST /api/hmrc/callback
 *
 * Handles authorization code exchange after user connects HMRC account
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { exchangeHMRCAuthCode } from '@/lib/hmrc-client';
import { handleError, UnauthorizedError } from '@/utils/error';
import { logInfo, logError } from '@/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in to connect HMRC.');
    }

    // 2. Get authorization code from query params
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Should match userId
    const error = url.searchParams.get('error');

    if (error) {
      logError('HMRC authorization error', new Error(error));
      return NextResponse.redirect(
        new URL(`/dashboard/settings/mtd?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/mtd?error=missing_code', req.url)
      );
    }

    // 3. Verify state matches userId (CSRF protection)
    if (state !== userId) {
      logError('HMRC state mismatch', new Error(`Expected ${userId}, got ${state}`));
      return NextResponse.redirect(
        new URL('/dashboard/settings/mtd?error=invalid_state', req.url)
      );
    }

    // 4. Exchange code for tokens
    await exchangeHMRCAuthCode(code, userId);

    logInfo('HMRC authorization successful', { userId });

    // 5. Redirect to MTD settings with success message
    return NextResponse.redirect(
      new URL('/dashboard/settings/mtd?success=true', req.url)
    );
  } catch (error) {
    logError('HMRC callback error', error as Error);
    const { status, body } = await handleError(error);

    // Redirect with error message
    return NextResponse.redirect(
      new URL(`/dashboard/settings/mtd?error=${encodeURIComponent(body.message)}`, req.url)
    );
  }
}

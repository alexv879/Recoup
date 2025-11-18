/**
 * GET USER QUOTA
 * GET /api/user/quota
 *
 * Returns current usage quota information for the authenticated user
 * Used by UsageQuotaWidget to display collection limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserQuotaInfo } from '@/middleware/clerkPremiumGating';
import { UnauthorizedError, handleApiError } from '@/utils/error';

export const dynamic = 'force-dynamic';

/**
 * Get user's current quota info
 * GET /api/user/quota
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    // 2. Get quota info
    const quotaInfo = await getUserQuotaInfo(userId);

    return NextResponse.json(quotaInfo);

  } catch (error) {
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

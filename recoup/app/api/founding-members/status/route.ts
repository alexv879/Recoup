/**
 * FOUNDING MEMBER STATUS API
 * GET /api/founding-members/status
 *
 * Returns real-time founding member availability for the live counter
 * on the pricing page. This endpoint is public (no auth required) to
 * allow non-authenticated visitors to see scarcity messaging.
 *
 * Used by: <FoundingMemberCounter /> component
 */

import { NextResponse } from 'next/server';
import { getFoundingMemberStatus } from '@/services/foundingMemberService';
import { handleApiError, errors } from '@/utils/error';
import { logApiRequest, logApiResponse } from '@/utils/logger';

export const dynamic = 'force-dynamic'; // Disable caching for real-time data

/**
 * GET /api/founding-members/status
 * Returns founding member program status
 */
export async function GET() {
  const startTime = Date.now();

  try {
    logApiRequest('GET', '/api/founding-members/status', 'anonymous');

    // Get current status
    const status = await getFoundingMemberStatus();

    const responseData = {
      spotsRemaining: status.spotsRemaining,
      totalFoundingMembers: status.totalFoundingMembers,
      isAvailable: status.isAvailable,
      percentageFilled: Math.round(status.percentageFilled),
      urgencyLevel:
        status.spotsRemaining === 0
          ? 'sold_out'
          : status.spotsRemaining <= 5
            ? 'critical'
            : status.spotsRemaining <= 10
              ? 'high'
              : 'normal',
    };

    logApiResponse('GET', '/api/founding-members/status', 200, Date.now() - startTime);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30', // Cache for 30 seconds
      },
    });
  } catch (error) {
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

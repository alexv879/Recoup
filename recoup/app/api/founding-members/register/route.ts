/**
 * FOUNDING MEMBER REGISTRATION API
 * POST /api/founding-members/register
 *
 * Registers a user as a founding member when they subscribe to a paid tier.
 * This should be called during the Clerk Billing checkout process.
 *
 * Flow:
 * 1. User selects a founding tier on pricing page
 * 2. Clerk checkout completes successfully
 * 3. Clerk webhook fires (subscription.created)
 * 4. Webhook handler calls this endpoint to register founding member
 *
 * Alternatively, can be called directly during checkout flow before Clerk.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { registerAsFoundingMember, validateFoundingEligibility } from '@/services/foundingMemberService';
import { errors, handleApiError, UnauthorizedError, BadRequestError } from '@/utils/error';
import { logApiRequest, logApiResponse } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/founding-members/register
 * Register user as founding member
 *
 * Request body:
 * {
 *   "tier": "starter" | "pro" | "business"
 * }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logApiRequest('POST', '/api/founding-members/register', userId);

    // 2. Parse request body
    const body = await req.json();
    const { tier } = body;

    // 3. Validate tier
    if (!tier || !['starter', 'pro', 'business'].includes(tier)) {
      throw new BadRequestError('Invalid tier. Must be starter, pro, or business.');
    }

    // 4. Validate eligibility
    const eligibility = await validateFoundingEligibility(userId);
    if (!eligibility.isEligible) {
      throw new BadRequestError(eligibility.reason || 'Not eligible for founding member program');
    }

    // 5. Register as founding member
    const result = await registerAsFoundingMember(userId, tier);

    if (!result.success) {
      throw new BadRequestError(result.reason || 'Failed to register as founding member');
    }

    const responseData = {
      success: true,
      memberNumber: result.memberNumber,
      lockedInPrice: result.lockedInPrice,
      tier,
      message: result.alreadyMember
        ? 'You are already a founding member'
        : `Congratulations! You are founding member #${result.memberNumber}`,
    };

    logApiResponse('POST', '/api/founding-members/register', 200, Date.now() - startTime);

    return NextResponse.json(responseData);
  } catch (error) {
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

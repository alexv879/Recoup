/**
 * PREMIUM API: Agency Hand-off
 * POST /api/collections/agency-handoff
 *
 * Escalates a difficult invoice to a professional collection agency.
 * Requires minimum threshold of collection attempts and days overdue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createAgencyHandoff,
  checkEscalationEligibility,
  getAvailableAgencies,
  listFreelancerHandoffs,
  getHandoffDetails,
} from '@/services/agencyHandoffService';
import { requirePremiumAccess, logPremiumFeatureUsage } from '@/middleware/premiumGating';
import { requireClerkFeature } from '@/middleware/clerkPremiumGating';
import { errors, handleApiError } from '@/utils/error';
import { logApiRequest, logApiResponse } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * Create agency handoff
 * POST /api/collections/agency-handoff
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw errors.unauthorized();
    }

    logApiRequest('POST', '/api/collections/agency-handoff', userId);

    // 2. Check premium access (NEW: Clerk Billing feature check)
    await requireClerkFeature(userId, 'dedicated_account_manager');

    // 3. Parse request body
    const body = await req.json();
    const {
      invoiceId,
      agencyId,
      notes,
    }: {
      invoiceId: string;
      agencyId: string;
      notes?: string;
    } = body;

    if (!invoiceId || !agencyId) {
      throw errors.badRequest('Missing required fields: invoiceId, agencyId');
    }

    // 4. Check eligibility
    const eligibility = await checkEscalationEligibility(invoiceId);

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason,
          eligible: false,
        },
        { status: 400 }
      );
    }

    // 5. Create handoff
    const result = await createAgencyHandoff({
      invoiceId,
      freelancerId: userId,
      agencyId,
      notes,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create handoff');
    }

    // 6. Log premium feature usage
    await logPremiumFeatureUsage({
      userId,
      feature: 'agency_handoff',
      invoiceId,
      cost: 0, // Commission-based, not upfront cost
    });

    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/agency-handoff', 200, duration, userId);

    return NextResponse.json({
      success: true,
      message: 'Invoice escalated to agency successfully',
      handoffId: result.handoffId,
      note: 'Agency will begin collection efforts within 2-3 business days',
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/collections/agency-handoff', error.statusCode || 500, duration);

    if (error.statusCode === 402) {
      return NextResponse.json(
        {
          error: error.message,
          upgradeRequired: true,
          upgradeUrl: '/settings/billing/upgrade',
        },
        { status: 402 }
      );
    }

    return handleApiError(error);
  }
}

/**
 * Get handoff details or list handoffs
 * GET /api/collections/agency-handoff?handoffId=xxx
 * GET /api/collections/agency-handoff (list all)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw errors.unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const handoffId = searchParams.get('handoffId');
    const status = searchParams.get('status') as any;

    // Get specific handoff
    if (handoffId) {
      const handoff = await getHandoffDetails(handoffId);

      if (!handoff) {
        throw errors.notFound('Handoff not found');
      }

      // Verify ownership
      if (handoff.freelancerId !== userId) {
        throw errors.forbidden('You do not have access to this handoff');
      }

      return NextResponse.json({
        success: true,
        handoff,
      });
    }

    // List all handoffs for user
    const handoffs = await listFreelancerHandoffs(userId, {
      status,
      limit: 50,
    });

    return NextResponse.json({
      success: true,
      handoffs,
      count: handoffs.length,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

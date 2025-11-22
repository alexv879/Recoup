/**
 * Feature Flag Evaluation API
 *
 * POST /api/feature-flags/evaluate - Evaluate feature flags for current user
 *
 * Public endpoint (authenticated users only)
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  evaluateFeatureFlag,
  getCurrentEnvironment,
  type UserContext,
} from '@/lib/feature-flags-enhanced';
import { logError } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.flagKey) {
      return NextResponse.json(
        { error: 'Missing required field: flagKey' },
        { status: 400 }
      );
    }

    const user = await currentUser();

    // Build user context
    const userContext: UserContext = {
      userId,
      email: user?.emailAddresses[0]?.emailAddress,
      tier: body.tier || 'free',
      country: body.country,
      organization: body.organization,
      accountAge: body.accountAge,
      customAttributes: body.customAttributes || {},
    };

    const evaluation = await evaluateFeatureFlag(
      body.flagKey,
      userContext,
      getCurrentEnvironment()
    );

    return NextResponse.json({
      flagKey: body.flagKey,
      evaluation,
    });
  } catch (error) {
    logError('Error evaluating feature flag', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

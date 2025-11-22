/**
 * Feature Flags Admin API
 *
 * GET /api/admin/feature-flags - List all feature flags
 * POST /api/admin/feature-flags - Create new feature flag
 *
 * Admin-only endpoints for managing feature flags
 */

import { auth } from '@clerk/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllFeatureFlags,
  upsertFeatureFlag,
  getCurrentEnvironment,
  type FeatureFlagConfig,
} from '@/lib/feature-flags-enhanced';

// ============================================================================
// GET - List all feature flags
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here
    // const user = await getUserFromClerk(userId);
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    // }

    const environment = request.nextUrl.searchParams.get('environment') as any || getCurrentEnvironment();

    const flags = await getAllFeatureFlags(environment);

    return NextResponse.json({
      flags,
      environment,
      count: flags.length,
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create or update feature flag
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here

    const body = await request.json();

    // Validate required fields
    if (!body.key || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: key, name' },
        { status: 400 }
      );
    }

    // Set defaults
    const flagConfig: Omit<FeatureFlagConfig, 'createdAt' | 'updatedAt'> = {
      key: body.key,
      name: body.name,
      description: body.description || '',
      enabled: body.enabled !== undefined ? body.enabled : false,
      defaultValue: body.defaultValue !== undefined ? body.defaultValue : false,
      rolloutPercentage: body.rolloutPercentage || 0,
      userWhitelist: body.userWhitelist || [],
      userBlacklist: body.userBlacklist || [],
      targetingRules: body.targetingRules || [],
      variants: body.variants || [],
      startsAt: body.startsAt,
      expiresAt: body.expiresAt,
      environment: body.environment || getCurrentEnvironment(),
      tags: body.tags || [],
    };

    // Validate variants (if present)
    if (flagConfig.variants && flagConfig.variants.length > 0) {
      const totalWeight = flagConfig.variants.reduce((sum, v) => sum + v.weight, 0);
      if (totalWeight !== 100) {
        return NextResponse.json(
          { error: 'Variant weights must sum to 100' },
          { status: 400 }
        );
      }
    }

    const savedFlag = await upsertFeatureFlag(flagConfig, userId);

    return NextResponse.json({
      success: true,
      flag: savedFlag,
    });
  } catch (error) {
    console.error('Error creating/updating feature flag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

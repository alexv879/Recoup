/**
 * Feature Flag Individual Management API
 *
 * GET /api/admin/feature-flags/[key] - Get specific feature flag
 * PATCH /api/admin/feature-flags/[key] - Toggle or update feature flag
 * DELETE /api/admin/feature-flags/[key] - Delete feature flag
 */

import { auth } from '@clerk/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  getFeatureFlagConfig,
  toggleFeatureFlag,
  deleteFeatureFlag,
  getAuditLogs,
  getCurrentEnvironment,
} from '@/lib/feature-flags-enhanced';

interface RouteParams {
  params: {
    key: string;
  };
}

// ============================================================================
// GET - Get specific feature flag
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const environment = request.nextUrl.searchParams.get('environment') as any || getCurrentEnvironment();
    const includeAuditLogs = request.nextUrl.searchParams.get('includeAuditLogs') === 'true';

    const flag = await getFeatureFlagConfig(params.key, environment);

    if (!flag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    const response: any = { flag };

    if (includeAuditLogs) {
      const auditLogs = await getAuditLogs(params.key);
      response.auditLogs = auditLogs;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching feature flag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Toggle or update feature flag
// ============================================================================

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const environment = body.environment || getCurrentEnvironment();

    // Simple toggle
    if (body.enabled !== undefined) {
      const success = await toggleFeatureFlag(
        params.key,
        body.enabled,
        userId,
        environment
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to toggle feature flag' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        key: params.key,
        enabled: body.enabled,
      });
    }

    // TODO: Implement partial update logic for other fields

    return NextResponse.json(
      { error: 'No valid update provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete feature flag
// ============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const environment = request.nextUrl.searchParams.get('environment') as any || getCurrentEnvironment();

    const success = await deleteFeatureFlag(params.key, userId, environment);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete feature flag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      key: params.key,
      deleted: true,
    });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

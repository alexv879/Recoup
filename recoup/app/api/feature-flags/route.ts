/**
 * Feature Flags API Endpoint
 * 
 * GET /api/feature-flags
 * Returns current feature flag values for client-side checks
 * 
 * Used by:
 * - Pricing page to determine which version to show
 * - Admin dashboard to display current flags
 * - A/B testing framework
 * 
 * Phase 2 Task 8
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFeatureFlags, shouldShowPricingV3 } from '@/lib/featureFlags';
import { logError } from '@/utils/logger';

export async function GET(request: NextRequest) {
    try {
        // Get authenticated user (optional - public endpoint)
        const { userId } = await auth();

        // Fetch feature flags from Firestore
        const flags = await getFeatureFlags();

        // If user is authenticated, personalize rollout decision
        let shouldShowV3 = flags.PRICING_V3_ENABLED;
        if (userId && flags.PRICING_V3_ROLLOUT_PERCENTAGE < 100) {
            shouldShowV3 = shouldShowPricingV3(userId, flags.PRICING_V3_ROLLOUT_PERCENTAGE);
        }

        return NextResponse.json({
            success: true,
            flags: {
                PRICING_V3_ENABLED: shouldShowV3,
                PRICING_MIGRATION_MODE: flags.PRICING_MIGRATION_MODE,
                // Don't expose rollout percentage to clients (internal only)
            },
            userId: userId || null,
        });
    } catch (error) {
        logError('Error fetching feature flags', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch feature flags',
                flags: {
                    PRICING_V3_ENABLED: false, // Safe default
                    PRICING_MIGRATION_MODE: 'preview',
                },
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/feature-flags (Admin only)
 * Update feature flag values
 * 
 * Body:
 * {
 *   "PRICING_V3_ENABLED": true,
 *   "PRICING_MIGRATION_MODE": "active",
 *   "PRICING_V3_ROLLOUT_PERCENTAGE": 50
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // Authentication required
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Admin role check via Clerk metadata
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const isAdmin = user.publicMetadata?.role === 'admin' || user.publicMetadata?.isAdmin === true;

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Forbidden - Admin only' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate updates
        const allowedKeys = [
            'PRICING_V3_ENABLED',
            'PRICING_MIGRATION_MODE',
            'PRICING_V3_ROLLOUT_PERCENTAGE',
        ];

        const updates: any = {};
        for (const key of allowedKeys) {
            if (key in body) {
                updates[key] = body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { success: false, error: 'No valid updates provided' },
                { status: 400 }
            );
        }

        // Import update function dynamically to avoid circular dependencies
        const { updateFeatureFlags } = await import('@/lib/featureFlags');
        const success = await updateFeatureFlags(updates);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Failed to update feature flags' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            updates,
            message: 'Feature flags updated successfully',
        });
    } catch (error) {
        logError('Error updating feature flags', error);

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

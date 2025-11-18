import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCollectionEffectivenessIndex, getReminderEffectivenessRates } from '@/services/analyticsService';
import { logError } from '@/utils/logger';

/**
 * GET /api/dashboard/metrics
 * Returns Collection Effectiveness Index (CEI) and reminder effectiveness rates for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Calculate CEI and reminder effectiveness
        const cei = await getCollectionEffectivenessIndex(userId);
        const reminderRates = await getReminderEffectivenessRates(userId);

        return NextResponse.json({
            cei,
            reminderRates,
        });
    } catch (error) {
        logError('Failed to get dashboard metrics', error);
        return NextResponse.json({ error: 'Failed to get dashboard metrics' }, { status: 500 });
    }
}

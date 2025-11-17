import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRevenueByMonth } from '@/services/analyticsService';
import { logError } from '@/utils/logger';

/**
 * GET /api/dashboard/charts?type=revenue&period=12m
 * Get chart data for dashboard visualizations
 *
 * @query type: 'revenue' | 'collections' (default: 'revenue')
 * @query period: '6m' | '12m' | '24m' (default: '12m')
 * @returns { labels: [], data: [{date, revenue, collections}], trend: 'up' | 'down' | 'stable' }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'revenue';
    const period = searchParams.get('period') || '12m';

    // Parse period to months
    const months = parseInt(period.replace('m', '')) || 12;

    // Get revenue data
    const revenueData = await getRevenueByMonth(userId, months);

    // Format labels
    const labels = revenueData.map((data) => {
      const [year, month] = data.month.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
      return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    });

    // Calculate overall trend
    const firstHalf = revenueData.slice(0, Math.floor(months / 2));
    const secondHalf = revenueData.slice(Math.floor(months / 2));

    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length
      : 0;
    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length
      : 0;

    const trend = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'stable';

    return NextResponse.json({
      labels,
      data: revenueData,
      trend,
    });
  } catch (error) {
    logError('Failed to get chart data', error);
    return NextResponse.json({ error: 'Failed to get chart data' }, { status: 500 });
  }
}

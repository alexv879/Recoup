import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleError, UnauthorizedError } from '../../../../utils/error';
import { logger } from '../../../../utils/logger';
import { generateCashFlowForecast } from '../../../../lib/income-smoothing-service';

/**
 * POST /api/income-smoothing/forecast
 * Generates 6-12 month cash flow forecast
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in.');
    }

    const body = await req.json();
    const { months, historicalIncome, historicalExpenses, pendingInvoices, recurringExpenses, currentBufferBalance } = body;

    const forecast = generateCashFlowForecast({
      userId,
      months,
      historicalIncome,
      historicalExpenses,
      pendingInvoices,
      recurringExpenses,
      currentBufferBalance,
    });

    logger.info({ userId, forecastMonths: months, riskLevel: forecast.summary.riskLevel }, 'Cash flow forecast generated');

    return NextResponse.json({ forecast });
  } catch (error) {
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}

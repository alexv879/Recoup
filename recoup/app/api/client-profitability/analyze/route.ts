import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleError, UnauthorizedError } from '../../../../utils/error';
import { logger } from '../../../../utils/logger';
import { analyzeClientProfitability } from '../../../../lib/client-profitability-service';

/**
 * POST /api/client-profitability/analyze
 * Analyzes profitability for a specific client
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in.');
    }

    const body = await req.json();
    const { clientId, clientName, invoices, timeEntries, costToServeEntries, defaultHourlyRate } = body;

    const analysis = analyzeClientProfitability({
      clientId,
      clientName,
      invoices,
      timeEntries,
      costToServeEntries,
      defaultHourlyRate,
    });

    logger.info({ userId, clientId, netProfit: analysis.profitability.netProfit }, 'Client profitability analyzed');

    return NextResponse.json({ analysis });
  } catch (error) {
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}

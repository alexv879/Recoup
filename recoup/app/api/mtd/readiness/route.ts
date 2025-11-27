import { NextResponse } from 'next/server';
import { handleError, UnauthorizedError } from '../../../../utils/error';
import { logger } from '../../../../utils/logger';
import { calculateMTDReadiness } from '../../../../lib/mtd-compliance-service';

const getAuthUserId = (): string | null => {
  return 'user_2aXf...mock';
};

/**
 * POST /api/mtd/readiness
 * Calculates MTD readiness score
 */
export async function POST(req: Request) {
  try {
    const userId = getAuthUserId();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in.');
    }

    const body = await req.json();
    const { settings, hasDigitalRecords, quarterlySubmissionsOnTime } = body;

    const readiness = calculateMTDReadiness({
      settings,
      hasDigitalRecords,
      quarterlySubmissionsOnTime,
    });

    logger.info({ userId, score: readiness.score, status: readiness.status }, 'MTD readiness calculated');

    return NextResponse.json({ readiness });
  } catch (error) {
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}

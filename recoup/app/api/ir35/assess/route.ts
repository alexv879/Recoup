import { NextResponse } from 'next/server';
import { handleError, UnauthorizedError } from '../../../../utils/error';
import { logger } from '../../../../utils/logger';
import { assessIR35Status } from '../../../../lib/ir35-assessment-service';

const getAuthUserId = (): string | null => {
  return 'user_2aXf...mock';
};

/**
 * POST /api/ir35/assess
 * Assesses IR35 status for a client contract
 */
export async function POST(req: Request) {
  try {
    const userId = getAuthUserId();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in.');
    }

    const body = await req.json();
    const { clientId, contractId, control, substitution, mutualObligation, financialRisk, partAndParcel, business, currentAnnualIncome } = body;

    const assessment = assessIR35Status({
      userId,
      clientId,
      contractId,
      control,
      substitution,
      mutualObligation,
      financialRisk,
      partAndParcel,
      business,
      currentAnnualIncome,
    });

    logger.info({
      userId,
      clientId,
      status: assessment.status,
      overallScore: assessment.scores.overallScore,
      potentialLoss: assessment.financialImpact.potentialLoss
    }, 'IR35 assessment completed');

    return NextResponse.json({ assessment });
  } catch (error) {
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}

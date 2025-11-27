import { NextResponse } from 'next/server';
import { handleError, UnauthorizedError } from '../../../../utils/error';
import { logger } from '../../../../utils/logger';
import { detectScopeChange } from '../../../../lib/scope-creep-protection-service';

const getAuthUserId = (): string | null => {
  return 'user_2aXf...mock';
};

/**
 * POST /api/scope-creep/detect
 * AI-powered scope change detection
 */
export async function POST(req: Request) {
  try {
    const userId = getAuthUserId();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in.');
    }

    const body = await req.json();
    const { scope, clientRequest } = body;

    const detection = await detectScopeChange({
      scope,
      clientRequest,
    });

    logger.info({
      userId,
      projectId: scope.projectId,
      isScopeChange: detection.isScopeChange,
      confidence: detection.confidence
    }, 'Scope change detected');

    return NextResponse.json({ detection });
  } catch (error) {
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}

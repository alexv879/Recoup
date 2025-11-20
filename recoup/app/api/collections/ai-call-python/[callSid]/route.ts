/**
 * AI Voice Call Status API Route
 * Get AI call status and transcript by callSid
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError, handleApiError } from '@/utils/error';
import { logApiResponse } from '@/utils/logger';

export const dynamic = 'force-dynamic';

const PYTHON_AI_VOICE_SERVICE_URL = process.env.PYTHON_AI_VOICE_SERVICE_URL || 'http://localhost:8003';

/**
 * GET /api/collections/ai-call-python/[callSid]
 * Get AI call status and transcript
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ callSid: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    const { callSid } = await params;

    // Call Python service to get status
    const response = await fetch(`${PYTHON_AI_VOICE_SERVICE_URL}/call-status/${callSid}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get call status');
    }

    const callStatus = await response.json();

    const duration = Date.now() - startTime;
    logApiResponse('GET', '/api/collections/ai-call-python', 200, { duration, userId });

    return NextResponse.json(callStatus);

  } catch (error) {
    const duration = Date.now() - startTime;
    logApiResponse('GET', '/api/collections/ai-call-python', 500, { duration });
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

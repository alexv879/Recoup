/**
 * Voice Transcription API Route (Python Integration)
 * Proxies requests to Python voice service
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError, handleApiError } from '@/utils/error';
import { checkUserRateLimit } from '@/lib/ratelimit';
import { logApiRequest, logApiResponse } from '@/utils/logger';

export const dynamic = 'force-dynamic';

const PYTHON_VOICE_SERVICE_URL = process.env.PYTHON_VOICE_SERVICE_URL || 'http://localhost:8001';

/**
 * POST /api/voice/transcribe-python
 * Transcribe audio and parse invoice data using Python service
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logApiRequest('POST', '/api/voice/transcribe-python', userId);

    // 2. Rate limit check
    const { allowed, remaining } = checkUserRateLimit(userId, {
      windowMs: 60000,
      maxRequests: 3
    });

    if (!allowed) {
      throw new Error('Rate limit exceeded');
    }

    // 3. Get form data
    const formData = await req.formData();

    // 4. Forward to Python service
    const response = await fetch(`${PYTHON_VOICE_SERVICE_URL}/transcribe-and-parse`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Python service error');
    }

    const result = await response.json();

    // 5. Log and return
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/voice/transcribe-python', 200, { duration, userId });

    return NextResponse.json({
      ...result,
      remainingRequests: remaining
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logApiResponse('POST', '/api/voice/transcribe-python', 500, { duration });
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

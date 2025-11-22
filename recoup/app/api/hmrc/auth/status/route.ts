/**
 * HMRC Connection Status Endpoint
 *
 * Check if user has connected HMRC account
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isHMRCConnected } from '@/lib/hmrc-oauth';
import { logError } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const connected = await isHMRCConnected(userId);

    return NextResponse.json({
      connected,
    });
  } catch (error) {
    logError('HMRC status check error', error);
    return NextResponse.json(
      { error: 'Failed to check HMRC connection status' },
      { status: 500 }
    );
  }
}

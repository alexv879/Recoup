/**
 * HMRC Disconnect Endpoint
 *
 * Revokes HMRC access and deletes stored tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { revokeHMRCAccess } from '@/lib/hmrc-oauth';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await revokeHMRCAccess(userId);

    return NextResponse.json({
      success: true,
      message: 'HMRC connection removed successfully',
    });
  } catch (error) {
    console.error('HMRC disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect HMRC' },
      { status: 500 }
    );
  }
}

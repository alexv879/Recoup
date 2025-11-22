/**
 * HMRC VAT Obligations Endpoint
 *
 * Retrieve VAT obligations from HMRC
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { HMRCMTDClient } from '@/lib/hmrc-mtd-client';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's VAT registration number from profile
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const vrn = userDoc.data()?.vatRegistrationNumber;

    if (!vrn) {
      return NextResponse.json(
        { error: 'VAT registration number not set. Please update your profile.' },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const status = searchParams.get('status'); // 'O' for open, 'F' for fulfilled

    const client = new HMRCMTDClient(userId, vrn);

    // Fetch obligations
    const obligations = status === 'O'
      ? await client.getOpenVATObligations()
      : await client.getVATObligations(from, to);

    return NextResponse.json({
      obligations,
      count: obligations.length,
    });
  } catch (error: any) {
    console.error('HMRC obligations error:', error);

    if (error.message?.includes('not connected')) {
      return NextResponse.json(
        { error: 'HMRC not connected. Please authorize access first.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch VAT obligations' },
      { status: 500 }
    );
  }
}

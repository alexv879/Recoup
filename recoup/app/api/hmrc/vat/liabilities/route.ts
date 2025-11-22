/**
 * HMRC VAT Liabilities Endpoint
 *
 * Retrieve VAT liabilities from HMRC
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { HMRCMTDClient } from '@/lib/hmrc-mtd-client';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

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
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required query parameters: from, to (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    const client = new HMRCMTDClient(userId, vrn);
    const liabilities = await client.getVATLiabilities(from, to);

    return NextResponse.json({
      liabilities,
      count: liabilities.length,
      totalOutstanding: liabilities.reduce((sum, l) => sum + l.outstandingAmount, 0),
    });
  } catch (error: any) {
    console.error('HMRC liabilities error:', error);

    if (error.message?.includes('not connected')) {
      return NextResponse.json(
        { error: 'HMRC not connected. Please authorize access first.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch VAT liabilities' },
      { status: 500 }
    );
  }
}

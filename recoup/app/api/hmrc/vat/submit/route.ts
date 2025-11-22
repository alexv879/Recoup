/**
 * HMRC VAT Return Submission Endpoint
 *
 * Submit VAT return to HMRC MTD API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { HMRCMTDClient } from '@/lib/hmrc-mtd-client';
import { getFirestore } from 'firebase-admin/firestore';
import type { VATReturn } from '@/lib/mtd-vat';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { vatReturn, periodKey } = body as { vatReturn: VATReturn; periodKey: string };

    if (!vatReturn || !periodKey) {
      return NextResponse.json(
        { error: 'Missing required fields: vatReturn, periodKey' },
        { status: 400 }
      );
    }

    // Submit VAT return to HMRC
    const client = new HMRCMTDClient(userId, vrn);
    const response = await client.submitVATReturn(vatReturn, periodKey);

    // Store submission record in Firestore for audit trail
    await db.collection('vat_submissions').add({
      userId,
      vrn,
      periodKey,
      vatReturn,
      hmrcResponse: response,
      submittedAt: new Date().toISOString(),
      processingDate: response.processingDate,
      formBundleNumber: response.formBundleNumber,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error: any) {
    console.error('HMRC VAT submission error:', error);

    if (error.message?.includes('not connected')) {
      return NextResponse.json(
        { error: 'HMRC not connected. Please authorize access first.' },
        { status: 401 }
      );
    }

    if (error.name === 'HMRCAPIError') {
      return NextResponse.json(
        {
          error: error.message,
          hmrcErrors: error.hmrcErrors,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to submit VAT return' },
      { status: 500 }
    );
  }
}

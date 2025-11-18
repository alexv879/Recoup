/**
 * Twilio Call Status Webhook
 * Receives call status updates (initiated, ringing, answered, completed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/twilio/call-status
 * Handle call status updates from Twilio
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();

    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const answeredBy = formData.get('AnsweredBy') as string; // human, machine_start, machine_end_beep, etc.

    logger.info('Call status update received', {
      callSid,
      callStatus,
      callDuration,
      from,
      to,
      answeredBy,
    });

    // TODO: Update call record in Firestore
    // await firestore.collection('voice_calls').doc(callSid).update({
    //   status: callStatus,
    //   duration: parseInt(callDuration) || 0,
    //   answeredBy,
    //   updatedAt: new Date(),
    // });

    // Handle different statuses
    switch (callStatus) {
      case 'completed':
        logger.info('Call completed', {
          callSid,
          duration: callDuration,
          answeredBy,
        });

        // If it was voicemail, schedule follow-up
        if (answeredBy && answeredBy.startsWith('machine')) {
          logger.info('Voicemail detected, scheduling follow-up', { callSid });

          // TODO: Schedule follow-up call or SMS
        }

        break;

      case 'no-answer':
      case 'canceled':
      case 'busy':
      case 'failed':
        logger.warn('Call not completed successfully', {
          callSid,
          status: callStatus,
        });

        // TODO: Schedule retry or alternative contact method
        break;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Error processing call status webhook', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

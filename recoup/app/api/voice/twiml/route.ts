/**
 * TwiML Endpoint for Voice Calls
 * POST /api/voice/twiml
 *
 * Generates TwiML instructions for Twilio to connect
 * the call to our WebSocket streaming endpoint
 *
 * Flow:
 * 1. Twilio initiates outbound call
 * 2. Call connects, Twilio requests TwiML from this endpoint
 * 3. We return TwiML with WebSocket stream URL
 * 4. Twilio streams audio to/from our WebSocket endpoint
 * 5. WebSocket endpoint bridges to OpenAI Realtime API
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateStreamTwiML } from '@/lib/voice/twilio-client';
import { logInfo, logError } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * Handle TwiML request from Twilio
 * Returns TwiML that connects to WebSocket stream
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse Twilio callback parameters
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;

    logInfo('TwiML request received', {
      callSid,
      from,
      to,
      callStatus
    });

    // Get base URL for WebSocket stream endpoint
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    // WebSocket URL for streaming
    // Note: Use wss:// in production, ws:// in development
    const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
    const streamUrl = `${wsProtocol}://${host}/api/voice/stream?callSid=${callSid}`;

    logInfo('Generating TwiML with stream URL', {
      callSid,
      streamUrl
    });

    // Generate TwiML that connects to our WebSocket
    const twiml = generateStreamTwiML(streamUrl);

    // Return TwiML as XML
    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  } catch (error) {
    logError('TwiML generation failed', error as Error);

    // Return error TwiML that hangs up
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy-Neural" language="en-GB">
    We're sorry, but we're experiencing technical difficulties. Please try again later.
  </Say>
  <Hangup/>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  }
}

/**
 * Handle call status callbacks from Twilio
 * POST /api/voice/twiml/status
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const callSid = searchParams.get('CallSid');
    const callStatus = searchParams.get('CallStatus');
    const duration = searchParams.get('CallDuration');
    const recordingUrl = searchParams.get('RecordingUrl');
    const answeredBy = searchParams.get('AnsweredBy'); // human, machine_start, fax

    logInfo('Call status callback', {
      callSid,
      callStatus,
      duration,
      answeredBy
    });

    if (!callSid) {
      return NextResponse.json(
        { success: false, error: 'Missing CallSid' },
        { status: 400 }
      );
    }

    // Only process final states
    if (!['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(callStatus || '')) {
      logInfo('Ignoring non-final status', { callStatus });
      return NextResponse.json({ success: true, message: 'Status noted' });
    }

    const { db, FieldValue } = await import('@/lib/firebase');

    // Find collection attempt by callSID
    const attemptSnapshot = await db
      .collection('collection_attempts')
      .where('callSID', '==', callSid)
      .limit(1)
      .get();

    if (attemptSnapshot.empty) {
      logError('Collection attempt not found', new Error(`CallSid: ${callSid}`));
      return NextResponse.json(
        { success: false, error: 'Collection attempt not found' },
        { status: 404 }
      );
    }

    const attemptDoc = attemptSnapshot.docs[0];
    const attemptData = attemptDoc.data();

    // Calculate actual cost
    const durationMinutes = duration ? parseInt(duration) / 60 : 0;
    const { estimateCollectionCallCost } = await import('@/lib/voice/voice-call-orchestrator');
    const costEstimate = estimateCollectionCallCost(durationMinutes);

    // Determine outcome if not already set
    let outcome = attemptData.callOutcome;
    let result = attemptData.result;

    if (!outcome || outcome === 'in_progress') {
      if (callStatus === 'completed') {
        if (answeredBy === 'machine_start') {
          outcome = 'voicemail';
          result = 'voicemail';
        } else if (!attemptData.callOutcome) {
          // Call completed but no outcome set - likely no promise/dispute
          outcome = 'call_back_requested';
          result = 'pending';
        }
      } else if (callStatus === 'busy' || callStatus === 'no-answer') {
        outcome = 'no_answer';
        result = 'failed';
      } else if (callStatus === 'failed') {
        outcome = 'failed';
        result = 'failed';
      }
    }

    // Update collection attempt with final status
    await attemptDoc.ref.update({
      callStatus: callStatus,
      callDuration: duration ? parseInt(duration) : 0,
      callEndedAt: FieldValue.serverTimestamp(),
      callRecordingUrl: recordingUrl,
      answeredBy,
      actualCost: costEstimate.totalCost,
      costBreakdown: {
        twilio: costEstimate.twilioCost,
        openai: costEstimate.openaiCost
      },
      ...(outcome && { callOutcome: outcome }),
      ...(result && result !== attemptData.result && { result }),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Track analytics
    await db.collection('analytics_events').add({
      eventType: 'voice_call_completed',
      userId: attemptData.freelancerId,
      metadata: {
        callSid,
        invoiceId: attemptData.invoiceId,
        duration: duration ? parseInt(duration) : 0,
        outcome,
        cost: costEstimate.totalCost,
        answeredBy
      },
      timestamp: FieldValue.serverTimestamp()
    });

    // Notify freelancer of call completion
    let notificationMessage = '';
    let notificationTitle = '';

    switch (outcome) {
      case 'payment_promised':
        notificationTitle = 'Payment Promise Received';
        notificationMessage = 'Customer promised to pay. See call details for promise date.';
        break;
      case 'disputed':
        notificationTitle = 'Invoice Disputed';
        notificationMessage = 'Customer disputed the invoice during the call. Please review.';
        break;
      case 'no_answer':
        notificationTitle = 'Collection Call - No Answer';
        notificationMessage = 'Customer did not answer the collection call.';
        break;
      case 'voicemail':
        notificationTitle = 'Collection Call - Voicemail';
        notificationMessage = 'Voicemail detected. AI left a message.';
        break;
      case 'failed':
        notificationTitle = 'Collection Call Failed';
        notificationMessage = 'Collection call failed to connect.';
        break;
      default:
        notificationTitle = 'Collection Call Completed';
        notificationMessage = `Call completed. Duration: ${Math.floor(durationMinutes)} minutes.`;
    }

    await db.collection('notifications').add({
      userId: attemptData.freelancerId,
      type: 'voice_call_completed',
      title: notificationTitle,
      message: notificationMessage,
      read: false,
      actionUrl: `/invoices/${attemptData.invoiceId}`,
      metadata: {
        callSid,
        invoiceId: attemptData.invoiceId,
        outcome,
        duration: duration ? parseInt(duration) : 0,
        cost: costEstimate.totalCost
      },
      createdAt: FieldValue.serverTimestamp()
    });

    logInfo('Call status processed successfully', {
      callSid,
      outcome,
      duration: durationMinutes,
      cost: costEstimate.totalCost
    });

    return NextResponse.json({
      success: true,
      message: 'Status callback processed',
      outcome,
      cost: costEstimate.totalCost
    });
  } catch (error) {
    logError('Call status callback failed', error as Error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process status callback'
      },
      { status: 500 }
    );
  }
}

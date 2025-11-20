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
 * GET /api/voice/twiml/status
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const callSid = searchParams.get('CallSid');
    const callStatus = searchParams.get('CallStatus');
    const duration = searchParams.get('CallDuration');

    logInfo('Call status callback', {
      callSid,
      callStatus,
      duration
    });

    // TODO: Update call record in database
    // TODO: Track analytics
    // TODO: Trigger follow-up actions based on status

    return NextResponse.json({
      success: true,
      message: 'Status callback received'
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

/**
 * Twilio SMS Webhook Handler
 * Processes incoming SMS messages (STOP commands for PECR compliance)
 *
 * Twilio will POST to this endpoint when SMS are received
 * Configure in Twilio Console: Messaging > Settings > Webhook for incoming messages
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { processIncomingSMS } from '@/lib/twilio-sms';
import { logInfo, logError } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * Verify Twilio webhook signature
 * CRITICAL: Prevents spoofing of webhooks
 */
function verifyTwilioSignature(req: NextRequest, body: Record<string, string>): boolean {
  const signature = req.headers.get('X-Twilio-Signature');

  if (!signature) {
    logError('Missing Twilio signature', new Error('No X-Twilio-Signature header'));
    return false;
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    logError('Twilio auth token not configured', new Error('Missing TWILIO_AUTH_TOKEN'));
    return false;
  }

  try {
    const url = req.url;
    const validator = twilio.validateRequest(authToken, signature, url, body);

    if (!validator) {
      logError('Invalid Twilio signature', new Error('Signature mismatch'));
      return false;
    }

    return true;
  } catch (error) {
    logError('Twilio signature verification failed', error as Error);
    return false;
  }
}

/**
 * Handle incoming SMS webhook from Twilio
 * POST /api/webhook/twilio-sms
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse form data from Twilio
    const formData = await req.formData();

    const webhookData: Record<string, string> = {};
    formData.forEach((value, key) => {
      webhookData[key] = value.toString();
    });

    logInfo('Twilio SMS webhook received', {
      from: webhookData.From,
      to: webhookData.To,
      body: webhookData.Body?.substring(0, 50) // Log first 50 chars only
    });

    // CRITICAL: Verify Twilio signature to prevent spoofing
    const isValid = verifyTwilioSignature(req, webhookData);

    if (!isValid) {
      logError('Invalid Twilio signature - possible attack', new Error('Signature verification failed'));

      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 403,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    // Process the incoming SMS
    const result = await processIncomingSMS({
      From: webhookData.From,
      Body: webhookData.Body,
      MessageSid: webhookData.MessageSid
    });

    // Build TwiML response
    const VoiceResponse = twilio.twiml.MessagingResponse;
    const twiml = new VoiceResponse();

    if (result.handled && result.response) {
      // Send automated response for STOP commands
      twiml.message(result.response);
    }

    // Return TwiML response to Twilio
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    logError('Failed to process Twilio SMS webhook', error as Error);

    // Return empty TwiML to prevent Twilio retries
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    );
  }
}

/**
 * Handle GET requests (for testing)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Twilio SMS webhook endpoint',
    status: 'active',
    methods: ['POST'],
    description: 'This endpoint receives incoming SMS from Twilio for STOP/UNSUBSCRIBE handling (PECR compliance)'
  });
}

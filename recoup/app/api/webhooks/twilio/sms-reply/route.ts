/**
 * Twilio SMS Reply Webhook Handler
 * POST /api/webhooks/twilio/sms-reply
 *
 * Handles incoming SMS replies from clients, specifically STOP/UNSTOP keywords
 * for UK PECR compliance (opt-out requirements).
 *
 * Twilio automatically handles STOP keywords, but we need to record them in our database
 * to ensure we never send SMS to opted-out numbers.
 *
 * UK Legal Requirements:
 * - PECR (Privacy and Electronic Communications Regulations) 2003
 * - Must honor STOP requests immediately
 * - Must provide easy opt-out mechanism
 * - Must track opt-out status permanently
 *
 * Twilio Keywords:
 * - STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT → Opt out
 * - START, UNSTOP, YES → Opt back in
 * - HELP → Send help message
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, FieldValue } from '@/lib/firebase';
import { logInfo, logError } from '@/utils/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Normalize phone number for consistent storage
 * Removes all non-digit characters except leading +
 */
function normalizePhoneNumber(phone: string): string {
  // Keep leading + for international format, remove all other non-digits
  return phone.replace(/[^\d+]/g, '').replace(/\+(\d+)/, '+$1');
}

/**
 * Verify Twilio webhook signature
 * Prevents unauthorized POST requests
 */
function verifyTwilioSignature(
  authToken: string,
  twilioSignature: string,
  url: string,
  params: Record<string, string>
): boolean {
  try {
    // Twilio signature verification algorithm
    const data = url + Object.keys(params).sort().map(key => key + params[key]).join('');
    const hmac = crypto.createHmac('sha1', authToken);
    const expectedSignature = hmac.update(Buffer.from(data, 'utf-8')).digest('base64');

    return expectedSignature === twilioSignature;
  } catch (error) {
    logError('[twilio/sms-reply] Error verifying signature:', error);
    return false;
  }
}

/**
 * Handle incoming SMS from Twilio
 * POST /api/webhooks/twilio/sms-reply
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    logInfo('[twilio/sms-reply] Received incoming SMS webhook');

    // 1. Parse form data (Twilio sends application/x-www-form-urlencoded)
    const formData = await req.formData();
    const params: Record<string, string> = {};

    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // 2. Verify Twilio signature (security)
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN!;
    const signature = req.headers.get('x-twilio-signature') || '';
    const url = req.url;

    // Skip signature verification in development
    if (process.env.NODE_ENV !== 'development') {
      const isValid = verifyTwilioSignature(twilioAuthToken, signature, url, params);

      if (!isValid) {
        logError('[twilio/sms-reply] Invalid Twilio signature');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 3. Extract SMS data
    const {
      From: fromNumber,
      To: toNumber,
      Body: messageBody,
      MessageSid: messageSid,
      SmsStatus: smsStatus,
    } = params;

    if (!fromNumber || !messageBody) {
      logError('[twilio/sms-reply] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(fromNumber);
    const messageText = messageBody.trim().toUpperCase();

    logInfo('[twilio/sms-reply] Incoming SMS', {
      from: normalizedPhone,
      to: toNumber,
      message: messageText,
      messageSid,
    });

    // 4. Handle STOP keywords (opt-out)
    const stopKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];

    if (stopKeywords.includes(messageText)) {
      await handleOptOut(normalizedPhone, messageSid);

      // Return TwiML response confirming opt-out
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You've been unsubscribed from invoice reminders. You will not receive further SMS messages. Reply START to opt back in.</Message>
</Response>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/xml',
          },
        }
      );
    }

    // 5. Handle START keywords (opt-in)
    const startKeywords = ['START', 'UNSTOP', 'YES'];

    if (startKeywords.includes(messageText)) {
      await handleOptIn(normalizedPhone, messageSid);

      // Return TwiML response confirming opt-in
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You've been re-subscribed to invoice reminders. Reply STOP to opt out.</Message>
</Response>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/xml',
          },
        }
      );
    }

    // 6. Handle HELP keyword
    if (messageText === 'HELP' || messageText === 'INFO') {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>This is an automated invoice reminder service. Reply STOP to unsubscribe or START to re-subscribe. For support, contact the business that sent this message.</Message>
</Response>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/xml',
          },
        }
      );
    }

    // 7. Log other messages (potential replies/questions)
    // Store in Firestore for freelancer to review
    await db.collection('sms_replies').add({
      fromNumber: normalizedPhone,
      toNumber,
      messageBody,
      messageSid,
      smsStatus,
      receivedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    logInfo('[twilio/sms-reply] Non-keyword message received and logged', {
      from: normalizedPhone,
      message: messageText,
    });

    // Return empty TwiML response (don't auto-reply to regular messages)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('[twilio/sms-reply] Error processing incoming SMS:', error);

    // Return empty TwiML to avoid Twilio retry storms
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );
  }
}

/**
 * Handle client opting out (STOP keyword)
 */
async function handleOptOut(phoneNumber: string, messageSid: string): Promise<void> {
  try {
    const optOutRef = db.collection('sms_opt_outs').doc(phoneNumber);

    // Create or update opt-out record
    await optOutRef.set({
      phoneNumber,
      optedOutAt: FieldValue.serverTimestamp(),
      optOutMethod: 'sms_reply',
      messageSid,
      status: 'opted_out',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Log to audit trail
    await db.collection('sms_opt_out_audit').add({
      phoneNumber,
      action: 'opt_out',
      method: 'sms_reply',
      messageSid,
      timestamp: FieldValue.serverTimestamp(),
    });

    logInfo('[twilio/sms-reply] Phone number opted out', {
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask for privacy
      messageSid,
    });

  } catch (error) {
    logError('[twilio/sms-reply] Error handling opt-out:', error);
    throw error;
  }
}

/**
 * Handle client opting back in (START keyword)
 */
async function handleOptIn(phoneNumber: string, messageSid: string): Promise<void> {
  try {
    const optOutRef = db.collection('sms_opt_outs').doc(phoneNumber);

    // Check if opt-out record exists
    const optOutDoc = await optOutRef.get();

    if (optOutDoc.exists) {
      // Update status to opted_in (keep record for audit trail)
      await optOutRef.update({
        status: 'opted_in',
        optedInAt: FieldValue.serverTimestamp(),
        optInMethod: 'sms_reply',
        optInMessageSid: messageSid,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Delete the document to allow sending again
      // (our SMS endpoint checks if doc exists, so deleting = allowed)
      await optOutRef.delete();
    }

    // Log to audit trail
    await db.collection('sms_opt_out_audit').add({
      phoneNumber,
      action: 'opt_in',
      method: 'sms_reply',
      messageSid,
      timestamp: FieldValue.serverTimestamp(),
    });

    logInfo('[twilio/sms-reply] Phone number opted in', {
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask for privacy
      messageSid,
    });

  } catch (error) {
    logError('[twilio/sms-reply] Error handling opt-in:', error);
    throw error;
  }
}

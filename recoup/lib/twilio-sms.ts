/**
 * Twilio SMS Integration with PECR Compliance
 * Handles SMS sending for collection reminders with UK legal compliance
 *
 * PECR (Privacy and Electronic Communications Regulations) Requirements:
 * - Users must be able to opt-out of SMS (reply STOP)
 * - Opt-out must be processed immediately
 * - Opt-out list must be maintained
 * - Every SMS must include opt-out instructions
 *
 * Penalty for non-compliance: Up to £500,000
 */

import twilio from 'twilio';
import { logInfo, logError } from '@/utils/logger';
import { db } from '@/lib/firebaseAdmin';

// Initialize Twilio client
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export interface SMSTemplate {
    template: 'payment_reminder' | 'final_notice' | 'payment_link';
    variables: {
        debtorName: string;
        amount: number;
        invoiceNumber: string;
        businessName: string;
    };
}

export interface SMSOptions {
    recipientPhone: string;
    recipientName?: string;
    invoiceReference: string;
    amount: number;
    dueDate: string;
    template: string;
    paymentLink?: string;
    businessName: string;
    invoiceId: string;
    freelancerId: string;
    clientId: string; // Required for opt-out tracking
}

export interface SMSResult {
    success: boolean;
    messageSid?: string;
    status?: string;
    cost?: number;
    error?: string;
    optedOut?: boolean; // True if user has opted out
}

/**
 * Check if client has opted out of SMS
 */
export async function hasOptedOutOfSMS(clientId: string): Promise<boolean> {
  try {
    const clientRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      return false;
    }

    const data = clientDoc.data();
    return data?.smsOptedOut === true;
  } catch (error) {
    logError('Failed to check SMS opt-out status', error as Error);
    // Fail safe: if we can't check, assume opted out
    return true;
  }
}

/**
 * Record SMS opt-out for a client
 */
export async function recordSMSOptOut(
  clientId: string,
  phone: string,
  reason?: string
): Promise<void> {
  try {
    const clientRef = db.collection('clients').doc(clientId);

    await clientRef.update({
      smsOptedOut: true,
      smsOptOutDate: new Date(),
      smsOptOutReason: reason || 'User requested STOP',
      updatedAt: new Date()
    });

    // Also log opt-out for compliance
    await db.collection('sms_opt_outs').add({
      clientId,
      phone,
      reason: reason || 'User requested STOP',
      timestamp: new Date()
    });

    logInfo('SMS opt-out recorded', { clientId, phone });
  } catch (error) {
    logError('Failed to record SMS opt-out', error as Error);
    throw error;
  }
}

/**
 * Send a collection SMS via Twilio with PECR compliance
 */
export async function sendCollectionSMS(options: SMSOptions): Promise<SMSResult> {
    if (!twilioClient) {
      return {
        success: false,
        error: 'Twilio not configured'
      };
    }

    if (!TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        error: 'Twilio phone number not configured'
      };
    }

    try {
        // PECR Compliance: Check if user has opted out
        const optedOut = await hasOptedOutOfSMS(options.clientId);

        if (optedOut) {
          logInfo('SMS not sent - user opted out', {
            clientId: options.clientId,
            phone: options.recipientPhone
          });

          return {
            success: false,
            error: 'User has opted out of SMS',
            optedOut: true
          };
        }

        // Build SMS message with opt-out instructions (PECR requirement)
        const message = buildSMSMessage(options);

        // Validate phone number (E.164 format)
        const validatedPhone = validatePhoneNumber(options.recipientPhone);

        if (!validatedPhone) {
          return {
            success: false,
            error: 'Invalid phone number format'
          };
        }

        logInfo('Sending collection SMS', {
          to: validatedPhone,
          from: TWILIO_PHONE_NUMBER,
          invoiceRef: options.invoiceReference
        });

        // Send SMS via Twilio
        const twilioMessage = await twilioClient.messages.create({
          to: validatedPhone,
          from: TWILIO_PHONE_NUMBER,
          body: message
        });

        // Log SMS for tracking
        await logSMSSent({
          messageSid: twilioMessage.sid,
          clientId: options.clientId,
          invoiceId: options.invoiceId,
          phone: validatedPhone,
          message,
          status: twilioMessage.status
        });

        logInfo('SMS sent successfully', {
          messageSid: twilioMessage.sid,
          status: twilioMessage.status
        });

        return {
            success: true,
            messageSid: twilioMessage.sid,
            status: twilioMessage.status,
            cost: calculateSMSCost(),
        };
    } catch (error) {
        logError('Failed to send collection SMS', error as Error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Build SMS message with PECR-compliant opt-out instructions
 */
function buildSMSMessage(options: SMSOptions): string {
  const { businessName, recipientName, invoiceReference, amount, dueDate, paymentLink, template } = options;

  let message = '';

  switch (template) {
    case 'payment_reminder':
      message = `Hi${recipientName ? ` ${recipientName}` : ''}, this is a reminder from ${businessName}. Invoice ${invoiceReference} for £${amount.toFixed(2)} was due on ${dueDate} and is now overdue. Please arrange payment at your earliest convenience.`;
      break;

    case 'final_notice':
      message = `FINAL NOTICE from ${businessName}: Invoice ${invoiceReference} (£${amount.toFixed(2)}) remains unpaid. To avoid further action, please pay immediately.`;
      break;

    case 'payment_link':
      message = `Hi from ${businessName}. Invoice ${invoiceReference} for £${amount.toFixed(2)} is due ${dueDate}. Pay now: ${paymentLink || '[link]'}`;
      break;

    default:
      message = `Reminder from ${businessName}: Invoice ${invoiceReference} (£${amount.toFixed(2)}) requires payment.`;
  }

  // CRITICAL: PECR compliance - add opt-out instructions to EVERY SMS
  message += '\n\nReply STOP to opt out of SMS reminders.';

  return message;
}

/**
 * Validate UK phone number (E.164 format)
 */
function validatePhoneNumber(phone: string): string | null {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // UK mobile: +44 7XXX XXXXXX or 07XXX XXXXXX
  // UK landline: +44 1XXX XXXXXX or 01XXX XXXXXX
  const ukMobileRegex = /^(\+44|0)?7\d{9}$/;
  const ukLandlineRegex = /^(\+44|0)?[1-9]\d{9}$/;

  if (ukMobileRegex.test(cleaned)) {
    // Convert to E.164 format
    if (cleaned.startsWith('+44')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+44' + cleaned.substring(1);
    } else {
      return '+44' + cleaned;
    }
  }

  if (ukLandlineRegex.test(cleaned)) {
    if (cleaned.startsWith('+44')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+44' + cleaned.substring(1);
    } else {
      return '+44' + cleaned;
    }
  }

  // Invalid UK phone number
  return null;
}

/**
 * Calculate SMS cost (UK rates)
 */
function calculateSMSCost(): number {
  // Twilio UK SMS cost: ~£0.04 per message
  return 0.04;
}

/**
 * Log SMS sent for tracking and compliance
 */
async function logSMSSent(data: {
  messageSid: string;
  clientId: string;
  invoiceId: string;
  phone: string;
  message: string;
  status: string;
}): Promise<void> {
  try {
    await db.collection('sms_log').add({
      ...data,
      timestamp: new Date(),
      type: 'outbound'
    });
  } catch (error) {
    logError('Failed to log SMS', error as Error);
    // Don't throw - logging failure shouldn't stop SMS sending
  }
}

/**
 * Process incoming SMS (for STOP/UNSUBSCRIBE handling)
 * This should be called from the Twilio webhook handler
 */
export async function processIncomingSMS(data: {
  From: string;
  Body: string;
  MessageSid: string;
}): Promise<{ handled: boolean; response?: string }> {
  try {
    const phone = data.From;
    const body = data.Body.trim().toUpperCase();

    // PECR Compliance: Handle STOP keywords
    const stopKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'OPTOUT'];

    if (stopKeywords.includes(body)) {
      // Find client by phone number
      const clientsRef = db.collection('clients');
      const snapshot = await clientsRef.where('phone', '==', phone).get();

      if (snapshot.empty) {
        logInfo('SMS STOP received from unknown number', { phone });
        return {
          handled: true,
          response: 'You have been unsubscribed from SMS reminders.'
        };
      }

      // Opt out all clients with this phone number
      const batch = db.batch();

      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          smsOptedOut: true,
          smsOptOutDate: new Date(),
          smsOptOutReason: `User replied: ${body}`,
          updatedAt: new Date()
        });
      });

      await batch.commit();

      // Log opt-out
      await db.collection('sms_opt_outs').add({
        phone,
        clientIds: snapshot.docs.map(doc => doc.id),
        reason: `User replied: ${body}`,
        timestamp: new Date()
      });

      logInfo('SMS opt-out processed', {
        phone,
        clientCount: snapshot.size
      });

      return {
        handled: true,
        response: 'You have been unsubscribed from SMS reminders. You will not receive further messages from us.'
      };
    }

    // Not a STOP command - log for review
    await db.collection('sms_log').add({
      messageSid: data.MessageSid,
      phone,
      message: data.Body,
      timestamp: new Date(),
      type: 'inbound',
      handled: false
    });

    return {
      handled: false
    };
  } catch (error) {
    logError('Failed to process incoming SMS', error as Error);

    return {
      handled: false
    };
  }
}
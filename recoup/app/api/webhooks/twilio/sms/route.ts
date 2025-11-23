/**
 * Twilio SMS Webhook Handler
 *
 * Purpose: Handle incoming SMS messages for opt-out processing
 *
 * CRITICAL LEGAL REQUIREMENT (PECR Compliance):
 * UK Privacy and Electronic Communications Regulations (PECR) require:
 * - Users must be able to opt out of SMS marketing/collections
 * - Opt-out must be honored immediately
 * - Confirmation message must be sent
 * - Penalty for non-compliance: Up to £500,000 fine
 *
 * Supported Keywords:
 * - STOP, UNSUBSCRIBE, CANCEL, END, QUIT, OPTOUT
 * - Case-insensitive
 * - Works in any language with these English keywords
 *
 * Task 1.2 - Production Readiness Refactoring
 *
 * @route POST /api/webhooks/twilio/sms
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import twilio from 'twilio';

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

// Twilio webhook signature validation
const twilioWebhookSecret = process.env.TWILIO_AUTH_TOKEN!;

// Opt-out keywords (case-insensitive)
const OPT_OUT_KEYWORDS = [
    'STOP',
    'STOPALL',
    'UNSUBSCRIBE',
    'CANCEL',
    'END',
    'QUIT',
    'OPTOUT',
    'OPT-OUT',
    'OPT OUT',
];

// Opt-in keywords (for re-subscribing)
const OPT_IN_KEYWORDS = [
    'START',
    'YES',
    'UNSTOP',
    'RESUME',
    'SUBSCRIBE',
];

interface TwilioIncomingMessage {
    MessageSid: string;
    From: string; // Client's phone number
    To: string; // Your Twilio number
    Body: string; // Message content
    AccountSid: string;
}

/**
 * Find user ID by client phone number
 *
 * Searches across all invoices to find the freelancer who owns this client
 */
async function findUserIdByClientPhone(clientPhone: string): Promise<string | null> {
    try {
        // Normalize phone number (remove spaces, dashes, etc.)
        const normalizedPhone = clientPhone.replace(/[\s\-\(\)]/g, '');

        // Search invoices for this client phone number
        const invoicesSnapshot = await db
            .collection('invoices')
            .where('clientPhone', '==', normalizedPhone)
            .limit(1)
            .get();

        if (invoicesSnapshot.empty) {
            console.log(`No invoice found for phone number: ${normalizedPhone}`);
            return null;
        }

        const invoice = invoicesSnapshot.docs[0].data();
        return invoice.freelancerId || invoice.userId;
    } catch (error) {
        console.error('Error finding user by client phone:', error);
        return null;
    }
}

/**
 * Update user's SMS opt-out list
 */
async function updateSmsOptOut(
    userId: string,
    clientPhone: string,
    optOut: boolean
): Promise<boolean> {
    try {
        const normalizedPhone = clientPhone.replace(/[\s\-\(\)]/g, '');

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.error(`User ${userId} not found`);
            return false;
        }

        const userData = userDoc.data();
        const collectionsConsent = userData?.collectionsConsent || {};
        const smsOptOuts = collectionsConsent.smsOptOuts || {};

        if (optOut) {
            // Add phone number to opt-out list
            smsOptOuts[normalizedPhone] = {
                optedOutAt: new Date().toISOString(),
                reason: 'user_request',
                keyword: 'STOP',
            };
        } else {
            // Remove phone number from opt-out list (opt-in)
            delete smsOptOuts[normalizedPhone];
        }

        // Update Firestore
        await userRef.update({
            'collectionsConsent.smsOptOuts': smsOptOuts,
            'collectionsConsent.lastUpdated': new Date().toISOString(),
        });

        console.log(`✅ SMS opt-${optOut ? 'out' : 'in'} recorded for ${normalizedPhone} (User: ${userId})`);

        // Log analytics event
        await db.collection('user_events').add({
            user_id: userId,
            event: optOut ? 'sms_opt_out' : 'sms_opt_in',
            event_category: 'compliance',
            event_data: {
                client_phone: normalizedPhone,
                timestamp: new Date().toISOString(),
            },
            created_at: new Date().toISOString(),
        });

        return true;
    } catch (error) {
        console.error('Error updating SMS opt-out:', error);
        return false;
    }
}

/**
 * Send confirmation SMS
 */
async function sendConfirmationSms(
    toPhone: string,
    fromPhone: string,
    optOut: boolean
): Promise<void> {
    try {
        const message = optOut
            ? 'You have been unsubscribed from Recoup payment reminders. Reply START to re-subscribe.'
            : 'You have been re-subscribed to Recoup payment reminders. Reply STOP to unsubscribe.';

        await twilioClient.messages.create({
            body: message,
            from: fromPhone,
            to: toPhone,
        });

        console.log(`✅ Confirmation SMS sent to ${toPhone}`);
    } catch (error) {
        console.error('Error sending confirmation SMS:', error);
        // Don't throw - confirmation failure shouldn't block opt-out processing
    }
}

/**
 * Validate Twilio webhook signature
 *
 * SECURITY: This prevents spoofed webhook requests
 */
function validateTwilioSignature(
    req: NextRequest,
    body: Record<string, string>
): boolean {
    try {
        const signature = req.headers.get('x-twilio-signature');
        if (!signature) {
            console.error('Missing Twilio signature header');
            return false;
        }

        const url = req.url;

        // Twilio uses the full URL to generate the signature
        const isValid = twilio.validateRequest(
            twilioWebhookSecret,
            signature,
            url,
            body
        );

        if (!isValid) {
            console.error('Invalid Twilio signature');
        }

        return isValid;
    } catch (error) {
        console.error('Error validating Twilio signature:', error);
        return false;
    }
}

/**
 * Main webhook handler
 */
export async function POST(req: NextRequest) {
    try {
        console.log('📱 Incoming Twilio SMS webhook');

        // Parse the Twilio webhook payload
        const formData = await req.formData();
        const body: Record<string, string> = {};

        formData.forEach((value, key) => {
            body[key] = value.toString();
        });

        const message: TwilioIncomingMessage = {
            MessageSid: body.MessageSid,
            From: body.From,
            To: body.To,
            Body: body.Body,
            AccountSid: body.AccountSid,
        };

        console.log(`From: ${message.From}, Body: "${message.Body}"`);

        // Validate Twilio signature (SECURITY)
        if (process.env.NODE_ENV === 'production') {
            const isValid = validateTwilioSignature(req, body);
            if (!isValid) {
                return NextResponse.json(
                    { error: 'Invalid signature' },
                    { status: 401 }
                );
            }
        }

        // Check if message contains opt-out keyword
        const messageBody = message.Body.trim().toUpperCase();
        const isOptOut = OPT_OUT_KEYWORDS.some(keyword => messageBody === keyword);
        const isOptIn = OPT_IN_KEYWORDS.some(keyword => messageBody === keyword);

        if (!isOptOut && !isOptIn) {
            console.log('Message does not contain opt-out/opt-in keyword - ignoring');

            // Return TwiML response (required by Twilio)
            return new NextResponse(
                '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
                {
                    status: 200,
                    headers: { 'Content-Type': 'text/xml' },
                }
            );
        }

        // Find the user ID for this client phone number
        const userId = await findUserIdByClientPhone(message.From);

        if (!userId) {
            console.error(`Could not find user for phone number: ${message.From}`);

            // Still send a confirmation (good UX, even if we can't find the user)
            await sendConfirmationSms(message.From, message.To, isOptOut);

            return new NextResponse(
                '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
                {
                    status: 200,
                    headers: { 'Content-Type': 'text/xml' },
                }
            );
        }

        // Update the opt-out status
        const updateSuccess = await updateSmsOptOut(userId, message.From, isOptOut);

        if (!updateSuccess) {
            console.error('Failed to update SMS opt-out status');
            return NextResponse.json(
                { error: 'Failed to process opt-out' },
                { status: 500 }
            );
        }

        // Send confirmation SMS
        await sendConfirmationSms(message.From, message.To, isOptOut);

        // Return TwiML response (required by Twilio)
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            {
                status: 200,
                headers: { 'Content-Type': 'text/xml' },
            }
        );
    } catch (error) {
        console.error('Error processing Twilio SMS webhook:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Health check endpoint
 */
export async function GET(req: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        service: 'twilio-sms-webhook',
        timestamp: new Date().toISOString(),
    });
}

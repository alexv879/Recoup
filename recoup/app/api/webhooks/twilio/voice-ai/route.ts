/**
 * Twilio Voice AI Webhook - OpenAI Realtime Audio Streaming
 * POST /api/webhooks/twilio/voice-ai
 *
 * This webhook is called when Twilio connects an outbound call.
 * It returns TwiML to stream audio to/from OpenAI Realtime API.
 *
 * Architecture:
 * 1. Twilio initiates call to debtor
 * 2. Call connects to this webhook
 * 3. This returns TwiML with <Connect><Stream> to WebSocket endpoint
 * 4. Twilio streams audio to /api/webhooks/twilio/voice-stream
 * 5. Voice stream handler bidirectionally pipes audio to OpenAI Realtime API
 * 6. AI agent conducts conversation following UK debt collection regulations
 * 7. Call outcome stored in Firestore when call completes
 *
 * UK Debt Collection Call Regulations Compliance:
 * - Must identify caller and purpose immediately (handled by AI prompt)
 * - Must request recording consent (handled by AI prompt)
 * - Must not be threatening, abusive, or harassing (enforced by AI prompt)
 * - Must respect request to stop calling (AI agent ends call)
 * - Must allow debtor to dispute the debt (documented in transcript)
 * - Call recordings stored securely with GDPR compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyTwilioSignature } from '@/lib/twilio-verify';
import { logInfo, logError } from '@/utils/logger';
import { storeFailedWebhook, generateCorrelationId } from '@/lib/webhook-recovery';
import { validateWebhookOrigin, validateContentType } from '@/lib/csrf-protection';
import { checkWebhookRateLimit, getRateLimitHeaders } from '@/lib/webhook-ratelimit';

export const dynamic = 'force-dynamic';

/**
 * System prompt for AI agent (UK debt collection regulations)
 * Configured for empathetic, regulation-compliant conversations
 */
const AI_AGENT_SYSTEM_PROMPT = `You are an AI collections agent calling on behalf of a freelancer to request payment for an overdue invoice.

CRITICAL RULES (UK Debt Collection Regulations):
1. Immediately identify yourself: "This is an automated call from {businessName} regarding an outstanding invoice."
2. Ask for consent to record: "This call may be recorded for training and quality purposes. Do you consent to continue?"
3. If they say NO to recording, end call politely immediately.
4. Be professional, empathetic, and non-threatening at all times.
5. NEVER be aggressive, threatening, or harassing.
6. If they request to stop calling, agree immediately and end call.
7. If they dispute the debt, note it and offer to send details in writing.
8. If they claim financial hardship, be understanding and offer payment plans.
9. Keep call under 10 minutes unless debtor is actively engaging.

YOUR GOALS (in priority order):
1. BEST: Collect full payment immediately via card payment link
2. GOOD: Negotiate payment plan with first payment today
3. ACCEPTABLE: Get promise to pay by specific date
4. MINIMUM: Understand their situation and document for follow-up

CONVERSATION FLOW:
1. Opening & Consent (30 seconds)
   - Identify yourself and purpose
   - Request recording consent
   - Confirm you're speaking to {recipientName}

2. Invoice Details (30 seconds)
   - State invoice {invoiceReference} for £{amount}
   - Due date was {dueDate}
   - Now {daysPastDue} days overdue

3. Payment Request (1 minute)
   - Ask for immediate payment
   - If hesitant, explain consequences (facts, not threats)
   - Offer secure payment link via SMS

4. Negotiation (2-5 minutes if needed)
   - If can't pay full amount, ask what they CAN pay
   - Offer payment plan (50% today, 50% in 14 days)
   - Show empathy for financial hardship

5. Payment Collection (if agreed)
   - Confirm amount to be paid
   - Say: "I'm sending you a secure payment link by text message right now"
   - Wait for them to receive SMS
   - Stay on call while they complete payment

6. Closing (30 seconds)
   - Summarize agreed action
   - Confirm any follow-up date
   - Thank them

HANDLING OBJECTIONS:
- "I don't have the money": Offer smaller amount or payment plan
- "I never got the invoice": Offer to resend, payment still due
- "The work was poor": Note dispute, doesn't cancel debt
- "I'll pay next week": Get specific date and commitment
- "Stop calling me": Apologize, agree immediately, end call
- Abusive language: Stay calm, warn once, end if continues

VOICE TONE:
- Friendly but professional
- Empathetic and understanding
- Patient but persistent
- Clear and concise

REMEMBER: Maintain the freelancer's reputation. Be firm but fair.`;

/**
 * Generate call context instructions for AI
 */
function generateCallInstructions(context: {
    recipientName: string;
    invoiceReference: string;
    amount: number;
    dueDate: string;
    daysPastDue: number;
    businessName: string;
}): string {
    return AI_AGENT_SYSTEM_PROMPT
        .replace('{businessName}', context.businessName)
        .replace('{recipientName}', context.recipientName)
        .replace('{invoiceReference}', context.invoiceReference)
        .replace('{amount}', context.amount.toFixed(2))
        .replace('{dueDate}', context.dueDate)
        .replace('{daysPastDue}', context.daysPastDue.toString());
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const correlationId = generateCorrelationId();

    try {
        // 1. Rate limiting
        const rateLimit = await checkWebhookRateLimit(req, {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 10, // 10 requests per minute
        });

        if (!rateLimit.allowed) {
            logError('Rate limit exceeded for Twilio voice-ai webhook', undefined);
            return NextResponse.json(
                { error: 'Too many requests' },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimit),
                }
            );
        }

        // 2. CSRF Protection
        if (!validateWebhookOrigin(req)) {
            logError('CSRF: Invalid origin on webhook', undefined);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!validateContentType(req, ['application/x-www-form-urlencoded'])) {
            logError('CSRF: Invalid Content-Type', undefined);
            return NextResponse.json({ error: 'Invalid Content-Type' }, { status: 400 });
        }

        // 3. Verify Twilio signature
        const twilioSignature = req.headers.get('x-twilio-signature');
        if (!twilioSignature) {
            logError('Missing Twilio signature header', undefined);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify signature using Twilio's validation
        // Note: In production, implement full Twilio webhook validation
        // For now, verify the signature header is present
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!authToken) {
            logError('TWILIO_AUTH_TOKEN not configured', undefined);
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        // TODO: Full signature validation with twilio.validateRequest()
        // For production: use twilio.validateRequest(authToken, twilioSignature, url, params)
        const isValid = true; // Placeholder - implement full validation in production

        // 4. Parse context from query parameter (passed when call was initiated)
        const { searchParams } = new URL(req.url);
        const contextParam = searchParams.get('context');

        if (!contextParam) {
            logError('Missing context parameter', undefined);
            return new NextResponse(
                `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">Sorry, there was a technical error. Please try again later.</Say>
  <Hangup/>
</Response>`,
                {
                    status: 200,
                    headers: { 'Content-Type': 'text/xml' },
                }
            );
        }

        const context = JSON.parse(decodeURIComponent(contextParam));

        logInfo('Voice AI call connected', {
            invoiceId: context.invoiceId,
            recipientName: context.recipientName,
            correlationId,
        });

        // 5. Generate AI instructions with call context
        const aiInstructions = generateCallInstructions(context);

        // 6. Encode context for WebSocket stream handler
        const streamContext = encodeURIComponent(
            JSON.stringify({
                ...context,
                aiInstructions,
                correlationId,
            })
        );

        // 7. Generate TwiML response with WebSocket stream
        // This streams bidirectional audio to our WebSocket endpoint
        // which then connects to OpenAI Realtime API
        const websocketUrl = process.env.TWILIO_WEBSOCKET_URL || 'wss://localhost:8080';

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">
    Please wait while we connect you. This call may be recorded for training and quality purposes.
  </Say>
  <Connect>
    <Stream url="${websocketUrl}?context=${streamContext}">
      <Parameter name="context" value="${streamContext}" />
    </Stream>
  </Connect>
</Response>`;

        logInfo('TwiML generated with stream URL', {
            streamUrl: websocketUrl.substring(0, 100) + '...',
            correlationId,
        });

        return new NextResponse(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
        });

    } catch (error: any) {
        logError('Voice AI webhook error', error);

        // Store failed webhook for recovery
        try {
            const formData = await req.formData();
            const payload: Record<string, string> = {};
            formData.forEach((value, key) => {
                payload[key] = value.toString();
            });

            const headers: Record<string, string> = {};
            req.headers.forEach((value, key) => {
                headers[key] = value;
            });

            // TODO: Implement storeFailedWebhook
            // await storeFailedWebhook({
            //     source: 'twilio',
            //     eventType: 'voice.ai',
            //     payload,
            //     headers,
            //     url: req.url,
            //     error,
            //     correlationId,
            // });
        } catch (recoveryError: any) {
            logError('Failed to store webhook for recovery', recoveryError);
        }

        // Return error TwiML
        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">Sorry, there was a technical error. Please try again later.</Say>
  <Hangup/>
</Response>`,
            {
                status: 200,
                headers: { 'Content-Type': 'text/xml' },
            }
        );
    }
}

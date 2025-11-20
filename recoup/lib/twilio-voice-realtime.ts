/**
 * Twilio Voice + OpenAI Realtime API Integration
 * Real-time AI voice agent for debt collection calls
 * Replaces the stub in lib/ai-voice-agent.ts
 *
 * Per IMPROVEMENTS_SUMMARY.md lines 21-22:
 * - Ultra-low latency voice-to-voice (<800ms target)
 * - WebSocket-based real-time audio streaming
 * - Native Twilio integration
 * - FCA compliant call handling
 */

import twilio from 'twilio';
import { WebSocket } from 'ws';
import OpenAI from 'openai';
import { logger } from '@/utils/logger';

// Initialize clients
let twilioClient: twilio.Twilio | null = null;
let openaiClient: OpenAI | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
    }

    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
}

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface AICallParams {
  recipientPhone: string;
  recipientName: string;
  invoiceReference: string;
  amount: number;
  dueDate: string;
  daysPastDue: number;
  businessName: string;
  invoiceId: string;
  freelancerId: string;
  enablePaymentDuringCall: boolean;
  tone?: 'friendly' | 'firm' | 'final';
}

export interface AICallResult {
  success: boolean;
  callSid?: string;
  duration?: number;
  transcript?: string;
  outcome?: 'promise_to_pay' | 'payment_made' | 'dispute' | 'no_answer' | 'voicemail' | 'refused';
  nextAction?: string;
  error?: string;
  recording?: string;
}

export interface AICallCostEstimate {
  twilioCallCost: number;
  twilioSMSCost: number;
  openAICost: number;
  recordingCost: number;
  total: number;
}

/**
 * FCA Compliance validation for voice calls
 */
function validateCallCompliance(params: AICallParams): { allowed: boolean; reason?: string } {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // FCA Rule: No calls before 8am or after 9pm
  if (hour < 8 || hour >= 21) {
    return {
      allowed: false,
      reason: 'Outside allowed calling hours (8am-9pm)',
    };
  }

  // FCA Rule: No calls on Sundays
  if (day === 0) {
    return {
      allowed: false,
      reason: 'Calls not allowed on Sundays',
    };
  }

  // FCA Rule: Minimum amount threshold
  const minAmount = parseFloat(process.env.MIN_INVOICE_AMOUNT || '50');
  if (params.amount < minAmount) {
    return {
      allowed: false,
      reason: `Amount below minimum threshold (£${minAmount})`,
    };
  }

  // Check cooldown period (default 24 hours)
  // TODO: Check Firestore for last call time
  // const cooldownHours = parseInt(process.env.CALL_COOLDOWN_HOURS || '24');

  return { allowed: true };
}

/**
 * Generate AI agent instructions based on call context
 */
function generateAgentInstructions(params: AICallParams): string {
  const tone = params.tone || 'friendly';

  const toneInstructions = {
    friendly: 'You are polite, understanding, and empathetic. Your goal is to help find a solution.',
    firm: 'You are professional and assertive. Make it clear that payment is required.',
    final: 'You are serious and urgent. This is a final notice before escalation.',
  };

  return `You are a professional debt collection AI agent for ${params.businessName}.

TONE: ${toneInstructions[tone]}

CALL CONTEXT:
- Debtor Name: ${params.recipientName}
- Invoice: ${params.invoiceReference}
- Amount Owed: £${params.amount.toFixed(2)}
- Due Date: ${params.dueDate}
- Days Overdue: ${params.daysPastDue}

YOUR OBJECTIVES:
1. Confirm you are speaking with ${params.recipientName}
2. Explain the reason for the call (overdue invoice ${params.invoiceReference})
3. Request immediate payment or payment plan
4. ${params.enablePaymentDuringCall ? 'Offer to take payment over the phone if possible' : 'Provide payment instructions'}
5. If they dispute the debt, gather details and inform them they can submit a formal dispute
6. Record any promises to pay with specific dates
7. Thank them for their time

FCA COMPLIANCE RULES YOU MUST FOLLOW:
- Be respectful and professional at all times
- Do NOT harass, threaten, or intimidate
- Do NOT call repeatedly if they ask you to stop
- Do NOT discuss the debt with anyone except the debtor
- If they mention financial difficulties or vulnerability, be extra understanding
- If they request written confirmation, agree and end the call
- If they dispute the debt, acknowledge and provide dispute process
- Do NOT misrepresent the consequences of non-payment
- Do NOT claim to be from law enforcement or government

VULNERABILITY INDICATORS:
If the debtor mentions any of these, adjust your approach:
- Mental health issues
- Serious illness
- Recent bereavement
- Unemployment or reduced income
- Caring responsibilities
- Elderly or disabled
Be understanding, offer to pause collections, and suggest they seek debt advice.

CALL FLOW:
1. Greeting: "Hello, this is [AI Agent] calling from ${params.businessName}. May I speak with ${params.recipientName} please?"
2. Confirm identity: "Is this ${params.recipientName}?"
3. State purpose: "I'm calling regarding invoice ${params.invoiceReference} for £${params.amount.toFixed(2)} which is now ${params.daysPastDue} days overdue."
4. Listen to their response
5. Offer solutions (payment, payment plan, dispute process)
6. Record commitment or next steps
7. Thank and end call

Remember: Your goal is to find a resolution, not to be confrontational. Listen actively and be solution-focused.`;
}

/**
 * Initiate AI-powered collection call using OpenAI Realtime API + Twilio
 */
export async function initiateAICollectionCall(params: AICallParams): Promise<AICallResult> {
  const startTime = Date.now();

  try {
    // 1. FCA Compliance check
    const compliance = validateCallCompliance(params);
    if (!compliance.allowed) {
      logger.warn('Call blocked by FCA compliance', {
        invoiceId: params.invoiceId,
        reason: compliance.reason,
      });

      return {
        success: false,
        error: `FCA Compliance: ${compliance.reason}`,
      };
    }

    // 2. Validate phone number format
    const phone = params.recipientPhone.trim();
    if (!phone.startsWith('+')) {
      throw new Error('Phone number must be in E.164 format (e.g., +447xxx...)');
    }

    // 3. Generate AI agent instructions
    const agentInstructions = generateAgentInstructions(params);

    // 4. Create TwiML for call
    const twiml = new twilio.twiml.VoiceResponse();

    // Start the call with a connect to stream
    const connect = twiml.connect();
    const baseUrl = `wss://${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '') || 'your-app.vercel.app'}/api/webhooks/twilio/voice-stream`;
    const streamUrl = `${baseUrl}?invoiceId=${encodeURIComponent(params.invoiceId)}&freelancerId=${encodeURIComponent(params.freelancerId)}&instructions=${encodeURIComponent(agentInstructions)}`;
    connect.stream({
      url: streamUrl,
    });

    // 5. Initiate Twilio call
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable is required');
    }

    logger.info('Initiating AI voice call', {
      to: phone,
      from: fromNumber,
      invoiceId: params.invoiceId,
      tone: params.tone,
    });

    const call = await client.calls.create({
      to: phone,
      from: fromNumber,
      twiml: twiml.toString(),
      record: process.env.RECORD_CALLS !== 'false', // Record by default
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/recording-status`,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      timeout: 30, // Ring timeout in seconds
      machineDetection: 'DetectMessageEnd', // Detect voicemail
    });

    const duration = Date.now() - startTime;

    logger.info('AI voice call initiated', {
      callSid: call.sid,
      status: call.status,
      to: phone,
      duration,
      invoiceId: params.invoiceId,
    });

    // TODO: Store call metadata in Firestore
    // await trackVoiceCall({
    //   freelancerId: params.freelancerId,
    //   invoiceId: params.invoiceId,
    //   callSid: call.sid,
    //   recipientPhone: phone,
    //   startTime: new Date(),
    // });

    return {
      success: true,
      callSid: call.sid,
      outcome: 'no_answer', // Will be updated by webhook
    };

  } catch (error) {
    logger.error('Failed to initiate AI collection call', {
      error: error instanceof Error ? error.message : String(error),
      invoiceId: params.invoiceId,
      recipientPhone: params.recipientPhone,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle OpenAI Realtime API WebSocket connection
 * This will be called from /api/webhooks/twilio/voice-stream
 */
export async function handleRealtimeVoiceStream(params: {
  twilioWs: WebSocket;
  callSid: string;
  invoiceId: string;
  instructions: string;
}): Promise<void> {
  const openai = getOpenAI();

  try {
    logger.info('Establishing OpenAI Realtime connection', {
      callSid: params.callSid,
      invoiceId: params.invoiceId,
    });

    // Connect to OpenAI Realtime API
    const realtimeWs = new WebSocket('wss://api.openai.com/v1/realtime', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    // Configure session when connected
    realtimeWs.on('open', () => {
      logger.info('OpenAI Realtime connection established', {
        callSid: params.callSid,
      });

      // Send session configuration
      realtimeWs.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: params.instructions,
          voice: 'alloy', // Professional UK-friendly voice
          input_audio_format: 'g711_ulaw', // Twilio format
          output_audio_format: 'g711_ulaw',
          turn_detection: {
            type: 'server_vad', // Voice activity detection
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          temperature: 0.7,
        },
      }));
    });

    // Forward audio from Twilio to OpenAI
    params.twilioWs.on('message', (message: string) => {
      try {
        const msg = JSON.parse(message);

        if (msg.event === 'media') {
          // Forward audio to OpenAI
          realtimeWs.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: msg.media.payload, // Base64 audio
          }));
        }

        if (msg.event === 'start') {
          logger.info('Twilio stream started', {
            callSid: params.callSid,
            streamSid: msg.start.streamSid,
          });
        }
      } catch (error) {
        logger.error('Error processing Twilio message', { error });
      }
    });

    // Forward audio from OpenAI to Twilio
    realtimeWs.on('message', (message: string) => {
      try {
        const event = JSON.parse(message);

        if (event.type === 'response.audio.delta') {
          // Send audio back to Twilio
          params.twilioWs.send(JSON.stringify({
            event: 'media',
            streamSid: params.callSid,
            media: {
              payload: event.delta, // Base64 audio
            },
          }));
        }

        if (event.type === 'response.done') {
          logger.info('OpenAI response complete', {
            callSid: params.callSid,
            response: event.response,
          });

          // TODO: Store transcript and analysis
        }

        if (event.type === 'error') {
          logger.error('OpenAI Realtime error', {
            error: event.error,
            callSid: params.callSid,
          });
        }
      } catch (error) {
        logger.error('Error processing OpenAI message', { error });
      }
    });

    // Handle disconnections
    params.twilioWs.on('close', () => {
      logger.info('Twilio stream closed', { callSid: params.callSid });
      realtimeWs.close();
    });

    realtimeWs.on('close', () => {
      logger.info('OpenAI Realtime connection closed', { callSid: params.callSid });
    });

    realtimeWs.on('error', (error) => {
      logger.error('OpenAI Realtime WebSocket error', {
        error: error.message,
        callSid: params.callSid,
      });
      params.twilioWs.close();
    });

  } catch (error) {
    logger.error('Failed to establish Realtime voice stream', {
      error: error instanceof Error ? error.message : String(error),
      callSid: params.callSid,
    });
    throw error;
  }
}

/**
 * Estimate cost of AI collection call
 * Per IMPROVEMENTS_SUMMARY.md - OpenAI Realtime is expensive (5% of operations only)
 */
export function estimateAICallCost(params: {
  estimatedDurationMinutes: number;
  includeSMS: boolean;
  includeRecording: boolean;
}): AICallCostEstimate {
  // Twilio pricing (UK rates)
  const twilioCallCostPerMinute = 0.013; // £0.013/minute for UK calls
  const twilioSMSCost = params.includeSMS ? 0.04 : 0; // £0.04 per SMS
  const twilioRecordingCost = params.includeRecording ? 0.002 : 0; // £0.002/minute

  // OpenAI Realtime API pricing
  // Input: £0.06/minute, Output: £0.24/minute (very expensive!)
  const openAIInputCostPerMinute = 0.06;
  const openAIOutputCostPerMinute = 0.24;

  const twilioCallCost = twilioCallCostPerMinute * params.estimatedDurationMinutes;
  const totalRecordingCost = twilioRecordingCost * params.estimatedDurationMinutes;

  // Assume 50% listening, 50% speaking
  const openAICost =
    (openAIInputCostPerMinute * params.estimatedDurationMinutes * 0.5) +
    (openAIOutputCostPerMinute * params.estimatedDurationMinutes * 0.5);

  const total = twilioCallCost + twilioSMSCost + totalRecordingCost + openAICost;

  return {
    twilioCallCost,
    twilioSMSCost,
    openAICost,
    recordingCost: totalRecordingCost,
    total,
  };
}

/**
 * Analyze call outcome and determine next action
 */
export function analyzeCallOutcome(params: {
  transcript: string;
  duration: number;
  callStatus: string;
}): {
  outcome: AICallResult['outcome'];
  nextAction: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  vulnerabilityDetected: boolean;
} {
  // This would use AI to analyze the transcript
  // For now, basic keyword detection

  const transcript = params.transcript.toLowerCase();

  // Detect outcome
  let outcome: AICallResult['outcome'] = 'no_answer';

  if (params.callStatus === 'no-answer') {
    outcome = 'no_answer';
  } else if (transcript.includes('voicemail') || transcript.includes('leave a message')) {
    outcome = 'voicemail';
  } else if (transcript.includes('pay tomorrow') || transcript.includes('pay next week')) {
    outcome = 'promise_to_pay';
  } else if (transcript.includes('paid') || transcript.includes('transferred')) {
    outcome = 'payment_made';
  } else if (transcript.includes('dispute') || transcript.includes('never received')) {
    outcome = 'dispute';
  } else if (transcript.includes('won\'t pay') || transcript.includes('refuse')) {
    outcome = 'refused';
  }

  // Detect vulnerability
  const vulnerabilityKeywords = [
    'mental health', 'depression', 'anxiety', 'illness', 'hospital',
    'bereavement', 'funeral', 'died', 'unemployed', 'lost my job',
    'disabled', 'benefits', 'carer', 'caring for',
  ];
  const vulnerabilityDetected = vulnerabilityKeywords.some(keyword =>
    transcript.includes(keyword)
  );

  // Determine sentiment
  const positiveKeywords = ['yes', 'sure', 'okay', 'understand', 'will pay'];
  const negativeKeywords = ['no', 'can\'t', 'won\'t', 'refuse', 'angry'];

  const positiveCount = positiveKeywords.filter(k => transcript.includes(k)).length;
  const negativeCount = negativeKeywords.filter(k => transcript.includes(k)).length;

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (positiveCount > negativeCount + 1) sentiment = 'positive';
  if (negativeCount > positiveCount + 1) sentiment = 'negative';

  // Determine next action
  let nextAction = '';

  switch (outcome) {
    case 'promise_to_pay':
      nextAction = 'Set reminder for promised payment date. Send confirmation SMS.';
      break;
    case 'payment_made':
      nextAction = 'Verify payment received. Send thank you email.';
      break;
    case 'dispute':
      nextAction = 'Send formal dispute form. Pause collections pending investigation.';
      break;
    case 'no_answer':
    case 'voicemail':
      nextAction = 'Schedule follow-up call in 48 hours. Send payment reminder SMS.';
      break;
    case 'refused':
      nextAction = vulnerabilityDetected
        ? 'Mark as vulnerable. Refer to manual review. Pause aggressive collections.'
        : 'Escalate to next collections stage. Consider formal letter.';
      break;
  }

  if (vulnerabilityDetected) {
    nextAction = 'PRIORITY: Mark as vulnerable customer. Refer to compliance team. ' + nextAction;
  }

  return {
    outcome,
    nextAction,
    sentiment,
    vulnerabilityDetected,
  };
}

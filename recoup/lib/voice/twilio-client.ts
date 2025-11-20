/**
 * Twilio Client for Voice Calling
 * Handles Twilio telephony integration for AI-powered collection calls
 *
 * Features:
 * - Outbound call initiation
 * - TwiML generation
 * - Call status tracking
 * - WebSocket streaming for real-time audio
 *
 * Pricing (UK, Nov 2025):
 * - Outbound calls: £0.013/minute
 * - SMS: £0.04 per message
 * - Recording: £0.002/minute
 */

import twilio from 'twilio';
import { logInfo, logError } from '@/utils/logger';

// Initialize Twilio client
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.warn('Warning: Twilio credentials not configured');
}

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Call options for initiating outbound calls
 */
export interface CallOptions {
  to: string; // Phone number to call (E.164 format: +44...)
  from?: string; // Twilio phone number (defaults to env var)
  twimlUrl: string; // URL that returns TwiML instructions
  statusCallback?: string; // URL for call status updates
  statusCallbackEvent?: string[]; // Events to trigger callbacks
  record?: boolean; // Record the call
  timeout?: number; // Timeout in seconds
  machineDetection?: 'Enable' | 'DetectMessageEnd'; // Voicemail detection
}

/**
 * Call status from Twilio
 */
export type CallStatus =
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'no-answer'
  | 'failed'
  | 'canceled';

/**
 * Call result after initiation
 */
export interface CallResult {
  success: boolean;
  callSid?: string;
  status?: CallStatus;
  error?: string;
}

/**
 * Initiate an outbound call using Twilio
 */
export async function initiateCall(options: CallOptions): Promise<CallResult> {
  if (!twilioClient) {
    throw new Error('Twilio client not configured. Please set Twilio environment variables.');
  }

  if (!TWILIO_PHONE_NUMBER && !options.from) {
    throw new Error('Twilio phone number not configured');
  }

  const startTime = Date.now();

  try {
    logInfo('Initiating Twilio call', {
      to: options.to,
      twimlUrl: options.twimlUrl
    });

    const call = await twilioClient.calls.create({
      to: options.to,
      from: options.from || TWILIO_PHONE_NUMBER!,
      url: options.twimlUrl,
      statusCallback: options.statusCallback,
      statusCallbackEvent: options.statusCallbackEvent || [
        'initiated',
        'ringing',
        'answered',
        'completed'
      ],
      record: options.record,
      timeout: options.timeout || 60,
      machineDetection: options.machineDetection || 'Enable',
      asyncAmd: 'true' // Async answering machine detection
    });

    const latency = Date.now() - startTime;

    logInfo('Twilio call initiated', {
      callSid: call.sid,
      status: call.status,
      to: options.to,
      latency_ms: latency
    });

    return {
      success: true,
      callSid: call.sid,
      status: call.status as CallStatus
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    logError('Twilio call initiation failed', error as Error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get call status from Twilio
 */
export async function getCallStatus(callSid: string): Promise<CallStatus> {
  if (!twilioClient) {
    throw new Error('Twilio client not configured');
  }

  try {
    const call = await twilioClient.calls(callSid).fetch();
    return call.status as CallStatus;
  } catch (error) {
    logError('Failed to fetch call status', error as Error);
    throw error;
  }
}

/**
 * Update call with new TwiML instructions
 */
export async function updateCall(callSid: string, twimlUrl: string): Promise<void> {
  if (!twilioClient) {
    throw new Error('Twilio client not configured');
  }

  try {
    await twilioClient.calls(callSid).update({
      url: twimlUrl,
      method: 'POST'
    });

    logInfo('Call updated with new TwiML', { callSid, twimlUrl });
  } catch (error) {
    logError('Failed to update call', error as Error);
    throw error;
  }
}

/**
 * Hang up an active call
 */
export async function hangupCall(callSid: string): Promise<void> {
  if (!twilioClient) {
    throw new Error('Twilio client not configured');
  }

  try {
    await twilioClient.calls(callSid).update({
      status: 'completed'
    });

    logInfo('Call hung up', { callSid });
  } catch (error) {
    logError('Failed to hang up call', error as Error);
    throw error;
  }
}

/**
 * Generate TwiML for voice response
 */
export function generateTwiML(options: {
  say?: string; // Text to speak
  play?: string; // Audio URL to play
  gather?: {
    input?: ('dtmf' | 'speech')[]; // Input types
    action?: string; // URL to send input to
    numDigits?: number; // Expected digit count
    timeout?: number; // Timeout in seconds
  };
  redirect?: string; // URL to redirect to
  hangup?: boolean; // Hang up the call
}): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  if (options.say) {
    twiml.say(
      {
        voice: 'Polly.Amy-Neural', // British English female voice
        language: 'en-GB'
      },
      options.say
    );
  }

  if (options.play) {
    twiml.play(options.play);
  }

  if (options.gather) {
    const gather = twiml.gather({
      input: options.gather.input || ['dtmf'],
      action: options.gather.action,
      numDigits: options.gather.numDigits,
      timeout: options.gather.timeout || 5
    });

    // Optionally add a prompt within gather
    if (options.say && !options.play) {
      gather.say(
        {
          voice: 'Polly.Amy-Neural',
          language: 'en-GB'
        },
        options.say
      );
    }
  }

  if (options.redirect) {
    twiml.redirect(options.redirect);
  }

  if (options.hangup) {
    twiml.hangup();
  }

  return twiml.toString();
}

/**
 * Generate TwiML for WebSocket streaming (OpenAI Realtime API)
 */
export function generateStreamTwiML(streamUrl: string): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  // Connect to WebSocket for bidirectional audio streaming
  const connect = twiml.connect();
  connect.stream({
    url: streamUrl
  });

  return twiml.toString();
}

/**
 * Send SMS using Twilio
 */
export async function sendSMS(to: string, body: string, from?: string): Promise<boolean> {
  if (!twilioClient) {
    throw new Error('Twilio client not configured');
  }

  if (!TWILIO_PHONE_NUMBER && !from) {
    throw new Error('Twilio phone number not configured');
  }

  try {
    const message = await twilioClient.messages.create({
      to,
      from: from || TWILIO_PHONE_NUMBER!,
      body
    });

    logInfo('SMS sent', {
      messageSid: message.sid,
      to,
      status: message.status
    });

    return true;
  } catch (error) {
    logError('Failed to send SMS', error as Error);
    return false;
  }
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

/**
 * Estimate cost of a call
 */
export function estimateCallCost(durationMinutes: number): number {
  const CALL_COST_PER_MINUTE = 0.013; // £0.013/minute for UK
  const RECORDING_COST_PER_MINUTE = 0.002; // £0.002/minute
  const SMS_COST = 0.04; // £0.04 per SMS

  return durationMinutes * (CALL_COST_PER_MINUTE + RECORDING_COST_PER_MINUTE);
}

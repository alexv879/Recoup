/**
 * WebSocket Streaming Endpoint for Voice Calls
 * WS /api/voice/stream
 *
 * Bridges Twilio audio stream with OpenAI Realtime API
 *
 * Flow:
 * 1. Twilio connects via WebSocket (sends μ-law audio)
 * 2. We connect to OpenAI Realtime API
 * 3. Bridge audio bidirectionally:
 *    - Twilio audio → OpenAI (customer speaking)
 *    - OpenAI audio → Twilio (AI speaking)
 * 4. Handle function calls from OpenAI
 * 5. Track call metrics and outcomes
 *
 * CRITICAL: This uses Next.js API routes with WebSocket upgrade
 * For production, consider using a separate WebSocket server
 */

import { NextRequest } from 'next/server';
import { WebSocket, WebSocketServer } from 'ws';
import { OpenAIRealtimeClient, createCollectionCallClient } from '@/lib/voice/openai-realtime-client';
import { logInfo, logError } from '@/utils/logger';

// Store active call sessions
const activeSessions = new Map<string, {
  twilioWs: WebSocket;
  openaiClient: OpenAIRealtimeClient;
  callSid: string;
  startTime: Date;
  metadata: any;
}>();

/**
 * Handle WebSocket upgrade for voice streaming
 * Next.js doesn't natively support WebSockets in API routes,
 * so this is a special handler that will be configured separately
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const callSid = searchParams.get('callSid');

  if (!callSid) {
    return new Response('Missing callSid parameter', { status: 400 });
  }

  // For Next.js, we return instructions on how to upgrade
  // The actual WebSocket handling is done in a custom server or edge function
  return new Response(
    JSON.stringify({
      message: 'WebSocket endpoint ready',
      callSid,
      protocol: 'wss',
      instructions: 'Upgrade to WebSocket connection'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Handle incoming WebSocket connection from Twilio
 * This function should be called when WebSocket upgrade happens
 */
export async function handleWebSocketConnection(
  twilioWs: WebSocket,
  callSid: string,
  metadata: {
    businessName: string;
    recipientName: string;
    invoiceReference: string;
    amount: number;
    dueDate: string;
    daysPastDue: number;
  }
): Promise<void> {
  logInfo('WebSocket connection established', { callSid });

  try {
    // Create OpenAI Realtime API client
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openaiClient = createCollectionCallClient(
      process.env.OPENAI_API_KEY,
      metadata
    );

    // Connect to OpenAI Realtime API
    await openaiClient.connect();

    // Store session
    activeSessions.set(callSid, {
      twilioWs,
      openaiClient,
      callSid,
      startTime: new Date(),
      metadata
    });

    // Set up event handlers for OpenAI Realtime API
    setupOpenAIEventHandlers(openaiClient, twilioWs, callSid, metadata);

    // Set up Twilio WebSocket handlers
    setupTwilioWebSocketHandlers(twilioWs, openaiClient, callSid);

    logInfo('Voice streaming bridge established', { callSid });
  } catch (error) {
    logError('Failed to establish voice streaming bridge', error as Error);

    twilioWs.close();
  }
}

/**
 * Set up OpenAI Realtime API event handlers
 */
function setupOpenAIEventHandlers(
  openaiClient: OpenAIRealtimeClient,
  twilioWs: WebSocket,
  callSid: string,
  metadata: any
): void {
  // Handle audio output from OpenAI (AI speaking)
  openaiClient.on('response.audio.delta', (event) => {
    // Send audio to Twilio
    const audioData = event.delta; // Base64-encoded μ-law audio

    if (twilioWs.readyState === WebSocket.OPEN) {
      twilioWs.send(
        JSON.stringify({
          event: 'media',
          streamSid: callSid,
          media: {
            payload: audioData
          }
        })
      );
    }
  });

  // Handle audio transcript (for logging)
  openaiClient.on('response.audio_transcript.done', (event) => {
    logInfo('AI spoke', {
      callSid,
      transcript: event.transcript
    });
  });

  // Handle function calls
  openaiClient.on('response.function_call_arguments.done', (event) => {
    const functionName = event.name;
    const args = JSON.parse(event.arguments);

    logInfo('Function call from AI', {
      callSid,
      function: functionName,
      arguments: args
    });

    // Handle different function calls
    switch (functionName) {
      case 'record_payment_promise':
        handlePaymentPromise(callSid, args, openaiClient);
        break;

      case 'record_dispute':
        handleDispute(callSid, args, openaiClient);
        break;

      default:
        logError('Unknown function call', new Error(`Unknown function: ${functionName}`));
    }
  });

  // Handle errors
  openaiClient.on('error', (event) => {
    logError('OpenAI Realtime API error', new Error(event.error?.message || 'Unknown error'));
  });

  // Handle session end
  openaiClient.on('response.done', (event) => {
    logInfo('Response completed', { callSid });
  });
}

/**
 * Set up Twilio WebSocket handlers
 */
function setupTwilioWebSocketHandlers(
  twilioWs: WebSocket,
  openaiClient: OpenAIRealtimeClient,
  callSid: string
): void {
  let streamSid: string | null = null;

  twilioWs.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.event) {
        case 'start':
          streamSid = message.start.streamSid;
          logInfo('Twilio stream started', { callSid, streamSid });

          // Start AI conversation
          openaiClient.createResponse(
            'Greet the customer and explain why you are calling.'
          );
          break;

        case 'media':
          // Audio from customer (μ-law format)
          const audioPayload = message.media.payload;

          // Send to OpenAI Realtime API
          openaiClient.appendAudio(audioPayload);
          break;

        case 'mark':
          // Mark event (used for synchronization)
          logInfo('Twilio mark received', { callSid, name: message.mark?.name });
          break;

        case 'stop':
          // Stream stopped
          logInfo('Twilio stream stopped', { callSid });

          // Disconnect OpenAI
          openaiClient.disconnect();

          // Clean up session
          activeSessions.delete(callSid);
          break;

        default:
          logInfo('Unknown Twilio event', { event: message.event });
      }
    } catch (error) {
      logError('Error processing Twilio message', error as Error);
    }
  });

  twilioWs.on('error', (error) => {
    logError('Twilio WebSocket error', error as Error);
  });

  twilioWs.on('close', () => {
    logInfo('Twilio WebSocket closed', { callSid });

    // Disconnect OpenAI
    openaiClient.disconnect();

    // Clean up session
    activeSessions.delete(callSid);
  });
}

/**
 * Handle payment promise function call
 */
function handlePaymentPromise(
  callSid: string,
  args: { promise_date: string; notes?: string },
  openaiClient: OpenAIRealtimeClient
): void {
  logInfo('Payment promise recorded', {
    callSid,
    promise_date: args.promise_date,
    notes: args.notes
  });

  // TODO: Save promise to database

  // Send result back to AI
  openaiClient.sendFunctionCallResult(
    'payment_promise',
    JSON.stringify({
      success: true,
      message: 'Payment promise recorded successfully'
    })
  );
}

/**
 * Handle dispute function call
 */
function handleDispute(
  callSid: string,
  args: { reason: string },
  openaiClient: OpenAIRealtimeClient
): void {
  logInfo('Dispute recorded', {
    callSid,
    reason: args.reason
  });

  // TODO: Save dispute to database
  // TODO: Trigger dispute workflow

  // Send result back to AI
  openaiClient.sendFunctionCallResult(
    'dispute',
    JSON.stringify({
      success: true,
      message: 'Dispute recorded. Will follow up with customer.'
    })
  );
}

/**
 * Get active session by call SID
 */
export function getActiveSession(callSid: string) {
  return activeSessions.get(callSid);
}

/**
 * Get all active sessions
 */
export function getActiveSessions() {
  return Array.from(activeSessions.values());
}

/**
 * Terminate session
 */
export function terminateSession(callSid: string): void {
  const session = activeSessions.get(callSid);

  if (session) {
    session.openaiClient.disconnect();
    session.twilioWs.close();
    activeSessions.delete(callSid);

    logInfo('Session terminated', { callSid });
  }
}

// Export configuration for Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

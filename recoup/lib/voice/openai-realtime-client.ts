/**
 * OpenAI Realtime API WebSocket Client
 * Handles real-time voice interaction with GPT-4o-realtime
 *
 * Features:
 * - WebSocket connection to OpenAI Realtime API
 * - Real-time audio streaming (input/output)
 * - Function calling during conversation
 * - Session configuration and management
 * - Event handling for voice interactions
 *
 * API Documentation:
 * https://platform.openai.com/docs/guides/realtime
 *
 * Pricing (Nov 2025):
 * - Audio input: $0.06/minute
 * - Audio output: $0.24/minute
 * - Text tokens: Standard GPT-4o pricing
 */

import WebSocket from 'ws';
import { logInfo, logError } from '@/utils/logger';

const REALTIME_API_URL = 'wss://api.openai.com/v1/realtime';
const MODEL = 'gpt-4o-realtime-preview-2024-12-17';

/**
 * Session configuration for OpenAI Realtime API
 */
export interface RealtimeSessionConfig {
  model?: string;
  voice?: 'alloy' | 'echo' | 'shimmer'; // Available voices
  instructions?: string; // System prompt
  inputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  outputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  inputAudioTranscription?: {
    enabled: boolean;
    model?: 'whisper-1';
  };
  turnDetection?: {
    type: 'server_vad'; // Voice Activity Detection
    threshold?: number; // 0-1
    prefixPaddingMs?: number;
    silenceDurationMs?: number;
  };
  tools?: Array<{
    type: 'function';
    name: string;
    description: string;
    parameters: any; // JSON Schema
  }>;
  toolChoice?: 'auto' | 'none' | 'required';
  temperature?: number;
  maxResponseOutputTokens?: number;
}

/**
 * Realtime API event types
 */
export type RealtimeEventType =
  | 'session.created'
  | 'session.updated'
  | 'conversation.created'
  | 'conversation.item.created'
  | 'input_audio_buffer.append'
  | 'input_audio_buffer.commit'
  | 'input_audio_buffer.cleared'
  | 'response.create'
  | 'response.done'
  | 'response.audio.delta'
  | 'response.audio.done'
  | 'response.audio_transcript.delta'
  | 'response.audio_transcript.done'
  | 'response.function_call_arguments.delta'
  | 'response.function_call_arguments.done'
  | 'error';

/**
 * OpenAI Realtime API Client
 */
export class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private sessionConfig: RealtimeSessionConfig;
  private eventHandlers: Map<RealtimeEventType, Array<(data: any) => void>> = new Map();
  private connected: boolean = false;

  constructor(apiKey: string, sessionConfig: RealtimeSessionConfig = {}) {
    this.apiKey = apiKey;
    this.sessionConfig = {
      model: MODEL,
      voice: 'shimmer', // British-sounding voice
      inputAudioFormat: 'g711_ulaw', // Twilio uses μ-law
      outputAudioFormat: 'g711_ulaw',
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefixPaddingMs: 300,
        silenceDurationMs: 500
      },
      temperature: 0.8,
      maxResponseOutputTokens: 4096,
      ...sessionConfig
    };
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `${REALTIME_API_URL}?model=${this.sessionConfig.model}`;

        this.ws = new WebSocket(url, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'OpenAI-Beta': 'realtime=v1'
          }
        });

        this.ws.on('open', () => {
          logInfo('OpenAI Realtime API connected', {
            model: this.sessionConfig.model
          });

          this.connected = true;

          // Configure session
          this.sendEvent('session.update', {
            session: this.sessionConfig
          });

          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const event = JSON.parse(data.toString());
            this.handleEvent(event);
          } catch (error) {
            logError('Failed to parse Realtime API message', error as Error);
          }
        });

        this.ws.on('error', (error) => {
          logError('OpenAI Realtime API error', error as Error);

          this.connected = false;

          if (!this.connected) {
            reject(error);
          }
        });

        this.ws.on('close', () => {
          logInfo('OpenAI Realtime API disconnected');
          this.connected = false;
        });
      } catch (error) {
        logError('Failed to connect to OpenAI Realtime API', error as Error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from OpenAI Realtime API
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send event to OpenAI Realtime API
   */
  sendEvent(type: string, data: any = {}): void {
    if (!this.isConnected()) {
      logError('Cannot send event - not connected', new Error('Not connected'));
      return;
    }

    const event = {
      type,
      ...data
    };

    this.ws!.send(JSON.stringify(event));

    logInfo('Sent Realtime API event', { type });
  }

  /**
   * Append audio to input buffer
   * Audio must be base64-encoded PCM16 or μ-law
   */
  appendAudio(audioBase64: string): void {
    this.sendEvent('input_audio_buffer.append', {
      audio: audioBase64
    });
  }

  /**
   * Commit audio buffer (triggers processing)
   */
  commitAudio(): void {
    this.sendEvent('input_audio_buffer.commit');
  }

  /**
   * Clear audio buffer
   */
  clearAudio(): void {
    this.sendEvent('input_audio_buffer.clear');
  }

  /**
   * Create a response (triggers AI to speak)
   */
  createResponse(instructions?: string): void {
    const event: any = {};

    if (instructions) {
      event.response = {
        modalities: ['audio', 'text'],
        instructions
      };
    }

    this.sendEvent('response.create', event);
  }

  /**
   * Cancel in-progress response
   */
  cancelResponse(responseId: string): void {
    this.sendEvent('response.cancel', {
      response_id: responseId
    });
  }

  /**
   * Send function call result
   */
  sendFunctionCallResult(callId: string, output: string): void {
    this.sendEvent('conversation.item.create', {
      item: {
        type: 'function_call_output',
        call_id: callId,
        output
      }
    });

    // Trigger response after function result
    this.createResponse();
  }

  /**
   * Register event handler
   */
  on(eventType: RealtimeEventType, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(eventType: RealtimeEventType, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(eventType);

    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Handle incoming event from OpenAI Realtime API
   */
  private handleEvent(event: any): void {
    const eventType = event.type as RealtimeEventType;

    logInfo('Received Realtime API event', { type: eventType });

    // Call registered handlers
    const handlers = this.eventHandlers.get(eventType);

    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          logError('Error in event handler', error as Error);
        }
      });
    }

    // Also call wildcard handlers
    const wildcardHandlers = this.eventHandlers.get('*' as any);

    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          logError('Error in wildcard handler', error as Error);
        }
      });
    }
  }

  /**
   * Get current session
   */
  getSessionConfig(): RealtimeSessionConfig {
    return this.sessionConfig;
  }
}

/**
 * Create configured client for collection calls
 */
export function createCollectionCallClient(
  apiKey: string,
  context: {
    businessName: string;
    recipientName: string;
    invoiceReference: string;
    amount: number;
    dueDate: string;
    daysPastDue: number;
  }
): OpenAIRealtimeClient {
  const instructions = `You are a polite, professional debt collection assistant for ${context.businessName}.

Your task is to call ${context.recipientName} about an overdue invoice.

Invoice details:
- Reference: ${context.invoiceReference}
- Amount: £${context.amount.toFixed(2)}
- Due date: ${context.dueDate}
- Days overdue: ${context.daysPastDue}

Guidelines:
1. Be polite and professional at all times
2. Introduce yourself as calling from ${context.businessName}
3. Explain the invoice is overdue
4. Ask when payment can be expected
5. Offer payment options if asked
6. Note any promises or commitments
7. Thank them for their time

If they:
- Promise to pay: Note the date and thank them
- Dispute the invoice: Apologize and say someone will follow up
- Ask for more time: Ask when they can pay and note it
- Are hostile: Remain calm and professional, offer to have manager call back
- Don't answer: Leave a brief, professional voicemail

Keep the call brief (2-3 minutes ideally). Be empathetic but firm.`;

  const sessionConfig: RealtimeSessionConfig = {
    model: MODEL,
    voice: 'shimmer',
    instructions,
    inputAudioFormat: 'g711_ulaw',
    outputAudioFormat: 'g711_ulaw',
    turnDetection: {
      type: 'server_vad',
      threshold: 0.5,
      prefixPaddingMs: 300,
      silenceDurationMs: 700
    },
    temperature: 0.7,
    maxResponseOutputTokens: 2048,
    tools: [
      {
        type: 'function',
        name: 'record_payment_promise',
        description: 'Record a promise to pay from the customer',
        parameters: {
          type: 'object',
          properties: {
            promise_date: {
              type: 'string',
              description: 'Date customer promises to pay (YYYY-MM-DD)'
            },
            notes: {
              type: 'string',
              description: 'Any additional notes about the promise'
            }
          },
          required: ['promise_date']
        }
      },
      {
        type: 'function',
        name: 'record_dispute',
        description: 'Record that the customer is disputing the invoice',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Reason for dispute'
            }
          },
          required: ['reason']
        }
      }
    ],
    toolChoice: 'auto'
  };

  return new OpenAIRealtimeClient(apiKey, sessionConfig);
}

/**
 * Check if OpenAI Realtime API is configured
 */
export function isRealtimeConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

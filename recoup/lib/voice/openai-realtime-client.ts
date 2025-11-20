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
 * Enhanced with FCA-compliant scripts and multiple agent capabilities
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
  const instructions = `You are a professional, FCA-compliant debt collection agent calling on behalf of ${context.businessName}.

CRITICAL LEGAL REQUIREMENTS (UK FCA Guidelines):
- You MUST treat customers fairly and with forbearance
- You MUST NOT be aggressive, threatening, or harassing
- You MUST identify yourself and the purpose of the call clearly
- You MUST respect if the customer says they cannot talk and offer to rebook
- You MUST be sensitive to vulnerable customers (financial difficulty, health issues, bereavement)
- You MUST offer payment plan options for those struggling to pay

CUSTOMER DETAILS:
- Name: ${context.recipientName}
- Invoice Reference: ${context.invoiceReference}
- Amount Outstanding: £${context.amount.toFixed(2)}
- Original Due Date: ${context.dueDate}
- Days Overdue: ${context.daysPastDue}

CALL SCRIPT STRUCTURE:

1. INTRODUCTION (First 15 seconds):
"Good [morning/afternoon], am I speaking with ${context.recipientName}?

[If yes] Thank you. My name is [AI name], and I'm calling from ${context.businessName} regarding invoice number ${context.invoiceReference}.

Is now a good time to speak for approximately 2-3 minutes?"

[If no, they're busy] "I understand you're busy. Would you prefer I call back at a more convenient time? I can schedule a callback for [suggest times]."
Use the rebook_call function if they request a callback.

2. PURPOSE STATEMENT (Next 20 seconds):
"The reason for my call is that we have an outstanding invoice of £${context.amount.toFixed(2)} that was due on ${context.dueDate}, which is now ${context.daysPastDue} days overdue.

Do you recall this invoice?"

[If yes] Move to payment discussion
[If no] "Let me provide you with the details..." Use the check_invoice_details function to retrieve more information.

3. PAYMENT DISCUSSION (Main body):

If customer acknowledges debt:
"Thank you for confirming. When can you make payment?"

If they commit to a date:
- Use record_payment_promise function
- Confirm: "Excellent, I've noted that you'll pay £${context.amount.toFixed(2)} by [date]. We'll send you a confirmation email. Is there anything preventing you from making this payment?"

If they're experiencing financial difficulty:
- Show empathy: "I understand this is a difficult time. We want to work with you."
- Offer payment plan: "Would a payment plan help? We can split this into [suggest installments]."
- Use the offer_payment_plan function

If they dispute the invoice:
- Do NOT argue
- Say: "I apologize for any confusion. Let me make a note of your dispute and have our accounts team contact you within 24 hours to resolve this."
- Use record_dispute function
- End call politely

If they refuse to pay:
- Remain calm and professional
- "I understand your position. However, this is a legally owed debt. If payment isn't made, this may affect your credit rating and could result in legal action. Can we discuss a way to resolve this?"
- Use record_refusal function if they maintain refusal

4. VULNERABLE CUSTOMER DETECTION:
If customer mentions ANY of the following:
- Mental health issues
- Serious illness
- Bereavement
- Unemployment/redundancy
- Disability
- Caring responsibilities

Immediately:
- Switch to supportive tone
- Say: "Thank you for sharing that with me. I want to make sure we handle this sensitively. Let me note this and have our specialist support team contact you to discuss options that work for your situation."
- Use flag_vulnerable_customer function
- Do NOT pressure for payment
- Offer extended time

5. CALL CONCLUSION (Last 20 seconds):
"To summarize: [recap agreement/outcome]. You'll receive confirmation via email. Is there anything else I can help with today?"

"Thank you for your time, ${context.recipientName}. Take care."

TONE & MANNER:
- Professional, calm, and courteous throughout
- British English expressions preferred
- Speak clearly at moderate pace
- Use customer's name 2-3 times during call
- Never interrupt the customer
- Acknowledge their concerns genuinely

FORBIDDEN ACTIONS:
- NEVER threaten, intimidate, or harass
- NEVER call outside 8am-9pm UK time
- NEVER disclose debt to third parties
- NEVER ignore requests to stop calling
- NEVER pressure vulnerable customers

AVAILABLE TOOLS:
You have access to several functions to help during the call:
- record_payment_promise: When customer commits to pay by a specific date
- record_dispute: When customer disputes the debt
- offer_payment_plan: To suggest installment options
- rebook_call: When customer requests callback
- check_invoice_details: To get more information about what's owed
- flag_vulnerable_customer: When customer indicates vulnerability
- record_refusal: When customer explicitly refuses to pay

Use these functions proactively to provide excellent service while maintaining compliance.`;

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
        description: 'Record a promise to pay from the customer when they commit to a specific payment date',
        parameters: {
          type: 'object',
          properties: {
            promise_date: {
              type: 'string',
              description: 'Date customer promises to pay (YYYY-MM-DD)'
            },
            notes: {
              type: 'string',
              description: 'Any additional notes about the promise or circumstances'
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
              description: 'Reason for the dispute (e.g., "work not completed", "already paid", "invoice incorrect")'
            }
          },
          required: ['reason']
        }
      },
      {
        type: 'function',
        name: 'offer_payment_plan',
        description: 'Offer a payment plan to the customer if they are struggling to pay in full',
        parameters: {
          type: 'object',
          properties: {
            installments: {
              type: 'integer',
              description: 'Number of installments (e.g., 2, 3, 4)'
            },
            frequency: {
              type: 'string',
              description: 'Payment frequency (weekly, fortnightly, monthly)'
            },
            first_payment_date: {
              type: 'string',
              description: 'Date of first installment payment (YYYY-MM-DD)'
            }
          },
          required: ['installments', 'frequency', 'first_payment_date']
        }
      },
      {
        type: 'function',
        name: 'rebook_call',
        description: 'Schedule a callback at a time that suits the customer better',
        parameters: {
          type: 'object',
          properties: {
            callback_date: {
              type: 'string',
              description: 'Date for callback (YYYY-MM-DD)'
            },
            callback_time: {
              type: 'string',
              description: 'Preferred time for callback (HH:MM in 24-hour format)'
            },
            reason: {
              type: 'string',
              description: 'Reason for rebooking (e.g., "customer busy", "not convenient time")'
            }
          },
          required: ['callback_date', 'callback_time']
        }
      },
      {
        type: 'function',
        name: 'check_invoice_details',
        description: 'Retrieve detailed information about the invoice when customer needs more details',
        parameters: {
          type: 'object',
          properties: {
            detail_type: {
              type: 'string',
              description: 'Type of details needed (e.g., "line_items", "service_dates", "payment_history")'
            }
          },
          required: ['detail_type']
        }
      },
      {
        type: 'function',
        name: 'flag_vulnerable_customer',
        description: 'Flag the customer as vulnerable for sensitive handling. Use when customer mentions health issues, bereavement, unemployment, mental health problems, or financial hardship.',
        parameters: {
          type: 'object',
          properties: {
            vulnerability_type: {
              type: 'string',
              description: 'Type of vulnerability (e.g., "mental_health", "serious_illness", "bereavement", "unemployment", "disability", "financial_hardship")'
            },
            notes: {
              type: 'string',
              description: 'Details about the vulnerability (keep confidential)'
            }
          },
          required: ['vulnerability_type', 'notes']
        }
      },
      {
        type: 'function',
        name: 'record_refusal',
        description: 'Record that the customer has explicitly refused to pay the debt',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Reason for refusal (e.g., "disputes work quality", "cannot afford", "does not acknowledge debt")'
            },
            next_action: {
              type: 'string',
              description: 'Recommended next action (e.g., "legal_action", "manager_callback", "send_evidence")'
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

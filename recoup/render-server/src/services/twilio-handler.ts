/**
 * Twilio Media Stream Handler
 *
 * Bridges Twilio Media Streams with OpenAI Realtime API for AI-powered voice calls.
 * Handles bidirectional audio streaming, transcript tracking, and call outcome detection.
 *
 * @module twilio-handler
 */

import WebSocket from 'ws';
import { CallContext } from '../prompts/fca-compliant-prompts';
import { config } from '../config';
import { logInfo, logError } from '../utils/logger';

/**
 * Call outcome types based on conversation analysis
 */
export type CallOutcome =
  | 'payment_committed'   // Customer agreed to pay
  | 'payment_plan'        // Customer requested payment plan
  | 'dispute'             // Customer disputed the debt
  | 'no_resolution'       // No agreement reached
  | 'error';              // Technical error occurred

/**
 * Transcript entry with speaker and timestamp
 */
export interface TranscriptEntry {
  timestamp: Date;
  speaker: 'user' | 'assistant';
  text: string;
}

/**
 * Payment commitment details extracted from conversation
 */
export interface PaymentCommitment {
  amount: number;
  date: string;  // ISO date string
}

/**
 * Complete call summary with outcome and transcript
 */
export interface CallSummary {
  callSid: string;
  callContext: CallContext;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  outcome: CallOutcome;
  transcripts: TranscriptEntry[];
  paymentCommitment?: PaymentCommitment;
}

/**
 * OpenAI Realtime API event types
 */
interface OpenAISessionUpdate {
  type: 'session.update';
  session: {
    modalities: string[];
    instructions: string;
    voice: string;
    input_audio_format: string;
    output_audio_format: string;
    input_audio_transcription?: {
      model: string;
    };
    turn_detection?: {
      type: string;
      threshold: number;
      silence_duration_ms: number;
    };
  };
}

interface OpenAIAudioAppend {
  type: 'input_audio_buffer.append';
  audio: string;  // base64 encoded
}

interface OpenAIResponseAudioDelta {
  type: 'response.audio.delta';
  delta: string;  // base64 encoded audio
}

interface OpenAITranscriptDelta {
  type: 'conversation.item.input_audio_transcription.completed';
  transcript: string;
}

interface OpenAIResponseText {
  type: 'response.text.delta';
  delta: string;
}

/**
 * Twilio Media Stream Handler
 *
 * Manages the lifecycle of an AI-powered collection call:
 * 1. Receives Twilio media stream WebSocket connection
 * 2. Connects to OpenAI Realtime API
 * 3. Forwards audio bidirectionally (mulaw ↔ PCM)
 * 4. Tracks conversation transcript
 * 5. Detects call outcome from conversation
 * 6. Invokes callback with complete call summary
 */
class TwilioHandler {
  private openaiWs: WebSocket | null = null;
  private twilioWs: WebSocket | null = null;
  private callContext: CallContext | null = null;
  private transcripts: TranscriptEntry[] = [];
  private startTime: Date | null = null;
  private streamSid: string | null = null;
  private callSid: string | null = null;

  /**
   * Handle new Twilio WebSocket connection
   *
   * @param socket - Twilio media stream WebSocket
   * @param context - Invoice and client context for the call
   * @param onCallComplete - Callback invoked when call ends with summary
   */
  async handleConnection(
    socket: WebSocket,
    context: CallContext,
    onCallComplete: (summary: CallSummary) => Promise<void>
  ): Promise<void> {
    this.twilioWs = socket;
    this.callContext = context;
    this.startTime = new Date();
    this.transcripts = [];

    logInfo('[twilio-handler] New call connection', {
      invoiceReference: context.invoiceReference,
      amount: context.amount,
      clientName: context.clientName,
    });

    // Initialize OpenAI connection
    await this.connectToOpenAI();

    // Handle Twilio messages
    socket.on('message', async (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleTwilioMessage(message);
      } catch (error) {
        logError('[twilio-handler] Error processing Twilio message', error as Error);
      }
    });

    // Handle disconnection
    socket.on('close', async () => {
      logInfo('[twilio-handler] Twilio WebSocket closed');
      await this.cleanup(onCallComplete);
    });

    socket.on('error', (error: Error) => {
      logError('[twilio-handler] Twilio WebSocket error', error);
    });
  }

  /**
   * Connect to OpenAI Realtime API with FCA-compliant instructions
   */
  private async connectToOpenAI(): Promise<void> {
    const url = `wss://api.openai.com/v1/realtime?model=${config.openai.model}`;

    this.openaiWs = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    this.openaiWs.on('open', () => {
      logInfo('[twilio-handler] Connected to OpenAI Realtime API');
      this.configureOpenAISession();
    });

    this.openaiWs.on('message', (data: WebSocket.Data) => {
      try {
        const event = JSON.parse(data.toString());
        this.handleOpenAIEvent(event);
      } catch (error) {
        logError('[twilio-handler] Error processing OpenAI event', error as Error);
      }
    });

    this.openaiWs.on('error', (error: Error) => {
      logError('[twilio-handler] OpenAI WebSocket error', error);
    });

    this.openaiWs.on('close', () => {
      logInfo('[twilio-handler] OpenAI WebSocket closed');
    });
  }

  /**
   * Configure OpenAI session with FCA-compliant system prompt
   */
  private configureOpenAISession(): void {
    if (!this.openaiWs || !this.callContext) return;

    const { getSystemPrompt } = require('../prompts/fca-compliant-prompts');
    const systemPrompt = getSystemPrompt(this.callContext);

    const sessionUpdate: OpenAISessionUpdate = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: systemPrompt,
        voice: config.openai.voice,
        input_audio_format: 'pcm16',  // 16-bit PCM from Twilio
        output_audio_format: 'pcm16', // 16-bit PCM to Twilio
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',  // Voice Activity Detection
          threshold: 0.5,
          silence_duration_ms: 500,
        },
      },
    };

    this.openaiWs.send(JSON.stringify(sessionUpdate));
    logInfo('[twilio-handler] OpenAI session configured');
  }

  /**
   * Handle incoming Twilio media stream messages
   */
  private async handleTwilioMessage(message: any): Promise<void> {
    switch (message.event) {
      case 'connected':
        logInfo('[twilio-handler] Media stream connected');
        break;

      case 'start':
        this.streamSid = message.start.streamSid;
        this.callSid = message.start.callSid;
        logInfo('[twilio-handler] Media stream started', {
          streamSid: this.streamSid,
          callSid: this.callSid,
        });
        break;

      case 'media':
        // Forward audio to OpenAI
        // Twilio sends mulaw, need to convert to PCM16
        if (this.openaiWs && message.media?.payload) {
          const pcmAudio = this.mulawToPCM(message.media.payload);

          const audioAppend: OpenAIAudioAppend = {
            type: 'input_audio_buffer.append',
            audio: pcmAudio,
          };

          this.openaiWs.send(JSON.stringify(audioAppend));
        }
        break;

      case 'stop':
        logInfo('[twilio-handler] Media stream stopped');
        break;

      default:
        // Ignore other events
        break;
    }
  }

  /**
   * Handle OpenAI Realtime API events
   */
  private handleOpenAIEvent(event: any): void {
    switch (event.type) {
      case 'response.audio.delta':
        // Forward AI audio back to Twilio
        if (this.twilioWs && event.delta) {
          const mulawAudio = this.pcmToMulaw(event.delta);

          const mediaMessage = {
            event: 'media',
            streamSid: this.streamSid,
            media: {
              payload: mulawAudio,
            },
          };

          this.twilioWs.send(JSON.stringify(mediaMessage));
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User transcript
        if (event.transcript) {
          this.transcripts.push({
            timestamp: new Date(),
            speaker: 'user',
            text: event.transcript,
          });
          logInfo('[twilio-handler] User transcript', { text: event.transcript });
        }
        break;

      case 'response.text.delta':
      case 'response.text.done':
        // Assistant transcript
        if (event.delta || event.text) {
          const text = event.delta || event.text;
          this.transcripts.push({
            timestamp: new Date(),
            speaker: 'assistant',
            text: text,
          });
          logInfo('[twilio-handler] Assistant transcript', { text });
        }
        break;

      case 'error':
        logError('[twilio-handler] OpenAI error event', new Error(JSON.stringify(event.error)));
        break;

      default:
        // Log other events for debugging
        // logInfo('[twilio-handler] OpenAI event', { type: event.type });
        break;
    }
  }

  /**
   * Convert mulaw audio to PCM16 (base64)
   * Twilio sends mulaw-encoded audio, OpenAI expects PCM16
   */
  private mulawToPCM(mulawBase64: string): string {
    // Simple mulaw to PCM16 conversion
    // For production, use a proper audio conversion library
    const mulawBuffer = Buffer.from(mulawBase64, 'base64');
    const pcmBuffer = Buffer.alloc(mulawBuffer.length * 2);

    for (let i = 0; i < mulawBuffer.length; i++) {
      // Simplified mulaw to linear PCM conversion
      const mulaw = mulawBuffer[i];
      const pcm = this.mulawToLinear(mulaw);
      pcmBuffer.writeInt16LE(pcm, i * 2);
    }

    return pcmBuffer.toString('base64');
  }

  /**
   * Convert PCM16 audio to mulaw (base64)
   * OpenAI sends PCM16, Twilio expects mulaw
   */
  private pcmToMulaw(pcmBase64: string): string {
    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    const mulawBuffer = Buffer.alloc(pcmBuffer.length / 2);

    for (let i = 0; i < pcmBuffer.length; i += 2) {
      const pcm = pcmBuffer.readInt16LE(i);
      const mulaw = this.linearToMulaw(pcm);
      mulawBuffer[i / 2] = mulaw;
    }

    return mulawBuffer.toString('base64');
  }

  /**
   * Mulaw to linear PCM conversion (simplified)
   */
  private mulawToLinear(mulaw: number): number {
    const BIAS = 0x84;
    const CLIP = 32635;

    mulaw = ~mulaw;
    const sign = (mulaw & 0x80);
    const exponent = (mulaw >> 4) & 0x07;
    const mantissa = mulaw & 0x0F;

    let sample = (mantissa << 3) + BIAS;
    sample <<= exponent;

    return sign ? -sample : sample;
  }

  /**
   * Linear PCM to mulaw conversion (simplified)
   */
  private linearToMulaw(pcm: number): number {
    const BIAS = 0x84;
    const CLIP = 32635;

    const sign = (pcm < 0) ? 0x80 : 0x00;
    let sample = Math.abs(pcm);

    if (sample > CLIP) sample = CLIP;
    sample += BIAS;

    let exponent = 7;
    for (let i = 0; i < 8; i++) {
      if (sample <= (0xFF << i)) {
        exponent = i;
        break;
      }
    }

    const mantissa = (sample >> (exponent + 3)) & 0x0F;
    const mulaw = ~(sign | (exponent << 4) | mantissa);

    return mulaw & 0xFF;
  }

  /**
   * Analyze transcript to determine call outcome
   */
  private detectOutcome(): CallOutcome {
    const fullTranscript = this.transcripts
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n')
      .toLowerCase();

    // Payment commitment detection
    if (
      fullTranscript.includes('pay today') ||
      fullTranscript.includes('pay now') ||
      fullTranscript.includes('pay immediately') ||
      fullTranscript.includes('make payment')
    ) {
      return 'payment_committed';
    }

    // Payment plan detection
    if (
      fullTranscript.includes('payment plan') ||
      fullTranscript.includes('installment') ||
      fullTranscript.includes('pay over time') ||
      fullTranscript.includes('monthly payment')
    ) {
      return 'payment_plan';
    }

    // Dispute detection
    if (
      fullTranscript.includes('dispute') ||
      fullTranscript.includes('don\'t owe') ||
      fullTranscript.includes('not mine') ||
      fullTranscript.includes('never received') ||
      fullTranscript.includes('already paid')
    ) {
      return 'dispute';
    }

    // Default to no resolution
    return 'no_resolution';
  }

  /**
   * Extract payment commitment details from transcript
   */
  private extractPaymentCommitment(): PaymentCommitment | undefined {
    const outcome = this.detectOutcome();

    if (outcome !== 'payment_committed') {
      return undefined;
    }

    // Try to extract amount and date from transcript
    // This is a simplified extraction - production would use NLP
    const amount = this.callContext?.amount || 0;
    const date = new Date().toISOString().split('T')[0]; // Today

    return { amount, date };
  }

  /**
   * Cleanup and generate call summary
   */
  private async cleanup(onCallComplete: (summary: CallSummary) => Promise<void>): Promise<void> {
    // Close OpenAI connection
    if (this.openaiWs) {
      this.openaiWs.close();
      this.openaiWs = null;
    }

    // Generate call summary
    if (this.callContext && this.startTime && this.callSid) {
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000);

      const summary: CallSummary = {
        callSid: this.callSid,
        callContext: this.callContext,
        startTime: this.startTime,
        endTime,
        durationSeconds,
        outcome: this.detectOutcome(),
        transcripts: this.transcripts,
        paymentCommitment: this.extractPaymentCommitment(),
      };

      logInfo('[twilio-handler] Call completed', {
        callSid: this.callSid,
        outcome: summary.outcome,
        duration: durationSeconds,
      });

      // Invoke callback
      try {
        await onCallComplete(summary);
      } catch (error) {
        logError('[twilio-handler] Error in onCallComplete callback', error as Error);
      }
    }

    // Reset state
    this.twilioWs = null;
    this.callContext = null;
    this.transcripts = [];
    this.startTime = null;
    this.streamSid = null;
    this.callSid = null;
  }
}

/**
 * Singleton instance of Twilio handler
 */
export const twilioHandler = new TwilioHandler();

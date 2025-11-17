/**
 * VOICE PROCESSING LIBRARY
 *
 * Handles voice-to-text transcription for invoice creation
 *
 * Features:
 * - Deepgram streaming (primary) - Low latency <1.5s
 * - OpenAI Whisper (fallback) - Higher accuracy for batch processing
 * - Real-time interim transcripts
 * - WER (Word Error Rate) tracking - Target <7%
 * - Latency instrumentation
 *
 * Research Impact:
 * - 40% faster activation vs manual typing
 * - Unique differentiator (competitors don't have this)
 * - Mobile fallback to typed input
 *
 * Usage:
 * ```typescript
 * import { transcribeAudioDeepgram, transcribeAudioWhisper } from '@/lib/voice-processing';
 *
 * // Streaming transcription (Deepgram)
 * const result = await transcribeAudioDeepgram(audioBlob);
 * console.log(result.transcript); // "Invoice for John Smith five hundred pounds..."
 *
 * // Batch transcription (Whisper fallback)
 * const result = await transcribeAudioWhisper(audioBlob);
 * ```
 */

import { logInfo, logError } from '@/utils/logger';

// ============================================================
// TYPES
// ============================================================

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  latency: number; // milliseconds
  provider: 'deepgram' | 'whisper' | 'azure';
  interimTranscripts?: string[];
  metadata?: {
    wordErrorRate?: number;
    words?: Array<{
      word: string;
      start: number;
      end: number;
      confidence: number;
    }>;
  };
}

export interface VoiceProcessingOptions {
  language?: string; // Default: 'en-GB'
  model?: 'nova-2' | 'base' | 'enhanced'; // Deepgram models
  interimResults?: boolean; // Stream interim transcripts
  punctuate?: boolean;
  diarize?: boolean; // Speaker identification
}

// ============================================================
// DEEPGRAM TRANSCRIPTION (Primary - Streaming)
// ============================================================

/**
 * Transcribe audio using Deepgram streaming API
 * Ultra-low latency (<1.5s) for real-time feedback
 *
 * @param audioBlob - Audio blob from MediaRecorder
 * @param options - Transcription options
 * @returns Transcription result with interim transcripts
 */
export async function transcribeAudioDeepgram(
  audioBlob: Blob,
  options: VoiceProcessingOptions = {}
): Promise<TranscriptionResult> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPGRAM_API_KEY not configured');
    }

    const {
      language = 'en-GB',
      model = 'nova-2', // Latest Deepgram model (best accuracy)
      punctuate = true,
      diarize = false,
    } = options;

    // Convert blob to buffer for streaming
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'audio/webm', // Browser MediaRecorder format
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const latency = Date.now() - startTime;

    // Extract transcript and metadata
    const channel = result.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];

    if (!alternative?.transcript) {
      throw new Error('No transcript returned from Deepgram');
    }

    const transcriptionResult: TranscriptionResult = {
      transcript: alternative.transcript,
      confidence: alternative.confidence || 0,
      latency,
      provider: 'deepgram',
      metadata: {
        words: alternative.words || [],
      },
    };

    // Log successful transcription
    logInfo('Deepgram transcription successful', {
      latency,
      confidence: alternative.confidence,
      transcriptLength: alternative.transcript.length,
      provider: 'deepgram',
    });

    // Track if latency exceeds target
    if (latency > 1500) {
      logError('Deepgram latency exceeded 1.5s target', new Error(`Latency: ${latency}ms`));
    }

    return transcriptionResult;

  } catch (error) {
    const latency = Date.now() - startTime;
    logError('Deepgram transcription failed', error as Error);

    // Fallback to Whisper
    logInfo('Falling back to Whisper transcription');
    return transcribeAudioWhisper(audioBlob, options);
  }
}

// ============================================================
// OPENAI WHISPER TRANSCRIPTION (Fallback - Batch)
// ============================================================

/**
 * Transcribe audio using OpenAI Whisper API
 * Higher accuracy but slower (batch processing)
 * Used as fallback when Deepgram fails
 *
 * @param audioBlob - Audio blob from MediaRecorder
 * @param options - Transcription options
 * @returns Transcription result
 */
export async function transcribeAudioWhisper(
  audioBlob: Blob,
  options: VoiceProcessingOptions = {}
): Promise<TranscriptionResult> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { language = 'en' } = options;

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    formData.append('response_format', 'verbose_json'); // Get word timestamps

    // Call Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const latency = Date.now() - startTime;

    if (!result.text) {
      throw new Error('No transcript returned from Whisper');
    }

    const transcriptionResult: TranscriptionResult = {
      transcript: result.text,
      confidence: 1.0, // Whisper doesn't provide confidence scores
      latency,
      provider: 'whisper',
      metadata: {
        words: result.words || [],
      },
    };

    // Log successful transcription
    logInfo('Whisper transcription successful', {
      latency,
      transcriptLength: result.text.length,
      provider: 'whisper',
    });

    return transcriptionResult;

  } catch (error) {
    const latency = Date.now() - startTime;
    logError('Whisper transcription failed', error as Error);

    // No further fallback available
    throw new Error('All transcription providers failed. Please try again or type manually.');
  }
}

// ============================================================
// STREAMING TRANSCRIPTION (Real-time interim results)
// ============================================================

/**
 * Stream audio transcription with interim results
 * Uses WebSocket connection to Deepgram for real-time feedback
 *
 * @param onInterimResult - Callback for interim transcripts
 * @param onFinalResult - Callback for final transcript
 * @returns WebSocket connection and methods
 */
export function createStreamingTranscription(
  onInterimResult: (transcript: string) => void,
  onFinalResult: (result: TranscriptionResult) => void
) {
  const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  let socket: WebSocket | null = null;
  let startTime: number = 0;
  const interimTranscripts: string[] = [];

  const connect = () => {
    // WebSocket URL with query parameters
    const wsUrl = new URL('wss://api.deepgram.com/v1/listen');
    wsUrl.searchParams.set('model', 'nova-2');
    wsUrl.searchParams.set('language', 'en-GB');
    wsUrl.searchParams.set('punctuate', 'true');
    wsUrl.searchParams.set('interim_results', 'true');
    wsUrl.searchParams.set('encoding', 'linear16');
    wsUrl.searchParams.set('sample_rate', '16000');

    socket = new WebSocket(wsUrl.toString(), ['token', apiKey]);

    socket.onopen = () => {
      logInfo('Deepgram WebSocket connected');
      startTime = Date.now();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const channel = data.channel;
        const alternative = channel?.alternatives?.[0];

        if (!alternative) return;

        const transcript = alternative.transcript;
        const isFinal = data.is_final;

        if (transcript) {
          if (isFinal) {
            // Final result
            const latency = Date.now() - startTime;
            onFinalResult({
              transcript,
              confidence: alternative.confidence || 0,
              latency,
              provider: 'deepgram',
              interimTranscripts: [...interimTranscripts],
              metadata: {
                words: alternative.words || [],
              },
            });
          } else {
            // Interim result
            interimTranscripts.push(transcript);
            onInterimResult(transcript);
          }
        }
      } catch (error) {
        logError('Error parsing Deepgram WebSocket message', error as Error);
      }
    };

    socket.onerror = (error) => {
      logError('Deepgram WebSocket error', new Error(JSON.stringify(error)));
    };

    socket.onclose = () => {
      logInfo('Deepgram WebSocket closed');
    };
  };

  const sendAudio = (audioChunk: Blob) => {
    if (socket?.readyState === WebSocket.OPEN) {
      audioChunk.arrayBuffer().then((buffer) => {
        socket?.send(buffer);
      });
    }
  };

  const close = () => {
    if (socket) {
      socket.close();
      socket = null;
    }
  };

  return {
    connect,
    sendAudio,
    close,
  };
}

// ============================================================
// INVOICE PARSING (Extract structured data from transcript)
// ============================================================

/**
 * Parse invoice details from voice transcript
 * Extracts: client name, amount, currency, description, due date
 *
 * Example input: "Invoice for John Smith five hundred pounds for web design due next week"
 *
 * @param transcript - Voice transcript
 * @returns Parsed invoice data
 */
export function parseInvoiceFromTranscript(transcript: string): {
  clientName?: string;
  amount?: number;
  currency?: string;
  description?: string;
  dueDate?: string;
  rawTranscript: string;
} {
  const parsed = {
    rawTranscript: transcript,
    clientName: undefined as string | undefined,
    amount: undefined as number | undefined,
    currency: 'GBP' as string,
    description: undefined as string | undefined,
    dueDate: undefined as string | undefined,
  };

  // Extract client name (look for "for [Name]" or "to [Name]")
  const clientMatch = transcript.match(/(?:for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  if (clientMatch) {
    parsed.clientName = clientMatch[1].trim();
  }

  // Extract amount (handle both numeric and written forms)
  const numericAmountMatch = transcript.match(/£?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:pounds?|gbp|£)?/i);
  const writtenAmountMatch = transcript.match(/(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand)\s*(?:hundred|thousand)?\s*(?:pounds?|gbp|£)?/i);

  if (numericAmountMatch) {
    const amountStr = numericAmountMatch[1].replace(/,/g, '');
    parsed.amount = parseFloat(amountStr);
  } else if (writtenAmountMatch) {
    // Convert written numbers to numeric (basic implementation)
    const writtenNumber = writtenAmountMatch[1].toLowerCase();
    const numberMap: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'hundred': 100, 'thousand': 1000,
    };
    parsed.amount = numberMap[writtenNumber] || undefined;
  }

  // Extract currency
  if (transcript.match(/(?:dollars?|usd|\$)/i)) {
    parsed.currency = 'USD';
  } else if (transcript.match(/(?:euros?|eur|€)/i)) {
    parsed.currency = 'EUR';
  }

  // Extract description (text between amount and due date/end)
  const descMatch = transcript.match(/(?:for|regarding)\s+([^.]+?)(?:\s+due|\.|$)/i);
  if (descMatch) {
    parsed.description = descMatch[1].trim();
  }

  // Extract due date
  if (transcript.match(/(?:due|by)\s+(?:next\s+)?week/i)) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    parsed.dueDate = nextWeek.toISOString().split('T')[0];
  } else if (transcript.match(/(?:due|by)\s+(?:next\s+)?month/i)) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    parsed.dueDate = nextMonth.toISOString().split('T')[0];
  }

  return parsed;
}

// ============================================================
// AUDIO QUALITY VALIDATION
// ============================================================

/**
 * Validate audio quality before transcription
 * Checks duration, file size, sample rate
 *
 * @param audioBlob - Audio blob to validate
 * @returns Validation result
 */
export async function validateAudioQuality(audioBlob: Blob): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Check file size (max 25MB for Whisper)
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (audioBlob.size > maxSize) {
    errors.push(`Audio file too large: ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB (max 25MB)`);
  }

  // Check minimum duration (at least 0.1s)
  const minSize = 1024; // ~0.1s at 16kHz
  if (audioBlob.size < minSize) {
    errors.push('Audio too short. Please speak for at least 1 second.');
  }

  // Check audio format
  const validFormats = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'];
  if (!validFormats.some(format => audioBlob.type.includes(format))) {
    errors.push(`Unsupported audio format: ${audioBlob.type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// WORD ERROR RATE (WER) CALCULATION
// ============================================================

/**
 * Calculate Word Error Rate (WER) for transcription quality
 * WER = (Substitutions + Deletions + Insertions) / Total Words
 * Target: <7% WER
 *
 * @param reference - Ground truth text
 * @param hypothesis - Transcribed text
 * @returns WER percentage
 */
export function calculateWER(reference: string, hypothesis: string): number {
  const refWords = reference.toLowerCase().split(/\s+/);
  const hypWords = hypothesis.toLowerCase().split(/\s+/);

  const refLen = refWords.length;
  const hypLen = hypWords.length;

  // Levenshtein distance (dynamic programming)
  const dp: number[][] = Array(refLen + 1)
    .fill(null)
    .map(() => Array(hypLen + 1).fill(0));

  for (let i = 0; i <= refLen; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= hypLen; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= refLen; i++) {
    for (let j = 1; j <= hypLen; j++) {
      if (refWords[i - 1] === hypWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  const wer = (dp[refLen][hypLen] / refLen) * 100;
  return Math.round(wer * 100) / 100; // Round to 2 decimals
}

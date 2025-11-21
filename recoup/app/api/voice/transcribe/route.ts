/**
 * VOICE TRANSCRIPTION API
 * POST /api/voice/transcribe
 *
 * Transcribes audio to text using Deepgram (primary) or Whisper (fallback)
 *
 * Features:
 * - Deepgram streaming for ultra-low latency (<1.5s)
 * - OpenAI Whisper fallback for higher accuracy
 * - Invoice parsing from transcript
 * - Audio quality validation
 * - Latency instrumentation
 *
 * Research Impact:
 * - 40% faster invoice creation vs typing
 * - Unique differentiator
 * - Target WER <7%
 *
 * Usage:
 * ```typescript
 * const formData = new FormData();
 * formData.append('audio', audioBlob);
 * formData.append('parseInvoice', 'true');
 *
 * const response = await fetch('/api/voice/transcribe', {
 *   method: 'POST',
 *   body: formData,
 * });
 *
 * const { transcript, invoiceData, latency } = await response.json();
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  transcribeAudioDeepgram,
  transcribeAudioWhisper,
  parseInvoiceFromTranscript,
  validateAudioQuality,
  TranscriptionResult,
} from '@/lib/voice-processing';
import { trackEvent } from '@/lib/analytics';
import { BadRequestError, UnauthorizedError, handleApiError } from '@/utils/error';
import { logInfo, logError } from '@/utils/logger';
import { rateLimiters } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 second timeout

/**
 * Transcribe audio to text
 * POST /api/voice/transcribe
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // ✅ SECURITY FIX: Require authentication to prevent abuse of expensive AI transcription
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in to use voice transcription.');
    }

    // ✅ SECURITY FIX: Rate limiting for expensive AI transcription
    const rateLimit = await rateLimiters.ai.check(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded for voice transcription. Please try again later.',
          resetTime: new Date(rateLimit.resetTime).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      );
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const provider = (formData.get('provider') as string) || 'auto'; // 'deepgram', 'whisper', or 'auto'
    const parseInvoice = formData.get('parseInvoice') === 'true';

    if (!audioFile) {
      throw new BadRequestError('Missing audio file');
    }

    // 3. Validate audio quality
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    const validation = await validateAudioQuality(audioBlob);
    if (!validation.valid) {
      throw new BadRequestError(`Invalid audio: ${validation.errors.join(', ')}`);
    }

    logInfo('Voice transcription started', {
      userId: userId || 'anonymous',
      audioSize: audioBlob.size,
      audioType: audioBlob.type,
      provider,
    });

    // 4. Transcribe audio
    let result: TranscriptionResult;

    if (provider === 'whisper') {
      // Force Whisper (higher accuracy, slower)
      result = await transcribeAudioWhisper(audioBlob);
    } else if (provider === 'deepgram') {
      // Force Deepgram (lower latency, good accuracy)
      result = await transcribeAudioDeepgram(audioBlob);
    } else {
      // Auto: Try Deepgram first, fallback to Whisper
      try {
        result = await transcribeAudioDeepgram(audioBlob);
      } catch (error) {
        logError('Deepgram failed, falling back to Whisper', error as Error);
        result = await transcribeAudioWhisper(audioBlob);
      }
    }

    // 5. Parse invoice data if requested
    let invoiceData = null;
    if (parseInvoice && result.transcript) {
      invoiceData = parseInvoiceFromTranscript(result.transcript);
    }

    const totalLatency = Date.now() - startTime;

    // 6. Track analytics
    if (userId) {
      trackEvent('voice_transcript_finalized', {
        segments: result.transcript.split(' ').length, // Approximate word count
        latency_ms_avg: result.latency,
        device_type: 'web', // Web-based transcription
        network_type: 'unknown', // Not tracked in current implementation
      });
    }

    logInfo('Voice transcription successful', {
      userId: userId || 'anonymous',
      provider: result.provider,
      latency: result.latency,
      totalLatency,
      confidence: result.confidence,
      transcriptLength: result.transcript.length,
    });

    // 7. Warn if latency exceeds target
    if (result.latency > 1500) {
      logError('Voice transcription latency exceeded 1.5s target', new Error(`Latency: ${result.latency}ms`));
    }

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      confidence: result.confidence,
      latency: result.latency,
      totalLatency,
      provider: result.provider,
      invoiceData,
      metadata: result.metadata,
    });

  } catch (error: any) {
    const totalLatency = Date.now() - startTime;

    logError('Voice transcription failed', error);

    // Track failed transcription
    const { userId } = await auth();
    if (userId) {
      trackEvent('error_occurred', {
        feature: 'voice_transcription',
        severity: 'medium',
        trace_id: `voice_error_${Date.now()}`,
      });
    }

    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * Get transcription status and capabilities
 * GET /api/voice/transcribe
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Check which providers are configured
    const deepgramConfigured = !!process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    const whisperConfigured = !!process.env.OPENAI_API_KEY;

    return NextResponse.json({
      success: true,
      message: 'Voice transcription service',
      capabilities: {
        deepgram: deepgramConfigured,
        whisper: whisperConfigured,
        streaming: deepgramConfigured, // Streaming requires Deepgram
        invoiceParsing: true,
      },
      providers: {
        primary: deepgramConfigured ? 'deepgram' : whisperConfigured ? 'whisper' : null,
        fallback: whisperConfigured ? 'whisper' : null,
      },
      limits: {
        maxFileSize: 25 * 1024 * 1024, // 25MB
        maxDuration: 30, // 30 seconds
        supportedFormats: ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'],
      },
      performance: {
        targetLatency: 1500, // 1.5s
        targetWER: 7, // 7% Word Error Rate
      },
    });

  } catch (error) {
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

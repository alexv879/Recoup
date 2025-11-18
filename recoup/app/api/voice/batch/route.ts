/**
 * VOICE BATCH TRANSCRIPTION API
 * POST /api/voice/batch
 *
 * Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.1
 * Fallback: Whisper batch transcription for longer recordings
 *
 * Flow:
 * 1. Receive audio blob (webm)
 * 2. Send to OpenAI Whisper API
 * 3. Return transcript + metadata
 * 4. Track analytics event
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { trackServerEvent } from '@/lib/analytics-server';
import { logInfo, logError } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // 2. Get audio file from form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    logInfo('Batch transcription started', {
      userId,
      fileSize: audioFile.size,
      fileType: audioFile.type,
    });

    const startTime = Date.now();

    // 3. Call OpenAI Whisper API
    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'en'); // Can be made dynamic
    whisperFormData.append('response_format', 'verbose_json'); // Get segments & timestamps

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
      },
      body: whisperFormData,
    });

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json().catch(() => ({}));
      throw new Error(`Whisper API error: ${whisperResponse.statusText} - ${JSON.stringify(errorData)}`);
    }

    const whisperData = await whisperResponse.json();

    const latencyMs = Date.now() - startTime;

    // 4. Extract transcript and metadata
    const transcript = whisperData.text || '';
    const segments = whisperData.segments?.length || 1;

    // Track analytics event (server-side)
    await trackServerEvent(
      'voice_transcript_finalized',
      {
        segments,
        latency_ms_avg: latencyMs,
      },
      userId
    );

    logInfo('Batch transcription completed', {
      userId,
      transcript: transcript.substring(0, 100) + '...',
      latencyMs,
      segments,
    });

    // 5. Return response
    return NextResponse.json({
      transcript,
      segments,
      latencyMs,
      method: 'whisper',
      language: whisperData.language || 'en',
    });

  } catch (error) {
    logError('Batch transcription failed', error as Error);

    // Track error event
    try {
      const user = await currentUser();
      if (user) {
        await trackServerEvent(
          'error_occurred',
          {
            feature: 'voice_batch_transcription',
            severity: 'high',
            trace_id: crypto.randomUUID(),
          },
          user.id
        );
      }
    } catch (analyticsError) {
      // Ignore analytics errors
    }

    return NextResponse.json(
      { error: 'Transcription failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max for transcription

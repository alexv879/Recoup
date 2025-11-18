/**
 * VOICE RECORDER BUTTON
 * Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.1
 *           voice-to-text-ux-guide.md (RESEARCH_SUMMARIES_MAPPING.md #2)
 *
 * Hybrid transcription strategy:
 * - Primary: Deepgram streaming (300ms latency)
 * - Fallback: Whisper batch (3-5% WER)
 *
 * Accessibility:
 * - aria-label="Start voice input"
 * - role="status" for transcript updates
 * - Keyboard accessible (Space/Enter to toggle)
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useTrack } from '@/lib/analytics';
import { logInfo, logError } from '@/utils/logger';

interface VoiceRecorderButtonProps {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onRecordingComplete?: (finalTranscript: string, metadata: VoiceMetadata) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export interface VoiceMetadata {
  method: 'deepgram' | 'whisper' | 'manual';
  latencyMs?: number;
  segments?: number;
  deviceType: 'mobile' | 'desktop';
  networkType?: string;
}

type RecordingState = 'idle' | 'requesting' | 'recording' | 'processing' | 'error';

export function VoiceRecorderButton({
  onTranscriptUpdate,
  onRecordingComplete,
  onError,
  disabled = false,
  className = '',
}: VoiceRecorderButtonProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const segmentCountRef = useRef<number>(0);

  // Track voice recording events
  useTrack('voice_recording_started', undefined, []); // Will track when recording starts

  // ============================================================
  // Media Recorder Setup
  // ============================================================

  const startRecording = async () => {
    try {
      setState('requesting');
      setErrorMessage('');
      setTranscript('');
      setInterimTranscript('');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Optimal for speech recognition
        },
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];
      segmentCountRef.current = 0;
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // Capture in 1-second chunks
      mediaRecorderRef.current = mediaRecorder;

      setState('recording');

      // Track analytics event
      const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
      const networkType = (navigator as any).connection?.effectiveType || 'unknown';

      useTrack(
        'voice_recording_started',
        {
          device_type: deviceType,
          network_type: networkType,
        },
        [deviceType]
      );

      logInfo('Voice recording started', { deviceType, networkType });

      // TODO: Start Deepgram streaming for real-time transcription
      // This would connect to /api/voice/stream WebSocket
      // For MVP, we'll use batch transcription on stop

    } catch (error) {
      const err = error as Error;
      logError('Failed to start recording', err);
      setState('error');
      setErrorMessage(err.message || 'Failed to access microphone');
      onError?.(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      setState('processing');
      mediaRecorderRef.current.stop();
    }
  };

  // ============================================================
  // Audio Processing (Whisper Batch Fallback)
  // ============================================================

  const processAudio = async (audioBlob: Blob) => {
    try {
      setState('processing');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const startTime = Date.now();

      // Call batch transcription API (Whisper fallback)
      const response = await fetch('/api/voice/batch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      const finalTranscript = data.transcript || '';
      setTranscript(finalTranscript);

      const metadata: VoiceMetadata = {
        method: 'whisper',
        latencyMs,
        segments: data.segments || 1,
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      };

      // Track completion event
      useTrack(
        'voice_transcript_finalized',
        {
          segments: metadata.segments,
          latency_ms_avg: latencyMs,
        },
        [latencyMs]
      );

      onRecordingComplete?.(finalTranscript, metadata);

      setState('idle');

      logInfo('Voice transcription completed', { finalTranscript, metadata });
    } catch (error) {
      const err = error as Error;
      logError('Failed to process audio', err);
      setState('error');
      setErrorMessage(err.message || 'Transcription failed');
      onError?.(err);
    }
  };

  // ============================================================
  // Event Handlers
  // ============================================================

  const handleClick = () => {
    if (disabled) return;

    if (state === 'idle') {
      startRecording();
    } else if (state === 'recording') {
      stopRecording();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  // ============================================================
  // Render
  // ============================================================

  const getButtonState = () => {
    switch (state) {
      case 'requesting':
        return { icon: Loader2, label: 'Requesting microphone...', spinning: true };
      case 'recording':
        return { icon: MicOff, label: 'Stop recording', spinning: false };
      case 'processing':
        return { icon: Loader2, label: 'Processing...', spinning: true };
      case 'error':
        return { icon: Mic, label: 'Start voice input (error occurred)', spinning: false };
      default:
        return { icon: Mic, label: 'Start voice input', spinning: false };
    }
  };

  const buttonState = getButtonState();
  const Icon = buttonState.icon;

  const isActive = state === 'recording';
  const isLoading = state === 'requesting' || state === 'processing';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoading}
        aria-label={buttonState.label}
        aria-pressed={isActive}
        className={`
          relative p-3 rounded-full transition-all duration-200
          ${isActive
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
          }
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${className}
        `}
      >
        <Icon
          className={`w-5 h-5 ${buttonState.spinning ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Status region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {state === 'recording' && 'Recording started'}
        {state === 'processing' && 'Processing audio...'}
        {interimTranscript && `Partial: ${interimTranscript}`}
        {transcript && `Final transcript inserted: ${transcript}`}
        {errorMessage && `Error: ${errorMessage}`}
      </div>

      {/* Error message (visible) */}
      {state === 'error' && errorMessage && (
        <div
          className="absolute top-full mt-2 left-0 right-0 bg-red-50 border border-red-200 rounded-md p-2 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}

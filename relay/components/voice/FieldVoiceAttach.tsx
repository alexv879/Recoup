/**
 * FIELD VOICE ATTACH (Generic Enhancer)
 * Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.1
 *
 * Generic component to add voice input to any form field
 *
 * Usage:
 * <FieldVoiceAttach
 *   fieldName="description"
 *   onTranscriptReady={(text) => form.setValue('description', text)}
 * >
 *   <textarea {...form.register('description')} />
 * </FieldVoiceAttach>
 */

'use client';

import React, { useState } from 'react';
import { VoiceRecorderButton, VoiceMetadata } from './VoiceRecorderButton';
import { LiveTranscript } from './LiveTranscript';
import { WaveformVisualizer } from './WaveformVisualizer';
import { trackEvent } from '@/lib/analytics';

interface FieldVoiceAttachProps {
  fieldName: string;
  onTranscriptReady: (transcript: string, metadata: VoiceMetadata) => void;
  onError?: (error: Error) => void;
  children: React.ReactNode;
  className?: string;
}

export function FieldVoiceAttach({
  fieldName,
  onTranscriptReady,
  onError,
  children,
  className = '',
}: FieldVoiceAttachProps) {
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleTranscriptUpdate = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setFinalTranscript(transcript);
      setInterimTranscript('');
    } else {
      setInterimTranscript(transcript);
    }
  };

  const handleRecordingComplete = (transcript: string, metadata: VoiceMetadata) => {
    setFinalTranscript(transcript);
    setInterimTranscript('');
    setIsRecording(false);

    // Call parent callback
    onTranscriptReady(transcript, metadata);

    // Track voice invoice submission
    trackEvent('voice_invoice_submitted', {
      invoice_id: '', // Will be set later when invoice is created
      has_voice_meta: true,
    });
  };

  const handleError = (error: Error) => {
    setIsRecording(false);
    onError?.(error);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Original form field */}
      <div className="relative">
        {children}

        {/* Voice button overlay (positioned absolutely) */}
        <div className="absolute top-2 right-2">
          <VoiceRecorderButton
            onTranscriptUpdate={handleTranscriptUpdate}
            onRecordingComplete={handleRecordingComplete}
            onError={handleError}
          />
        </div>
      </div>

      {/* Waveform visualizer (shown while recording) */}
      <div className="mt-2">
        <WaveformVisualizer isRecording={isRecording} />
      </div>

      {/* Live transcript display */}
      {(interimTranscript || finalTranscript) && (
        <div className="mt-2">
          <LiveTranscript
            interimTranscript={interimTranscript}
            finalTranscript={finalTranscript}
          />
        </div>
      )}

      {/* Helper text */}
      <p className="mt-2 text-sm text-gray-500">
        <span className="font-medium">Pro tip:</span> Click the mic button to dictate instead of typing
      </p>
    </div>
  );
}

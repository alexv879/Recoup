/**
 * LIVE TRANSCRIPT DISPLAY
 * Based on: voice-to-text-ux-guide.md (RESEARCH_SUMMARIES_MAPPING.md #2)
 *
 * Features:
 * - Interim transcript opacity 0.6 (low confidence)
 * - Final transcript opacity 1.0 (high confidence)
 * - Smooth transitions
 * - Accessible ARIA announcements
 */

'use client';

import React from 'react';

interface LiveTranscriptProps {
  interimTranscript?: string;
  finalTranscript?: string;
  className?: string;
}

export function LiveTranscript({
  interimTranscript = '',
  finalTranscript = '',
  className = '',
}: LiveTranscriptProps) {
  const hasContent = interimTranscript || finalTranscript;

  if (!hasContent) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}
      role="region"
      aria-label="Voice transcript"
    >
      {/* Final transcript (high opacity) */}
      {finalTranscript && (
        <p
          className="text-gray-900 font-medium mb-2"
          aria-label="Final transcript"
        >
          {finalTranscript}
        </p>
      )}

      {/* Interim transcript (low opacity 0.6) */}
      {interimTranscript && (
        <p
          className="text-gray-600 opacity-60 italic"
          aria-label="Partial transcript"
          aria-live="polite"
        >
          {interimTranscript}
        </p>
      )}

      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {interimTranscript && `Partial: ${interimTranscript}`}
        {finalTranscript && `Final: ${finalTranscript}`}
      </div>
    </div>
  );
}

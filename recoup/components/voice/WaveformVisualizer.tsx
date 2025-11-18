/**
 * WAVEFORM VISUALIZER
 * Based on: voice-to-text-ux-guide.md (RESEARCH_SUMMARIES_MAPPING.md #2)
 *
 * Visual feedback during voice recording
 * - Animated waveform bars
 * - Respects prefers-reduced-motion
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface WaveformVisualizerProps {
  isRecording: boolean;
  className?: string;
}

export function WaveformVisualizer({
  isRecording,
  className = '',
}: WaveformVisualizerProps) {
  const [bars, setBars] = useState<number[]>([30, 50, 40, 60, 35, 55, 45]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording) {
      // Reset bars to baseline
      setBars([30, 50, 40, 60, 35, 55, 45]);
      return;
    }

    // Animate bars while recording
    const animate = () => {
      setBars((prev) =>
        prev.map(() => Math.random() * 60 + 20) // Random height between 20-80
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  if (!isRecording) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center gap-1 h-16 ${className}`}
      aria-hidden="true" // Decorative element
    >
      {bars.map((height, index) => (
        <div
          key={index}
          className="w-2 bg-blue-500 rounded-full transition-all duration-150"
          style={{
            height: `${height}%`,
          }}
        />
      ))}
    </div>
  );
}

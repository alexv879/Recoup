'use client';

import React, { useState } from 'react';
import { VoiceTranscriptLiveRegion } from '@/lib/accessibility';
import { VoiceRecorderButton, VoiceMetadata } from './VoiceRecorderButton';

interface VoiceRecorderProps {
    onTranscriptionComplete: (data: any) => void;
}

/**
 * Voice Recorder Component
 * Wrapper around VoiceRecorderButton to provide the expected interface for invoice creation
 */
export function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [confidence, setConfidence] = useState<number | undefined>();

    const handleRecordingComplete = (finalTranscript: string, metadata: VoiceMetadata) => {
        setTranscript(finalTranscript);
        setIsRecording(false);
        // Parse the transcript to extract invoice data
        // This is a simple implementation - in production, you'd want more sophisticated parsing
        const data: any = {
            description: finalTranscript,
        };

        // Basic parsing for common invoice fields
        const lines = finalTranscript.toLowerCase().split('\n');

        for (const line of lines) {
            // Look for client name patterns
            if (line.includes('client') || line.includes('customer')) {
                const nameMatch = line.match(/(?:client|customer)[:\s]+(.+)/i);
                if (nameMatch) {
                    data.clientName = nameMatch[1].trim();
                }
            }

            // Look for email patterns
            const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailMatch) {
                data.clientEmail = emailMatch[1];
            }

            // Look for amount patterns
            const amountMatch = line.match(/(?:£|\$|amount|total)[:\s]*(\d+(?:\.\d{2})?)/i);
            if (amountMatch) {
                data.amount = parseFloat(amountMatch[1]);
            }

            // Look for line items (basic parsing)
            if (line.includes('item') || line.includes('service') || line.includes('work')) {
                // This is very basic - you'd want more sophisticated parsing
                data.lineItems = [{
                    description: line.trim(),
                    quantity: 1,
                    unitPrice: data.amount || 0,
                }];
            }
        }

        onTranscriptionComplete(data);
    };

    const handleError = (error: Error) => {
        console.error('Voice recording error:', error);
        // Could show a toast or alert here
    };

    return (
        <div className="space-y-4">
            {/* ARIA Live Region for Voice Transcripts */}
            <VoiceTranscriptLiveRegion
                isRecording={isRecording}
                transcript={transcript}
            />
            <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                    Click the microphone button and speak your invoice details.
                    Include client name, email, amount, and description.
                </p>
                <VoiceRecorderButton
                    onRecordingComplete={handleRecordingComplete}
                    onError={handleError}
                />
            </div>
        </div>
    );
}
/**
 * Escalation Progress Bar Component
 * 
 * Based on:
 * - collections_implementation_guide.md §2.1 (Escalation Levels & Progress Bar)
 * - Four-stage escalation model with visual timeline
 * 
 * Shows:
 * - 4 circles (one for each level: gentle → firm → final → agency)
 * - Current level highlighted with ring/shadow
 * - Completed levels filled with color
 * - Next levels grayed out
 * - Timeline below showing day thresholds
 * 
 * Accessibility:
 * - ARIA label: "Escalation level 2 of 4: Firm notice stage"
 * - Keyboard navigation through each level
 * - Detailed tooltips on hover/focus
 */

'use client';

import React, { useState } from 'react';
import { EscalationLevel, ESCALATION_CONFIGS } from '@/types/escalation';

interface EscalationProgressBarProps {
    currentLevel: EscalationLevel;
    daysOverdue: number;
    isPaused?: boolean;
}

const PROGRESS_LEVELS: EscalationLevel[] = ['gentle', 'firm', 'final', 'agency'];

export function EscalationProgressBar({
    currentLevel,
    daysOverdue,
    isPaused = false,
}: EscalationProgressBarProps) {
    const [focusedLevel, setFocusedLevel] = useState<EscalationLevel | null>(null);

    const currentIndex = PROGRESS_LEVELS.indexOf(currentLevel);
    const totalStages = PROGRESS_LEVELS.length;

    // ARIA label for entire progress bar
    const progressAriaLabel = `Escalation progress: Level ${currentIndex + 1} of ${totalStages} - ${ESCALATION_CONFIGS[currentLevel].badgeText} stage`;

    return (
        <div
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalStages}
            aria-label={progressAriaLabel}
            className="w-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                        Collections Escalation Progress
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                        {isPaused ? (
                            <span className="text-amber-600">⏸️ Paused</span>
                        ) : (
                            <span>
                                Stage {currentIndex + 1} of {totalStages} • {daysOverdue} days overdue
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Progress Circles */}
            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200" aria-hidden="true">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-yellow-500 via-orange-500 to-red-800 transition-all duration-500"
                        style={{
                            width: `${((currentIndex + 1) / totalStages) * 100}%`,
                        }}
                    />
                </div>

                {/* Stages */}
                <div className="relative flex justify-between items-center">
                    {PROGRESS_LEVELS.map((level, index) => {
                        const config = ESCALATION_CONFIGS[level];
                        const isCompleted = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const isFuture = index > currentIndex;

                        return (
                            <button
                                key={level}
                                type="button"
                                tabIndex={0}
                                onFocus={() => setFocusedLevel(level)}
                                onBlur={() => setFocusedLevel(null)}
                                onMouseEnter={() => setFocusedLevel(level)}
                                onMouseLeave={() => setFocusedLevel(null)}
                                className="relative flex flex-col items-center group"
                                aria-label={`Stage ${index + 1}: ${config.badgeText}. ${isCompleted ? 'Completed' : isCurrent ? 'Current stage' : 'Not reached'
                                    }. ${config.description}`}
                            >
                                {/* Circle */}
                                <div
                                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-xl
                    transition-all duration-300 z-10
                    ${isCurrent
                                            ? 'ring-4 ring-offset-2 shadow-lg scale-110'
                                            : isCompleted
                                                ? 'shadow-md'
                                                : 'shadow-sm'
                                        }
                    ${focusedLevel === level
                                            ? 'ring-4 ring-blue-300 ring-offset-2'
                                            : ''
                                        }
                  `}
                                    style={{
                                        backgroundColor: isCompleted || isCurrent ? config.badgeColor : '#E5E7EB',
                                        color: isCompleted || isCurrent ? '#FFFFFF' : '#9CA3AF',
                                    }}
                                >
                                    {config.badgeIcon}
                                </div>

                                {/* Label Below */}
                                <div className="mt-2 text-center max-w-20">
                                    <p
                                        className={`text-xs font-semibold ${isCurrent
                                            ? 'text-gray-900'
                                            : isCompleted
                                                ? 'text-gray-700'
                                                : 'text-gray-400'
                                            }`}
                                    >
                                        {config.badgeText}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                        Day {config.daysMin}+
                                    </p>
                                </div>

                                {/* Tooltip on Hover/Focus */}
                                {focusedLevel === level && (
                                    <div
                                        className="absolute top-full mt-14 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-20 w-48"
                                        role="tooltip"
                                    >
                                        <p className="font-semibold mb-1">{config.badgeText}</p>
                                        <p className="opacity-90 mb-1">{config.description}</p>
                                        <p className="text-[10px] opacity-75">
                                            <span className="font-medium">Tone:</span> {config.tone}
                                        </p>
                                        <p className="text-[10px] opacity-75">
                                            <span className="font-medium">Channels:</span>{' '}
                                            {config.channels.join(', ')}
                                        </p>
                                        <p className="text-[10px] opacity-75">
                                            <span className="font-medium">Days:</span>{' '}
                                            {config.daysMin}
                                            {config.daysMax ? `-${config.daysMax}` : '+'} overdue
                                        </p>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Current Stage Details */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{
                            backgroundColor: ESCALATION_CONFIGS[currentLevel].badgeColor,
                            color: '#FFFFFF',
                        }}
                    >
                        {ESCALATION_CONFIGS[currentLevel].badgeIcon}
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {ESCALATION_CONFIGS[currentLevel].badgeText}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                            {ESCALATION_CONFIGS[currentLevel].description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded border border-gray-200">
                                <span className="text-gray-500">Tone:</span>
                                <span className="font-medium text-gray-700">
                                    {ESCALATION_CONFIGS[currentLevel].tone}
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded border border-gray-200">
                                <span className="text-gray-500">Channels:</span>
                                <span className="font-medium text-gray-700">
                                    {ESCALATION_CONFIGS[currentLevel].channels.join(', ')}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

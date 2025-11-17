/**
 * Verification Countdown Timer Component
 * 
 * Displays time remaining for freelancer to verify payment claim (48-hour window).
 * Shows urgency when less than 6 hours remain.
 * 
 * Based on Research:
 * - payment_verification_guide.md §4.1 (Pause/Resume Behavior)
 * - payment_verification_guide.md §4.2 (Pause/Resume Configuration)
 * 
 * Features:
 * - Real-time countdown updating every minute
 * - Color-coded urgency levels (green → yellow → red)
 * - Accessible time announcements
 * - Auto-escalation warning when deadline approaches
 * 
 * @module components/Payments/VerificationCountdown
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface VerificationCountdownProps {
    claimCreatedAt: Date; // When payment claim was created
    verificationDeadline: Date; // 48 hours after claim creation
    onDeadlineExpired?: () => void; // Callback when countdown reaches zero
}

interface TimeRemaining {
    hours: number;
    minutes: number;
    totalMinutes: number;
    isExpired: boolean;
    isUrgent: boolean; // Less than 6 hours remaining
    isWarning: boolean; // Less than 24 hours remaining
}

function calculateTimeRemaining(deadline: Date): TimeRemaining {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) {
        return {
            hours: 0,
            minutes: 0,
            totalMinutes: 0,
            isExpired: true,
            isUrgent: false,
            isWarning: false,
        };
    }

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
        hours,
        minutes,
        totalMinutes,
        isExpired: false,
        isUrgent: totalMinutes < 360, // Less than 6 hours
        isWarning: totalMinutes < 1440, // Less than 24 hours
    };
}

export default function VerificationCountdown({
    claimCreatedAt,
    verificationDeadline,
    onDeadlineExpired,
}: VerificationCountdownProps) {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
        calculateTimeRemaining(verificationDeadline)
    );

    // Update countdown every minute
    useEffect(() => {
        const updateCountdown = () => {
            const newTimeRemaining = calculateTimeRemaining(verificationDeadline);
            setTimeRemaining(newTimeRemaining);

            // Trigger callback if deadline just expired
            if (newTimeRemaining.isExpired && onDeadlineExpired) {
                onDeadlineExpired();
            }
        };

        // Update immediately
        updateCountdown();

        // Then update every minute
        const interval = setInterval(updateCountdown, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [verificationDeadline, onDeadlineExpired]);

    // Format time display
    const formatTimeDisplay = (): string => {
        if (timeRemaining.isExpired) {
            return 'Expired';
        }

        const { hours, minutes } = timeRemaining;

        if (hours === 0) {
            return `${minutes}m`;
        }

        if (minutes === 0) {
            return `${hours}h`;
        }

        return `${hours}h ${minutes}m`;
    };

    // Get urgency color classes
    const getColorClasses = () => {
        if (timeRemaining.isExpired) {
            return {
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-900',
                icon: 'text-red-600',
                badge: 'bg-red-100 text-red-800',
            };
        }

        if (timeRemaining.isUrgent) {
            return {
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-900',
                icon: 'text-red-600',
                badge: 'bg-red-100 text-red-800',
            };
        }

        if (timeRemaining.isWarning) {
            return {
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                text: 'text-yellow-900',
                icon: 'text-yellow-600',
                badge: 'bg-yellow-100 text-yellow-800',
            };
        }

        return {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-900',
            icon: 'text-green-600',
            badge: 'bg-green-100 text-green-800',
        };
    };

    const colors = getColorClasses();

    // ARIA label for screen readers
    const getAriaLabel = (): string => {
        if (timeRemaining.isExpired) {
            return 'Verification deadline expired. Collections will resume automatically.';
        }

        const { hours, minutes } = timeRemaining;
        const timeStr =
            hours > 0
                ? `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
                : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

        if (timeRemaining.isUrgent) {
            return `Urgent: ${timeStr} remaining to verify payment claim`;
        }

        return `${timeStr} remaining to verify payment claim`;
    };

    // Show icon based on urgency
    const IconComponent = timeRemaining.isUrgent || timeRemaining.isExpired ? AlertTriangle : Clock;

    return (
        <div
            className={`p-4 border rounded-lg ${colors.bg} ${colors.border}`}
            role="timer"
            aria-label={getAriaLabel()}
            aria-live={timeRemaining.isUrgent ? 'assertive' : 'polite'}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                    <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-semibold ${colors.text}`}>
                            {timeRemaining.isExpired ? 'Verification Deadline Expired' : 'Verification Deadline'}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.badge}`}>
                            {formatTimeDisplay()}
                        </span>
                    </div>

                    {/* Description */}
                    <p className={`text-sm ${colors.text}`}>
                        {timeRemaining.isExpired ? (
                            <>
                                The 48-hour verification window has expired. Collections reminders will resume automatically
                                unless you verify the payment now.
                            </>
                        ) : timeRemaining.isUrgent ? (
                            <>
                                <strong>Action required soon.</strong> You have less than 6 hours to verify this payment
                                claim. Collections reminders will resume automatically if the deadline passes.
                            </>
                        ) : timeRemaining.isWarning ? (
                            <>
                                You have less than 24 hours to verify this payment claim. Collections reminders are
                                currently paused.
                            </>
                        ) : (
                            <>
                                You have up to 48 hours to verify this payment claim. Collections reminders are
                                paused during this time.
                            </>
                        )}
                    </p>

                    {/* Deadline Timestamp */}
                    <p className={`text-xs ${colors.text} mt-2 opacity-75`}>
                        {timeRemaining.isExpired ? (
                            <>Deadline was {verificationDeadline.toLocaleString()}</>
                        ) : (
                            <>Deadline: {verificationDeadline.toLocaleString()}</>
                        )}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            {!timeRemaining.isExpired && (
                <div className="mt-3">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${timeRemaining.isUrgent
                                    ? 'bg-red-500'
                                    : timeRemaining.isWarning
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                }`}
                            style={{
                                width: `${Math.max(0, Math.min(100, (timeRemaining.totalMinutes / 2880) * 100))}%`, // 2880 = 48 hours in minutes
                            }}
                            role="progressbar"
                            aria-valuenow={timeRemaining.totalMinutes}
                            aria-valuemin={0}
                            aria-valuemax={2880}
                            aria-label={`${timeRemaining.totalMinutes} minutes remaining out of 2880`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

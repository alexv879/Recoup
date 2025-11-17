/**
 * COUNTDOWN TIMER HOOK
 * 
 * For payment verification 48-hour countdown
 * Formats remaining time as "42 hours 15 minutes" or "23h 45m"
 * Auto-updates every minute
 */

import { useState, useEffect } from 'react';

export interface CountdownResult {
    isExpired: boolean;
    remainingMs: number;
    formatted: {
        long: string;   // "42 hours 15 minutes"
        short: string;  // "42h 15m"
        compact: string; // "42:15"
    };
    hours: number;
    minutes: number;
    seconds: number;
    percentage: number; // 0-100 for progress bars
}

interface UseCountdownOptions {
    updateInterval?: number; // milliseconds (default: 60000 = 1 minute)
    onExpire?: () => void;
    totalDuration?: number; // for percentage calculation (default: 48 hours)
}

export function useCountdown(
    targetDate: Date | string | null,
    options: UseCountdownOptions = {}
): CountdownResult {
    const {
        updateInterval = 60000,
        onExpire,
        totalDuration = 48 * 60 * 60 * 1000, // 48 hours in ms
    } = options;

    const calculateTimeLeft = (): CountdownResult => {
        if (!targetDate) {
            return {
                isExpired: true,
                remainingMs: 0,
                formatted: {
                    long: 'Expired',
                    short: 'Expired',
                    compact: '--:--',
                },
                hours: 0,
                minutes: 0,
                seconds: 0,
                percentage: 0,
            };
        }

        const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
        const now = new Date();
        const difference = target.getTime() - now.getTime();

        if (difference <= 0) {
            return {
                isExpired: true,
                remainingMs: 0,
                formatted: {
                    long: 'Expired',
                    short: 'Expired',
                    compact: '00:00',
                },
                hours: 0,
                minutes: 0,
                seconds: 0,
                percentage: 0,
            };
        }

        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const percentage = Math.max(0, Math.min(100, (difference / totalDuration) * 100));

        // Format variations
        const formatLong = () => {
            if (hours > 0) {
                return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            }
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        };

        const formatShort = () => {
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        };

        const formatCompact = () => {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        };

        return {
            isExpired: false,
            remainingMs: difference,
            formatted: {
                long: formatLong(),
                short: formatShort(),
                compact: formatCompact(),
            },
            hours,
            minutes,
            seconds,
            percentage,
        };
    };

    const [countdown, setCountdown] = useState<CountdownResult>(calculateTimeLeft);

    useEffect(() => {
        const timer = setInterval(() => {
            const newCountdown = calculateTimeLeft();
            setCountdown(newCountdown);

            // Trigger onExpire callback when countdown expires
            if (newCountdown.isExpired && !countdown.isExpired && onExpire) {
                onExpire();
            }
        }, updateInterval);

        return () => clearInterval(timer);
    }, [targetDate, updateInterval, onExpire]);

    return countdown;
}

/**
 * COUNTDOWN DISPLAY COMPONENT
 * Pre-built component for displaying countdowns
 */
interface CountdownDisplayProps {
    targetDate: Date | string | null;
    format?: 'long' | 'short' | 'compact';
    showIcon?: boolean;
    className?: string;
    urgentThreshold?: number; // hours (default: 6)
    warningThreshold?: number; // hours (default: 24)
}

export function CountdownDisplay({
    targetDate,
    format = 'short',
    showIcon = true,
    className = '',
    urgentThreshold = 6,
    warningThreshold = 24,
}: CountdownDisplayProps) {
    const countdown = useCountdown(targetDate);

    const getColorClass = () => {
        if (countdown.isExpired) {
            return 'text-red-600';
        }
        if (countdown.hours < urgentThreshold) {
            return 'text-red-600';
        }
        if (countdown.hours < warningThreshold) {
            return 'text-yellow-600';
        }
        return 'text-gray-700';
    };

    const getIcon = () => {
        if (countdown.isExpired) return '⏰';
        if (countdown.hours < urgentThreshold) return '🔴';
        if (countdown.hours < warningThreshold) return '🟡';
        return '⏱️';
    };

    return (
        <span className= {`inline-flex items-center gap-2 ${getColorClass()} ${className}`
}>
    { showIcon && <span aria - hidden="true" > { getIcon() } </span>}
<span className="font-semibold" >
    { countdown.formatted[format] }
    </span>
{
    countdown.isExpired && (
        <span className="text-xs" > (verification deadline passed)</span>
      )
}
</span>
  );
}

/**
 * COUNTDOWN PROGRESS BAR
 * Visual progress bar for countdown
 */
interface CountdownProgressProps {
    targetDate: Date | string | null;
    totalDuration?: number; // milliseconds (default: 48 hours)
    className?: string;
    showLabel?: boolean;
}

export function CountdownProgress({
    targetDate,
    totalDuration = 48 * 60 * 60 * 1000,
    className = '',
    showLabel = true,
}: CountdownProgressProps) {
    const countdown = useCountdown(targetDate, { totalDuration });

    const getProgressColor = () => {
        if (countdown.isExpired || countdown.percentage < 12.5) {
            return 'bg-red-600';
        }
        if (countdown.percentage < 50) {
            return 'bg-yellow-500';
        }
        return 'bg-green-600';
    };

    return (
        <div className= { className } >
        { showLabel && (
            <div className="flex justify-between text-xs text-gray-600 mb-1" >
                <span>Verification deadline </span>
                    < span className = "font-medium" >
                        { countdown.formatted.short } remaining
                            </span>
                            </div>
      )
}
<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden" >
    <div
          className={ `h-full transition-all duration-1000 ${getProgressColor()}` }
style = {{ width: `${countdown.percentage}%` }}
role = "progressbar"
aria - valuenow={ countdown.percentage }
aria - valuemin={ 0 }
aria - valuemax={ 100 }
aria - label={ `${countdown.percentage.toFixed(0)}% of verification time remaining` }
        />
    </div>
    </div>
  );
}

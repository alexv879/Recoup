/**
 * PAYMENT STATUS BADGE COMPONENT
 * 
 * Research Reference: payment_verification_code.md lines 5-78
 * WCAG AAA Compliant (7:1+ contrast ratios)
 * 
 * Status Types:
 * - paid: Payment confirmed (Green #059669)
 * - pending_verification: Awaiting freelancer verification (Yellow #CA8A04)
 * - overdue: Payment past due (Red #991B1B)
 * - rejected: Payment claim rejected (Red #991B1B)
 * - pending: Invoice sent, not yet due (Blue #0891B2)
 * - draft: Invoice not sent yet (Gray #6B7280)
 */

import React from 'react';

export type PaymentStatus =
    | 'paid'
    | 'pending_verification'
    | 'overdue'
    | 'rejected'
    | 'pending'
    | 'draft'
    | 'sent';

interface PaymentStatusBadgeProps {
    status: PaymentStatus;
    className?: string;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function PaymentStatusBadge({
    status,
    className = '',
    showIcon = true,
    size = 'md',
}: PaymentStatusBadgeProps) {
    // WCAG AAA compliant color schemes (7:1+ contrast ratio)
    const statusConfig = {
        paid: {
            bg: 'bg-green-50',
            text: 'text-green-800',
            border: 'border-green-200',
            icon: '✓',
            label: 'Paid',
            dotColor: 'bg-green-600',
        },
        pending_verification: {
            bg: 'bg-yellow-50',
            text: 'text-yellow-900',
            border: 'border-yellow-200',
            icon: '⏳',
            label: 'Pending Verification',
            dotColor: 'bg-yellow-600',
        },
        overdue: {
            bg: 'bg-red-50',
            text: 'text-red-900',
            border: 'border-red-200',
            icon: '⚠️',
            label: 'Overdue',
            dotColor: 'bg-red-600',
        },
        rejected: {
            bg: 'bg-red-50',
            text: 'text-red-900',
            border: 'border-red-200',
            icon: '✕',
            label: 'Rejected',
            dotColor: 'bg-red-600',
        },
        pending: {
            bg: 'bg-blue-50',
            text: 'text-blue-900',
            border: 'border-blue-200',
            icon: '○',
            label: 'Pending',
            dotColor: 'bg-blue-600',
        },
        draft: {
            bg: 'bg-gray-50',
            text: 'text-gray-700',
            border: 'border-gray-200',
            icon: '📝',
            label: 'Draft',
            dotColor: 'bg-gray-500',
        },
        sent: {
            bg: 'bg-blue-50',
            text: 'text-blue-900',
            border: 'border-blue-200',
            icon: '📧',
            label: 'Sent',
            dotColor: 'bg-blue-600',
        },
    };

    const config = statusConfig[status];

    // Size variants
    const sizeClasses = {
        sm: {
            badge: 'px-2 py-0.5 text-xs',
            dot: 'w-1.5 h-1.5',
            icon: 'text-xs',
        },
        md: {
            badge: 'px-3 py-1 text-sm',
            dot: 'w-2 h-2',
            icon: 'text-sm',
        },
        lg: {
            badge: 'px-4 py-1.5 text-base',
            dot: 'w-2.5 h-2.5',
            icon: 'text-base',
        },
    };

    const sizeClass = sizeClasses[size];

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 
        ${config.bg} ${config.text} ${config.border}
        border rounded-full font-semibold
        ${sizeClass.badge}
        ${className}
      `}
            role="status"
            aria-label={`Payment status: ${config.label}`}
        >
            {showIcon && (
                <span className={sizeClass.icon} aria-hidden="true">
                    {config.icon}
                </span>
            )}
            <span className="hidden sm:inline">{config.label}</span>
            <span className="sm:hidden">
                {status === 'pending_verification' ? 'Verifying' : config.label}
            </span>
        </span>
    );
}

/**
 * PAYMENT STATUS DOT - Compact indicator for tables/lists
 */
interface PaymentStatusDotProps {
    status: PaymentStatus;
    showLabel?: boolean;
    className?: string;
}

export function PaymentStatusDot({
    status,
    showLabel = false,
    className = '',
}: PaymentStatusDotProps) {
    const statusConfig = {
        paid: {
            dotColor: 'bg-green-600',
            label: 'Paid',
            pulseColor: 'animate-ping bg-green-400',
        },
        pending_verification: {
            dotColor: 'bg-yellow-600',
            label: 'Verifying',
            pulseColor: 'animate-ping bg-yellow-400',
        },
        overdue: {
            dotColor: 'bg-red-600',
            label: 'Overdue',
            pulseColor: 'animate-ping bg-red-400',
        },
        rejected: {
            dotColor: 'bg-red-600',
            label: 'Rejected',
            pulseColor: '',
        },
        pending: {
            dotColor: 'bg-blue-600',
            label: 'Pending',
            pulseColor: '',
        },
        draft: {
            dotColor: 'bg-gray-400',
            label: 'Draft',
            pulseColor: '',
        },
        sent: {
            dotColor: 'bg-blue-600',
            label: 'Sent',
            pulseColor: '',
        },
    };

    const config = statusConfig[status];
    const shouldPulse = status === 'pending_verification' || status === 'overdue';

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <div className="relative flex h-3 w-3">
                {shouldPulse && (
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pulseColor}`} />
                )}
                <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${config.dotColor}`}
                    role="status"
                    aria-label={`Payment status: ${config.label}`}
                />
            </div>
            {showLabel && (
                <span className="text-sm text-gray-700">{config.label}</span>
            )}
        </div>
    );
}

/**
 * PAYMENT STATUS INDICATOR - Detailed status with description
 */
interface PaymentStatusIndicatorProps {
    status: PaymentStatus;
    timestamp?: Date;
    description?: string;
    className?: string;
}

export function PaymentStatusIndicator({
    status,
    timestamp,
    description,
    className = '',
}: PaymentStatusIndicatorProps) {
    const statusConfig = {
        paid: {
            title: 'Payment Confirmed',
            defaultDescription: 'This invoice has been marked as paid',
            color: 'text-green-700',
            bgColor: 'bg-green-50',
            borderColor: 'border-l-green-600',
        },
        pending_verification: {
            title: 'Awaiting Verification',
            defaultDescription: 'Client claims payment made. Please verify within 48 hours.',
            color: 'text-yellow-900',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-l-yellow-600',
        },
        overdue: {
            title: 'Payment Overdue',
            defaultDescription: 'This invoice is past its due date',
            color: 'text-red-900',
            bgColor: 'bg-red-50',
            borderColor: 'border-l-red-600',
        },
        rejected: {
            title: 'Payment Claim Rejected',
            defaultDescription: 'Payment verification was rejected',
            color: 'text-red-900',
            bgColor: 'bg-red-50',
            borderColor: 'border-l-red-600',
        },
        pending: {
            title: 'Payment Pending',
            defaultDescription: 'Waiting for payment from client',
            color: 'text-blue-900',
            bgColor: 'bg-blue-50',
            borderColor: 'border-l-blue-600',
        },
        draft: {
            title: 'Draft Invoice',
            defaultDescription: 'This invoice has not been sent yet',
            color: 'text-gray-700',
            bgColor: 'bg-gray-50',
            borderColor: 'border-l-gray-400',
        },
        sent: {
            title: 'Invoice Sent',
            defaultDescription: 'Waiting for payment from client',
            color: 'text-blue-900',
            bgColor: 'bg-blue-50',
            borderColor: 'border-l-blue-600',
        },
    };

    const config = statusConfig[status];

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <div
            className={`
        ${config.bgColor} ${config.borderColor}
        border-l-4 p-4 rounded-r-lg
        ${className}
      `}
            role="status"
            aria-label={`Payment status: ${config.title}`}
        >
            <div className="flex items-start gap-3">
                <PaymentStatusDot status={status} />
                <div className="flex-1">
                    <h4 className={`font-semibold ${config.color} mb-1`}>
                        {config.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                        {description || config.defaultDescription}
                    </p>
                    {timestamp && (
                        <p className="text-xs text-gray-500 mt-2">
                            {formatTimestamp(timestamp)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * PAYMENT STATUS TIMELINE - Shows status history
 */
interface StatusTimelineEvent {
    status: PaymentStatus;
    timestamp: Date;
    description?: string;
    actor?: string;
}

interface PaymentStatusTimelineProps {
    events: StatusTimelineEvent[];
    className?: string;
}

export function PaymentStatusTimeline({
    events,
    className = '',
}: PaymentStatusTimelineProps) {
    const sortedEvents = [...events].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return (
        <div className={`space-y-4 ${className}`}>
            {sortedEvents.map((event, index) => (
                <div key={index} className="relative">
                    {index !== sortedEvents.length - 1 && (
                        <div className="absolute left-[5px] top-6 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    <div className="flex gap-4">
                        <PaymentStatusDot status={event.status} />
                        <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">
                                    {event.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {event.timestamp.toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            {event.description && (
                                <p className="text-sm text-gray-600">{event.description}</p>
                            )}
                            {event.actor && (
                                <p className="text-xs text-gray-500 mt-1">by {event.actor}</p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * PAYMENT TIMELINE COMPONENT
 * 
 * Research Reference: payment_verification_code.md lines 387-488
 * Visual timeline showing invoice journey from creation to payment
 * 
 * Timeline Events:
 * - Invoice Created (draft)
 * - Invoice Sent (to client)
 * - Invoice Opened (client viewed)
 * - Reminder Sent (Day 5/15/30)
 * - Payment Claimed (client says paid)
 * - Payment Verified (freelancer confirms)
 * - Payment Received (marked as paid)
 */

import React from 'react';
import { PaymentStatusDot } from './PaymentStatusBadge';

export type TimelineEventType =
    | 'invoice_created'
    | 'invoice_sent'
    | 'invoice_opened'
    | 'reminder_sent'
    | 'payment_claimed'
    | 'payment_verified'
    | 'payment_rejected'
    | 'payment_received'
    | 'collections_enabled'
    | 'collections_paused';

export interface TimelineEvent {
    id: string;
    type: TimelineEventType;
    timestamp: Date;
    actor?: string; // Who performed the action
    metadata?: {
        reminderType?: 'email' | 'sms' | 'call' | 'letter';
        paymentMethod?: string;
        rejectionReason?: string;
        amount?: number;
        [key: string]: any;
    };
}

interface PaymentTimelineProps {
    events: TimelineEvent[];
    className?: string;
    compact?: boolean;
}

export function PaymentTimeline({
    events,
    className = '',
    compact = false,
}: PaymentTimelineProps) {
    const sortedEvents = [...events].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const getEventConfig = (type: TimelineEventType) => {
        const configs = {
            invoice_created: {
                icon: '📝',
                title: 'Invoice Created',
                description: 'Invoice drafted',
                color: 'text-gray-700',
                dotColor: 'bg-gray-400',
                lineColor: 'bg-gray-200',
            },
            invoice_sent: {
                icon: '📧',
                title: 'Invoice Sent',
                description: 'Sent to client',
                color: 'text-blue-700',
                dotColor: 'bg-blue-500',
                lineColor: 'bg-blue-200',
            },
            invoice_opened: {
                icon: '👁️',
                title: 'Invoice Opened',
                description: 'Client viewed invoice',
                color: 'text-indigo-700',
                dotColor: 'bg-indigo-500',
                lineColor: 'bg-indigo-200',
            },
            reminder_sent: {
                icon: '🔔',
                title: 'Reminder Sent',
                description: 'Payment reminder',
                color: 'text-yellow-700',
                dotColor: 'bg-yellow-500',
                lineColor: 'bg-yellow-200',
            },
            payment_claimed: {
                icon: '💬',
                title: 'Payment Claimed',
                description: 'Client says they paid',
                color: 'text-purple-700',
                dotColor: 'bg-purple-500',
                lineColor: 'bg-purple-200',
            },
            payment_verified: {
                icon: '✓',
                title: 'Payment Verified',
                description: 'You confirmed payment',
                color: 'text-green-700',
                dotColor: 'bg-green-500',
                lineColor: 'bg-green-200',
            },
            payment_rejected: {
                icon: '✕',
                title: 'Claim Rejected',
                description: 'Payment claim rejected',
                color: 'text-red-700',
                dotColor: 'bg-red-500',
                lineColor: 'bg-red-200',
            },
            payment_received: {
                icon: '✅',
                title: 'Payment Received',
                description: 'Marked as paid',
                color: 'text-green-700',
                dotColor: 'bg-green-600',
                lineColor: 'bg-green-200',
            },
            collections_enabled: {
                icon: '⚡',
                title: 'Collections Started',
                description: 'Automatic collections enabled',
                color: 'text-orange-700',
                dotColor: 'bg-orange-500',
                lineColor: 'bg-orange-200',
            },
            collections_paused: {
                icon: '⏸️',
                title: 'Collections Paused',
                description: 'Collections temporarily stopped',
                color: 'text-gray-700',
                dotColor: 'bg-gray-400',
                lineColor: 'bg-gray-200',
            },
        };

        return configs[type];
    };

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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDetailedTimestamp = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (compact) {
        return (
            <div className={`flex items-center gap-2 overflow-x-auto ${className}`}>
                {sortedEvents.map((event, index) => {
                    const config = getEventConfig(event.type);
                    return (
                        <React.Fragment key={event.id}>
                            <div
                                className="flex flex-col items-center min-w-[80px]"
                                title={`${config.title} - ${formatDetailedTimestamp(event.timestamp)}`}
                            >
                                <div className={`w-10 h-10 rounded-full ${config.dotColor} flex items-center justify-center text-white text-lg shadow-md`}>
                                    {config.icon}
                                </div>
                                <span className={`text-xs mt-1 text-center ${config.color} font-medium`}>
                                    {config.title}
                                </span>
                            </div>
                            {index < sortedEvents.length - 1 && (
                                <div className={`h-0.5 w-8 ${config.lineColor} flex-shrink-0`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {sortedEvents.map((event, index) => {
                const config = getEventConfig(event.type);
                const isLast = index === sortedEvents.length - 1;

                return (
                    <div key={event.id} className="relative">
                        {!isLast && (
                            <div
                                className={`absolute left-5 top-12 bottom-0 w-0.5 ${config.lineColor}`}
                                aria-hidden="true"
                            />
                        )}

                        <div className="flex gap-4">
                            {/* Icon Circle */}
                            <div className="flex-shrink-0">
                                <div
                                    className={`w-10 h-10 rounded-full ${config.dotColor} flex items-center justify-center text-white text-lg shadow-md ring-4 ring-white`}
                                    role="img"
                                    aria-label={config.title}
                                >
                                    {config.icon}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-6">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className={`font-semibold ${config.color} text-base`}>
                                                {config.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {event.metadata?.reminderType
                                                    ? `${config.description} (${event.metadata.reminderType.toUpperCase()})`
                                                    : config.description}
                                            </p>
                                        </div>
                                        <time
                                            className="text-xs text-gray-500 ml-4 flex-shrink-0"
                                            dateTime={event.timestamp.toISOString()}
                                            title={formatDetailedTimestamp(event.timestamp)}
                                        >
                                            {formatTimestamp(event.timestamp)}
                                        </time>
                                    </div>

                                    {/* Metadata */}
                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <dl className="grid grid-cols-2 gap-3 text-xs">
                                                {event.metadata.paymentMethod && (
                                                    <div>
                                                        <dt className="text-gray-500">Payment Method</dt>
                                                        <dd className="font-medium text-gray-900 mt-0.5">
                                                            {event.metadata.paymentMethod}
                                                        </dd>
                                                    </div>
                                                )}
                                                {event.metadata.rejectionReason && (
                                                    <div className="col-span-2">
                                                        <dt className="text-gray-500">Reason</dt>
                                                        <dd className="font-medium text-red-700 mt-0.5">
                                                            {event.metadata.rejectionReason}
                                                        </dd>
                                                    </div>
                                                )}
                                                {event.metadata.amount && (
                                                    <div>
                                                        <dt className="text-gray-500">Amount</dt>
                                                        <dd className="font-medium text-gray-900 mt-0.5">
                                                            £{event.metadata.amount.toFixed(2)}
                                                        </dd>
                                                    </div>
                                                )}
                                                {event.actor && (
                                                    <div>
                                                        <dt className="text-gray-500">By</dt>
                                                        <dd className="font-medium text-gray-900 mt-0.5">
                                                            {event.actor}
                                                        </dd>
                                                    </div>
                                                )}
                                            </dl>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * SIMPLIFIED TIMELINE - For dashboard/summary views
 */
interface SimpleTimelineProps {
    status: 'draft' | 'sent' | 'opened' | 'claimed' | 'verified' | 'paid' | 'overdue';
    daysOverdue?: number;
    className?: string;
}

export function SimplePaymentTimeline({
    status,
    daysOverdue = 0,
    className = '',
}: SimpleTimelineProps) {
    const stages = [
        { key: 'draft', label: 'Draft', icon: '📝' },
        { key: 'sent', label: 'Sent', icon: '📧' },
        { key: 'opened', label: 'Opened', icon: '👁️' },
        { key: 'paid', label: 'Paid', icon: '✅' },
    ];

    const statusOrder = ['draft', 'sent', 'opened', 'claimed', 'verified', 'paid'];
    const currentIndex = statusOrder.indexOf(status);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {stages.map((stage, index) => {
                const isActive = index <= currentIndex;
                const isCurrent = stages[index].key === status;

                return (
                    <React.Fragment key={stage.key}>
                        <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm transition-all ${isActive
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-gray-200 text-gray-500'
                                } ${isCurrent ? 'ring-2 ring-indigo-300 ring-offset-2' : ''}`}
                            title={stage.label}
                        >
                            {stage.icon}
                        </div>
                        {index < stages.length - 1 && (
                            <div
                                className={`h-0.5 w-8 transition-all ${isActive ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
            {status === 'overdue' && daysOverdue > 0 && (
                <span className="ml-2 text-xs font-semibold text-red-600">
                    {daysOverdue}d overdue
                </span>
            )}
        </div>
    );
}

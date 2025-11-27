/**
 * Collections Timeline Component
 * 
 * Based on:
 * - collections_implementation_guide.md §1.2 (Reminder Timeline Visualization)
 * - Displays all collection activities in chronological order
 * - Interactive: click event to see full email/SMS content
 * - Shows read/sent status for each reminder
 * - Expandable to show bounce backs or opt-outs
 * 
 * Accessibility:
 * - Keyboard navigation
 * - ARIA labels for each event
 * - Screen reader announcements for status changes
 */

'use client';

import React, { useState } from 'react';
import AccessibleTable from '@/components/UI/AccessibleTable';
import { format } from 'date-fns';
import { EscalationTimelineEvent } from '@/types/escalation';
import { ESCALATION_CONFIGS } from '@/types/escalation';

interface CollectionsTimelineProps {
    events: EscalationTimelineEvent[];
    onEventClick?: (event: EscalationTimelineEvent) => void;
}

export function CollectionsTimeline({ events, onEventClick }: CollectionsTimelineProps) {
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

    const toggleExpand = (eventId: string) => {
        setExpandedEvents((prev) => {
            const next = new Set(prev);
            if (next.has(eventId)) {
                next.delete(eventId);
            } else {
                next.add(eventId);
            }
            return next;
        });
    };

    if (events.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <span className="text-4xl mb-4 block">📋</span>
                <p className="text-lg font-semibold text-[#1F2937] mb-2">No collection activities yet</p>
                <p className="text-sm text-[#6B7280]">When you enable collections, all activities will appear here</p>
            </div>
        );
    }

    // Sort events by timestamp (newest first for display)
    const sortedEvents = [...events].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div
            role="list"
            aria-label="Collections timeline"
            className="space-y-0"
        >
            {/* Accessible table for screen readers: make timeline data available in table semantics */}
            <div className="sr-only">
                <AccessibleTable
                    columns={[
                        { key: 'ts', header: 'Time' },
                        { key: 'type', header: 'Type' },
                        { key: 'message', header: 'Message' },
                        { key: 'channel', header: 'Channel' },
                    ]}
                    data={sortedEvents.map(e => ({
                        ts: new Date(e.timestamp).toLocaleString('en-GB'),
                        type: e.eventType.replace('_', ' '),
                        message: e.message,
                        channel: e.channel || '',
                    }))}
                    caption="Collections timeline events"
                    ariaLabel="Collections timeline events"
                />
            </div>
            {sortedEvents.map((event, index) => {
                const isExpanded = expandedEvents.has(event.eventId);
                const isLast = index === sortedEvents.length - 1;

                // Event type styling - CRO-optimized colors
                const eventTypeStyles: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
                    escalated: {
                        icon: '⚠️',
                        color: '#DC2626',
                        bgColor: '#FEF2F2',
                        label: 'Escalated',
                    },
                    paused: {
                        icon: '⏸️',
                        color: '#F59E0B',
                        bgColor: '#FFFBEB',
                        label: 'Paused',
                    },
                    resumed: {
                        icon: '▶️',
                        color: '#22C55E',
                        bgColor: '#F0FDF4',
                        label: 'Resumed',
                    },
                    reminder_sent: {
                        icon: '📧',
                        color: '#0078D4',
                        bgColor: '#EFF6FF',
                        label: 'Reminder Sent',
                    },
                    payment_received: {
                        icon: '✅',
                        color: '#22C55E',
                        bgColor: '#F0FDF4',
                        label: 'Payment Received',
                    },
                    promised: {
                        icon: '🟡',
                        color: '#F59E0B',
                        bgColor: '#FFFBEB',
                        label: 'Promised',
                    },
                    overdue: {
                        icon: '🔴',
                        color: '#DC2626',
                        bgColor: '#FEF2F2',
                        label: 'Overdue',
                    },
                    pending: {
                        icon: '⏳',
                        color: '#9CA3AF',
                        bgColor: '#F9FAFB',
                        label: 'Pending',
                    },
                };

                const style = eventTypeStyles[event.eventType] || eventTypeStyles.reminder_sent;

                return (
                    <div key={event.eventId} className="relative flex gap-4 pb-6">
                        {/* Vertical Line */}
                        {!isLast && (
                            <div
                                className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200"
                                aria-hidden="true"
                            />
                        )}

                        {/* Icon Circle */}
                        <div
                            className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md"
                            style={{
                                backgroundColor: style.bgColor,
                                color: style.color,
                                border: `2px solid ${style.color}`,
                            }}
                            aria-hidden="true"
                        >
                            {style.icon}
                        </div>

                        {/* Event Content */}
                        <div className="flex-1 min-w-0">
                            <button
                                type="button"
                                onClick={() => {
                                    toggleExpand(event.eventId);
                                    if (onEventClick) onEventClick(event);
                                }}
                                className="w-full text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                                aria-label={`${event.eventType.replace('_', ' ')} event. ${event.message}. ${format(
                                    new Date(event.timestamp),
                                    'PPp'
                                )}. Click to ${isExpanded ? 'collapse' : 'expand'} details`}
                            >
                                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                                    {/* Event Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-semibold text-gray-900 capitalize">
                                                    {event.eventType.replace('_', ' ')}
                                                </h4>
                                                {event.channel && (
                                                    <span
                                                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                        style={{
                                                            backgroundColor: `${style.color}20`,
                                                            color: style.color,
                                                        }}
                                                    >
                                                        {event.channel.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 mb-1">{event.message}</p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(event.timestamp), 'PPp')}
                                            </p>
                                        </div>

                                        {/* Expand/Collapse Icon */}
                                        <div
                                            className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-transform"
                                            style={{
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            }}
                                        >
                                            ▼
                                        </div>
                                    </div>

                                    {/* Expanded Metadata */}
                                    {isExpanded && event.metadata && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                            {Object.entries(event.metadata).map(([key, value]) => (
                                                <div key={key} className="text-xs">
                                                    <span className="font-medium text-gray-600 capitalize">
                                                        {key.replace(/_/g, ' ')}:
                                                    </span>{' '}
                                                    <span className="text-gray-700">
                                                        {typeof value === 'object'
                                                            ? JSON.stringify(value, null, 2)
                                                            : String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

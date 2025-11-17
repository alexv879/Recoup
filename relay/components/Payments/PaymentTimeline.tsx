/**
 * Payment Timeline Component
 *
 * Visual timeline showing the complete invoice payment journey from sent to verified.
 *
 * Research Source: payment_verification_code.md lines 387-488
 * Features:
 * - Chronological event display (newest first)
 * - Visual connector lines between events
 * - Circular status icons with color coding
 * - Responsive timestamps
 * - Expandable metadata
 * - WCAG AA accessibility
 *
 * @see PHASE_2_PROGRESS.md Task 3
 */

'use client';

import React, { useState } from 'react';
import {
  Mail,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * Timeline event types representing invoice lifecycle stages
 */
export type TimelineEventType =
  | 'invoice_created'
  | 'sent'
  | 'opened'
  | 'reminder_sent'
  | 'paid_claimed'
  | 'payment_verified'
  | 'payment_rejected'
  | 'overdue'
  | 'escalated'
  | 'evidence_uploaded';

/**
 * Timeline event data structure
 */
export interface TimelineEvent {
  /** Event type identifier */
  type: TimelineEventType;
  /** ISO timestamp of when event occurred */
  timestamp: string;
  /** Human-readable description */
  description?: string;
  /** Optional metadata for expandable details */
  metadata?: Record<string, unknown>;
  /** Optional user who triggered the event */
  actor?: {
    name: string;
    role: 'freelancer' | 'client' | 'system';
  };
}

interface PaymentTimelineProps {
  /** Array of timeline events (should be sorted newest first) */
  events: TimelineEvent[];
  /** Optional className for container styling */
  className?: string;
  /** Show expandable metadata sections */
  showMetadata?: boolean;
}

/**
 * Event configuration with icons and colors
 */
const EVENT_CONFIG: Record<TimelineEventType, {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  label: string;
  ariaLabel: string;
}> = {
  invoice_created: {
    icon: Send,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100',
    label: 'Invoice created',
    ariaLabel: 'Invoice was created'
  },
  sent: {
    icon: Mail,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100',
    label: 'Invoice sent',
    ariaLabel: 'Invoice sent to client'
  },
  opened: {
    icon: Eye,
    colorClass: 'text-cyan-600',
    bgClass: 'bg-cyan-100',
    label: 'Invoice opened',
    ariaLabel: 'Invoice opened by client'
  },
  reminder_sent: {
    icon: AlertCircle,
    colorClass: 'text-yellow-600',
    bgClass: 'bg-yellow-100',
    label: 'Reminder sent',
    ariaLabel: 'Payment reminder sent'
  },
  paid_claimed: {
    icon: Clock,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-100',
    label: 'Payment claimed',
    ariaLabel: 'Client claimed payment made'
  },
  payment_verified: {
    icon: CheckCircle2,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100',
    label: 'Payment verified',
    ariaLabel: 'Payment verified by freelancer'
  },
  payment_rejected: {
    icon: XCircle,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-100',
    label: 'Payment rejected',
    ariaLabel: 'Payment claim rejected'
  },
  overdue: {
    icon: AlertCircle,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-100',
    label: 'Invoice overdue',
    ariaLabel: 'Invoice became overdue'
  },
  escalated: {
    icon: AlertCircle,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-100',
    label: 'Collections escalated',
    ariaLabel: 'Collections escalated to next stage'
  },
  evidence_uploaded: {
    icon: CheckCircle2,
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-100',
    label: 'Evidence uploaded',
    ariaLabel: 'Payment evidence uploaded'
  }
};

/**
 * Format timestamp to human-readable date/time
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return timestamp;
  }
}

/**
 * Single timeline event item with expandable metadata
 */
function TimelineEventItem({
  event,
  index,
  isLast,
  showMetadata
}: {
  event: TimelineEvent;
  index: number;
  isLast: boolean;
  showMetadata?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.sent;
  const Icon = config.icon;

  const hasMetadata = showMetadata && event.metadata && Object.keys(event.metadata).length > 0;

  return (
    <div className="flex gap-4 pb-8 relative">
      {/* Connector Line */}
      {!isLast && (
        <div
          className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200"
          aria-hidden="true"
        />
      )}

      {/* Icon Circle */}
      <div
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${config.colorClass}
          ${config.bgClass}
          relative z-10
        `.trim().replace(/\s+/g, ' ')}
        aria-label={config.ariaLabel}
        role="img"
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-grow pt-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{config.label}</p>
              {event.actor && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {event.actor.name}
                </span>
              )}
            </div>

            {event.description && (
              <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
            )}

            {/* Expandable Metadata */}
            {hasMetadata && (
              <div className="mt-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  aria-expanded={isExpanded}
                  aria-controls={`metadata-${index}`}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Hide details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show details
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div
                    id={`metadata-${index}`}
                    className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <dl className="space-y-1">
                      {Object.entries(event.metadata!).map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-xs">
                          <dt className="font-medium text-gray-700 min-w-[120px]">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:
                          </dt>
                          <dd className="text-gray-600">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <time
            className="text-sm text-gray-500 flex-shrink-0"
            dateTime={event.timestamp}
          >
            {formatTimestamp(event.timestamp)}
          </time>
        </div>
      </div>
    </div>
  );
}

/**
 * PaymentTimeline - Visual timeline of invoice payment journey
 *
 * Shows chronological events from invoice creation through payment verification.
 * Includes visual connector lines, status icons, and expandable metadata.
 *
 * @example
 * ```tsx
 * const events: TimelineEvent[] = [
 *   {
 *     type: 'sent',
 *     timestamp: '2025-11-10T09:00:00',
 *     description: 'Sent to john@company.com',
 *     actor: { name: 'System', role: 'system' }
 *   },
 *   {
 *     type: 'payment_verified',
 *     timestamp: '2025-11-19T09:15:00',
 *     description: 'Payment verified',
 *     metadata: { amount: 50000, method: 'BACS' }
 *   }
 * ];
 *
 * <PaymentTimeline events={events} showMetadata />
 * ```
 */
export function PaymentTimeline({
  events,
  className = '',
  showMetadata = false
}: PaymentTimelineProps) {
  // Empty state
  if (!events || events.length === 0) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <div className="inline-flex flex-col items-center gap-2">
          <Clock className="w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-500">No timeline events yet</p>
          <p className="text-xs text-gray-400">
            Events will appear here as your invoice progresses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} role="list" aria-label="Payment timeline">
      {events.map((event, index) => (
        <div key={`${event.type}-${event.timestamp}-${index}`} role="listitem">
          <TimelineEventItem
            event={event}
            index={index}
            isLast={index === events.length - 1}
            showMetadata={showMetadata}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Compact timeline variant - Horizontal layout for dashboards
 */
export function PaymentTimelineCompact({
  events,
  className = ''
}: PaymentTimelineProps) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {events.slice(0, 4).map((event, index) => {
        const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.sent;
        const Icon = config.icon;

        return (
          <React.Fragment key={`${event.type}-${event.timestamp}-${index}`}>
            <div
              className={`
                w-6 h-6 rounded-full flex items-center justify-center
                ${config.colorClass}
                ${config.bgClass}
              `.trim().replace(/\s+/g, ' ')}
              title={`${config.label} - ${formatTimestamp(event.timestamp)}`}
              aria-label={config.ariaLabel}
            >
              <Icon className="w-3 h-3" aria-hidden="true" />
            </div>
            {index < Math.min(events.length, 4) - 1 && (
              <div className="w-4 h-0.5 bg-gray-200" aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}

      {events.length > 4 && (
        <span className="text-xs text-gray-500 ml-1">
          +{events.length - 4} more
        </span>
      )}
    </div>
  );
}

export default PaymentTimeline;

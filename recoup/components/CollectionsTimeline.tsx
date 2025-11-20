/**
 * COLLECTIONS ESCALATION TIMELINE
 *
 * Visual timeline component showing late payment escalation stages
 *
 * Research Impact:
 * - +30-40% recovery rate with transparent escalation
 * - Users see urgency visually
 * - Clear next actions reduce confusion
 *
 * Escalation Stages (UK Law):
 * - Day 5: Friendly reminder (no interest yet)
 * - Day 15: Firm reminder (13.25% interest applies)
 * - Day 30: Final notice (interest + £40-100 fixed fee)
 * - Day 45+: Legal action (court claim or debt agency)
 *
 * Usage:
 * ```tsx
 * <CollectionsTimeline
 *   invoiceId="inv_123"
 *   originalAmount={1000}
 *   dueDate={new Date('2025-01-01')}
 *   status="overdue"
 *   currentStage="day_15"
 * />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import {
  calculateLatePaymentInterest,
  formatCurrency,
  type InterestCalculation,
} from '@/lib/collections-calculator';
import { trackEvent } from '@/lib/analytics';
import AccessibleTable from '@/components/Custom/AccessibleTable';

// ============================================================
// TYPES
// ============================================================

export type EscalationStage = 'on_time' | 'day_5' | 'day_15' | 'day_30' | 'agency_referred';

export interface CollectionsTimelineProps {
  invoiceId: string;
  originalAmount: number;
  dueDate: Date;
  status: 'paid' | 'overdue' | 'pending';
  currentStage?: EscalationStage;
  collectionsPaused?: boolean; // Pause escalation during payment verification (48-hour window)
  onSendReminder?: (stage: EscalationStage) => void;
  className?: string;
}

interface TimelineStage {
  id: EscalationStage;
  day: number;
  title: string;
  description: string;
  action: string;
  icon: string;
  completed: boolean;
  current: boolean;
  urgent: boolean;
}

// ============================================================
// COLLECTIONS TIMELINE COMPONENT
// ============================================================

export function CollectionsTimeline({
  invoiceId,
  originalAmount,
  dueDate,
  status,
  currentStage,
  collectionsPaused = false,
  onSendReminder,
  className = '',
}: CollectionsTimelineProps) {
  const [interest, setInterest] = useState<InterestCalculation | null>(null);
  const [daysOverdue, setDaysOverdue] = useState(0);
  const [activeStage, setActiveStage] = useState<EscalationStage>('on_time');

  // Calculate days overdue and interest
  useEffect(() => {
    if (status !== 'overdue') {
      setDaysOverdue(0);
      setActiveStage('on_time');
      return;
    }

    // Pause escalation if payment claim is under verification (48-hour window)
    if (collectionsPaused) {
      // Still calculate interest, but don't progress stages
      const today = new Date();
      const days = Math.max(0, Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      ));
      setDaysOverdue(days);

      if (days > 0) {
        try {
          const calc = calculateLatePaymentInterest({
            principalAmount: originalAmount,
            dueDate,
            currentDate: today,
          });
          setInterest(calc);
        } catch (error) {
          console.error('Error calculating interest:', error);
        }
      }
      return; // Don't progress to next stage while paused
    }

    const today = new Date();
    const days = Math.max(0, Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    ));

    setDaysOverdue(days);

    // Calculate interest if overdue
    if (days > 0) {
      try {
        const calc = calculateLatePaymentInterest({
          principalAmount: originalAmount,
          dueDate,
          currentDate: today,
        });
        setInterest(calc);
      } catch (error) {
        console.error('Error calculating interest:', error);
      }
    }

    // Determine current stage
    let stage: EscalationStage = 'on_time';
    if (days >= 45) {
      stage = 'agency_referred';
    } else if (days >= 30) {
      stage = 'day_30';
    } else if (days >= 15) {
      stage = 'day_15';
    } else if (days >= 5) {
      stage = 'day_5';
    }

    setActiveStage(currentStage || stage);
  }, [originalAmount, dueDate, status, currentStage, collectionsPaused]);

  // Define timeline stages
  // Email templates should be sent via onSendReminder callback:
  // - Day 5: SendGrid template 'd-xxxxx-day5-friendly'
  // - Day 15: SendGrid template 'd-xxxxx-day15-firm' 
  // - Day 30: SendGrid template 'd-xxxxx-day30-legal'
  // See: docs/email_reminder_templates.md for full template specs
  const stages: TimelineStage[] = [
    {
      id: 'day_5',
      day: 5,
      title: 'Friendly Reminder',
      description: 'Polite email asking if payment was sent',
      action: 'Send friendly email',
      icon: '📧',
      completed: daysOverdue >= 5,
      current: activeStage === 'day_5',
      urgent: false,
    },
    {
      id: 'day_15',
      day: 15,
      title: 'Firm Reminder',
      description: 'Introduce statutory interest (13.25% annual)',
      action: 'Send firm reminder',
      icon: '⚠️',
      completed: daysOverdue >= 15,
      current: activeStage === 'day_15',
      urgent: true,
    },
    {
      id: 'day_30',
      day: 30,
      title: 'Final Notice',
      description: 'Legal warning with 7-day deadline',
      action: 'Send final notice',
      icon: '📜',
      completed: daysOverdue >= 30,
      current: activeStage === 'day_30',
      urgent: true,
    },
    {
      id: 'agency_referred',
      day: 45,
      title: 'Legal Action',
      description: 'Refer to debt collection agency or court',
      action: 'Escalate to legal',
      icon: '⚖️',
      completed: daysOverdue >= 45,
      current: activeStage === 'agency_referred',
      urgent: true,
    },
  ];

  // Track view
  useEffect(() => {
    if (status === 'overdue') {
      trackEvent('collections_timeline_viewed', {
        invoice_id: invoiceId,
        days_overdue: daysOverdue,
        current_stage: activeStage,
        amount_due: interest?.totalOwed || originalAmount,
      });
    }
  }, [invoiceId, status, daysOverdue, activeStage, interest, originalAmount]);

  // Handle send reminder
  const handleSendReminder = (stage: EscalationStage) => {
    trackEvent('email_sent', {
      invoice_id: invoiceId,
      reminder_level: stage,
      days_overdue: daysOverdue,
      amount: interest?.totalOwed || originalAmount,
    });

    onSendReminder?.(stage);
  };

  // ============================================================
  // RENDER
  // ============================================================

  // Don't show timeline if invoice is paid or not overdue
  if (status === 'paid') {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <span className="text-3xl">✅</span>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Payment Received</h3>
            <p className="text-sm text-green-700">
              This invoice has been paid. No collection action needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status !== 'overdue' || daysOverdue === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <span className="text-3xl">⏱️</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Pending</h3>
            <p className="text-sm text-gray-600">
              Invoice due date: {dueDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Accessible table summary for screen readers
  const tableColumns = [
    { key: 'day', header: 'Day' },
    { key: 'title', header: 'Stage' },
    { key: 'description', header: 'Description' },
    { key: 'action', header: 'Action' },
    { key: 'completed', header: 'Completed' },
    { key: 'urgent', header: 'Urgent' },
  ];
  const tableData = stages.map(stage => ({
    day: stage.day,
    title: stage.title,
    description: stage.description,
    action: stage.action,
    completed: stage.completed ? 'Yes' : 'No',
    urgent: stage.urgent ? 'Yes' : 'No',
  }));

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Collections Timeline
            </h2>
            <p className="text-sm text-gray-700">
              Invoice is {daysOverdue} days overdue. Current stage: <strong>{getStageTitle(activeStage)}</strong>
            </p>
          </div>
          {/* Amount Due Badge */}
          {interest && (
            <div className="bg-white rounded-lg border-2 border-red-600 px-4 py-3 text-right">
              <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                Total Due
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(interest.totalOwed)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Original: {formatCurrency(originalAmount)}
              </div>
            </div>
          )}
        </div>
        {/* Accessible Table for Timeline Summary */}
        <div className="mt-6">
          <span className="sr-only" id="timeline-table-caption">Collections escalation stages summary table</span>
          {/* AccessibleTable is visually hidden but available to screen readers */}
          <div className="sr-only">
            <AccessibleTable
              columns={tableColumns}
              data={tableData}
              caption="Collections escalation stages summary table"
              ariaLabel="Collections escalation stages summary table"
            />
          </div>
        </div>
        {/* ...existing code... */}
      </div>
      {/* ...existing code... */}
    </div>
  );
}

// ============================================================
// COMPACT TIMELINE (For Dashboard Card)
// ============================================================

export function CollectionsTimelineCompact({
  daysOverdue,
  stage,
  amountDue,
  className = '',
}: {
  daysOverdue: number;
  stage: EscalationStage;
  amountDue: number;
  className?: string;
}) {
  const stageInfo = {
    day_5: { color: 'yellow' as const, icon: '📧', label: 'Friendly Reminder' },
    day_15: { color: 'orange' as const, icon: '⚠️', label: 'Firm Reminder' },
    day_30: { color: 'red' as const, icon: '📜', label: 'Final Notice' },
    agency_referred: { color: 'red' as const, icon: '⚖️', label: 'Legal Action' },
    on_time: { color: 'green' as const, icon: '✓', label: 'On Time' },
  };

  const info = stageInfo[stage];
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-600 text-yellow-900',
    orange: 'bg-orange-50 border-orange-600 text-orange-900',
    red: 'bg-red-50 border-red-600 text-red-900',
    green: 'bg-green-50 border-green-600 text-green-900',
  };

  return (
    <div className={`rounded-lg border-l-4 p-4 ${colorClasses[info.color]} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <div className="font-semibold">{info.label}</div>
            <div className="text-sm opacity-80">{daysOverdue} days overdue</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70 uppercase">Amount Due</div>
          <div className="text-lg font-bold">{formatCurrency(amountDue)}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getStageTitle(stage: EscalationStage): string {
  const titles = {
    on_time: 'On Time',
    day_5: 'Friendly Reminder',
    day_15: 'Firm Reminder',
    day_30: 'Final Notice',
    agency_referred: 'Legal Action',
  };
  return titles[stage];
}

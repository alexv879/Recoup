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
        invoiceId,
        daysOverdue,
        currentStage: activeStage,
        amountDue: interest?.totalOwed || originalAmount,
      });
    }
  }, [invoiceId, status, daysOverdue, activeStage, interest, originalAmount]);

  // Handle send reminder
  const handleSendReminder = (stage: EscalationStage) => {
    trackEvent('collections_reminder_sent', {
      invoiceId,
      stage,
      daysOverdue,
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

        {/* Interest Breakdown */}
        {interest && (
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Days Overdue</div>
                <div className="text-lg font-semibold text-gray-900">{daysOverdue} days</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Interest Accrued</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatCurrency(interest.interestAccrued)}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Fixed Fee</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(interest.fixedRecoveryCost)}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Daily Interest</div>
                <div className="text-lg font-semibold text-orange-600">
                  +{formatCurrency(interest.dailyInterest)}/day
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="p-6">
        <div className="space-y-6">
          {stages.map((stage, index) => (
            <div key={stage.id} className="relative">
              {/* Connecting Line */}
              {index < stages.length - 1 && (
                <div
                  className={`absolute left-6 top-12 w-0.5 h-12 ${stage.completed ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                />
              )}

              {/* Stage Item */}
              <div
                className={`flex items-start space-x-4 ${stage.current ? 'bg-red-50 rounded-lg p-4 border-2 border-red-600' : ''
                  }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${stage.completed
                      ? 'bg-red-600 text-white'
                      : stage.current
                        ? 'bg-orange-500 text-white animate-pulse'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {stage.completed ? '✓' : stage.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3
                          className={`font-semibold ${stage.current ? 'text-red-900' : 'text-gray-900'
                            }`}
                        >
                          Day {stage.day}: {stage.title}
                        </h3>
                        {stage.current && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                            CURRENT STAGE
                          </span>
                        )}
                        {stage.urgent && !stage.completed && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{stage.description}</p>
                      {stage.current && (
                        <div className="mt-2 text-sm">
                          <strong className="text-gray-900">Next Action:</strong>
                          <span className="text-gray-700 ml-2">{stage.action}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {stage.current && onSendReminder && (
                      <button
                        onClick={() => handleSendReminder(stage.id)}
                        className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
                      >
                        {stage.action}
                      </button>
                    )}
                  </div>

                  {/* Stage Status */}
                  <div className="mt-2">
                    {stage.completed && !stage.current && (
                      <div className="text-xs text-green-600 font-medium">
                        ✓ Completed on Day {Math.min(daysOverdue, stage.day)}
                      </div>
                    )}
                    {!stage.completed && !stage.current && (
                      <div className="text-xs text-gray-500">
                        Will trigger in {stage.day - daysOverdue} days
                      </div>
                    )}
                    {stage.current && (
                      <div className="text-xs text-red-600 font-medium">
                        → Action required now (Day {daysOverdue})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legal Notice */}
        {daysOverdue >= 15 && (
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-900">
                  Statutory Interest Now Applies
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Under the Late Payment of Commercial Debts (Interest) Act 1998, you are entitled
                  to charge {interest?.interestRate}% annual interest ({interest?.statutoryRate}% + {interest?.bankBaseRate}% Bank of England base rate).
                  Interest accrues daily until payment is received.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Escalation Options */}
        {daysOverdue >= 45 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <h4 className="font-semibold text-red-900 mb-3 flex items-center">
              <span className="text-xl mr-2">⚖️</span>
              Legal Escalation Options
            </h4>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h5 className="font-medium text-gray-900 mb-1">County Court Claim</h5>
                <p className="text-sm text-gray-600 mb-2">
                  File a claim through Money Claim Online. Cost: £35-£455 (added to debt).
                  Results in CCJ on debtor's credit record for 6 years.
                </p>
                <a
                  href="https://www.gov.uk/make-money-claim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 hover:text-red-700 font-medium inline-flex items-center"
                >
                  File Court Claim →
                </a>
              </div>
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h5 className="font-medium text-gray-900 mb-1">Debt Collection Agency</h5>
                <p className="text-sm text-gray-600 mb-2">
                  Refer to professional debt collectors. They handle all contact with debtor.
                  Fee: 15-25% of recovered amount (no upfront cost).
                </p>
                <button className="text-sm text-red-600 hover:text-red-700 font-medium inline-flex items-center">
                  Contact Agency →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
    day_5: { color: 'yellow', icon: '📧', label: 'Friendly Reminder' },
    day_15: { color: 'orange', icon: '⚠️', label: 'Firm Reminder' },
    day_30: { color: 'red', icon: '📜', label: 'Final Notice' },
    agency_referred: { color: 'red', icon: '⚖️', label: 'Legal Action' },
    on_time: { color: 'green', icon: '✓', label: 'On Time' },
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

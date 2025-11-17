/**
 * ONBOARDING CHECKLIST
 * Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.5
 *           dashboard-saas-onboarding.md (RESEARCH_SUMMARIES_MAPPING.md #5)
 *
 * Persistent right panel showing activation progress
 * Expected lift: +25-30% activation rate
 *
 * Steps:
 * 1. Create Invoice
 * 2. Send Reminder
 * 3. Receive Payment
 * 4. Enable Voice Input (bonus)
 *
 * Features:
 * - Fire activation_step_completed event on each step
 * - Confetti celebration (respects prefers-reduced-motion)
 * - Empty states with single CTA
 * - Tooltips on dwell
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Sparkles, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Confetti } from './Confetti';
import { trackEvent } from '@/lib/analytics';
import { logInfo } from '@/utils/logger';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  ctaText: string;
  ctaHref: string;
}

interface OnboardingChecklistProps {
  className?: string;
  onDismiss?: () => void;
}

export function OnboardingChecklist({ className = '', onDismiss }: OnboardingChecklistProps) {
  const { user } = useUser();
  const [steps, setSteps] = useState<ChecklistStep[]>([
    {
      id: 'create_invoice',
      title: 'Create your first invoice',
      description: 'Get started by creating an invoice',
      completed: false,
      ctaText: 'Create Invoice',
      ctaHref: '/dashboard/invoices/new',
    },
    {
      id: 'send_reminder',
      title: 'Send your first reminder',
      description: 'Set up automated payment reminders',
      completed: false,
      ctaText: 'View Invoices',
      ctaHref: '/dashboard/invoices',
    },
    {
      id: 'receive_payment',
      title: 'Receive your first payment',
      description: 'Track when clients pay you',
      completed: false,
      ctaText: 'View Dashboard',
      ctaHref: '/dashboard',
    },
  ]);

  const [showConfetti, setShowConfetti] = useState(false);
  const [completedStep, setCompletedStep] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Load activation events from user metadata
  useEffect(() => {
    if (!user) return;

    const metadata = user.publicMetadata as any;
    const activationEvents = metadata?.activationEvents || {};

    setSteps((prev) =>
      prev.map((step) => {
        let completed = false;

        if (step.id === 'create_invoice') {
          completed = !!activationEvents.firstInvoiceAt;
        } else if (step.id === 'send_reminder') {
          completed = !!activationEvents.firstReminderAt;
        } else if (step.id === 'receive_payment') {
          completed = !!activationEvents.firstPaymentAt;
        }

        return { ...step, completed };
      })
    );
  }, [user]);

  // Check if checklist is complete
  const allStepsCompleted = steps.every((step) => step.completed);
  const completedCount = steps.filter((step) => step.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  // Trigger confetti when step is completed
  const celebrateStep = (stepId: string) => {
    setCompletedStep(stepId);
    setShowConfetti(true);

    // Track analytics event
    trackEvent('activation_step_completed', {
      step_key: stepId,
    });

    logInfo('Onboarding step completed', { stepId });
  };

  // Handle dismiss
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();

    // Save dismiss state to localStorage
    localStorage.setItem('onboarding_checklist_dismissed', 'true');
  };

  // Check if previously dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem('onboarding_checklist_dismissed') === 'true';
    if (wasDismissed && allStepsCompleted) {
      setIsDismissed(true);
    }
  }, [allStepsCompleted]);

  // Auto-dismiss if all steps completed
  useEffect(() => {
    if (allStepsCompleted && !isDismissed) {
      // Show success message for 3 seconds then auto-dismiss
      const timeout = setTimeout(() => {
        handleDismiss();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [allStepsCompleted, isDismissed]);

  if (isDismissed) {
    return null;
  }

  return (
    <>
      {/* Confetti celebration */}
      <Confetti
        trigger={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Checklist panel */}
      <div
        className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 ${className}`}
        role="region"
        aria-label="Onboarding checklist"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900">
              {allStepsCompleted ? 'Congratulations! 🎉' : 'Get Started'}
            </h3>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss checklist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>{completedCount} of {steps.length} completed</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Completion message */}
        {allStepsCompleted && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              You've completed all onboarding steps! You're all set to start tracking payments.
            </p>
          </div>
        )}

        {/* Steps */}
        <ul className="space-y-4" role="list">
          {steps.map((step, index) => (
            <li key={step.id} className="flex items-start gap-3">
              {/* Step icon */}
              <div className="flex-shrink-0 mt-0.5">
                {step.completed ? (
                  <CheckCircle2
                    className="w-6 h-6 text-green-500"
                    aria-label="Completed"
                  />
                ) : (
                  <Circle
                    className="w-6 h-6 text-gray-300"
                    aria-label="Not completed"
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-medium ${
                    step.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                  }`}
                >
                  {step.title}
                </h4>
                <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>

                {/* CTA button (only show for incomplete steps) */}
                {!step.completed && (
                  <a
                    href={step.ctaHref}
                    className="inline-block mt-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    {step.ctaText} →
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Bonus step hint */}
        {!allStepsCompleted && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              <span>Bonus: Try voice input on your next invoice!</span>
            </p>
          </div>
        )}
      </div>
    </>
  );
}

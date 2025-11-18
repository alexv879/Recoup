/**
 * ONBOARDING CHECKLIST
 * Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.5
 *           dashboard-saas-onboarding.md (RESEARCH_SUMMARIES_MAPPING.md #5)
 *
 * Fixed top-right checklist: "3 Steps to Your First Invoice"
 * Steps: Add Business → Invite Client → Create Invoice
 * Expected lift: +25-30% activation rate
 *
 * Features:
 * - Time estimates per step (2 min, 3 min, 5 min)
 * - Collapsible design with progress bar
 * - Celebration modal with confetti
 * - Proper event tracking: onboarding_task_completed_{taskId}
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Sparkles, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Confetti } from './Confetti';
import { trackEvent } from '@/lib/analytics';
import { logInfo } from '@/utils/logger';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  estimatedTime: string;
  actionUrl: string;
}

interface OnboardingChecklistProps {
  className?: string;
  onDismiss?: () => void;
}

export function OnboardingChecklist({ className = '', onDismiss }: OnboardingChecklistProps) {
  const { user } = useUser();
  const [steps, setSteps] = useState<ChecklistStep[]>([
    {
      id: 'business',
      title: 'Add your business',
      description: 'Set up company name, logo, and address',
      completed: false,
      estimatedTime: '2 min',
      actionUrl: '/dashboard/settings',
    },
    {
      id: 'client',
      title: 'Invite your first client',
      description: 'Add a client so you can send them invoices',
      completed: false,
      estimatedTime: '3 min',
      actionUrl: '/dashboard/clients/new',
    },
    {
      id: 'invoice',
      title: 'Create your first invoice',
      description: 'Send your first invoice and get paid faster',
      completed: false,
      estimatedTime: '5 min',
      actionUrl: '/dashboard/invoices/new',
    },
  ]);

  const [showConfetti, setShowConfetti] = useState(false);
  const [completedStep, setCompletedStep] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [onboardingStartTime, setOnboardingStartTime] = useState<number | null>(null);

  // Initialize onboarding start time
  useEffect(() => {
    if (!user) return;

    const startTime = localStorage.getItem(`onboarding_${user.id}_start`);
    if (!startTime) {
      const now = Date.now();
      localStorage.setItem(`onboarding_${user.id}_start`, now.toString());
      setOnboardingStartTime(now);
    } else {
      setOnboardingStartTime(parseInt(startTime));
    }
  }, [user]);

  // Load activation events from user metadata
  useEffect(() => {
    if (!user) return;

    const metadata = user.publicMetadata as any;
    const activationEvents = metadata?.activationEvents || {};

    setSteps((prev) =>
      prev.map((step) => {
        let completed = false;

        if (step.id === 'business') {
          completed = !!activationEvents.businessSetupAt;
        } else if (step.id === 'client') {
          completed = !!activationEvents.firstClientAt;
        } else if (step.id === 'invoice') {
          completed = !!activationEvents.firstInvoiceAt;
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

    // Track completion event with research-specified naming
    trackEvent('activation_step_completed', {
      user_id: user?.id,
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

  // Handle step completion (called from external components)
  const completeStep = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId && !step.completed) {
          celebrateStep(stepId);
          return { ...step, completed: true };
        }
        return step;
      })
    );
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
      // Track onboarding complete event
      const timeToCompletion = onboardingStartTime
        ? Math.floor((Date.now() - onboardingStartTime) / 1000)
        : null;

      trackEvent('activation_step_completed', {
        user_id: user?.id,
        step_key: 'onboarding_complete',
      });

      // Show success message for 3 seconds then auto-dismiss
      const timeout = setTimeout(() => {
        handleDismiss();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [allStepsCompleted, isDismissed, user?.id, onboardingStartTime]);

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

      {/* Fixed top-right checklist */}
      <div
        className="fixed top-4 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        role="region"
        aria-label="Onboarding checklist"
      >
        {/* Header with collapse toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900">
              {allStepsCompleted ? 'Congratulations! 🎉' : 'Get started in 3 steps'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Collapse/Expand button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={isCollapsed ? "Expand checklist" : "Collapse checklist"}
            >
              {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss checklist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>{completedCount} of {steps.length} completed</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
          <div className="p-4 bg-green-50 border-b border-gray-100">
            <p className="text-sm text-green-800 font-medium">
              You've completed your onboarding! You're all set to start creating and sending invoices.
            </p>
          </div>
        )}

        {/* Steps (collapsible) */}
        {!isCollapsed && (
          <ul className="p-4 space-y-4" role="list">
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
                    className={`text-sm font-medium ${step.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{step.estimatedTime}</span>
                    {!step.completed && (
                      <a
                        href={step.actionUrl}
                        className="inline-block px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        Start →
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

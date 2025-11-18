'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface FeatureTourProps {
  steps: TourStep[];
  tourId: string;
  autoStart?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function FeatureTour({
  steps,
  tourId,
  autoStart = false,
  onComplete,
  onSkip,
}: FeatureTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if tour has been completed before
    const tourCompleted = localStorage.getItem(`tour_${tourId}_completed`);
    if (!tourCompleted && autoStart) {
      setIsActive(true);
    }
  }, [tourId, autoStart]);

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      positionTooltip();
      window.addEventListener('resize', positionTooltip);
      window.addEventListener('scroll', positionTooltip);

      return () => {
        window.removeEventListener('resize', positionTooltip);
        window.removeEventListener('scroll', positionTooltip);
      };
    }
  }, [isActive, currentStep, steps]);

  const positionTooltip = () => {
    const step = steps[currentStep];
    if (!step) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement || !tooltipRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const placement = step.placement || 'bottom';
    const offset = 16;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - offset;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + offset;
        break;
    }

    // Keep tooltip within viewport
    const padding = 16;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    setTooltipPosition({ top, left });
    setHighlightPosition({
      top: targetRect.top - 4,
      left: targetRect.left - 4,
      width: targetRect.width + 8,
      height: targetRect.height + 8,
    });

    // Scroll element into view if needed
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tour_${tourId}_completed`, 'true');
    setIsActive(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(`tour_${tourId}_completed`, 'true');
    setIsActive(false);
    onSkip?.();
  };

  const handleActionClick = () => {
    const step = steps[currentStep];
    if (step.action) {
      step.action.onClick();
      // Wait a bit for the action to complete, then move to next step
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  };

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[9998] transition-opacity"
        onClick={handleSkip}
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Highlight */}
      <div
        className="fixed z-[9999] rounded-lg pointer-events-none transition-all duration-300"
        style={{
          top: `${highlightPosition.top}px`,
          left: `${highlightPosition.left}px`,
          width: `${highlightPosition.width}px`,
          height: `${highlightPosition.height}px`,
          boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)',
          border: '2px solid rgb(99, 102, 241)',
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] bg-white rounded-xl shadow-2xl max-w-sm w-full transition-all duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
              aria-label="Skip tour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-600 mb-6 leading-relaxed">{step.content}</p>

          {/* Action Button (if provided) */}
          {step.action && (
            <button
              onClick={handleActionClick}
              className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              {step.action.label}
            </button>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${currentStep === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              Back
            </button>

            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-all
                    ${index === currentStep
                      ? 'bg-indigo-600 w-6'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                    }
                  `}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>

        {/* Arrow pointer */}
        <div
          className="absolute w-3 h-3 bg-white transform rotate-45"
          style={{
            ...(step.placement === 'bottom' && { top: '-6px', left: '50%', marginLeft: '-6px' }),
            ...(step.placement === 'top' && { bottom: '-6px', left: '50%', marginLeft: '-6px' }),
            ...(step.placement === 'right' && { left: '-6px', top: '50%', marginTop: '-6px' }),
            ...(step.placement === 'left' && { right: '-6px', top: '50%', marginTop: '-6px' }),
          }}
        />
      </div>
    </>,
    document.body
  );
}

// Hook to manage tour state
export function useTour(tourId: string) {
  const [isTourActive, setIsTourActive] = useState(false);

  const startTour = () => {
    setIsTourActive(true);
  };

  const resetTour = () => {
    localStorage.removeItem(`tour_${tourId}_completed`);
    setIsTourActive(true);
  };

  const isTourCompleted = () => {
    return localStorage.getItem(`tour_${tourId}_completed`) === 'true';
  };

  return {
    isTourActive,
    startTour,
    resetTour,
    isTourCompleted,
    setIsTourActive,
  };
}

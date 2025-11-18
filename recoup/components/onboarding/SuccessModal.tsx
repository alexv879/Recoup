/**
 * SUCCESS MODAL
 * Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.5
 *
 * Modal shown after completing activation steps
 * - Celebration message
 * - Next step guidance
 * - Confetti integration
 */

'use client';

import React, { useEffect } from 'react';
import { AccessibleDialog } from '@/lib/accessibility';
import { CheckCircle2, X, ArrowRight } from 'lucide-react';
import { Confetti } from './Confetti';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  nextStepTitle?: string;
  nextStepHref?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  nextStepTitle,
  nextStepHref,
}: SuccessModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Confetti */}
      <Confetti trigger={isOpen} />

      <AccessibleDialog
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        description={message}
      >
        <div className="p-6 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <h2
            id="success-modal-title"
            className="text-2xl font-bold text-gray-900 text-center mb-2"
          >
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">{message}</p>

          {/* Next step CTA */}
          {nextStepTitle && nextStepHref && (
            <a
              href={nextStepHref}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              onClick={onClose}
            >
              {nextStepTitle}
              <ArrowRight className="w-5 h-5" />
            </a>
          )}

          {/* Close button (secondary) */}
          {!nextStepTitle && (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </AccessibleDialog>
    </>
  );
}

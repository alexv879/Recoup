'use client';

import React, { useState } from 'react';
import { AccessibleDialog } from '@/lib/accessibility';
import { Button } from '@/components/Custom/Button';
import { ConfettiAnimation } from './ConfettiAnimation';

interface CelebrationModalProps {
    title: string;
    message: string;
    primaryAction: {
        label: string;
        href: string;
    };
    secondaryAction?: {
        label: string;
        href: string;
    };
    onClose?: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
    title,
    message,
    primaryAction,
    secondaryAction,
    onClose
}) => {
    const [showConfetti, setShowConfetti] = useState(true);

    return (
        <>
            {/* Confetti Animation */}
            {showConfetti && (
                <ConfettiAnimation
                    duration={3000}
                    onComplete={() => setShowConfetti(false)}
                />
            )}

            <AccessibleDialog
                isOpen={true}
                onClose={onClose || (() => { })}
                title={title}
                description={message}
            >
                <div className="p-6 text-center animate-slide-up">
                    {/* Icon */}
                    <div className="text-6xl mb-4">🎉</div>

                    {/* Title */}
                    <h2
                        id="celebration-title"
                        className="text-3xl font-bold text-gray-900 mb-3"
                    >
                        {title}
                    </h2>

                    {/* Message */}
                    <p
                        id="celebration-message"
                        className="text-gray-600 mb-6"
                    >
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <a href={primaryAction.href} className="block">
                            <Button className="w-full" size="lg">
                                {primaryAction.label}
                            </Button>
                        </a>

                        {secondaryAction && (
                            <a href={secondaryAction.href} className="block">
                                <Button variant="outline" className="w-full" size="lg">
                                    {secondaryAction.label}
                                </Button>
                            </a>
                        )}

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-sm text-gray-500 hover:text-gray-700 transition-colors mt-2"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </AccessibleDialog>

            <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 500ms ease-out;
        }
      `}</style>
        </>
    );
};

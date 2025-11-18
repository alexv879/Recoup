import React, { useEffect, useRef } from 'react';

interface AccessibleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    ariaLabelledBy: string;
    ariaDescribedBy?: string;
    children: React.ReactNode;
    className?: string;
}

export default function AccessibleDialog({
    isOpen,
    onClose,
    ariaLabelledBy,
    ariaDescribedBy,
    children,
    className = '',
}: AccessibleDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        // Focus first element in dialog
        setTimeout(() => {
            const focusable = dialogRef.current?.querySelector<HTMLElement>(
                'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            focusable?.focus();
        }, 100);
        // Trap focus
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key === 'Tab') {
                const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
                    'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusableElements || focusableElements.length === 0) return;
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div ref={dialogRef} className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

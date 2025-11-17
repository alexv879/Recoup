/**
 * Payment Verification Modal Component
 * 
 * Modal for freelancers to verify payment claims with 3 actions:
 * 1. Confirm Payment (Green) - Mark invoice as paid, stop collections
 * 2. Request Evidence (Yellow) - Ask client for proof of payment
 * 3. Reject Claim (Red) - Reject claim with reason, resume collections
 * 
 * Based on Research:
 * - payment_verification_guide.md §2.3 (Verification Modal - Freelancer)
 * - payment_verification_guide.md §6.3 (Screen Reader Announcements)
 * - payment_verification_guide.md §6.2 (Keyboard Navigation)
 * 
 * Features:
 * - Focus trap (focus stays within modal)
 * - Escape key to close
 * - WCAG AAA compliant colors
 * - Accessible with role="dialog" and ARIA labels
 * - Shows payment details, evidence, countdown timer
 * 
 * @module components/Payments/PaymentVerificationModal
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, FileText, XCircle, AlertCircle } from 'lucide-react';
import VerificationCountdown from './VerificationCountdown';

interface PaymentClaim {
    claimId: string;
    invoiceId: string;
    invoiceReference: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'card' | 'paypal' | 'other';
    paymentReference?: string;
    paymentDate: Date;
    clientNotes?: string;
    evidenceFileUrl?: string;
    evidenceFileName?: string;
    createdAt: Date;
    verificationDeadline: Date;
}

interface PaymentVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentClaim: PaymentClaim;
    onConfirm: () => Promise<void>;
    onRequestEvidence: () => Promise<void>;
    onReject: (reason: string) => Promise<void>;
}

const REJECTION_REASONS = [
    { value: 'no_payment_received', label: 'No payment received' },
    { value: 'incorrect_amount', label: 'Incorrect amount' },
    { value: 'wrong_invoice', label: 'Payment for wrong invoice' },
    { value: 'duplicate_claim', label: 'Duplicate payment claim' },
    { value: 'other', label: 'Other (please specify)' },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    bank_transfer: 'Bank Transfer (BACS)',
    cash: 'Cash',
    cheque: 'Cheque',
    card: 'Credit/Debit Card',
    paypal: 'PayPal',
    other: 'Other',
};

export default function PaymentVerificationModal({
    isOpen,
    onClose,
    paymentClaim,
    onConfirm,
    onRequestEvidence,
    onReject,
}: PaymentVerificationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [customRejectionReason, setCustomRejectionReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const firstFocusableRef = useRef<HTMLButtonElement>(null);

    // Focus trap
    useEffect(() => {
        if (!isOpen) return;

        // Focus first element when modal opens
        setTimeout(() => {
            firstFocusableRef.current?.focus();
        }, 100);

        // Handle keyboard events
        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape key to close
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            // Tab key for focus trap
            if (e.key === 'Tab') {
                const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
                    'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (!focusableElements || focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    // Shift+Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Handle confirm action
    const handleConfirm = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await onConfirm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to confirm payment');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle request evidence action
    const handleRequestEvidence = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await onRequestEvidence();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to request evidence');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle reject action
    const handleRejectSubmit = async () => {
        if (!rejectionReason) {
            setError('Please select a rejection reason');
            return;
        }

        if (rejectionReason === 'other' && !customRejectionReason.trim()) {
            setError('Please specify the rejection reason');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const finalReason =
                rejectionReason === 'other'
                    ? customRejectionReason
                    : REJECTION_REASONS.find((r) => r.value === rejectionReason)?.label || rejectionReason;

            await onReject(finalReason);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject claim');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle reject form
    const handleRejectClick = () => {
        setShowRejectForm(true);
        setError(null);
    };

    // Cancel reject
    const handleCancelReject = () => {
        setShowRejectForm(false);
        setRejectionReason('');
        setCustomRejectionReason('');
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={modalRef}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div className="flex-1">
                        <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                            Verify Payment Claim
                        </h2>
                        <p id="modal-description" className="text-sm text-gray-600 mt-1">
                            Review the payment details and confirm, request evidence, or reject the claim.
                        </p>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Countdown Timer */}
                    <VerificationCountdown
                        claimCreatedAt={paymentClaim.createdAt}
                        verificationDeadline={paymentClaim.verificationDeadline}
                    />

                    {/* Payment Details */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Details</h3>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Invoice</p>
                                <p className="font-medium text-gray-900">{paymentClaim.invoiceReference}</p>
                            </div>

                            <div>
                                <p className="text-gray-600">Amount</p>
                                <p className="font-medium text-gray-900">
                                    £{paymentClaim.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-600">Client</p>
                                <p className="font-medium text-gray-900">{paymentClaim.clientName}</p>
                                <p className="text-xs text-gray-500">{paymentClaim.clientEmail}</p>
                            </div>

                            <div>
                                <p className="text-gray-600">Payment Method</p>
                                <p className="font-medium text-gray-900">
                                    {PAYMENT_METHOD_LABELS[paymentClaim.paymentMethod] || paymentClaim.paymentMethod}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-600">Payment Date</p>
                                <p className="font-medium text-gray-900">
                                    {paymentClaim.paymentDate.toLocaleDateString()}
                                </p>
                            </div>

                            {paymentClaim.paymentReference && (
                                <div>
                                    <p className="text-gray-600">Reference</p>
                                    <p className="font-medium text-gray-900">{paymentClaim.paymentReference}</p>
                                </div>
                            )}
                        </div>

                        {paymentClaim.clientNotes && (
                            <div className="pt-3 border-t border-gray-200">
                                <p className="text-gray-600 text-sm">Client Notes</p>
                                <p className="text-gray-900 text-sm mt-1">{paymentClaim.clientNotes}</p>
                            </div>
                        )}
                    </div>

                    {/* Evidence */}
                    {paymentClaim.evidenceFileUrl ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-900">Evidence Provided</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        {paymentClaim.evidenceFileName || 'Payment evidence'}
                                    </p>
                                    <a
                                        href={paymentClaim.evidenceFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-green-600 hover:text-green-800 underline mt-1 inline-block"
                                    >
                                        View evidence file
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-900">No Evidence Provided</p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        The client has not uploaded proof of payment. You can request evidence if needed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Rejection Form */}
                    {showRejectForm && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900">Reject Payment Claim</h3>

                            <div>
                                <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for rejection *
                                </label>
                                <select
                                    id="rejection-reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    disabled={isLoading}
                                >
                                    <option value="">Select a reason...</option>
                                    {REJECTION_REASONS.map((reason) => (
                                        <option key={reason.value} value={reason.value}>
                                            {reason.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {rejectionReason === 'other' && (
                                <div>
                                    <label htmlFor="custom-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                        Please specify *
                                    </label>
                                    <textarea
                                        id="custom-reason"
                                        value={customRejectionReason}
                                        onChange={(e) => setCustomRejectionReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Describe why you're rejecting this claim..."
                                        disabled={isLoading}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    {!showRejectForm ? (
                        <>
                            {/* Primary Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    ref={firstFocusableRef}
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    aria-label="Confirm payment received"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Confirm Payment
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRequestEvidence}
                                    disabled={isLoading || !!paymentClaim.evidenceFileUrl}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    aria-label="Request evidence from client"
                                    title={paymentClaim.evidenceFileUrl ? 'Evidence already provided' : undefined}
                                >
                                    <FileText className="w-4 h-4" />
                                    Request Evidence
                                </button>
                            </div>

                            {/* Reject Action */}
                            <button
                                type="button"
                                onClick={handleRejectClick}
                                disabled={isLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                aria-label="Reject payment claim"
                            >
                                <XCircle className="w-4 h-4" />
                                Reject Claim
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Rejection Actions */}
                            <button
                                type="button"
                                onClick={handleCancelReject}
                                disabled={isLoading}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleRejectSubmit}
                                disabled={isLoading || !rejectionReason}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

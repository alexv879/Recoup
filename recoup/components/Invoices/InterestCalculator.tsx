/**
 * Late Payment Interest Calculator Component
 * 
 * REGULATORY STATUS: Pure calculator (NOT fintech)
 * - Display-only calculation
 * - No automatic addition to invoices
 * - No money flows through platform
 * - Freelancer manually decides whether to claim
 * 
 * @see MASTER_IMPLEMENTATION_AUDIT_V1.md §4.3
 * @see late-payment-law-guide.md
 */

'use client';

import { useState } from 'react';
import {
    calculateLateCharges,
    formatPounds,
    formatPercentage,
    getFixedFeeTierDescription,
    LEGAL_DISCLAIMER
} from '@/lib/latePaymentInterest';
import { trackEvent } from '@/lib/analytics';

interface InterestCalculatorProps {
    /** Invoice amount in pence */
    invoiceAmountPence: number;
    /** Days past due date */
    daysOverdue: number;
    /** Invoice ID for analytics */
    invoiceId: string;
    /** Callback when freelancer manually adds interest to invoice */
    onAddInterestManually?: (breakdown: ReturnType<typeof calculateLateCharges>) => void;
    /** Optional: Hide "Add to Invoice" button */
    hideAddButton?: boolean;
}

export function InterestCalculator({
    invoiceAmountPence,
    daysOverdue,
    invoiceId,
    onAddInterestManually,
    hideAddButton = false,
}: InterestCalculatorProps) {
    const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);

    // Calculate interest breakdown
    const breakdown = calculateLateCharges(invoiceAmountPence, daysOverdue);

    // Don't show calculator if not overdue
    if (daysOverdue <= 0) {
        return null;
    }

    // Track when calculator is viewed
    const handleView = () => {
        trackEvent('late_payment_interest_calculated', {
            invoice_id: invoiceId,
            days_overdue: daysOverdue,
            principal_amount: invoiceAmountPence / 100,
            total_interest: breakdown.totalInterest / 100,
            fixed_fee: breakdown.fixedCompensationFee / 100,
            total_claimable: breakdown.totalClaimable / 100,
        });
    };

    // Track when freelancer clicks to add interest
    const handleAddInterest = () => {
        trackEvent('interest_manually_added_initiated', {
            invoice_id: invoiceId,
            amount_added: breakdown.totalClaimable / 100,
        });
        onAddInterestManually?.(breakdown);
    };

    // Auto-track view on mount (only once)
    useState(() => {
        if (daysOverdue > 0) {
            handleView();
        }
    });

    return (
        <div className="border-l-4 border-blue-500 bg-blue-50 p-6 rounded-r-lg">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <h3 className="text-lg font-semibold text-blue-900">
                        💡 You Can Claim Late Payment Interest
                    </h3>
                </div>

                {/* Info tooltip */}
                <button
                    onClick={() => setShowFullDisclaimer(!showFullDisclaimer)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    aria-label="Show legal disclaimer"
                >
                    {showFullDisclaimer ? 'Hide info' : 'What is this?'}
                </button>
            </div>

            {/* Educational text */}
            <p className="text-sm text-gray-700 mb-4">
                Under UK law (<strong>Late Payment of Commercial Debts (Interest) Act 1998</strong>),
                you have the <strong>right</strong> to charge late payment interest and compensation.
                Here's what you could claim:
            </p>

            {/* Breakdown */}
            <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
                <div className="space-y-3">
                    {/* Principal amount */}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Original invoice amount:</span>
                        <span className="font-medium">£{formatPounds(breakdown.principalAmount)}</span>
                    </div>

                    {/* Days overdue */}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Days overdue:</span>
                        <span className="font-medium text-orange-600">{breakdown.daysOverdue} days</span>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Interest calculation */}
                    <div className="flex justify-between text-sm">
                        <div>
                            <span className="text-gray-700 font-medium">Statutory interest:</span>
                            <div className="text-xs text-gray-500 mt-1">
                                {formatPercentage(breakdown.annualRate)} annual rate
                                <br />
                                (BoE {formatPercentage(breakdown.baseRate)} + 8% statutory)
                            </div>
                        </div>
                        <span className="font-semibold text-blue-700">
                            £{formatPounds(breakdown.totalInterest)}
                        </span>
                    </div>

                    {/* Fixed compensation */}
                    <div className="flex justify-between text-sm">
                        <div>
                            <span className="text-gray-700 font-medium">Fixed compensation fee:</span>
                            <div className="text-xs text-gray-500 mt-1">
                                {getFixedFeeTierDescription(breakdown.principalAmount)}
                            </div>
                        </div>
                        <span className="font-semibold text-blue-700">
                            £{formatPounds(breakdown.fixedCompensationFee)}
                        </span>
                    </div>

                    <hr className="border-gray-300" />

                    {/* Total claimable */}
                    <div className="flex justify-between">
                        <span className="text-gray-900 font-bold text-base">
                            Total you may claim:
                        </span>
                        <span className="font-bold text-blue-900 text-xl">
                            £{formatPounds(breakdown.totalClaimable)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action button (manual) */}
            {!hideAddButton && onAddInterestManually && (
                <button
                    onClick={handleAddInterest}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-3"
                >
                    Add Interest to Invoice (Manual)
                </button>
            )}

            {/* Important notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                    <svg
                        className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <div className="text-xs text-amber-800">
                        <strong>You decide:</strong> This calculation is for your information only.
                        Relay does NOT automatically add interest or collect it.
                        You are responsible for deciding whether to claim this amount and must add it manually to your invoice.
                    </div>
                </div>
            </div>

            {/* Full disclaimer (expandable) */}
            {showFullDisclaimer && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 leading-relaxed">
                    {LEGAL_DISCLAIMER}
                    <div className="mt-2 text-blue-600">
                        <a
                            href="https://www.gov.uk/late-commercial-payments-interest-debt-recovery"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800"
                        >
                            Learn more about Late Payment Act 1998 →
                        </a>
                    </div>
                </div>
            )}

            {/* Accessibility: Screen reader summary */}
            <div className="sr-only" role="status" aria-live="polite">
                Late payment interest calculator. Invoice £{formatPounds(breakdown.principalAmount)},
                {breakdown.daysOverdue} days overdue. You may claim £{formatPounds(breakdown.totalClaimable)}
                under UK Late Payment Act. Manual action required to add to invoice.
            </div>
        </div>
    );
}

/**
 * Compact version for dashboard/invoice list views
 */
export function InterestCalculatorCompact({
    invoiceAmountPence,
    daysOverdue,
    invoiceId,
}: Omit<InterestCalculatorProps, 'onAddInterestManually' | 'hideAddButton'>) {
    if (daysOverdue <= 0) return null;

    const breakdown = calculateLateCharges(invoiceAmountPence, daysOverdue);

    return (
        <div className="inline-flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 rounded px-3 py-1.5">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                />
            </svg>
            <span className="text-blue-900 font-medium">
                Can claim £{formatPounds(breakdown.totalClaimable)} interest
            </span>
        </div>
    );
}

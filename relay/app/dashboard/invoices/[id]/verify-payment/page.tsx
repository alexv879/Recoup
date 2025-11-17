'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface PaymentClaim {
    claimId: string;
    invoiceId: string;
    clientName: string;
    amount: number;
    paymentMethod: string;
    paymentReference?: string;
    paymentDate: any;
    clientNotes?: string;
    status: string;
    createdAt: any;
}

interface Invoice {
    invoiceId: string;
    reference: string;
    clientName: string;
    amount: number;
    currency: string;
    description?: string;
}

export default function VerifyPaymentClaimPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [claim, setClaim] = useState<PaymentClaim | null>(null);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Verification form state
    const [actualAmount, setActualAmount] = useState('');
    const [verificationNotes, setVerificationNotes] = useState('');

    // Fetch payment claim and invoice
    useEffect(() => {
        async function fetchData() {
            try {
                const invoiceRes = await fetch(`/api/invoices/${invoiceId}`);
                const invoiceData = await invoiceRes.json();

                if (!invoiceRes.ok) {
                    throw new Error(invoiceData.error || 'Failed to load invoice');
                }

                setInvoice(invoiceData);

                if (!invoiceData.paymentClaimId) {
                    throw new Error('No payment claim found for this invoice');
                }

                // Fetch payment claim
                const claimRes = await fetch(`/api/payment-claims/${invoiceData.paymentClaimId}`);
                const claimData = await claimRes.json();

                if (!claimRes.ok) {
                    throw new Error(claimData.error || 'Failed to load payment claim');
                }

                setClaim(claimData);
                setActualAmount(claimData.amount.toString());
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        }

        if (invoiceId) {
            fetchData();
        }
    }, [invoiceId]);

    // Handle verification (approve)
    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/invoices/${invoiceId}/verify-payment-claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    verified: true,
                    actualAmount: parseFloat(actualAmount),
                    verificationNotes: verificationNotes || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to verify payment');
            }

            // Redirect to dashboard
            router.push('/dashboard/invoices?verified=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify payment');
            setSubmitting(false);
        }
    }

    // Handle rejection
    async function handleReject() {
        if (!confirm('Are you sure you want to reject this payment claim? The client will be notified.')) {
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const rejectionReason = prompt('Why are you rejecting this claim? (This will be sent to the client)');

            if (!rejectionReason) {
                setSubmitting(false);
                return;
            }

            const res = await fetch(`/api/invoices/${invoiceId}/verify-payment-claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    verified: false,
                    verificationNotes: rejectionReason,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to reject payment claim');
            }

            // Redirect to dashboard
            router.push('/dashboard/invoices?rejected=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject payment claim');
            setSubmitting(false);
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading payment claim...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !claim) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                    <div className="text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h2 className="mt-4 text-xl font-semibold text-gray-900">Error</h2>
                        <p className="mt-2 text-gray-600">{error}</p>
                        <button
                            onClick={() => router.push('/dashboard/invoices')}
                            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main verification page
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Verify Payment Claim</h1>
                    <p className="mt-2 text-gray-600">
                        Check your bank account and confirm if you received this payment
                    </p>
                </div>

                {/* Payment Claim Details Card */}
                <div className="bg-white shadow-lg rounded-lg p-8 mb-6">
                    <div className="border-b pb-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Payment Claim Details</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Invoice #{invoice?.reference}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Client:</span>
                            <span className="font-medium">{claim?.clientName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Amount Claimed:</span>
                            <span className="font-medium text-lg">
                                {invoice?.currency === 'GBP' ? '£' : ''}{claim?.amount.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="font-medium">
                                {claim?.paymentMethod === 'bank_transfer' && 'Bank Transfer (BACS)'}
                                {claim?.paymentMethod === 'cash' && 'Cash'}
                                {claim?.paymentMethod === 'cheque' && 'Cheque'}
                            </span>
                        </div>
                        {claim?.paymentReference && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Reference:</span>
                                <span className="font-medium">{claim.paymentReference}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date Paid (claimed):</span>
                            <span className="font-medium">
                                {claim?.paymentDate && format(new Date(claim.paymentDate.seconds * 1000), 'PPP')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Claim Submitted:</span>
                            <span className="font-medium">
                                {claim?.createdAt && format(new Date(claim.createdAt.seconds * 1000), 'PPP')}
                            </span>
                        </div>
                        {claim?.clientNotes && (
                            <div className="border-t pt-4">
                                <span className="text-gray-600 block mb-2">Client Notes:</span>
                                <p className="text-gray-900 bg-gray-50 p-3 rounded">{claim.clientNotes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Verification Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex">
                        <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-lg font-medium text-blue-900 mb-2">Check Your Bank Account</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>✓ Log into your bank account</li>
                                <li>✓ Check recent transactions around the claimed payment date</li>
                                <li>✓ Look for the amount: £{claim?.amount.toFixed(2)}</li>
                                {claim?.paymentReference && <li>✓ Match the reference: {claim.paymentReference}</li>}
                                <li>✓ Confirm the amount received matches (or adjust below)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Verification Form */}
                <div className="bg-white shadow-lg rounded-lg p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label htmlFor="actualAmount" className="block text-sm font-medium text-gray-700">
                                Amount Actually Received (£)
                            </label>
                            <input
                                type="number"
                                id="actualAmount"
                                step="0.01"
                                min="0"
                                required
                                value={actualAmount}
                                onChange={(e) => setActualAmount(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Adjust this if the amount received differs from the claimed amount
                            </p>
                        </div>

                        <div>
                            <label htmlFor="verificationNotes" className="block text-sm font-medium text-gray-700">
                                Verification Notes (Optional)
                            </label>
                            <textarea
                                id="verificationNotes"
                                rows={3}
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                                placeholder="Any notes about this payment..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={submitting}
                                className="flex-1 flex justify-center items-center py-3 px-4 border-2 border-red-600 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject Claim
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {submitting ? 'Verifying...' : 'Verify Payment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

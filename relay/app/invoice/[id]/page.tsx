'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

interface Invoice {
    invoiceId: string;
    reference: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    currency: string;
    description?: string;
    invoiceDate: any;
    dueDate: any;
    status: string;
    freelancerName?: string;
    freelancerEmail?: string;
}

export default function InvoicePaymentPage() {
    const params = useParams();
    const invoiceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showBacsForm, setShowBacsForm] = useState(false);

    // BACS form state
    const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'cheque'>('bank_transfer');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [clientNotes, setClientNotes] = useState('');

    // Fetch invoice details
    useEffect(() => {
        async function fetchInvoice() {
            try {
                const res = await fetch(`/api/invoices/${invoiceId}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to load invoice');
                }

                setInvoice(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load invoice');
            } finally {
                setLoading(false);
            }
        }

        if (invoiceId) {
            fetchInvoice();
        }
    }, [invoiceId]);

    // Handle BACS payment claim submission
    async function handleBacsSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/invoices/${invoiceId}/claim-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethod,
                    paymentReference: paymentReference || undefined,
                    paymentDate: new Date(paymentDate),
                    clientNotes: clientNotes || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit payment claim');
            }

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit payment claim');
        } finally {
            setSubmitting(false);
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading invoice...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !invoice) {
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
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                    <div className="text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Claim Submitted!</h2>
                        <p className="mt-2 text-gray-600">
                            Thank you! {invoice?.freelancerName || 'The freelancer'} has been notified and will verify receipt of your payment.
                        </p>
                        <p className="mt-4 text-sm text-gray-500">
                            You will receive a confirmation email once the payment is verified.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Already paid
    if (invoice?.status === 'paid') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                    <div className="text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h2 className="mt-4 text-xl font-semibold text-gray-900">Already Paid</h2>
                        <p className="mt-2 text-gray-600">
                            This invoice has already been marked as paid. Thank you!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Main payment page
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full">
                {/* Invoice Summary Card */}
                <div className="bg-white shadow-lg rounded-lg p-8 mb-6">
                    <div className="border-b pb-6 mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice?.reference}</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            From: {invoice?.freelancerName || invoice?.freelancerEmail}
                        </p>
                        <p className="text-sm text-gray-600">To: {invoice?.clientName}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Invoice Date:</span>
                            <span className="font-medium">
                                {invoice?.invoiceDate && format(new Date(invoice.invoiceDate.seconds * 1000), 'PPP')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Due Date:</span>
                            <span className="font-medium">
                                {invoice?.dueDate && format(new Date(invoice.dueDate.seconds * 1000), 'PPP')}
                            </span>
                        </div>
                        {invoice?.description && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Description:</span>
                                <span className="font-medium">{invoice.description}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-4 mt-4">
                            <span>Amount Due:</span>
                            <span className="text-blue-600">
                                {invoice?.currency === 'GBP' ? '£' : ''}{invoice?.amount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Options Card */}
                <div className="bg-white shadow-lg rounded-lg p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Options</h2>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Stripe Payment Button (to be implemented) */}
                    <button
                        disabled
                        className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
                        </svg>
                        Pay with Card (Coming Soon)
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">OR</span>
                        </div>
                    </div>

                    {/* BACS Payment Button */}
                    {!showBacsForm ? (
                        <button
                            onClick={() => setShowBacsForm(true)}
                            className="w-full flex justify-center items-center py-4 px-4 border-2 border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            I Paid via Bank Transfer
                        </button>
                    ) : (
                        <form onSubmit={handleBacsSubmit} className="space-y-6 border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                            <h3 className="text-lg font-medium text-gray-900">Confirm Your Payment</h3>

                            <div>
                                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                                    Payment Method
                                </label>
                                <select
                                    id="paymentMethod"
                                    required
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as 'bank_transfer' | 'cash' | 'cheque')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="bank_transfer">Bank Transfer (BACS)</option>
                                    <option value="cash">Cash</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700">
                                    Payment Reference (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="paymentReference"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="e.g., Transaction ID, reference number"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    This helps the freelancer identify your payment
                                </p>
                            </div>

                            <div>
                                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">
                                    Date Paid
                                </label>
                                <input
                                    type="date"
                                    id="paymentDate"
                                    required
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    max={format(new Date(), 'yyyy-MM-dd')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="clientNotes" className="block text-sm font-medium text-gray-700">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    id="clientNotes"
                                    rows={3}
                                    value={clientNotes}
                                    onChange={(e) => setClientNotes(e.target.value)}
                                    placeholder="Any additional information about your payment..."
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBacsForm(false)}
                                    className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Payment Claim'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

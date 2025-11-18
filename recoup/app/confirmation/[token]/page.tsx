'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AccessibleFormField } from '@/lib/accessibility';

interface PaymentConfirmation {
  confirmationId: string;
  expectedAmount: number;
  status: string;
  clientEmail: string;
  invoiceId: string;
  expiresAt: string;
}

export default function ClientConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<PaymentConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'card'>('bank_transfer');
  const [datePaid, setDatePaid] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clientNotes, setClientNotes] = useState('');

  // Fetch confirmation details
  useEffect(() => {
    async function fetchConfirmation() {
      try {
        const res = await fetch(`/api/payment-confirmation?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load confirmation');
        }

        setConfirmation(data.confirmation);
        setAmount(data.confirmation.expectedAmount.toString());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load confirmation');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchConfirmation();
    }
  }, [token]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/payment-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationToken: token,
          amount: parseFloat(amount),
          paymentMethod,
          datePaid,
          clientNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to confirm payment');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm payment');
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
          <p className="mt-4 text-gray-600">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !confirmation) {
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
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Confirmed!</h2>
            <p className="mt-2 text-gray-600">
              Thank you for confirming your payment. The freelancer has been notified and will
              verify receipt.
            </p>
            <p className="mt-4 text-sm text-gray-500">You may close this page.</p>
          </div>
        </div>
      </div>
    );
  }

  // Already confirmed
  if (confirmation?.status !== 'pending_client') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-blue-500"
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
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Already Confirmed</h2>
            <p className="mt-2 text-gray-600">
              This payment has already been confirmed. No further action is needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Confirm Payment</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please confirm that you have sent the payment for this invoice.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AccessibleFormField
            id="amount"
            label="Amount Paid (£)"
            type="number"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            helpText={`Expected: £${confirmation?.expectedAmount.toFixed(2)}`}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />

          <AccessibleFormField
            id="paymentMethod"
            label="Payment Method"
            type="select"
            required
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as 'bank_transfer' | 'card')}
            options={[
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'card', label: 'Card Payment' }
            ]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />

          <AccessibleFormField
            id="datePaid"
            label="Date Paid"
            type="date"
            required
            value={datePaid}
            onChange={(e) => setDatePaid(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />

          <AccessibleFormField
            id="clientNotes"
            label="Notes"
            type="textarea"
            rows={3}
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="Any additional notes about the payment..."
            helpText="Optional"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Confirming...' : 'Confirm Payment'}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-gray-500">
          This confirmation link expires on{' '}
          {confirmation && format(new Date(confirmation.expiresAt), 'PPP')}
        </p>
      </div>
    </div>
  );
}

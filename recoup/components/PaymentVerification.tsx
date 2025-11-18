/**
 * PAYMENT VERIFICATION SYSTEM
 *
 * Allows clients to claim payment and upload proof
 * Freelancers can verify, request evidence, or reject
 *
 * Research Impact:
 * - Reduces false collection attempts
 * - 48-hour verification window
 * - Collections pause during verification
 * - Improves client trust
 *
 * Flow:
 * 1. Client clicks "I've Paid This"
 * 2. Selects payment method (BACS, Check, Cash, etc.)
 * 3. Uploads proof of payment (optional)
 * 4. Freelancer verifies within 48 hours
 * 5. Collections resume if rejected
 *
 * Usage:
 * ```tsx
 * // Client side (invoice view)
 * <PaymentClaimButton
 *   invoiceId="inv_123"
 *   amount={1000}
 *   onClaimSubmitted={() => console.log('Claim submitted')}
 * />
 *
 * // Freelancer side (verification modal)
 * <PaymentVerificationModal
 *   claim={claim}
 *   onConfirm={() => {}}
 *   onRequestEvidence={() => {}}
 *   onReject={() => {}}
 * />
 * ```
 */

'use client';

import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Clock, Download, Maximize2, FileText, Image as ImageIcon } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { formatCurrency } from '@/lib/collections-calculator';
import { useCountdown, CountdownDisplay, CountdownProgress } from '@/hooks/useCountdown';
import { AccessibleDialog, AccessibleButton, PaymentStatusLiveRegion } from '@/lib/accessibility';
import { PaymentTimeline, type TimelineEvent } from '@/components/PaymentTimeline';

// ============================================================
// TYPES
// ============================================================

export type PaymentMethod =
  | 'bacs'
  | 'check'
  | 'cash'
  | 'paypal'
  | 'card'
  | 'stripe'
  | 'other';

export interface PaymentClaim {
  id: string;
  invoiceId: string;
  claimantEmail: string;
  claimantName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  evidenceUrl?: string;
  evidenceFileName?: string;
  claimedAt: Date;
  status: 'pending' | 'verified' | 'rejected' | 'evidence_requested';
  verificationDeadline: Date;
}

// ============================================================
// CLIENT: "I'VE PAID THIS" BUTTON
// ============================================================

export function PaymentClaimButton({
  invoiceId,
  amount,
  invoiceNumber,
  onClaimSubmitted,
  className = '',
}: {
  invoiceId: string;
  amount: number;
  invoiceNumber?: string;
  onClaimSubmitted?: () => void;
  className?: string;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors ${className}`}
      >
        <CheckCircle className="w-5 h-5" />
        <span>I've Paid This</span>
      </button>

      {showModal && (
        <PaymentClaimModal
          invoiceId={invoiceId}
          amount={amount}
          invoiceNumber={invoiceNumber}
          onClose={() => setShowModal(false)}
          onSubmit={() => {
            setShowModal(false);
            onClaimSubmitted?.();
          }}
        />
      )}
    </>
  );
}

// ============================================================
// CLIENT: PAYMENT CLAIM MODAL
// ============================================================

function PaymentClaimModal({
  invoiceId,
  amount,
  invoiceNumber,
  onClose,
  onSubmit,
}: {
  invoiceId: string;
  amount: number;
  invoiceNumber?: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const paymentMethods: Array<{
    id: PaymentMethod;
    label: string;
    description: string;
  }> = [
      {
        id: 'bacs',
        label: 'Bank Transfer (BACS)',
        description: 'Direct bank transfer via UK banking',
      },
      {
        id: 'check',
        label: 'Check',
        description: 'Physical check payment',
      },
      {
        id: 'cash',
        label: 'Cash',
        description: 'Cash payment in person',
      },
      {
        id: 'paypal',
        label: 'PayPal',
        description: 'PayPal transfer',
      },
      {
        id: 'card',
        label: 'Credit/Debit Card',
        description: 'Card payment',
      },
      {
        id: 'stripe',
        label: 'Stripe',
        description: 'Stripe payment',
      },
      {
        id: 'other',
        label: 'Other',
        description: 'Another payment method',
      },
    ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum size is 10MB.');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload JPEG, PNG, or PDF.');
        return;
      }

      setEvidenceFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    setUploading(true);

    try {
      // Upload evidence file if provided
      let evidenceUrl = '';
      if (evidenceFile) {
        const formData = new FormData();
        formData.append('file', evidenceFile);
        formData.append('invoiceId', invoiceId);

        const response = await fetch('/api/payment-verification/upload-evidence', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload evidence');
        }

        const data = await response.json();
        evidenceUrl = data.url;
      }

      // Submit payment claim
      const response = await fetch('/api/payment-verification/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          paymentMethod: selectedMethod,
          evidenceUrl,
          evidenceFileName: evidenceFile?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit payment claim');
      }

      trackEvent('payment_claim_submitted', {
        invoice_id: invoiceId,
        paymentMethod: selectedMethod,
        hasEvidence: !!evidenceFile,
      });

      onSubmit();
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit claim. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AccessibleDialog
      isOpen={true}
      onClose={onClose}
      title={`Payment Claim - Invoice ${invoiceNumber || invoiceId}`}
      description="Submit your payment claim with proof of payment"
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="bg-white rounded-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-lg -mx-6 -mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Payment Claim</h2>
              <p className="text-purple-100 mt-1">
                Invoice {invoiceNumber || invoiceId} - {formatCurrency(amount)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Claim Payment Verification
                </h3>
                <p className="text-sm text-blue-700">
                  Your claim will be verified within 48 hours. Collection reminders will be paused
                  during verification. For faster approval, please upload proof of payment.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              How did you pay? <span className="text-red-600">*</span>
            </h3>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedMethod === method.id
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === method.id}
                    onChange={() => setSelectedMethod(method.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{method.label}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Evidence Upload */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Upload Proof of Payment <span className="text-gray-500 text-sm font-normal">(Optional)</span>
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Upload a bank statement screenshot, payment confirmation, or receipt for faster verification.
            </p>

            {!evidenceFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-purple-600 hover:bg-purple-50 transition-colors flex flex-col items-center space-y-2"
              >
                <Upload className="w-10 h-10 text-gray-400" />
                <div className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </div>
                <div className="text-xs text-gray-500">
                  PDF, PNG, JPG up to 10MB
                </div>
              </button>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 rounded p-2">
                    <Upload className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{evidenceFile.name}</div>
                    <div className="text-sm text-gray-500">
                      {(evidenceFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setEvidenceFile(null)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedMethod || uploading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Claim</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </AccessibleDialog>
  );
}

// ============================================================
// FREELANCER: VERIFICATION MODAL
// ============================================================

export function PaymentVerificationModal({
  claim,
  timelineEvents = [],
  onConfirm,
  onRequestEvidence,
  onReject,
  onClose,
}: {
  claim: PaymentClaim;
  timelineEvents?: TimelineEvent[]; // Optional: Invoice journey timeline
  onConfirm: () => void;
  onRequestEvidence: () => void;
  onReject: (reason: string) => void;
  onClose: () => void;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showFullscreenEvidence, setShowFullscreenEvidence] = useState(false);

  // 48-hour countdown timer with auto-expiration handling
  const countdown = useCountdown(claim.verificationDeadline, {
    updateInterval: 60000, // Update every minute
    onExpire: () => {
      console.log('Verification deadline expired for claim', claim.id);
      // Collections will auto-resume via cron job
    },
  });

  const handleConfirm = () => {
    trackEvent('payment_claim_status_changed', {
      claim_id: claim.id,
      invoice_id: claim.invoiceId,
      previous_status: claim.status,
      new_status: 'verified',
    });
    onConfirm();
  };

  const handleRequestEvidence = () => {
    trackEvent('verification_reminder_sent', {
      claim_id: claim.id,
      invoice_id: claim.invoiceId,
      hours_remaining: 24, // Assuming 24 hours for evidence request
      is_urgent: true,
    });
    onRequestEvidence();
  };

  const handleReject = () => {
    if (!rejectReason) {
      alert('Please select a rejection reason');
      return;
    }

    trackEvent('payment_claim_status_changed', {
      claim_id: claim.id,
      invoice_id: claim.invoiceId,
      previous_status: claim.status,
      new_status: 'rejected',
      reason: rejectReason,
    });

    onReject(rejectReason);
    setShowRejectModal(false);
  };

  return (
    <>
      <AccessibleDialog
        isOpen={true}
        onClose={onClose}
        title="Payment Claim Verification"
        description={`Verify payment claim for Invoice #${claim.invoiceId}`}
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-white rounded-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-t-lg -mx-6 -mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Payment Claim Verification</h2>
                <p className="text-green-100 mt-1">
                  Verify payment for Invoice #{claim.invoiceId}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Countdown Timer with Progress Bar */}
            <div className="mt-4 space-y-2">
              <div className="bg-white/20 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-white" />
                  <div className="text-white">
                    <div className="text-sm opacity-90">Verification Deadline</div>
                    <div className="font-semibold text-lg">
                      {countdown.isExpired ? (
                        <span className="text-red-200">Expired - Collections Resumed</span>
                      ) : (
                        <span>{countdown.formatted.long} remaining</span>
                      )}
                    </div>
                  </div>
                </div>
                {!countdown.isExpired && (
                  <div className="text-right text-white">
                    <div className="text-2xl font-bold">{countdown.formatted.compact}</div>
                    <div className="text-xs opacity-75">
                      {claim.verificationDeadline.toLocaleDateString('en-GB', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {!countdown.isExpired && (
                <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${countdown.percentage < 12.5
                      ? 'bg-red-400'
                      : countdown.percentage < 50
                        ? 'bg-yellow-400'
                        : 'bg-green-400'
                      }`}
                    style={{ width: `${countdown.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={countdown.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${countdown.percentage.toFixed(0)}% of verification time remaining`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* ARIA Live Region for Status Updates */}
            <PaymentStatusLiveRegion status={claim.status} amount={claim.amount} />
            {/* Claim Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Claim Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Claimant</div>
                  <div className="font-medium text-gray-900">{claim.claimantName}</div>
                  <div className="text-gray-600">{claim.claimantEmail}</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Amount</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(claim.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Payment Method</div>
                  <div className="font-medium text-gray-900 capitalize">
                    {claim.paymentMethod.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Claimed At</div>
                  <div className="font-medium text-gray-900">
                    {claim.claimedAt.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Journey Timeline */}
            {timelineEvents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Invoice Journey
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <PaymentTimeline events={timelineEvents} compact={true} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Timeline shows invoice history from creation to current payment claim
                </p>
              </div>
            )}

            {/* Evidence - Enhanced Viewer */}
            {claim.evidenceUrl ? (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                  <span>Proof of Payment</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={claim.evidenceUrl}
                      download={claim.evidenceFileName}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
                      onClick={() => trackEvent('payment_evidence_downloaded', { claim_id: claim.id, file_name: claim.evidenceFileName })}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                    {!claim.evidenceFileName?.endsWith('.pdf') && (
                      <button
                        onClick={() => setShowFullscreenEvidence(true)}
                        className="text-sm text-gray-600 hover:text-gray-800 font-medium inline-flex items-center gap-1"
                      >
                        <Maximize2 className="w-4 h-4" />
                        Fullscreen
                      </button>
                    )}
                  </div>
                </h3>

                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  {claim.evidenceFileName?.endsWith('.pdf') ? (
                    /* PDF Evidence */
                    <div className="p-6 flex items-center justify-center">
                      <a
                        href={claim.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center space-y-3 text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        <div className="w-20 h-20 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-10 h-10 text-red-600" />
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{claim.evidenceFileName}</div>
                          <div className="text-sm text-gray-500">Click to open PDF in new tab</div>
                        </div>
                      </a>
                    </div>
                  ) : (
                    /* Image Evidence with Thumbnail */
                    <div className="relative group">
                      <img
                        src={claim.evidenceUrl}
                        alt="Payment proof"
                        className="max-w-full h-auto mx-auto max-h-96 object-contain cursor-pointer"
                        onClick={() => setShowFullscreenEvidence(true)}
                        loading="lazy"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setShowFullscreenEvidence(true)}
                          className="bg-white rounded-lg px-4 py-2 text-sm font-medium text-gray-900 shadow-lg inline-flex items-center gap-2"
                        >
                          <Maximize2 className="w-4 h-4" />
                          View Fullscreen
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Info */}
                {claim.evidenceFileName && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" />
                    <span>{claim.evidenceFileName}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">No Evidence Provided</h4>
                    <p className="text-sm text-yellow-700">
                      The claimant did not upload proof of payment. You can request evidence before
                      verifying.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Verification Actions</h3>

              {/* Confirm Payment */}
              <button
                onClick={handleConfirm}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg p-4 font-medium transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">Confirm Payment</div>
                    <div className="text-sm opacity-90">
                      Mark invoice as paid and stop collections
                    </div>
                  </div>
                </div>
                <span className="text-2xl">→</span>
              </button>

              {/* Request Evidence */}
              {!claim.evidenceUrl && (
                <button
                  onClick={handleRequestEvidence}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg p-4 font-medium transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Upload className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Request Evidence</div>
                      <div className="text-sm opacity-90">
                        Ask claimant to upload proof of payment
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl">→</span>
                </button>
              )}

              {/* Reject Claim */}
              <button
                onClick={() => setShowRejectModal(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg p-4 font-medium transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <X className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">Reject Claim</div>
                    <div className="text-sm opacity-90">
                      Payment not received - resume collections
                    </div>
                  </div>
                </div>
                <span className="text-2xl">→</span>
              </button>
            </div>
          </div>
        </div>
      </AccessibleDialog>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <AccessibleDialog
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Reject Payment Claim"
          description="Please select a reason for rejecting this claim. This helps improve our system and provides clear feedback to clients."
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="bg-white rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 sr-only">Reject Payment Claim</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please select a reason for rejecting this claim. This helps improve our system and provides clear feedback to clients.
            </p>

            <div className="space-y-2 mb-4">
              {/* Primary Rejection Reasons */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Payment Not Verified
                </h4>
                {[
                  { value: 'payment_not_received', label: 'Payment not received in account' },
                  { value: 'incorrect_amount', label: 'Incorrect amount received' },
                  { value: 'partial_payment', label: 'Only partial payment received' },
                  { value: 'payment_pending', label: 'Payment showing as pending/processing' },
                ].map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${rejectReason === reason.value
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      value={reason.value}
                      checked={rejectReason === reason.value}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-900">{reason.label}</span>
                  </label>
                ))}
              </div>

              {/* Evidence Issues */}
              <div className="space-y-2 pt-3">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Evidence Issues
                </h4>
                {[
                  { value: 'insufficient_evidence', label: 'Insufficient or unclear evidence provided' },
                  { value: 'evidence_mismatch', label: 'Evidence doesn\'t match invoice details' },
                  { value: 'no_evidence', label: 'No evidence provided when required' },
                ].map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${rejectReason === reason.value
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      value={reason.value}
                      checked={rejectReason === reason.value}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-900">{reason.label}</span>
                  </label>
                ))}
              </div>

              {/* Payment Details Issues */}
              <div className="space-y-2 pt-3">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Payment Details
                </h4>
                {[
                  { value: 'wrong_account', label: 'Payment sent to wrong account' },
                  { value: 'wrong_invoice', label: 'Payment for different invoice' },
                  { value: 'timing_discrepancy', label: 'Payment date doesn\'t match claim date' },
                  { value: 'method_mismatch', label: 'Payment method doesn\'t match records' },
                ].map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${rejectReason === reason.value
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      value={reason.value}
                      checked={rejectReason === reason.value}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-900">{reason.label}</span>
                  </label>
                ))}
              </div>

              {/* Disputes & Fraud */}
              <div className="space-y-2 pt-3">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Disputes & Concerns
                </h4>
                {[
                  { value: 'duplicate_payment', label: 'Duplicate payment claim' },
                  { value: 'disputed_invoice', label: 'Invoice disputed by client' },
                  { value: 'fraudulent_claim', label: 'Suspected fraudulent claim' },
                  { value: 'other', label: 'Other reason (please contact support)' },
                ].map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${rejectReason === reason.value
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      value={reason.value}
                      checked={rejectReason === reason.value}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-900">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Claim
              </button>
            </div>
          </div>
        </AccessibleDialog>
      )}

      {/* Fullscreen Evidence Viewer */}
      {showFullscreenEvidence && claim.evidenceUrl && !claim.evidenceFileName?.endsWith('.pdf') && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-[70] flex items-center justify-center p-4"
          onClick={() => setShowFullscreenEvidence(false)}
        >
          <button
            onClick={() => setShowFullscreenEvidence(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-3 transition-colors z-10"
            aria-label="Close fullscreen view"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="absolute top-4 left-4 z-10">
            <a
              href={claim.evidenceUrl}
              download={claim.evidenceFileName}
              className="bg-white text-gray-900 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>

          <img
            src={claim.evidenceUrl}
            alt="Payment proof (fullscreen)"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {claim.evidenceFileName && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
              {claim.evidenceFileName}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Payment Verification Constants
 *
 * Canonical rejection reasons and verification-related constants based on
 * Document 13 (Payment Verification Guide) research specifications.
 *
 * @see DOCUMENTS_10-15_GAP_ANALYSIS.md
 * @see payment_verification_guide.md Lines 180-220
 */

/**
 * Rejection Reason Definition
 */
export interface RejectionReason {
  /** Unique identifier for analytics tracking */
  id: string;
  /** Human-readable label shown in UI */
  label: string;
  /** Category for grouping similar reasons */
  category: 'amount' | 'date' | 'method' | 'evidence' | 'status' | 'fraud' | 'other';
  /** Whether this reason requires additional free-text explanation */
  requiresExplanation: boolean;
  /** Suggested follow-up action for client */
  clientAction?: string;
}

/**
 * 13 Canonical Rejection Reasons
 *
 * Based on Document 13 Payment Verification Guide research.
 * These reasons cover all common payment verification failure scenarios
 * and enable proper analytics tracking for rejection patterns.
 *
 * Research Source: payment_verification_guide.md Lines 180-220
 * "13-15 canonical rejection reasons for analytics and client feedback"
 */
export const REJECTION_REASONS: readonly RejectionReason[] = [
  // Amount Discrepancy (2 reasons)
  {
    id: 'amount_partial',
    label: 'Amount incorrect (partial payment)',
    category: 'amount',
    requiresExplanation: true,
    clientAction: 'Please pay the remaining balance'
  },
  {
    id: 'amount_wrong',
    label: 'Amount incorrect (wrong total)',
    category: 'amount',
    requiresExplanation: true,
    clientAction: 'Please verify the correct invoice amount'
  },

  // Date Issues (1 reason)
  {
    id: 'date_wrong',
    label: 'Payment date is incorrect',
    category: 'date',
    requiresExplanation: true,
    clientAction: 'Please verify the payment date'
  },

  // Payment Method (1 reason)
  {
    id: 'method_mismatch',
    label: 'Payment method doesn\'t match',
    category: 'method',
    requiresExplanation: true,
    clientAction: 'Please confirm the payment method used'
  },

  // Duplicate/Already Paid (1 reason)
  {
    id: 'duplicate_claim',
    label: 'Duplicate claim (invoice already paid)',
    category: 'status',
    requiresExplanation: false,
    clientAction: 'This invoice is already marked as paid'
  },

  // Evidence Issues (3 reasons)
  {
    id: 'no_evidence',
    label: 'No evidence of payment provided',
    category: 'evidence',
    requiresExplanation: false,
    clientAction: 'Please upload payment proof (bank statement, receipt, etc.)'
  },
  {
    id: 'evidence_unclear',
    label: 'Evidence is unclear or illegible',
    category: 'evidence',
    requiresExplanation: true,
    clientAction: 'Please upload a clearer image or PDF'
  },
  {
    id: 'evidence_mismatch',
    label: 'Evidence doesn\'t match this invoice',
    category: 'evidence',
    requiresExplanation: true,
    clientAction: 'Please ensure evidence matches invoice details (amount, date, reference)'
  },

  // Fraud (1 reason)
  {
    id: 'suspected_fraud',
    label: 'Suspected fraudulent claim',
    category: 'fraud',
    requiresExplanation: true,
    clientAction: 'This claim appears suspicious and requires further verification'
  },

  // Payment Processing (3 reasons)
  {
    id: 'payment_processing',
    label: 'Payment is still processing',
    category: 'status',
    requiresExplanation: false,
    clientAction: 'Please wait for payment to clear (usually 1-3 business days)'
  },
  {
    id: 'bank_pending',
    label: 'Bank transfer is pending',
    category: 'status',
    requiresExplanation: false,
    clientAction: 'BACS transfers typically take 2-3 business days to clear'
  },
  {
    id: 'check_not_cleared',
    label: 'Check has not cleared yet',
    category: 'status',
    requiresExplanation: false,
    clientAction: 'Please allow 5-7 business days for check clearance'
  },

  // Other (1 reason - catch-all)
  {
    id: 'other',
    label: 'Other reason (please specify)',
    category: 'other',
    requiresExplanation: true,
    clientAction: 'Please provide more details'
  }
] as const;

/**
 * Get rejection reason by ID
 */
export function getRejectionReason(id: string): RejectionReason | undefined {
  return REJECTION_REASONS.find(reason => reason.id === id);
}

/**
 * Get rejection reasons by category
 */
export function getRejectionReasonsByCategory(
  category: RejectionReason['category']
): readonly RejectionReason[] {
  return REJECTION_REASONS.filter(reason => reason.category === category);
}

/**
 * Get human-readable rejection reason label
 */
export function getRejectionReasonLabel(id: string): string {
  return getRejectionReason(id)?.label || 'Unknown reason';
}

/**
 * Check if rejection reason requires additional explanation
 */
export function requiresExplanation(id: string): boolean {
  return getRejectionReason(id)?.requiresExplanation ?? true;
}

/**
 * Payment Verification Window (48 hours)
 */
export const VERIFICATION_WINDOW_HOURS = 48;

/**
 * Maximum file size for evidence upload (10MB in bytes)
 */
export const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Accepted evidence file types
 */
export const ACCEPTED_EVIDENCE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
] as const;

/**
 * Accepted evidence file extensions
 */
export const ACCEPTED_EVIDENCE_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg'
] as const;

/**
 * Verification status types
 */
export type VerificationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired';

/**
 * Freelancer verification actions
 */
export type VerificationAction =
  | 'approve'
  | 'reject'
  | 'request_more_info';

/**
 * Get human-readable verification status label
 */
export function getVerificationStatusLabel(status: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    pending: 'Pending Verification',
    approved: 'Verified',
    rejected: 'Rejected',
    expired: 'Verification Expired'
  };
  return labels[status];
}

/**
 * Analytics event properties for rejection tracking
 */
export interface RejectionAnalyticsProps {
  claim_id: string;
  invoice_id: string;
  rejection_reason_id: string;
  rejection_category: RejectionReason['category'];
  has_explanation: boolean;
  explanation_length?: number;
}

/**
 * Helper to create rejection analytics event properties
 */
export function createRejectionAnalytics(
  claimId: string,
  invoiceId: string,
  reasonId: string,
  explanation?: string
): RejectionAnalyticsProps {
  const reason = getRejectionReason(reasonId);

  return {
    claim_id: claimId,
    invoice_id: invoiceId,
    rejection_reason_id: reasonId,
    rejection_category: reason?.category || 'other',
    has_explanation: !!explanation,
    explanation_length: explanation?.length
  };
}

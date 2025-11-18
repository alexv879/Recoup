/**
 * Payment Components Barrel Export
 *
 * Centralized exports for all payment verification and evidence components.
 *
 * @see PHASE_2_PROGRESS.md Task 3
 */

// Payment Status Badge
export {
  PaymentStatusBadge,
  PaymentStatusBadgeCompact,
  getPaymentStatusLabel,
  getPaymentStatusAriaLabel,
  default as DefaultPaymentStatusBadge
} from './PaymentStatusBadge';

export type {
  PaymentStatus,
  BadgeSize
} from './PaymentStatusBadge';

// Payment Timeline
export {
  PaymentTimeline,
  PaymentTimelineCompact,
  default as DefaultPaymentTimeline
} from './PaymentTimeline';

export type {
  TimelineEventType,
  TimelineEvent
} from './PaymentTimeline';

// Evidence Viewer
export {
  EvidenceViewer,
  EvidencePreviewCompact,
  default as DefaultEvidenceViewer
} from './EvidenceViewer';

export type {
  EvidenceFile
} from './EvidenceViewer';

// Verification Countdown (existing component)
export { default as VerificationCountdown } from './VerificationCountdown';

// Evidence Upload (existing component)
export { default as PaymentEvidenceUpload } from './PaymentEvidenceUpload';

// Verification Modal (existing component)
export { default as PaymentVerificationModal } from './PaymentVerificationModal';

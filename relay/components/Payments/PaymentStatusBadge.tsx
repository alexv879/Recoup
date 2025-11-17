/**
 * Payment Status Badge Component
 *
 * Displays payment status with color coding, icons, and WCAG AAA accessibility compliance.
 *
 * Research Source: payment_verification_code.md lines 5-78
 * WCAG AAA Colors: 7:1+ contrast ratio
 *
 * @see PHASE_2_PROGRESS.md Task 3
 */

'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';

export type PaymentStatus =
  | 'paid'
  | 'pending_verification'
  | 'overdue'
  | 'rejected'
  | 'pending';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface PaymentStatusBadgeProps {
  /** Current payment status */
  status: PaymentStatus;
  /** Badge size variant */
  size?: BadgeSize;
  /** Optional custom className for styling overrides */
  className?: string;
}

interface StatusConfig {
  label: string;
  /** WCAG AAA compliant background color (7:1+ contrast) */
  bgColor: string;
  /** WCAG AAA compliant text color */
  textColor: string;
  /** Border color matching status theme */
  borderColor: string;
  /** Lucide icon component */
  icon: React.ComponentType<{ className?: string }>;
  /** Accessible label for screen readers */
  ariaLabel: string;
}

/**
 * Status configuration with WCAG AAA compliant colors
 * All colors meet 7:1+ contrast ratio for accessibility
 *
 * Color mapping from PHASE_2_PROGRESS.md:
 * - Green: #059669 (Paid)
 * - Yellow: #CA8A04 (Pending Verification)
 * - Red: #991B1B (Overdue)
 * - Gray: #6B7280 (Rejected)
 * - Blue: #0891B2 (Pending)
 */
const STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  paid: {
    label: 'Paid',
    bgColor: 'bg-green-50',
    textColor: 'text-green-900',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
    ariaLabel: 'Payment verified and completed'
  },
  pending_verification: {
    label: 'Pending Verification',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-900',
    borderColor: 'border-yellow-200',
    icon: Clock,
    ariaLabel: 'Payment claimed, awaiting freelancer verification'
  },
  overdue: {
    label: 'Overdue',
    bgColor: 'bg-red-50',
    textColor: 'text-red-900',
    borderColor: 'border-red-200',
    icon: AlertCircle,
    ariaLabel: 'Invoice payment is overdue'
  },
  rejected: {
    label: 'Payment Rejected',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-900',
    borderColor: 'border-gray-300',
    icon: XCircle,
    ariaLabel: 'Payment claim rejected by freelancer'
  },
  pending: {
    label: 'Pending',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-900',
    borderColor: 'border-blue-200',
    icon: Clock,
    ariaLabel: 'Invoice awaiting payment'
  }
};

/**
 * Size variant classes for responsive design
 */
const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-1 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2'
};

/**
 * Icon size classes per badge size
 */
const ICON_SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
};

/**
 * PaymentStatusBadge - Accessible status indicator for payment states
 *
 * Features:
 * - WCAG AAA color compliance (7:1+ contrast)
 * - ARIA status role with descriptive labels
 * - Icon + text for multi-modal communication
 * - Responsive sizing variants
 * - Screen reader friendly
 *
 * @example
 * ```tsx
 * <PaymentStatusBadge status="pending_verification" size="md" />
 * <PaymentStatusBadge status="paid" size="lg" />
 * <PaymentStatusBadge status="overdue" />
 * ```
 */
export function PaymentStatusBadge({
  status,
  size = 'md',
  className = ''
}: PaymentStatusBadgeProps) {
  // Get configuration for current status
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center rounded-full border font-semibold
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        ${SIZE_CLASSES[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="status"
      aria-label={config.ariaLabel}
    >
      <Icon
        className={ICON_SIZE_CLASSES[size]}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </div>
  );
}

/**
 * Compact variant - Icon only, no text label
 * Useful for tight spaces like table cells
 *
 * @example
 * ```tsx
 * <PaymentStatusBadgeCompact status="paid" size="sm" />
 * ```
 */
export function PaymentStatusBadgeCompact({
  status,
  size = 'md',
  className = ''
}: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-full border
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        p-1
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="status"
      aria-label={config.ariaLabel}
      title={config.label}
    >
      <Icon
        className={ICON_SIZE_CLASSES[size]}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Get human-readable status label
 * Useful for analytics and logging
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  return STATUS_CONFIG[status]?.label || STATUS_CONFIG.pending.label;
}

/**
 * Get accessible description for status
 * Useful for screen readers and announcements
 */
export function getPaymentStatusAriaLabel(status: PaymentStatus): string {
  return STATUS_CONFIG[status]?.ariaLabel || STATUS_CONFIG.pending.ariaLabel;
}

export default PaymentStatusBadge;

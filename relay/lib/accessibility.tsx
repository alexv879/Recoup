/**
 * ACCESSIBILITY UTILITIES (WCAG AA+ Compliance)
 *
 * Comprehensive accessibility helpers for WCAG 2.1 Level AA compliance
 *
 * Features:
 * - Semantic HTML components with ARIA attributes
 * - Keyboard navigation helpers
 * - Screen reader optimization
 * - Focus management
 * - Skip links
 * - Color contrast validation
 *
 * Usage:
 * ```tsx
 * import { SkipLink, VisuallyHidden, AccessibleButton } from '@/lib/accessibility';
 *
 * // Skip to main content
 * <SkipLink targetId="main-content" />
 *
 * // Screen reader only text
 * <VisuallyHidden>Loading data...</VisuallyHidden>
 *
 * // Accessible button
 * <AccessibleButton
 *   onClick={handleClick}
 *   ariaLabel="Delete invoice"
 * >
 *   <TrashIcon />
 * </AccessibleButton>
 * ```
 */

'use client';

import { ReactNode, useEffect, useRef, KeyboardEvent } from 'react';

// ============================================================
// SKIP LINK (Navigate to main content)
// ============================================================

export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleSkip}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-purple-600 focus:text-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

// ============================================================
// VISUALLY HIDDEN (Screen reader only)
// ============================================================

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// ============================================================
// ACCESSIBLE BUTTON
// ============================================================

interface AccessibleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function AccessibleButton({
  children,
  onClick,
  ariaLabel,
  ariaDescribedBy,
  disabled = false,
  type = 'button',
  className = '',
}: AccessibleButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
      className={`
        focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ============================================================
// ACCESSIBLE LINK
// ============================================================

interface AccessibleLinkProps {
  href: string;
  children: ReactNode;
  ariaLabel?: string;
  external?: boolean;
  className?: string;
}

export function AccessibleLink({
  href,
  children,
  ariaLabel,
  external = false,
  className = '',
}: AccessibleLinkProps) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`
        focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2
        underline hover:no-underline
        ${className}
      `}
    >
      {children}
      {external && (
        <VisuallyHidden> (opens in new tab)</VisuallyHidden>
      )}
    </a>
  );
}

// ============================================================
// ACCESSIBLE FORM FIELD
// ============================================================

interface AccessibleFormFieldProps {
  id: string;
  label: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  className?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  min?: string;
  max?: string;
  step?: string;
}

export function AccessibleFormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  helpText,
  className = '',
  options,
  rows = 3,
  min,
  max,
  step,
}: AccessibleFormFieldProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  const baseInputClass = `
    w-full px-3 py-2 border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
    ${error ? 'border-red-600' : 'border-gray-300'}
  `;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && (
          <span className="text-red-600 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {helpText && (
        <p id={helpId} className="text-sm text-gray-600 mb-2">
          {helpText}
        </p>
      )}

      {type === 'select' && options ? (
        <select
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helpText ? helpId : undefined}
          aria-required={required}
          className={baseInputClass}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helpText ? helpId : undefined}
          aria-required={required}
          className={baseInputClass}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helpText ? helpId : undefined}
          aria-required={required}
          className={`${baseInputClass} ${className}`}
        />
      )}

      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// ACCESSIBLE DIALOG/MODAL
// ============================================================

interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function AccessibleDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
}: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstFocusable?.focus();

    const handleTab = (e: KeyboardEventInit) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    dialog.addEventListener('keydown', handleTab as EventListener);

    return () => {
      dialog.removeEventListener('keydown', handleTab as EventListener);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEventInit) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape as EventListener);

    return () => {
      document.removeEventListener('keydown', handleEscape as EventListener);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className={`relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 ${className}`}>
        <div className="p-6">
          <h2 id="dialog-title" className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </h2>

          {description && (
            <p id="dialog-description" className="text-gray-600 mb-6">
              {description}
            </p>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ACCESSIBLE STATUS MESSAGE (Live Region)
// ============================================================

interface AccessibleStatusProps {
  message: string;
  type?: 'polite' | 'assertive';
  className?: string;
}

export function AccessibleStatus({
  message,
  type = 'polite',
  className = '',
}: AccessibleStatusProps) {
  return (
    <div
      role="status"
      aria-live={type}
      aria-atomic="true"
      className={className}
    >
      {message}
    </div>
  );
}

// ============================================================
// ACCESSIBLE LOADING STATE
// ============================================================

export function AccessibleLoading({
  message = 'Loading...',
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex items-center space-x-3 ${className}`}
    >
      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      <span>{message}</span>
      <VisuallyHidden>Loading content, please wait...</VisuallyHidden>
    </div>
  );
}

// ============================================================
// ACCESSIBLE TABLE
// ============================================================

interface AccessibleTableProps {
  caption: string;
  headers: string[];
  rows: Array<Array<string | ReactNode>>;
  className?: string;
}

export function AccessibleTable({
  caption,
  headers,
  rows,
  className = '',
}: AccessibleTableProps) {
  return (
    <table className={`w-full ${className}`}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th
              key={index}
              scope="col"
              className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b-2 border-gray-200"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b border-gray-100">
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className="px-4 py-3 text-sm text-gray-700"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============================================================
// FOCUS MANAGEMENT
// ============================================================

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}

// ============================================================
// COLOR CONTRAST VALIDATOR
// ============================================================

/**
 * Validate color contrast ratio meets WCAG AA standards
 * AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function validateColorContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): {
  ratio: number;
  passes: boolean;
  level: 'AAA' | 'AA' | 'Fail';
} {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : { r: 0, g: 0, b: 0 };
  };

  // Calculate relative luminance
  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      val /= 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);

  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  const aaThreshold = isLargeText ? 3 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7;

  let level: 'AAA' | 'AA' | 'Fail';
  if (ratio >= aaaThreshold) {
    level = 'AAA';
  } else if (ratio >= aaThreshold) {
    level = 'AA';
  } else {
    level = 'Fail';
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= aaThreshold,
    level,
  };
}

// ============================================================
// KEYBOARD NAVIGATION HELPER
// ============================================================

export function handleKeyboardNav(
  event: KeyboardEvent<HTMLElement>,
  callbacks: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
  }
) {
  const { key } = event;

  switch (key) {
    case 'Enter':
      callbacks.onEnter?.();
      break;
    case ' ':
    case 'Space':
      event.preventDefault(); // Prevent page scroll
      callbacks.onSpace?.();
      break;
    case 'Escape':
      callbacks.onEscape?.();
      break;
    case 'ArrowUp':
      event.preventDefault();
      callbacks.onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      callbacks.onArrowDown?.();
      break;
    case 'ArrowLeft':
      callbacks.onArrowLeft?.();
      break;
    case 'ArrowRight':
      callbacks.onArrowRight?.();
      break;
  }
}

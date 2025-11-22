/**
 * Sentry Utilities
 *
 * Centralized helper functions for error tracking and monitoring.
 * Use these throughout the application for consistent error reporting.
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception with additional context
 *
 * @param error - The error to capture
 * @param context - Additional context data
 * @param level - Error severity level
 *
 * @example
 * ```ts
 * captureException(new Error('Payment failed'), {
 *   userId: 'user_123',
 *   invoiceId: 'inv_456',
 *   amount: 100.00
 * }, 'error');
 * ```
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, any>,
  level: 'fatal' | 'error' | 'warning' | 'info' = 'error'
) {
  if (!error) return;

  Sentry.withScope((scope) => {
    // Set error level
    scope.setLevel(level);

    // Add custom context
    if (context) {
      scope.setContext('additional_info', context);
    }

    // Extract user info if available
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    // Add tags for filtering
    if (context?.feature) {
      scope.setTag('feature', context.feature);
    }

    // Capture the error
    Sentry.captureException(error);
  });
}

/**
 * Capture a message (non-error event)
 *
 * @param message - The message to log
 * @param context - Additional context
 * @param level - Message severity
 *
 * @example
 * ```ts
 * captureMessage('High value payment received', {
 *   amount: 10000,
 *   invoiceId: 'inv_789'
 * }, 'info');
 * ```
 */
export function captureMessage(
  message: string,
  context?: Record<string, any>,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);

    if (context) {
      scope.setContext('message_context', context);
    }

    Sentry.captureMessage(message);
  });
}

/**
 * Start a performance transaction
 *
 * @param name - Transaction name (e.g., 'process_payment')
 * @param op - Operation type (e.g., 'payment', 'database')
 * @returns Transaction object (call .finish() when done)
 *
 * @example
 * ```ts
 * const transaction = startTransaction('stripe_payment', 'payment');
 * try {
 *   // ... perform operation
 *   transaction.setStatus('ok');
 * } catch (error) {
 *   transaction.setStatus('internal_error');
 *   throw error;
 * } finally {
 *   transaction.finish();
 * }
 * ```
 */
export function startTransaction(name: string, op: string = 'custom') {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

/**
 * Add breadcrumb for debugging context
 *
 * @param message - Breadcrumb message
 * @param category - Category (e.g., 'payment', 'email', 'api')
 * @param level - Severity level
 * @param data - Additional data
 *
 * @example
 * ```ts
 * addBreadcrumb('Payment initiated', 'payment', 'info', {
 *   invoiceId: 'inv_123',
 *   amount: 100
 * });
 * ```
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context for error tracking
 *
 * @param userId - User ID
 * @param email - User email (optional)
 * @param extra - Additional user data
 *
 * @example
 * ```ts
 * setUser('user_123', 'john@example.com', {
 *   subscriptionTier: 'pro',
 *   country: 'UK'
 * });
 * ```
 */
export function setUser(
  userId: string | null,
  email?: string,
  extra?: Record<string, any>
) {
  if (!userId) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: userId,
    email,
    ...extra,
  });
}

/**
 * Set custom tag for filtering errors
 *
 * @param key - Tag key
 * @param value - Tag value
 *
 * @example
 * ```ts
 * setTag('payment_method', 'stripe');
 * setTag('invoice_type', 'recurring');
 * ```
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Set custom context data
 *
 * @param name - Context name
 * @param data - Context data object
 *
 * @example
 * ```ts
 * setContext('invoice_details', {
 *   id: 'inv_123',
 *   amount: 100,
 *   status: 'overdue'
 * });
 * ```
 */
export function setContext(name: string, data: Record<string, any> | null) {
  Sentry.setContext(name, data);
}

/**
 * Wrap an async function with error capturing
 *
 * @param fn - Function to wrap
 * @param errorContext - Context to include with errors
 * @returns Wrapped function
 *
 * @example
 * ```ts
 * const safeProcessPayment = withErrorCapture(
 *   async (invoiceId) => {
 *     // ... payment logic
 *   },
 *   { feature: 'payment' }
 * );
 * ```
 */
export function withErrorCapture<T extends (...args: any[]) => any>(
  fn: T,
  errorContext?: Record<string, any>
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error, errorContext);
      throw error;
    }
  }) as T;
}

/**
 * Flush all pending Sentry events
 * Use this before process exit or serverless function completion
 *
 * @param timeout - Max time to wait (ms)
 * @returns Promise that resolves when flushed
 *
 * @example
 * ```ts
 * await flushEvents(2000); // Wait up to 2 seconds
 * ```
 */
export async function flushEvents(timeout: number = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

/**
 * Check if Sentry is enabled
 * Useful for conditional monitoring logic
 */
export function isSentryEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    (!!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN)
  );
}

/**
 * Sentry Error Monitoring Utilities
 *
 * Helper functions for capturing errors, setting context, and tracking events
 * in Sentry across the Recoup application.
 *
 * Sentry Configuration:
 * - Server: sentry.server.config.ts
 * - Client: sentry.client.config.ts
 *
 * Usage Examples:
 * ```typescript
 * import { captureException, captureMessage, setUserContext, addBreadcrumb } from '@/lib/sentry-utils';
 *
 * // Capture an exception with context
 * try {
 *   await processPayment(invoice);
 * } catch (error) {
 *   captureException(error, {
 *     level: 'error',
 *     tags: { feature: 'payments', invoiceId: invoice.id },
 *     extras: { invoiceAmount: invoice.amount }
 *   });
 * }
 *
 * // Capture a message
 * captureMessage('Payment processed successfully', 'info', {
 *   tags: { invoiceId: invoice.id }
 * });
 *
 * // Set user context
 * setUserContext({ id: userId, email: userEmail, tier: 'pro' });
 *
 * // Add breadcrumb for debugging
 * addBreadcrumb({
 *   message: 'User initiated payment',
 *   category: 'payment',
 *   level: 'info',
 *   data: { invoiceId, amount }
 * });
 * ```
 */

import * as Sentry from '@sentry/nextjs';

export type SentryLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface SentryContext {
  level?: SentryLevel;
  tags?: Record<string, string | number | boolean>;
  extras?: Record<string, any>;
  fingerprint?: string[];
}

export interface SentryUser {
  id: string;
  email?: string;
  username?: string;
  tier?: string;
  [key: string]: any;
}

export interface SentryBreadcrumb {
  message: string;
  category?: string;
  level?: SentryLevel;
  data?: Record<string, any>;
}

/**
 * Capture an exception to Sentry
 *
 * @param error - The error to capture
 * @param context - Additional context (tags, extras, level)
 * @returns Event ID from Sentry
 */
export function captureException(error: Error | unknown, context?: SentryContext): string | undefined {
  if (!isSentryEnabled()) {
    console.error('[Sentry] Not enabled, error not captured:', error);
    return undefined;
  }

  // Set scope with context
  return Sentry.withScope((scope) => {
    if (context?.level) {
      scope.setLevel(context.level);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extras) {
      Object.entries(context.extras).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }

    return Sentry.captureException(error);
  });
}

/**
 * Capture a message to Sentry
 *
 * Useful for tracking non-error events that are important
 *
 * @param message - The message to capture
 * @param level - Severity level
 * @param context - Additional context
 * @returns Event ID from Sentry
 */
export function captureMessage(
  message: string,
  level: SentryLevel = 'info',
  context?: SentryContext
): string | undefined {
  if (!isSentryEnabled()) {
    console.log('[Sentry] Not enabled, message not captured:', message);
    return undefined;
  }

  return Sentry.withScope((scope) => {
    scope.setLevel(level);

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extras) {
      Object.entries(context.extras).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    return Sentry.captureMessage(message);
  });
}

/**
 * Set user context for Sentry error reports
 *
 * This will attach user information to all subsequent error reports
 *
 * @param user - User information
 */
export function setUserContext(user: SentryUser | null): void {
  if (!isSentryEnabled()) {
    return;
  }

  if (user === null) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    tier: user.tier,
    ...user
  });
}

/**
 * Add a breadcrumb for debugging
 *
 * Breadcrumbs are a trail of events leading up to an error,
 * helping you understand the context when something goes wrong
 *
 * @param breadcrumb - Breadcrumb information
 */
export function addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'general',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data
  });
}

/**
 * Set a tag for all subsequent error reports
 *
 * Tags are searchable in Sentry UI
 *
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string | number | boolean): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setTag(key, value);
}

/**
 * Set multiple tags at once
 *
 * @param tags - Object with tag key-value pairs
 */
export function setTags(tags: Record<string, string | number | boolean>): void {
  if (!isSentryEnabled()) {
    return;
  }

  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Set extra context data for error reports
 *
 * @param key - Context key
 * @param value - Context value
 */
export function setExtra(key: string, value: any): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setExtra(key, value);
}

/**
 * Set multiple extra context values
 *
 * @param extras - Object with extra key-value pairs
 */
export function setExtras(extras: Record<string, any>): void {
  if (!isSentryEnabled()) {
    return;
  }

  Object.entries(extras).forEach(([key, value]) => {
    Sentry.setExtra(key, value);
  });
}

/**
 * Set context for a specific category
 *
 * @param name - Context name
 * @param context - Context data
 */
export function setContext(name: string, context: Record<string, any>): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setContext(name, context);
}

/**
 * Start a new transaction for performance monitoring
 *
 * @param name - Transaction name
 * @param operation - Operation type (e.g., 'http.server', 'db.query')
 * @returns Transaction object
 */
export function startTransaction(name: string, operation: string) {
  if (!isSentryEnabled()) {
    return null;
  }

  return Sentry.startTransaction({
    name,
    op: operation
  });
}

/**
 * Wrap an async function with Sentry performance monitoring
 *
 * @param name - Name of the operation
 * @param operation - Type of operation
 * @param fn - Function to wrap
 * @returns Result of the function
 */
export async function withPerformanceMonitoring<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!isSentryEnabled()) {
    return fn();
  }

  const transaction = startTransaction(name, operation);

  try {
    const result = await fn();
    transaction?.setStatus('ok');
    return result;
  } catch (error) {
    transaction?.setStatus('internal_error');
    throw error;
  } finally {
    transaction?.finish();
  }
}

/**
 * Capture an API error with structured context
 *
 * @param error - The error
 * @param endpoint - API endpoint
 * @param method - HTTP method
 * @param statusCode - Response status code
 * @param userId - User ID (if available)
 */
export function captureAPIError(
  error: Error | unknown,
  endpoint: string,
  method: string,
  statusCode?: number,
  userId?: string
): string | undefined {
  return captureException(error, {
    level: 'error',
    tags: {
      api_endpoint: endpoint,
      http_method: method,
      ...(statusCode && { status_code: statusCode }),
      error_type: 'api_error'
    },
    extras: {
      endpoint,
      method,
      statusCode,
      userId
    }
  });
}

/**
 * Capture a database error with context
 *
 * @param error - The error
 * @param operation - Database operation (e.g., 'read', 'write', 'delete')
 * @param collection - Firestore collection name
 * @param documentId - Document ID (if applicable)
 */
export function captureDatabaseError(
  error: Error | unknown,
  operation: string,
  collection: string,
  documentId?: string
): string | undefined {
  return captureException(error, {
    level: 'error',
    tags: {
      db_operation: operation,
      db_collection: collection,
      error_type: 'database_error'
    },
    extras: {
      operation,
      collection,
      documentId
    }
  });
}

/**
 * Capture a payment processing error
 *
 * @param error - The error
 * @param invoiceId - Invoice ID
 * @param amount - Payment amount
 * @param paymentMethod - Payment method
 */
export function capturePaymentError(
  error: Error | unknown,
  invoiceId: string,
  amount?: number,
  paymentMethod?: string
): string | undefined {
  return captureException(error, {
    level: 'error',
    tags: {
      feature: 'payments',
      error_type: 'payment_error',
      invoice_id: invoiceId,
      ...(paymentMethod && { payment_method: paymentMethod })
    },
    extras: {
      invoiceId,
      amount,
      paymentMethod
    },
    fingerprint: ['payment-error', invoiceId]
  });
}

/**
 * Capture an integration error (Stripe, Twilio, etc.)
 *
 * @param error - The error
 * @param integration - Integration name (e.g., 'stripe', 'twilio', 'sendgrid')
 * @param operation - Operation that failed
 */
export function captureIntegrationError(
  error: Error | unknown,
  integration: string,
  operation: string
): string | undefined {
  return captureException(error, {
    level: 'error',
    tags: {
      integration,
      integration_operation: operation,
      error_type: 'integration_error'
    },
    extras: {
      integration,
      operation
    }
  });
}

/**
 * Check if Sentry is enabled and configured
 *
 * @returns True if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  return process.env.NODE_ENV === 'production' &&
    (!!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN);
}

/**
 * Manually flush Sentry events (useful before serverless function ends)
 *
 * @param timeout - Timeout in milliseconds (default: 2000)
 * @returns Promise that resolves when flush completes
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  if (!isSentryEnabled()) {
    return true;
  }

  return await Sentry.flush(timeout);
}

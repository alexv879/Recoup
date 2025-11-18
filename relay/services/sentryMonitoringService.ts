/**
 * SENTRY MONITORING SERVICE
 *
 * Integrates with Sentry for error monitoring and creates system alerts
 * for critical errors. Provides utilities for querying Sentry data.
 */

import * as Sentry from '@sentry/nextjs';
import { createAlertFromSentryError, createSystemAlert } from './alertingService';
import { logError, logInfo } from '@/utils/logger';

/**
 * Track critical error and create alert
 */
export function trackCriticalError(
  error: Error,
  context?: Record<string, any>
): void {
  try {
    // Capture in Sentry
    const eventId = Sentry.captureException(error, {
      level: 'error',
      tags: {
        critical: 'true',
      },
      contexts: {
        custom: context,
      },
    });

    // Create system alert
    if (eventId) {
      createAlertFromSentryError(eventId, error, context);
    }

    logError('Critical error tracked', error, context);
  } catch (err) {
    logError('Error tracking critical error', err as Error);
  }
}

/**
 * Track payment error
 */
export function trackPaymentError(
  error: Error,
  invoiceId: string,
  userId: string,
  context?: Record<string, any>
): void {
  try {
    const eventId = Sentry.captureException(error, {
      level: 'error',
      tags: {
        errorType: 'payment',
        invoiceId,
        userId,
      },
      contexts: {
        payment: {
          invoiceId,
          userId,
          ...context,
        },
      },
    });

    logError('Payment error tracked', error, { invoiceId, userId, ...context });
  } catch (err) {
    logError('Error tracking payment error', err as Error);
  }
}

/**
 * Track API integration error
 */
export function trackIntegrationError(
  service: string,
  error: Error,
  context?: Record<string, any>
): void {
  try {
    const eventId = Sentry.captureException(error, {
      level: 'error',
      tags: {
        errorType: 'integration',
        service,
      },
      contexts: {
        integration: {
          service,
          ...context,
        },
      },
    });

    // Create alert for critical integrations
    const criticalServices = ['stripe', 'firebase', 'clerk'];
    if (criticalServices.includes(service.toLowerCase())) {
      createSystemAlert({
        severity: 'high',
        type: 'integration',
        title: `${service} Integration Error`,
        message: error.message,
        source: service.toLowerCase() as any,
        sourceEventId: eventId || undefined,
        errorMessage: error.message,
        context,
        notifyAdmins: true,
      });
    }

    logError('Integration error tracked', error, { service, ...context });
  } catch (err) {
    logError('Error tracking integration error', err as Error);
  }
}

/**
 * Track authentication error
 */
export function trackAuthError(
  error: Error,
  userId?: string,
  context?: Record<string, any>
): void {
  try {
    Sentry.captureException(error, {
      level: 'warning',
      tags: {
        errorType: 'auth',
        userId: userId || 'unknown',
      },
      contexts: {
        auth: {
          userId,
          ...context,
        },
      },
    });

    logError('Auth error tracked', error, { userId, ...context });
  } catch (err) {
    logError('Error tracking auth error', err as Error);
  }
}

/**
 * Track performance issue
 */
export function trackPerformanceIssue(
  metric: string,
  value: number,
  threshold: number,
  context?: Record<string, any>
): void {
  try {
    if (value > threshold) {
      Sentry.captureMessage(`Performance threshold exceeded: ${metric}`, {
        level: 'warning',
        tags: {
          metric,
          value: value.toString(),
          threshold: threshold.toString(),
        },
        contexts: {
          performance: {
            metric,
            value,
            threshold,
            ...context,
          },
        },
      });

      logInfo('Performance issue tracked', { metric, value, threshold, ...context });
    }
  } catch (err) {
    logError('Error tracking performance issue', err as Error);
  }
}

/**
 * Set user context for Sentry
 */
export function setSentryUserContext(userId: string, email?: string, username?: string): void {
  try {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  } catch (err) {
    logError('Error setting Sentry user context', err as Error);
  }
}

/**
 * Clear user context from Sentry
 */
export function clearSentryUserContext(): void {
  try {
    Sentry.setUser(null);
  } catch (err) {
    logError('Error clearing Sentry user context', err as Error);
  }
}

/**
 * Add breadcrumb to Sentry
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
): void {
  try {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
    });
  } catch (err) {
    logError('Error adding Sentry breadcrumb', err as Error);
  }
}

/**
 * Capture custom message in Sentry
 */
export function captureSentryMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void {
  try {
    Sentry.captureMessage(message, {
      level,
      contexts: {
        custom: context,
      },
    });
  } catch (err) {
    logError('Error capturing Sentry message', err as Error);
  }
}

/**
 * Start performance transaction
 */
export function startPerformanceTransaction(name: string, op: string): any {
  try {
    return Sentry.startTransaction({
      name,
      op,
    });
  } catch (err) {
    logError('Error starting performance transaction', err as Error);
    return null;
  }
}

/**
 * Get error rate statistics (placeholder - requires Sentry API integration)
 */
export async function getErrorRateStats(): Promise<{
  last24h: number;
  last7d: number;
  last30d: number;
}> {
  // TODO: Integrate with Sentry API to get actual error rates
  // For now, return placeholder values
  return {
    last24h: 0,
    last7d: 0,
    last30d: 0,
  };
}

/**
 * Get top errors (placeholder - requires Sentry API integration)
 */
export async function getTopErrors(limit: number = 10): Promise<Array<{
  error: string;
  count: number;
  lastSeen: Date;
}>> {
  // TODO: Integrate with Sentry API to get actual top errors
  // For now, return empty array
  return [];
}

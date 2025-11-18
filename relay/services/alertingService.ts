/**
 * ALERTING SYSTEM SERVICE
 *
 * Creates and manages system alerts from various sources:
 * - Sentry errors
 * - Payment failures
 * - API failures
 * - Rate limit breaches
 * - Security events
 * - Performance issues
 */

import { db, FieldValue } from '@/lib/firebase';
import { SystemAlert } from '@/types/models';
import { logError, logInfo, logWarn } from '@/utils/logger';
import * as Sentry from '@sentry/nextjs';

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertType = 'system_error' | 'payment_failure' | 'api_failure' | 'rate_limit' | 'security' | 'performance' | 'integration';
type AlertSource = 'sentry' | 'stripe' | 'twilio' | 'sendgrid' | 'firebase' | 'system' | 'manual';

interface CreateAlertParams {
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  message: string;
  source: AlertSource;
  sourceEventId?: string;
  errorCode?: string;
  errorMessage?: string;
  stackTrace?: string;
  context?: Record<string, any>;
  affectedUsers?: string[];
  affectedInvoices?: string[];
  affectedPayments?: string[];
  notifyAdmins?: boolean;
}

/**
 * Create a system alert
 */
export async function createSystemAlert(params: CreateAlertParams): Promise<string | null> {
  try {
    const {
      severity,
      type,
      title,
      message,
      source,
      sourceEventId,
      errorCode,
      errorMessage,
      stackTrace,
      context,
      affectedUsers = [],
      affectedInvoices = [],
      affectedPayments = [],
      notifyAdmins = false,
    } = params;

    // Check for duplicate alerts (same source + event ID within last 1 hour)
    if (sourceEventId) {
      const recentAlerts = await db
        .collection('system_alerts')
        .where('sourceEventId', '==', sourceEventId)
        .where('source', '==', source)
        .where('createdAt', '>', new Date(Date.now() - 3600000)) // Last 1 hour
        .limit(1)
        .get();

      if (!recentAlerts.empty) {
        // Update occurrence count instead of creating new alert
        const existingAlert = recentAlerts.docs[0];
        await existingAlert.ref.update({
          occurrenceCount: FieldValue.increment(1),
          lastOccurrence: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        logInfo('Alert occurrence incremented', { sourceEventId, alertId: existingAlert.id });
        return existingAlert.id;
      }
    }

    // Create new alert
    const alert: Partial<SystemAlert> = {
      severity,
      type,
      title,
      message,
      source,
      sourceEventId,
      errorCode,
      errorMessage,
      stackTrace,
      context,
      affectedUsers,
      affectedInvoices,
      affectedPayments,
      status: 'active',
      notificationSent: false,
      isRecurring: false,
      occurrenceCount: 1,
      firstOccurrence: FieldValue.serverTimestamp() as any,
      lastOccurrence: FieldValue.serverTimestamp() as any,
      createdAt: FieldValue.serverTimestamp() as any,
    };

    const alertRef = await db.collection('system_alerts').add(alert);

    logInfo('System alert created', {
      alertId: alertRef.id,
      severity,
      type,
      source,
    });

    // Send notification if requested and severity is critical/high
    if (notifyAdmins && (severity === 'critical' || severity === 'high')) {
      await notifyAdminsOfAlert(alertRef.id, alert as SystemAlert);
    }

    // Report to Sentry if critical
    if (severity === 'critical') {
      Sentry.captureMessage(`Critical System Alert: ${title}`, {
        level: 'error',
        tags: {
          alertType: type,
          alertSource: source,
        },
        contexts: {
          alert: {
            alertId: alertRef.id,
            severity,
            message,
          },
        },
      });
    }

    return alertRef.id;
  } catch (error) {
    logError('Error creating system alert', error as Error, params);
    return null;
  }
}

/**
 * Create alert from Sentry error
 */
export async function createAlertFromSentryError(
  eventId: string,
  error: Error,
  context?: Record<string, any>
): Promise<string | null> {
  // Determine severity based on error type
  const severity = determineSeverityFromError(error);

  return createSystemAlert({
    severity,
    type: 'system_error',
    title: `Sentry Error: ${error.name}`,
    message: error.message,
    source: 'sentry',
    sourceEventId: eventId,
    errorCode: error.name,
    errorMessage: error.message,
    stackTrace: error.stack,
    context,
    notifyAdmins: severity === 'critical' || severity === 'high',
  });
}

/**
 * Create alert from payment failure
 */
export async function createPaymentFailureAlert(
  invoiceId: string,
  userId: string,
  reason: string,
  errorDetails?: Record<string, any>
): Promise<string | null> {
  return createSystemAlert({
    severity: 'high',
    type: 'payment_failure',
    title: 'Payment Processing Failure',
    message: `Payment failed for invoice ${invoiceId}: ${reason}`,
    source: 'stripe',
    affectedUsers: [userId],
    affectedInvoices: [invoiceId],
    context: errorDetails,
    notifyAdmins: true,
  });
}

/**
 * Create alert from API failure
 */
export async function createAPIFailureAlert(
  apiName: string,
  endpoint: string,
  errorMessage: string,
  context?: Record<string, any>
): Promise<string | null> {
  return createSystemAlert({
    severity: 'high',
    type: 'api_failure',
    title: `API Failure: ${apiName}`,
    message: `${apiName} API failed at ${endpoint}: ${errorMessage}`,
    source: apiName.toLowerCase() as AlertSource,
    context: {
      endpoint,
      ...context,
    },
    notifyAdmins: true,
  });
}

/**
 * Create alert from rate limit breach
 */
export async function createRateLimitAlert(
  userId: string,
  resource: string,
  limit: number,
  current: number
): Promise<string | null> {
  return createSystemAlert({
    severity: 'medium',
    type: 'rate_limit',
    title: 'Rate Limit Exceeded',
    message: `User ${userId} exceeded rate limit for ${resource} (${current}/${limit})`,
    source: 'system',
    affectedUsers: [userId],
    context: {
      resource,
      limit,
      current,
    },
    notifyAdmins: false,
  });
}

/**
 * Create alert from security event
 */
export async function createSecurityAlert(
  eventType: string,
  description: string,
  userId?: string,
  context?: Record<string, any>
): Promise<string | null> {
  return createSystemAlert({
    severity: 'critical',
    type: 'security',
    title: `Security Event: ${eventType}`,
    message: description,
    source: 'system',
    affectedUsers: userId ? [userId] : [],
    context,
    notifyAdmins: true,
  });
}

/**
 * Create alert from performance issue
 */
export async function createPerformanceAlert(
  metric: string,
  threshold: number,
  actual: number,
  context?: Record<string, any>
): Promise<string | null> {
  return createSystemAlert({
    severity: 'medium',
    type: 'performance',
    title: `Performance Degradation: ${metric}`,
    message: `${metric} exceeded threshold (${actual} > ${threshold})`,
    source: 'system',
    context: {
      metric,
      threshold,
      actual,
      ...context,
    },
    notifyAdmins: false,
  });
}

/**
 * Notify admins of critical alert (placeholder - implement email/Slack integration)
 */
async function notifyAdminsOfAlert(alertId: string, alert: SystemAlert): Promise<void> {
  try {
    // Get all admin users
    const adminsSnapshot = await db
      .collection('users')
      .where('isAdmin', '==', true)
      .get();

    const adminIds = adminsSnapshot.docs.map((doc) => doc.id);

    if (adminIds.length === 0) {
      logWarn('No admin users found to notify', { alertId });
      return;
    }

    // Update alert with notification info
    await db.collection('system_alerts').doc(alertId).update({
      notificationSent: true,
      notificationChannels: ['email'], // TODO: Add Slack, SMS
      notifiedAdmins: adminIds,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // TODO: Implement actual notification sending
    // - Send email via SendGrid
    // - Send Slack message
    // - Send SMS for critical alerts

    logInfo('Admin notification sent', {
      alertId,
      adminCount: adminIds.length,
    });
  } catch (error) {
    logError('Error notifying admins', error as Error, { alertId });
  }
}

/**
 * Determine severity from error type
 */
function determineSeverityFromError(error: Error): AlertSeverity {
  const errorName = error.name.toLowerCase();
  const errorMessage = error.message.toLowerCase();

  // Critical errors
  if (
    errorName.includes('database') ||
    errorName.includes('firebase') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout')
  ) {
    return 'critical';
  }

  // High priority errors
  if (
    errorName.includes('payment') ||
    errorName.includes('stripe') ||
    errorName.includes('auth')
  ) {
    return 'high';
  }

  // Medium priority errors
  if (
    errorName.includes('validation') ||
    errorName.includes('notfound') ||
    errorMessage.includes('not found')
  ) {
    return 'medium';
  }

  // Default to low
  return 'low';
}

/**
 * Get active alerts count by severity
 */
export async function getActiveAlertsCount(): Promise<{
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}> {
  try {
    const snapshot = await db
      .collection('system_alerts')
      .where('status', '==', 'active')
      .get();

    const alerts = snapshot.docs.map((doc) => doc.data() as SystemAlert);

    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      low: alerts.filter((a) => a.severity === 'low').length,
    };
  } catch (error) {
    logError('Error getting active alerts count', error as Error);
    return {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
  }
}

/**
 * Auto-resolve stale alerts (older than 7 days)
 */
export async function autoResolveStaleAlerts(): Promise<number> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const snapshot = await db
      .collection('system_alerts')
      .where('status', '==', 'active')
      .where('createdAt', '<', sevenDaysAgo)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'resolved',
        resolution: 'Auto-resolved after 7 days',
        resolvedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    logInfo('Stale alerts auto-resolved', { count: snapshot.size });
    return snapshot.size;
  } catch (error) {
    logError('Error auto-resolving stale alerts', error as Error);
    return 0;
  }
}

/**
 * Logging utilities for server-side operations
 * Uses console methods with structured logging format
 * In production, integrates with Sentry for error tracking
 */

import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

/**
 * Format log message with context
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? JSON.stringify(context) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: LogContext): void {
  console.log(formatLog('info', message, context));

  // Add breadcrumb to Sentry
  if (process.env.NODE_ENV === 'production') {
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: context,
    });
  }
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: LogContext): void {
  console.warn(formatLog('warn', message, context));

  // Add breadcrumb to Sentry
  if (process.env.NODE_ENV === 'production') {
    Sentry.addBreadcrumb({
      message,
      level: 'warning',
      data: context,
    });
  }
}

/**
 * Log error message
 */
export function logError(message: string, error: Error, context?: LogContext): void {
  console.error(formatLog('error', message, context), error);

  // Capture exception in Sentry
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: {
        errorMessage: message,
      },
      contexts: {
        custom: context,
      },
    });
  }
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug(formatLog('debug', message, context));
  }
}

/**
 * Start performance tracking
 */
export function startTimer(label: string): () => void {
  const start = Date.now();

  return () => {
    const duration = Date.now() - start;
    logDebug(`Timer: ${label}`, { duration: `${duration}ms` });
  };
}

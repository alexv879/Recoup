import pino from 'pino';
import * as Sentry from '@sentry/nextjs';

/**
 * Performance-aware logger with structured logging and Sentry integration
 */

// Initialize Pino logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    env: process.env.NODE_ENV,
  },
});

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  QUERY_SLOW: 1000,        // Firestore queries
  API_SLOW: 200,           // API endpoints
  EXTERNAL_API_SLOW: 2000, // External API calls
  FUNCTION_SLOW: 500,      // General functions
} as const;

interface PerformanceContext {
  operation: string;
  duration: number;
  metadata?: Record<string, any>;
  threshold?: number;
}

/**
 * Log info message
 */
export function logInfo(message: string, metadata?: Record<string, any>) {
  logger.info(metadata, message);
}

/**
 * Log error message
 */
export function logError(message: string, error?: Error | unknown, metadata?: Record<string, any>) {
  const errorInfo = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack,
  } : { error: String(error) };

  logger.error({ ...metadata, ...errorInfo }, message);

  // Send to Sentry
  if (error instanceof Error) {
    Sentry.captureException(error, {
      tags: { context: 'logger' },
      extra: metadata,
    });
  }
}

/**
 * Log warning message
 */
export function logWarn(message: string, metadata?: Record<string, any>) {
  logger.warn(metadata, message);
}

/**
 * Log database operation with performance tracking
 */
export function logDbOperation(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  const isSlowQuery = duration > PERFORMANCE_THRESHOLDS.QUERY_SLOW;

  const logData = {
    operation,
    duration,
    slow: isSlowQuery,
    ...metadata,
  };

  if (isSlowQuery) {
    logger.warn(logData, `Slow database query detected: ${operation}`);

    // Send slow query alert to Sentry
    Sentry.captureMessage(`Slow Firestore query: ${operation}`, {
      level: 'warning',
      tags: {
        type: 'slow_query',
        operation,
      },
      extra: {
        duration,
        threshold: PERFORMANCE_THRESHOLDS.QUERY_SLOW,
        ...metadata,
      },
    });
  } else {
    logger.info(logData, `Database operation: ${operation}`);
  }
}

/**
 * Log API endpoint performance
 */
export function logApiPerformance(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  metadata?: Record<string, any>
) {
  const isSlow = duration > PERFORMANCE_THRESHOLDS.API_SLOW;

  const logData = {
    endpoint,
    method,
    duration,
    statusCode,
    slow: isSlow,
    ...metadata,
  };

  if (isSlow) {
    logger.warn(logData, `Slow API endpoint: ${method} ${endpoint}`);

    Sentry.captureMessage(`Slow API endpoint: ${method} ${endpoint}`, {
      level: 'warning',
      tags: {
        type: 'slow_api',
        endpoint,
        method,
        statusCode: String(statusCode),
      },
      extra: {
        duration,
        threshold: PERFORMANCE_THRESHOLDS.API_SLOW,
        ...metadata,
      },
    });
  } else {
    logger.info(logData, `API request: ${method} ${endpoint}`);
  }
}

/**
 * Log external API call performance (Stripe, SendGrid, etc.)
 */
export function logExternalApiCall(
  service: string,
  operation: string,
  duration: number,
  success: boolean,
  metadata?: Record<string, any>
) {
  const isSlow = duration > PERFORMANCE_THRESHOLDS.EXTERNAL_API_SLOW;

  const logData = {
    service,
    operation,
    duration,
    success,
    slow: isSlow,
    ...metadata,
  };

  if (!success) {
    logger.error(logData, `External API call failed: ${service}.${operation}`);
  } else if (isSlow) {
    logger.warn(logData, `Slow external API call: ${service}.${operation}`);

    Sentry.captureMessage(`Slow external API: ${service}.${operation}`, {
      level: 'warning',
      tags: {
        type: 'slow_external_api',
        service,
        operation,
      },
      extra: {
        duration,
        threshold: PERFORMANCE_THRESHOLDS.EXTERNAL_API_SLOW,
        ...metadata,
      },
    });
  } else {
    logger.info(logData, `External API call: ${service}.${operation}`);
  }
}

/**
 * Log generic performance metric
 */
export function logPerformance(context: PerformanceContext) {
  const { operation, duration, metadata, threshold } = context;
  const effectiveThreshold = threshold || PERFORMANCE_THRESHOLDS.FUNCTION_SLOW;
  const isSlow = duration > effectiveThreshold;

  const logData = {
    operation,
    duration,
    slow: isSlow,
    threshold: effectiveThreshold,
    ...metadata,
  };

  if (isSlow) {
    logger.warn(logData, `Slow operation detected: ${operation}`);
  } else {
    logger.debug(logData, `Performance: ${operation}`);
  }
}

/**
 * Create a child logger with additional context
 */
export function createContextLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log memory usage
 */
export function logMemoryUsage(operation: string) {
  const usage = process.memoryUsage();

  logger.info({
    operation,
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
    rss: Math.round(usage.rss / 1024 / 1024),
  }, `Memory usage: ${operation}`);
}

/**
 * Log API request (backward compatibility)
 */
export function logApiRequest(method: string, endpoint: string, userId?: string) {
  logger.info({
    method,
    endpoint,
    userId,
  }, `API request: ${method} ${endpoint}`);
}

/**
 * Log API response (backward compatibility)
 */
export function logApiResponse(
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  logApiPerformance(endpoint, method, duration, statusCode, { userId });
}

export default logger;

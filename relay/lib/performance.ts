/**
 * Performance Monitoring Utilities
 *
 * Provides decorators, timing utilities, and performance tracking
 * for critical functions and API endpoints
 */

import { logInfo, logWarn, logError } from '@/utils/logger';
import * as Sentry from '@sentry/nextjs';

/**
 * Performance thresholds (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
  API_ENDPOINT: 200,        // Target: <200ms for API responses
  DATABASE_QUERY: 100,      // Warning: >100ms for DB queries
  DATABASE_QUERY_SLOW: 1000,// Alert: >1s for DB queries
  ANALYTICS_CALC: 500,      // Warning: >500ms for analytics
  CRON_JOB: 30000,         // Warning: >30s for cron jobs
  EXTERNAL_API: 2000,       // Warning: >2s for external APIs
} as const;

/**
 * Performance metrics storage
 */
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  context?: Record<string, any>;
  threshold?: number;
  isSlowQuery?: boolean;
}

/**
 * In-memory performance metrics (last 1000 operations)
 * For production, this should be sent to a monitoring service
 */
const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000;

/**
 * Store a performance metric
 */
function storeMetric(metric: PerformanceMetric) {
  performanceMetrics.push(metric);

  // Keep only last MAX_METRICS
  if (performanceMetrics.length > MAX_METRICS) {
    performanceMetrics.shift();
  }

  // Send to Sentry if slow
  if (metric.threshold && metric.duration > metric.threshold) {
    Sentry.metrics.distribution(`performance.${metric.name}`, metric.duration, {
      unit: 'millisecond',
      tags: {
        exceeded_threshold: 'true',
        ...metric.context,
      },
    });

    // Alert if critically slow
    if (metric.isSlowQuery) {
      logWarn(`SLOW QUERY DETECTED: ${metric.name} took ${metric.duration}ms`, {
        metric,
      });
    }
  }
}

/**
 * Get performance metrics summary
 */
export function getPerformanceMetrics(name?: string): {
  count: number;
  avgDuration: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  slowQueries: number;
} {
  const filtered = name
    ? performanceMetrics.filter(m => m.name === name)
    : performanceMetrics;

  if (filtered.length === 0) {
    return {
      count: 0,
      avgDuration: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      max: 0,
      slowQueries: 0,
    };
  }

  const durations = filtered.map(m => m.duration).sort((a, b) => a - b);
  const sum = durations.reduce((acc, d) => acc + d, 0);

  return {
    count: filtered.length,
    avgDuration: Math.round(sum / filtered.length),
    p50: durations[Math.floor(filtered.length * 0.5)] || 0,
    p95: durations[Math.floor(filtered.length * 0.95)] || 0,
    p99: durations[Math.floor(filtered.length * 0.99)] || 0,
    max: durations[durations.length - 1] || 0,
    slowQueries: filtered.filter(m => m.isSlowQuery).length,
  };
}

/**
 * Performance timing decorator for functions
 *
 * Usage:
 * @withPerformanceTiming('functionName', PERFORMANCE_THRESHOLDS.DATABASE_QUERY)
 * async function myFunction() { ... }
 */
export function withPerformanceTiming<T extends (...args: any[]) => Promise<any>>(
  name: string,
  threshold?: number,
  context?: Record<string, any>
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // Store metric
        const metric: PerformanceMetric = {
          name: `${name}.${propertyKey}`,
          duration,
          timestamp: Date.now(),
          context,
          threshold,
          isSlowQuery: threshold ? duration > PERFORMANCE_THRESHOLDS.DATABASE_QUERY_SLOW : false,
        };

        storeMetric(metric);

        // Log if exceeds threshold
        if (threshold && duration > threshold) {
          logWarn(`Performance warning: ${name}.${propertyKey} took ${duration}ms (threshold: ${threshold}ms)`, {
            duration,
            threshold,
            context,
          });
        } else {
          logInfo(`Performance: ${name}.${propertyKey} completed in ${duration}ms`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logError(`Performance tracking failed for ${name}.${propertyKey}`, error as Error, {
          duration,
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Measure performance of a function manually
 *
 * Usage:
 * const result = await measurePerformance('operationName', async () => {
 *   // your code here
 * }, { userId: '123' });
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, any>,
  threshold?: number
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      context,
      threshold,
      isSlowQuery: threshold ? duration > PERFORMANCE_THRESHOLDS.DATABASE_QUERY_SLOW : false,
    };

    storeMetric(metric);

    // Log performance
    if (threshold && duration > threshold) {
      logWarn(`SLOW: ${name} took ${duration}ms (threshold: ${threshold}ms)`, {
        duration,
        threshold,
        context,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`Performance tracking failed for ${name}`, error as Error, {
      duration,
      context,
    });
    throw error;
  }
}

/**
 * Measure database query performance
 */
export async function measureQuery<T>(
  queryName: string,
  collection: string,
  userId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  return measurePerformance(
    `db.${collection}.${queryName}`,
    fn,
    { collection, userId },
    PERFORMANCE_THRESHOLDS.DATABASE_QUERY
  );
}

/**
 * Measure external API call performance
 */
export async function measureExternalApi<T>(
  apiName: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  return measurePerformance(
    `external.${apiName}`,
    fn,
    { endpoint },
    PERFORMANCE_THRESHOLDS.EXTERNAL_API
  );
}

/**
 * Create a performance timer (for manual timing)
 */
export class PerformanceTimer {
  private startTime: number;
  private checkpoints: Map<string, number> = new Map();

  constructor(private name: string, private context?: Record<string, any>) {
    this.startTime = Date.now();
  }

  /**
   * Add a checkpoint
   */
  checkpoint(name: string) {
    const duration = Date.now() - this.startTime;
    this.checkpoints.set(name, duration);
    logInfo(`${this.name} checkpoint: ${name} at ${duration}ms`);
  }

  /**
   * End timing and store metric
   */
  end(threshold?: number): number {
    const duration = Date.now() - this.startTime;

    const metric: PerformanceMetric = {
      name: this.name,
      duration,
      timestamp: Date.now(),
      context: {
        ...this.context,
        checkpoints: Object.fromEntries(this.checkpoints),
      },
      threshold,
      isSlowQuery: threshold ? duration > PERFORMANCE_THRESHOLDS.DATABASE_QUERY_SLOW : false,
    };

    storeMetric(metric);

    if (threshold && duration > threshold) {
      logWarn(`${this.name} exceeded threshold: ${duration}ms > ${threshold}ms`, {
        checkpoints: Object.fromEntries(this.checkpoints),
      });
    }

    return duration;
  }
}

/**
 * Track API endpoint performance
 */
export function trackApiPerformance(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  const metric: PerformanceMetric = {
    name: `api.${method}.${path}`,
    duration,
    timestamp: Date.now(),
    context: {
      method,
      path,
      statusCode,
      userId,
    },
    threshold: PERFORMANCE_THRESHOLDS.API_ENDPOINT,
    isSlowQuery: duration > PERFORMANCE_THRESHOLDS.API_ENDPOINT,
  };

  storeMetric(metric);

  // Send to Sentry
  Sentry.metrics.distribution('api.response_time', duration, {
    unit: 'millisecond',
    tags: {
      method,
      path,
      status: statusCode.toString(),
    },
  });

  // Log if slow
  if (duration > PERFORMANCE_THRESHOLDS.API_ENDPOINT) {
    logWarn(`Slow API response: ${method} ${path} took ${duration}ms`, {
      statusCode,
      userId,
    });
  }
}

/**
 * Batch operation performance tracker
 */
export class BatchPerformanceTracker {
  private items: number = 0;
  private startTime: number = Date.now();
  private errors: number = 0;

  constructor(private operationName: string) {}

  /**
   * Increment processed items
   */
  increment() {
    this.items++;
  }

  /**
   * Increment errors
   */
  error() {
    this.errors++;
  }

  /**
   * Get summary
   */
  getSummary(): {
    operationName: string;
    itemsProcessed: number;
    errors: number;
    duration: number;
    itemsPerSecond: number;
  } {
    const duration = Date.now() - this.startTime;
    const itemsPerSecond = duration > 0 ? (this.items / duration) * 1000 : 0;

    return {
      operationName: this.operationName,
      itemsProcessed: this.items,
      errors: this.errors,
      duration,
      itemsPerSecond: Math.round(itemsPerSecond * 100) / 100,
    };
  }

  /**
   * Log summary
   */
  logSummary() {
    const summary = this.getSummary();
    logInfo(`Batch operation completed: ${this.operationName}`, summary);

    // Send to Sentry
    Sentry.metrics.gauge(`batch.${this.operationName}.items`, summary.itemsProcessed);
    Sentry.metrics.gauge(`batch.${this.operationName}.errors`, summary.errors);
    Sentry.metrics.distribution(`batch.${this.operationName}.duration`, summary.duration, {
      unit: 'millisecond',
    });
  }
}

/**
 * Memory usage tracker
 */
export function getMemoryUsage(): {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
} {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
    };
  }
  return { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
}

/**
 * Log memory usage
 */
export function logMemoryUsage(context?: string) {
  const memory = getMemoryUsage();
  logInfo(`Memory usage${context ? ` (${context})` : ''}`, memory);

  // Send to Sentry
  Sentry.metrics.gauge('memory.heap_used', memory.heapUsed, {
    unit: 'megabyte',
  });
}

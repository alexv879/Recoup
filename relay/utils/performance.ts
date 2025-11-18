import * as Sentry from '@sentry/nextjs';
import { logPerformance, logDbOperation, logExternalApiCall, PERFORMANCE_THRESHOLDS } from './logger';

/**
 * Performance monitoring utilities and decorators
 */

interface TimerResult {
  duration: number;
  result: any;
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => Promise<T> | T,
  operation: string,
  metadata?: Record<string, any>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    logPerformance({
      operation,
      duration,
      metadata,
    });

    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;

    logPerformance({
      operation: `${operation} (failed)`,
      duration,
      metadata: { ...metadata, error: true },
    });

    throw error;
  }
}

/**
 * Performance decorator for class methods
 * Usage:
 * @withPerformanceTracking('operationName')
 * async myMethod() { ... }
 */
export function withPerformanceTracking(operationName: string, threshold?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const transaction = Sentry.startTransaction({
        op: operationName,
        name: `${target.constructor.name}.${propertyKey}`,
      });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        logPerformance({
          operation: operationName,
          duration,
          threshold,
          metadata: {
            class: target.constructor.name,
            method: propertyKey,
          },
        });

        transaction.setStatus('ok');
        transaction.finish();

        return result;
      } catch (error) {
        transaction.setStatus('internal_error');
        transaction.finish();
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for tracking database operations
 */
export function withDbTracking(collectionName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const operationName = `${collectionName}.${propertyKey}`;

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        logDbOperation(operationName, duration, {
          collection: collectionName,
          method: propertyKey,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logDbOperation(`${operationName} (failed)`, duration, {
          collection: collectionName,
          method: propertyKey,
          error: true,
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for tracking external API calls
 */
export function withExternalApiTracking(serviceName: string) {
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

        logExternalApiCall(serviceName, propertyKey, duration, true);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logExternalApiCall(serviceName, propertyKey, duration, false, {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Batch processing utility with progress tracking
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    concurrency?: number;
    onProgress?: (processed: number, total: number) => void;
    operationName?: string;
  } = {}
): Promise<R[]> {
  const {
    batchSize = 100,
    concurrency = 5,
    onProgress,
    operationName = 'batch-processing',
  } = options;

  const startTime = Date.now();
  const results: R[] = [];
  let processed = 0;

  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Process batch with concurrency limit
    const batchResults = await Promise.all(
      chunk(batch, concurrency).map(async (chunk) => {
        return Promise.all(
          chunk.map(async (item) => {
            const result = await processor(item);
            processed++;
            if (onProgress) {
              onProgress(processed, items.length);
            }
            return result;
          })
        );
      })
    );

    results.push(...batchResults.flat());
  }

  const duration = Date.now() - startTime;

  logPerformance({
    operation: operationName,
    duration,
    metadata: {
      totalItems: items.length,
      batchSize,
      concurrency,
      itemsPerSecond: Math.round((items.length / duration) * 1000),
    },
  });

  return results;
}

/**
 * Helper to chunk array into smaller arrays
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    operationName = 'retry-operation',
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;

      logPerformance({
        operation: `${operationName} (attempt ${attempt + 1})`,
        duration,
        metadata: {
          attempt: attempt + 1,
          success: true,
        },
      });

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        logPerformance({
          operation: `${operationName} (retry ${attempt + 1})`,
          duration: 0,
          metadata: {
            attempt: attempt + 1,
            nextDelay: delay,
            error: lastError.message,
          },
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Cache wrapper with performance tracking
 */
export class PerformanceCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private hits = 0;
  private misses = 0;

  constructor(
    private name: string,
    private ttl: number = 300000 // 5 minutes default
  ) {}

  async get(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.ttl) {
      this.hits++;
      return cached.value;
    }

    this.misses++;

    const startTime = Date.now();
    const value = await fetcher();
    const duration = Date.now() - startTime;

    this.cache.set(key, { value, timestamp: now });

    logPerformance({
      operation: `cache-${this.name}`,
      duration,
      metadata: {
        key,
        cached: false,
        hitRate: this.getHitRate(),
      },
    });

    return value;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: this.getHitRate(),
    };
  }

  private getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Monitor memory usage during operation
 */
export async function withMemoryMonitoring<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> {
  const before = process.memoryUsage();

  const result = await fn();

  const after = process.memoryUsage();
  const heapDelta = Math.round((after.heapUsed - before.heapUsed) / 1024 / 1024);

  if (Math.abs(heapDelta) > 10) {
    // Log if memory change > 10MB
    logPerformance({
      operation: `${operationName} (memory)`,
      duration: 0,
      metadata: {
        heapDelta,
        heapUsed: Math.round(after.heapUsed / 1024 / 1024),
        heapTotal: Math.round(after.heapTotal / 1024 / 1024),
      },
    });
  }

  return result;
}

/**
 * Create a performance span for Sentry
 */
export function createPerformanceSpan(operation: string, description?: string) {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();

  if (transaction) {
    return transaction.startChild({
      op: operation,
      description: description || operation,
    });
  }

  return null;
}

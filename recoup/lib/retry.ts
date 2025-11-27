/**
 * Retry Logic with Exponential Backoff
 * Makes external API calls more reliable
 */

import { logger } from '../utils/logger';

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
  retryableStatusCodes?: number[];
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'EPIPE',
    'EHOSTUNREACH',
  ],
  retryableStatusCodes: [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ],
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const {
    maxRetries,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    retryableErrors,
    retryableStatusCodes,
    onRetry,
  } = opts;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      const isRetryable = isErrorRetryable(
        lastError,
        retryableErrors,
        retryableStatusCodes
      );

      if (!isRetryable || attempt === maxRetries) {
        // Don't retry
        logger.warn('Request failed (not retrying)', {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          error: lastError.message,
          isRetryable,
        });
        throw lastError;
      }

      // Calculate jittered delay to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay; // ±30% jitter
      const actualDelay = delay + jitter;

      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(actualDelay)}ms`, {
        error: lastError.message,
      });

      // Call onRetry callback
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      // Wait before retrying
      await sleep(actualDelay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Check if an error is retryable
 */
function isErrorRetryable(
  error: Error,
  retryableErrors?: string[],
  retryableStatusCodes?: number[]
): boolean {
  // Check error code (e.g., ECONNRESET)
  const errorCode = (error as any).code;
  if (errorCode && retryableErrors?.includes(errorCode)) {
    return true;
  }

  // Check HTTP status code
  const statusCode = (error as any).status || (error as any).statusCode;
  if (statusCode && retryableStatusCodes?.includes(statusCode)) {
    return true;
  }

  // Check error message
  const message = error.message.toLowerCase();
  if (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('socket hang up')
  ) {
    return true;
  }

  return false;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with different strategies based on operation type
 */
export async function retryAIOperation<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    initialDelay: 2000, // AI operations can be slow
    maxDelay: 16000,
    backoffMultiplier: 2,
  });
}

export async function retryDatabaseOperation<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries: 5,
    initialDelay: 500, // Fast retries for database
    maxDelay: 5000,
    backoffMultiplier: 1.5,
  });
}

export async function retryExternalAPI<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  });
}

/**
 * Circuit Breaker Pattern
 * Prevents cascading failures when a service is down
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private successCount = 0;

  constructor(
    private failureThreshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000, // 30 seconds
    private halfOpenSuccessThreshold: number = 2
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime!.getTime();

      if (timeSinceLastFailure > this.resetTimeout) {
        logger.info('Circuit breaker transitioning to HALF_OPEN', {
          failures: this.failures,
          timeSinceLastFailure,
        });
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker is OPEN. Service unavailable.`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.successCount++;

    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        logger.info('Circuit breaker transitioning to CLOSED', {
          successCount: this.successCount,
        });
        this.state = 'CLOSED';
        this.failures = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = new Date();
    this.successCount = 0;

    if (this.state === 'HALF_OPEN') {
      logger.warn('Circuit breaker opening from HALF_OPEN', {
        failures: this.failures,
      });
      this.state = 'OPEN';
    } else if (this.failures >= this.failureThreshold) {
      logger.error('Circuit breaker opened', {
        failures: this.failures,
        threshold: this.failureThreshold,
      });
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.failures = 0;
    this.successCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = undefined;
    logger.info('Circuit breaker manually reset');
  }
}

// Create circuit breakers for external services
export const hmrcCircuitBreaker = new CircuitBreaker(5, 60000, 30000);
export const geminiCircuitBreaker = new CircuitBreaker(5, 60000, 30000);
export const claudeCircuitBreaker = new CircuitBreaker(5, 60000, 30000);
export const openaiCircuitBreaker = new CircuitBreaker(5, 60000, 30000);

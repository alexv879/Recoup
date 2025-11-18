/**
 * [SECURITY FIX] Centralized Error Handling Utility
 *
 * Provides standardized error classes and error handling middleware
 *
 * Security Features:
 * - Prevents stack trace leakage in production
 * - Sanitizes error messages to prevent info disclosure
 * - Logs errors securely without exposing sensitive data
 * - Type-safe error handling with custom error classes
 *
 * SECURITY AUDIT FIX: CRITICAL-4
 * Issue: Missing error utility causing import failures across codebase
 * Fix: Implement comprehensive error handling with security best practices
 */

import { NextResponse } from 'next/server';
import { logError } from './logger';

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(process.env.NODE_ENV !== 'production' && { details: this.details }),
    };
  }
}

/**
 * Custom error classes for different scenarios
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message: string = 'Payment required', details?: any) {
    super(message, 402, 'PAYMENT_REQUIRED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * [SECURITY FIX] Error factory with standardized messages
 * Prevents information leakage through error messages
 */
export const errors = {
  // 400 Bad Request
  badRequest: (message: string = 'Bad request', details?: any) =>
    new ValidationError(message, details),

  validation: (message: string, details?: any) =>
    new ValidationError(message, details),

  // 401 Unauthorized
  unauthorized: (message?: string) => new UnauthorizedError(message),

  // 402 Payment Required
  paymentRequired: (message?: string, details?: any) =>
    new PaymentRequiredError(message, details),

  // 403 Forbidden
  forbidden: (message?: string) => new ForbiddenError(message),

  // 404 Not Found
  notFound: (message?: string) => new NotFoundError(message),

  // 409 Conflict
  conflict: (message?: string) => new ConflictError(message),

  // 429 Rate Limit
  rateLimit: (message?: string, details?: any) =>
    new RateLimitError(message, details),

  // 500 Internal Server Error
  internal: (message?: string, details?: any) =>
    new InternalServerError(message, details),

  // 503 Service Unavailable
  serviceUnavailable: (message?: string) =>
    new ServiceUnavailableError(message),
};

/**
 * [SECURITY FIX] Safe error message sanitization
 * Prevents stack trace and sensitive data leakage in production
 */
function sanitizeErrorForClient(error: any): {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
} {
  // Known error types - safe to send to client
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      // Only include details in development
      ...(process.env.NODE_ENV !== 'production' && { details: error.details }),
    };
  }

  // Zod validation errors
  if (error.name === 'ZodError') {
    return {
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      ...(process.env.NODE_ENV !== 'production' && { details: error.issues }),
    };
  }

  // Firestore errors
  if (error.code && error.code.startsWith('firestore/')) {
    return {
      message: 'Database error',
      code: 'DATABASE_ERROR',
      statusCode: 500,
    };
  }

  // Stripe errors
  if (error.type && error.type.startsWith('Stripe')) {
    return {
      message: 'Payment processing error',
      code: 'PAYMENT_ERROR',
      statusCode: 402,
    };
  }

  // Clerk errors
  if (error.clerkError) {
    return {
      message: 'Authentication error',
      code: 'AUTH_ERROR',
      statusCode: 401,
    };
  }

  // [SECURITY FIX] Default: Don't leak internal errors
  return {
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };
}

/**
 * [SECURITY FIX] API Error Handler
 * Centralized error handling for API routes
 *
 * Security features:
 * - Prevents stack trace leakage
 * - Logs errors securely
 * - Returns safe error responses
 */
export function handleApiError(
  error: any,
  method?: string,
  path?: string
): NextResponse {
  // [SECURITY FIX] Log error securely (redacts sensitive data)
  logError(
    `API error${path ? ` on ${method} ${path}` : ''}`,
    error instanceof Error ? error : new Error(String(error)),
    {
      ...(error instanceof AppError && { errorCode: error.code }),
      statusCode: error.statusCode || 500,
    }
  );

  // [SECURITY FIX] Sanitize error for client response
  const safeError = sanitizeErrorForClient(error);

  // Return JSON error response
  return NextResponse.json(
    {
      error: safeError.message,
      code: safeError.code,
      ...(safeError.details && { details: safeError.details }),
    },
    { status: safeError.statusCode }
  );
}

/**
 * [SECURITY FIX] Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      throw error; // Let handleApiError handle it
    }
  };
}

/**
 * [SECURITY FIX] Assert condition or throw error
 * Useful for runtime type checking
 */
export function assert(
  condition: any,
  message: string = 'Assertion failed'
): asserts condition {
  if (!condition) {
    throw new ValidationError(message);
  }
}

/**
 * Custom error classes and error handling utilities
 * Provides consistent error responses across the API
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(401, message, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(403, message, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(404, message, 'NOT_FOUND', details);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(402, message, 'PAYMENT_REQUIRED', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(409, message, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(429, message, 'RATE_LIMIT_EXCEEDED', details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(500, message, 'INTERNAL_SERVER_ERROR', details);
  }
}

/**
 * Error factory object for creating errors
 */
export const errors = {
  badRequest: (message: string, details?: Record<string, any>) =>
    new BadRequestError(message, details),

  unauthorized: (message: string, details?: Record<string, any>) =>
    new UnauthorizedError(message, details),

  forbidden: (message: string, details?: Record<string, any>) =>
    new ForbiddenError(message, details),

  notFound: (message: string, details?: Record<string, any>) =>
    new NotFoundError(message, details),

  paymentRequired: (message: string, details?: Record<string, any>) =>
    new PaymentRequiredError(message, details),

  conflict: (message: string, details?: Record<string, any>) =>
    new ConflictError(message, details),

  rateLimit: (message: string, details?: Record<string, any>) =>
    new RateLimitError(message, details),

  internal: (message: string, details?: Record<string, any>) =>
    new InternalServerError(message, details),
};

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: Record<string, any>;
  };
} {
  if (isAppError(error)) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      },
    };
  }

  // Unknown error - return generic 500
  return {
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
    },
  };
}

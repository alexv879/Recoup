/**
 * Request/Response Validation Middleware
 * Provides validation utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { logError } from '@/utils/logger';

/**
 * Validation error response
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate request body against a Zod schema
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: ValidationError[] }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors: ValidationError[] = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }

    return { success: true, data: result.data };
  } catch (error) {
    logError('Request body validation failed', error);
    return {
      success: false,
      errors: [{ field: 'body', message: 'Invalid JSON in request body' }],
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const result = schema.safeParse(params);

    if (!result.success) {
      const errors: ValidationError[] = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }

    return { success: true, data: result.data };
  } catch (error) {
    logError('Query parameter validation failed', error);
    return {
      success: false,
      errors: [{ field: 'query', message: 'Invalid query parameters' }],
    };
  }
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(errors: ValidationError[]): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: errors,
    },
    { status: 400 }
  );
}

/**
 * Higher-order function to wrap API route handlers with validation
 */
export function withValidation<TBody = unknown, TQuery = unknown>(
  handler: (
    req: NextRequest,
    context: { body?: TBody; query?: TQuery; params?: Record<string, string> }
  ) => Promise<NextResponse>,
  options: {
    bodySchema?: ZodSchema<TBody>;
    querySchema?: ZodSchema<TQuery>;
  } = {}
) {
  return async (
    req: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      // Validate body if schema provided
      let body: TBody | undefined;
      if (options.bodySchema && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyValidation = await validateRequestBody(req, options.bodySchema);
        if (!bodyValidation.success) {
          return validationErrorResponse(bodyValidation.errors);
        }
        body = bodyValidation.data;
      }

      // Validate query parameters if schema provided
      let query: TQuery | undefined;
      if (options.querySchema) {
        const queryValidation = validateQueryParams(req, options.querySchema);
        if (!queryValidation.success) {
          return validationErrorResponse(queryValidation.errors);
        }
        query = queryValidation.data;
      }

      // Call the handler with validated data
      return await handler(req, {
        body,
        query,
        params: context?.params,
      });
    } catch (error) {
      logError('Request handler failed', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
  /** UUID v4 validation */
  uuid: z.string().uuid(),

  /** Email validation */
  email: z.string().email(),

  /** Positive integer */
  positiveInt: z.number().int().positive(),

  /** Non-negative integer */
  nonNegativeInt: z.number().int().min(0),

  /** ISO date string */
  isoDate: z.string().datetime(),

  /** UK postcode */
  ukPostcode: z.string().regex(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i),

  /** Phone number (basic) */
  phoneNumber: z.string().regex(/^\+?[\d\s()-]+$/),

  /** Pagination parameters */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),

  /** Sort parameters */
  sort: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
};

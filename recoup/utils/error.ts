import { logger } from './logger';
import { ZodError } from 'zod';

export class CustomError extends Error {
    constructor(
        public code: string,
        message: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'CustomError';
    }
}

export class ValidationError extends CustomError {
    constructor(message: string) {
        super('VALIDATION_ERROR', message, 400);
    }
}

export class UnauthorizedError extends CustomError {
    constructor(message: string = 'Unauthorized') {
        super('UNAUTHORIZED', message, 401);
    }
}

export class ForbiddenError extends CustomError {
    constructor(message: string = 'Forbidden') {
        super('FORBIDDEN', message, 403);
    }
}

export class NotFoundError extends CustomError {
    constructor(message: string = 'Not found') {
        super('NOT_FOUND', message, 404);
    }
}

export class BadRequestError extends CustomError {
    constructor(message: string = 'Bad request') {
        super('BAD_REQUEST', message, 400);
    }
}

export class RateLimitError extends CustomError {
    constructor(message: string = 'Rate limit exceeded') {
        super('RATE_LIMIT', message, 429);
    }
}

// Error constants for API responses
export const errors = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export async function handleError(error: unknown) {
    if (error instanceof ZodError) {
        const fieldErrors = error.errors.reduce((acc, e) => {
            const field = e.path.join('.');
            acc[field] = e.message;
            return acc;
        }, {} as Record<string, string>);

        return {
            status: 400,
            body: {
                error: 'VALIDATION_ERROR',
                message: 'The request body is invalid.',
                fields: fieldErrors,
            },
        };
    }

    if (error instanceof CustomError) {
        return {
            status: error.statusCode,
            body: {
                error: error.code,
                message: error.message,
            },
        };
    }

    // Log the unexpected error for debugging purposes
    logger.error({ err: error }, 'An unknown error occurred in handleError');

    return {
        status: 500,
        body: {
            error: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
        },
    };
}

// Alias for handleError to match expected API naming
export const handleApiError = handleError;
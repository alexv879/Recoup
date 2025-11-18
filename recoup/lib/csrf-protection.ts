/**
 * CSRF Protection Utilities
 * Provides validation for webhook origins and content types
 */

import { NextRequest } from 'next/server';

/**
 * Validate webhook origin for security
 */
export function validateWebhookOrigin(request: NextRequest, allowedOrigins: string[] = []): boolean {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // Default allowed origins for common webhook providers
    const defaultOrigins = [
        'https://api.twilio.com',
        'https://hooks.slack.com',
        'https://api.sendgrid.com',
        'https://api.stripe.com',
        'https://webhook.site', // For testing
    ];

    const allAllowedOrigins = [...defaultOrigins, ...allowedOrigins];

    // Check origin header
    if (origin && allAllowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return true;
    }

    // Check referer header (fallback)
    if (referer && allAllowedOrigins.some(allowed => referer.startsWith(allowed))) {
        return true;
    }

    return false;
}

/**
 * Validate content type for webhook requests
 */
export function validateContentType(request: NextRequest, expectedTypes: string[] = ['application/json', 'application/x-www-form-urlencoded']): boolean {
    const contentType = request.headers.get('content-type');

    if (!contentType) {
        return false;
    }

    return expectedTypes.some(expected => contentType.includes(expected));
}
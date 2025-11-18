// =============================================================================
// Sentry Configuration - Server-Side Error Tracking
// =============================================================================
// This configuration captures and reports server-side errors from Next.js
// API routes, serverless functions, and backend operations.
//
// Environment: Node.js/Server-Side
// Purpose: Track API errors, database failures, integration issues
// =============================================================================

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.APP_VERSION || 'unknown';

// Only initialize Sentry in production with valid DSN
if (SENTRY_DSN && ENVIRONMENT === 'production') {
    Sentry.init({
        // Data Source Name - unique identifier for your Sentry project
        dsn: SENTRY_DSN,

        // Environment name (production, staging, development)
        environment: ENVIRONMENT,

        // Release version for tracking which code version caused errors
        release: RELEASE,

        // ==========================================================================
        // SAMPLING CONFIGURATION
        // ==========================================================================

        // Percentage of transactions to capture (lower in production)
        tracesSampleRate: 0.2, // 20% of transactions

        // Profiling for performance insights
        profilesSampleRate: 0.1, // 10% of profiled transactions

        // ==========================================================================
        // ERROR FILTERING
        // ==========================================================================

        // Ignore expected errors and noise
        ignoreErrors: [
            // Expected validation errors (handled by business logic)
            'ValidationError',
            'Bad Request',

            // User auth errors (expected behavior)
            'Unauthorized',
            'Forbidden',

            // Rate limiting (expected protection)
            'Rate limit exceeded',
            'Too many requests',

            // Webhook verification failures (could be malicious)
            'Webhook signature verification failed',

            // Network timeouts (transient issues)
            'ETIMEDOUT',
            'ECONNRESET',
            'ECONNREFUSED',
        ],

        // ==========================================================================
        // DATA SCRUBBING & PRIVACY (CRITICAL)
        // ==========================================================================

        // Remove sensitive data before sending to Sentry
        beforeSend(event, _hint) {
            // Redact environment variables (secrets could leak in error messages)
            if (event.contexts?.runtime?.name === 'node') {
                delete event.contexts.runtime.env;
            }

            // Scrub sensitive request data
            if (event.request) {
                // Remove authorization headers
                if (event.request.headers) {
                    delete event.request.headers['Authorization'];
                    delete event.request.headers['Cookie'];
                    delete event.request.headers['X-API-Key'];
                    delete event.request.headers['X-Clerk-Auth'];
                }

                // Remove sensitive query params
                if (event.request.query_string) {
                    const sensitiveParams = ['token', 'key', 'secret', 'apiKey'];
                    sensitiveParams.forEach(param => {
                        if (event.request && typeof event.request.query_string === 'string') {
                            event.request.query_string = event.request.query_string.replace(
                                new RegExp(`${param}=[^&]*`, 'gi'),
                                `${param}=[REDACTED]`
                            );
                        }
                    });
                }

                // Scrub request body (payment details, bank info)
                if (event.request.data) {
                    const sensitiveKeys = [
                        'password',
                        'accountNumber',
                        'sortCode',
                        'cardNumber',
                        'cvv',
                        'token',
                        'secret',
                        'apiKey',
                        'privateKey',
                        'bankDetails',
                    ];

                    if (event.request && event.request.data && typeof event.request.data === 'object') {
                        sensitiveKeys.forEach(key => {
                            if ((event.request!.data as Record<string, any>)[key]) {
                                (event.request!.data as Record<string, any>)[key] = '[REDACTED]';
                            }
                        });
                    }
                }
            }

            // Redact error messages containing sensitive patterns
            if (event.message) {
                // Redact email addresses
                event.message = event.message.replace(
                    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
                    '[EMAIL_REDACTED]'
                );

                // Redact API keys
                event.message = event.message.replace(
                    /sk_[a-zA-Z0-9_]+/g,
                    'sk_[REDACTED]'
                );

                // Redact tokens
                event.message = event.message.replace(
                    /[a-f0-9]{32,}/g,
                    '[TOKEN_REDACTED]'
                );
            }

            return event;
        },

        // ==========================================================================
        // INTEGRATIONS
        // ==========================================================================

        integrations: [
            // HTTP request tracing
            Sentry.httpIntegration({
                // Don't capture request/response bodies (could contain sensitive data)
                breadcrumbs: true,
            }),

            // Console log breadcrumbs
            Sentry.consoleIntegration({
                levels: ['error', 'warn'],
            }),

        ],

        // ==========================================================================
        // PERFORMANCE MONITORING
        // ==========================================================================

        // Custom sampling for different routes
        tracesSampler: (samplingContext) => {
            // Always trace payment and webhook endpoints (critical paths)
            const criticalPaths = [
                '/api/payment',
                '/api/webhook',
                '/api/invoices',
                '/api/payment-confirmations',
            ];

            if (criticalPaths.some(path =>
                samplingContext.transactionContext.name?.includes(path)
            )) {
                return 1.0; // 100% sampling for critical paths
            }

            // Lower sampling for health checks
            if (samplingContext.transactionContext.name?.includes('/api/health')) {
                return 0.01; // 1% sampling
            }

            // Default sampling for other routes
            return 0.2; // 20%
        },
    });

    // Set global tags
    Sentry.setTag('runtime', 'node');
    Sentry.setTag('app', 'recoup-server');

    // Set global context
    Sentry.setContext('server', {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
    });

    console.log('[Sentry] Server-side error tracking initialized');
} else {
    console.log('[Sentry] Skipped in development or missing DSN');
}

// =============================================================================
// Sentry Configuration - Client-Side Error Tracking
// =============================================================================
// This configuration captures and reports client-side errors, performance
// metrics, and user interactions to Sentry for production monitoring.
//
// Environment: Browser/Client-Side
// Purpose: Track React errors, API failures, performance issues
// =============================================================================

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';

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

        // Percentage of errors to capture (1.0 = 100%, 0.5 = 50%)
        // Lower in production to reduce noise and costs
        tracesSampleRate: 0.1, // 10% of transactions

        // Sample rate for profiling (requires additional setup)
        profilesSampleRate: 0.1, // 10% of profiled transactions

        // Percentage of user sessions to track for replay debugging
        replaysSessionSampleRate: 0.1, // 10% of sessions

        // Capture 100% of sessions with errors for debugging
        replaysOnErrorSampleRate: 1.0,

        // ==========================================================================
        // ERROR FILTERING
        // ==========================================================================

        // Ignore common non-actionable errors
        ignoreErrors: [
            // Browser extensions injecting code
            'top.GLOBALS',
            'fb_xd_fragment',

            // Network errors (user's connection issue)
            'NetworkError',
            'Network request failed',
            'Failed to fetch',

            // User cancellations (not bugs)
            'AbortError',
            'The operation was aborted',

            // Browser navigation errors
            'NavigationDuplicated',
            'Non-Error promise rejection captured',

            // Third-party script errors
            /^Script error\.?$/,
            /^Javascript error: Script error\.? on line 0$/,

            // Clerk SDK expected errors
            /clerk/i,

            // ResizeObserver loop errors (benign)
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
        ],

        // Filter out errors from specific domains (third-party scripts)
        denyUrls: [
            // Browser extensions
            /extensions\//i,
            /^chrome:\/\//i,
            /^moz-extension:\/\//i,

            // CDN errors from third parties
            /^https?:\/\/([^/]+\.)?(googleapis|gstatic|google-analytics|googletagmanager)\./i,
        ],

        // ==========================================================================
        // DATA SCRUBBING & PRIVACY
        // ==========================================================================

        // Remove sensitive data before sending to Sentry
        beforeSend(event, hint) {
            // Remove query strings that might contain tokens
            if (event.request?.url) {
                try {
                    const url = new URL(event.request.url);
                    url.search = ''; // Remove query params
                    event.request.url = url.toString();
                } catch (e) {
                    // Invalid URL, leave as is
                }
            }

            // Remove sensitive headers
            if (event.request?.headers) {
                delete event.request.headers['Authorization'];
                delete event.request.headers['Cookie'];
                delete event.request.headers['X-CSRF-Token'];
            }

            // Remove sensitive form data
            if (event.request?.data) {
                const sensitiveKeys = [
                    'password',
                    'accountNumber',
                    'sortCode',
                    'token',
                    'secret',
                    'apiKey',
                ];

                sensitiveKeys.forEach(key => {
                    if (event.request && event.request.data && typeof event.request.data === 'object' && (event.request.data as Record<string, any>)[key]) {
                        (event.request.data as Record<string, any>)[key] = '[REDACTED]';
                    }
                });
            }

            return event;
        },

        // ==========================================================================
        // INTEGRATIONS
        // ==========================================================================

        integrations: [
            // Capture user interactions (clicks, navigations)
            Sentry.browserTracingIntegration(),

            // Session replay for debugging (videos of user sessions with errors)
            Sentry.replayIntegration({
                // Don't record sensitive input fields
                maskAllText: false,
                maskAllInputs: true,
                blockAllMedia: false,

                // Network details for debugging API calls
                networkDetailAllowUrls: [
                    /^https:\/\/recoup\.app\/api/,
                    /^https:\/\/.*\.vercel\.app\/api/,
                ],

                // Redact sensitive network data
                networkCaptureBodies: false,
            }),

            // Capture unhandled promise rejections
            Sentry.browserProfilingIntegration(),
        ],

        // ==========================================================================
        // PERFORMANCE MONITORING
        // ==========================================================================

        // Track slow transactions
        tracesSampler: (samplingContext) => {
            // Sample 100% of critical paths
            if (samplingContext.transactionContext.name?.includes('/api/payment')) {
                return 1.0;
            }

            if (samplingContext.transactionContext.name?.includes('/api/invoice')) {
                return 1.0;
            }

            // Sample 10% of other requests
            return 0.1;
        },
    });

    // Set global context (available in all error reports)
    Sentry.setContext('app', {
        name: 'Recoup',
        version: RELEASE,
        environment: ENVIRONMENT,
    });

    console.log('[Sentry] Client-side error tracking initialized');
} else {
    console.log('[Sentry] Skipped in development or missing DSN');
}

/**
 * Next.js Instrumentation File
 *
 * This file is automatically called by Next.js when the server starts.
 * Use it for:
 * - Initializing monitoring tools (Sentry, OpenTelemetry)
 * - Setting up global error handlers
 * - Registering performance monitoring
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import Sentry server configuration
    await import('./sentry.server.config');

    console.log('[Instrumentation] Server monitoring initialized');
  }

  // Edge runtime instrumentation (if needed)
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime has limited APIs, use minimal Sentry config
    console.log('[Instrumentation] Edge runtime detected');
  }
}

/**
 * This function is called on every request in development mode
 * Use for hot-reloading instrumentation changes
 */
export async function onRequestError(
  err: Error,
  request: Request,
  context: {
    routerKind: 'Pages Router' | 'App Router';
  }
) {
  // Log request errors for debugging
  console.error('[Request Error]', {
    error: err.message,
    path: new URL(request.url).pathname,
    method: request.method,
    router: context.routerKind,
  });

  // Errors are automatically sent to Sentry via sentry.server.config.ts
  // This is just for additional local logging
}

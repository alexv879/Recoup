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
    // Validate critical environment variables on startup
    validateEnvironmentVariables();

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
 * Validate critical environment variables on startup
 * Fails fast if essential config is missing
 */
function validateEnvironmentVariables() {
  const errors: string[] = [];

  // Validate Stripe Price IDs (critical for subscription management)
  const requiredStripePriceIds = [
    'STRIPE_PRICE_STARTER_MONTHLY',
    'STRIPE_PRICE_STARTER_ANNUAL',
    'STRIPE_PRICE_GROWTH_MONTHLY',
    'STRIPE_PRICE_GROWTH_ANNUAL',
    'STRIPE_PRICE_PRO_MONTHLY',
    'STRIPE_PRICE_PRO_ANNUAL',
  ];

  for (const priceId of requiredStripePriceIds) {
    if (!process.env[priceId]) {
      errors.push(`Missing required environment variable: ${priceId}`);
    } else if (process.env[priceId]?.startsWith('price_')) {
      // Warn about default placeholder values
      console.warn(`[Instrumentation] ⚠️  ${priceId} is using placeholder value. Update in production!`);
    }
  }

  // Validate Stripe core credentials
  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push('Missing required environment variable: STRIPE_SECRET_KEY');
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    errors.push('Missing required environment variable: STRIPE_WEBHOOK_SECRET');
  }

  // Validate Firebase credentials
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    errors.push('Missing required environment variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }

  // If there are critical errors, fail fast
  if (errors.length > 0) {
    console.error('❌ Environment variable validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\n📝 See SETUP.md for required environment variables\n');

    // Only throw in production to prevent silent failures
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Critical environment variables missing. Cannot start application.');
    } else {
      console.warn('⚠️  Development mode: Continuing despite missing environment variables');
    }
  } else {
    console.log('✅ [Instrumentation] Environment variables validated successfully');
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

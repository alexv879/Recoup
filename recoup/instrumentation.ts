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
    await validateEnvironmentVariables();

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
async function validateEnvironmentVariables() {
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

  // Validate Stripe price IDs exist in Stripe account (production only)
  if (process.env.NODE_ENV === 'production' && process.env.STRIPE_SECRET_KEY) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia',
      });

      for (const priceIdKey of requiredStripePriceIds) {
        const priceId = process.env[priceIdKey];
        if (priceId && priceId.startsWith('price_')) {
          try {
            const price = await stripe.prices.retrieve(priceId);
            if (!price.active) {
              console.warn(`[Instrumentation] ⚠️  Stripe price ${priceIdKey} (${priceId}) is INACTIVE`);
            }
          } catch (err: any) {
            errors.push(`Stripe price ${priceIdKey} (${priceId}) does not exist: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Instrumentation] ⚠️  Could not validate Stripe prices: ${err.message}`);
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
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    errors.push('Missing required environment variable: FIREBASE_PRIVATE_KEY');
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    errors.push('Missing required environment variable: FIREBASE_CLIENT_EMAIL');
  }

  // Validate Clerk authentication
  if (!process.env.CLERK_SECRET_KEY) {
    errors.push('Missing required environment variable: CLERK_SECRET_KEY');
  }
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    errors.push('Missing required environment variable: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  // Validate email/SMS services
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[Instrumentation] ⚠️  SENDGRID_API_KEY not set - email notifications will not work');
  }
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('[Instrumentation] ⚠️  Twilio credentials not set - SMS/voice collections will not work');
  }

  // Validate Python backend URL (production only)
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.PYTHON_BACKEND_URL) {
      errors.push('Missing required environment variable: PYTHON_BACKEND_URL (required in production)');
    } else if (process.env.PYTHON_BACKEND_URL.includes('localhost')) {
      errors.push('PYTHON_BACKEND_URL cannot point to localhost in production');
    }
  }

  // Validate HMRC credentials (UK tax integration - optional add-on)
  // HMRC is an optional paid add-on, so only warn, don't block startup
  if (process.env.NODE_ENV === 'production') {
    if (process.env.HMRC_ENV && process.env.HMRC_ENV !== 'production') {
      console.warn(`[Instrumentation] ⚠️  HMRC_ENV should be "production" in production (currently: ${process.env.HMRC_ENV})`);
    }

    if (process.env.HMRC_CLIENT_ID) {
      if (process.env.HMRC_CLIENT_ID.toLowerCase().includes('test') ||
          process.env.HMRC_CLIENT_ID.toLowerCase().includes('sandbox')) {
        console.warn('[Instrumentation] ⚠️  HMRC_CLIENT_ID appears to be a test/sandbox credential');
      }
    } else {
      console.warn('[Instrumentation] ⚠️  HMRC add-on not configured - Set HMRC_CLIENT_ID to enable');
    }

    if (!process.env.HMRC_CLIENT_SECRET) {
      console.warn('[Instrumentation] ⚠️  HMRC add-on not configured - Set HMRC_CLIENT_SECRET to enable');
    }
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

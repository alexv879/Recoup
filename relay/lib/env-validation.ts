/**
 * [SECURITY FIX] Environment Variable Validation
 *
 * Validates all required environment variables on startup
 *
 * Security Features:
 * - Fail-fast on missing required variables
 * - Format validation (URLs, keys, secrets)
 * - Clear error messages for debugging
 * - Prevents runtime failures due to misconfiguration
 *
 * SECURITY AUDIT FIX: HIGH-5
 * Issue: No environment variable validation on startup
 * Fix: Implement comprehensive env validation with Zod
 */

import { z } from 'zod';

/**
 * [SECURITY FIX] Environment variable schema
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email('FIREBASE_CLIENT_EMAIL must be a valid email'),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .min(100, 'FIREBASE_PRIVATE_KEY must be a valid private key'),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'Invalid Clerk publishable key format'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Clerk secret key format'),
  CLERK_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'Invalid Clerk webhook secret format'),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .regex(/^sk_(test|live)_/, 'Invalid Stripe secret key format'),
  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .regex(/^pk_(test|live)_/, 'Invalid Stripe publishable key format'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'Invalid Stripe webhook secret format'),

  // SendGrid
  SENDGRID_API_KEY: z
    .string()
    .startsWith('SG.', 'Invalid SendGrid API key format'),
  SENDGRID_FROM_EMAIL: z.string().email('SENDGRID_FROM_EMAIL must be a valid email'),
  SENDGRID_FROM_NAME: z.string().min(1, 'SENDGRID_FROM_NAME is required'),
  SENDGRID_WEBHOOK_PUBLIC_KEY: z
    .string()
    .min(100, 'SENDGRID_WEBHOOK_PUBLIC_KEY is required'),

  // SendGrid Template IDs (required for email functionality)
  SENDGRID_TEMPLATE_INVOICE: z.string().optional(),
  SENDGRID_TEMPLATE_REMINDER_DAY_5: z.string().optional(),
  SENDGRID_TEMPLATE_REMINDER_DAY_15: z.string().optional(),
  SENDGRID_TEMPLATE_REMINDER_DAY_30: z.string().optional(),
  SENDGRID_TEMPLATE_PAYMENT_CONFIRMATION: z.string().optional(),
  SENDGRID_TEMPLATE_PAYMENT_CLAIM_NOTIFICATION: z.string().optional(),
  SENDGRID_TEMPLATE_PAYMENT_CLAIM_CONFIRMATION: z.string().optional(),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC', 'Invalid Twilio Account SID format'),
  TWILIO_AUTH_TOKEN: z.string().min(32, 'TWILIO_AUTH_TOKEN is required'),
  TWILIO_PHONE_NUMBER: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'TWILIO_PHONE_NUMBER must be in E.164 format'),
  TWILIO_WEBSOCKET_URL: z.string().url('TWILIO_WEBSOCKET_URL must be a valid URL'),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-', 'Invalid OpenAI API key format'),

  // Cron Secret
  CRON_SECRET: z.string().min(32, 'CRON_SECRET must be at least 32 characters'),

  // Encryption (for banking data)
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, 'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
    .optional(),
  BANKING_DATA_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, 'BANKING_DATA_ENCRYPTION_KEY must be a 64-character hex string')
    .optional(),

  // Upstash Redis (for rate limiting) - Optional but recommended
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Sentry (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Lob (for physical letters) - Optional
  LOB_API_KEY: z.string().optional(),
});

/**
 * [SECURITY FIX] Validate environment variables
 *
 * Call this on application startup to ensure all required vars are present
 *
 * @throws Error if validation fails
 */
export function validateEnv(): void {
  console.log('🔍 Validating environment variables...');

  try {
    // Parse and validate environment variables
    const env = envSchema.parse(process.env);

    // Additional custom validation
    validateEncryptionKey();
    validateRedisConfig();
    validateWebhookSecrets();

    console.log('✅ All required environment variables are valid');

    // Log warnings for optional variables
    logOptionalVariableWarnings(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:\n');

      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });

      console.error('\n💡 Tip: Check your .env.local file and ensure all required variables are set');

      // In production, fail hard
      if (process.env.NODE_ENV === 'production') {
        console.error('\n🚨 Cannot start application with invalid configuration');
        process.exit(1);
      }

      // In development, warn but continue
      console.warn('\n⚠️  Continuing in development mode despite errors');
    } else {
      console.error('❌ Unexpected error during environment validation:', error);
      throw error;
    }
  }
}

/**
 * [SECURITY FIX] Validate encryption key configuration
 */
function validateEncryptionKey(): void {
  const encryptionKey =
    process.env.ENCRYPTION_KEY || process.env.BANKING_DATA_ENCRYPTION_KEY;

  if (!encryptionKey && process.env.NODE_ENV === 'production') {
    throw new Error(
      'ENCRYPTION_KEY or BANKING_DATA_ENCRYPTION_KEY is required in production for banking data encryption'
    );
  }

  if (encryptionKey && encryptionKey === 'your-64-character-hex-encryption-key-here') {
    console.warn(
      '⚠️  WARNING: Using default ENCRYPTION_KEY. Generate a secure key for production!'
    );
  }
}

/**
 * [SECURITY FIX] Validate Redis configuration
 */
function validateRedisConfig(): void {
  const hasRedisUrl = !!process.env.UPSTASH_REDIS_REST_URL;
  const hasRedisToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasRedisUrl && !hasRedisToken) {
    throw new Error(
      'UPSTASH_REDIS_REST_TOKEN is required when UPSTASH_REDIS_REST_URL is set'
    );
  }

  if (!hasRedisUrl && hasRedisToken) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL is required when UPSTASH_REDIS_REST_TOKEN is set'
    );
  }

  if (!hasRedisUrl && process.env.NODE_ENV === 'production') {
    console.warn(
      '⚠️  WARNING: Upstash Redis not configured. Rate limiting will use in-memory fallback (not recommended for production)'
    );
  }
}

/**
 * [SECURITY FIX] Validate webhook secrets
 */
function validateWebhookSecrets(): void {
  const webhookSecrets = [
    'STRIPE_WEBHOOK_SECRET',
    'CLERK_WEBHOOK_SECRET',
    'SENDGRID_WEBHOOK_PUBLIC_KEY',
  ];

  for (const secret of webhookSecrets) {
    if (!process.env[secret] && process.env.NODE_ENV === 'production') {
      throw new Error(`${secret} is required in production for webhook security`);
    }
  }
}

/**
 * [SECURITY FIX] Log warnings for optional variables
 */
function logOptionalVariableWarnings(env: z.infer<typeof envSchema>): void {
  const warnings: string[] = [];

  if (!env.ENCRYPTION_KEY && !env.BANKING_DATA_ENCRYPTION_KEY) {
    warnings.push(
      '⚠️  ENCRYPTION_KEY not set. Banking data will not be encrypted.'
    );
  }

  if (!env.UPSTASH_REDIS_REST_URL) {
    warnings.push(
      '⚠️  UPSTASH_REDIS_REST_URL not set. Using in-memory rate limiting.'
    );
  }

  if (!env.LOB_API_KEY) {
    warnings.push('⚠️  LOB_API_KEY not set. Physical letter feature will be disabled.');
  }

  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    warnings.push('⚠️  SENTRY_DSN not set. Error tracking will be disabled.');
  }

  if (warnings.length > 0) {
    console.log('\n📝 Optional configuration warnings:');
    warnings.forEach((warning) => console.log(`  ${warning}`));
  }
}

/**
 * [SECURITY FIX] Get typed environment variable
 * Use this instead of process.env for type safety
 */
export function getEnv<K extends keyof z.infer<typeof envSchema>>(
  key: K
): z.infer<typeof envSchema>[K] {
  return process.env[key] as z.infer<typeof envSchema>[K];
}

/**
 * [SECURITY FIX] Check if environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * [SECURITY FIX] Check if environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * [SECURITY FIX] Export for use in app initialization
 */
export default validateEnv;

/**
 * Environment Variable Validation
 *
 * Validates all required environment variables on app startup
 * Fails fast with clear error messages if anything is missing
 */

interface EnvConfig {
  // Clerk (required)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_CLERK_DOMAIN?: string; // Optional - only needed for subscriptions

  // Firebase (required)
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  FIREBASE_ADMIN_PROJECT_ID: string;
  FIREBASE_ADMIN_CLIENT_EMAIL: string;
  FIREBASE_ADMIN_PRIVATE_KEY: string;

  // OpenAI (required for OCR)
  OPENAI_API_KEY: string;

  // Encryption (required for HMRC tokens)
  ENCRYPTION_KEY: string;

  // Stripe (required for client payment links)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;

  // App URL (required)
  NEXT_PUBLIC_APP_URL: string;

  // Optional
  STRIPE_WEBHOOK_SECRET?: string;
  HMRC_CLIENT_ID?: string;
  HMRC_CLIENT_SECRET?: string;
  HMRC_REDIRECT_URI?: string;
}

/**
 * Validate environment variables
 * Call this at app startup to fail fast if config is missing
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Required variables
  const requiredVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'CLERK_WEBHOOK_SECRET',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'OPENAI_API_KEY',
    'ENCRYPTION_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_APP_URL',
  ];

  // Check each required variable
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate ENCRYPTION_KEY format (must be 64 hex characters = 32 bytes)
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && !/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    errors.push(
      'ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // Validate Clerk keys format
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (clerkPubKey && !clerkPubKey.startsWith('pk_')) {
    errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY should start with "pk_"');
  }

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (clerkSecretKey && !clerkSecretKey.startsWith('sk_')) {
    errors.push('CLERK_SECRET_KEY should start with "sk_"');
  }

  const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (clerkWebhookSecret && !clerkWebhookSecret.startsWith('whsec_')) {
    errors.push('CLERK_WEBHOOK_SECRET should start with "whsec_"');
  }

  // Validate Stripe keys format
  const stripePubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (stripePubKey && !stripePubKey.startsWith('pk_')) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should start with "pk_"');
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey && !stripeSecretKey.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY should start with "sk_"');
  }

  // Validate OpenAI key format
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && !openaiKey.startsWith('sk-')) {
    errors.push('OPENAI_API_KEY should start with "sk-"');
  }

  // Validate Firebase private key format
  const firebasePrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (firebasePrivateKey && !firebasePrivateKey.includes('BEGIN PRIVATE KEY')) {
    errors.push(
      'FIREBASE_ADMIN_PRIVATE_KEY should be a valid private key starting with "-----BEGIN PRIVATE KEY-----"'
    );
  }

  // Validate APP_URL format
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !appUrl.startsWith('http')) {
    errors.push('NEXT_PUBLIC_APP_URL should start with "http://" or "https://"');
  }

  // If there are errors, throw with helpful message
  if (errors.length > 0) {
    const errorMessage = [
      '❌ Environment variable validation failed:',
      '',
      ...errors.map((err) => `  • ${err}`),
      '',
      '📝 See .env.example for required variables',
      '📖 See README.md for setup instructions',
      '',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Return validated config
  return {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET!,
    NEXT_PUBLIC_CLERK_DOMAIN: process.env.NEXT_PUBLIC_CLERK_DOMAIN,

    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY!,

    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,

    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,

    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,

    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    HMRC_CLIENT_ID: process.env.HMRC_CLIENT_ID,
    HMRC_CLIENT_SECRET: process.env.HMRC_CLIENT_SECRET,
    HMRC_REDIRECT_URI: process.env.HMRC_REDIRECT_URI,
  };
}

/**
 * Get validated environment config
 * Cached after first validation
 */
let cachedConfig: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv();
  }
  return cachedConfig;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if MTD features are enabled
 * MTD requires HMRC credentials to be configured
 */
export function isMTDEnabled(): boolean {
  return !!(
    process.env.HMRC_CLIENT_ID &&
    process.env.HMRC_CLIENT_SECRET &&
    process.env.HMRC_REDIRECT_URI
  );
}

/**
 * Startup Validation
 * Validates environment configuration and critical services on app startup
 *
 * This module should be called early in the app lifecycle to fail fast
 * if required configuration is missing or invalid.
 */

import { validateEnv } from './env-validation';
import { logger } from '@/utils/logger';

/**
 * Run all startup validations
 * Throws error if any critical validation fails
 */
export async function runStartupValidation(): Promise<void> {
  try {
    logger.info('Running startup validation checks...');

    // 1. Validate environment variables
    logger.info('Validating environment variables...');
    const env = validateEnv();
    logger.info('✓ Environment variables validated');

    // 2. Check critical service connectivity (optional for now)
    // This could include Firebase, Clerk, etc. but we'll keep it simple
    logger.info('✓ Startup validation complete');
  } catch (error) {
    logger.error('❌ Startup validation failed:', error);
    throw error;
  }
}

/**
 * Display user-friendly error message for missing/invalid environment variables
 */
export function displayEnvError(error: Error): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  RECOUP CONFIGURATION ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${error.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help?
1. Copy .env.example to .env.local
2. Fill in your API keys and credentials
3. See README.md for setup instructions
4. Check FINAL_ANALYSIS.md for deployment requirements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

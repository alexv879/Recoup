/**
 * Simple logger utility for render-server
 * @module logger
 */

/**
 * Log informational message
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] INFO: ${message}`, context ? JSON.stringify(context, null, 2) : '');
}

/**
 * Log error message
 */
export function logError(message: string, error: Error, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`);
  console.error(`  Error: ${error.message}`);
  console.error(`  Stack: ${error.stack}`);
  if (context) {
    console.error(`  Context:`, JSON.stringify(context, null, 2));
  }
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] WARN: ${message}`, context ? JSON.stringify(context, null, 2) : '');
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, context?: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] DEBUG: ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }
}

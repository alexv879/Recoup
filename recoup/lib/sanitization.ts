/**
 * Input Sanitization Utilities
 * Prevents XSS, injection attacks, and malicious input
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * For production, use DOMPurify: npm install isomorphic-dompurify
 */
export function sanitizeHTML(dirty: string): string {
  // Basic sanitization - strips all HTML tags
  // In production, use DOMPurify for more sophisticated sanitization
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace non-alphanumeric chars
    .replace(/\.{2,}/g, '.') // Remove consecutive dots (..)
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}

/**
 * Sanitize user input (general text fields)
 */
export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
}

/**
 * Sanitize for AI prompts - prevent prompt injection
 */
export function sanitizeForAI(input: string): string {
  return input
    // Remove common prompt injection patterns
    .replace(/\bignore\s+(previous|all)\s+(instructions|prompts|commands)\b/gi, '[REDACTED]')
    .replace(/\bact\s+as\b/gi, '[REDACTED]')
    .replace(/\byou\s+are\s+(now|a)\b/gi, '[REDACTED]')
    .replace(/\bpretend\s+to\s+be\b/gi, '[REDACTED]')
    .replace(/\bforget\s+everything\b/gi, '[REDACTED]')
    .replace(/\bsystem\s*:/gi, '[REDACTED]')
    .replace(/\bassistant\s*:/gi, '[REDACTED]')
    .replace(/\buser\s*:/gi, '[REDACTED]')
    // Remove potential data exfiltration attempts
    .replace(/\b(curl|wget|fetch|http|https|ftp)\s*:/gi, '[REDACTED]')
    // Remove excessive newlines (potential prompt breaking)
    .replace(/\n{5,}/g, '\n\n\n')
    .trim()
    .substring(0, 10000); // Limit length
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    throw new Error('Invalid email format');
  }

  return trimmed;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(url: string): string {
  const trimmed = url.trim();

  // Only allow http and https protocols
  const urlRegex = /^https?:\/\/.+/i;

  if (!urlRegex.test(trimmed)) {
    throw new Error('Invalid URL format. Only HTTP and HTTPS protocols are allowed.');
  }

  // Prevent javascript: and data: URLs
  if (trimmed.toLowerCase().startsWith('javascript:') ||
      trimmed.toLowerCase().startsWith('data:')) {
    throw new Error('Invalid URL protocol');
  }

  return trimmed;
}

/**
 * Sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Sanitize UUID
 */
export function sanitizeUUID(uuid: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    throw new Error('Invalid UUID format');
  }

  return uuid.toLowerCase();
}

/**
 * Sanitize monetary amount
 */
export function sanitizeAmount(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount: must be a number');
  }

  if (amount < 0) {
    throw new Error('Invalid amount: cannot be negative');
  }

  if (amount > 10000000) {
    throw new Error('Invalid amount: exceeds maximum allowed value');
  }

  // Round to 2 decimal places
  return Math.round(amount * 100) / 100;
}

/**
 * Sanitize percentage
 */
export function sanitizePercentage(percentage: number): number {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    throw new Error('Invalid percentage: must be a number');
  }

  if (percentage < 0 || percentage > 100) {
    throw new Error('Invalid percentage: must be between 0 and 100');
  }

  return Math.round(percentage * 10) / 10; // 1 decimal place
}

/**
 * Escape special characters for regex
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, any>>(obj: T): T {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!dangerousKeys.includes(key)) {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Rate limit validation - check if value is within reasonable bounds
 */
export function validateRateLimit(value: number, max: number, fieldName: string): void {
  if (value > max) {
    throw new Error(`${fieldName} exceeds maximum allowed value of ${max}`);
  }
}

/**
 * Sanitize for SQL/NoSQL (already handled by Firestore, but good to have)
 */
export function sanitizeForQuery(input: string): string {
  // Firestore handles parameterization, but we can still sanitize
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .trim();
}

/**
 * Input Validation & Sanitization
 *
 * Prevents injection attacks and validates user input
 *
 * **Security Features:**
 * - SQL/NoSQL injection prevention
 * - XSS protection
 * - Path traversal prevention
 * - Email/phone validation
 * - Input sanitization
 */

import { logWarn } from '@/utils/logger';

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
    if (!input) return '';

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

/**
 * Sanitize HTML (allow safe tags only)
 */
export function sanitizeHTML(html: string): string {
    if (!html) return '';

    // Strip all script tags
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Strip event handlers
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

    // Strip javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');

    return sanitized;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    if (!isValid) {
        logWarn('Invalid email format', { email: email.substring(0, 10) + '...' });
    }

    return isValid && email.length <= 254; // RFC 5321
}

/**
 * Validate UK phone number
 */
export function isValidUKPhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;

    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // UK phone patterns:
    // +447XXXXXXXXX (mobile)
    // +441XXXXXXXXX (landline)
    // +442XXXXXXXXX (London)
    // 07XXXXXXXXX (mobile without +44)
    // 01XXXXXXXXX or 02XXXXXXXXX (landline without +44)
    const ukPhoneRegex = /^(\+44|0)(7\d{9}|[12]\d{9})$/;

    return ukPhoneRegex.test(cleaned);
}

/**
 * Validate and sanitize invoice reference
 */
export function sanitizeInvoiceReference(ref: string): string {
    if (!ref) return '';

    // Allow alphanumeric, dash, underscore only
    const sanitized = ref.replace(/[^a-zA-Z0-9\-_]/g, '');

    if (sanitized !== ref) {
        logWarn('Invoice reference contained invalid characters', { original: ref, sanitized });
    }

    return sanitized.substring(0, 50); // Max 50 chars
}

/**
 * Validate amount (prevent negative or invalid amounts)
 */
export function isValidAmount(amount: number): boolean {
    if (typeof amount !== 'number') return false;
    if (isNaN(amount)) return false;
    if (amount < 0) return false;
    if (amount > 999999999.99) return false; // Max £999M

    return true;
}

/**
 * Prevent NoSQL injection in Firestore queries
 */
export function sanitizeFirestoreValue(value: any): any {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === 'string') {
        // Remove Firestore operators and special characters
        const sanitized = value.replace(/[\$\.\[\]]/g, '');

        if (sanitized !== value) {
            logWarn('Firestore value contained dangerous characters', {
                original: value.substring(0, 50),
                sanitized: sanitized.substring(0, 50),
            });
        }

        return sanitized;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
        // Recursively sanitize object properties
        const sanitized: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
            // Don't allow keys that could be operators
            if (!key.startsWith('$') && !key.includes('.')) {
                sanitized[key] = sanitizeFirestoreValue(val);
            } else {
                logWarn('Dangerous object key detected', { key });
            }
        }
        return sanitized;
    }

    return value;
}

/**
 * Validate file upload
 */
export function isValidFileUpload(file: {
    name: string;
    size: number;
    type: string;
}): { valid: boolean; error?: string } {
    // Check file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, error: 'File too large (max 20MB)' };
    }

    // Check file type
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid file type' };
    }

    // Check filename for path traversal
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        return { valid: false, error: 'Invalid filename' };
    }

    return { valid: true };
}

/**
 * Validate URL (prevent SSRF attacks)
 */
export function isValidURL(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    try {
        const parsed = new URL(url);

        // Only allow HTTP/HTTPS
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            logWarn('Invalid URL protocol', { protocol: parsed.protocol });
            return false;
        }

        // Block localhost and private IPs (prevent SSRF)
        const hostname = parsed.hostname.toLowerCase();
        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.16.') ||
            hostname.startsWith('172.17.') ||
            hostname.startsWith('172.18.') ||
            hostname.startsWith('172.19.') ||
            hostname.startsWith('172.2') ||
            hostname.startsWith('172.30.') ||
            hostname.startsWith('172.31.') ||
            hostname.includes('metadata') || // AWS/GCP metadata
            hostname.includes('169.254.') // Link-local
        ) {
            logWarn('URL points to private/internal resource (SSRF prevention)', { hostname });
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Rate limit key generator
 */
export function generateRateLimitKey(
    identifier: string,
    endpoint: string
): string {
    // Create a rate limit key based on user ID or IP + endpoint
    return `ratelimit:${sanitizeString(identifier)}:${sanitizeString(endpoint)}`;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: {
    page?: number | string;
    limit?: number | string;
}): { page: number; limit: number } {
    let page = 1;
    let limit = 20;

    if (params.page) {
        const parsed = typeof params.page === 'string' ? parseInt(params.page, 10) : params.page;
        if (!isNaN(parsed) && parsed > 0 && parsed < 10000) {
            page = parsed;
        }
    }

    if (params.limit) {
        const parsed = typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit;
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
            limit = parsed;
        }
    }

    return { page, limit };
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') return '';

    // Remove special regex characters that could cause ReDoS
    const sanitized = query
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .substring(0, 100); // Max 100 chars

    return sanitized.trim();
}

/**
 * Validate date range
 */
export function isValidDateRange(start: string | Date, end: string | Date): boolean {
    try {
        const startDate = typeof start === 'string' ? new Date(start) : start;
        const endDate = typeof end === 'string' ? new Date(end) : end;

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return false;
        }

        if (startDate > endDate) {
            return false;
        }

        // Don't allow date ranges more than 1 year
        const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 365) {
            logWarn('Date range too large', { days: diffDays });
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Validate JSON input
 */
export function isValidJSON(str: string): boolean {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

/**
 * Sanitize object for database storage
 */
export function sanitizeObjectForDB<T extends Record<string, any>>(obj: T): T {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
        // Skip prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            logWarn('Prototype pollution attempt detected', { key });
            continue;
        }

        // Sanitize key
        const sanitizedKey = key.replace(/[\$\.]/g, '_');

        // Sanitize value
        if (typeof value === 'string') {
            sanitized[sanitizedKey] = sanitizeFirestoreValue(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[sanitizedKey] = sanitizeObjectForDB(value);
        } else {
            sanitized[sanitizedKey] = value;
        }
    }

    return sanitized as T;
}

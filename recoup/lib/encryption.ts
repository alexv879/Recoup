/**
 * Encryption & Decryption Library
 *
 * Provides AES-256-GCM encryption for sensitive data at rest
 *
 * **SECURITY REQUIREMENTS:**
 * - All sensitive PII (names, emails, addresses, phone numbers) must be encrypted
 * - All payment information (card numbers, bank details) must be encrypted
 * - All API keys and secrets must be encrypted
 * - Encryption keys must be stored in environment variables, never in code
 * - Each customer instance has its own encryption key for multi-tenancy
 *
 * **Usage:**
 * ```typescript
 * import { encryptField, decryptField } from '@/lib/encryption';
 *
 * // Encrypt sensitive data before storing
 * const encrypted = encryptField('sensitive data', userId);
 *
 * // Decrypt when retrieving
 * const decrypted = decryptField(encrypted, userId);
 * ```
 */

import crypto from 'crypto';
import { logError, logWarn } from '@/utils/logger';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // For key derivation

/**
 * Get the master encryption key from environment
 * This should be a 64-character hex string (32 bytes)
 */
function getMasterKey(): Buffer {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY;

    if (!masterKey) {
        throw new Error('ENCRYPTION_MASTER_KEY environment variable not set');
    }

    if (masterKey.length !== 64) {
        throw new Error('ENCRYPTION_MASTER_KEY must be 64 hex characters (32 bytes)');
    }

    return Buffer.from(masterKey, 'hex');
}

/**
 * Derive a user-specific encryption key from the master key
 * This ensures each customer instance has its own encryption key
 */
function deriveUserKey(userId: string): Buffer {
    try {
        const masterKey = getMasterKey();

        // Use HKDF for key derivation
        const salt = crypto.createHash('sha256').update(userId).digest();
        const info = Buffer.from('recoup-user-encryption-key', 'utf8');

        // HKDF-SHA256
        const prk = crypto.createHmac('sha256', salt).update(masterKey).digest();
        const okm = crypto.createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])]))digest();

        return okm.slice(0, KEY_LENGTH);
    } catch (error) {
        logError('Failed to derive user encryption key', error);
        throw new Error('Encryption key derivation failed');
    }
}

/**
 * Encrypt a field value using AES-256-GCM
 * Returns base64-encoded string containing IV + auth tag + ciphertext
 */
export function encryptField(plaintext: string, userId: string): string {
    if (!plaintext) return '';

    try {
        const key = deriveUserKey(userId);
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const authTag = cipher.getAuthTag();

        // Combine: IV (16 bytes) + Auth Tag (16 bytes) + Ciphertext
        const combined = Buffer.concat([
            iv,
            authTag,
            Buffer.from(encrypted, 'base64')
        ]);

        return combined.toString('base64');
    } catch (error) {
        logError('Encryption failed', error);
        throw new Error('Failed to encrypt field');
    }
}

/**
 * Decrypt a field value encrypted with encryptField
 */
export function decryptField(ciphertext: string, userId: string): string {
    if (!ciphertext) return '';

    try {
        const key = deriveUserKey(userId);
        const combined = Buffer.from(ciphertext, 'base64');

        // Extract components
        const iv = combined.slice(0, IV_LENGTH);
        const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        logError('Decryption failed', error);
        throw new Error('Failed to decrypt field');
    }
}

/**
 * Encrypt an entire object's sensitive fields
 */
export function encryptObject<T extends Record<string, any>>(
    obj: T,
    sensitiveFields: (keyof T)[],
    userId: string
): T {
    const result = { ...obj };

    for (const field of sensitiveFields) {
        const value = obj[field];
        if (value && typeof value === 'string') {
            result[field] = encryptField(value, userId) as any;
        }
    }

    return result;
}

/**
 * Decrypt an entire object's sensitive fields
 */
export function decryptObject<T extends Record<string, any>>(
    obj: T,
    sensitiveFields: (keyof T)[],
    userId: string
): T {
    const result = { ...obj };

    for (const field of sensitiveFields) {
        const value = obj[field];
        if (value && typeof value === 'string') {
            try {
                result[field] = decryptField(value, userId) as any;
            } catch (error) {
                logWarn(`Failed to decrypt field ${String(field)}`, { userId, error });
                result[field] = '[DECRYPTION_FAILED]' as any;
            }
        }
    }

    return result;
}

/**
 * Hash a value using SHA-256 (for non-reversible hashing like passwords)
 * NOTE: For passwords, use bcrypt or argon2 instead
 */
export function hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate that encryption is properly configured
 */
export function validateEncryptionConfig(): { valid: boolean; error?: string } {
    try {
        getMasterKey();
        return { valid: true };
    } catch (error: any) {
        return {
            valid: false,
            error: error.message || 'Encryption configuration invalid'
        };
    }
}

/**
 * Fields that should be encrypted in the database
 */
export const ENCRYPTED_FIELDS = {
    // User/Client PII
    USER: ['fullName', 'phoneNumber', 'businessAddress', 'taxId'],
    CLIENT: ['clientName', 'clientEmail', 'clientPhone', 'clientAddress'],
    INVOICE: ['clientName', 'clientEmail', 'clientPhone', 'clientAddress', 'notes'],

    // Payment information
    PAYMENT: ['cardNumber', 'cardholderName', 'bankAccountNumber', 'sortCode', 'iban'],

    // Communication data
    COMMUNICATION: ['phoneNumber', 'emailContent', 'smsContent', 'recordingUrl'],

    // API keys and secrets (should be in env vars, but if stored in DB)
    INTEGRATION: ['apiKey', 'apiSecret', 'webhookSecret', 'accessToken', 'refreshToken'],
} as const;

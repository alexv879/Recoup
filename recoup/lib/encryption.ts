/**
 * Encryption utilities for sensitive data (HMRC tokens, NINO, etc.)
 * Uses AES-256-GCM for authenticated encryption
 *
 * IMPORTANT: Set ENCRYPTION_KEY environment variable to a 32-byte (64 hex char) key
 * Generate key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  return keyBuffer;
}

/**
 * Encrypt plaintext string
 * @param plaintext - The text to encrypt
 * @returns Encrypted string in format "iv:authTag:encrypted"
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted string
 * @param ciphertext - Encrypted string in format "iv:authTag:encrypted"
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  try {
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a new encryption key (run once, store in .env)
 * @returns 64-character hex string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash sensitive data (one-way, for comparison only)
 * Use for data that needs to be compared but never decrypted
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Encrypt object (serializes to JSON first)
 */
export function encryptObject<T>(obj: T): string {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt object (deserializes from JSON)
 */
export function decryptObject<T>(ciphertext: string): T {
  const decrypted = decrypt(ciphertext);
  return JSON.parse(decrypted);
}

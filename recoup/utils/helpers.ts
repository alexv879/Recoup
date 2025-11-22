/**
 * Helper utility functions
 */

import crypto from 'crypto';

export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB');
}

export function calculateDaysOverdue(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diff = now.getTime() - due.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Generate a secure random token for payment confirmation links
 * @param length - Length of the token (default: 32)
 * @returns A cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Type guard to check if collectionsConsent is an object (CollectionsConsent)
 * @param consent - The consent value to check
 * @returns true if consent is an object, false if it's a boolean
 */
export function isCollectionsConsentObject(
  consent: boolean | import('@/types/models').CollectionsConsent | undefined
): consent is import('@/types/models').CollectionsConsent {
  return typeof consent === 'object' && consent !== null;
}

/**
 * Type guard to check if businessAddress is an object (BusinessAddress)
 * @param address - The address value to check
 * @returns true if address is an object, false if it's a string
 */
export function isBusinessAddressObject(
  address: string | import('@/types/models').BusinessAddress | undefined
): address is import('@/types/models').BusinessAddress {
  return typeof address === 'object' && address !== null && 'addressLine1' in address;
}

/**
 * Helper to convert Timestamp or Date to Date
 * @param date - Timestamp or Date object
 * @returns Date object
 */
export function toDate(date: import('@/types/models').Timestamp | Date | any): Date {
  if (date instanceof Date) {
    return date;
  }
  if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  if (date && typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000);
  }
  return new Date(date);
}

/**
 * Test Utilities and Helpers
 *
 * Reusable functions, mocks, and factories for testing.
 */

import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Create a mock user
 */
export function createMockUser(overrides?: Partial<any>) {
  return {
    id: 'user_123',
    clerkId: 'clerk_user_123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    subscriptionTier: 'free',
    stripeCustomerId: 'cus_test',
    gamificationXP: 0,
    gamificationLevel: 1,
    paymentStreakDays: 0,
    totalInvoicesSent: 0,
    totalCollected: 0,
    collectionsUsedThisMonth: 0,
    collectionsLimitPerMonth: 1,
    isFoundingMember: false,
    referralCode: 'TEST123',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

/**
 * Create a mock invoice
 */
export function createMockInvoice(overrides?: Partial<any>) {
  return {
    id: 'inv_123',
    invoiceNumber: 'INV-001',
    freelancerId: 'user_123',
    clientId: 'client_123',
    clientName: 'Test Client Ltd',
    clientEmail: 'client@example.com',
    amount: 1000.00,
    currency: 'GBP',
    status: 'sent',
    dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    lineItems: [
      {
        description: 'Web Development Services',
        quantity: 10,
        rate: 100,
        amount: 1000,
      },
    ],
    paymentLink: 'https://pay.stripe.com/test',
    collectionsEnabled: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

/**
 * Create a mock client
 */
export function createMockClient(overrides?: Partial<any>) {
  return {
    id: 'client_123',
    freelancerId: 'user_123',
    name: 'Test Client Ltd',
    email: 'client@example.com',
    phone: '+447700900123',
    companyName: 'Test Client Ltd',
    address: {
      line1: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'GB',
    },
    paymentBehavior: {
      averageDaysToPay: 7,
      onTimePaymentRate: 0.9,
      totalInvoices: 10,
      totalPaid: 9,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

/**
 * Create a mock payment confirmation
 */
export function createMockPaymentConfirmation(overrides?: Partial<any>) {
  return {
    id: 'conf_123',
    invoiceId: 'inv_123',
    freelancerId: 'user_123',
    clientId: 'client_123',
    amount: 1000.00,
    currency: 'GBP',
    paymentMethod: 'bank_transfer',
    status: 'pending_verification',
    confirmationToken: 'token_abc123',
    clientConfirmedAt: Timestamp.now(),
    freelancerVerifiedAt: null,
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

/**
 * Create a mock collection attempt
 */
export function createMockCollectionAttempt(overrides?: Partial<any>) {
  return {
    id: 'coll_123',
    invoiceId: 'inv_123',
    freelancerId: 'user_123',
    type: 'email',
    level: 'gentle',
    status: 'sent',
    sentAt: Timestamp.now(),
    cost: 0,
    result: null,
    createdAt: Timestamp.now(),
    ...overrides,
  };
}

/**
 * Create a mock notification
 */
export function createMockNotification(overrides?: Partial<any>) {
  return {
    id: 'notif_123',
    freelancerId: 'user_123',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'You received £1,000 from Test Client Ltd',
    read: false,
    actionUrl: '/dashboard/invoices/inv_123',
    createdAt: Timestamp.now(),
    ...overrides,
  };
}

/**
 * Create a mock transaction
 */
export function createMockTransaction(overrides?: Partial<any>) {
  return {
    id: 'txn_123',
    userId: 'user_123',
    type: 'commission',
    amount: 30.00,
    currency: 'GBP',
    description: '3% commission on £1,000 payment',
    status: 'pending',
    invoiceId: 'inv_123',
    stripePaymentIntentId: 'pi_test',
    createdAt: Timestamp.now(),
    ...overrides,
  };
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Wait for a specified duration (for async tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock Firestore document snapshot
 */
export function createMockDocSnapshot(data: any, id: string = 'test-id') {
  return {
    id,
    exists: true,
    data: () => data,
    ref: {
      path: `collection/${id}`,
      id,
    },
    get: (field: string) => data[field],
  };
}

/**
 * Create a mock Firestore query snapshot
 */
export function createMockQuerySnapshot(docs: any[]) {
  return {
    docs: docs.map((data, index) => createMockDocSnapshot(data, `doc_${index}`)),
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (doc: any) => void) => {
      docs.forEach((data, index) => {
        callback(createMockDocSnapshot(data, `doc_${index}`));
      });
    },
  };
}

/**
 * Mock a Next.js API request
 */
export function createMockRequest(options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  url?: string;
} = {}): Request {
  const {
    method = 'GET',
    body = null,
    headers = {},
    query = {},
    url = 'http://localhost:3000/api/test',
  } = options;

  const urlWithQuery = new URL(url);
  Object.entries(query).forEach(([key, value]) => {
    urlWithQuery.searchParams.set(key, value);
  });

  return new Request(urlWithQuery.toString(), {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : null,
  });
}

/**
 * Mock a Next.js API response
 */
export async function getMockResponseData(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Assert that a function throws an error
 */
export async function expectToThrow(fn: () => any | Promise<any>, errorMessage?: string) {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error: any) {
    if (errorMessage && !error.message.includes(errorMessage)) {
      throw new Error(`Expected error message to include "${errorMessage}", but got "${error.message}"`);
    }
  }
}

/**
 * Create a mock Stripe payment intent
 */
export function createMockStripePaymentIntent(overrides?: Partial<any>) {
  return {
    id: 'pi_test',
    object: 'payment_intent',
    amount: 100000, // £1,000 in pence
    currency: 'gbp',
    status: 'succeeded',
    client_secret: 'pi_test_secret_abc123',
    metadata: {
      invoiceId: 'inv_123',
      freelancerId: 'user_123',
    },
    created: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

/**
 * Create a mock Clerk user
 */
export function createMockClerkUser(overrides?: Partial<any>) {
  return {
    id: 'clerk_user_123',
    emailAddresses: [
      {
        id: 'email_123',
        emailAddress: 'test@example.com',
        verification: { status: 'verified' },
      },
    ],
    firstName: 'Test',
    lastName: 'User',
    imageUrl: 'https://img.clerk.com/test.jpg',
    publicMetadata: {},
    privateMetadata: {},
    unsafeMetadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

/**
 * Create a mock date range for analytics
 */
export function createMockDateRange(daysAgo: number = 30) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);

  return {
    start,
    end,
    startTimestamp: Timestamp.fromDate(start),
    endTimestamp: Timestamp.fromDate(end),
  };
}

/**
 * Suppress console errors during a test
 */
export function suppressConsoleErrors(fn: () => void | Promise<void>) {
  const originalError = console.error;
  console.error = jest.fn();

  try {
    return fn();
  } finally {
    console.error = originalError;
  }
}

/**
 * Mock environment variables for a test
 */
export function withEnvVars(vars: Record<string, string>, fn: () => void | Promise<void>) {
  const originalEnv = { ...process.env };

  Object.entries(vars).forEach(([key, value]) => {
    process.env[key] = value;
  });

  try {
    return fn();
  } finally {
    process.env = originalEnv;
  }
}

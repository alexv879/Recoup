import { Timestamp } from 'firebase-admin/firestore'

/**
 * Test Helpers for Recoup Test Suite
 */

export const mockFirebaseTimestamp = (date: Date = new Date()): Timestamp => {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  } as Timestamp
}

export const mockInvoice = (overrides = {}) => ({
  id: 'inv_test_123',
  userId: 'user_test_123',
  clientName: 'Test Client',
  clientEmail: 'client@test.com',
  amount: 100000, // £1000 in pence
  currency: 'GBP',
  status: 'unpaid',
  dueDate: mockFirebaseTimestamp(new Date('2024-01-15')),
  createdAt: mockFirebaseTimestamp(new Date('2024-01-01')),
  updatedAt: mockFirebaseTimestamp(new Date('2024-01-01')),
  escalationStage: 'pending',
  escalationPaused: false,
  ...overrides,
})

export const mockUser = (overrides = {}) => ({
  id: 'user_test_123',
  clerkId: 'clerk_test_123',
  email: 'user@test.com',
  firstName: 'Test',
  lastName: 'User',
  stripeCustomerId: 'cus_test_123',
  subscriptionTier: 'free',
  subscriptionStatus: 'active',
  createdAt: mockFirebaseTimestamp(),
  updatedAt: mockFirebaseTimestamp(),
  ...overrides,
})

export const mockPaymentConfirmation = (overrides = {}) => ({
  id: 'pc_test_123',
  invoiceId: 'inv_test_123',
  userId: 'user_test_123',
  amount: 100000,
  currency: 'GBP',
  paymentMethod: 'bank_transfer',
  status: 'pending_verification',
  evidenceUrl: 'https://storage.example.com/evidence.pdf',
  createdAt: mockFirebaseTimestamp(),
  expiresAt: mockFirebaseTimestamp(new Date(Date.now() + 48 * 60 * 60 * 1000)),
  ...overrides,
})

export const mockCollectionAttempt = (overrides = {}) => ({
  id: 'ca_test_123',
  invoiceId: 'inv_test_123',
  userId: 'user_test_123',
  type: 'email',
  stage: 'gentle',
  status: 'sent',
  sentAt: mockFirebaseTimestamp(),
  createdAt: mockFirebaseTimestamp(),
  ...overrides,
})

export const mockStripeEvent = (type: string, data: any = {}) => ({
  id: 'evt_test_123',
  object: 'event',
  type,
  data: {
    object: data,
  },
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  pending_webhooks: 0,
  request: {
    id: 'req_test_123',
    idempotency_key: null,
  },
})

export const mockStripeCheckoutSession = (overrides = {}) => ({
  id: 'cs_test_123',
  object: 'checkout.session',
  amount_total: 100000,
  currency: 'gbp',
  customer: 'cus_test_123',
  customer_email: 'customer@test.com',
  metadata: {
    invoiceId: 'inv_test_123',
    userId: 'user_test_123',
  },
  payment_status: 'paid',
  status: 'complete',
  ...overrides,
})

export const mockStripeSubscription = (overrides = {}) => ({
  id: 'sub_test_123',
  object: 'subscription',
  customer: 'cus_test_123',
  status: 'active',
  items: {
    data: [
      {
        id: 'si_test_123',
        price: {
          id: 'price_test_123',
          product: 'prod_test_123',
          recurring: {
            interval: 'month',
          },
        },
      },
    ],
  },
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
  ...overrides,
})

export const mockSendGridEvent = (type: string, overrides = {}) => ({
  email: 'recipient@test.com',
  timestamp: Math.floor(Date.now() / 1000),
  event: type,
  sg_event_id: 'sg_test_123',
  sg_message_id: 'msg_test_123',
  ...overrides,
})

export const mockTwilioSmsResponse = (overrides = {}) => ({
  sid: 'SM_test_123',
  status: 'sent',
  to: '+447700900000',
  from: '+447700900001',
  body: 'Test SMS',
  dateCreated: new Date(),
  ...overrides,
})

export const mockTwilioVoiceResponse = (overrides = {}) => ({
  sid: 'CA_test_123',
  status: 'completed',
  to: '+447700900000',
  from: '+447700900001',
  duration: '120',
  dateCreated: new Date(),
  ...overrides,
})

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockRequest = (method: string, body?: any, headers: Record<string, string> = {}) => {
  const defaultHeaders = {
    'content-type': 'application/json',
    ...headers,
  }

  return new Request('http://localhost:3000/api/test', {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })
}

export const mockNextRequest = (
  method: string,
  url: string,
  options: {
    body?: any
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
) => {
  const { body, headers = {}, searchParams = {} } = options

  const urlWithParams = new URL(url, 'http://localhost:3000')
  Object.entries(searchParams).forEach(([key, value]) => {
    urlWithParams.searchParams.set(key, value)
  })

  const defaultHeaders = {
    'content-type': 'application/json',
    ...headers,
  }

  return new Request(urlWithParams.toString(), {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })
}

// Database mock helpers
export const createMockFirestoreDoc = (data: any) => ({
  exists: true,
  id: data.id || 'mock_id',
  data: () => data,
  get: (field: string) => data[field],
  ref: {
    id: data.id || 'mock_id',
    path: `collection/${data.id || 'mock_id'}`,
  },
})

export const createMockFirestoreQuerySnapshot = (docs: any[]) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs.map(createMockFirestoreDoc),
  forEach: (callback: (doc: any) => void) => docs.map(createMockFirestoreDoc).forEach(callback),
})

// Error simulation helpers
export const simulateStripeError = (code: string, message: string) => {
  const error: any = new Error(message)
  error.type = 'StripeInvalidRequestError'
  error.code = code
  error.statusCode = 400
  return error
}

export const simulateFirebaseError = (code: string, message: string) => {
  const error: any = new Error(message)
  error.code = code
  return error
}

export const simulateNetworkError = (message = 'Network request failed') => {
  const error: any = new Error(message)
  error.code = 'NETWORK_ERROR'
  return error
}

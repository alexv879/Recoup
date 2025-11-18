/**
 * Stripe Webhook Integration Tests
 *
 * Tests the full Stripe webhook flow including:
 * - Signature verification
 * - Event processing
 * - Database updates
 * - Transaction creation
 */

import { POST } from '@/app/api/webhook/stripe/route'
import { db, COLLECTIONS } from '@/lib/firebase'
import Stripe from 'stripe'
import {
  mockStripeEvent,
  mockStripeCheckoutSession,
  mockStripeSubscription,
  mockNextRequest,
} from '../../utils/testHelpers'

// Mock Stripe
const mockConstructEvent = jest.fn()
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }))
})

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
  },
  COLLECTIONS: {
    USERS: 'users',
    TRANSACTIONS: 'transactions',
    INVOICES: 'invoices',
  },
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date('2024-01-15T10:00:00Z'),
    })),
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
    })),
  },
}))

// Mock logger
jest.mock('@/utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logDbOperation: jest.fn(),
}))

describe('Stripe Webhook Integration', () => {
  let mockCollection: jest.Mock
  let mockDoc: jest.Mock
  let mockGet: jest.Mock
  let mockSet: jest.Mock
  let mockUpdate: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockGet = jest.fn()
    mockSet = jest.fn()
    mockUpdate = jest.fn()

    mockDoc = jest.fn(() => ({
      get: mockGet,
      set: mockSet,
      update: mockUpdate,
    }))

    mockCollection = jest.fn(() => ({
      doc: mockDoc,
      where: jest.fn(() => ({
        get: mockGet,
      })),
    }))

    ;(db.collection as jest.Mock) = mockCollection
  })

  describe('Signature Verification', () => {
    it('should reject requests without signature', async () => {
      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: {},
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No signature')
    })

    it('should reject requests with invalid signature', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: {},
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid signature')
    })

    it('should accept requests with valid signature', async () => {
      const event = mockStripeEvent('checkout.session.completed', mockStripeCheckoutSession())
      mockConstructEvent.mockReturnValue(event)

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ stripeCustomerId: 'cus_123' }),
      })
      mockUpdate.mockResolvedValue(undefined)
      mockSet.mockResolvedValue(undefined)

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConstructEvent).toHaveBeenCalled()
    })
  })

  describe('checkout.session.completed', () => {
    it('should create transaction and update user on successful checkout', async () => {
      const session = mockStripeCheckoutSession({
        id: 'cs_123',
        amount_total: 100000, // £1000
        customer: 'cus_123',
        metadata: {
          invoiceId: 'inv_123',
          userId: 'user_123',
        },
      })

      const event = mockStripeEvent('checkout.session.completed', session)
      mockConstructEvent.mockReturnValue(event)

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ id: 'user_123', stripeCustomerId: 'cus_123' }),
      })
      mockUpdate.mockResolvedValue(undefined)
      mockSet.mockResolvedValue(undefined)

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)

      // Verify transaction was created
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100000,
          status: 'completed',
        })
      )

      // Verify invoice was updated to paid
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'paid',
        })
      )
    })

    it('should handle checkout without invoice metadata', async () => {
      const session = mockStripeCheckoutSession({
        metadata: {
          // No invoiceId
          userId: 'user_123',
        },
      })

      const event = mockStripeEvent('checkout.session.completed', session)
      mockConstructEvent.mockReturnValue(event)

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      // Should still process but not update invoice
      expect(response.status).toBe(200)
    })

    it('should calculate 3% commission correctly', async () => {
      const testAmounts = [
        { amount: 100000, expectedCommission: 3000, expectedNet: 97000 },
        { amount: 50000, expectedCommission: 1500, expectedNet: 48500 },
        { amount: 200000, expectedCommission: 6000, expectedNet: 194000 },
      ]

      for (const testCase of testAmounts) {
        const session = mockStripeCheckoutSession({
          amount_total: testCase.amount,
          metadata: {
            invoiceId: 'inv_123',
            userId: 'user_123',
          },
        })

        const event = mockStripeEvent('checkout.session.completed', session)
        mockConstructEvent.mockReturnValue(event)

        mockGet.mockResolvedValue({
          exists: true,
          data: () => ({ id: 'user_123' }),
        })

        const request = mockNextRequest('POST', '/api/webhook/stripe', {
          body: event,
          headers: {
            'stripe-signature': 'valid_signature',
          },
        })

        await POST(request)

        expect(mockSet).toHaveBeenCalledWith(
          expect.objectContaining({
            recoupCommission: testCase.expectedCommission,
            freelancerNet: testCase.expectedNet,
          })
        )
      }
    })
  })

  describe('customer.subscription.created', () => {
    it('should update user with subscription details', async () => {
      const subscription = mockStripeSubscription({
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
      })

      const event = mockStripeEvent('customer.subscription.created', subscription)
      mockConstructEvent.mockReturnValue(event)

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ id: 'user_123', stripeCustomerId: 'cus_123' }),
      })
      mockUpdate.mockResolvedValue(undefined)

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'active',
        })
      )
    })
  })

  describe('customer.subscription.updated', () => {
    it('should update subscription status on change', async () => {
      const subscription = mockStripeSubscription({
        id: 'sub_123',
        customer: 'cus_123',
        status: 'past_due',
      })

      const event = mockStripeEvent('customer.subscription.updated', subscription)
      mockConstructEvent.mockReturnValue(event)

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ id: 'user_123', stripeCustomerId: 'cus_123' }),
      })
      mockUpdate.mockResolvedValue(undefined)

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'past_due',
        })
      )
    })
  })

  describe('customer.subscription.deleted', () => {
    it('should mark subscription as cancelled', async () => {
      const subscription = mockStripeSubscription({
        id: 'sub_123',
        customer: 'cus_123',
        status: 'canceled',
      })

      const event = mockStripeEvent('customer.subscription.deleted', subscription)
      mockConstructEvent.mockReturnValue(event)

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ id: 'user_123', stripeCustomerId: 'cus_123' }),
      })
      mockUpdate.mockResolvedValue(undefined)

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'canceled',
        })
      )
    })
  })

  describe('payment_intent.succeeded', () => {
    it('should handle successful payment intent', async () => {
      const paymentIntent = {
        id: 'pi_123',
        amount: 100000,
        currency: 'gbp',
        customer: 'cus_123',
        status: 'succeeded',
        metadata: {
          invoiceId: 'inv_123',
          userId: 'user_123',
        },
      }

      const event = mockStripeEvent('payment_intent.succeeded', paymentIntent)
      mockConstructEvent.mockReturnValue(event)

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ id: 'user_123' }),
      })
      mockSet.mockResolvedValue(undefined)
      mockUpdate.mockResolvedValue(undefined)

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('payment_intent.payment_failed', () => {
    it('should log failed payment', async () => {
      const paymentIntent = {
        id: 'pi_123',
        amount: 100000,
        status: 'failed',
        last_payment_error: {
          message: 'Card declined',
        },
      }

      const event = mockStripeEvent('payment_intent.payment_failed', paymentIntent)
      mockConstructEvent.mockReturnValue(event)

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      // Should log error but not crash
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const session = mockStripeCheckoutSession()
      const event = mockStripeEvent('checkout.session.completed', session)
      mockConstructEvent.mockReturnValue(event)

      mockGet.mockRejectedValue(new Error('Database connection failed'))

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      // Should return 500 on internal error
      expect(response.status).toBeGreaterThanOrEqual(500)
    })

    it('should handle unknown event types gracefully', async () => {
      const event = mockStripeEvent('unknown.event.type', {})
      mockConstructEvent.mockReturnValue(event)

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      const response = await POST(request)

      // Should return 200 for unknown events (they're ignored)
      expect(response.status).toBe(200)
    })
  })

  describe('Idempotency', () => {
    it('should handle duplicate webhooks gracefully', async () => {
      const session = mockStripeCheckoutSession({
        id: 'cs_duplicate',
      })
      const event = mockStripeEvent('checkout.session.completed', session)
      mockConstructEvent.mockReturnValue(event)

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ id: 'user_123' }),
      })
      mockSet.mockResolvedValue(undefined)
      mockUpdate.mockResolvedValue(undefined)

      const request = mockNextRequest('POST', '/api/webhook/stripe', {
        body: event,
        headers: {
          'stripe-signature': 'valid_signature',
        },
      })

      // Send same webhook twice
      const response1 = await POST(request)
      const response2 = await POST(request)

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      // Both should succeed without errors
    })
  })
})

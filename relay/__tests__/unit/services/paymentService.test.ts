import {
  createPaymentConfirmation,
  clientConfirmPayment,
  freelancerVerifyPayment,
  getPaymentConfirmation,
  getPaymentConfirmationByToken,
  listPaymentConfirmations,
} from '@/services/paymentService'
import { db, Timestamp, COLLECTIONS } from '@/lib/firebase'
import { NotFoundError } from '@/utils/error'
import {
  mockPaymentConfirmation,
  mockInvoice,
  createMockFirestoreDoc,
  createMockFirestoreQuerySnapshot,
} from '../../utils/testHelpers'

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
  },
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date('2024-01-15T10:00:00Z'),
      toMillis: () => new Date('2024-01-15T10:00:00Z').getTime(),
      seconds: Math.floor(new Date('2024-01-15T10:00:00Z').getTime() / 1000),
      nanoseconds: 0,
    })),
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      toMillis: () => date.getTime(),
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    })),
  },
  COLLECTIONS: {
    PAYMENT_CONFIRMATIONS: 'payment_confirmations',
    INVOICES: 'invoices',
    TRANSACTIONS: 'transactions',
  },
}))

// Mock logger
jest.mock('@/utils/logger', () => ({
  logDbOperation: jest.fn(),
}))

// Mock helpers
jest.mock('@/utils/helpers', () => ({
  generateSecureToken: jest.fn(() => 'secure_token_123'),
}))

describe('PaymentService', () => {
  let mockCollection: jest.Mock
  let mockDoc: jest.Mock
  let mockGet: jest.Mock
  let mockSet: jest.Mock
  let mockUpdate: jest.Mock
  let mockWhere: jest.Mock
  let mockLimit: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockGet = jest.fn()
    mockSet = jest.fn()
    mockUpdate = jest.fn()
    mockWhere = jest.fn()
    mockLimit = jest.fn()

    mockDoc = jest.fn(() => ({
      get: mockGet,
      set: mockSet,
      update: mockUpdate,
      ref: {
        id: 'test_id',
        update: mockUpdate,
      },
    }))

    mockCollection = jest.fn(() => ({
      doc: mockDoc,
      where: mockWhere,
      add: jest.fn(),
      get: mockGet,
    }))

    ;(db.collection as jest.Mock) = mockCollection
  })

  describe('createPaymentConfirmation', () => {
    it('should create a payment confirmation successfully', async () => {
      mockSet.mockResolvedValue(undefined)

      const result = await createPaymentConfirmation(
        'inv_123',
        'user_123',
        'client@test.com',
        100000
      )

      expect(result).toMatchObject({
        invoiceId: 'inv_123',
        freelancerId: 'user_123',
        clientEmail: 'client@test.com',
        expectedAmount: 100000,
        status: 'pending_client',
        freelancerVerifiedReceived: false,
      })

      expect(result.confirmationId).toBeDefined()
      expect(result.confirmationToken).toBeDefined()
      expect(result.createdAt).toBeDefined()

      expect(mockCollection).toHaveBeenCalledWith(COLLECTIONS.PAYMENT_CONFIRMATIONS)
      expect(mockSet).toHaveBeenCalled()
    })

    it('should set token expiry to 2 days from now', async () => {
      mockSet.mockResolvedValue(undefined)

      const result = await createPaymentConfirmation(
        'inv_123',
        'user_123',
        'client@test.com',
        100000
      )

      const expiryDate = result.tokenExpiresAt.toDate()
      const expectedExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(expiryDate.getTime() - expectedExpiry.getTime())).toBeLessThan(1000)
    })
  })

  describe('clientConfirmPayment', () => {
    it('should confirm payment with valid token', async () => {
      const mockConfirmation = mockPaymentConfirmation({
        confirmationToken: 'valid_token',
        tokenExpiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // Tomorrow
      })

      mockWhere.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: [
              {
                data: () => mockConfirmation,
                ref: {
                  update: mockUpdate,
                },
              },
            ],
          }),
        }),
      })

      mockUpdate.mockResolvedValue(undefined)

      const result = await clientConfirmPayment(
        'valid_token',
        100000,
        'bank_transfer',
        '2024-01-10',
        'Payment via BACS'
      )

      expect(result.status).toBe('client_confirmed')
      expect(result.clientConfirmedAmount).toBe(100000)
      expect(result.clientPaymentMethod).toBe('bank_transfer')
      expect(result.clientNotes).toBe('Payment via BACS')

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'client_confirmed',
          clientConfirmedAmount: 100000,
          clientPaymentMethod: 'bank_transfer',
          clientConfirmedDate: '2024-01-10',
          clientNotes: 'Payment via BACS',
        })
      )
    })

    it('should throw error for invalid token', async () => {
      mockWhere.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: true,
            docs: [],
          }),
        }),
      })

      await expect(
        clientConfirmPayment('invalid_token', 100000, 'bank_transfer', '2024-01-10')
      ).rejects.toThrow(NotFoundError)

      await expect(
        clientConfirmPayment('invalid_token', 100000, 'bank_transfer', '2024-01-10')
      ).rejects.toThrow('Invalid confirmation token')
    })

    it('should throw error for expired token', async () => {
      const mockConfirmation = mockPaymentConfirmation({
        confirmationToken: 'expired_token',
        tokenExpiresAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)), // Yesterday
      })

      mockWhere.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: [
              {
                data: () => mockConfirmation,
                ref: {
                  update: mockUpdate,
                },
              },
            ],
          }),
        }),
      })

      await expect(
        clientConfirmPayment('expired_token', 100000, 'bank_transfer', '2024-01-10')
      ).rejects.toThrow('Confirmation token has expired')
    })
  })

  describe('freelancerVerifyPayment', () => {
    it('should verify payment and create transaction', async () => {
      const mockConfirmation = mockPaymentConfirmation({
        confirmationId: 'pc_123',
        freelancerId: 'user_123',
        status: 'client_confirmed',
        clientConfirmedAmount: 100000,
        clientPaymentMethod: 'bank_transfer',
      })

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockConfirmation,
        ref: {
          update: mockUpdate,
        },
      })

      mockUpdate.mockResolvedValue(undefined)
      mockSet.mockResolvedValue(undefined)

      const result = await freelancerVerifyPayment('pc_123', 'user_123')

      // Check confirmation was updated
      expect(result.confirmation.status).toBe('both_confirmed')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'both_confirmed',
          freelancerVerifiedReceived: true,
        })
      )

      // Check transaction was created
      expect(result.transaction).toMatchObject({
        invoiceId: mockConfirmation.invoiceId,
        freelancerId: 'user_123',
        amount: 100000,
        paymentMethod: 'bank_transfer',
        status: 'completed',
      })

      // Check commission calculation (3%)
      expect(result.transaction.recoupCommission).toBe(3000)
      expect(result.transaction.freelancerNet).toBe(97000)

      // Check invoice was updated to paid
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'paid',
        })
      )
    })

    it('should throw error if confirmation not found', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      })

      await expect(freelancerVerifyPayment('invalid_id', 'user_123')).rejects.toThrow(
        NotFoundError
      )
    })

    it('should throw error if user is not the owner', async () => {
      const mockConfirmation = mockPaymentConfirmation({
        confirmationId: 'pc_123',
        freelancerId: 'different_user',
      })

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockConfirmation,
      })

      await expect(freelancerVerifyPayment('pc_123', 'user_123')).rejects.toThrow(
        NotFoundError
      )
    })

    it('should throw error if client has not confirmed yet', async () => {
      const mockConfirmation = mockPaymentConfirmation({
        confirmationId: 'pc_123',
        freelancerId: 'user_123',
        status: 'pending_client',
      })

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockConfirmation,
      })

      await expect(freelancerVerifyPayment('pc_123', 'user_123')).rejects.toThrow(
        'Client has not confirmed payment yet'
      )
    })

    it('should calculate commission correctly for different amounts', async () => {
      const testCases = [
        { amount: 100000, expectedCommission: 3000, expectedNet: 97000 }, // £1000
        { amount: 50000, expectedCommission: 1500, expectedNet: 48500 }, // £500
        { amount: 200000, expectedCommission: 6000, expectedNet: 194000 }, // £2000
      ]

      for (const testCase of testCases) {
        const mockConfirmation = mockPaymentConfirmation({
          confirmationId: 'pc_test',
          freelancerId: 'user_123',
          status: 'client_confirmed',
          clientConfirmedAmount: testCase.amount,
        })

        mockGet.mockResolvedValue({
          exists: true,
          data: () => mockConfirmation,
          ref: { update: mockUpdate },
        })

        const result = await freelancerVerifyPayment('pc_test', 'user_123')

        expect(result.transaction.recoupCommission).toBe(testCase.expectedCommission)
        expect(result.transaction.freelancerNet).toBe(testCase.expectedNet)
      }
    })
  })

  describe('getPaymentConfirmation', () => {
    it('should retrieve payment confirmation for owner', async () => {
      const mockConfirmation = mockPaymentConfirmation({
        confirmationId: 'pc_123',
        freelancerId: 'user_123',
      })

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockConfirmation,
      })

      const result = await getPaymentConfirmation('pc_123', 'user_123')

      expect(result).toEqual(mockConfirmation)
      expect(mockDoc).toHaveBeenCalledWith('pc_123')
    })

    it('should throw error for non-owner', async () => {
      const mockConfirmation = mockPaymentConfirmation({
        confirmationId: 'pc_123',
        freelancerId: 'different_user',
      })

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockConfirmation,
      })

      await expect(getPaymentConfirmation('pc_123', 'user_123')).rejects.toThrow(
        NotFoundError
      )
    })
  })

  describe('getPaymentConfirmationByToken', () => {
    it('should retrieve confirmation by valid token', async () => {
      const mockConfirmation = mockPaymentConfirmation({
        confirmationToken: 'valid_token',
        tokenExpiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      })

      mockWhere.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: [{ data: () => mockConfirmation }],
          }),
        }),
      })

      const result = await getPaymentConfirmationByToken('valid_token')

      expect(result).toEqual(mockConfirmation)
    })

    it('should throw error for expired token', async () => {
      const mockConfirmation = mockPaymentConfirmation({
        confirmationToken: 'expired_token',
        tokenExpiresAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      })

      mockWhere.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: [{ data: () => mockConfirmation }],
          }),
        }),
      })

      await expect(getPaymentConfirmationByToken('expired_token')).rejects.toThrow(
        'Confirmation token has expired'
      )
    })
  })

  describe('listPaymentConfirmations', () => {
    it('should list confirmations for invoice and user', async () => {
      const mockConfirmations = [
        mockPaymentConfirmation({ confirmationId: 'pc_1' }),
        mockPaymentConfirmation({ confirmationId: 'pc_2' }),
      ]

      mockWhere.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              docs: mockConfirmations.map(c => ({ data: () => c })),
            }),
          }),
        }),
      })

      const result = await listPaymentConfirmations('inv_123', 'user_123')

      expect(result).toHaveLength(2)
      expect(result[0].confirmationId).toBe('pc_1')
      expect(result[1].confirmationId).toBe('pc_2')
    })

    it('should return empty array if no confirmations found', async () => {
      mockWhere.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              docs: [],
            }),
          }),
        }),
      })

      const result = await listPaymentConfirmations('inv_123', 'user_123')

      expect(result).toEqual([])
    })
  })
})

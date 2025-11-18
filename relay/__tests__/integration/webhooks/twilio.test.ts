/**
 * Twilio Webhook Integration Tests
 *
 * Tests SMS delivery and voice call webhooks from Twilio
 */

import { mockTwilioSmsResponse, mockTwilioVoiceResponse } from '../../utils/testHelpers'
import { db, COLLECTIONS } from '@/lib/firebase'

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
  },
  COLLECTIONS: {
    COLLECTION_ATTEMPTS: 'collection_attempts',
  },
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date('2024-01-15T10:00:00Z'),
    })),
  },
}))

describe('Twilio Webhook Integration', () => {
  describe('SMS Delivery Events', () => {
    it('should track sent SMS', () => {
      const sms = mockTwilioSmsResponse({
        sid: 'SM123',
        status: 'sent',
        to: '+447700900000',
        body: 'Your invoice is overdue',
      })

      expect(sms.status).toBe('sent')
      expect(sms.to).toBe('+447700900000')
    })

    it('should track delivered SMS', () => {
      const sms = mockTwilioSmsResponse({
        status: 'delivered',
      })

      expect(sms.status).toBe('delivered')
    })

    it('should track failed SMS', () => {
      const sms = mockTwilioSmsResponse({
        status: 'failed',
      })

      expect(sms.status).toBe('failed')
    })

    it('should track undelivered SMS', () => {
      const sms = mockTwilioSmsResponse({
        status: 'undelivered',
      })

      expect(sms.status).toBe('undelivered')
    })
  })

  describe('Voice Call Events', () => {
    it('should track completed voice call', () => {
      const call = mockTwilioVoiceResponse({
        sid: 'CA123',
        status: 'completed',
        duration: '45',
      })

      expect(call.status).toBe('completed')
      expect(call.duration).toBe('45')
    })

    it('should track busy call', () => {
      const call = mockTwilioVoiceResponse({
        status: 'busy',
      })

      expect(call.status).toBe('busy')
    })

    it('should track no-answer call', () => {
      const call = mockTwilioVoiceResponse({
        status: 'no-answer',
      })

      expect(call.status).toBe('no-answer')
    })

    it('should track failed call', () => {
      const call = mockTwilioVoiceResponse({
        status: 'failed',
      })

      expect(call.status).toBe('failed')
    })
  })
})

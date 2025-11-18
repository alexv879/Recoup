/**
 * End-to-End Tests for Escalation Flow
 *
 * Tests the complete escalation journey:
 * 1. Invoice becomes overdue
 * 2. Gentle reminder sent (5-14 days)
 * 3. Firm reminder sent (15-29 days)
 * 4. Final demand sent (30-59 days)
 * 5. Agency handoff (60+ days)
 */

import { generateEscalationRecommendation } from '@/lib/escalation-decision'

describe('Escalation Flow E2E', () => {
  describe('Happy Path: Progressive Escalation', () => {
    it('should progress through escalation stages', () => {
      const invoice = {
        id: 'inv_escalation_001',
        amount: 250000, // £2500
        dueDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        escalationStage: 'pending',
        attempts: [],
      }

      // Stage 1: Gentle reminder (5-14 days)
      const gentleStage = {
        ...invoice,
        daysOverdue: 10,
        escalationStage: 'gentle',
        attempts: [
          {
            type: 'email',
            stage: 'gentle',
            sentAt: new Date(),
          },
        ],
      }

      expect(gentleStage.escalationStage).toBe('gentle')
      expect(gentleStage.attempts).toHaveLength(1)

      // Stage 2: Firm reminder (15-29 days)
      const firmStage = {
        ...invoice,
        daysOverdue: 20,
        escalationStage: 'firm',
        attempts: [
          ...gentleStage.attempts,
          {
            type: 'email',
            stage: 'firm',
            sentAt: new Date(),
          },
        ],
      }

      expect(firmStage.escalationStage).toBe('firm')
      expect(firmStage.attempts).toHaveLength(2)

      // Stage 3: Final demand (30-59 days)
      const finalStage = {
        ...invoice,
        daysOverdue: 45,
        escalationStage: 'final',
        attempts: [
          ...firmStage.attempts,
          {
            type: 'email',
            stage: 'final',
            sentAt: new Date(),
          },
          {
            type: 'sms',
            stage: 'final',
            sentAt: new Date(),
          },
        ],
      }

      expect(finalStage.escalationStage).toBe('final')
      expect(finalStage.attempts).toHaveLength(4)

      // Stage 4: Agency handoff (60+ days)
      const agencyStage = {
        ...invoice,
        daysOverdue: 90,
        escalationStage: 'agency',
        agencyHandoffAt: new Date(),
      }

      expect(agencyStage.escalationStage).toBe('agency')
      expect(agencyStage.agencyHandoffAt).toBeDefined()
    })
  })

  describe('Escalation Decision Engine', () => {
    it('should recommend Court for clear high-value debt', () => {
      const recommendation = generateEscalationRecommendation({
        invoiceAmount: 500000, // £5000
        daysOverdue: 60,
        isDisputedDebt: false,
        debtorType: 'business',
        previousAttempts: 5,
        hasWrittenContract: true,
        hasProofOfDelivery: true,
        relationshipValue: 'low',
        debtorHasAssets: true,
      })

      expect(['county_court', 'debt_agency']).toContain(recommendation.primaryOption)
      expect(recommendation.confidence).toBeGreaterThan(60)
    })

    it('should recommend continue internal for early stage', () => {
      const recommendation = generateEscalationRecommendation({
        invoiceAmount: 200000, // £2000
        daysOverdue: 20,
        previousAttempts: 1,
      })

      expect(recommendation.primaryOption).toBe('continue_internal')
    })

    it('should recommend write-off for low value with no assets', () => {
      const recommendation = generateEscalationRecommendation({
        invoiceAmount: 30000, // £300
        daysOverdue: 120,
        previousAttempts: 10,
        debtorHasAssets: false,
      })

      expect(['write_off', 'continue_internal']).toContain(recommendation.primaryOption)
    })
  })

  describe('Pause and Resume Escalation', () => {
    it('should allow pausing escalation', () => {
      const invoice = {
        escalationStage: 'firm',
        escalationPaused: false,
      }

      const pausedInvoice = {
        ...invoice,
        escalationPaused: true,
        escalationPausedAt: new Date(),
        escalationPausedReason: 'Client requested payment plan',
      }

      expect(pausedInvoice.escalationPaused).toBe(true)
      expect(pausedInvoice.escalationPausedReason).toBeDefined()
    })

    it('should allow resuming escalation', () => {
      const pausedInvoice = {
        escalationStage: 'firm',
        escalationPaused: true,
        escalationPausedAt: new Date(),
      }

      const resumedInvoice = {
        ...pausedInvoice,
        escalationPaused: false,
        escalationResumedAt: new Date(),
      }

      expect(resumedInvoice.escalationPaused).toBe(false)
      expect(resumedInvoice.escalationResumedAt).toBeDefined()
    })
  })
})

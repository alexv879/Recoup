import {
  generateEscalationRecommendation,
  getCountyCourtFee,
  calculateAgencyCommission,
  compareEscalationOptions,
  formatEscalationRecommendation,
  EscalationDecisionParams,
} from '@/lib/escalation-decision'

describe('Escalation Decision Engine', () => {
  describe('getCountyCourtFee', () => {
    it('should calculate correct fees for different claim amounts', () => {
      expect(getCountyCourtFee(200)).toBe(35) // £0-£300
      expect(getCountyCourtFee(300)).toBe(35)
      expect(getCountyCourtFee(400)).toBe(50) // £301-£500
      expect(getCountyCourtFee(500)).toBe(50)
      expect(getCountyCourtFee(800)).toBe(70) // £501-£1000
      expect(getCountyCourtFee(1000)).toBe(70)
      expect(getCountyCourtFee(1200)).toBe(80) // £1001-£1500
      expect(getCountyCourtFee(1500)).toBe(80)
      expect(getCountyCourtFee(2500)).toBe(115) // £1501-£3000
      expect(getCountyCourtFee(3000)).toBe(115)
      expect(getCountyCourtFee(4000)).toBe(205) // £3001-£5000
      expect(getCountyCourtFee(5000)).toBe(205)
      expect(getCountyCourtFee(8000)).toBe(455) // £5001-£10000
      expect(getCountyCourtFee(10000)).toBe(455)
    })

    it('should calculate 5% fee for claims above £10,000', () => {
      expect(getCountyCourtFee(15000)).toBe(750) // 5% of £15,000
      expect(getCountyCourtFee(20000)).toBe(1000) // 5% of £20,000
      expect(getCountyCourtFee(50000)).toBe(2500) // 5% of £50,000
    })

    it('should cap fee at £10,000 for very large claims', () => {
      expect(getCountyCourtFee(250000)).toBe(10000) // Would be £12,500 but capped
      expect(getCountyCourtFee(500000)).toBe(10000)
    })
  })

  describe('calculateAgencyCommission', () => {
    it('should calculate commission range correctly', () => {
      const result = calculateAgencyCommission(10000)

      expect(result.min).toBe(1500) // 15% of £10,000
      expect(result.max).toBe(2500) // 25% of £10,000
      expect(result.percentage).toBe('15-25%')
    })

    it('should scale commission with different amounts', () => {
      expect(calculateAgencyCommission(5000).min).toBe(750)
      expect(calculateAgencyCommission(5000).max).toBe(1250)

      expect(calculateAgencyCommission(20000).min).toBe(3000)
      expect(calculateAgencyCommission(20000).max).toBe(5000)
    })
  })

  describe('generateEscalationRecommendation', () => {
    describe('Low value debts (< £500)', () => {
      it('should recommend write-off or continue internal for very low amounts', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 300,
          daysOverdue: 90,
          previousAttempts: 5,
        }

        const result = generateEscalationRecommendation(params)

        expect(['write_off', 'continue_internal']).toContain(result.primaryOption)
        expect(result.costs.countyCourtFee).toBe(35)
        expect(result.warnings).toBeDefined()
        expect(result.warnings?.some(w => w.includes('recovery costs'))).toBe(true)
      })
    })

    describe('Medium value debts (£500-£5000)', () => {
      it('should recommend County Court for clear, undisputed debt', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 2000,
          daysOverdue: 60,
          isDisputedDebt: false,
          debtorType: 'business',
          previousAttempts: 4,
          hasWrittenContract: true,
          hasProofOfDelivery: true,
          relationshipValue: 'low',
        }

        const result = generateEscalationRecommendation(params)

        expect(result.primaryOption).toBe('county_court')
        expect(result.confidence).toBeGreaterThan(60)
        expect(result.costs.countyCourtFee).toBe(115)
        expect(result.reasoning).toContain(
          expect.stringContaining('County Court')
        )
      })

      it('should recommend Agency for disputed debt', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 2000,
          daysOverdue: 60,
          isDisputedDebt: true,
          debtorType: 'individual',
          previousAttempts: 4,
          relationshipValue: 'high',
        }

        const result = generateEscalationRecommendation(params)

        expect(['debt_agency', 'continue_internal']).toContain(result.primaryOption)
        expect(result.warnings).toBeDefined()
        expect(result.warnings?.some(w => w.includes('Court requires clear'))).toBe(true)
      })
    })

    describe('High value debts (> £5000)', () => {
      it('should recommend Agency for high value debts', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 15000,
          daysOverdue: 90,
          isDisputedDebt: false,
          debtorType: 'business',
          previousAttempts: 6,
          hasWrittenContract: true,
          hasProofOfDelivery: true,
        }

        const result = generateEscalationRecommendation(params)

        expect(['county_court', 'debt_agency']).toContain(result.primaryOption)
        expect(result.confidence).toBeGreaterThan(50)
        expect(result.costs.agencyCommission).toBeDefined()
        expect(result.costs.agencyCommission?.min).toBe(2250) // 15% of £15,000
        expect(result.costs.agencyCommission?.max).toBe(3750) // 25% of £15,000
      })
    })

    describe('Early stage debts (< 45 days overdue)', () => {
      it('should recommend continue internal collection', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 2000,
          daysOverdue: 30,
          previousAttempts: 1,
        }

        const result = generateEscalationRecommendation(params)

        expect(result.primaryOption).toBe('continue_internal')
        expect(result.reasoning).toContain(
          expect.stringContaining('continue internal')
        )
      })
    })

    describe('Debtor with no assets', () => {
      it('should lean towards write-off if debtor has no assets', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 2000,
          daysOverdue: 90,
          debtorHasAssets: false,
          previousAttempts: 5,
        }

        const result = generateEscalationRecommendation(params)

        expect(result.warnings).toBeDefined()
        expect(result.warnings?.some(w => w.includes('no known assets'))).toBe(true)
      })

      it('should recommend Court if debtor has known assets', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 2000,
          daysOverdue: 90,
          debtorHasAssets: true,
          debtorType: 'business',
          previousAttempts: 5,
          hasWrittenContract: true,
          hasProofOfDelivery: true,
          isDisputedDebt: false,
        }

        const result = generateEscalationRecommendation(params)

        expect(result.primaryOption).toBe('county_court')
        expect(result.reasoning).toContain(
          expect.stringContaining('known assets')
        )
      })
    })

    describe('High relationship value', () => {
      it('should consider relationship impact and lean towards agency', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 3000,
          daysOverdue: 60,
          relationshipValue: 'high',
          previousAttempts: 4,
        }

        const result = generateEscalationRecommendation(params)

        expect(result.warnings).toBeDefined()
        expect(result.warnings?.some(w => w.includes('relationship'))).toBe(true)
      })

      it('should not worry about relationship if value is low', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 3000,
          daysOverdue: 60,
          relationshipValue: 'low',
          previousAttempts: 4,
          debtorType: 'business',
          hasWrittenContract: true,
          hasProofOfDelivery: true,
          isDisputedDebt: false,
        }

        const result = generateEscalationRecommendation(params)

        expect(result.reasoning).toContain(
          expect.stringContaining('no concern')
        )
      })
    })

    describe('Evidence strength', () => {
      it('should favor Court with strong evidence', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 2000,
          daysOverdue: 60,
          hasWrittenContract: true,
          hasProofOfDelivery: true,
          isDisputedDebt: false,
          debtorType: 'business',
          previousAttempts: 4,
        }

        const result = generateEscalationRecommendation(params)

        expect(result.primaryOption).toBe('county_court')
        expect(result.reasoning).toContain(
          expect.stringContaining('Strong evidence')
        )
      })

      it('should warn about weak evidence', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 2000,
          daysOverdue: 60,
          hasWrittenContract: false,
          hasProofOfDelivery: false,
          previousAttempts: 4,
        }

        const result = generateEscalationRecommendation(params)

        expect(result.warnings).toBeDefined()
        expect(result.warnings?.some(w => w.includes('Weak evidence'))).toBe(true)
      })
    })

    describe('Net recovery calculation', () => {
      it('should calculate net recovery correctly', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 5000,
          daysOverdue: 60,
          previousAttempts: 4,
        }

        const result = generateEscalationRecommendation(params)

        expect(result.costs.countyCourtFee).toBe(205)
        expect(result.costs.netRecovery?.courtOption).toBe(4795) // £5000 - £205

        const expectedAgencyMin = 5000 - (5000 * 0.25) // 5000 - 1250 = 3750
        const expectedAgencyMax = 5000 - (5000 * 0.15) // 5000 - 750 = 4250
        const expectedAgencyAvg = (expectedAgencyMin + expectedAgencyMax) / 2 // 4000

        expect(result.costs.netRecovery?.agencyOption).toBe(expectedAgencyAvg)
      })
    })

    describe('Next steps generation', () => {
      it('should provide Court next steps for court recommendation', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 2000,
          daysOverdue: 60,
          isDisputedDebt: false,
          debtorType: 'business',
          previousAttempts: 5,
          hasWrittenContract: true,
          hasProofOfDelivery: true,
        }

        const result = generateEscalationRecommendation(params)

        if (result.primaryOption === 'county_court') {
          expect(result.nextSteps).toContain(
            expect.stringContaining('Money Claim Online')
          )
          expect(result.nextSteps).toContain(
            expect.stringContaining('Letter Before Action')
          )
        }
      })

      it('should provide Agency next steps for agency recommendation', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 10000,
          daysOverdue: 90,
          isDisputedDebt: true,
          relationshipValue: 'high',
          previousAttempts: 5,
        }

        const result = generateEscalationRecommendation(params)

        if (result.primaryOption === 'debt_agency') {
          expect(result.nextSteps).toContain(
            expect.stringContaining('agency')
          )
          expect(result.nextSteps.join(' ')).toContain('commission')
        }
      })
    })

    describe('Confidence scoring', () => {
      it('should have higher confidence with more decisive factors', () => {
        const strongParams: EscalationDecisionParams = {
          invoiceAmount: 3000,
          daysOverdue: 90,
          isDisputedDebt: false,
          debtorType: 'business',
          previousAttempts: 6,
          hasWrittenContract: true,
          hasProofOfDelivery: true,
          debtorHasAssets: true,
          relationshipValue: 'low',
        }

        const weakParams: EscalationDecisionParams = {
          invoiceAmount: 3000,
          daysOverdue: 45,
          previousAttempts: 2,
        }

        const strongResult = generateEscalationRecommendation(strongParams)
        const weakResult = generateEscalationRecommendation(weakParams)

        expect(strongResult.confidence).toBeGreaterThan(weakResult.confidence)
      })

      it('should never exceed 95% confidence', () => {
        const params: EscalationDecisionParams = {
          invoiceAmount: 5000,
          daysOverdue: 120,
          isDisputedDebt: false,
          debtorType: 'business',
          previousAttempts: 10,
          hasWrittenContract: true,
          hasProofOfDelivery: true,
          debtorHasAssets: true,
          relationshipValue: 'low',
        }

        const result = generateEscalationRecommendation(params)

        expect(result.confidence).toBeLessThanOrEqual(95)
      })
    })
  })

  describe('compareEscalationOptions', () => {
    it('should provide side-by-side comparison', () => {
      const result = compareEscalationOptions(3000)

      expect(result.courtOption.fee).toBe(115)
      expect(result.courtOption.netRecovery).toBe(2885)
      expect(result.courtOption.timeline).toBe('30-90 days')
      expect(result.courtOption.successRate).toBe('66-75%')
      expect(result.courtOption.pros).toContain('Higher success rate (66-75%)')
      expect(result.courtOption.cons).toContain('Requires active involvement (filing, evidence)')

      expect(result.agencyOption.commissionRange).toBe('15-25%')
      expect(result.agencyOption.netRecoveryMin).toBe(2250) // £3000 - 25%
      expect(result.agencyOption.netRecoveryMax).toBe(2550) // £3000 - 15%
      expect(result.agencyOption.timeline).toBe('60-120 days')
      expect(result.agencyOption.successRate).toBe('50-60%')
      expect(result.agencyOption.pros).toContain('Passive - agency handles everything')
      expect(result.agencyOption.cons).toContain('Lower success rate (50-60%)')
    })

    it('should recommend Court for amounts < £1500', () => {
      const result = compareEscalationOptions(1000)
      expect(result.recommendation).toContain('County Court')
    })

    it('should recommend Court for amounts £1500-£5000', () => {
      const result = compareEscalationOptions(3000)
      expect(result.recommendation).toContain('County Court')
    })

    it('should recommend Agency for amounts > £5000', () => {
      const result = compareEscalationOptions(10000)
      expect(result.recommendation).toContain('Agency')
    })
  })

  describe('formatEscalationRecommendation', () => {
    it('should format recommendation as readable text', () => {
      const params: EscalationDecisionParams = {
        invoiceAmount: 2000,
        daysOverdue: 60,
        isDisputedDebt: false,
        debtorType: 'business',
        previousAttempts: 4,
        hasWrittenContract: true,
        hasProofOfDelivery: true,
      }

      const recommendation = generateEscalationRecommendation(params)
      const formatted = formatEscalationRecommendation(recommendation)

      expect(formatted).toContain('ESCALATION RECOMMENDATION')
      expect(formatted).toContain('PRIMARY OPTION:')
      expect(formatted).toContain('Confidence:')
      expect(formatted).toContain('REASONING:')
      expect(formatted).toContain('COST ANALYSIS:')
      expect(formatted).toContain('TIMELINE:')
      expect(formatted).toContain('SUCCESS RATES:')
      expect(formatted).toContain('NEXT STEPS:')
    })

    it('should include warnings if present', () => {
      const params: EscalationDecisionParams = {
        invoiceAmount: 300,
        daysOverdue: 120,
        previousAttempts: 5,
        debtorHasAssets: false,
      }

      const recommendation = generateEscalationRecommendation(params)
      const formatted = formatEscalationRecommendation(recommendation)

      if (recommendation.warnings && recommendation.warnings.length > 0) {
        expect(formatted).toContain('⚠️ WARNINGS:')
      }
    })
  })
})

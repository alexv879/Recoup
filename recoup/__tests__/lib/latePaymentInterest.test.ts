/**
 * Unit Tests: Late Payment Interest Calculator
 * Tests UK Late Payment of Commercial Debts (Interest) Act 1998 compliance
 */

import {
  calculateLateCharges,
  formatPounds,
  formatPercentage,
  getFixedFeeTierDescription,
  getNextBaseRateReviewDate,
  LEGAL_DISCLAIMER,
  type LatePaymentBreakdown,
} from '@/lib/latePaymentInterest';

describe('calculateLateCharges', () => {
  describe('Input Validation', () => {
    it('should throw error for negative principal amount', () => {
      expect(() => calculateLateCharges(-1000, 30)).toThrow(
        'Principal amount cannot be negative'
      );
    });

    it('should handle zero days overdue', () => {
      const result = calculateLateCharges(50000, 0);
      expect(result.daysOverdue).toBe(0);
      expect(result.totalInterest).toBe(0);
      expect(result.totalClaimable).toBeGreaterThan(0); // Fixed fee still applies
    });

    it('should return zero interest for negative days overdue', () => {
      const result = calculateLateCharges(50000, -10);
      expect(result.daysOverdue).toBe(0);
      expect(result.totalInterest).toBe(0);
      expect(result.fixedCompensationFee).toBe(0);
      expect(result.totalClaimable).toBe(0);
    });
  });

  describe('Interest Calculation Accuracy', () => {
    it('should calculate correct interest for £500 invoice, 45 days late', () => {
      // £500 = 50000 pence
      // 13.25% annual rate / 365 = 0.036301% daily
      // 50000 * 0.0003630137 * 45 = 816.78 pence = £8.17
      const result = calculateLateCharges(50000, 45);

      expect(result.principalAmount).toBe(50000);
      expect(result.daysOverdue).toBe(45);
      expect(result.annualRate).toBe(0.1325); // 13.25%
      expect(result.dailyInterestRate).toBeCloseTo(0.0003630137, 10);

      // Interest should be approximately 817 pence (£8.17)
      expect(result.totalInterest).toBeGreaterThanOrEqual(816);
      expect(result.totalInterest).toBeLessThanOrEqual(818);
    });

    it('should calculate correct interest for £1,000 invoice, 90 days late', () => {
      // £1,000 = 100000 pence
      // 13.25% annual / 365 = 0.036301% daily
      // 100000 * 0.0003630137 * 90 = 3267.12 pence = £32.67
      const result = calculateLateCharges(100000, 90);

      expect(result.principalAmount).toBe(100000);
      expect(result.daysOverdue).toBe(90);

      // Interest should be approximately 3267 pence (£32.67)
      expect(result.totalInterest).toBeGreaterThanOrEqual(3266);
      expect(result.totalInterest).toBeLessThanOrEqual(3268);
    });

    it('should calculate correct interest for large invoice £50,000, 30 days late', () => {
      // £50,000 = 5000000 pence
      // 5000000 * 0.0003630137 * 30 = 54452.05 pence = £544.52
      const result = calculateLateCharges(5000000, 30);

      expect(result.principalAmount).toBe(5000000);
      expect(result.daysOverdue).toBe(30);

      // Interest should be approximately 54452 pence (£544.52)
      expect(result.totalInterest).toBeGreaterThanOrEqual(54451);
      expect(result.totalInterest).toBeLessThanOrEqual(54453);
    });

    it('should use simple interest, not compound', () => {
      const result1 = calculateLateCharges(100000, 30);
      const result2 = calculateLateCharges(100000, 60);

      // Simple interest should double when days double
      expect(result2.totalInterest).toBeCloseTo(result1.totalInterest * 2, 0);
    });
  });

  describe('Fixed Compensation Fee Tiers', () => {
    it('should apply £40 fee for invoices ≤£999.99', () => {
      expect(calculateLateCharges(10000, 10).fixedCompensationFee).toBe(4000); // £100
      expect(calculateLateCharges(50000, 10).fixedCompensationFee).toBe(4000); // £500
      expect(calculateLateCharges(99999, 10).fixedCompensationFee).toBe(4000); // £999.99
    });

    it('should apply £70 fee for invoices £1,000-£9,999.99', () => {
      expect(calculateLateCharges(100000, 10).fixedCompensationFee).toBe(7000); // £1,000
      expect(calculateLateCharges(500000, 10).fixedCompensationFee).toBe(7000); // £5,000
      expect(calculateLateCharges(999999, 10).fixedCompensationFee).toBe(7000); // £9,999.99
    });

    it('should apply £100 fee for invoices ≥£10,000', () => {
      expect(calculateLateCharges(1000000, 10).fixedCompensationFee).toBe(10000); // £10,000
      expect(calculateLateCharges(5000000, 10).fixedCompensationFee).toBe(10000); // £50,000
      expect(calculateLateCharges(100000000, 10).fixedCompensationFee).toBe(10000); // £1,000,000
    });
  });

  describe('Total Claimable Amount', () => {
    it('should sum interest and fixed fee correctly', () => {
      const result = calculateLateCharges(100000, 45); // £1,000, 45 days
      const expectedTotal = result.totalInterest + result.fixedCompensationFee;

      expect(result.totalClaimable).toBe(expectedTotal);
      expect(result.totalClaimable).toBeGreaterThan(result.totalInterest);
      expect(result.totalClaimable).toBeGreaterThan(result.fixedCompensationFee);
    });

    it('should include fixed fee even with zero interest', () => {
      const result = calculateLateCharges(50000, 0); // £500, 0 days late

      expect(result.totalInterest).toBe(0);
      expect(result.fixedCompensationFee).toBe(4000); // £40
      expect(result.totalClaimable).toBe(4000);
    });
  });

  describe('Rate Constants', () => {
    it('should use correct Bank of England base rate', () => {
      const result = calculateLateCharges(100000, 30);
      expect(result.baseRate).toBe(0.0525); // 5.25%
    });

    it('should calculate total annual rate correctly', () => {
      const result = calculateLateCharges(100000, 30);
      // Base rate 5.25% + Statutory 8% = 13.25%
      expect(result.annualRate).toBe(0.1325);
    });

    it('should calculate daily rate correctly', () => {
      const result = calculateLateCharges(100000, 30);
      // 13.25% / 365 days
      expect(result.dailyInterestRate).toBeCloseTo(0.0003630137, 10);
    });
  });
});

describe('formatPounds', () => {
  it('should format pence to pounds with 2 decimals', () => {
    expect(formatPounds(0)).toBe('0.00');
    expect(formatPounds(100)).toBe('1.00');
    expect(formatPounds(1000)).toBe('10.00');
    expect(formatPounds(99999)).toBe('999.99');
    expect(formatPounds(123456)).toBe('1234.56');
  });

  it('should handle fractional pence correctly', () => {
    expect(formatPounds(123)).toBe('1.23');
    expect(formatPounds(1)).toBe('0.01');
    expect(formatPounds(99)).toBe('0.99');
  });
});

describe('formatPercentage', () => {
  it('should format decimal to percentage with 2 decimals', () => {
    expect(formatPercentage(0.1325)).toBe('13.25%');
    expect(formatPercentage(0.08)).toBe('8.00%');
    expect(formatPercentage(0.0525)).toBe('5.25%');
    expect(formatPercentage(0.0003630137)).toBe('0.04%');
  });

  it('should handle edge cases', () => {
    expect(formatPercentage(0)).toBe('0.00%');
    expect(formatPercentage(1)).toBe('100.00%');
    expect(formatPercentage(0.5)).toBe('50.00%');
  });
});

describe('getFixedFeeTierDescription', () => {
  it('should return correct description for Tier 1 (≤£999.99)', () => {
    expect(getFixedFeeTierDescription(10000)).toBe('£999.99 or less');
    expect(getFixedFeeTierDescription(50000)).toBe('£999.99 or less');
    expect(getFixedFeeTierDescription(99999)).toBe('£999.99 or less');
  });

  it('should return correct description for Tier 2 (£1,000-£9,999.99)', () => {
    expect(getFixedFeeTierDescription(100000)).toBe('£1,000 - £9,999.99');
    expect(getFixedFeeTierDescription(500000)).toBe('£1,000 - £9,999.99');
    expect(getFixedFeeTierDescription(999999)).toBe('£1,000 - £9,999.99');
  });

  it('should return correct description for Tier 3 (≥£10,000)', () => {
    expect(getFixedFeeTierDescription(1000000)).toBe('£10,000 or more');
    expect(getFixedFeeTierDescription(5000000)).toBe('£10,000 or more');
    expect(getFixedFeeTierDescription(100000000)).toBe('£10,000 or more');
  });
});

describe('getNextBaseRateReviewDate', () => {
  it('should return July 1 when called before July 1', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-03-15'));

    const reviewDate = getNextBaseRateReviewDate();
    expect(reviewDate.getMonth()).toBe(6); // July (0-indexed)
    expect(reviewDate.getDate()).toBe(1);

    jest.useRealTimers();
  });

  it('should return next January 1 when called after July 1', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-09-15'));

    const reviewDate = getNextBaseRateReviewDate();
    expect(reviewDate.getMonth()).toBe(0); // January (0-indexed)
    expect(reviewDate.getDate()).toBe(1);
    expect(reviewDate.getFullYear()).toBe(2026);

    jest.useRealTimers();
  });

  it('should return July 1 when called on January 1', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01'));

    const reviewDate = getNextBaseRateReviewDate();
    expect(reviewDate.getMonth()).toBe(6); // July
    expect(reviewDate.getDate()).toBe(1);

    jest.useRealTimers();
  });
});

describe('LEGAL_DISCLAIMER', () => {
  it('should contain required legal information', () => {
    expect(LEGAL_DISCLAIMER).toContain('Late Payment of Commercial Debts (Interest) Act 1998');
    expect(LEGAL_DISCLAIMER).toContain('informational purposes only');
    expect(LEGAL_DISCLAIMER).toContain('not automatically add interest');
    expect(LEGAL_DISCLAIMER).toContain('manually');
  });

  it('should emphasize user responsibility', () => {
    expect(LEGAL_DISCLAIMER).toContain('YOU decide');
    expect(LEGAL_DISCLAIMER).toContain('You are responsible');
  });
});

describe('Edge Cases and Real-World Scenarios', () => {
  it('should handle very small invoices (£1)', () => {
    const result = calculateLateCharges(100, 30); // £1 for 30 days

    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.fixedCompensationFee).toBe(4000); // £40 fixed fee
    expect(result.totalClaimable).toBeGreaterThan(4000);
  });

  it('should handle very large invoices (£1,000,000)', () => {
    const result = calculateLateCharges(100000000, 60); // £1M for 60 days

    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.fixedCompensationFee).toBe(10000); // £100 fixed fee
    expect(result.totalClaimable).toBe(result.totalInterest + 10000);
  });

  it('should handle very long overdue periods (365 days)', () => {
    const result = calculateLateCharges(100000, 365); // £1,000 for 1 year

    // After 1 year at 13.25%, should be approximately £132.50
    expect(result.totalInterest).toBeGreaterThanOrEqual(13200);
    expect(result.totalInterest).toBeLessThanOrEqual(13300);
  });

  it('should produce consistent results for repeated calls', () => {
    const result1 = calculateLateCharges(50000, 45);
    const result2 = calculateLateCharges(50000, 45);

    expect(result1).toEqual(result2);
  });

  it('should round interest correctly to whole pence', () => {
    const result = calculateLateCharges(12345, 67); // Odd numbers to test rounding

    // Result should be whole number (pence)
    expect(Number.isInteger(result.totalInterest)).toBe(true);
    expect(Number.isInteger(result.totalClaimable)).toBe(true);
  });
});

describe('Compliance and Legal Requirements', () => {
  it('should match statutory requirements from UK law', () => {
    // Test case from gov.uk guidance
    // £1,000 invoice, 30 days late at 13.25% = £10.90 interest
    const result = calculateLateCharges(100000, 30);

    expect(result.annualRate).toBe(0.1325); // 13.25% statutory + base rate
    expect(result.fixedCompensationFee).toBe(7000); // £70 for £1K-£10K range

    // Interest calculation: £1,000 × 13.25% × (30/365) = £10.89
    expect(result.totalInterest).toBeGreaterThanOrEqual(1088);
    expect(result.totalInterest).toBeLessThanOrEqual(1090);
  });

  it('should use Bank of England base rate correctly', () => {
    const result = calculateLateCharges(100000, 30);

    // Base rate should be 5.25% (as of Nov 2025)
    expect(result.baseRate).toBe(0.0525);

    // Total rate = Base (5.25%) + Statutory (8%) = 13.25%
    expect(result.annualRate).toBe(0.1325);
  });
});

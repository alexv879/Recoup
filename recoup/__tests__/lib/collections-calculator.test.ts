/**
 * Unit Tests: Collections Calculator
 * Tests UK Late Payment Act 1998 compliance and interest calculation accuracy
 */

import {
  calculateLatePaymentInterest,
  getFixedRecoveryCost,
  calculateInterestForDays,
  projectInterestAccrual,
  formatInterestCalculation,
  formatInterestCalculationHTML,
  isInvoiceOverdue,
  getDaysUntilDue,
  formatCurrency,
  BANK_OF_ENGLAND_BASE_RATE,
  STATUTORY_INTEREST_RATE,
  FIXED_RECOVERY_COSTS,
  type InterestCalculation,
  type InterestCalculationParams,
} from '@/lib/collections-calculator';

describe('calculateLatePaymentInterest', () => {
  const testDate = new Date('2025-01-01');

  describe('Input Validation', () => {
    it('should throw error for zero or negative principal amount', () => {
      expect(() =>
        calculateLatePaymentInterest({
          principalAmount: 0,
          dueDate: new Date('2024-12-01'),
          currentDate: testDate,
        })
      ).toThrow('Principal amount must be greater than 0');

      expect(() =>
        calculateLatePaymentInterest({
          principalAmount: -1000,
          dueDate: new Date('2024-12-01'),
          currentDate: testDate,
        })
      ).toThrow('Principal amount must be greater than 0');
    });

    it('should throw error for future due date', () => {
      expect(() =>
        calculateLatePaymentInterest({
          principalAmount: 1000,
          dueDate: new Date('2025-12-01'),
          currentDate: testDate,
        })
      ).toThrow('Due date cannot be in the future');
    });

    it('should handle current date defaulting to now', () => {
      const result = calculateLatePaymentInterest({
        principalAmount: 1000,
        dueDate: new Date('2024-01-01'),
      });

      expect(result.daysOverdue).toBeGreaterThan(0);
    });
  });

  describe('Interest Calculation Accuracy', () => {
    it('should calculate correct interest for £1,000 invoice, 45 days late', () => {
      const result = calculateLatePaymentInterest({
        principalAmount: 1000,
        dueDate: new Date('2024-11-17'),
        currentDate: testDate,
      });

      expect(result.principalAmount).toBe(1000);
      expect(result.daysOverdue).toBe(45);
      expect(result.interestRate).toBe(STATUTORY_INTEREST_RATE + BANK_OF_ENGLAND_BASE_RATE);

      // £1,000 × 13.25% × (45/365) = £16.34
      expect(result.interestAccrued).toBeCloseTo(16.34, 2);
      expect(result.dailyInterest).toBeCloseTo(0.36, 2);
    });

    it('should calculate correct interest for £5,000 invoice, 90 days late', () => {
      const result = calculateLatePaymentInterest({
        principalAmount: 5000,
        dueDate: new Date('2024-10-03'),
        currentDate: testDate,
      });

      expect(result.principalAmount).toBe(5000);
      expect(result.daysOverdue).toBe(90);

      // £5,000 × 13.25% × (90/365) = £163.36
      expect(result.interestAccrued).toBeCloseTo(163.36, 2);
      expect(result.dailyInterest).toBeCloseTo(1.82, 2);
    });

    it('should handle same-day overdue (0 days)', () => {
      const result = calculateLatePaymentInterest({
        principalAmount: 1000,
        dueDate: testDate,
        currentDate: testDate,
      });

      expect(result.daysOverdue).toBe(0);
      expect(result.interestAccrued).toBe(0);
      expect(result.dailyInterest).toBeGreaterThan(0); // Still calculated for reference
    });

    it('should use custom base rate when provided', () => {
      const customRate = 10.0; // 10% custom rate
      const result = calculateLatePaymentInterest({
        principalAmount: 1000,
        dueDate: new Date('2024-12-01'),
        currentDate: testDate,
        customBaseRate: customRate,
      });

      expect(result.bankBaseRate).toBe(customRate);
      expect(result.interestRate).toBe(STATUTORY_INTEREST_RATE + customRate); // 8% + 10% = 18%
    });
  });

  describe('Historical Rate Usage', () => {
    it('should use historical rate by default (useHistoricalRate=true)', () => {
      const result = calculateLatePaymentInterest({
        principalAmount: 1000,
        dueDate: new Date('2024-12-01'),
        currentDate: testDate,
        useHistoricalRate: true,
      });

      // Historical rate should be used (from base-rate-history)
      expect(result.bankBaseRate).toBeDefined();
      expect(result.interestRate).toBeGreaterThan(STATUTORY_INTEREST_RATE);
    });

    it('should use current rate when useHistoricalRate=false', () => {
      const result = calculateLatePaymentInterest({
        principalAmount: 1000,
        dueDate: new Date('2024-12-01'),
        currentDate: testDate,
        useHistoricalRate: false,
      });

      expect(result.bankBaseRate).toBe(BANK_OF_ENGLAND_BASE_RATE);
      expect(result.interestRate).toBe(STATUTORY_INTEREST_RATE + BANK_OF_ENGLAND_BASE_RATE);
    });
  });

  describe('Fixed Recovery Cost', () => {
    it('should include correct fixed recovery cost in total', () => {
      const result = calculateLatePaymentInterest({
        principalAmount: 1000,
        dueDate: new Date('2024-12-01'),
        currentDate: testDate,
      });

      expect(result.fixedRecoveryCost).toBe(70); // £1K-£10K tier = £70
      expect(result.totalOwed).toBe(
        result.principalAmount + result.interestAccrued + result.fixedRecoveryCost
      );
    });

    it('should include breakdown of all components', () => {
      const result = calculateLatePaymentInterest({
        principalAmount: 1000,
        dueDate: new Date('2024-12-01'),
        currentDate: testDate,
      });

      expect(result.breakdown.principal).toBe(result.principalAmount);
      expect(result.breakdown.interest).toBe(result.interestAccrued);
      expect(result.breakdown.fixedFee).toBe(result.fixedRecoveryCost);
    });
  });

  describe('Rounding and Precision', () => {
    it('should round monetary values to 2 decimal places', () => {
      const result = calculateLatePaymentInterest({
        principalAmount: 1234.56,
        dueDate: new Date('2024-12-01'),
        currentDate: testDate,
      });

      expect(result.interestAccrued.toString()).toMatch(/^\d+\.\d{1,2}$/);
      expect(result.totalOwed.toString()).toMatch(/^\d+\.\d{1,2}$/);
      expect(result.dailyInterest.toString()).toMatch(/^\d+\.\d{1,2}$/);
    });
  });
});

describe('getFixedRecoveryCost', () => {
  it('should return £40 for invoices ≤£999.99', () => {
    expect(getFixedRecoveryCost(100)).toBe(40);
    expect(getFixedRecoveryCost(500)).toBe(40);
    expect(getFixedRecoveryCost(999.99)).toBe(40);
  });

  it('should return £70 for invoices £1,000-£9,999.99', () => {
    expect(getFixedRecoveryCost(1000)).toBe(70);
    expect(getFixedRecoveryCost(5000)).toBe(70);
    expect(getFixedRecoveryCost(9999.99)).toBe(70);
  });

  it('should return £100 for invoices ≥£10,000', () => {
    expect(getFixedRecoveryCost(10000)).toBe(100);
    expect(getFixedRecoveryCost(50000)).toBe(100);
    expect(getFixedRecoveryCost(1000000)).toBe(100);
  });

  it('should handle boundary values correctly', () => {
    expect(getFixedRecoveryCost(999.98)).toBe(40);
    expect(getFixedRecoveryCost(1000.01)).toBe(70);
    expect(getFixedRecoveryCost(9999.98)).toBe(70);
    expect(getFixedRecoveryCost(10000.01)).toBe(100);
  });
});

describe('calculateInterestForDays', () => {
  it('should calculate interest for specific number of days', () => {
    const interest30 = calculateInterestForDays(1000, 30);
    const interest60 = calculateInterestForDays(1000, 60);

    // 60 days should be approximately double 30 days
    expect(interest60).toBeCloseTo(interest30 * 2, 2);
  });

  it('should handle zero days', () => {
    const interest = calculateInterestForDays(1000, 0);
    expect(interest).toBe(0);
  });

  it('should use custom base rate when provided', () => {
    const interestDefault = calculateInterestForDays(1000, 30);
    const interestCustom = calculateInterestForDays(1000, 30, 10.0); // 10% base rate

    expect(interestCustom).toBeGreaterThan(interestDefault);
  });

  it('should scale linearly with principal amount', () => {
    const interest1k = calculateInterestForDays(1000, 30);
    const interest2k = calculateInterestForDays(2000, 30);

    expect(interest2k).toBeCloseTo(interest1k * 2, 2);
  });
});

describe('projectInterestAccrual', () => {
  const dueDate = new Date('2025-01-01');

  it('should project interest for default 90 days', () => {
    const projections = projectInterestAccrual(1000, dueDate);

    expect(projections).toHaveLength(91); // 0-90 inclusive
    expect(projections[0].day).toBe(0);
    expect(projections[90].day).toBe(90);
  });

  it('should project interest for custom number of days', () => {
    const projections = projectInterestAccrual(1000, dueDate, 30);

    expect(projections).toHaveLength(31); // 0-30 inclusive
    expect(projections[30].day).toBe(30);
  });

  it('should have zero interest on day 0', () => {
    const projections = projectInterestAccrual(1000, dueDate);

    expect(projections[0].interestAccrued).toBe(0);
    expect(projections[0].totalOwed).toBe(1000 + 70); // Principal + fixed fee only
  });

  it('should have increasing interest each day', () => {
    const projections = projectInterestAccrual(1000, dueDate);

    for (let i = 1; i < projections.length; i++) {
      expect(projections[i].interestAccrued).toBeGreaterThan(
        projections[i - 1].interestAccrued
      );
    }
  });

  it('should include dates for each projection', () => {
    const projections = projectInterestAccrual(1000, dueDate, 10);

    projections.forEach((projection, index) => {
      const expectedDate = new Date(dueDate);
      expectedDate.setDate(expectedDate.getDate() + index);
      expect(projection.date.toDateString()).toBe(expectedDate.toDateString());
    });
  });

  it('should include fixed recovery cost in total owed', () => {
    const projections = projectInterestAccrual(1000, dueDate);
    const fixedCost = getFixedRecoveryCost(1000);

    projections.forEach((projection) => {
      expect(projection.totalOwed).toBeGreaterThanOrEqual(1000 + fixedCost);
    });
  });
});

describe('formatInterestCalculation', () => {
  it('should format calculation as readable text', () => {
    const calculation: InterestCalculation = {
      principalAmount: 1000,
      interestRate: 13.25,
      bankBaseRate: 5.25,
      statutoryRate: 8.0,
      daysOverdue: 45,
      interestAccrued: 16.34,
      fixedRecoveryCost: 70,
      totalOwed: 1086.34,
      dailyInterest: 0.36,
      breakdown: { principal: 1000, interest: 16.34, fixedFee: 70 },
    };

    const formatted = formatInterestCalculation(calculation);

    expect(formatted).toContain('£1000.00');
    expect(formatted).toContain('45 days');
    expect(formatted).toContain('13.25%');
    expect(formatted).toContain('£16.34');
    expect(formatted).toContain('£70.00');
    expect(formatted).toContain('£1086.34');
  });
});

describe('formatInterestCalculationHTML', () => {
  it('should format calculation as HTML', () => {
    const calculation: InterestCalculation = {
      principalAmount: 1000,
      interestRate: 13.25,
      bankBaseRate: 5.25,
      statutoryRate: 8.0,
      daysOverdue: 45,
      interestAccrued: 16.34,
      fixedRecoveryCost: 70,
      totalOwed: 1086.34,
      dailyInterest: 0.36,
      breakdown: { principal: 1000, interest: 16.34, fixedFee: 70 },
    };

    const html = formatInterestCalculationHTML(calculation);

    expect(html).toContain('<table');
    expect(html).toContain('£1000.00');
    expect(html).toContain('45 days');
    expect(html).toContain('13.25%');
    expect(html).toContain('Late Payment Interest Breakdown');
    expect(html).toContain('TOTAL OWED');
  });

  it('should include legal note in HTML', () => {
    const calculation: InterestCalculation = {
      principalAmount: 1000,
      interestRate: 13.25,
      bankBaseRate: 5.25,
      statutoryRate: 8.0,
      daysOverdue: 45,
      interestAccrued: 16.34,
      fixedRecoveryCost: 70,
      totalOwed: 1086.34,
      dailyInterest: 0.36,
      breakdown: { principal: 1000, interest: 16.34, fixedFee: 70 },
    };

    const html = formatInterestCalculationHTML(calculation);

    expect(html).toContain('Legal Note');
    expect(html).toContain('Late Payment of Commercial Debts (Interest) Act 1998');
  });
});

describe('isInvoiceOverdue', () => {
  it('should return true for past due dates', () => {
    const dueDate = new Date('2024-12-01');
    const currentDate = new Date('2025-01-01');
    expect(isInvoiceOverdue(dueDate, currentDate)).toBe(true);
  });

  it('should return false for future due dates', () => {
    const dueDate = new Date('2025-12-01');
    const currentDate = new Date('2025-01-01');
    expect(isInvoiceOverdue(dueDate, currentDate)).toBe(false);
  });

  it('should return false for same-day due date', () => {
    const dueDate = new Date('2025-01-01');
    const currentDate = new Date('2025-01-01');
    expect(isInvoiceOverdue(dueDate, currentDate)).toBe(false);
  });
});

describe('getDaysUntilDue', () => {
  it('should return positive days for future due dates', () => {
    const dueDate = new Date('2025-02-01');
    const currentDate = new Date('2025-01-01');
    expect(getDaysUntilDue(dueDate, currentDate)).toBe(31);
  });

  it('should return negative days for past due dates', () => {
    const dueDate = new Date('2024-12-01');
    const currentDate = new Date('2025-01-01');
    expect(getDaysUntilDue(dueDate, currentDate)).toBe(-31);
  });

  it('should return zero for same-day due date', () => {
    const dueDate = new Date('2025-01-01');
    const currentDate = new Date('2025-01-01');
    expect(getDaysUntilDue(dueDate, currentDate)).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('should format GBP currency correctly', () => {
    expect(formatCurrency(1000)).toBe('£1,000.00');
    expect(formatCurrency(1234.56)).toBe('£1,234.56');
    expect(formatCurrency(10)).toBe('£10.00');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000)).toBe('£1,000,000.00');
  });

  it('should handle small numbers', () => {
    expect(formatCurrency(0.99)).toBe('£0.99');
    expect(formatCurrency(0.01)).toBe('£0.01');
  });
});

describe('Constants', () => {
  it('should have correct Bank of England base rate', () => {
    expect(BANK_OF_ENGLAND_BASE_RATE).toBe(5.25);
  });

  it('should have correct statutory interest rate', () => {
    expect(STATUTORY_INTEREST_RATE).toBe(8.0);
  });

  it('should have correct fixed recovery cost tiers', () => {
    expect(FIXED_RECOVERY_COSTS.TIER_1).toEqual({ max: 999.99, fee: 40 });
    expect(FIXED_RECOVERY_COSTS.TIER_2).toEqual({ max: 9999.99, fee: 70 });
    expect(FIXED_RECOVERY_COSTS.TIER_3).toEqual({ max: Infinity, fee: 100 });
  });
});

describe('Real-World Scenarios', () => {
  it('should handle typical freelancer invoice (£500, 30 days late)', () => {
    const result = calculateLatePaymentInterest({
      principalAmount: 500,
      dueDate: new Date('2024-12-01'),
      currentDate: new Date('2024-12-31'),
    });

    expect(result.daysOverdue).toBe(30);
    expect(result.fixedRecoveryCost).toBe(40); // Tier 1
    expect(result.interestAccrued).toBeGreaterThan(0);
    expect(result.totalOwed).toBeGreaterThan(540);
  });

  it('should handle agency invoice (£10,000, 60 days late)', () => {
    const result = calculateLatePaymentInterest({
      principalAmount: 10000,
      dueDate: new Date('2024-11-01'),
      currentDate: new Date('2024-12-31'),
    });

    expect(result.daysOverdue).toBe(60);
    expect(result.fixedRecoveryCost).toBe(100); // Tier 3
    expect(result.totalOwed).toBeGreaterThan(10100);
  });
});

/**
 * Unit Tests: MTD VAT Calculation Engine
 * Tests UK VAT calculations and HMRC compliance
 */

import {
  calculateVAT,
  calculateNetFromGross,
  createVATTransaction,
  getVATPeriod,
  getPreviousVATPeriod,
  getNextVATPeriod,
  isDateInPeriod,
  generateVATReturn,
  calculateFRSVAT,
  validateVATReturn,
  formatForHMRC,
  convertToHMRCFormat,
  VATRate,
  VAT_RATE_PERCENTAGES,
  FRS_RATES,
  type VATTransaction,
  type VATPeriod,
  type FlatRateScheme,
} from '@/lib/mtd-vat';

describe('VAT Rate Percentages', () => {
  it('should have correct UK VAT rates', () => {
    expect(VAT_RATE_PERCENTAGES[VATRate.STANDARD]).toBe(20.0);
    expect(VAT_RATE_PERCENTAGES[VATRate.REDUCED]).toBe(5.0);
    expect(VAT_RATE_PERCENTAGES[VATRate.ZERO]).toBe(0.0);
    expect(VAT_RATE_PERCENTAGES[VATRate.EXEMPT]).toBe(0.0);
    expect(VAT_RATE_PERCENTAGES[VATRate.OUTSIDE_SCOPE]).toBe(0.0);
  });
});

describe('calculateVAT', () => {
  it('should calculate standard rate VAT (20%)', () => {
    expect(calculateVAT(10000, VATRate.STANDARD)).toBe(2000); // £100 → £20 VAT
    expect(calculateVAT(50000, VATRate.STANDARD)).toBe(10000); // £500 → £100 VAT
    expect(calculateVAT(100000, VATRate.STANDARD)).toBe(20000); // £1000 → £200 VAT
  });

  it('should calculate reduced rate VAT (5%)', () => {
    expect(calculateVAT(10000, VATRate.REDUCED)).toBe(500); // £100 → £5 VAT
    expect(calculateVAT(50000, VATRate.REDUCED)).toBe(2500); // £500 → £25 VAT
  });

  it('should calculate zero rate VAT (0%)', () => {
    expect(calculateVAT(10000, VATRate.ZERO)).toBe(0);
    expect(calculateVAT(50000, VATRate.ZERO)).toBe(0);
  });

  it('should handle rounding correctly', () => {
    // £123.45 at 20% = £24.69 VAT
    expect(calculateVAT(12345, VATRate.STANDARD)).toBe(2469);
  });
});

describe('calculateNetFromGross', () => {
  it('should calculate net from gross (20% VAT)', () => {
    expect(calculateNetFromGross(12000, VATRate.STANDARD)).toBe(10000); // £120 → £100 net
    expect(calculateNetFromGross(60000, VATRate.STANDARD)).toBe(50000); // £600 → £500 net
  });

  it('should calculate net from gross (5% VAT)', () => {
    expect(calculateNetFromGross(10500, VATRate.REDUCED)).toBe(10000); // £105 → £100 net
  });

  it('should handle zero rate', () => {
    expect(calculateNetFromGross(10000, VATRate.ZERO)).toBe(10000);
  });

  it('should round correctly', () => {
    // £148.14 gross at 20% = £123.45 net
    expect(calculateNetFromGross(14814, VATRate.STANDARD)).toBe(12345);
  });
});

describe('createVATTransaction', () => {
  it('should create valid sale transaction', () => {
    const tx = createVATTransaction(10000, VATRate.STANDARD, 'sale', {
      description: 'Test invoice',
      reference: 'INV-001',
    });

    expect(tx.netAmount).toBe(10000);
    expect(tx.vatRate).toBe(VATRate.STANDARD);
    expect(tx.vatAmount).toBe(2000);
    expect(tx.grossAmount).toBe(12000);
    expect(tx.type).toBe('sale');
    expect(tx.description).toBe('Test invoice');
    expect(tx.reference).toBe('INV-001');
  });

  it('should create valid purchase transaction', () => {
    const tx = createVATTransaction(5000, VATRate.STANDARD, 'purchase', {
      description: 'Office supplies',
    });

    expect(tx.netAmount).toBe(5000);
    expect(tx.vatAmount).toBe(1000);
    expect(tx.grossAmount).toBe(6000);
    expect(tx.type).toBe('purchase');
  });

  it('should support reverse charge transactions', () => {
    const tx = createVATTransaction(10000, VATRate.ZERO, 'purchase', {
      reverseCharge: true,
      euCountry: 'DE',
    });

    expect(tx.reverseCharge).toBe(true);
    expect(tx.euCountry).toBe('DE');
    expect(tx.vatAmount).toBe(0); // Zero-rated for cross-border
  });
});

describe('VAT Periods', () => {
  it('should get correct Q1 period (Jan-Mar)', () => {
    const period = getVATPeriod(new Date('2024-02-15'));

    expect(period.quarter).toBe('2024-Q1');
    expect(period.startDate).toBe('2024-01-01');
    expect(period.endDate).toBe('2024-03-31');
    expect(period.deadline).toBe('2024-05-08'); // 1 month + 7 days (31 Mar + 1 month = 30 Apr + 8 days)
  });

  it('should get correct Q2 period (Apr-Jun)', () => {
    const period = getVATPeriod(new Date('2024-05-20'));

    expect(period.quarter).toBe('2024-Q2');
    expect(period.startDate).toBe('2024-04-01');
    expect(period.endDate).toBe('2024-06-30');
    expect(period.deadline).toBe('2024-08-06'); // 30 Jun + 1 month + 7 days
  });

  it('should get correct Q3 period (Jul-Sep)', () => {
    const period = getVATPeriod(new Date('2024-08-10'));

    expect(period.quarter).toBe('2024-Q3');
    expect(period.startDate).toBe('2024-07-01');
    expect(period.endDate).toBe('2024-09-30');
    expect(period.deadline).toBe('2024-11-06'); // 30 Sep + 1 month + 7 days
  });

  it('should get correct Q4 period (Oct-Dec)', () => {
    const period = getVATPeriod(new Date('2024-11-25'));

    expect(period.quarter).toBe('2024-Q4');
    expect(period.startDate).toBe('2024-10-01');
    expect(period.endDate).toBe('2024-12-31');
    expect(period.deadline).toBe('2025-02-07');
  });

  it('should get previous VAT period', () => {
    const currentPeriod = getVATPeriod(new Date('2024-05-01')); // Q2
    const prevPeriod = getPreviousVATPeriod(currentPeriod);

    expect(prevPeriod.quarter).toBe('2024-Q1');
    expect(prevPeriod.startDate).toBe('2024-01-01');
  });

  it('should get next VAT period', () => {
    const currentPeriod = getVATPeriod(new Date('2024-05-01')); // Q2
    const nextPeriod = getNextVATPeriod(currentPeriod);

    expect(nextPeriod.quarter).toBe('2024-Q3');
    expect(nextPeriod.startDate).toBe('2024-07-01');
  });

  it('should check if date is in period', () => {
    const period = getVATPeriod(new Date('2024-05-01')); // Q2 2024

    expect(isDateInPeriod('2024-04-15', period)).toBe(true);
    expect(isDateInPeriod('2024-06-25', period)).toBe(true);
    expect(isDateInPeriod('2024-03-31', period)).toBe(false);
    expect(isDateInPeriod('2024-07-01', period)).toBe(false);
  });
});

describe('generateVATReturn', () => {
  const period: VATPeriod = {
    quarter: '2024-Q1',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    deadline: '2024-05-07',
  };

  it('should generate correct VAT return for simple sales', () => {
    const transactions: VATTransaction[] = [
      createVATTransaction(10000, VATRate.STANDARD, 'sale', { date: '2024-01-15' }),
      createVATTransaction(20000, VATRate.STANDARD, 'sale', { date: '2024-02-20' }),
    ];

    const vatReturn = generateVATReturn(transactions, period);

    expect(vatReturn.box1_vatDueOnSales).toBe(6000); // (£100 + £200) * 20%
    expect(vatReturn.box6_totalValueSalesExVAT).toBe(30000); // £300 net
    expect(vatReturn.box3_totalVATDue).toBe(6000); // Box 1 + Box 2 (no EC)
    expect(vatReturn.box5_netVATDue).toBe(6000); // Box 3 - Box 4 (no purchases)
  });

  it('should handle purchases (input VAT)', () => {
    const transactions: VATTransaction[] = [
      createVATTransaction(10000, VATRate.STANDARD, 'sale', { date: '2024-01-15' }),
      createVATTransaction(5000, VATRate.STANDARD, 'purchase', { date: '2024-02-10' }),
    ];

    const vatReturn = generateVATReturn(transactions, period);

    expect(vatReturn.box1_vatDueOnSales).toBe(2000); // £100 * 20%
    expect(vatReturn.box4_vatReclaimedOnPurchases).toBe(1000); // £50 * 20%
    expect(vatReturn.box5_netVATDue).toBe(1000); // £20 - £10 = £10 to pay
  });

  it('should handle VAT reclaims (negative Box 5)', () => {
    const transactions: VATTransaction[] = [
      createVATTransaction(10000, VATRate.STANDARD, 'sale', { date: '2024-01-15' }),
      createVATTransaction(20000, VATRate.STANDARD, 'purchase', { date: '2024-02-10' }),
    ];

    const vatReturn = generateVATReturn(transactions, period);

    expect(vatReturn.box1_vatDueOnSales).toBe(2000); // £20
    expect(vatReturn.box4_vatReclaimedOnPurchases).toBe(4000); // £40
    expect(vatReturn.box5_netVATDue).toBe(-2000); // Reclaim £20 from HMRC
  });

  it('should handle EC acquisitions (reverse charge)', () => {
    const transactions: VATTransaction[] = [
      createVATTransaction(10000, VATRate.STANDARD, 'sale', { date: '2024-01-15' }),
      createVATTransaction(5000, VATRate.ZERO, 'purchase', {
        date: '2024-02-10',
        reverseCharge: true,
        euCountry: 'DE',
      }),
    ];

    // For reverse charge, we calculate VAT on the purchase
    const reverseChargeVAT = calculateVAT(5000, VATRate.STANDARD);

    const vatReturn = generateVATReturn(transactions, period);

    expect(vatReturn.box9_totalValueECPurchases).toBe(5000); // £50 EC purchases
  });

  it('should exclude transactions outside period', () => {
    const transactions: VATTransaction[] = [
      createVATTransaction(10000, VATRate.STANDARD, 'sale', { date: '2024-01-15' }), // In period
      createVATTransaction(20000, VATRate.STANDARD, 'sale', { date: '2024-04-15' }), // Outside period
    ];

    const vatReturn = generateVATReturn(transactions, period);

    expect(vatReturn.box1_vatDueOnSales).toBe(2000); // Only first transaction
    expect(vatReturn.box6_totalValueSalesExVAT).toBe(10000);
  });
});

describe('Flat Rate Scheme', () => {
  it('should calculate FRS VAT for business services (12%)', () => {
    const frsConfig: FlatRateScheme = {
      enabled: true,
      percentage: 12.0,
      sector: 'business_services',
      limitedCostTrader: false,
    };

    const result = calculateFRSVAT(100000, frsConfig); // £1,000 gross turnover

    expect(result.frsPercentage).toBe(12.0);
    expect(result.vatPayable).toBe(12000); // £120
  });

  it('should use higher rate for limited cost traders', () => {
    const frsConfig: FlatRateScheme = {
      enabled: true,
      percentage: 16.5,
      sector: 'business_services',
      limitedCostTrader: true,
    };

    const result = calculateFRSVAT(100000, frsConfig);

    expect(result.frsPercentage).toBe(FRS_RATES.limited_cost_trader);
    expect(result.vatPayable).toBe(16500); // £165
  });

  it('should estimate savings vs standard accounting', () => {
    const frsConfig: FlatRateScheme = {
      enabled: true,
      percentage: 12.0,
      sector: 'business_services',
      limitedCostTrader: false,
    };

    const result = calculateFRSVAT(120000, frsConfig); // £1,200 gross

    // Standard VAT would be ~£200 (£1,200 / 1.2 * 0.2)
    // FRS VAT is £144 (£1,200 * 12%)
    // Savings should be positive
    expect(result.savings).toBeGreaterThan(0);
  });
});

describe('VAT Return Validation', () => {
  it('should validate correct VAT return', () => {
    const vatReturn = {
      period: getVATPeriod(),
      box1_vatDueOnSales: 10000,
      box2_vatDueOnECAcquisitions: 1000,
      box3_totalVATDue: 11000,
      box4_vatReclaimedOnPurchases: 5000,
      box5_netVATDue: 6000,
      box6_totalValueSalesExVAT: 50000,
      box7_totalValuePurchasesExVAT: 25000,
      box8_totalValueECSales: 0,
      box9_totalValueECPurchases: 0,
      generatedAt: new Date().toISOString(),
      status: 'draft' as const,
    };

    const validation = validateVATReturn(vatReturn);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should detect Box 3 calculation error', () => {
    const vatReturn = {
      period: getVATPeriod(),
      box1_vatDueOnSales: 10000,
      box2_vatDueOnECAcquisitions: 1000,
      box3_totalVATDue: 10000, // WRONG: Should be 11000
      box4_vatReclaimedOnPurchases: 5000,
      box5_netVATDue: 5000,
      box6_totalValueSalesExVAT: 50000,
      box7_totalValuePurchasesExVAT: 25000,
      box8_totalValueECSales: 0,
      box9_totalValueECPurchases: 0,
      generatedAt: new Date().toISOString(),
      status: 'draft' as const,
    };

    const validation = validateVATReturn(vatReturn);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Box 3 must equal Box 1 + Box 2');
  });

  it('should detect negative values in non-Box-5 fields', () => {
    const vatReturn = {
      period: getVATPeriod(),
      box1_vatDueOnSales: -1000, // WRONG: Cannot be negative
      box2_vatDueOnECAcquisitions: 0,
      box3_totalVATDue: -1000,
      box4_vatReclaimedOnPurchases: 0,
      box5_netVATDue: -1000,
      box6_totalValueSalesExVAT: 5000,
      box7_totalValuePurchasesExVAT: 0,
      box8_totalValueECSales: 0,
      box9_totalValueECPurchases: 0,
      generatedAt: new Date().toISOString(),
      status: 'draft' as const,
    };

    const validation = validateVATReturn(vatReturn);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Box 1 cannot be negative');
  });
});

describe('HMRC Formatting', () => {
  it('should format amounts correctly for HMRC', () => {
    expect(formatForHMRC(10000)).toBe('100.00');
    expect(formatForHMRC(12345)).toBe('123.45');
    expect(formatForHMRC(100)).toBe('1.00');
    expect(formatForHMRC(1)).toBe('0.01');
  });

  it('should convert VAT return to HMRC JSON format', () => {
    const vatReturn = {
      period: { quarter: '2024-Q1', startDate: '2024-01-01', endDate: '2024-03-31', deadline: '2024-05-07' },
      box1_vatDueOnSales: 10000,
      box2_vatDueOnECAcquisitions: 500,
      box3_totalVATDue: 10500,
      box4_vatReclaimedOnPurchases: 3000,
      box5_netVATDue: 7500,
      box6_totalValueSalesExVAT: 50000,
      box7_totalValuePurchasesExVAT: 15000,
      box8_totalValueECSales: 0,
      box9_totalValueECPurchases: 0,
      generatedAt: new Date().toISOString(),
      status: 'draft' as const,
    };

    const hmrcFormat = convertToHMRCFormat(vatReturn);

    expect(hmrcFormat.periodKey).toBe('2024-Q1');
    expect(hmrcFormat.vatDueSales).toBe('100.00');
    expect(hmrcFormat.vatDueAcquisitions).toBe('5.00');
    expect(hmrcFormat.totalVatDue).toBe('105.00');
    expect(hmrcFormat.vatReclaimedCurrPeriod).toBe('30.00');
    expect(hmrcFormat.netVatDue).toBe('75.00');
    expect(hmrcFormat.finalised).toBe('true');
  });
});

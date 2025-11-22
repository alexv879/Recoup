/**
 * Making Tax Digital (MTD) VAT Calculation Engine
 *
 * UK HMRC Making Tax Digital for VAT compliance
 *
 * Features:
 * - VAT calculation at standard, reduced, and zero rates
 * - Quarterly VAT return generation
 * - Digital record keeping (7-year retention)
 * - Reverse charge mechanism support
 * - Flat Rate Scheme (FRS) support
 * - Input/output VAT tracking
 *
 * Legal basis: Finance Act 2021, VAT Act 1994
 * HMRC MTD for VAT: https://www.gov.uk/guidance/making-tax-digital-for-vat
 *
 * Important: This is a calculation engine only. HMRC API submission
 * requires OAuth 2.0 authentication and digital certificates.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * UK VAT rates (as of 2024)
 */
export enum VATRate {
  /** Standard rate - 20% (most goods and services) */
  STANDARD = 'standard',

  /** Reduced rate - 5% (domestic fuel, children's car seats) */
  REDUCED = 'reduced',

  /** Zero rate - 0% (food, books, children's clothes) */
  ZERO = 'zero',

  /** Exempt - No VAT (insurance, education, health) */
  EXEMPT = 'exempt',

  /** Outside scope - Not subject to UK VAT */
  OUTSIDE_SCOPE = 'outside_scope',
}

/**
 * VAT rate percentages
 */
export const VAT_RATE_PERCENTAGES: Record<VATRate, number> = {
  [VATRate.STANDARD]: 20.0,
  [VATRate.REDUCED]: 5.0,
  [VATRate.ZERO]: 0.0,
  [VATRate.EXEMPT]: 0.0,
  [VATRate.OUTSIDE_SCOPE]: 0.0,
};

/**
 * VAT period (quarterly)
 */
export interface VATPeriod {
  /** Start date (YYYY-MM-DD) */
  startDate: string;

  /** End date (YYYY-MM-DD) */
  endDate: string;

  /** Quarter identifier (e.g., '2024-Q1') */
  quarter: string;

  /** Submission deadline (1 calendar month + 7 days after period end) */
  deadline: string;
}

/**
 * VAT transaction
 */
export interface VATTransaction {
  /** Transaction ID */
  id: string;

  /** Transaction date */
  date: string;

  /** Description */
  description: string;

  /** Net amount (before VAT) in pence */
  netAmount: number;

  /** VAT rate applied */
  vatRate: VATRate;

  /** VAT amount in pence */
  vatAmount: number;

  /** Gross amount (net + VAT) in pence */
  grossAmount: number;

  /** Type of transaction */
  type: 'sale' | 'purchase';

  /** Invoice/receipt reference */
  reference?: string;

  /** Is this a reverse charge transaction? */
  reverseCharge?: boolean;

  /** EU country code (for EC sales) */
  euCountry?: string;
}

/**
 * VAT return (9-box submission to HMRC)
 */
export interface VATReturn {
  /** VAT period */
  period: VATPeriod;

  /** Box 1: VAT due on sales and other outputs */
  box1_vatDueOnSales: number;

  /** Box 2: VAT due in the period on acquisitions from other EC Member States */
  box2_vatDueOnECAcquisitions: number;

  /** Box 3: Total VAT due (Box 1 + Box 2) */
  box3_totalVATDue: number;

  /** Box 4: VAT reclaimed in the period on purchases and other inputs */
  box4_vatReclaimedOnPurchases: number;

  /** Box 5: Net VAT to be paid to HMRC or reclaimed (Box 3 - Box 4) */
  box5_netVATDue: number;

  /** Box 6: Total value of sales and all other outputs excluding any VAT */
  box6_totalValueSalesExVAT: number;

  /** Box 7: Total value of purchases and all other inputs excluding any VAT */
  box7_totalValuePurchasesExVAT: number;

  /** Box 8: Total value of all supplies of goods and related costs (EC sales) */
  box8_totalValueECSales: number;

  /** Box 9: Total value of acquisitions of goods and related costs (EC purchases) */
  box9_totalValueECPurchases: number;

  /** Generated timestamp */
  generatedAt: string;

  /** Status */
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';

  /** HMRC submission reference (when submitted) */
  submissionReference?: string;
}

/**
 * Flat Rate Scheme configuration
 */
export interface FlatRateScheme {
  /** Is business enrolled in FRS? */
  enabled: boolean;

  /** FRS percentage rate (based on business type) */
  percentage: number;

  /** Business sector */
  sector:
    | 'accountancy'
    | 'architecture'
    | 'business_services'
    | 'catering'
    | 'computer_repair'
    | 'construction'
    | 'other';

  /** Limited cost trader? (purchases <2% of turnover or <£1k/year) */
  limitedCostTrader: boolean;
}

/**
 * FRS percentage rates by sector (2024)
 */
export const FRS_RATES: Record<string, number> = {
  accountancy: 14.5,
  architecture: 14.5,
  business_services: 12.0,
  catering: 12.5,
  computer_repair: 10.5,
  construction: 14.5,
  limited_cost_trader: 16.5, // Higher rate for limited cost traders
  other: 12.0,
};

// ============================================================================
// VAT CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate VAT amount from net amount
 *
 * @param netAmount - Net amount in pence (before VAT)
 * @param vatRate - VAT rate to apply
 * @returns VAT amount in pence
 */
export function calculateVAT(netAmount: number, vatRate: VATRate): number {
  const percentage = VAT_RATE_PERCENTAGES[vatRate];
  const vat = Math.round((netAmount * percentage) / 100);
  return vat;
}

/**
 * Calculate net amount from gross amount
 *
 * @param grossAmount - Gross amount in pence (including VAT)
 * @param vatRate - VAT rate that was applied
 * @returns Net amount in pence
 */
export function calculateNetFromGross(grossAmount: number, vatRate: VATRate): number {
  const percentage = VAT_RATE_PERCENTAGES[vatRate];
  const net = Math.round(grossAmount / (1 + percentage / 100));
  return net;
}

/**
 * Create VAT transaction
 */
export function createVATTransaction(
  netAmount: number,
  vatRate: VATRate,
  type: 'sale' | 'purchase',
  options: {
    id?: string;
    date?: string;
    description?: string;
    reference?: string;
    reverseCharge?: boolean;
    euCountry?: string;
  } = {}
): VATTransaction {
  const vatAmount = calculateVAT(netAmount, vatRate);
  const grossAmount = netAmount + vatAmount;

  return {
    id: options.id || `tx_${Date.now()}`,
    date: options.date || new Date().toISOString().split('T')[0],
    description: options.description || 'Transaction',
    netAmount,
    vatRate,
    vatAmount,
    grossAmount,
    type,
    reference: options.reference,
    reverseCharge: options.reverseCharge || false,
    euCountry: options.euCountry,
  };
}

// ============================================================================
// VAT PERIOD FUNCTIONS
// ============================================================================

/**
 * Get VAT period for a given date
 *
 * VAT periods in UK are typically quarterly:
 * - Q1: Jan-Mar (ends 31 Mar)
 * - Q2: Apr-Jun (ends 30 Jun)
 * - Q3: Jul-Sep (ends 30 Sep)
 * - Q4: Oct-Dec (ends 31 Dec)
 */
export function getVATPeriod(date: Date = new Date()): VATPeriod {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  let quarter: number;
  let startMonth: number;
  let endMonth: number;

  if (month < 3) {
    // Jan-Mar
    quarter = 1;
    startMonth = 0;
    endMonth = 2;
  } else if (month < 6) {
    // Apr-Jun
    quarter = 2;
    startMonth = 3;
    endMonth = 5;
  } else if (month < 9) {
    // Jul-Sep
    quarter = 3;
    startMonth = 6;
    endMonth = 8;
  } else {
    // Oct-Dec
    quarter = 4;
    startMonth = 9;
    endMonth = 11;
  }

  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth + 1, 0); // Last day of end month

  // Deadline is 1 month + 7 days after period end
  const deadline = new Date(endDate);
  deadline.setMonth(deadline.getMonth() + 1);
  deadline.setDate(deadline.getDate() + 7);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    quarter: `${year}-Q${quarter}`,
    deadline: deadline.toISOString().split('T')[0],
  };
}

/**
 * Get previous VAT period
 */
export function getPreviousVATPeriod(period: VATPeriod): VATPeriod {
  const startDate = new Date(period.startDate);
  startDate.setMonth(startDate.getMonth() - 3); // Go back one quarter
  return getVATPeriod(startDate);
}

/**
 * Get next VAT period
 */
export function getNextVATPeriod(period: VATPeriod): VATPeriod {
  const startDate = new Date(period.startDate);
  startDate.setMonth(startDate.getMonth() + 3); // Forward one quarter
  return getVATPeriod(startDate);
}

/**
 * Check if date falls within VAT period
 */
export function isDateInPeriod(date: string, period: VATPeriod): boolean {
  return date >= period.startDate && date <= period.endDate;
}

// ============================================================================
// VAT RETURN GENERATION
// ============================================================================

/**
 * Generate VAT return from transactions
 *
 * This implements the HMRC 9-box VAT return format
 */
export function generateVATReturn(
  transactions: VATTransaction[],
  period: VATPeriod
): VATReturn {
  // Filter transactions for this period
  const periodTransactions = transactions.filter(tx =>
    isDateInPeriod(tx.date, period)
  );

  // Separate sales and purchases
  const sales = periodTransactions.filter(tx => tx.type === 'sale');
  const purchases = periodTransactions.filter(tx => tx.type === 'purchase');

  // Box 1: VAT due on sales (output tax)
  const box1 = sales
    .filter(tx => !tx.reverseCharge) // Exclude reverse charge
    .reduce((sum, tx) => sum + tx.vatAmount, 0);

  // Box 2: VAT due on EC acquisitions (reverse charge)
  const box2 = purchases
    .filter(tx => tx.reverseCharge && tx.euCountry)
    .reduce((sum, tx) => sum + tx.vatAmount, 0);

  // Box 3: Total VAT due
  const box3 = box1 + box2;

  // Box 4: VAT reclaimed on purchases (input tax)
  const box4 = purchases
    .filter(tx => !tx.reverseCharge) // Normal purchases
    .reduce((sum, tx) => sum + tx.vatAmount, 0)
    + purchases
      .filter(tx => tx.reverseCharge && tx.euCountry) // Reverse charge - can also reclaim
      .reduce((sum, tx) => sum + tx.vatAmount, 0);

  // Box 5: Net VAT (positive = payment to HMRC, negative = reclaim from HMRC)
  const box5 = box3 - box4;

  // Box 6: Total value of sales (excluding VAT)
  const box6 = sales.reduce((sum, tx) => sum + tx.netAmount, 0);

  // Box 7: Total value of purchases (excluding VAT)
  const box7 = purchases.reduce((sum, tx) => sum + tx.netAmount, 0);

  // Box 8: Total value of EC sales (goods only)
  const box8 = sales
    .filter(tx => tx.euCountry && tx.vatRate === VATRate.ZERO)
    .reduce((sum, tx) => sum + tx.netAmount, 0);

  // Box 9: Total value of EC purchases (goods only)
  const box9 = purchases
    .filter(tx => tx.euCountry && tx.reverseCharge)
    .reduce((sum, tx) => sum + tx.netAmount, 0);

  return {
    period,
    box1_vatDueOnSales: box1,
    box2_vatDueOnECAcquisitions: box2,
    box3_totalVATDue: box3,
    box4_vatReclaimedOnPurchases: box4,
    box5_netVATDue: box5,
    box6_totalValueSalesExVAT: box6,
    box7_totalValuePurchasesExVAT: box7,
    box8_totalValueECSales: box8,
    box9_totalValueECPurchases: box9,
    generatedAt: new Date().toISOString(),
    status: 'draft',
  };
}

// ============================================================================
// FLAT RATE SCHEME (FRS)
// ============================================================================

/**
 * Calculate FRS VAT payment
 *
 * Under FRS, VAT is calculated as a flat percentage of total turnover
 * (including VAT), and businesses don't reclaim input VAT (except on capital assets >£2k)
 */
export function calculateFRSVAT(
  grossTurnover: number,
  frsConfig: FlatRateScheme
): {
  vatPayable: number;
  frsPercentage: number;
  savings: number; // Estimated savings vs standard accounting
} {
  if (!frsConfig.enabled) {
    throw new Error('Flat Rate Scheme is not enabled');
  }

  const frsPercentage = frsConfig.limitedCostTrader
    ? FRS_RATES.limited_cost_trader
    : FRS_RATES[frsConfig.sector] || FRS_RATES.other;

  const vatPayable = Math.round((grossTurnover * frsPercentage) / 100);

  // Estimate savings (FRS typically saves 1-1.5% for most businesses)
  const standardVAT = Math.round((grossTurnover / 1.2) * 0.2); // Assume 20% standard rate
  const savings = standardVAT - vatPayable;

  return {
    vatPayable,
    frsPercentage,
    savings,
  };
}

// ============================================================================
// VALIDATION & COMPLIANCE
// ============================================================================

/**
 * Validate VAT return before submission
 */
export function validateVATReturn(vatReturn: VATReturn): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Box 3 must equal Box 1 + Box 2
  if (vatReturn.box3_totalVATDue !== vatReturn.box1_vatDueOnSales + vatReturn.box2_vatDueOnECAcquisitions) {
    errors.push('Box 3 must equal Box 1 + Box 2');
  }

  // Box 5 must equal Box 3 - Box 4
  if (vatReturn.box5_netVATDue !== vatReturn.box3_totalVATDue - vatReturn.box4_vatReclaimedOnPurchases) {
    errors.push('Box 5 must equal Box 3 - Box 4');
  }

  // All amounts must be non-negative (except Box 5 which can be negative)
  if (vatReturn.box1_vatDueOnSales < 0) errors.push('Box 1 cannot be negative');
  if (vatReturn.box2_vatDueOnECAcquisitions < 0) errors.push('Box 2 cannot be negative');
  if (vatReturn.box3_totalVATDue < 0) errors.push('Box 3 cannot be negative');
  if (vatReturn.box4_vatReclaimedOnPurchases < 0) errors.push('Box 4 cannot be negative');
  if (vatReturn.box6_totalValueSalesExVAT < 0) errors.push('Box 6 cannot be negative');
  if (vatReturn.box7_totalValuePurchasesExVAT < 0) errors.push('Box 7 cannot be negative');
  if (vatReturn.box8_totalValueECSales < 0) errors.push('Box 8 cannot be negative');
  if (vatReturn.box9_totalValueECPurchases < 0) errors.push('Box 9 cannot be negative');

  // Check for unrealistic values (sanity checks)
  if (vatReturn.box4_vatReclaimedOnPurchases > vatReturn.box7_totalValuePurchasesExVAT * 0.25) {
    errors.push('Box 4 (VAT reclaimed) seems unreasonably high compared to Box 7 (purchases)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format amount for HMRC submission (two decimal places, no pence)
 */
export function formatForHMRC(pence: number): string {
  const pounds = pence / 100;
  return pounds.toFixed(2);
}

/**
 * Convert VAT return to HMRC JSON format
 */
export function convertToHMRCFormat(vatReturn: VATReturn): Record<string, string> {
  return {
    periodKey: vatReturn.period.quarter,
    vatDueSales: formatForHMRC(vatReturn.box1_vatDueOnSales),
    vatDueAcquisitions: formatForHMRC(vatReturn.box2_vatDueOnECAcquisitions),
    totalVatDue: formatForHMRC(vatReturn.box3_totalVATDue),
    vatReclaimedCurrPeriod: formatForHMRC(vatReturn.box4_vatReclaimedOnPurchases),
    netVatDue: formatForHMRC(Math.abs(vatReturn.box5_netVATDue)),
    totalValueSalesExVAT: formatForHMRC(vatReturn.box6_totalValueSalesExVAT),
    totalValuePurchasesExVAT: formatForHMRC(vatReturn.box7_totalValuePurchasesExVAT),
    totalValueGoodsSuppliedExVAT: formatForHMRC(vatReturn.box8_totalValueECSales),
    totalAcquisitionsExVAT: formatForHMRC(vatReturn.box9_totalValueECPurchases),
    finalised: 'true',
  };
}

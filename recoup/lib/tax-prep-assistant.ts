/**
 * Tax Preparation Assistant for UK Self-Assessment
 * Helps self-employed users prepare for HMRC tax filing
 */

import { logger } from '@/utils/logger';
import { Expense, ExpenseCategory } from '@/types/expense';
import { getGemini } from '@/lib/ai-service';

export interface TaxYear {
  startDate: Date; // April 6
  endDate: Date; // April 5 next year
  year: string; // "2024/2025"
}

export interface TaxSummary {
  taxYear: TaxYear;
  income: {
    totalInvoiced: number;
    totalPaid: number;
    unreceived: number;
    byClient: Array<{
      clientId: string;
      clientName: string;
      totalInvoiced: number;
      totalPaid: number;
    }>;
  };
  expenses: {
    total: number;
    taxDeductible: number;
    nonDeductible: number;
    byCategory: Record<ExpenseCategory, number>;
    homeOffice: number;
    mileage: number;
  };
  profit: {
    grossProfit: number; // Income - All Expenses
    taxableProfit: number; // Income - Tax Deductible Expenses
  };
  estimatedTax: {
    incomeTax: number;
    class2NI: number;
    class4NI: number;
    total: number;
    breakdown: string[];
  };
  warnings: string[];
  recommendations: string[];
}

export interface TaxBracket {
  name: string;
  threshold: number;
  rate: number;
}

// UK Tax Rates 2024/2025
export const UK_TAX_BRACKETS: TaxBracket[] = [
  { name: 'Personal Allowance', threshold: 0, rate: 0 },
  { name: 'Basic Rate', threshold: 12570, rate: 0.2 },
  { name: 'Higher Rate', threshold: 50270, rate: 0.4 },
  { name: 'Additional Rate', threshold: 125140, rate: 0.45 },
];

export const UK_NI_RATES = {
  CLASS_2_THRESHOLD: 6725, // Threshold for paying Class 2
  CLASS_2_WEEKLY: 3.45, // £3.45 per week
  CLASS_4_LOWER_THRESHOLD: 12570,
  CLASS_4_UPPER_THRESHOLD: 50270,
  CLASS_4_RATE_LOWER: 0.09, // 9% between £12,570 and £50,270
  CLASS_4_RATE_UPPER: 0.02, // 2% above £50,270
};

// Standard HMRC mileage rates
export const HMRC_MILEAGE_RATES = {
  CAR_VAN_FIRST_10K: 0.45,
  CAR_VAN_OVER_10K: 0.25,
  MOTORCYCLE: 0.24,
  BICYCLE: 0.20,
};

/**
 * Get current or specific tax year
 */
export function getTaxYear(date: Date = new Date()): TaxYear {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11

  // Tax year runs April 6 to April 5
  let taxYearStart: Date;
  let taxYearEnd: Date;

  if (month < 3 || (month === 3 && date.getDate() < 6)) {
    // Jan-Apr 5: Previous tax year
    taxYearStart = new Date(year - 1, 3, 6); // April 6 last year
    taxYearEnd = new Date(year, 3, 5); // April 5 this year
  } else {
    // Apr 6-Dec: Current tax year
    taxYearStart = new Date(year, 3, 6); // April 6 this year
    taxYearEnd = new Date(year + 1, 3, 5); // April 5 next year
  }

  return {
    startDate: taxYearStart,
    endDate: taxYearEnd,
    year: `${taxYearStart.getFullYear()}/${taxYearEnd.getFullYear()}`,
  };
}

/**
 * Calculate income tax based on UK tax brackets
 */
export function calculateIncomeTax(taxableProfit: number): {
  total: number;
  breakdown: Array<{
    bracket: string;
    amount: number;
    rate: number;
    tax: number;
  }>;
} {
  let remainingProfit = taxableProfit;
  const breakdown: Array<{
    bracket: string;
    amount: number;
    rate: number;
    tax: number;
  }> = [];
  let totalTax = 0;

  for (let i = 0; i < UK_TAX_BRACKETS.length; i++) {
    const bracket = UK_TAX_BRACKETS[i];
    const nextBracket = UK_TAX_BRACKETS[i + 1];

    if (remainingProfit <= 0) break;

    let taxableInBracket: number;

    if (!nextBracket) {
      // Last bracket - tax all remaining
      taxableInBracket = remainingProfit;
    } else {
      // Tax up to next bracket threshold
      const bracketLimit = nextBracket.threshold - bracket.threshold;
      taxableInBracket = Math.min(remainingProfit, bracketLimit);
    }

    const tax = taxableInBracket * bracket.rate;
    totalTax += tax;

    breakdown.push({
      bracket: bracket.name,
      amount: taxableInBracket,
      rate: bracket.rate,
      tax,
    });

    remainingProfit -= taxableInBracket;
  }

  return {
    total: Math.round(totalTax * 100) / 100,
    breakdown,
  };
}

/**
 * Calculate National Insurance contributions
 */
export function calculateNationalInsurance(profit: number): {
  class2: number;
  class4: number;
  total: number;
  breakdown: string[];
} {
  const breakdown: string[] = [];
  let class2 = 0;
  let class4 = 0;

  // Class 2 NI (£3.45/week if profit > £6,725)
  if (profit >= UK_NI_RATES.CLASS_2_THRESHOLD) {
    class2 = UK_NI_RATES.CLASS_2_WEEKLY * 52; // 52 weeks
    breakdown.push(`Class 2: £${class2.toFixed(2)} (£3.45/week × 52 weeks)`);
  } else {
    breakdown.push(`Class 2: £0 (profit below £${UK_NI_RATES.CLASS_2_THRESHOLD} threshold)`);
  }

  // Class 4 NI
  if (profit > UK_NI_RATES.CLASS_4_LOWER_THRESHOLD) {
    const lowerBand = Math.min(
      profit - UK_NI_RATES.CLASS_4_LOWER_THRESHOLD,
      UK_NI_RATES.CLASS_4_UPPER_THRESHOLD - UK_NI_RATES.CLASS_4_LOWER_THRESHOLD
    );
    const lowerTax = lowerBand * UK_NI_RATES.CLASS_4_RATE_LOWER;
    class4 += lowerTax;

    breakdown.push(
      `Class 4 (9% on £${UK_NI_RATES.CLASS_4_LOWER_THRESHOLD} - £${UK_NI_RATES.CLASS_4_UPPER_THRESHOLD}): £${lowerTax.toFixed(2)}`
    );

    if (profit > UK_NI_RATES.CLASS_4_UPPER_THRESHOLD) {
      const upperBand = profit - UK_NI_RATES.CLASS_4_UPPER_THRESHOLD;
      const upperTax = upperBand * UK_NI_RATES.CLASS_4_RATE_UPPER;
      class4 += upperTax;

      breakdown.push(
        `Class 4 (2% above £${UK_NI_RATES.CLASS_4_UPPER_THRESHOLD}): £${upperTax.toFixed(2)}`
      );
    }
  } else {
    breakdown.push(
      `Class 4: £0 (profit below £${UK_NI_RATES.CLASS_4_LOWER_THRESHOLD} threshold)`
    );
  }

  return {
    class2: Math.round(class2 * 100) / 100,
    class4: Math.round(class4 * 100) / 100,
    total: Math.round((class2 + class4) * 100) / 100,
    breakdown,
  };
}

/**
 * Generate comprehensive tax summary for self-assessment
 */
export async function generateTaxSummary(params: {
  userId: string;
  taxYear?: TaxYear;
  invoices: Array<{
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    clientId: string;
    clientName: string;
    date: Date;
  }>;
  expenses: Expense[];
  mileageEntries?: Array<{
    miles: number;
    vehicleType: 'car' | 'motorcycle' | 'bicycle';
  }>;
  homeOfficeHours?: number; // Hours per month
}): Promise<TaxSummary> {
  const { userId, invoices, expenses, mileageEntries = [], homeOfficeHours = 0 } = params;
  const taxYear = params.taxYear || getTaxYear();

  // Filter data for tax year
  const taxYearInvoices = invoices.filter(
    (inv) => inv.date >= taxYear.startDate && inv.date <= taxYear.endDate
  );
  const taxYearExpenses = expenses.filter(
    (exp) => exp.date >= taxYear.startDate && exp.date <= taxYear.endDate
  );

  // Calculate income
  const totalInvoiced = taxYearInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = taxYearInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const unreceived = totalInvoiced - totalPaid;

  // Income by client
  const byClient = Object.values(
    taxYearInvoices.reduce(
      (acc, inv) => {
        if (!acc[inv.clientId]) {
          acc[inv.clientId] = {
            clientId: inv.clientId,
            clientName: inv.clientName,
            totalInvoiced: 0,
            totalPaid: 0,
          };
        }
        acc[inv.clientId].totalInvoiced += inv.amount;
        if (inv.status === 'paid') {
          acc[inv.clientId].totalPaid += inv.amount;
        }
        return acc;
      },
      {} as Record<string, any>
    )
  );

  // Calculate expenses
  const expenseTotal = taxYearExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const taxDeductible = taxYearExpenses
    .filter((exp) => exp.taxDeductible)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const byCategory = taxYearExpenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    },
    {} as Record<ExpenseCategory, number>
  );

  // Calculate mileage allowance
  const mileageAllowance = mileageEntries.reduce((sum, entry) => {
    if (entry.vehicleType === 'car') {
      const first10k = Math.min(entry.miles, 10000) * HMRC_MILEAGE_RATES.CAR_VAN_FIRST_10K;
      const over10k =
        Math.max(0, entry.miles - 10000) * HMRC_MILEAGE_RATES.CAR_VAN_OVER_10K;
      return sum + first10k + over10k;
    } else if (entry.vehicleType === 'motorcycle') {
      return sum + entry.miles * HMRC_MILEAGE_RATES.MOTORCYCLE;
    } else {
      return sum + entry.miles * HMRC_MILEAGE_RATES.BICYCLE;
    }
  }, 0);

  // Calculate home office allowance (simplified expenses)
  let homeOfficeAllowance = 0;
  if (homeOfficeHours > 0) {
    if (homeOfficeHours >= 100) {
      homeOfficeAllowance = 26;
    } else if (homeOfficeHours >= 51) {
      homeOfficeAllowance = 18;
    } else if (homeOfficeHours >= 25) {
      homeOfficeAllowance = 10;
    }
    homeOfficeAllowance *= 12; // Annual
  }

  // Calculate profit
  const totalExpensesIncludingAllowances =
    taxDeductible + mileageAllowance + homeOfficeAllowance;
  const grossProfit = totalPaid - expenseTotal;
  const taxableProfit = totalPaid - totalExpensesIncludingAllowances;

  // Calculate taxes
  const incomeTaxCalc = calculateIncomeTax(taxableProfit);
  const niCalc = calculateNationalInsurance(taxableProfit);

  const estimatedTax = {
    incomeTax: incomeTaxCalc.total,
    class2NI: niCalc.class2,
    class4NI: niCalc.class4,
    total: incomeTaxCalc.total + niCalc.total,
    breakdown: [
      ...incomeTaxCalc.breakdown.map(
        (b) => `${b.bracket}: £${b.tax.toFixed(2)} (${(b.rate * 100).toFixed(0)}% on £${b.amount.toFixed(2)})`
      ),
      ...niCalc.breakdown,
    ],
  };

  // Generate warnings and recommendations
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (unreceived > totalPaid * 0.3) {
    warnings.push(
      `High outstanding invoices: £${unreceived.toFixed(2)} (${((unreceived / totalInvoiced) * 100).toFixed(0)}% of total invoiced)`
    );
    recommendations.push(
      'Consider chasing overdue invoices before tax year end to improve cash flow'
    );
  }

  if (taxDeductible < totalPaid * 0.2) {
    warnings.push(
      `Low expenses claimed: £${taxDeductible.toFixed(2)} (${((taxDeductible / totalPaid) * 100).toFixed(0)}% of income)`
    );
    recommendations.push(
      'Review expenses - you may be missing tax-deductible costs (office supplies, software, travel)'
    );
  }

  if (homeOfficeHours === 0) {
    recommendations.push(
      'Track home office hours to claim simplified expenses (£10-26/month based on usage)'
    );
  }

  if (mileageEntries.length === 0) {
    recommendations.push(
      'Track business mileage to claim 45p/mile allowance (first 10,000 miles)'
    );
  }

  if (estimatedTax.total > 5000) {
    recommendations.push(
      `Consider setting aside £${(estimatedTax.total / 12).toFixed(2)}/month for tax payments`
    );
    recommendations.push(
      'You may need to make payments on account (2 advance payments for next year)'
    );
  }

  logger.info('Generated tax summary', {
    userId,
    taxYear: taxYear.year,
    taxableProfit,
    estimatedTax: estimatedTax.total,
  });

  return {
    taxYear,
    income: {
      totalInvoiced,
      totalPaid,
      unreceived,
      byClient,
    },
    expenses: {
      total: expenseTotal,
      taxDeductible,
      nonDeductible: expenseTotal - taxDeductible,
      byCategory,
      homeOffice: homeOfficeAllowance,
      mileage: mileageAllowance,
    },
    profit: {
      grossProfit,
      taxableProfit,
    },
    estimatedTax,
    warnings,
    recommendations,
  };
}

/**
 * AI-powered tax advice using Gemini
 */
export async function getTaxAdvice(params: {
  taxSummary: TaxSummary;
  specificQuestion?: string;
}): Promise<{
  advice: string;
  suggestions: string[];
  warnings: string[];
}> {
  const { taxSummary, specificQuestion } = params;

  const model = getGemini();

  const prompt = `You are a UK tax advisor specializing in self-assessment for self-employed individuals.

Tax Summary:
- Tax Year: ${taxSummary.taxYear.year}
- Total Income (Paid): £${taxSummary.income.totalPaid.toFixed(2)}
- Tax-Deductible Expenses: £${taxSummary.expenses.taxDeductible.toFixed(2)}
- Taxable Profit: £${taxSummary.profit.taxableProfit.toFixed(2)}
- Estimated Tax: £${taxSummary.estimatedTax.total.toFixed(2)}
  - Income Tax: £${taxSummary.estimatedTax.incomeTax.toFixed(2)}
  - NI (Class 2): £${taxSummary.estimatedTax.class2NI.toFixed(2)}
  - NI (Class 4): £${taxSummary.estimatedTax.class4NI.toFixed(2)}

Current Warnings: ${taxSummary.warnings.join('; ')}

${specificQuestion ? `Specific Question: ${specificQuestion}` : ''}

Provide:
1. General tax advice for this situation
2. 3-5 actionable suggestions for tax efficiency
3. Any additional warnings or red flags

Format as JSON:
{
  "advice": "General advice paragraph",
  "suggestions": ["Suggestion 1", "Suggestion 2", ...],
  "warnings": ["Warning 1", "Warning 2", ...]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI tax advice');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  logger.info('Generated AI tax advice', {
    taxYear: taxSummary.taxYear.year,
    suggestionsCount: parsed.suggestions.length,
  });

  return parsed;
}

/**
 * Generate HMRC-ready tax report (CSV export)
 */
export function generateHMRCReport(params: {
  taxSummary: TaxSummary;
  businessName: string;
  utr?: string; // Unique Taxpayer Reference
}): string {
  const { taxSummary, businessName, utr } = params;

  const lines: string[] = [
    '# HMRC Self-Assessment Tax Return',
    `# Tax Year: ${taxSummary.taxYear.year}`,
    `# Business: ${businessName}`,
    utr ? `# UTR: ${utr}` : '',
    '',
    '## Income',
    `Total Invoiced,£${taxSummary.income.totalInvoiced.toFixed(2)}`,
    `Total Received (Cash Basis),£${taxSummary.income.totalPaid.toFixed(2)}`,
    `Outstanding,£${taxSummary.income.unreceived.toFixed(2)}`,
    '',
    '## Expenses (Tax Deductible)',
    `Total Allowable Expenses,£${taxSummary.expenses.taxDeductible.toFixed(2)}`,
  ];

  // Expense categories
  for (const [category, amount] of Object.entries(taxSummary.expenses.byCategory)) {
    if (amount > 0) {
      lines.push(`${category.replace(/_/g, ' ')},£${amount.toFixed(2)}`);
    }
  }

  if (taxSummary.expenses.homeOffice > 0) {
    lines.push(`Home Office (Simplified),£${taxSummary.expenses.homeOffice.toFixed(2)}`);
  }

  if (taxSummary.expenses.mileage > 0) {
    lines.push(`Mileage Allowance,£${taxSummary.expenses.mileage.toFixed(2)}`);
  }

  lines.push(
    '',
    '## Profit',
    `Gross Profit,£${taxSummary.profit.grossProfit.toFixed(2)}`,
    `Taxable Profit,£${taxSummary.profit.taxableProfit.toFixed(2)}`,
    '',
    '## Tax Calculation',
    `Income Tax,£${taxSummary.estimatedTax.incomeTax.toFixed(2)}`,
    `National Insurance (Class 2),£${taxSummary.estimatedTax.class2NI.toFixed(2)}`,
    `National Insurance (Class 4),£${taxSummary.estimatedTax.class4NI.toFixed(2)}`,
    `Total Tax Due,£${taxSummary.estimatedTax.total.toFixed(2)}`
  );

  return lines.join('\n');
}

/**
 * Check tier limits for tax features
 */
export function checkTaxPrepLimit(params: {
  tier: 'free' | 'starter' | 'professional' | 'business';
}): {
  allowed: boolean;
  features: {
    taxSummary: boolean;
    aiAdvice: boolean;
    hmrcExport: boolean;
    historicalReports: boolean;
  };
} {
  const features = {
    free: {
      taxSummary: false,
      aiAdvice: false,
      hmrcExport: false,
      historicalReports: false,
    },
    starter: {
      taxSummary: true,
      aiAdvice: false,
      hmrcExport: true,
      historicalReports: false,
    },
    professional: {
      taxSummary: true,
      aiAdvice: true,
      hmrcExport: true,
      historicalReports: true,
    },
    business: {
      taxSummary: true,
      aiAdvice: true,
      hmrcExport: true,
      historicalReports: true,
    },
  };

  return {
    allowed: params.tier !== 'free',
    features: features[params.tier],
  };
}

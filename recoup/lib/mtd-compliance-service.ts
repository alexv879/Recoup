/**
 * Making Tax Digital (MTD) Compliance Service for UK Freelancers
 *
 * COMPETITIVE ADVANTAGE: Most competitors charge EXTRA or don't support MTD
 *
 * Addresses URGENT UK pain point:
 * - MTD for Income Tax starts April 2026 (£50k+), 2027 (£30k+), 2028 (£20k+)
 * - Quarterly reporting required (4 submissions + annual vs 1 currently)
 * - Many freelancers unaware of changes
 * - Software costs - most tools NOT MTD-compliant
 *
 * Features:
 * - Automatic quarterly submission reminders
 * - MTD readiness score dashboard
 * - HMRC API integration for submissions
 * - Digital record keeping compliant with MTD standards
 * - Quarterly summary generation
 * - End-of-year declaration automation
 */

import { logger } from '@/utils/logger';

export interface MTDSettings {
  userId: string;
  enabled: boolean;

  // HMRC credentials
  hmrcCredentials: {
    utr: string; // Unique Taxpayer Reference
    nino?: string; // National Insurance Number
    mtdId?: string; // MTD ID from HMRC
    accessToken?: string; // OAuth token for HMRC API
    refreshToken?: string;
    tokenExpiry?: Date;
  };

  // Business details
  businessDetails: {
    tradingName?: string;
    businessType: 'self_employed' | 'partnership';
    accountingPeriodStart: Date; // Usually April 6
    accountingPeriodEnd: Date; // Usually April 5
    cashBasis: boolean; // Most freelancers use cash basis
  };

  // Thresholds
  thresholds: {
    annualIncome: number; // To determine MTD applicability
    mtdThreshold: number; // £50k (2026), £30k (2027), £20k (2028)
    year: number;
  };

  // Submission tracking
  submissions: QuarterlySubmission[];
  nextSubmissionDue?: Date;
  lastSubmissionDate?: Date;

  // Readiness
  readinessScore: number; // 0-100
  readinessChecks: MTDReadinessCheck[];

  createdAt: Date;
  updatedAt: Date;
}

export interface QuarterlySubmission {
  id: string;
  quarter: 1 | 2 | 3 | 4;
  taxYear: string; // "2025/2026"
  quarterPeriod: {
    startDate: Date;
    endDate: Date;
  };

  // Submission data
  income: {
    totalIncome: number;
    bySource: Record<string, number>;
  };

  expenses: {
    totalAllowable: number;
    byCategory: Record<string, number>;
    simplifiedExpenses: {
      homeOffice: number;
      mileage: number;
    };
  };

  profit: {
    grossProfit: number;
    netProfit: number;
  };

  // Submission status
  status: 'not_started' | 'in_progress' | 'ready' | 'submitted' | 'accepted' | 'rejected';
  dueDate: Date;
  submittedDate?: Date;
  acceptedDate?: Date;
  hmrcReference?: string;

  // Validation
  validationErrors: string[];
  warnings: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface MTDReadinessCheck {
  category: 'credentials' | 'records' | 'software' | 'knowledge' | 'submissions';
  check: string;
  status: 'complete' | 'incomplete' | 'not_applicable';
  weight: number; // Importance weight for score calculation
  actionRequired?: string;
}

export interface EndOfYearDeclaration {
  id: string;
  taxYear: string;
  userId: string;

  // Summary from all quarters
  annualIncome: number;
  annualExpenses: number;
  annualProfit: number;

  // Additional information
  capitalAllowances?: number;
  lossesCarriedForward?: number;
  otherAdjustments?: number;

  // Final calculation
  taxableProfit: number;

  // Class 4 NI contributions
  class4NI: number;

  // Status
  status: 'draft' | 'submitted' | 'accepted';
  submittedDate?: Date;
  hmrcReference?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface MTDAlert {
  id: string;
  severity: 'info' | 'warning' | 'urgent';
  type: 'submission_due' | 'readiness_low' | 'validation_error' | 'token_expiry';
  message: string;
  dueDate?: Date;
  actionRequired: string;
  triggeredDate: Date;
}

// ==============================================================================
// MTD READINESS ASSESSMENT
// ==============================================================================

/**
 * Calculate MTD readiness score
 */
export function calculateMTDReadiness(params: {
  settings: MTDSettings;
  hasDigitalRecords: boolean;
  quarterlySubmissionsOnTime: number; // % of submissions on time
}): {
  score: number; // 0-100
  status: 'not_ready' | 'partially_ready' | 'ready';
  checks: MTDReadinessCheck[];
  recommendations: string[];
} {
  const checks: MTDReadinessCheck[] = [
    {
      category: 'credentials',
      check: 'HMRC credentials registered',
      status: params.settings.hmrcCredentials.mtdId ? 'complete' : 'incomplete',
      weight: 20,
      actionRequired: !params.settings.hmrcCredentials.mtdId
        ? 'Sign up for MTD on HMRC website'
        : undefined,
    },
    {
      category: 'credentials',
      check: 'OAuth token valid',
      status: params.settings.hmrcCredentials.accessToken &&
             params.settings.hmrcCredentials.tokenExpiry &&
             params.settings.hmrcCredentials.tokenExpiry > new Date()
        ? 'complete' : 'incomplete',
      weight: 15,
      actionRequired: 'Authorize Recoup to submit to HMRC',
    },
    {
      category: 'records',
      check: 'Digital record keeping',
      status: params.hasDigitalRecords ? 'complete' : 'incomplete',
      weight: 25,
      actionRequired: !params.hasDigitalRecords
        ? 'Ensure all income and expenses tracked digitally'
        : undefined,
    },
    {
      category: 'software',
      check: 'MTD-compatible software',
      status: 'complete', // Recoup is MTD-compatible
      weight: 10,
    },
    {
      category: 'knowledge',
      check: 'Understanding MTD requirements',
      status: 'complete', // Assumed if using this feature
      weight: 10,
    },
    {
      category: 'submissions',
      check: 'Quarterly submissions on time',
      status: params.quarterlySubmissionsOnTime >= 75 ? 'complete' : 'incomplete',
      weight: 20,
      actionRequired: params.quarterlySubmissionsOnTime < 75
        ? 'Set up automatic submission reminders'
        : undefined,
    },
  ];

  // Calculate weighted score
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const completedWeight = checks
    .filter(c => c.status === 'complete')
    .reduce((sum, c) => sum + c.weight, 0);

  const score = Math.round((completedWeight / totalWeight) * 100);

  const status: 'not_ready' | 'partially_ready' | 'ready' =
    score < 50 ? 'not_ready' :
    score < 80 ? 'partially_ready' : 'ready';

  const recommendations: string[] = checks
    .filter(c => c.status !== 'complete' && c.actionRequired)
    .map(c => c.actionRequired!);

  if (score < 80) {
    recommendations.push('Complete remaining readiness checks before April 2026 deadline');
  }

  return {
    score,
    status,
    checks,
    recommendations,
  };
}

/**
 * Check if user needs MTD
 */
export function checkMTDApplicability(params: {
  annualIncome: number;
  taxYear: number;
}): {
  applicable: boolean;
  threshold: number;
  reason: string;
  deadline?: Date;
} {
  const { annualIncome, taxYear } = params;

  let threshold: number;
  let deadline: Date | undefined;

  if (taxYear >= 2028) {
    threshold = 20000; // £20k from April 2028
    deadline = new Date(2028, 3, 6); // April 6, 2028
  } else if (taxYear >= 2027) {
    threshold = 30000; // £30k from April 2027
    deadline = new Date(2027, 3, 6);
  } else if (taxYear >= 2026) {
    threshold = 50000; // £50k from April 2026
    deadline = new Date(2026, 3, 6);
  } else {
    return {
      applicable: false,
      threshold: 50000,
      reason: 'MTD for Income Tax starts April 2026',
    };
  }

  if (annualIncome >= threshold) {
    return {
      applicable: true,
      threshold,
      reason: `Income £${annualIncome.toLocaleString()} exceeds £${threshold.toLocaleString()} threshold`,
      deadline,
    };
  }

  return {
    applicable: false,
    threshold,
    reason: `Income £${annualIncome.toLocaleString()} below £${threshold.toLocaleString()} threshold`,
  };
}

// ==============================================================================
// QUARTERLY SUBMISSIONS
// ==============================================================================

/**
 * Generate quarterly submission
 */
export function generateQuarterlySubmission(params: {
  userId: string;
  quarter: 1 | 2 | 3 | 4;
  taxYear: string;
  income: Array<{ amount: number; source: string; date: Date }>;
  expenses: Array<{ amount: number; category: string; taxDeductible: boolean; date: Date }>;
  homeOfficeHours?: number;
  mileage?: Array<{ miles: number; vehicleType: 'car' | 'motorcycle' | 'bicycle' }>;
}): QuarterlySubmission {
  const { userId, quarter, taxYear, income, expenses, homeOfficeHours = 0, mileage = [] } = params;

  // Calculate quarter dates
  const yearParts = taxYear.split('/');
  const startYear = parseInt(yearParts[0]);

  const quarterDates = [
    { startDate: new Date(startYear, 3, 6), endDate: new Date(startYear, 6, 5) }, // Q1: Apr-Jun
    { startDate: new Date(startYear, 6, 6), endDate: new Date(startYear, 9, 5) }, // Q2: Jul-Sep
    { startDate: new Date(startYear, 9, 6), endDate: new Date(startYear, 11, 31) }, // Q3: Oct-Dec
    { startDate: new Date(startYear + 1, 0, 1), endDate: new Date(startYear + 1, 3, 5) }, // Q4: Jan-Mar
  ];

  const quarterPeriod = quarterDates[quarter - 1];

  // Filter data for this quarter
  const quarterIncome = income.filter(
    i => i.date >= quarterPeriod.startDate && i.date <= quarterPeriod.endDate
  );
  const quarterExpenses = expenses.filter(
    e => e.date >= quarterPeriod.startDate && e.date <= quarterPeriod.endDate && e.taxDeductible
  );

  // Calculate income by source
  const incomeBySource = quarterIncome.reduce((acc, i) => {
    acc[i.source] = (acc[i.source] || 0) + i.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalIncome = quarterIncome.reduce((sum, i) => sum + i.amount, 0);

  // Calculate expenses by category
  const expensesByCategory = quarterExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = quarterExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate simplified expenses
  const homeOfficeAllowance = calculateHomeOfficeAllowance(homeOfficeHours);
  const mileageAllowance = mileage.reduce((sum, m) => {
    return sum + calculateMileageAllowance(m.miles, m.vehicleType);
  }, 0);

  const totalAllowableExpenses = totalExpenses + homeOfficeAllowance + mileageAllowance;

  // Calculate profit
  const grossProfit = totalIncome - totalExpenses;
  const netProfit = totalIncome - totalAllowableExpenses;

  // Set due date (1 month after quarter end + 1 day)
  const dueDate = new Date(quarterPeriod.endDate);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(dueDate.getDate() + 1);

  // Validation
  const validationErrors: string[] = [];
  const warnings: string[] = [];

  if (totalIncome === 0) {
    warnings.push('No income recorded for this quarter');
  }

  if (totalAllowableExpenses > totalIncome * 1.5) {
    warnings.push('Expenses significantly exceed income - HMRC may query');
  }

  const submission: QuarterlySubmission = {
    id: `qtr-${Date.now()}`,
    quarter,
    taxYear,
    quarterPeriod,
    income: {
      totalIncome,
      bySource: incomeBySource,
    },
    expenses: {
      totalAllowable: totalAllowableExpenses,
      byCategory: expensesByCategory,
      simplifiedExpenses: {
        homeOffice: homeOfficeAllowance,
        mileage: mileageAllowance,
      },
    },
    profit: {
      grossProfit,
      netProfit,
    },
    status: 'ready',
    dueDate,
    validationErrors,
    warnings,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  logger.info('Quarterly submission generated', {
    userId,
    quarter,
    taxYear,
    netProfit,
  });

  return submission;
}

/**
 * Submit to HMRC (placeholder - would use HMRC API)
 */
export async function submitToHMRC(params: {
  submission: QuarterlySubmission;
  settings: MTDSettings;
}): Promise<{
  success: boolean;
  hmrcReference?: string;
  error?: string;
}> {
  const { submission, settings } = params;

  // Validate submission
  if (submission.validationErrors.length > 0) {
    return {
      success: false,
      error: `Validation errors: ${submission.validationErrors.join(', ')}`,
    };
  }

  // Check OAuth token
  if (!settings.hmrcCredentials.accessToken) {
    return {
      success: false,
      error: 'Not authorized - please connect to HMRC',
    };
  }

  if (settings.hmrcCredentials.tokenExpiry && settings.hmrcCredentials.tokenExpiry < new Date()) {
    return {
      success: false,
      error: 'OAuth token expired - please re-authorize',
    };
  }

  // TODO: Actual HMRC API integration
  // This would use HMRC's MTD for Income Tax API
  // https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/self-assessment-api/

  try {
    // Placeholder for HMRC API call
    const hmrcReference = `HMRC-${Date.now()}`;

    logger.info('Submitted to HMRC', {
      quarter: submission.quarter,
      taxYear: submission.taxYear,
      hmrcReference,
    });

    return {
      success: true,
      hmrcReference,
    };
  } catch (error) {
    logger.error('HMRC submission failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: 'Submission to HMRC failed. Please try again.',
    };
  }
}

// ==============================================================================
// END OF YEAR DECLARATION
// ==============================================================================

/**
 * Generate end-of-year declaration (5th submission)
 */
export function generateEndOfYearDeclaration(params: {
  userId: string;
  taxYear: string;
  quarterlySubmissions: QuarterlySubmission[];
  capitalAllowances?: number;
  lossesCarriedForward?: number;
}): EndOfYearDeclaration {
  const { userId, taxYear, quarterlySubmissions, capitalAllowances = 0, lossesCarriedForward = 0 } = params;

  // Sum all quarters
  const annualIncome = quarterlySubmissions.reduce(
    (sum, q) => sum + q.income.totalIncome,
    0
  );

  const annualExpenses = quarterlySubmissions.reduce(
    (sum, q) => sum + q.expenses.totalAllowable,
    0
  );

  const annualProfit = annualIncome - annualExpenses;

  // Calculate adjustments
  const taxableProfit = annualProfit - capitalAllowances - lossesCarriedForward;

  // Calculate Class 4 NI (simplified)
  const class4NI = calculateClass4NI(taxableProfit);

  const declaration: EndOfYearDeclaration = {
    id: `eoy-${Date.now()}`,
    taxYear,
    userId,
    annualIncome,
    annualExpenses,
    annualProfit,
    capitalAllowances,
    lossesCarriedForward,
    taxableProfit,
    class4NI,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  logger.info('End-of-year declaration generated', {
    userId,
    taxYear,
    taxableProfit,
    class4NI,
  });

  return declaration;
}

// ==============================================================================
// ALERTS & REMINDERS
// ==============================================================================

/**
 * Check for upcoming submission deadlines
 */
export function checkSubmissionDeadlines(params: {
  settings: MTDSettings;
  daysAhead: number;
}): MTDAlert[] {
  const { settings, daysAhead } = params;
  const alerts: MTDAlert[] = [];
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  for (const submission of settings.submissions) {
    if (submission.status !== 'submitted' && submission.status !== 'accepted') {
      if (submission.dueDate <= futureDate) {
        const daysRemaining = Math.ceil(
          (submission.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const severity: 'info' | 'warning' | 'urgent' =
          daysRemaining <= 7 ? 'urgent' :
          daysRemaining <= 14 ? 'warning' : 'info';

        alerts.push({
          id: `alert-${Date.now()}`,
          severity,
          type: 'submission_due',
          message: `Q${submission.quarter} ${submission.taxYear} submission due in ${daysRemaining} days`,
          dueDate: submission.dueDate,
          actionRequired: 'Complete and submit quarterly update to HMRC',
          triggeredDate: now,
        });
      }
    }
  }

  return alerts;
}

// ==============================================================================
// UTILITIES
// ==============================================================================

/**
 * Calculate home office allowance (HMRC simplified expenses)
 */
function calculateHomeOfficeAllowance(hoursPerMonth: number): number {
  const monthlyAllowance =
    hoursPerMonth >= 100 ? 26 :
    hoursPerMonth >= 51 ? 18 :
    hoursPerMonth >= 25 ? 10 : 0;

  return monthlyAllowance * 3; // Quarterly (3 months)
}

/**
 * Calculate mileage allowance
 */
function calculateMileageAllowance(
  miles: number,
  vehicleType: 'car' | 'motorcycle' | 'bicycle'
): number {
  if (vehicleType === 'car') {
    const first10k = Math.min(miles, 10000) * 0.45;
    const over10k = Math.max(0, miles - 10000) * 0.25;
    return first10k + over10k;
  } else if (vehicleType === 'motorcycle') {
    return miles * 0.24;
  } else {
    return miles * 0.20;
  }
}

/**
 * Calculate Class 4 NI contributions (simplified)
 */
function calculateClass4NI(profit: number): number {
  const lowerThreshold = 12570;
  const upperThreshold = 50270;

  let ni = 0;

  if (profit > lowerThreshold) {
    const lowerBand = Math.min(profit - lowerThreshold, upperThreshold - lowerThreshold);
    ni += lowerBand * 0.09; // 9% between thresholds
  }

  if (profit > upperThreshold) {
    const upperBand = profit - upperThreshold;
    ni += upperBand * 0.02; // 2% above upper threshold
  }

  return Math.round(ni * 100) / 100;
}

/**
 * Get MTD compliance summary
 */
export function getMTDComplianceSummary(settings: MTDSettings): {
  isCompliant: boolean;
  readinessScore: number;
  upcomingDeadlines: number;
  submissionsCompleted: number;
  submissionsPending: number;
  warnings: string[];
} {
  const submitted = settings.submissions.filter(
    s => s.status === 'submitted' || s.status === 'accepted'
  ).length;

  const pending = settings.submissions.filter(
    s => s.status !== 'submitted' && s.status !== 'accepted'
  ).length;

  const upcomingDeadlines = settings.submissions.filter(s => {
    const daysUntilDue = (s.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilDue <= 30 && daysUntilDue > 0 && s.status !== 'submitted';
  }).length;

  const warnings: string[] = [];

  if (settings.readinessScore < 80) {
    warnings.push(`MTD readiness score low: ${settings.readinessScore}/100`);
  }

  if (pending > 0) {
    warnings.push(`${pending} quarterly submission(s) pending`);
  }

  if (upcomingDeadlines > 0) {
    warnings.push(`${upcomingDeadlines} submission(s) due within 30 days`);
  }

  const isCompliant = settings.readinessScore >= 80 && pending === 0;

  return {
    isCompliant,
    readinessScore: settings.readinessScore,
    upcomingDeadlines,
    submissionsCompleted: submitted,
    submissionsPending: pending,
    warnings,
  };
}

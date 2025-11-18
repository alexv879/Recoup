/**
 * Income Smoothing & Cash Flow Forecasting Service
 *
 * COMPETITIVE ADVANTAGE: NO existing invoicing tool offers this
 *
 * Addresses #1 freelancer pain point: Income instability (39% struggle)
 * - 40% face delayed payments
 * - 85% have invoices paid late at least sometimes
 * - Need 9-12 months emergency savings vs 3-6 for employees
 *
 * Features:
 * - Automatic income smoothing (save during high months, use during low months)
 * - 6-12 month cash flow forecast
 * - Emergency fund builder with auto-contributions
 * - Income drought alerts
 * - Payment probability prediction per client
 */

import { logger } from '@/utils/logger';

export interface IncomeSmoothingSettings {
  userId: string;
  enabled: boolean;

  // Target monthly income (baseline)
  targetMonthlyIncome: number; // e.g., £3000

  // Savings rules
  savingsRules: {
    excessPercentage: number; // % to save when income > target (e.g., 50%)
    minimumSavings: number; // Min to save even in low months (e.g., £100)
    emergencyFundGoal: number; // Target emergency fund (e.g., £36000 for 12 months)
    autoContribute: boolean; // Auto-transfer to savings
  };

  // Buffer account
  bufferAccount: {
    currentBalance: number;
    transactions: BufferTransaction[];
  };

  // Emergency fund
  emergencyFund: {
    currentBalance: number;
    goal: number;
    monthsCovered: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface BufferTransaction {
  id: string;
  date: Date;
  type: 'deposit' | 'withdrawal';
  amount: number;
  reason: string;
  fromIncome?: number; // Which income triggered this
  monthlyIncome: number; // Income for that month
}

export interface CashFlowForecast {
  userId: string;
  generatedAt: Date;
  forecastMonths: number; // 6 or 12

  forecast: MonthlyForecast[];

  summary: {
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    projectedSurplus: number;
    riskLevel: 'low' | 'medium' | 'high';
    warnings: string[];
    recommendations: string[];
  };
}

export interface MonthlyForecast {
  month: string; // '2025-12'
  date: Date;

  income: {
    confirmed: number; // Paid invoices
    expected: number; // Pending invoices likely to be paid
    potential: number; // New business estimates
    total: number;
    confidence: number; // 0-100
  };

  expenses: {
    fixed: number; // Rent, software, etc
    variable: number; // Based on historical average
    total: number;
  };

  cashFlow: {
    netCashFlow: number; // Income - expenses
    runningBalance: number; // Cumulative balance
    bufferWithdrawal: number; // Needed from buffer if negative
    bufferDeposit: number; // Excess to save if positive
  };

  status: 'surplus' | 'neutral' | 'deficit' | 'critical';
}

export interface IncomeDroughtAlert {
  id: string;
  userId: string;
  severity: 'warning' | 'critical';
  triggeredAt: Date;

  situation: {
    currentMonthIncome: number;
    last3MonthsAverage: number;
    percentageDown: number;
    expectedShortfall: number;
  };

  recommendations: string[];
  actionPlan: {
    useBuffer: number;
    reduceExpenses: number;
    urgentOutreach: string[]; // Client IDs to contact
  };
}

export interface PaymentProbability {
  clientId: string;
  clientName: string;
  invoiceId: string;
  invoiceAmount: number;
  dueDate: Date;

  probabilityScore: number; // 0-100
  expectedPaymentDate: Date;
  riskFactors: string[];
  confidence: 'high' | 'medium' | 'low';

  historicalData: {
    averagePaymentTime: number; // Days after due date
    onTimeRate: number; // Percentage
    totalInvoices: number;
    lateCount: number;
  };
}

// ==============================================================================
// INCOME SMOOTHING
// ==============================================================================

/**
 * Calculate how much to save/withdraw based on income
 */
export function calculateIncomeSmoothingAction(params: {
  monthlyIncome: number;
  targetMonthlyIncome: number;
  savingsRules: IncomeSmoothingSettings['savingsRules'];
  currentBufferBalance: number;
}): {
  action: 'save' | 'withdraw' | 'neutral';
  amount: number;
  reason: string;
  newBufferBalance: number;
} {
  const { monthlyIncome, targetMonthlyIncome, savingsRules, currentBufferBalance } = params;

  const difference = monthlyIncome - targetMonthlyIncome;

  // High income month - save excess
  if (difference > 100) {
    const savingsAmount = Math.max(
      difference * (savingsRules.excessPercentage / 100),
      savingsRules.minimumSavings
    );

    return {
      action: 'save',
      amount: savingsAmount,
      reason: `Income £${monthlyIncome.toFixed(2)} exceeded target £${targetMonthlyIncome.toFixed(2)}. Saving ${savingsRules.excessPercentage}% of excess.`,
      newBufferBalance: currentBufferBalance + savingsAmount,
    };
  }

  // Low income month - withdraw from buffer
  if (difference < -100 && currentBufferBalance > 0) {
    const withdrawAmount = Math.min(Math.abs(difference), currentBufferBalance);

    return {
      action: 'withdraw',
      amount: withdrawAmount,
      reason: `Income £${monthlyIncome.toFixed(2)} below target £${targetMonthlyIncome.toFixed(2)}. Using buffer to smooth income.`,
      newBufferBalance: currentBufferBalance - withdrawAmount,
    };
  }

  // Neutral - close to target
  return {
    action: 'neutral',
    amount: 0,
    reason: `Income £${monthlyIncome.toFixed(2)} close to target £${targetMonthlyIncome.toFixed(2)}. No action needed.`,
    newBufferBalance: currentBufferBalance,
  };
}

/**
 * Calculate emergency fund progress
 */
export function calculateEmergencyFundStatus(params: {
  currentBalance: number;
  monthlyExpenses: number;
  recommendedMonths: number; // Usually 12 for freelancers
}): {
  goal: number;
  percentComplete: number;
  monthsCovered: number;
  status: 'critical' | 'low' | 'good' | 'excellent';
  message: string;
} {
  const { currentBalance, monthlyExpenses, recommendedMonths } = params;

  const goal = monthlyExpenses * recommendedMonths;
  const percentComplete = (currentBalance / goal) * 100;
  const monthsCovered = currentBalance / monthlyExpenses;

  let status: 'critical' | 'low' | 'good' | 'excellent';
  let message: string;

  if (monthsCovered < 3) {
    status = 'critical';
    message = `Only ${monthsCovered.toFixed(1)} months covered. Goal: ${recommendedMonths} months. URGENT: Build emergency fund.`;
  } else if (monthsCovered < 6) {
    status = 'low';
    message = `${monthsCovered.toFixed(1)} months covered. Goal: ${recommendedMonths} months. Keep building.`;
  } else if (monthsCovered < 12) {
    status = 'good';
    message = `${monthsCovered.toFixed(1)} months covered. Getting close to goal!`;
  } else {
    status = 'excellent';
    message = `${monthsCovered.toFixed(1)} months covered. Emergency fund fully funded!`;
  }

  return {
    goal,
    percentComplete: Math.min(percentComplete, 100),
    monthsCovered,
    status,
    message,
  };
}

// ==============================================================================
// CASH FLOW FORECASTING
// ==============================================================================

/**
 * Generate 6-12 month cash flow forecast
 */
export function generateCashFlowForecast(params: {
  userId: string;
  months: 6 | 12;
  historicalIncome: Array<{ month: string; amount: number }>;
  historicalExpenses: Array<{ month: string; amount: number }>;
  pendingInvoices: Array<{
    amount: number;
    dueDate: Date;
    probabilityScore: number;
  }>;
  recurringExpenses: Array<{ name: string; amount: number; frequency: 'monthly' | 'quarterly' | 'yearly' }>;
  currentBufferBalance: number;
}): CashFlowForecast {
  const { userId, months, historicalIncome, historicalExpenses, pendingInvoices, recurringExpenses, currentBufferBalance } = params;

  // Calculate historical averages
  const avgMonthlyIncome = historicalIncome.reduce((sum, m) => sum + m.amount, 0) / historicalIncome.length;
  const avgMonthlyExpenses = historicalExpenses.reduce((sum, m) => sum + m.amount, 0) / historicalExpenses.length;

  // Calculate monthly fixed expenses
  const monthlyFixedExpenses = recurringExpenses
    .filter(e => e.frequency === 'monthly')
    .reduce((sum, e) => sum + e.amount, 0);

  const forecast: MonthlyForecast[] = [];
  let runningBalance = currentBufferBalance;

  for (let i = 0; i < months; i++) {
    const forecastDate = new Date();
    forecastDate.setMonth(forecastDate.getMonth() + i);
    const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;

    // Income forecast
    const pendingForMonth = pendingInvoices.filter(inv => {
      const invMonth = `${inv.dueDate.getFullYear()}-${String(inv.dueDate.getMonth() + 1).padStart(2, '0')}`;
      return invMonth === monthKey;
    });

    const confirmedIncome = pendingForMonth
      .filter(inv => inv.probabilityScore >= 90)
      .reduce((sum, inv) => sum + inv.amount, 0);

    const expectedIncome = pendingForMonth
      .filter(inv => inv.probabilityScore >= 60 && inv.probabilityScore < 90)
      .reduce((sum, inv) => sum + inv.amount, 0);

    const potentialIncome = pendingForMonth
      .filter(inv => inv.probabilityScore < 60)
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Use historical average if no pending invoices
    const totalIncome = Math.max(confirmedIncome + expectedIncome * 0.7 + potentialIncome * 0.3, avgMonthlyIncome);
    const incomeConfidence = pendingForMonth.length > 0 ? 80 : 60;

    // Expense forecast
    const variableExpenses = avgMonthlyExpenses - monthlyFixedExpenses;
    const totalExpenses = monthlyFixedExpenses + variableExpenses;

    // Cash flow
    const netCashFlow = totalIncome - totalExpenses;
    runningBalance += netCashFlow;

    const bufferWithdrawal = netCashFlow < 0 ? Math.abs(netCashFlow) : 0;
    const bufferDeposit = netCashFlow > 0 ? netCashFlow * 0.5 : 0; // Save 50% of surplus

    const status: 'surplus' | 'neutral' | 'deficit' | 'critical' =
      netCashFlow > 500 ? 'surplus' :
      netCashFlow > -500 ? 'neutral' :
      netCashFlow > -1000 ? 'deficit' : 'critical';

    forecast.push({
      month: monthKey,
      date: forecastDate,
      income: {
        confirmed: confirmedIncome,
        expected: expectedIncome,
        potential: potentialIncome,
        total: totalIncome,
        confidence: incomeConfidence,
      },
      expenses: {
        fixed: monthlyFixedExpenses,
        variable: variableExpenses,
        total: totalExpenses,
      },
      cashFlow: {
        netCashFlow,
        runningBalance,
        bufferWithdrawal,
        bufferDeposit,
      },
      status,
    });
  }

  // Generate warnings and recommendations
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const negativeMonths = forecast.filter(m => m.cashFlow.netCashFlow < 0);
  const criticalMonths = forecast.filter(m => m.status === 'critical');

  if (negativeMonths.length > months / 2) {
    warnings.push(`${negativeMonths.length} out of ${months} months forecast negative cash flow`);
    recommendations.push('Increase marketing efforts to acquire new clients');
    recommendations.push('Consider raising rates for new projects');
  }

  if (criticalMonths.length > 0) {
    warnings.push(`${criticalMonths.length} months with critical cash flow deficits`);
    recommendations.push('Build emergency buffer immediately');
    recommendations.push('Reduce discretionary expenses');
  }

  if (runningBalance < avgMonthlyExpenses * 3) {
    warnings.push('Projected buffer below 3 months expenses');
    recommendations.push('Prioritize emergency fund contributions');
  }

  const riskLevel: 'low' | 'medium' | 'high' =
    criticalMonths.length > 2 ? 'high' :
    negativeMonths.length > months / 2 ? 'medium' : 'low';

  return {
    userId,
    generatedAt: new Date(),
    forecastMonths: months,
    forecast,
    summary: {
      averageMonthlyIncome: avgMonthlyIncome,
      averageMonthlyExpenses: avgMonthlyExpenses,
      projectedSurplus: runningBalance - currentBufferBalance,
      riskLevel,
      warnings,
      recommendations,
    },
  };
}

// ==============================================================================
// INCOME DROUGHT ALERTS
// ==============================================================================

/**
 * Detect and create income drought alert
 */
export function detectIncomeDrought(params: {
  userId: string;
  currentMonthIncome: number;
  historicalIncome: Array<{ month: string; amount: number }>;
  targetMonthlyIncome: number;
  clients: Array<{ id: string; name: string; lastInvoiceDate: Date; totalRevenue: number }>;
}): IncomeDroughtAlert | null {
  const { userId, currentMonthIncome, historicalIncome, targetMonthlyIncome, clients } = params;

  // Calculate last 3 months average
  const last3Months = historicalIncome.slice(-3);
  const last3MonthsAverage = last3Months.reduce((sum, m) => sum + m.amount, 0) / last3Months.length;

  const percentageDown = ((last3MonthsAverage - currentMonthIncome) / last3MonthsAverage) * 100;

  // Trigger alert if current month is 30%+ below average
  if (percentageDown < 30) {
    return null; // No drought
  }

  const severity: 'warning' | 'critical' = percentageDown >= 50 ? 'critical' : 'warning';
  const expectedShortfall = targetMonthlyIncome - currentMonthIncome;

  // Generate recommendations
  const recommendations: string[] = [];

  if (currentMonthIncome < targetMonthlyIncome * 0.5) {
    recommendations.push('URGENT: Current income 50%+ below target');
    recommendations.push('Activate emergency fund if needed');
  }

  recommendations.push('Reach out to past clients for new projects');
  recommendations.push('Offer early payment discounts for pending invoices');
  recommendations.push('Increase marketing and networking activities');

  // Identify clients to contact (haven't invoiced in 60+ days, high revenue)
  const urgentOutreach = clients
    .filter(client => {
      const daysSinceLastInvoice = (Date.now() - client.lastInvoiceDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastInvoice >= 60 && client.totalRevenue > 1000;
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)
    .map(c => c.id);

  logger.warn('Income drought detected', {
    userId,
    severity,
    percentageDown,
    expectedShortfall,
  });

  return {
    id: `drought-${Date.now()}`,
    userId,
    severity,
    triggeredAt: new Date(),
    situation: {
      currentMonthIncome,
      last3MonthsAverage,
      percentageDown,
      expectedShortfall,
    },
    recommendations,
    actionPlan: {
      useBuffer: Math.min(expectedShortfall, last3MonthsAverage * 0.5),
      reduceExpenses: expectedShortfall * 0.3,
      urgentOutreach,
    },
  };
}

// ==============================================================================
// PAYMENT PROBABILITY PREDICTION
// ==============================================================================

/**
 * Predict payment probability based on client history
 */
export function predictPaymentProbability(params: {
  clientId: string;
  clientName: string;
  invoiceId: string;
  invoiceAmount: number;
  dueDate: Date;
  clientHistory: {
    invoices: Array<{
      amount: number;
      dueDate: Date;
      paidDate?: Date;
      status: 'paid' | 'pending' | 'overdue';
    }>;
  };
}): PaymentProbability {
  const { clientId, clientName, invoiceId, invoiceAmount, dueDate, clientHistory } = params;

  const paidInvoices = clientHistory.invoices.filter(inv => inv.paidDate);

  if (paidInvoices.length === 0) {
    // New client - assume 70% probability
    return {
      clientId,
      clientName,
      invoiceId,
      invoiceAmount,
      dueDate,
      probabilityScore: 70,
      expectedPaymentDate: new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
      riskFactors: ['New client - no payment history'],
      confidence: 'low',
      historicalData: {
        averagePaymentTime: 0,
        onTimeRate: 0,
        totalInvoices: 0,
        lateCount: 0,
      },
    };
  }

  // Calculate historical payment behavior
  const paymentTimes = paidInvoices.map(inv => {
    const due = inv.dueDate.getTime();
    const paid = inv.paidDate!.getTime();
    return (paid - due) / (1000 * 60 * 60 * 24); // Days
  });

  const averagePaymentTime = paymentTimes.reduce((sum, days) => sum + days, 0) / paymentTimes.length;
  const onTimeCount = paymentTimes.filter(days => days <= 0).length;
  const onTimeRate = (onTimeCount / paidInvoices.length) * 100;
  const lateCount = paymentTimes.filter(days => days > 0).length;

  // Calculate probability score
  let probabilityScore = 100;
  const riskFactors: string[] = [];

  // Factor 1: On-time payment rate
  if (onTimeRate >= 80) {
    probabilityScore = 95;
  } else if (onTimeRate >= 60) {
    probabilityScore = 80;
    riskFactors.push(`${(100 - onTimeRate).toFixed(0)}% of invoices paid late`);
  } else if (onTimeRate >= 40) {
    probabilityScore = 60;
    riskFactors.push(`Only ${onTimeRate.toFixed(0)}% of invoices paid on time`);
  } else {
    probabilityScore = 40;
    riskFactors.push(`Poor payment history: ${onTimeRate.toFixed(0)}% on-time rate`);
  }

  // Factor 2: Average lateness
  if (averagePaymentTime > 30) {
    probabilityScore -= 15;
    riskFactors.push(`Average ${averagePaymentTime.toFixed(0)} days late`);
  } else if (averagePaymentTime > 15) {
    probabilityScore -= 10;
    riskFactors.push(`Typically ${averagePaymentTime.toFixed(0)} days late`);
  }

  // Factor 3: Recent trend (last 3 invoices worse than average)
  const last3 = paidInvoices.slice(-3);
  if (last3.length >= 3) {
    const last3Times = last3.map(inv => {
      const due = inv.dueDate.getTime();
      const paid = inv.paidDate!.getTime();
      return (paid - due) / (1000 * 60 * 60 * 24);
    });
    const last3Avg = last3Times.reduce((sum, days) => sum + days, 0) / last3Times.length;

    if (last3Avg > averagePaymentTime + 10) {
      probabilityScore -= 10;
      riskFactors.push('Recent payments slower than historical average');
    }
  }

  // Factor 4: Current outstanding invoices
  const currentOverdue = clientHistory.invoices.filter(
    inv => inv.status === 'overdue' || inv.status === 'pending'
  ).length;

  if (currentOverdue > 2) {
    probabilityScore -= 15;
    riskFactors.push(`${currentOverdue} unpaid invoices outstanding`);
  }

  probabilityScore = Math.max(20, Math.min(100, probabilityScore));

  // Expected payment date
  const expectedDaysLate = Math.max(0, averagePaymentTime);
  const expectedPaymentDate = new Date(dueDate.getTime() + expectedDaysLate * 24 * 60 * 60 * 1000);

  const confidence: 'high' | 'medium' | 'low' =
    paidInvoices.length >= 10 ? 'high' :
    paidInvoices.length >= 5 ? 'medium' : 'low';

  return {
    clientId,
    clientName,
    invoiceId,
    invoiceAmount,
    dueDate,
    probabilityScore,
    expectedPaymentDate,
    riskFactors,
    confidence,
    historicalData: {
      averagePaymentTime,
      onTimeRate,
      totalInvoices: clientHistory.invoices.length,
      lateCount,
    },
  };
}

/**
 * Get overall cash flow health score
 */
export function calculateCashFlowHealthScore(params: {
  currentBufferBalance: number;
  emergencyFundBalance: number;
  monthlyExpenses: number;
  forecast: CashFlowForecast;
}): {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  breakdown: {
    bufferScore: number;
    emergencyFundScore: number;
    forecastScore: number;
  };
  insights: string[];
} {
  const { currentBufferBalance, emergencyFundBalance, monthlyExpenses, forecast } = params;

  // Buffer score (30% weight) - 3 months = 100
  const bufferMonths = currentBufferBalance / monthlyExpenses;
  const bufferScore = Math.min((bufferMonths / 3) * 100, 100);

  // Emergency fund score (40% weight) - 12 months = 100
  const efMonths = emergencyFundBalance / monthlyExpenses;
  const emergencyFundScore = Math.min((efMonths / 12) * 100, 100);

  // Forecast score (30% weight)
  const negativeMonths = forecast.forecast.filter(m => m.cashFlow.netCashFlow < 0).length;
  const forecastScore = Math.max(0, 100 - (negativeMonths / forecast.forecastMonths) * 100);

  // Overall score
  const score = Math.round(
    bufferScore * 0.3 +
    emergencyFundScore * 0.4 +
    forecastScore * 0.3
  );

  const status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' =
    score >= 80 ? 'excellent' :
    score >= 60 ? 'good' :
    score >= 40 ? 'fair' :
    score >= 20 ? 'poor' : 'critical';

  // Generate insights
  const insights: string[] = [];

  if (bufferScore < 50) {
    insights.push(`Build income buffer to at least 3 months expenses (currently ${bufferMonths.toFixed(1)} months)`);
  }

  if (emergencyFundScore < 50) {
    insights.push(`Emergency fund below target. Goal: ${monthlyExpenses * 12} (currently ${emergencyFundBalance})`);
  }

  if (forecastScore < 60) {
    insights.push(`Cash flow forecast shows ${negativeMonths} months with negative cash flow`);
  }

  if (score >= 80) {
    insights.push('Excellent financial cushion. Well-protected against income variability.');
  }

  return {
    score,
    status,
    breakdown: {
      bufferScore,
      emergencyFundScore,
      forecastScore,
    },
    insights,
  };
}

/**
 * Advanced Financial Reports Service
 * Comprehensive financial analysis and reporting for freelancers
 */

import { logger } from '@/utils/logger';
import { Expense, ExpenseCategory } from '@/types/expense';
import { TimeEntry } from '@/types/time-tracking';

export interface ProfitAndLossReport {
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  income: {
    totalInvoiced: number;
    totalReceived: number;
    outstanding: number;
    byClient: Array<{
      clientId: string;
      clientName: string;
      invoiced: number;
      received: number;
    }>;
    byMonth: Array<{
      month: string;
      invoiced: number;
      received: number;
    }>;
  };
  expenses: {
    total: number;
    taxDeductible: number;
    byCategory: Record<ExpenseCategory, number>;
    byMonth: Array<{
      month: string;
      total: number;
    }>;
  };
  profitLoss: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number; // Percentage
    byMonth: Array<{
      month: string;
      profit: number;
      margin: number;
    }>;
  };
  trends: {
    incomeGrowth: number; // Percentage vs previous period
    expenseGrowth: number;
    profitGrowth: number;
  };
}

export interface CashFlowReport {
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  opening: {
    balance: number;
  };
  inflows: {
    invoicePayments: number;
    otherIncome: number;
    total: number;
    byWeek: Array<{
      week: string;
      amount: number;
    }>;
  };
  outflows: {
    expenses: number;
    taxes: number;
    otherExpenses: number;
    total: number;
    byWeek: Array<{
      week: string;
      amount: number;
    }>;
  };
  closing: {
    balance: number;
  };
  forecast: {
    nextMonth: number;
    next3Months: number;
    next6Months: number;
  };
  warnings: string[];
}

export interface ClientAnalysis {
  clientId: string;
  clientName: string;
  stats: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    invoiceCount: number;
    averageInvoiceValue: number;
    averagePaymentTime: number; // Days
    lifetimeValue: number;
  };
  paymentBehavior: {
    onTimeRate: number; // Percentage
    averageDaysLate: number;
    riskScore: number; // 0-100 (higher = more risky)
    riskLevel: 'low' | 'medium' | 'high';
  };
  profitability: {
    revenue: number;
    estimatedCost: number; // Based on time tracked
    profit: number;
    profitMargin: number;
  };
  engagement: {
    firstInvoiceDate: Date;
    lastInvoiceDate: Date;
    monthsActive: number;
    status: 'active' | 'inactive' | 'at_risk';
  };
}

export interface BusinessHealthScore {
  overallScore: number; // 0-100
  breakdown: {
    cashFlow: { score: number; status: 'excellent' | 'good' | 'fair' | 'poor' };
    profitability: { score: number; status: 'excellent' | 'good' | 'fair' | 'poor' };
    clientDiversity: { score: number; status: 'excellent' | 'good' | 'fair' | 'poor' };
    paymentCollection: { score: number; status: 'excellent' | 'good' | 'fair' | 'poor' };
    expenseControl: { score: number; status: 'excellent' | 'good' | 'fair' | 'poor' };
  };
  insights: string[];
  warnings: string[];
  recommendations: string[];
}

export interface RevenueBreakdown {
  totalRevenue: number;
  byClient: Array<{
    clientName: string;
    revenue: number;
    percentage: number;
    isTopClient: boolean;
  }>;
  byService: Array<{
    serviceName: string;
    revenue: number;
    percentage: number;
  }>;
  concentration: {
    top1Client: number; // Percentage
    top3Clients: number;
    top5Clients: number;
    diversificationScore: number; // 0-100 (higher = more diversified)
  };
}

// ==============================================================================
// PROFIT & LOSS
// ==============================================================================

/**
 * Generate Profit & Loss report
 */
export function generateProfitLossReport(params: {
  startDate: Date;
  endDate: Date;
  invoices: Array<{
    amount: number;
    amountPaid: number;
    status: 'paid' | 'pending' | 'overdue';
    clientId: string;
    clientName: string;
    date: Date;
  }>;
  expenses: Expense[];
}): ProfitAndLossReport {
  const { startDate, endDate, invoices, expenses } = params;

  // Filter data for period
  const periodInvoices = invoices.filter(
    (inv) => inv.date >= startDate && inv.date <= endDate
  );
  const periodExpenses = expenses.filter(
    (exp) => exp.date >= startDate && exp.date <= endDate
  );

  // Calculate income
  const totalInvoiced = periodInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReceived = periodInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const outstanding = totalInvoiced - totalReceived;

  // Income by client
  const byClient = Object.values(
    periodInvoices.reduce(
      (acc, inv) => {
        if (!acc[inv.clientId]) {
          acc[inv.clientId] = {
            clientId: inv.clientId,
            clientName: inv.clientName,
            invoiced: 0,
            received: 0,
          };
        }
        acc[inv.clientId].invoiced += inv.amount;
        acc[inv.clientId].received += inv.amountPaid;
        return acc;
      },
      {} as Record<string, any>
    )
  ).sort((a, b) => b.invoiced - a.invoiced);

  // Income by month
  const byMonth = groupByMonth(periodInvoices, startDate, endDate, (inv) => ({
    invoiced: inv.amount,
    received: inv.amountPaid,
  })) as { month: string; invoiced: number; received: number; }[];

  // Calculate expenses
  const totalExpenses = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const taxDeductible = periodExpenses
    .filter((exp) => exp.taxDeductible)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const byCategory = periodExpenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    },
    {} as Record<ExpenseCategory, number>
  );

  const expensesByMonth = groupByMonth(periodExpenses, startDate, endDate, (exp) => ({
    total: exp.amount,
  })) as { month: string; total: number; }[];

  // Calculate profit
  const grossProfit = totalReceived - totalExpenses;
  const netProfit = totalReceived - taxDeductible;
  const profitMargin = totalReceived > 0 ? (netProfit / totalReceived) * 100 : 0;

  const profitByMonth = byMonth.map((month, i) => {
    const expMonth = expensesByMonth[i];
    const profit = month.received - (expMonth?.total || 0);
    const margin = month.received > 0 ? (profit / month.received) * 100 : 0;
    return {
      month: month.month,
      profit,
      margin,
    };
  });

  // Calculate trends (compare to previous period)
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodLength);
  const prevEndDate = startDate;

  const prevInvoices = invoices.filter(
    (inv) => inv.date >= prevStartDate && inv.date < prevEndDate
  );
  const prevExpenses = expenses.filter(
    (exp) => exp.date >= prevStartDate && exp.date < prevEndDate
  );

  const prevIncome = prevInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const prevExpenseTotal = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const prevProfit = prevIncome - prevExpenseTotal;

  const incomeGrowth = prevIncome > 0 ? ((totalReceived - prevIncome) / prevIncome) * 100 : 0;
  const expenseGrowth =
    prevExpenseTotal > 0 ? ((totalExpenses - prevExpenseTotal) / prevExpenseTotal) * 100 : 0;
  const profitGrowth = prevProfit > 0 ? ((grossProfit - prevProfit) / prevProfit) * 100 : 0;

  return {
    period: {
      startDate,
      endDate,
      label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    },
    income: {
      totalInvoiced,
      totalReceived,
      outstanding,
      byClient,
      byMonth,
    },
    expenses: {
      total: totalExpenses,
      taxDeductible,
      byCategory,
      byMonth: expensesByMonth,
    },
    profitLoss: {
      grossProfit,
      netProfit,
      profitMargin,
      byMonth: profitByMonth,
    },
    trends: {
      incomeGrowth,
      expenseGrowth,
      profitGrowth,
    },
  };
}

// ==============================================================================
// CASH FLOW
// ==============================================================================

/**
 * Generate Cash Flow report with forecast
 */
export function generateCashFlowReport(params: {
  startDate: Date;
  endDate: Date;
  openingBalance: number;
  invoices: Array<{
    amount: number;
    amountPaid: number;
    status: 'paid' | 'pending' | 'overdue';
    paidDate?: Date;
    dueDate: Date;
  }>;
  expenses: Expense[];
  estimatedTaxes: number;
}): CashFlowReport {
  const { startDate, endDate, openingBalance, invoices, expenses, estimatedTaxes } = params;

  // Calculate inflows
  const paidInvoices = invoices.filter(
    (inv) => inv.paidDate && inv.paidDate >= startDate && inv.paidDate <= endDate
  );
  const invoicePayments = paidInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

  const inflowsByWeek = groupByWeek(paidInvoices, startDate, endDate, (inv) => inv.amountPaid);

  // Calculate outflows
  const periodExpenses = expenses.filter(
    (exp) => exp.date >= startDate && exp.date <= endDate
  );
  const expenseTotal = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const outflowsByWeek = groupByWeek(periodExpenses, startDate, endDate, (exp) => exp.amount);

  // Closing balance
  const closingBalance = openingBalance + invoicePayments - expenseTotal - estimatedTaxes;

  // Forecast future cash flow
  const avgMonthlyIncome = invoicePayments / getMonthsBetween(startDate, endDate);
  const avgMonthlyExpenses = (expenseTotal + estimatedTaxes) / getMonthsBetween(startDate, endDate);
  const avgMonthlyProfit = avgMonthlyIncome - avgMonthlyExpenses;

  const forecast = {
    nextMonth: closingBalance + avgMonthlyProfit,
    next3Months: closingBalance + avgMonthlyProfit * 3,
    next6Months: closingBalance + avgMonthlyProfit * 6,
  };

  // Generate warnings
  const warnings: string[] = [];
  if (closingBalance < 0) {
    warnings.push('Negative cash balance - immediate action required');
  }
  if (closingBalance < avgMonthlyExpenses) {
    warnings.push('Cash reserves below one month of expenses');
  }
  if (forecast.next3Months < 0) {
    warnings.push('Projected negative cash flow in next 3 months');
  }

  return {
    period: {
      startDate,
      endDate,
      label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    },
    opening: {
      balance: openingBalance,
    },
    inflows: {
      invoicePayments,
      otherIncome: 0,
      total: invoicePayments,
      byWeek: inflowsByWeek,
    },
    outflows: {
      expenses: expenseTotal,
      taxes: estimatedTaxes,
      otherExpenses: 0,
      total: expenseTotal + estimatedTaxes,
      byWeek: outflowsByWeek,
    },
    closing: {
      balance: closingBalance,
    },
    forecast,
    warnings,
  };
}

// ==============================================================================
// CLIENT ANALYSIS
// ==============================================================================

/**
 * Analyze individual client profitability and behavior
 */
export function analyzeClient(params: {
  clientId: string;
  clientName: string;
  invoices: Array<{
    amount: number;
    amountPaid: number;
    status: 'paid' | 'pending' | 'overdue';
    issueDate: Date;
    dueDate: Date;
    paidDate?: Date;
  }>;
  timeEntries?: TimeEntry[];
  hourlyRate?: number;
}): ClientAnalysis {
  const { clientId, clientName, invoices, timeEntries = [], hourlyRate = 0 } = params;

  // Basic stats
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalOutstanding = totalInvoiced - totalPaid;
  const invoiceCount = invoices.length;
  const averageInvoiceValue = invoiceCount > 0 ? totalInvoiced / invoiceCount : 0;

  // Payment behavior
  const paidInvoices = invoices.filter((inv) => inv.paidDate);
  const paymentTimes = paidInvoices.map((inv) => {
    const due = inv.dueDate.getTime();
    const paid = inv.paidDate!.getTime();
    return (paid - due) / (1000 * 60 * 60 * 24); // Days
  });

  const averagePaymentTime =
    paymentTimes.length > 0
      ? paymentTimes.reduce((sum, days) => sum + days, 0) / paymentTimes.length
      : 0;

  const onTimePayments = paymentTimes.filter((days) => days <= 0).length;
  const onTimeRate = paidInvoices.length > 0 ? (onTimePayments / paidInvoices.length) * 100 : 100;

  const latePayments = paymentTimes.filter((days) => days > 0);
  const averageDaysLate =
    latePayments.length > 0 ? latePayments.reduce((sum, days) => sum + days, 0) / latePayments.length : 0;

  // Risk scoring
  let riskScore = 0;
  if (onTimeRate < 50) riskScore += 40;
  else if (onTimeRate < 75) riskScore += 20;
  if (averageDaysLate > 30) riskScore += 30;
  else if (averageDaysLate > 15) riskScore += 15;
  if (totalOutstanding > totalPaid * 0.5) riskScore += 30;

  const riskLevel: 'low' | 'medium' | 'high' =
    riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high';

  // Profitability (if time tracking available)
  const hoursTracked = timeEntries.reduce((sum, entry) => sum + entry.duration / 60, 0);
  const estimatedCost = hoursTracked * hourlyRate;
  const profit = totalPaid - estimatedCost;
  const profitMargin = totalPaid > 0 ? (profit / totalPaid) * 100 : 0;

  // Engagement
  const invoiceDates = invoices.map((inv) => inv.issueDate).sort((a, b) => a.getTime() - b.getTime());
  const firstInvoiceDate = invoiceDates[0];
  const lastInvoiceDate = invoiceDates[invoiceDates.length - 1];
  const monthsActive = getMonthsBetween(firstInvoiceDate, lastInvoiceDate) || 1;

  const daysSinceLastInvoice = (Date.now() - lastInvoiceDate.getTime()) / (1000 * 60 * 60 * 24);
  const status: 'active' | 'inactive' | 'at_risk' =
    daysSinceLastInvoice < 60 ? 'active' : daysSinceLastInvoice < 120 ? 'at_risk' : 'inactive';

  return {
    clientId,
    clientName,
    stats: {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      invoiceCount,
      averageInvoiceValue,
      averagePaymentTime,
      lifetimeValue: totalPaid,
    },
    paymentBehavior: {
      onTimeRate,
      averageDaysLate,
      riskScore,
      riskLevel,
    },
    profitability: {
      revenue: totalPaid,
      estimatedCost,
      profit,
      profitMargin,
    },
    engagement: {
      firstInvoiceDate,
      lastInvoiceDate,
      monthsActive,
      status,
    },
  };
}

// ==============================================================================
// BUSINESS HEALTH SCORE
// ==============================================================================

/**
 * Calculate overall business health score
 */
export function calculateBusinessHealth(params: {
  cashFlowReport: CashFlowReport;
  profitLossReport: ProfitAndLossReport;
  clients: ClientAnalysis[];
  outstandingInvoices: number;
  totalRevenue: number;
}): BusinessHealthScore {
  const { cashFlowReport, profitLossReport, clients, outstandingInvoices, totalRevenue } = params;

  // Cash Flow Score
  const monthsOfReserves = cashFlowReport.closing.balance / (cashFlowReport.outflows.total / 3);
  const cashFlowScore =
    monthsOfReserves >= 6 ? 100 : monthsOfReserves >= 3 ? 80 : monthsOfReserves >= 1 ? 60 : 30;
  const cashFlowStatus =
    cashFlowScore >= 80 ? 'excellent' : cashFlowScore >= 60 ? 'good' : cashFlowScore >= 40 ? 'fair' : 'poor';

  // Profitability Score
  const profitMargin = profitLossReport.profitLoss.profitMargin;
  const profitabilityScore =
    profitMargin >= 40 ? 100 : profitMargin >= 25 ? 80 : profitMargin >= 15 ? 60 : 30;
  const profitabilityStatus =
    profitabilityScore >= 80 ? 'excellent' : profitabilityScore >= 60 ? 'good' : profitabilityScore >= 40 ? 'fair' : 'poor';

  // Client Diversity Score
  const topClient = clients.length > 0 ? clients[0].stats.totalPaid / totalRevenue : 0;
  const diversityScore = topClient < 0.25 ? 100 : topClient < 0.5 ? 70 : topClient < 0.75 ? 40 : 20;
  const diversityStatus =
    diversityScore >= 80 ? 'excellent' : diversityScore >= 60 ? 'good' : diversityScore >= 40 ? 'fair' : 'poor';

  // Payment Collection Score
  const collectionRate = totalRevenue > 0 ? 1 - outstandingInvoices / totalRevenue : 1;
  const collectionScore = collectionRate >= 0.9 ? 100 : collectionRate >= 0.75 ? 70 : collectionRate >= 0.5 ? 40 : 20;
  const collectionStatus =
    collectionScore >= 80 ? 'excellent' : collectionScore >= 60 ? 'good' : collectionScore >= 40 ? 'fair' : 'poor';

  // Expense Control Score
  const expenseRatio = profitLossReport.expenses.total / profitLossReport.income.totalReceived;
  const expenseScore = expenseRatio < 0.4 ? 100 : expenseRatio < 0.6 ? 70 : expenseRatio < 0.8 ? 40 : 20;
  const expenseStatus =
    expenseScore >= 80 ? 'excellent' : expenseScore >= 60 ? 'good' : expenseScore >= 40 ? 'fair' : 'poor';

  // Overall score (weighted average)
  const overallScore = Math.round(
    cashFlowScore * 0.25 +
      profitabilityScore * 0.3 +
      diversityScore * 0.15 +
      collectionScore * 0.2 +
      expenseScore * 0.1
  );

  // Generate insights
  const insights: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (cashFlowStatus === 'excellent') {
    insights.push('Strong cash reserves provide excellent financial stability');
  } else if (cashFlowStatus === 'poor') {
    warnings.push('Low cash reserves pose a risk to business continuity');
    recommendations.push('Build emergency fund to cover 3-6 months of expenses');
  }

  if (profitabilityStatus === 'excellent') {
    insights.push(`Healthy ${profitMargin.toFixed(0)}% profit margin`);
  } else {
    recommendations.push('Review pricing and reduce costs to improve profit margins');
  }

  if (diversityStatus === 'poor') {
    warnings.push('High revenue concentration in single client creates risk');
    recommendations.push('Diversify client base to reduce dependency');
  }

  return {
    overallScore,
    breakdown: {
      cashFlow: { score: cashFlowScore, status: cashFlowStatus },
      profitability: { score: profitabilityScore, status: profitabilityStatus },
      clientDiversity: { score: diversityScore, status: diversityStatus },
      paymentCollection: { score: collectionScore, status: collectionStatus },
      expenseControl: { score: expenseScore, status: expenseStatus },
    },
    insights,
    warnings,
    recommendations,
  };
}

// ==============================================================================
// UTILITIES
// ==============================================================================

function groupByMonth<T>(
  items: T[],
  startDate: Date,
  endDate: Date,
  aggregator: (item: T) => Record<string, number>
): Array<Record<string, any>> {
  const months: Record<string, Record<string, string | number>> = {};

  items.forEach((item: any) => {
    const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
    if (!months[monthKey]) {
      months[monthKey] = { month: monthKey };
    }
    const values = aggregator(item);
    for (const [key, value] of Object.entries(values)) {
      if (key !== 'month') {
        months[monthKey][key] = ((months[monthKey][key] as number) || 0) + value;
      }
    }
  });

  return Object.values(months).sort((a, b) => (a.month as string).localeCompare(b.month as string));
}

function groupByWeek<T>(
  items: T[],
  startDate: Date,
  endDate: Date,
  aggregator: (item: T) => number
): Array<{ week: string; amount: number }> {
  const weeks: Record<string, number> = {};

  items.forEach((item: any) => {
    const weekKey = getWeekKey(item.paidDate || item.date);
    weeks[weekKey] = (weeks[weekKey] || 0) + aggregator(item);
  });

  return Object.entries(weeks)
    .map(([week, amount]) => ({ week, amount }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getMonthsBetween(startDate: Date, endDate: Date): number {
  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  return Math.max(months, 1);
}

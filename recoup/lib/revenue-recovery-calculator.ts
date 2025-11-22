/**
 * Revenue Recovery Calculator
 * Calculates "Total Recouped" metrics for dashboard
 * This is THE MOAT - showing freelancers exactly how much money they're recovering
 */

import { db, COLLECTIONS } from '@/lib/firebase';
import type { Expense, RevenueRecoveryMetrics } from '@/types/models';

/**
 * Calculate all revenue recovery metrics for a user
 * @param userId - User ID
 * @param taxBracket - User's tax bracket (default 0.20 = 20% basic rate)
 * @returns Complete revenue recovery metrics
 */
export async function calculateRevenueRecovery(
  userId: string,
  taxBracket: number = 0.20
): Promise<RevenueRecoveryMetrics> {
  // Fetch all active expenses for user
  const expensesSnapshot = await db
    .collection(COLLECTIONS.EXPENSES)
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const expenses = expensesSnapshot.docs.map((doc) => ({
    expenseId: doc.id,
    ...doc.data(),
  })) as Expense[];

  // Initialize metrics
  const metrics: RevenueRecoveryMetrics = {
    totalBillableExpenses: 0,
    unbilledExpenses: 0,
    invoicedExpenses: 0,
    paidExpenses: 0,
    totalTaxDeductible: 0,
    estimatedTaxSavings: 0,
    totalRecouped: 0,
    potentialRecovery: 0,
    byCategory: {},
    byClient: [],
    thisMonth: 0,
    lastMonth: 0,
    thisYear: 0,
  };

  // Date calculations
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  // Client tracking map
  const clientMap = new Map<
    string,
    {
      clientId: string;
      clientName: string;
      unbilled: number;
      invoiced: number;
      paid: number;
    }
  >();

  // Process each expense
  for (const expense of expenses) {
    const amount = expense.amount / 100; // Convert pence to pounds
    const expenseDate =
      typeof expense.date === 'object' && 'toDate' in expense.date
        ? expense.date.toDate()
        : new Date(expense.date);

    // Initialize category if not exists
    if (!metrics.byCategory[expense.category]) {
      metrics.byCategory[expense.category] = {
        total: 0,
        billable: 0,
        taxDeductible: 0,
      };
    }

    metrics.byCategory[expense.category].total += amount;

    // Process billable expenses
    if (expense.billable) {
      metrics.totalBillableExpenses += amount;
      metrics.byCategory[expense.category].billable += amount;

      switch (expense.billingStatus) {
        case 'unbilled':
          metrics.unbilledExpenses += amount;
          metrics.potentialRecovery += amount;
          break;
        case 'invoiced':
          metrics.invoicedExpenses += amount;
          metrics.potentialRecovery += amount;
          break;
        case 'paid':
          metrics.paidExpenses += amount;
          metrics.totalRecouped += amount;
          break;
      }

      // Track by client
      if (expense.clientId) {
        if (!clientMap.has(expense.clientId)) {
          clientMap.set(expense.clientId, {
            clientId: expense.clientId,
            clientName: expense.clientName || 'Unknown Client',
            unbilled: 0,
            invoiced: 0,
            paid: 0,
          });
        }

        const clientData = clientMap.get(expense.clientId)!;
        switch (expense.billingStatus) {
          case 'unbilled':
            clientData.unbilled += amount;
            break;
          case 'invoiced':
            clientData.invoiced += amount;
            break;
          case 'paid':
            clientData.paid += amount;
            break;
        }
      }
    }

    // Process tax deductible expenses
    if (expense.taxDeductible) {
      metrics.totalTaxDeductible += amount;
      metrics.byCategory[expense.category].taxDeductible += amount;
    }

    // Time-based metrics (only for realized gains)
    if (expense.billingStatus === 'paid' || expense.taxDeductible) {
      const value =
        expense.billingStatus === 'paid' ? amount : amount * taxBracket;

      if (expenseDate >= thisMonthStart) {
        metrics.thisMonth += value;
      }
      if (expenseDate >= lastMonthStart && expenseDate < thisMonthStart) {
        metrics.lastMonth += value;
      }
      if (expenseDate >= thisYearStart) {
        metrics.thisYear += value;
      }
    }
  }

  // Calculate estimated tax savings
  metrics.estimatedTaxSavings = metrics.totalTaxDeductible * taxBracket;
  metrics.totalRecouped += metrics.estimatedTaxSavings;

  // Convert client map to array and sort by potential (unbilled + invoiced)
  metrics.byClient = Array.from(clientMap.values())
    .filter((c) => c.unbilled > 0 || c.invoiced > 0 || c.paid > 0)
    .sort((a, b) => b.unbilled + b.invoiced - (a.unbilled + a.invoiced));

  return metrics;
}

/**
 * Get quick summary stats (faster than full calculation)
 */
export async function getQuickRecoverySummary(userId: string): Promise<{
  totalRecouped: number;
  potentialRecovery: number;
  unbilledCount: number;
}> {
  const expensesSnapshot = await db
    .collection(COLLECTIONS.EXPENSES)
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .where('billable', '==', true)
    .get();

  let totalRecouped = 0;
  let potentialRecovery = 0;
  let unbilledCount = 0;

  expensesSnapshot.docs.forEach((doc) => {
    const expense = doc.data() as Expense;
    const amount = expense.amount / 100;

    switch (expense.billingStatus) {
      case 'unbilled':
        potentialRecovery += amount;
        unbilledCount++;
        break;
      case 'invoiced':
        potentialRecovery += amount;
        break;
      case 'paid':
        totalRecouped += amount;
        break;
    }
  });

  return {
    totalRecouped,
    potentialRecovery,
    unbilledCount,
  };
}

/**
 * Get expenses ready to be converted to invoices
 * @param userId - User ID
 * @param clientId - Optional: filter by client
 * @returns List of unbilled expenses
 */
export async function getUnbilledExpenses(
  userId: string,
  clientId?: string
): Promise<Expense[]> {
  let query = db
    .collection(COLLECTIONS.EXPENSES)
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .where('billable', '==', true)
    .where('billingStatus', '==', 'unbilled');

  if (clientId) {
    query = query.where('clientId', '==', clientId);
  }

  const snapshot = await query.orderBy('date', 'desc').get();

  return snapshot.docs.map((doc) => ({
    expenseId: doc.id,
    ...doc.data(),
  })) as Expense[];
}

/**
 * Get total unbilled amount for a specific client
 */
export async function getClientUnbilledTotal(
  userId: string,
  clientId: string
): Promise<number> {
  const expenses = await getUnbilledExpenses(userId, clientId);
  return expenses.reduce((sum, exp) => sum + exp.amount / 100, 0);
}

/**
 * Calculate growth metrics (month-over-month)
 */
export async function calculateGrowthMetrics(userId: string): Promise<{
  momGrowth: number; // Month-over-month growth %
  avgMonthlyRecovery: number; // Average monthly recovery
  projectedYearly: number; // Projected annual recovery
}> {
  const metrics = await calculateRevenueRecovery(userId);

  // Calculate MoM growth
  const momGrowth =
    metrics.lastMonth > 0
      ? ((metrics.thisMonth - metrics.lastMonth) / metrics.lastMonth) * 100
      : 0;

  // Average monthly (based on current year progress)
  const monthsElapsed = new Date().getMonth() + 1;
  const avgMonthlyRecovery = metrics.thisYear / monthsElapsed;

  // Project for full year
  const projectedYearly = avgMonthlyRecovery * 12;

  return {
    momGrowth,
    avgMonthlyRecovery,
    projectedYearly,
  };
}

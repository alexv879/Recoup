/**
 * AI Cost Tracking Utility
 * Tracks and monitors AI API costs per user
 *
 * Features:
 * - Track costs per user per month
 * - Alert when costs exceed thresholds
 * - Generate cost reports
 * - Predict future costs
 */

import { AITask, getModelForTask } from '@/lib/ai/model-router';
import { UserTier } from '@/types/user';
import { logInfo, logError } from '@/utils/logger';

/**
 * AI usage record
 */
export interface AIUsageRecord {
  userId: string;
  task: AITask;
  provider: string;
  model: string;
  cost: number;
  timestamp: Date;
  metadata?: any;
}

/**
 * Monthly cost summary
 */
export interface MonthlyCostSummary {
  userId: string;
  month: string; // YYYY-MM
  totalCost: number;
  callCount: number;
  byTask: Record<AITask, { count: number; cost: number }>;
  byProvider: Record<string, { count: number; cost: number }>;
}

// In-memory storage (in production, use database)
const usageRecords: AIUsageRecord[] = [];
const monthlySummaries = new Map<string, MonthlyCostSummary>();

/**
 * Track AI usage
 */
export async function trackAIUsage(
  userId: string,
  task: AITask,
  userTier: UserTier,
  metadata?: any
): Promise<void> {
  try {
    const config = getModelForTask(task, userTier);

    const record: AIUsageRecord = {
      userId,
      task,
      provider: config.provider,
      model: config.model,
      cost: config.costPerCall,
      timestamp: new Date(),
      metadata
    };

    // Store record
    usageRecords.push(record);

    // Update monthly summary
    updateMonthlySummary(record);

    // Check thresholds
    await checkCostThresholds(userId);

    logInfo('AI usage tracked', {
      userId,
      task,
      provider: config.provider,
      cost: config.costPerCall
    });
  } catch (error) {
    logError('Failed to track AI usage', error as Error);
  }
}

/**
 * Update monthly summary
 */
function updateMonthlySummary(record: AIUsageRecord): void {
  const month = record.timestamp.toISOString().substring(0, 7); // YYYY-MM
  const key = `${record.userId}-${month}`;

  let summary = monthlySummaries.get(key);

  if (!summary) {
    summary = {
      userId: record.userId,
      month,
      totalCost: 0,
      callCount: 0,
      byTask: {} as any,
      byProvider: {} as any
    };
    monthlySummaries.set(key, summary);
  }

  // Update totals
  summary.totalCost += record.cost;
  summary.callCount += 1;

  // Update by task
  if (!summary.byTask[record.task]) {
    summary.byTask[record.task] = { count: 0, cost: 0 };
  }
  summary.byTask[record.task].count += 1;
  summary.byTask[record.task].cost += record.cost;

  // Update by provider
  if (!summary.byProvider[record.provider]) {
    summary.byProvider[record.provider] = { count: 0, cost: 0 };
  }
  summary.byProvider[record.provider].count += 1;
  summary.byProvider[record.provider].cost += record.cost;
}

/**
 * Get monthly cost for user
 */
export function getMonthlyCost(userId: string, month?: string): MonthlyCostSummary | null {
  const targetMonth = month || new Date().toISOString().substring(0, 7);
  const key = `${userId}-${targetMonth}`;

  return monthlySummaries.get(key) || null;
}

/**
 * Get all-time cost for user
 */
export function getTotalCost(userId: string): number {
  return usageRecords
    .filter((record) => record.userId === userId)
    .reduce((sum, record) => sum + record.cost, 0);
}

/**
 * Get usage by task
 */
export function getUsageByTask(userId: string, month?: string): Record<AITask, number> {
  const targetMonth = month || new Date().toISOString().substring(0, 7);

  const records = usageRecords.filter(
    (record) =>
      record.userId === userId &&
      record.timestamp.toISOString().substring(0, 7) === targetMonth
  );

  const usage: Record<string, number> = {};

  records.forEach((record) => {
    usage[record.task] = (usage[record.task] || 0) + 1;
  });

  return usage as Record<AITask, number>;
}

/**
 * Check if user exceeds cost thresholds
 */
async function checkCostThresholds(userId: string): Promise<void> {
  const monthlyCost = getMonthlyCost(userId);

  if (!monthlyCost) return;

  const USER_THRESHOLD = parseFloat(process.env.USER_AI_COST_ALERT_THRESHOLD || '10');

  if (monthlyCost.totalCost > USER_THRESHOLD) {
    logInfo('User AI cost threshold exceeded', {
      userId,
      cost: monthlyCost.totalCost,
      threshold: USER_THRESHOLD
    });

    // TODO: Send alert to user
    // TODO: Send alert to admin
  }
}

/**
 * Get cost estimate for next month based on usage trends
 */
export function predictNextMonthCost(userId: string): number {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentSummary = getMonthlyCost(userId, currentMonth);

  if (!currentSummary) return 0;

  // Simple prediction: current month's cost * (30 / current day of month)
  const currentDay = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const projectedCost = (currentSummary.totalCost / currentDay) * daysInMonth;

  return Number(projectedCost.toFixed(2));
}

/**
 * Get top users by AI cost
 */
export function getTopUsersByCost(limit: number = 10): Array<{
  userId: string;
  totalCost: number;
  callCount: number;
}> {
  const userCosts = new Map<string, { totalCost: number; callCount: number }>();

  usageRecords.forEach((record) => {
    const existing = userCosts.get(record.userId) || { totalCost: 0, callCount: 0 };
    existing.totalCost += record.cost;
    existing.callCount += 1;
    userCosts.set(record.userId, existing);
  });

  return Array.from(userCosts.entries())
    .map(([userId, stats]) => ({ userId, ...stats }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit);
}

/**
 * Get total platform cost
 */
export function getTotalPlatformCost(month?: string): number {
  const targetMonth = month || new Date().toISOString().substring(0, 7);

  return usageRecords
    .filter((record) => record.timestamp.toISOString().substring(0, 7) === targetMonth)
    .reduce((sum, record) => sum + record.cost, 0);
}

/**
 * Generate cost report for user
 */
export function generateCostReport(
  userId: string,
  startDate: Date,
  endDate: Date
): {
  totalCost: number;
  callCount: number;
  byTask: Record<AITask, { count: number; cost: number }>;
  byProvider: Record<string, { count: number; cost: number }>;
  dailyCosts: Array<{ date: string; cost: number }>;
} {
  const records = usageRecords.filter(
    (record) =>
      record.userId === userId &&
      record.timestamp >= startDate &&
      record.timestamp <= endDate
  );

  const totalCost = records.reduce((sum, record) => sum + record.cost, 0);
  const callCount = records.length;

  const byTask: Record<string, { count: number; cost: number }> = {};
  const byProvider: Record<string, { count: number; cost: number }> = {};
  const dailyCosts: Record<string, number> = {};

  records.forEach((record) => {
    // By task
    if (!byTask[record.task]) {
      byTask[record.task] = { count: 0, cost: 0 };
    }
    byTask[record.task].count += 1;
    byTask[record.task].cost += record.cost;

    // By provider
    if (!byProvider[record.provider]) {
      byProvider[record.provider] = { count: 0, cost: 0 };
    }
    byProvider[record.provider].count += 1;
    byProvider[record.provider].cost += record.cost;

    // By day
    const day = record.timestamp.toISOString().substring(0, 10);
    dailyCosts[day] = (dailyCosts[day] || 0) + record.cost;
  });

  return {
    totalCost: Number(totalCost.toFixed(2)),
    callCount,
    byTask: byTask as any,
    byProvider,
    dailyCosts: Object.entries(dailyCosts)
      .map(([date, cost]) => ({ date, cost: Number(cost.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date))
  };
}

/**
 * Clear old records (data retention)
 */
export function clearOldRecords(daysToKeep: number = 90): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const initialLength = usageRecords.length;

  // Remove old records
  let i = usageRecords.length;
  while (i--) {
    if (usageRecords[i].timestamp < cutoffDate) {
      usageRecords.splice(i, 1);
    }
  }

  const removed = initialLength - usageRecords.length;

  logInfo('Old AI usage records cleared', {
    removed,
    daysToKeep,
    remaining: usageRecords.length
  });

  return removed;
}

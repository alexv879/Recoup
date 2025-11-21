/**
 * AI Cost Tracking Utility
 * Tracks and monitors AI API costs per user
 *
 * ✅ SECURITY FIX: Replaced in-memory storage with Firestore persistence
 * to ensure accurate cost tracking across serverless function restarts.
 *
 * Features:
 * - Track costs per user per month
 * - Alert when costs exceed thresholds
 * - Generate cost reports
 * - Predict future costs
 * - Persist to Firestore for accurate billing
 */

import { AITask, getModelForTask } from '@/lib/ai/model-router';
import { UserTier } from '@/types/user';
import { logInfo, logError } from '@/utils/logger';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

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

/**
 * Track AI usage - persists to Firestore
 */
export async function trackAIUsage(
  userId: string,
  task: AITask,
  userTier: UserTier,
  metadata?: any
): Promise<void> {
  try {
    const config = getModelForTask(task, userTier);
    const timestamp = new Date();

    const record: AIUsageRecord = {
      userId,
      task,
      provider: config.provider,
      model: config.model,
      cost: config.costPerCall,
      timestamp,
      metadata
    };

    // ✅ Store record in Firestore
    await db.collection('ai_usage').add({
      ...record,
      timestamp: Timestamp.fromDate(timestamp),
      createdAt: Timestamp.now(),
    });

    // ✅ Update monthly summary in Firestore
    await updateMonthlySummary(record);

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
 * Update monthly summary in Firestore using atomic transactions
 */
async function updateMonthlySummary(record: AIUsageRecord): Promise<void> {
  const month = record.timestamp.toISOString().substring(0, 7); // YYYY-MM
  const summaryId = `${record.userId}-${month}`;
  const summaryRef = db.collection('ai_monthly_summaries').doc(summaryId);

  await db.runTransaction(async (transaction) => {
    const summaryDoc = await transaction.get(summaryRef);

    let summary: MonthlyCostSummary;

    if (!summaryDoc.exists) {
      // Create new summary
      summary = {
        userId: record.userId,
        month,
        totalCost: record.cost,
        callCount: 1,
        byTask: {
          [record.task]: { count: 1, cost: record.cost }
        } as any,
        byProvider: {
          [record.provider]: { count: 1, cost: record.cost }
        }
      };
    } else {
      // Update existing summary
      summary = summaryDoc.data() as MonthlyCostSummary;

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

    transaction.set(summaryRef, {
      ...summary,
      updatedAt: Timestamp.now(),
    });
  });
}

/**
 * Get monthly cost for user from Firestore
 */
export async function getMonthlyCost(userId: string, month?: string): Promise<MonthlyCostSummary | null> {
  const targetMonth = month || new Date().toISOString().substring(0, 7);
  const summaryId = `${userId}-${targetMonth}`;

  const summaryDoc = await db.collection('ai_monthly_summaries').doc(summaryId).get();

  if (!summaryDoc.exists) {
    return null;
  }

  return summaryDoc.data() as MonthlyCostSummary;
}

/**
 * Get all-time cost for user from Firestore
 */
export async function getTotalCost(userId: string): Promise<number> {
  const snapshot = await db.collection('ai_usage')
    .where('userId', '==', userId)
    .get();

  return snapshot.docs.reduce((sum, doc) => {
    const record = doc.data();
    return sum + (record.cost || 0);
  }, 0);
}

/**
 * Get usage by task from monthly summary in Firestore
 */
export async function getUsageByTask(userId: string, month?: string): Promise<Record<AITask, number>> {
  const summary = await getMonthlyCost(userId, month);

  if (!summary) {
    return {} as Record<AITask, number>;
  }

  const usage: Record<string, number> = {};

  Object.entries(summary.byTask).forEach(([task, stats]) => {
    usage[task] = stats.count;
  });

  return usage as Record<AITask, number>;
}

/**
 * Check if user exceeds cost thresholds
 */
async function checkCostThresholds(userId: string): Promise<void> {
  const monthlyCost = await getMonthlyCost(userId);

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
export async function predictNextMonthCost(userId: string): Promise<number> {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentSummary = await getMonthlyCost(userId, currentMonth);

  if (!currentSummary) return 0;

  // Simple prediction: current month's cost * (30 / current day of month)
  const currentDay = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const projectedCost = (currentSummary.totalCost / currentDay) * daysInMonth;

  return Number(projectedCost.toFixed(2));
}

/**
 * Get top users by AI cost from current month's summaries
 */
export async function getTopUsersByCost(limit: number = 10): Promise<Array<{
  userId: string;
  totalCost: number;
  callCount: number;
}>> {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const snapshot = await db.collection('ai_monthly_summaries')
    .where('month', '==', currentMonth)
    .orderBy('totalCost', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      userId: data.userId,
      totalCost: data.totalCost,
      callCount: data.callCount,
    };
  });
}

/**
 * Get total platform cost from monthly summaries
 */
export async function getTotalPlatformCost(month?: string): Promise<number> {
  const targetMonth = month || new Date().toISOString().substring(0, 7);

  const snapshot = await db.collection('ai_monthly_summaries')
    .where('month', '==', targetMonth)
    .get();

  return snapshot.docs.reduce((sum, doc) => {
    const data = doc.data();
    return sum + (data.totalCost || 0);
  }, 0);
}

/**
 * Generate cost report for user from Firestore
 */
export async function generateCostReport(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalCost: number;
  callCount: number;
  byTask: Record<AITask, { count: number; cost: number }>;
  byProvider: Record<string, { count: number; cost: number }>;
  dailyCosts: Array<{ date: string; cost: number }>;
}> {
  const snapshot = await db.collection('ai_usage')
    .where('userId', '==', userId)
    .where('timestamp', '>=', Timestamp.fromDate(startDate))
    .where('timestamp', '<=', Timestamp.fromDate(endDate))
    .get();

  const records = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      timestamp: data.timestamp.toDate(),
    };
  });

  const totalCost = records.reduce((sum, record) => sum + (record.cost || 0), 0);
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
 * Clear old records (data retention) from Firestore
 */
export async function clearOldRecords(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const snapshot = await db.collection('ai_usage')
    .where('timestamp', '<', Timestamp.fromDate(cutoffDate))
    .get();

  const removed = snapshot.size;

  // Batch delete (Firestore supports max 500 operations per batch)
  const batches: any[] = [];
  let batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;

    if (count === 500) {
      batches.push(batch);
      batch = db.batch();
      count = 0;
    }
  });

  if (count > 0) {
    batches.push(batch);
  }

  // Commit all batches
  await Promise.all(batches.map(b => b.commit()));

  logInfo('Old AI usage records cleared from Firestore', {
    removed,
    daysToKeep,
    cutoffDate: cutoffDate.toISOString()
  });

  return removed;
}

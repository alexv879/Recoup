import { db, Timestamp, COLLECTIONS } from '@/lib/firebase';
import { Invoice, CollectionAttempt, User, UserStats } from '@/types/models';
import { NotFoundError } from '@/utils/error';
import { logDbOperation, logInfo, logError } from '@/utils/logger';

/**
 * Helper function to convert Date | Timestamp to Date
 */
function toDate(date: Date | Timestamp | any): Date {
  if (date instanceof Date) {
    return date;
  }
  // It's a Timestamp
  return (date as any).toDate ? (date as any).toDate() : new Date((date as any).seconds * 1000);
}

/**
 * Analytics Service - Dashboard statistics and insights
 *
 * Provides comprehensive analytics for invoices, collections, and user performance
 */

/**
 * Get invoice statistics for a user
 */
export async function getInvoiceStats(userId: string): Promise<{
  total: number;
  paid: number;
  overdue: number;
  collected: number;
  avgPaymentDays: number;
}> {
  const startTime = Date.now();

  try {
    // Get all invoices for user
    const invoicesQuery = await db
      .collection(COLLECTIONS.INVOICES)
      .where('freelancerId', '==', userId)
      .get();

    const invoices = invoicesQuery.docs.map((doc) => doc.data() as Invoice);

    // Calculate statistics
    const total = invoices.length;
    const paid = invoices.filter((inv) => inv.status === 'paid').length;
    const overdue = invoices.filter((inv) => inv.status === 'overdue').length;
    const collected = invoices.filter((inv) => inv.status === 'paid' && inv.collectionsEnabled).length;

    // Calculate average payment days
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.paidAt);
    const avgPaymentDays =
      paidInvoices.length > 0
        ? paidInvoices.reduce((sum, inv) => {
          const dueDate = toDate(inv.dueDate);
          const paidDate = toDate(inv.paidAt!);
          const days = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / paidInvoices.length
        : 0;

    logDbOperation('get_invoice_stats', COLLECTIONS.INVOICES, userId, Date.now() - startTime);

    return {
      total,
      paid,
      overdue,
      collected,
      avgPaymentDays: Math.round(avgPaymentDays * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    logError('Failed to get invoice stats', error);
    throw error;
  }
}

/**
 * Get collection statistics for a user
 */
export async function getCollectionStats(userId: string): Promise<{
  attempts: number;
  successRate: number;
  revenue: number;
  outcomes: Record<string, number>;
}> {
  const startTime = Date.now();

  try {
    // Get all collection attempts for user
    const attemptsQuery = await db
      .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
      .where('freelancerId', '==', userId)
      .get();

    const attempts = attemptsQuery.docs.map((doc) => doc.data() as CollectionAttempt);

    // Calculate outcomes
    const outcomes: Record<string, number> = {};
    let successCount = 0;
    let totalRevenue = 0;

    attempts.forEach((attempt) => {
      const outcome = attempt.result || 'pending';
      outcomes[outcome] = (outcomes[outcome] || 0) + 1;

      if (attempt.result === 'success') {
        successCount++;
        totalRevenue += attempt.paymentRecovered || 0;
      }
    });

    const successRate = attempts.length > 0 ? (successCount / attempts.length) * 100 : 0;

    logDbOperation('get_collection_stats', COLLECTIONS.COLLECTION_ATTEMPTS, userId, Date.now() - startTime);

    return {
      attempts: attempts.length,
      successRate: Math.round(successRate * 10) / 10,
      revenue: totalRevenue,
      outcomes,
    };
  } catch (error) {
    logError('Failed to get collection stats', error);
    throw error;
  }
}

/**
 * Get revenue by month for the past N months
 */
export async function getRevenueByMonth(
  userId: string,
  months: number = 12
): Promise<
  Array<{
    month: string;
    revenue: number;
    collections: number;
    growth: number;
  }>
> {
  const startTime = Date.now();

  try {
    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    // Get all paid invoices in date range
    const invoicesQuery = await db
      .collection(COLLECTIONS.INVOICES)
      .where('freelancerId', '==', userId)
      .where('status', '==', 'paid')
      .get();

    const invoices = invoicesQuery.docs
      .map((doc) => doc.data() as Invoice)
      .filter((inv) => inv.paidAt && toDate(inv.paidAt) >= startDate);

    // Group by month
    const monthlyData: Record<string, { revenue: number; collections: number }> = {};

    invoices.forEach((inv) => {
      const paidDate = toDate(inv.paidAt!);
      const monthKey = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, collections: 0 };
      }

      monthlyData[monthKey].revenue += inv.amount;
      if (inv.collectionsEnabled) {
        monthlyData[monthKey].collections++;
      }
    });

    // Convert to array with growth calculation
    const result: Array<{ month: string; revenue: number; collections: number; growth: number }> = [];
    let previousRevenue = 0;

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - (months - i - 1), 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const data = monthlyData[monthKey] || { revenue: 0, collections: 0 };
      const growth = previousRevenue > 0 ? ((data.revenue - previousRevenue) / previousRevenue) * 100 : 0;

      result.push({
        month: monthKey,
        revenue: data.revenue,
        collections: data.collections,
        growth: Math.round(growth * 10) / 10,
      });

      previousRevenue = data.revenue;
    }

    logDbOperation('get_revenue_by_month', COLLECTIONS.INVOICES, userId, Date.now() - startTime);

    return result;
  } catch (error) {
    logError('Failed to get revenue by month', error);
    throw error;
  }
}

/**
 * Get client breakdown statistics
 */
export async function getClientBreakdown(userId: string): Promise<
  Array<{
    clientName: string;
    totalInvoiced: number;
    totalPaid: number;
    avgPaymentDays: number;
    status: 'good' | 'slow' | 'overdue';
  }>
> {
  const startTime = Date.now();

  try {
    // Get all invoices for user
    const invoicesQuery = await db
      .collection(COLLECTIONS.INVOICES)
      .where('freelancerId', '==', userId)
      .get();

    const invoices = invoicesQuery.docs.map((doc) => doc.data() as Invoice);

    // Group by client
    const clientData: Record<
      string,
      {
        clientName: string;
        invoices: Invoice[];
      }
    > = {};

    invoices.forEach((inv) => {
      if (!clientData[inv.clientEmail]) {
        clientData[inv.clientEmail] = {
          clientName: inv.clientName,
          invoices: [],
        };
      }
      clientData[inv.clientEmail].invoices.push(inv);
    });

    // Calculate stats for each client
    const breakdown = Object.values(clientData).map((client) => {
      const totalInvoiced = client.invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const paidInvoices = client.invoices.filter((inv) => inv.status === 'paid');
      const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

      // Calculate average payment days
      const avgPaymentDays =
        paidInvoices.length > 0
          ? paidInvoices.reduce((sum, inv) => {
            if (!inv.paidAt) return sum;
            const dueDate = toDate(inv.dueDate);
            const paidDate = toDate(inv.paidAt);
            const days = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / paidInvoices.length
          : 0;

      // Determine status
      const hasOverdue = client.invoices.some((inv) => inv.status === 'overdue');
      const status: 'good' | 'slow' | 'overdue' = hasOverdue
        ? 'overdue'
        : avgPaymentDays > 7
          ? 'slow'
          : 'good';

      return {
        clientName: client.clientName,
        totalInvoiced,
        totalPaid,
        avgPaymentDays: Math.round(avgPaymentDays * 10) / 10,
        status,
      };
    });

    // Sort by total invoiced (highest first)
    breakdown.sort((a, b) => b.totalInvoiced - a.totalInvoiced);

    logDbOperation('get_client_breakdown', COLLECTIONS.INVOICES, userId, Date.now() - startTime);

    return breakdown;
  } catch (error) {
    logError('Failed to get client breakdown', error);
    throw error;
  }
}

/**
 * Get top clients by revenue
 */
export async function getTopClients(userId: string, limit: number = 5): Promise<Array<any>> {
  const breakdown = await getClientBreakdown(userId);
  return breakdown.slice(0, limit);
}

/**
 * Get at-risk invoices (overdue with no collections enabled)
 */
export async function getAtRiskInvoices(userId: string): Promise<Array<Invoice>> {
  const startTime = Date.now();

  try {
    const invoicesQuery = await db
      .collection(COLLECTIONS.INVOICES)
      .where('freelancerId', '==', userId)
      .where('status', '==', 'overdue')
      .where('collectionsEnabled', '==', false)
      .get();

    const invoices = invoicesQuery.docs.map((doc) => doc.data() as Invoice);

    logDbOperation('get_at_risk_invoices', COLLECTIONS.INVOICES, userId, Date.now() - startTime);

    return invoices;
  } catch (error) {
    logError('Failed to get at-risk invoices', error);
    throw error;
  }
}

/**
 * Predict revenue for next N months based on historical data
 */
export async function getPredictedRevenue(userId: string, months: number = 3): Promise<number> {
  const historicalData = await getRevenueByMonth(userId, 6);

  if (historicalData.length < 3) {
    return 0; // Not enough data for prediction
  }

  // Simple average of last 3 months
  const recentRevenue = historicalData.slice(-3);
  const avgRevenue = recentRevenue.reduce((sum, data) => sum + data.revenue, 0) / 3;

  return Math.round(avgRevenue * months);
}

/**
 * Get user rank by XP, recovery, or referrals
 */
export async function getUserRank(userId: string): Promise<{
  rank: number;
  totalUsers: number;
  percentile: number;
}> {
  const startTime = Date.now();

  try {
    // Get user stats
    const userStatsDoc = await db.collection(COLLECTIONS.USER_STATS).doc(userId).get();

    if (!userStatsDoc.exists) {
      return { rank: 0, totalUsers: 0, percentile: 0 };
    }

    const userStats = userStatsDoc.data() as UserStats;
    const userXP = userStats.gamificationXP || 0;

    // Get all users with XP
    const allUsersQuery = await db
      .collection(COLLECTIONS.USER_STATS)
      .where('gamificationXP', '>', 0)
      .orderBy('gamificationXP', 'desc')
      .get();

    const totalUsers = allUsersQuery.size;
    let rank = 1;

    for (const doc of allUsersQuery.docs) {
      const stats = doc.data() as UserStats;
      if ((stats.gamificationXP || 0) > userXP) {
        rank++;
      } else {
        break;
      }
    }

    const percentile = totalUsers > 0 ? ((totalUsers - rank + 1) / totalUsers) * 100 : 0;

    logDbOperation('get_user_rank', COLLECTIONS.USER_STATS, userId, Date.now() - startTime);

    return {
      rank,
      totalUsers,
      percentile: Math.round(percentile),
    };
  } catch (error) {
    logError('Failed to get user rank', error);
    throw error;
  }
}

/**
 * Get top users by metric
 */
export async function getTopUsers(
  limit: number = 10,
  sortBy: 'xp' | 'recovery' | 'referrals' = 'xp'
): Promise<Array<any>> {
  const startTime = Date.now();

  try {
    let query: any = db.collection(COLLECTIONS.USER_STATS);

    // Sort by metric
    if (sortBy === 'xp') {
      query = query.orderBy('gamificationXP', 'desc');
    } else if (sortBy === 'recovery') {
      query = query.orderBy('totalCollected', 'desc');
    } else if (sortBy === 'referrals') {
      query = query.orderBy('totalReferrals', 'desc'); // Assuming 'totalReferrals' exists in UserStats
    }

    const usersQuery = await query.limit(limit).get();

    const topUsers = await Promise.all(
      usersQuery.docs.map(async (doc: any, index: number) => {
        const stats = doc.data() as UserStats;

        // Get user name
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(stats.userId).get();
        const user = userDoc.exists ? (userDoc.data() as User) : null;

        return {
          rank: index + 1,
          userId: stats.userId,
          name: user?.name || 'Anonymous',
          metric:
            sortBy === 'xp'
              ? stats.gamificationXP
              : sortBy === 'recovery'
                ? stats.totalCollected
                : 0,
          value:
            sortBy === 'xp'
              ? `${stats.gamificationXP} XP`
              : sortBy === 'recovery'
                ? `£${stats.totalCollected}`
                : '',
        };
      })
    );

    logDbOperation('get_top_users', COLLECTIONS.USER_STATS, undefined, Date.now() - startTime);

    return topUsers;
  } catch (error) {
    logError('Failed to get top users', error);
    throw error;
  }
}

/**
 * Generate AI-like insights for user
 */
export async function generateInsights(userId: string): Promise<Array<string>> {
  const insights: string[] = [];

  try {
    // Get invoice stats
    const invoiceStats = await getInvoiceStats(userId);

    // Insight 1: Overdue invoices
    if (invoiceStats.overdue > 0) {
      insights.push(
        `You have ${invoiceStats.overdue} overdue invoice${invoiceStats.overdue > 1 ? 's' : ''}. Consider enabling collections to recover payment faster.`
      );
    }

    // Insight 2: Average payment days
    if (invoiceStats.avgPaymentDays > 14) {
      insights.push(
        `Your clients take an average of ${invoiceStats.avgPaymentDays} days to pay. Industry average is 7-14 days. Consider sending earlier reminders.`
      );
    }

    // Insight 3: Collection success
    if (invoiceStats.collected > 0) {
      insights.push(
        `Great work! You've successfully collected ${invoiceStats.collected} invoice${invoiceStats.collected > 1 ? 's' : ''} using Recoup's automated collections.`
      );
    }

    // Insight 4: At-risk invoices
    const atRisk = await getAtRiskInvoices(userId);
    if (atRisk.length > 0) {
      insights.push(
        `${atRisk.length} overdue invoice${atRisk.length > 1 ? 's are' : ' is'} at risk. Enable collections to prevent further delays.`
      );
    }

    // Insight 5: Performance ranking
    const rank = await getUserRank(userId);
    if (rank.percentile > 75) {
      insights.push(
        `You're in the top ${100 - rank.percentile}% of Recoup users! Keep up the great work.`
      );
    }

    return insights;
  } catch (error) {
    logError('Failed to generate insights', error);
    return [];
  }
}

/**
 * Get collection effectiveness index (0-100)
 */
export async function getCollectionEffectivenessIndex(userId: string): Promise<number> {
  try {
    const collectionStats = await getCollectionStats(userId);
    const invoiceStats = await getInvoiceStats(userId);

    // Calculate effectiveness based on success rate and collection usage
    const successRate = collectionStats.successRate;
    const collectionUsage = invoiceStats.total > 0 ? (invoiceStats.collected / invoiceStats.total) * 100 : 0;

    // Weighted average: 70% success rate, 30% usage
    const effectiveness = (successRate * 0.7) + (collectionUsage * 0.3);

    return Math.round(Math.min(100, Math.max(0, effectiveness)));
  } catch (error) {
    logError('Failed to get collection effectiveness index', error);
    return 0;
  }
}

/**
 * Alias for getCollectionStats to match expected naming
 */
export const getCollectionsStats = getCollectionStats;

/**
 * Get recent activity for dashboard
 */
export async function getRecentActivity(userId: string, limit: number = 10): Promise<Array<any>> {
  const startTime = Date.now();

  try {
    // Get recent invoices
    const invoicesQuery = await db
      .collection(COLLECTIONS.INVOICES)
      .where('freelancerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const recentInvoices = invoicesQuery.docs.map((doc) => ({
      id: doc.id,
      type: 'invoice_created',
      description: `Invoice created for ${doc.data().clientName}`,
      amount: doc.data().amount,
      date: doc.data().createdAt,
      status: doc.data().status,
    }));

    // Get recent collection attempts
    const collectionsQuery = await db
      .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
      .where('freelancerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const recentCollections = collectionsQuery.docs.map((doc) => ({
      id: doc.id,
      type: 'collection_attempt',
      description: `Collection attempt for invoice`,
      amount: doc.data().paymentRecovered || 0,
      date: doc.data().createdAt,
      status: doc.data().result,
    }));

    // Combine and sort by date
    const allActivity = [...recentInvoices, ...recentCollections]
      .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime())
      .slice(0, limit);

    logDbOperation('get_recent_activity', COLLECTIONS.INVOICES, userId, Date.now() - startTime);

    return allActivity;
  } catch (error) {
    logError('Failed to get recent activity', error);
    return [];
  }
}

/**
 * Get reminder effectiveness rates
 */
export async function getReminderEffectivenessRates(userId: string): Promise<{
  day5: number;
  day15: number;
  day30: number;
  overall: number;
}> {
  const startTime = Date.now();

  try {
    // Get all collection attempts with reminder data
    const attemptsQuery = await db
      .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
      .where('freelancerId', '==', userId)
      .get();

    const attempts = attemptsQuery.docs.map((doc) => doc.data() as CollectionAttempt);

    // Group by reminder level
    const reminderStats: Record<string, { total: number; success: number }> = {
      '5': { total: 0, success: 0 },
      '15': { total: 0, success: 0 },
      '30': { total: 0, success: 0 },
    };

    attempts.forEach((attempt) => {
      const level = attempt.reminderLevel?.toString();
      if (level && reminderStats[level]) {
        reminderStats[level].total++;
        if (attempt.result === 'success') {
          reminderStats[level].success++;
        }
      }
    });

    // Calculate rates
    const day5 = reminderStats['5'].total > 0 ? (reminderStats['5'].success / reminderStats['5'].total) * 100 : 0;
    const day15 = reminderStats['15'].total > 0 ? (reminderStats['15'].success / reminderStats['15'].total) * 100 : 0;
    const day30 = reminderStats['30'].total > 0 ? (reminderStats['30'].success / reminderStats['30'].total) * 100 : 0;

    const totalAttempts = attempts.length;
    const totalSuccess = attempts.filter(a => a.result === 'success').length;
    const overall = totalAttempts > 0 ? (totalSuccess / totalAttempts) * 100 : 0;

    logDbOperation('get_reminder_effectiveness', COLLECTIONS.COLLECTION_ATTEMPTS, userId, Date.now() - startTime);

    return {
      day5: Math.round(day5 * 10) / 10,
      day15: Math.round(day15 * 10) / 10,
      day30: Math.round(day30 * 10) / 10,
      overall: Math.round(overall * 10) / 10,
    };
  } catch (error) {
    logError('Failed to get reminder effectiveness rates', error);
    return { day5: 0, day15: 0, day30: 0, overall: 0 };
  }
}


import { db, Timestamp, COLLECTIONS } from '@/lib/firebase';
import { Invoice, CollectionAttempt, User, UserStats } from '@/types/models';
import { NotFoundError } from '@/utils/error';
import { logDbOperation, logInfo, logError } from '@/utils/logger';
import { withCache, CACHE_KEYS, CACHE_TTL, invalidateUserCache } from '@/lib/cache';
import { measureQuery, PerformanceTimer } from '@/lib/performance';

/**
 * Analytics Service - Dashboard statistics and insights
 *
 * Provides comprehensive analytics for invoices, collections, and user performance
 */

/**
 * Get invoice statistics for a user
 * OPTIMIZED: Uses caching and aggregation queries
 */
export async function getInvoiceStats(userId: string): Promise<{
  total: number;
  paid: number;
  overdue: number;
  collected: number;
  avgPaymentDays: number;
  totalPaid?: number;
  totalOutstanding?: number;
  avgAmount?: number;
  draft?: number;
}> {
  return withCache(
    CACHE_KEYS.INVOICE_STATS,
    CACHE_TTL.INVOICE_STATS,
    [userId],
    async () => {
      const timer = new PerformanceTimer('getInvoiceStats', { userId });

      try {
        // OPTIMIZATION: Use Promise.all to fetch status counts in parallel
        const [allInvoices, paidInvoices, overdueInvoices, draftInvoices] = await Promise.all([
          measureQuery('count_all', COLLECTIONS.INVOICES, userId, () =>
            db.collection(COLLECTIONS.INVOICES).where('freelancerId', '==', userId).get()
          ),
          measureQuery('count_paid', COLLECTIONS.INVOICES, userId, () =>
            db.collection(COLLECTIONS.INVOICES)
              .where('freelancerId', '==', userId)
              .where('status', '==', 'paid')
              .get()
          ),
          measureQuery('count_overdue', COLLECTIONS.INVOICES, userId, () =>
            db.collection(COLLECTIONS.INVOICES)
              .where('freelancerId', '==', userId)
              .where('status', '==', 'overdue')
              .get()
          ),
          measureQuery('count_draft', COLLECTIONS.INVOICES, userId, () =>
            db.collection(COLLECTIONS.INVOICES)
              .where('freelancerId', '==', userId)
              .where('status', '==', 'draft')
              .get()
          ),
        ]);

        timer.checkpoint('queries_complete');

        // Calculate stats
        const total = allInvoices.size;
        const paid = paidInvoices.size;
        const overdue = overdueInvoices.size;
        const draft = draftInvoices.size;

        // Calculate collected (paid invoices with collections enabled)
        const paidInvoiceData = paidInvoices.docs.map((doc) => doc.data() as Invoice);
        const collected = paidInvoiceData.filter((inv) => inv.collectionsEnabled).length;

        // Calculate financial metrics
        const totalPaid = paidInvoiceData.reduce((sum, inv) => sum + inv.amount, 0);
        const allInvoiceData = allInvoices.docs.map((doc) => doc.data() as Invoice);
        const unpaidAmount = allInvoiceData
          .filter((inv) => inv.status !== 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0);
        const avgAmount = total > 0 ? allInvoiceData.reduce((sum, inv) => sum + inv.amount, 0) / total : 0;

        // Calculate average payment days
        const paidWithDates = paidInvoiceData.filter((inv) => inv.paidAt);
        const avgPaymentDays =
          paidWithDates.length > 0
            ? paidWithDates.reduce((sum, inv) => {
                const dueDate = inv.dueDate.toDate();
                const paidDate = inv.paidAt!.toDate();
                const days = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                return sum + days;
              }, 0) / paidWithDates.length
            : 0;

        timer.checkpoint('calculations_complete');

        const duration = timer.end();
        logDbOperation('get_invoice_stats', COLLECTIONS.INVOICES, userId, duration);

        return {
          total,
          paid,
          overdue,
          collected,
          draft,
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalOutstanding: Math.round(unpaidAmount * 100) / 100,
          avgAmount: Math.round(avgAmount * 100) / 100,
          avgPaymentDays: Math.round(avgPaymentDays * 10) / 10,
        };
      } catch (error) {
        logError('Failed to get invoice stats', error);
        throw error;
      }
    }
  );
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
 * OPTIMIZED: Uses caching and date-range queries
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
  return withCache(
    CACHE_KEYS.REVENUE_BY_MONTH,
    CACHE_TTL.REVENUE_BY_MONTH,
    [userId, months],
    async () => {
      const timer = new PerformanceTimer('getRevenueByMonth', { userId, months });

      try {
        // Calculate date range
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

        // OPTIMIZATION: Query only paid invoices with date filter
        const invoicesQuery = await measureQuery(
          'revenue_by_month',
          COLLECTIONS.INVOICES,
          userId,
          () =>
            db
              .collection(COLLECTIONS.INVOICES)
              .where('freelancerId', '==', userId)
              .where('status', '==', 'paid')
              .where('paidAt', '>=', Timestamp.fromDate(startDate))
              .get()
        );

        timer.checkpoint('query_complete');

        const invoices = invoicesQuery.docs.map((doc) => doc.data() as Invoice);

        // Group by month
        const monthlyData: Record<string, { revenue: number; collections: number }> = {};

        invoices.forEach((inv) => {
          if (!inv.paidAt) return;
          const paidDate = inv.paidAt.toDate();
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

        timer.checkpoint('calculations_complete');
        const duration = timer.end();
        logDbOperation('get_revenue_by_month', COLLECTIONS.INVOICES, userId, duration);

        return result;
      } catch (error) {
        logError('Failed to get revenue by month', error);
        throw error;
      }
    }
  );
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
            const dueDate = inv.dueDate.toDate();
            const paidDate = inv.paidAt.toDate();
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
      if (stats.gamificationXP > userXP) {
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
 * OPTIMIZED: Fixes N+1 query, uses caching
 */
export async function getTopUsers(
  limit: number = 10,
  sortBy: 'xp' | 'recovery' | 'referrals' = 'xp'
): Promise<Array<any>> {
  return withCache(
    CACHE_KEYS.TOP_USERS,
    CACHE_TTL.TOP_USERS,
    [limit, sortBy],
    async () => {
      const timer = new PerformanceTimer('getTopUsers', { limit, sortBy });

      try {
        let query: any = db.collection(COLLECTIONS.USER_STATS);

        // Sort by metric
        if (sortBy === 'xp') {
          query = query.orderBy('gamificationXP', 'desc');
        } else if (sortBy === 'recovery') {
          query = query.orderBy('totalCollected', 'desc');
        }

        const usersQuery = await measureQuery('top_users', COLLECTIONS.USER_STATS, undefined, () =>
          query.limit(limit).get()
        );

        timer.checkpoint('stats_query_complete');

        // OPTIMIZATION: Batch fetch user data to avoid N+1
        const userIds = usersQuery.docs.map((doc: any) => (doc.data() as UserStats).userId);
        const userDocs = await measureQuery('batch_users', COLLECTIONS.USERS, undefined, () =>
          Promise.all(userIds.map((id) => db.collection(COLLECTIONS.USERS).doc(id).get()))
        );

        timer.checkpoint('user_batch_complete');

        const userMap = new Map<string, User>();
        userDocs.forEach((doc) => {
          if (doc.exists) {
            const user = doc.data() as User;
            userMap.set(user.userId, user);
          }
        });

        const topUsers = usersQuery.docs.map((doc: any, index: number) => {
          const stats = doc.data() as UserStats;
          const user = userMap.get(stats.userId);

          return {
            rank: index + 1,
            userId: stats.userId,
            name: user?.fullName || 'Anonymous',
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
        });

        const duration = timer.end();
        logDbOperation('get_top_users', COLLECTIONS.USER_STATS, undefined, duration);

        return topUsers;
      } catch (error) {
        logError('Failed to get top users', error);
        throw error;
      }
    }
  );
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
 * Get collections statistics (alias for getCollectionStats)
 * For compatibility with dashboard routes
 */
export async function getCollectionsStats(userId: string): Promise<{
  enabled: boolean;
  attempts: number;
  successful: number;
  quotaRemaining?: number;
  quotaResetDate?: Date | null;
  totalRecovered?: number;
}> {
  const stats = await getCollectionStats(userId);

  // Get user to check if collections enabled
  const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
  const user = userDoc.exists ? (userDoc.data() as User) : null;

  return {
    enabled: user?.collectionsEnabled || false,
    attempts: stats.attempts,
    successful: stats.outcomes['success'] || 0,
    totalRecovered: stats.revenue,
    quotaRemaining: 0, // TODO: Implement quota tracking
    quotaResetDate: null,
  };
}

/**
 * Get recent activity for a user
 */
export async function getRecentActivity(
  userId: string,
  limit: number = 10
): Promise<Array<{
  type: string;
  message: string;
  timestamp: Date;
  metadata?: any;
}>> {
  const startTime = Date.now();

  try {
    // Get recent invoices
    const recentInvoices = await measureQuery(
      'recent_invoices',
      COLLECTIONS.INVOICES,
      userId,
      () =>
        db
          .collection(COLLECTIONS.INVOICES)
          .where('freelancerId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get()
    );

    const activity = recentInvoices.docs.map((doc) => {
      const invoice = doc.data() as Invoice;
      return {
        type: 'invoice',
        message: `Invoice ${invoice.reference} - ${invoice.status}`,
        timestamp: invoice.createdAt.toDate(),
        metadata: {
          invoiceId: invoice.invoiceId,
          amount: invoice.amount,
          status: invoice.status,
        },
      };
    });

    logDbOperation('get_recent_activity', COLLECTIONS.INVOICES, userId, Date.now() - startTime);

    return activity;
  } catch (error) {
    logError('Failed to get recent activity', error);
    return [];
  }
}

/**
 * Invalidate all caches for a user
 * Call this when invoice/collection data changes
 */
export async function invalidateAnalyticsCache(userId: string): Promise<void> {
  await invalidateUserCache(userId);
  logInfo(`Analytics cache invalidated for user: ${userId}`);
}


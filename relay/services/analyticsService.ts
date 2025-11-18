import { db, Timestamp, COLLECTIONS } from '@/lib/firebase';
import { Invoice, CollectionAttempt, User, UserStats } from '@/types/models';
import { NotFoundError } from '@/utils/error';
import { logDbOperation, logInfo, logError } from '@/utils/logger';
import { getCached, cacheKeys, cacheTTL, invalidateUserCache } from '@/lib/redis';
import { measureTime } from '@/utils/performance';

/**
 * Optimized Analytics Service with Redis caching and query optimization
 *
 * Key improvements:
 * - Redis caching for expensive queries
 * - Optimized Firestore queries with .where() filters
 * - Fixed N+1 query problems with batch fetching
 * - Reduced in-memory filtering
 * - Performance tracking
 */

/**
 * Get invoice statistics for a user (OPTIMIZED)
 *
 * Optimization: Use parallel queries instead of fetching all and filtering in memory
 */
export async function getInvoiceStats(userId: string): Promise<{
  total: number;
  paid: number;
  overdue: number;
  collected: number;
  avgPaymentDays: number;
}> {
  return getCached(
    cacheKeys.invoiceStats(userId),
    async () => {
      const startTime = Date.now();

      try {
        // Execute queries in parallel for better performance
        const [totalQuery, paidQuery, overdueQuery, collectedQuery] = await Promise.all([
          // Total invoices
          db.collection(COLLECTIONS.INVOICES)
            .where('freelancerId', '==', userId)
            .count()
            .get(),

          // Paid invoices
          db.collection(COLLECTIONS.INVOICES)
            .where('freelancerId', '==', userId)
            .where('status', '==', 'paid')
            .get(),

          // Overdue invoices
          db.collection(COLLECTIONS.INVOICES)
            .where('freelancerId', '==', userId)
            .where('status', '==', 'overdue')
            .count()
            .get(),

          // Collected invoices (paid + collectionsEnabled)
          db.collection(COLLECTIONS.INVOICES)
            .where('freelancerId', '==', userId)
            .where('status', '==', 'paid')
            .where('collectionsEnabled', '==', true)
            .count()
            .get(),
        ]);

        const total = totalQuery.data().count;
        const paidInvoices = paidQuery.docs.map(doc => doc.data() as Invoice);
        const paid = paidInvoices.length;
        const overdue = overdueQuery.data().count;
        const collected = collectedQuery.data().count;

        // Calculate average payment days only from paid invoices with paidAt
        const avgPaymentDays = paidInvoices.length > 0
          ? paidInvoices
              .filter(inv => inv.paidAt)
              .reduce((sum, inv) => {
                const dueDate = inv.dueDate.toDate();
                const paidDate = inv.paidAt!.toDate();
                const days = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                return sum + days;
              }, 0) / paidInvoices.filter(inv => inv.paidAt).length
          : 0;

        const duration = Date.now() - startTime;
        logDbOperation('get_invoice_stats', duration, {
          collection: COLLECTIONS.INVOICES,
          userId,
          cached: false,
        });

        return {
          total,
          paid,
          overdue,
          collected,
          avgPaymentDays: Math.round(avgPaymentDays * 10) / 10,
        };
      } catch (error) {
        logError('Failed to get invoice stats', error);
        throw error;
      }
    },
    cacheTTL.invoiceStats
  );
}

/**
 * Get collection statistics for a user (OPTIMIZED with caching)
 */
export async function getCollectionStats(userId: string): Promise<{
  attempts: number;
  successRate: number;
  revenue: number;
  outcomes: Record<string, number>;
}> {
  return getCached(
    cacheKeys.collectionMetrics(userId),
    async () => {
      const startTime = Date.now();

      try {
        const attemptsQuery = await db
          .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
          .where('freelancerId', '==', userId)
          .get();

        const attempts = attemptsQuery.docs.map(doc => doc.data() as CollectionAttempt);

        const outcomes: Record<string, number> = {};
        let successCount = 0;
        let totalRevenue = 0;

        attempts.forEach(attempt => {
          const outcome = attempt.result || 'pending';
          outcomes[outcome] = (outcomes[outcome] || 0) + 1;

          if (attempt.result === 'success') {
            successCount++;
            totalRevenue += attempt.paymentRecovered || 0;
          }
        });

        const successRate = attempts.length > 0 ? (successCount / attempts.length) * 100 : 0;

        const duration = Date.now() - startTime;
        logDbOperation('get_collection_stats', duration, {
          collection: COLLECTIONS.COLLECTION_ATTEMPTS,
          userId,
        });

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
    },
    cacheTTL.collectionMetrics
  );
}

/**
 * Get revenue by month (OPTIMIZED)
 *
 * Optimization: Filter by paidAt date range in query instead of in memory
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
  return getCached(
    cacheKeys.revenueByMonth(userId),
    async () => {
      const startTime = Date.now();

      try {
        // Calculate date range
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
        const startTimestamp = Timestamp.fromDate(startDate);

        // Optimized query: filter by date in Firestore
        const invoicesQuery = await db
          .collection(COLLECTIONS.INVOICES)
          .where('freelancerId', '==', userId)
          .where('status', '==', 'paid')
          .where('paidAt', '>=', startTimestamp)
          .get();

        const invoices = invoicesQuery.docs.map(doc => doc.data() as Invoice);

        // Group by month
        const monthlyData: Record<string, { revenue: number; collections: number }> = {};

        invoices.forEach(inv => {
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

        const duration = Date.now() - startTime;
        logDbOperation('get_revenue_by_month', duration, {
          collection: COLLECTIONS.INVOICES,
          userId,
          months,
        });

        return result;
      } catch (error) {
        logError('Failed to get revenue by month', error);
        throw error;
      }
    },
    cacheTTL.revenueByMonth
  );
}

/**
 * Get client breakdown (OPTIMIZED with caching)
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
  return getCached(
    cacheKeys.clientBreakdown(userId),
    async () => {
      const startTime = Date.now();

      try {
        const invoicesQuery = await db
          .collection(COLLECTIONS.INVOICES)
          .where('freelancerId', '==', userId)
          .get();

        const invoices = invoicesQuery.docs.map(doc => doc.data() as Invoice);

        // Group by client
        const clientData: Record<string, { clientName: string; invoices: Invoice[] }> = {};

        invoices.forEach(inv => {
          if (!clientData[inv.clientEmail]) {
            clientData[inv.clientEmail] = {
              clientName: inv.clientName,
              invoices: [],
            };
          }
          clientData[inv.clientEmail].invoices.push(inv);
        });

        // Calculate stats for each client
        const breakdown = Object.values(clientData).map(client => {
          const totalInvoiced = client.invoices.reduce((sum, inv) => sum + inv.amount, 0);
          const paidInvoices = client.invoices.filter(inv => inv.status === 'paid');
          const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

          const avgPaymentDays = paidInvoices.length > 0
            ? paidInvoices.reduce((sum, inv) => {
                if (!inv.paidAt) return sum;
                const dueDate = inv.dueDate.toDate();
                const paidDate = inv.paidAt.toDate();
                const days = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                return sum + days;
              }, 0) / paidInvoices.length
            : 0;

          const hasOverdue = client.invoices.some(inv => inv.status === 'overdue');
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

        breakdown.sort((a, b) => b.totalInvoiced - a.totalInvoiced);

        const duration = Date.now() - startTime;
        logDbOperation('get_client_breakdown', duration, {
          collection: COLLECTIONS.INVOICES,
          userId,
        });

        return breakdown;
      } catch (error) {
        logError('Failed to get client breakdown', error);
        throw error;
      }
    },
    cacheTTL.clientBreakdown
  );
}

/**
 * Get top clients by revenue (uses cached client breakdown)
 */
export async function getTopClients(userId: string, limit: number = 5): Promise<Array<any>> {
  const breakdown = await getClientBreakdown(userId);
  return breakdown.slice(0, limit);
}

/**
 * Get at-risk invoices (already optimized with query)
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

    const invoices = invoicesQuery.docs.map(doc => doc.data() as Invoice);

    const duration = Date.now() - startTime;
    logDbOperation('get_at_risk_invoices', duration, {
      collection: COLLECTIONS.INVOICES,
      userId,
    });

    return invoices;
  } catch (error) {
    logError('Failed to get at-risk invoices', error);
    throw error;
  }
}

/**
 * Predict revenue (uses cached revenue data)
 */
export async function getPredictedRevenue(userId: string, months: number = 3): Promise<number> {
  return getCached(
    cacheKeys.predictions(userId),
    async () => {
      const historicalData = await getRevenueByMonth(userId, 6);

      if (historicalData.length < 3) {
        return 0;
      }

      const recentRevenue = historicalData.slice(-3);
      const avgRevenue = recentRevenue.reduce((sum, data) => sum + data.revenue, 0) / 3;

      return Math.round(avgRevenue * months);
    },
    cacheTTL.predictions
  );
}

/**
 * Get user rank (OPTIMIZED with caching)
 *
 * Note: This is still expensive for large user bases. For production,
 * consider using a leaderboard system with periodic updates.
 */
export async function getUserRank(userId: string): Promise<{
  rank: number;
  totalUsers: number;
  percentile: number;
}> {
  return getCached(
    cacheKeys.userRank(userId),
    async () => {
      const startTime = Date.now();

      try {
        const userStatsDoc = await db.collection(COLLECTIONS.USER_STATS).doc(userId).get();

        if (!userStatsDoc.exists) {
          return { rank: 0, totalUsers: 0, percentile: 0 };
        }

        const userStats = userStatsDoc.data() as UserStats;
        const userXP = userStats.gamificationXP || 0;

        // Count users with higher XP
        const higherXPQuery = await db
          .collection(COLLECTIONS.USER_STATS)
          .where('gamificationXP', '>', userXP)
          .count()
          .get();

        const higherXPCount = higherXPQuery.data().count;
        const rank = higherXPCount + 1;

        // Get total users with XP
        const totalUsersQuery = await db
          .collection(COLLECTIONS.USER_STATS)
          .where('gamificationXP', '>', 0)
          .count()
          .get();

        const totalUsers = totalUsersQuery.data().count;
        const percentile = totalUsers > 0 ? ((totalUsers - rank + 1) / totalUsers) * 100 : 0;

        const duration = Date.now() - startTime;
        logDbOperation('get_user_rank', duration, {
          collection: COLLECTIONS.USER_STATS,
          userId,
        });

        return {
          rank,
          totalUsers,
          percentile: Math.round(percentile),
        };
      } catch (error) {
        logError('Failed to get user rank', error);
        throw error;
      }
    },
    cacheTTL.userRank
  );
}

/**
 * Get top users (OPTIMIZED - Fixed N+1 query problem)
 *
 * Before: 1 query + N queries (one per user)
 * After: 2 queries (user stats + batch fetch user names)
 */
export async function getTopUsers(
  limit: number = 10,
  sortBy: 'xp' | 'recovery' | 'referrals' = 'xp'
): Promise<Array<any>> {
  return getCached(
    cacheKeys.topUsers(),
    async () => {
      const startTime = Date.now();

      try {
        let query: any = db.collection(COLLECTIONS.USER_STATS);

        // Sort by metric
        if (sortBy === 'xp') {
          query = query.orderBy('gamificationXP', 'desc');
        } else if (sortBy === 'recovery') {
          query = query.orderBy('totalCollected', 'desc');
        }

        const usersQuery = await query.limit(limit).get();
        const userStats = usersQuery.docs.map(doc => doc.data() as UserStats);

        // OPTIMIZATION: Batch fetch all users at once instead of N queries
        const userIds = userStats.map(stats => stats.userId);

        // Firestore doesn't support IN queries with > 10 items, so batch them
        const userDocs: Map<string, User> = new Map();

        for (let i = 0; i < userIds.length; i += 10) {
          const batch = userIds.slice(i, i + 10);
          const batchQuery = await db
            .collection(COLLECTIONS.USERS)
            .where('__name__', 'in', batch)
            .get();

          batchQuery.docs.forEach(doc => {
            userDocs.set(doc.id, doc.data() as User);
          });
        }

        // Build result
        const topUsers = userStats.map((stats, index) => {
          const user = userDocs.get(stats.userId);

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
        });

        const duration = Date.now() - startTime;
        logDbOperation('get_top_users', duration, {
          collection: COLLECTIONS.USER_STATS,
          count: topUsers.length,
        });

        return topUsers;
      } catch (error) {
        logError('Failed to get top users', error);
        throw error;
      }
    },
    cacheTTL.topUsers
  );
}

/**
 * Generate insights (uses cached data)
 */
export async function generateInsights(userId: string): Promise<Array<string>> {
  const insights: string[] = [];

  try {
    const invoiceStats = await getInvoiceStats(userId);

    if (invoiceStats.overdue > 0) {
      insights.push(
        `You have ${invoiceStats.overdue} overdue invoice${invoiceStats.overdue > 1 ? 's' : ''}. Consider enabling collections to recover payment faster.`
      );
    }

    if (invoiceStats.avgPaymentDays > 14) {
      insights.push(
        `Your clients take an average of ${invoiceStats.avgPaymentDays} days to pay. Industry average is 7-14 days. Consider sending earlier reminders.`
      );
    }

    if (invoiceStats.collected > 0) {
      insights.push(
        `Great work! You've successfully collected ${invoiceStats.collected} invoice${invoiceStats.collected > 1 ? 's' : ''} using Recoup's automated collections.`
      );
    }

    const atRisk = await getAtRiskInvoices(userId);
    if (atRisk.length > 0) {
      insights.push(
        `${atRisk.length} overdue invoice${atRisk.length > 1 ? 's are' : ' is'} at risk. Enable collections to prevent further delays.`
      );
    }

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
 * Get recent activity for a user
 */
export async function getRecentActivity(userId: string, limit: number = 10): Promise<Array<any>> {
  const startTime = Date.now();

  try {
    // Get recent invoices
    const recentInvoices = await db
      .collection(COLLECTIONS.INVOICES)
      .where('freelancerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const activity = recentInvoices.docs.map(doc => {
      const invoice = doc.data() as Invoice;
      return {
        id: doc.id,
        type: 'invoice',
        action: invoice.status === 'paid' ? 'paid' : invoice.status === 'overdue' ? 'overdue' : 'created',
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.clientName}`,
        amount: invoice.amount,
        timestamp: invoice.createdAt,
        status: invoice.status,
      };
    });

    const duration = Date.now() - startTime;
    logDbOperation('get_recent_activity', duration, {
      collection: COLLECTIONS.INVOICES,
      userId,
      limit,
    });

    return activity;
  } catch (error) {
    logError('Failed to get recent activity', error);
    return [];
  }
}

/**
 * Backward compatibility alias
 */
export async function getCollectionsStats(userId: string) {
  return getCollectionStats(userId);
}

// Export cache invalidation for use when data changes
export { invalidateUserCache };

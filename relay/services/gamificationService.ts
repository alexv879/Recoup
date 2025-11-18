import { db, COLLECTIONS } from '@/lib/firebase';
import { UserStats } from '@/types/models';
import { logDbOperation, logError } from '@/utils/logger';
import { getUserRank } from './analyticsService';

/**
 * Gamification Service
 *
 * Handles XP, levels, badges, and user rankings
 */

const XP_PER_LEVEL = 1000;

/**
 * Calculate user stats for gamification
 */
export async function calculateUserStats(userId: string): Promise<{
  xp: number;
  level: number;
  streak: number;
  badges: number;
  nextLevelXP: number;
  rank: number;
}> {
  const startTime = Date.now();

  try {
    // Get user stats
    const userStatsDoc = await db.collection(COLLECTIONS.USER_STATS).doc(userId).get();

    if (!userStatsDoc.exists) {
      return {
        xp: 0,
        level: 1,
        streak: 0,
        badges: 0,
        nextLevelXP: XP_PER_LEVEL,
        rank: 0,
      };
    }

    const stats = userStatsDoc.data() as UserStats;
    const xp = stats.gamificationXP || 0;
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const nextLevelXP = level * XP_PER_LEVEL;
    const streak = stats.streak || 0;
    const badges = stats.badges?.length || 0;

    // Get user rank
    const rankData = await getUserRank(userId);

    const duration = Date.now() - startTime;
    logDbOperation('calculate_user_stats', duration, {
      collection: COLLECTIONS.USER_STATS,
      userId,
    });

    return {
      xp,
      level,
      streak,
      badges,
      nextLevelXP,
      rank: rankData.rank,
    };
  } catch (error) {
    logError('Failed to calculate user stats', error);
    return {
      xp: 0,
      level: 1,
      streak: 0,
      badges: 0,
      nextLevelXP: XP_PER_LEVEL,
      rank: 0,
    };
  }
}

/**
 * Award XP to a user
 */
export async function awardXP(userId: string, amount: number, reason: string): Promise<void> {
  const startTime = Date.now();

  try {
    const userStatsDoc = db.collection(COLLECTIONS.USER_STATS).doc(userId);
    const doc = await userStatsDoc.get();

    if (!doc.exists) {
      // Create initial stats
      await userStatsDoc.set({
        userId,
        gamificationXP: amount,
        totalCollected: 0,
        streak: 0,
        badges: [],
        lastActivity: new Date(),
      });
    } else {
      // Increment XP
      const stats = doc.data() as UserStats;
      await userStatsDoc.update({
        gamificationXP: (stats.gamificationXP || 0) + amount,
        lastActivity: new Date(),
      });
    }

    const duration = Date.now() - startTime;
    logDbOperation('award_xp', duration, {
      collection: COLLECTIONS.USER_STATS,
      userId,
      amount,
      reason,
    });
  } catch (error) {
    logError('Failed to award XP', error);
  }
}

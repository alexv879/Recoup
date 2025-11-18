
import { db, Timestamp, COLLECTIONS } from '@/lib/firebase';
import { User, UserStats, Achievement } from '@/types/models';
import { NotFoundError } from '@/utils/error';
import { logDbOperation, logInfo, logError } from '@/utils/logger';
import { GAMIFICATION_POINTS, ACHIEVEMENTS } from '@/lib/constants';

/**
 * Gamification Service - Award points and achievements
 */

/**
 * Track a user action and award points
 * @param userId The ID of the user
 * @param action The action performed
 * @param metadata Additional data related to the action
 */
export async function trackUserAction(
  userId: string,
  action: keyof typeof GAMIFICATION_POINTS,
  metadata?: Record<string, any>
): Promise<void> {
  const startTime = Date.now();

  try {
    const points = GAMIFICATION_POINTS[action];
    if (!points) {
      logInfo(`No points defined for action: ${action}`);
      return;
    }

    const userStatsRef = db.collection(COLLECTIONS.USER_STATS).doc(userId);
    const userStatsDoc = await userStatsRef.get();

    let newXP = points;
    let newAchievements: Achievement[] = [];

    if (userStatsDoc.exists) {
      const userStats = userStatsDoc.data() as UserStats;
      newXP = (userStats.gamificationXP || 0) + points;

      // Check for new achievements
      const existingAchievements = userStats.achievements || [];
      const earnedAchievements = await checkAchievements(userId, newXP, existingAchievements);
      newAchievements = [...existingAchievements, ...earnedAchievements];
    } else {
      const earnedAchievements = await checkAchievements(userId, newXP, []);
      newAchievements = [...earnedAchievements];
    }

    await userStatsRef.set(
      {
        userId,
        gamificationXP: newXP,
        achievements: newAchievements,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    logDbOperation('track_user_action', COLLECTIONS.USER_STATS, userId, Date.now() - startTime);
    logInfo(`Awarded ${points} XP to user ${userId} for action: ${action}. Total XP: ${newXP}`);

  } catch (error) {
    logError(`Failed to track user action for user ${userId}`, error);
    throw error;
  }
}

/**
 * Check if a user has earned any new achievements
 * @param userId The ID of the user
 * @param currentXP The user's current XP
 * @param existingAchievements The user's existing achievements
 * @returns A list of newly earned achievements
 */
async function checkAchievements(
  userId: string,
  currentXP: number,
  existingAchievements: Achievement[]
): Promise<Achievement[]> {
  const earnedAchievements: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (existingAchievements.some((a) => a.id === achievement.id)) {
      continue; // Already earned
    }

    let isEarned = false;
    switch (achievement.criteria.type) {
      case 'xp':
        if (currentXP >= achievement.criteria.value) {
          isEarned = true;
        }
        break;
      // Add other criteria checks here (e.g., invoices_created, revenue_collected)
      // This will require fetching more data based on the achievement type
    }

    if (isEarned) {
      const newAchievement: Achievement = {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        dateAwarded: Timestamp.now(),
      };
      earnedAchievements.push(newAchievement);
      logInfo(`User ${userId} earned achievement: ${achievement.name}`);
    }
  }

  return earnedAchievements;
}

/**
 * Calculate comprehensive user statistics for dashboard
 */
export async function calculateUserStats(userId: string): Promise<UserStats> {
  const startTime = Date.now();

  try {
    // Get user stats document
    const userStatsRef = db.collection(COLLECTIONS.USER_STATS).doc(userId);
    const userStatsDoc = await userStatsRef.get();

    let userStats: UserStats;
    if (userStatsDoc.exists) {
      userStats = userStatsDoc.data() as UserStats;
    } else {
      // Initialize default stats
      userStats = {
        userId,
        gamificationXP: 0,
        achievements: [],
        totalInvoiced: 0,
        totalCollected: 0,
        totalReferrals: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
    }

    // Calculate additional stats from invoices
    const invoicesQuery = await db
      .collection(COLLECTIONS.INVOICES)
      .where('freelancerId', '==', userId)
      .get();

    const invoices = invoicesQuery.docs.map(doc => doc.data());
    userStats.totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    userStats.totalCollected = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Calculate collection attempts
    const attemptsQuery = await db
      .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
      .where('freelancerId', '==', userId)
      .get();

    userStats.collectionAttempts = attemptsQuery.size;
    userStats.collectionSuccess = attemptsQuery.docs
      .filter(doc => doc.data().result === 'success').length;

    // Update the document
    await userStatsRef.set({
      ...userStats,
      updatedAt: Timestamp.now(),
    }, { merge: true });

    logDbOperation('calculate_user_stats', COLLECTIONS.USER_STATS, userId, Date.now() - startTime);

    return userStats;
  } catch (error) {
    logError(`Failed to calculate user stats for user ${userId}`, error);
    throw error;
  }
}

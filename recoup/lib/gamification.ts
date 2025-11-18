// NOTE: This implementation assumes the existence of helper functions and database schemas
// as defined in the technical specification (e.g., db access, Invoice/UserStats types).

import { getUserStats } from '../services/userService';
import { Invoice } from '../types/models';
/* import { db } from './firebase';

function calculateDaysOverdue(dueDate: { toDate: () => Date }): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = dueDate.toDate();
    due.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}
*/

export async function updateUserAchievements(userId: string) {
    const stats = await getUserStats(userId);
    if (!stats) {
        console.log(`No stats found for user ${userId} to update achievements.`);
        return [];
    }
    const newBadges: string[] = [];

    if (stats.totalInvoiced >= 500) newBadges.push('first_invoice');
    if (stats.totalCollected >= 5000) newBadges.push('collector_5k');
    if (stats.totalCollected >= 50000) newBadges.push('collector_50k');
    if (stats.onTimePercentage >= 90) newBadges.push('reliable');
    if (stats.streak >= 7) newBadges.push('week_streak');
    if (stats.streak >= 30) newBadges.push('month_streak');
    if (stats.rank && stats.rank <= 100) newBadges.push('top_100');

    // await db.collection('user_stats').doc(userId).update({ badges: newBadges });
    console.log(`User ${userId} earned badges: ${newBadges.join(', ')}`);
    return newBadges;
}

export async function calculateStreak(userId: string): Promise<number> {
    /*
    const invoicesSnapshot = await db.collection('invoices')
      .where('freelancerId', '==', userId)
      .orderBy('dueDate', 'desc')
      .get();
    let streak = 0;
    for (const doc of invoicesSnapshot.docs) {
      const invoice = doc.data() as Invoice;
      if (calculateDaysOverdue(invoice.dueDate) > 0) {
        break; // Streak broken
      }
      streak++;
    }
    await db.collection('user_stats').doc(userId).update({ streak });
    return streak;
    */
    console.log(`[DB] Calculating streak for ${userId}`);
    return 0; // Placeholder for live implementation
}

export async function calculateUserLevel(userId: string): Promise<number> {
    const stats = await getUserStats(userId);
    if (!stats) {
        console.log(`No stats found for user ${userId} to calculate level.`);
        return 1;
    }
    let points = 0;
    points += stats.totalCollected / 1000; // 1 point per £1000 collected
    points += stats.streak; // 1 point per day of streak
    points += stats.badges.length * 10; // 10 points per badge

    const level = Math.floor(points / 100) + 1; // 100 points per level
    console.log(`User ${userId} is level ${level} with ${points} points.`);
    return level;
}
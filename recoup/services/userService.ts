// NOTE: This file provides mocked user data as defined in the technical specification.
// It allows for development of services and APIs without a live database connection.

import { User, UserStats } from '../types/models'; // Assuming types are defined here

/*
import { db } from '../lib/firebase'; // Assumed firebase admin instance
*/

export async function getUser(userId: string): Promise<User | null> {
    console.log(`[DB] Fetching user for userId: ${userId}`);
    // const userDoc = await db.collection('users').doc(userId).get();
    // if (!userDoc.exists) return null;
    // return userDoc.data() as User;
    return null; // Placeholder for live implementation
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
    console.log(`[DB] Fetching user stats for userId: ${userId}`);
    // const statsDoc = await db.collection('user_stats').doc(userId).get();
    // if (!statsDoc.exists) return null;
    // return statsDoc.data() as UserStats;
    return null; // Placeholder for live implementation
}
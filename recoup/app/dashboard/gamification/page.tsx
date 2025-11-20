'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Custom/Card';
import { Badge } from '@/components/Custom/Badge';
import { Progress } from '@/components/Custom/Progress';

interface GamificationStats {
    xp: number;
    level: number;
    nextLevelXP: number;
    streak: number;
    badges: Array<{
        badgeId: string;
        badgeName: string;
        badgeDescription: string;
        badgeIcon: string;
        earnedAt: { _seconds: number };
    }>;
}

interface LeaderboardEntry {
    userId: string;
    fullName: string;
    xp: number;
    level: number;
    rank: number;
}

/**
 * Gamification Page
 * Shows user's XP, level, badges, streaks, and leaderboard
 */
export default function GamificationPage() {
    const [stats, setStats] = useState<GamificationStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, leaderboardRes] = await Promise.all([
                fetch('/api/gamification/stats'),
                fetch('/api/gamification/leaderboard'),
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (leaderboardRes.ok) {
                const leaderboardData = await leaderboardRes.json();
                setLeaderboard(leaderboardData.leaderboard || []);
            }
        } catch (error) {
            console.error('Failed to fetch gamification data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: { _seconds: number }) => {
        return new Date(timestamp._seconds * 1000).toLocaleDateString('en-GB');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    const progressPercentage = stats
        ? Math.min(100, (stats.xp / stats.nextLevelXP) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center">
                        <div className="text-6xl mb-4">⭐</div>
                        <h1 className="text-4xl font-bold mb-2">Level {stats?.level || 1}</h1>
                        <p className="text-xl opacity-90">{stats?.xp || 0} XP</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Progress Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* XP Progress */}
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Progress</h2>

                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Level {stats?.level || 1}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {stats?.xp || 0} / {stats?.nextLevelXP || 100} XP
                                    </span>
                                </div>
                                <Progress value={progressPercentage} className="h-3" />
                                <p className="text-sm text-gray-600 mt-2">
                                    {(stats?.nextLevelXP || 100) - (stats?.xp || 0)} XP to next level
                                </p>
                            </div>

                            {/* Streak */}
                            {stats && stats.streak > 0 && (
                                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">🔥</span>
                                        <div>
                                            <p className="text-2xl font-bold text-orange-600">
                                                {stats.streak} Day Streak
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Keep it going! Create an invoice today to maintain your streak
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* XP Opportunities */}
                            <div className="mt-6 pt-6 border-t">
                                <h3 className="font-semibold text-gray-900 mb-4">Earn More XP</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">📄</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Create an Invoice</p>
                                                <p className="text-sm text-gray-600">+10 XP</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">💰</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Get Paid</p>
                                                <p className="text-sm text-gray-600">+50 XP</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">🤖</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Enable Collections</p>
                                                <p className="text-sm text-gray-600">+25 XP</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">✅</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Collect Overdue Payment</p>
                                                <p className="text-sm text-gray-600">+100 XP</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Badges */}
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                Badges ({stats?.badges?.length || 0})
                            </h2>

                            {stats?.badges && stats.badges.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {stats.badges.map((badge) => (
                                        <div
                                            key={badge.badgeId}
                                            className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200 text-center"
                                        >
                                            <div className="text-4xl mb-2">{badge.badgeIcon || '🏆'}</div>
                                            <h4 className="font-semibold text-gray-900 mb-1">
                                                {badge.badgeName}
                                            </h4>
                                            <p className="text-xs text-gray-600 mb-2">
                                                {badge.badgeDescription}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Earned {formatDate(badge.earnedAt)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-6xl mb-4">🏆</div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        No badges yet
                                    </h3>
                                    <p className="text-gray-600">
                                        Complete achievements to earn your first badge!
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Leaderboard */}
                    <div>
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Leaderboard</h2>

                            {leaderboard.length > 0 ? (
                                <div className="space-y-3">
                                    {leaderboard.map((entry, index) => (
                                        <div
                                            key={entry.userId}
                                            className={`flex items-center gap-3 p-3 rounded-lg ${index === 0
                                                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100'
                                                    : index === 1
                                                        ? 'bg-gradient-to-r from-gray-100 to-gray-200'
                                                        : index === 2
                                                            ? 'bg-gradient-to-r from-orange-100 to-yellow-100'
                                                            : 'bg-gray-50'
                                                }`}
                                        >
                                            <div className="text-2xl font-bold w-8">
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{entry.fullName}</p>
                                                <p className="text-sm text-gray-600">
                                                    Level {entry.level} • {entry.xp} XP
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No leaderboard data yet</p>
                                </div>
                            )}
                        </Card>

                        {/* Level System */}
                        <Card className="p-6 mt-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Level System</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Level 1</span>
                                    <span className="font-semibold">0 XP</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Level 2</span>
                                    <span className="font-semibold">100 XP</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Level 3</span>
                                    <span className="font-semibold">250 XP</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Level 4</span>
                                    <span className="font-semibold">500 XP</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Level 5</span>
                                    <span className="font-semibold">1,000 XP</span>
                                </div>
                                <div className="text-center pt-2 text-gray-500">
                                    ...and 5 more levels
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

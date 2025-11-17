/**
 * USAGE QUOTA WIDGET
 *
 * Displays current usage quota for the logged-in user
 * Shows collections used vs limit with visual progress bar
 *
 * Features:
 * - Real-time usage stats
 * - Color-coded progress (green <50%, yellow 50-80%, red >80%)
 * - Upgrade CTA when >80% used
 * - Tier name and limit display
 *
 * Used on: Dashboard home page
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { logError } from '@/utils/logger';
import Link from 'next/link';

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
  resetDate: string;
  tier: string;
}

export function UsageQuotaWidget() {
  const { userId } = useAuth();
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    async function fetchQuota() {
      try {
        const res = await fetch('/api/user/quota', {
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch quota');
        }

        const data = await res.json();
        setQuota(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching quota:', err);
        setError('Unable to load quota');
        logError('Error fetching quota', err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuota();

    // Refresh every 5 minutes
    const interval = setInterval(fetchQuota, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);

  if (!userId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (error || !quota) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-red-600">{error || 'Unable to load usage quota'}</p>
      </div>
    );
  }

  const isUnlimited = quota.limit >= 999999;
  const isNearLimit = quota.percentageUsed >= 80;
  const isWarning = quota.percentageUsed >= 50 && quota.percentageUsed < 80;

  // Color scheme based on usage
  const progressColor = isNearLimit
    ? 'bg-red-500'
    : isWarning
    ? 'bg-yellow-500'
    : 'bg-green-500';

  const textColor = isNearLimit
    ? 'text-red-700'
    : isWarning
    ? 'text-yellow-700'
    : 'text-green-700';

  const bgColor = isNearLimit
    ? 'bg-red-50'
    : isWarning
    ? 'bg-yellow-50'
    : 'bg-green-50';

  return (
    <div className={`rounded-lg shadow p-6 ${bgColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Monthly Collections Quota
          </h3>
          <p className="text-sm text-gray-600 capitalize">
            {quota.tier} tier
          </p>
        </div>

        {/* Upgrade badge */}
        {isNearLimit && !isUnlimited && (
          <Link
            href="/pricing"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
          >
            Upgrade Now
          </Link>
        )}
      </div>

      {/* Usage Stats */}
      <div className="space-y-3">
        {isUnlimited ? (
          <div className="text-center py-4">
            <p className="text-2xl font-bold text-green-600">∞</p>
            <p className="text-sm text-gray-600 mt-1">Unlimited collections</p>
            <p className="text-xs text-gray-500 mt-2">
              {quota.used} sent this month
            </p>
          </div>
        ) : (
          <>
            {/* Usage Numbers */}
            <div className="flex items-baseline justify-between">
              <p className={`text-2xl font-bold ${textColor}`}>
                {quota.used} / {quota.limit}
              </p>
              <p className="text-sm text-gray-600">
                {quota.remaining} remaining
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 transition-all duration-500 ${progressColor}`}
                style={{ width: `${Math.min(quota.percentageUsed, 100)}%` }}
              />
            </div>

            {/* Warning Messages */}
            {isNearLimit && (
              <div className="bg-white border-l-4 border-red-500 p-3 mt-3">
                <p className="text-sm font-medium text-red-700">
                  You're running low on collections!
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Only {quota.remaining} left. Upgrade to get more.
                </p>
              </div>
            )}

            {isWarning && !isNearLimit && (
              <div className="bg-white border-l-4 border-yellow-500 p-3 mt-3">
                <p className="text-sm font-medium text-yellow-700">
                  You've used {quota.percentageUsed}% of your quota
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Consider upgrading if you need more collections.
                </p>
              </div>
            )}

            {/* Reset Date */}
            <p className="text-xs text-gray-500 text-center mt-2">
              Quota resets on {new Date(quota.resetDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </>
        )}
      </div>

      {/* Learn More Link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link
          href="/pricing"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View all plans →
        </Link>
      </div>
    </div>
  );
}

/**
 * Compact Usage Quota Badge
 * Smaller version for header/nav
 */
export function UsageQuotaBadge() {
  const { userId } = useAuth();
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchQuota() {
      try {
        const res = await fetch('/api/user/quota', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setQuota(data);
        }
      } catch (err) {
        console.error('Error fetching quota:', err);
      }
    }

    fetchQuota();
    const interval = setInterval(fetchQuota, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  if (!quota) return null;

  const isUnlimited = quota.limit >= 999999;
  const isNearLimit = quota.percentageUsed >= 80;

  if (isUnlimited) {
    return (
      <div className="inline-flex items-center gap-1 text-xs text-gray-600">
        <span>∞</span>
        <span className="hidden sm:inline">collections</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isNearLimit
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      <span>{quota.used}/{quota.limit}</span>
      <span className="hidden sm:inline">collections</span>
    </div>
  );
}

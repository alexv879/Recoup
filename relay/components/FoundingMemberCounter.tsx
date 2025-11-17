/**
 * FOUNDING MEMBER COUNTER COMPONENT
 *
 * Displays real-time count of remaining founding member spots
 * Uses client-side polling to fetch latest count every 30 seconds
 *
 * Features:
 * - Auto-refresh every 30 seconds
 * - Red pulsing animation when <10 spots remain
 * - Loading state
 * - Error handling
 *
 * Used on: /pricing page
 */

'use client';

import { useEffect, useState } from 'react';
import { logError } from '@/utils/logger';

interface FoundingMemberStatus {
  spotsRemaining: number;
  totalFoundingMembers: number;
  isAvailable: boolean;
  percentageFilled: number;
  urgencyLevel: 'normal' | 'high' | 'critical' | 'sold_out';
}

export function FoundingMemberCounter() {
  const [status, setStatus] = useState<FoundingMemberStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/founding-members/status', {
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch founding member status');
        }

        const data = await res.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching founding member status:', err);
        setError('Unable to load');
        logError('Error fetching founding member status', err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    // Fetch immediately
    fetchStatus();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <span className="font-bold animate-pulse">...</span>;
  }

  if (error || !status) {
    return <span className="font-bold text-red-300">{error || '?'}</span>;
  }

  if (status.urgencyLevel === 'sold_out') {
    return (
      <span className="font-bold text-red-400">
        SOLD OUT
      </span>
    );
  }

  const urgencyClasses = {
    normal: 'font-bold',
    high: 'font-bold text-yellow-300',
    critical: 'font-bold text-red-300 animate-pulse',
    sold_out: 'font-bold text-red-400',
  };

  return (
    <span className={urgencyClasses[status.urgencyLevel]}>
      {status.spotsRemaining}
    </span>
  );
}

/**
 * Founding Member Progress Bar
 * Shows how many spots have been filled
 */
export function FoundingMemberProgress() {
  const [status, setStatus] = useState<FoundingMemberStatus | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/founding-members/status', {
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.error('Error fetching status:', err);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <div className="flex items-center justify-between text-sm text-white opacity-90 mb-2">
        <span>{status.totalFoundingMembers}/50 claimed</span>
        <span>{status.spotsRemaining} spots left</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 transition-all duration-500 ${
            status.percentageFilled >= 90
              ? 'bg-red-400'
              : status.percentageFilled >= 70
              ? 'bg-yellow-400'
              : 'bg-green-400'
          }`}
          style={{ width: `${status.percentageFilled}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Founding Member Badge
 * Shows user's founding member number
 */
export function FoundingMemberBadge({ memberNumber }: { memberNumber: number }) {
  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
      <span className="text-xl">🏆</span>
      <span>Founding Member #{memberNumber}</span>
    </div>
  );
}

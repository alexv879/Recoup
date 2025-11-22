/**
 * Quota Limit Warning Component
 * Shows warning when user is approaching their quota limit
 */

'use client';

import Link from 'next/link';

interface QuotaLimitWarningProps {
  quotaType: 'expenses' | 'ocr' | 'collections';
  used: number;
  limit: number | null; // null = unlimited
  userTier: 'free' | 'pro' | 'starter' | 'growth';
}

export function QuotaLimitWarning({
  quotaType,
  used,
  limit,
  userTier,
}: QuotaLimitWarningProps) {
  // Don't show warning if unlimited
  if (limit === null) return null;

  // Calculate usage percentage
  const usagePercentage = (used / limit) * 100;

  // Only show warning if >80% used
  if (usagePercentage < 80) return null;

  const isExceeded = used >= limit;
  const remaining = Math.max(0, limit - used);

  const quotaLabels: Record<string, string> = {
    expenses: 'expenses',
    ocr: 'OCR receipts',
    collections: 'collections',
  };

  const quotaLabel = quotaLabels[quotaType];

  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        isExceeded
          ? 'bg-red-50 border-red-300'
          : usagePercentage >= 90
          ? 'bg-amber-50 border-amber-300'
          : 'bg-yellow-50 border-yellow-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {isExceeded ? '🚫' : usagePercentage >= 90 ? '⚠️' : '⏰'}
            </span>
            <h3
              className={`font-semibold ${
                isExceeded
                  ? 'text-red-900'
                  : usagePercentage >= 90
                  ? 'text-amber-900'
                  : 'text-yellow-900'
              }`}
            >
              {isExceeded ? `${quotaLabel} limit reached` : `${quotaLabel} limit approaching`}
            </h3>
          </div>

          <p
            className={`text-sm mb-3 ${
              isExceeded
                ? 'text-red-800'
                : usagePercentage >= 90
                ? 'text-amber-800'
                : 'text-yellow-800'
            }`}
          >
            {isExceeded ? (
              <>
                You've used <strong>{used}</strong> of your <strong>{limit}</strong> {quotaLabel} this month.
                {userTier === 'free' && ' Upgrade to Pro for unlimited.'}
              </>
            ) : (
              <>
                You have <strong>{remaining}</strong> {quotaLabel} remaining this month ({usagePercentage.toFixed(0)}% used).
              </>
            )}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className={`h-2 rounded-full transition-all ${
                isExceeded
                  ? 'bg-red-600'
                  : usagePercentage >= 90
                  ? 'bg-amber-500'
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          <p
            className={`text-xs ${
              isExceeded
                ? 'text-red-700'
                : usagePercentage >= 90
                ? 'text-amber-700'
                : 'text-yellow-700'
            }`}
          >
            {isExceeded ? (
              <>You won't be able to add more {quotaLabel} until next month or until you upgrade.</>
            ) : (
              <>Your quota resets on the 1st of each month.</>
            )}
          </p>
        </div>

        {/* Upgrade CTA (only for free tier) */}
        {userTier === 'free' && (
          <Link
            href="/dashboard/upgrade?plan=pro"
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition ${
              isExceeded
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Upgrade to Pro
          </Link>
        )}
      </div>
    </div>
  );
}

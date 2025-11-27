/**
 * Upgrade Banner Component
 * Shows upgrade CTA for free tier users
 */

'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

interface UpgradeBannerProps {
  variant?: 'pro' | 'mtd-pro';
  context?: string; // e.g., "expenses", "ocr", "collections"
}

export function UpgradeBanner({ variant = 'pro', context }: UpgradeBannerProps) {
  const { user } = useUser();

  // Don't show if user is not logged in
  if (!user) return null;

  // TODO: Check user's subscription tier from user metadata
  // For now, always show (you can add tier checking later)
  const userTier = (user.publicMetadata?.subscriptionTier as string) || 'free';

  // Don't show Pro banner if user already has Pro or higher
  if (variant === 'pro' && userTier !== 'free') return null;

  const content = {
    pro: {
      title: '🚀 Upgrade to Pro',
      description: 'Get unlimited expenses, OCR, and advanced revenue recovery features',
      cta: 'Upgrade to Pro',
      price: '£10/month',
      gradient: 'from-blue-600 to-blue-700',
    },
    'mtd-pro': {
      title: '🇬🇧 Upgrade to MTD-Pro',
      description: 'HMRC quarterly filing + all Pro features',
      cta: 'Join Waitlist',
      price: '£20/month',
      gradient: 'from-purple-600 to-indigo-700',
    },
  };

  const config = content[variant];

  return (
    <div className={`bg-gradient-to-r ${config.gradient} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{config.title}</h3>
          <p className="text-sm opacity-90 mb-1">{config.description}</p>
          {context && (
            <p className="text-xs opacity-75">
              {getContextMessage(context)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold">{config.price}</div>
            <div className="text-xs opacity-75">per month</div>
          </div>
          <Link
            href={`/dashboard/upgrade?plan=${variant}`}
            className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition whitespace-nowrap"
          >
            {config.cta} →
          </Link>
        </div>
      </div>
    </div>
  );
}

function getContextMessage(context: string): string {
  const messages: Record<string, string> = {
    expenses: 'Free tier: 50 expenses/month • Pro: Unlimited',
    ocr: 'Free tier: 10 OCR/month • Pro: Unlimited',
    collections: 'Free tier: 1 collection/month • Pro: 25 collections/month',
    storage: 'Free tier: 100MB • Pro: 1GB storage',
  };
  return messages[context] || '';
}

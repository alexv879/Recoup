/**
 * Upgrade Button Component
 * Simple inline upgrade CTA that can be placed anywhere
 */

'use client';

import Link from 'next/link';

interface UpgradeButtonProps {
  plan?: 'pro' | 'mtd-pro';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline';
  className?: string;
}

export function UpgradeButton({
  plan = 'pro',
  size = 'md',
  variant = 'solid',
  className = '',
}: UpgradeButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    solid: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50',
  };

  const planLabels = {
    pro: 'Upgrade to Pro',
    'mtd-pro': 'Upgrade to MTD-Pro',
  };

  return (
    <Link
      href={`/dashboard/upgrade?plan=${plan}`}
      className={`inline-flex items-center gap-2 rounded-lg font-semibold transition shadow-sm ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <span>{planLabels[plan]}</span>
      <span>→</span>
    </Link>
  );
}

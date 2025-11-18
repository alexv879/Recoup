/**
 * EMPTY STATE COMPONENT
 * Based on: dashboard-saas-onboarding.md (RESEARCH_SUMMARIES_MAPPING.md #5)
 *
 * Empty states with illustration + single CTA
 * Reduces friction and provides clear next action
 */

'use client';

import React from 'react';
import { FileText, Send, DollarSign, Plus } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  type: 'invoices' | 'reminders' | 'payments';
  className?: string;
}

const EMPTY_STATE_CONFIG = {
  invoices: {
    icon: FileText,
    title: 'No invoices yet',
    description: 'Create your first invoice to start tracking payments',
    ctaText: 'Create Invoice',
    ctaHref: '/dashboard/invoices/new',
    illustration: '📄',
  },
  reminders: {
    icon: Send,
    title: 'No reminders scheduled',
    description: 'Set up automated reminders to get paid faster',
    ctaText: 'View Invoices',
    ctaHref: '/dashboard/invoices',
    illustration: '📧',
  },
  payments: {
    icon: DollarSign,
    title: 'No payments received',
    description: 'Track payments as they come in from your clients',
    ctaText: 'View Dashboard',
    ctaHref: '/dashboard',
    illustration: '💰',
  },
};

export function EmptyState({ type, className = '' }: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
      role="region"
      aria-label={`Empty state: ${config.title}`}
    >
      {/* Illustration */}
      <div className="mb-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-4xl" aria-hidden="true">
            {config.illustration}
          </span>
        </div>
      </div>

      {/* Icon */}
      <Icon className="w-12 h-12 text-gray-400 mb-4" aria-hidden="true" />

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h3>

      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-sm">{config.description}</p>

      {/* CTA Button (single, prominent action) */}
      <Link
        href={config.ctaHref}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
        {config.ctaText}
      </Link>

      {/* Helper text */}
      <p className="mt-4 text-sm text-gray-500">
        Get started in less than 30 seconds
      </p>
    </div>
  );
}

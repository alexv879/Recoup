'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/UI/Button';

interface EmptyStateProps {
    icon?: React.ReactNode;
    headline: string;
    description: string;
    primaryCTA: {
        label: string;
        href: string;
    };
    secondaryCTAs?: Array<{
        label: string;
        href: string;
    }>;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    headline,
    description,
    primaryCTA,
    secondaryCTAs = [],
    className = ''
}) => {
    return (
        <div
            className={`flex flex-col items-center justify-center min-h-[400px] p-10 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}
        >
            {/* Visual Element */}
            {icon && (
                <div className="mb-6 opacity-70">
                    {typeof icon === 'string' ? (
                        <div className="text-7xl">{icon}</div>
                    ) : (
                        icon
                    )}
                </div>
            )}

            {/* Headline */}
            <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-snug">
                {headline}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 max-w-md mb-6 leading-relaxed">
                {description}
            </p>

            {/* Upgrade Prompt for Free Tier Users */}
            {headline.toLowerCase().includes('collection') && (
                <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded px-4 py-3 mb-4">
                    <strong>Upgrade for more collections:</strong> Free plan users can send 1 collection per month. Upgrade to Starter or Pro for higher limits and premium features.
                </div>
            )}

            {/* Primary CTA */}
            <Link href={primaryCTA.href}>
                <Button size="lg" className="min-h-[48px] px-8">
                    {primaryCTA.label}
                </Button>
            </Link>

            {/* Secondary CTAs */}
            {secondaryCTAs.length > 0 && (
                <div className="mt-5 flex items-center gap-2 text-sm">
                    {secondaryCTAs.map((cta, index) => (
                        <React.Fragment key={cta.href}>
                            {index > 0 && <span className="text-gray-400">•</span>}
                            <Link
                                href={cta.href}
                                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                            >
                                {cta.label}
                            </Link>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

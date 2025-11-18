/**
 * Escalation Status Badge Component
 * 
 * Based on:
 * - collections_implementation_guide.md §1.1 (Status Indicators & Color Coding)
 * - WCAG AAA color contrast requirements (7:1 minimum)
 * 
 * Accessibility Features:
 * - Color + icon + text (never color alone)
 * - ARIA labels for screen readers
 * - Shows days overdue in parentheses
 * - Keyboard accessible
 */

'use client';

import React from 'react';
import { EscalationLevel, ESCALATION_CONFIGS, getEscalationAriaLabel } from '@/types/escalation';

interface EscalationStatusBadgeProps {
    level: EscalationLevel;
    daysOverdue: number;
    size?: 'sm' | 'md' | 'lg';
    showDays?: boolean;
}

export function EscalationStatusBadge({
    level,
    daysOverdue,
    size = 'md',
    showDays = true,
}: EscalationStatusBadgeProps) {
    const config = ESCALATION_CONFIGS[level];
    const ariaLabel = getEscalationAriaLabel(level, daysOverdue);

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
    };

    return (
        <div
            role="status"
            aria-label={ariaLabel}
            className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
            style={{
                backgroundColor: `${config.badgeColor}15`, // 15% opacity background
                color: config.badgeColor,
                border: `1.5px solid ${config.badgeColor}`,
            }}
        >
            <span aria-hidden="true" className="text-base leading-none">
                {config.badgeIcon}
            </span>
            <span className="font-semibold">
                {config.badgeText}
            </span>
            {showDays && daysOverdue > 0 && (
                <span className="opacity-80">
                    ({daysOverdue}d)
                </span>
            )}
        </div>
    );
}

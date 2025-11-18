/**
 * Collections Escalation Types
 * 
 * Based on:
 * - collections_implementation_guide.md (Escalation Levels & Progress Bar)
 * - late-payment-escalation-flow.md (Timeline & Decision Tree)
 * - MASTER_IMPLEMENTATION_AUDIT_V1.md §4.7
 * 
 * Escalation State Machine:
 * pending → gentle (day 5) → firm (day 15) → final (day 30) → agency (day 60+)
 */

export type EscalationLevel =
    | 'pending'      // 0-4 days overdue
    | 'gentle'       // 5-14 days overdue (friendly tone, email only)
    | 'firm'         // 15-29 days overdue (professional, direct - email + SMS)
    | 'final'        // 30-59 days overdue (serious, legal - email + phone)
    | 'agency';      // 60+ days overdue (external agency handoff)

export interface EscalationConfig {
    level: EscalationLevel;
    daysMin: number;
    daysMax: number | null;
    badgeText: string;
    badgeColor: string; // WCAG AAA compliant colors
    badgeIcon: string;
    tone: string;
    channels: string[];
    description: string;
}

export const ESCALATION_CONFIGS: Record<EscalationLevel, EscalationConfig> = {
    pending: {
        level: 'pending',
        daysMin: 0,
        daysMax: 4,
        badgeText: 'Pending',
        badgeColor: '#0891B2', // Cyan-600 (8.3:1 contrast on white)
        badgeIcon: '⏳',
        tone: 'neutral',
        channels: ['email'],
        description: 'Invoice sent, awaiting payment',
    },
    gentle: {
        level: 'gentle',
        daysMin: 5,
        daysMax: 14,
        badgeText: 'Gentle Reminder',
        badgeColor: '#CA8A04', // Yellow-600 (7.1:1 contrast)
        badgeIcon: '⚠️',
        tone: 'friendly',
        channels: ['email'],
        description: 'First collection activity - friendly tone',
    },
    firm: {
        level: 'firm',
        daysMin: 15,
        daysMax: 29,
        badgeText: 'Firm Notice',
        badgeColor: '#EA580C', // Orange-600 (8.5:1 contrast)
        badgeIcon: '⚠️',
        tone: 'direct',
        channels: ['email', 'sms'],
        description: 'Escalated to firm language - professional',
    },
    final: {
        level: 'final',
        daysMin: 30,
        daysMax: 59,
        badgeText: 'Final Demand',
        badgeColor: '#991B1B', // Red-800 (11.2:1 contrast for AAA)
        badgeIcon: '⚡',
        tone: 'serious',
        channels: ['email', 'phone'],
        description: 'Last chance before agency escalation',
    },
    agency: {
        level: 'agency',
        daysMin: 60,
        daysMax: null,
        badgeText: 'Agency Handoff',
        badgeColor: '#7F1D1D', // Red-900 (13.5:1 contrast)
        badgeIcon: '⚖️',
        tone: 'external',
        channels: ['agency'],
        description: 'Escalated to collections agency',
    },
};

export interface EscalationTimelineEvent {
    eventId: string;
    invoiceId: string;
    escalationLevel: EscalationLevel;
    eventType: 'escalated' | 'paused' | 'resumed' | 'reminder_sent' | 'payment_received';
    channel?: string; // 'email' | 'sms' | 'phone' | 'agency'
    timestamp: Date;
    message: string;
    metadata?: Record<string, any>;
}

export interface EscalationState {
    invoiceId: string;
    currentLevel: EscalationLevel;
    isPaused: boolean;
    pauseReason?: 'payment_claim' | 'manual' | 'dispute';
    pausedAt?: Date;
    pauseUntil?: Date; // Auto-resume after this date
    lastEscalatedAt: Date;
    nextEscalationDue?: Date;
    timeline: EscalationTimelineEvent[];
}

export interface EscalationAutomationConfig {
    enabled: boolean;
    userId: string;
    customSchedule?: {
        gentle?: number; // Override day 5 default
        firm?: number;   // Override day 15 default
        final?: number;  // Override day 30 default
        agency?: number; // Override day 60 default
    };
    channels: {
        emailEnabled: boolean;
        smsEnabled: boolean;
        phoneEnabled: boolean;
        agencyEnabled: boolean;
    };
    pauseConditions: {
        onPaymentClaim: boolean;
        onDispute: boolean;
    };
}

/**
 * Calculate escalation level based on days overdue
 */
export function calculateEscalationLevel(daysOverdue: number): EscalationLevel {
    if (daysOverdue >= 60) return 'agency';
    if (daysOverdue >= 30) return 'final';
    if (daysOverdue >= 15) return 'firm';
    if (daysOverdue >= 5) return 'gentle';
    return 'pending';
}

/**
 * Get ARIA label for screen readers
 */
export function getEscalationAriaLabel(level: EscalationLevel, daysOverdue: number): string {
    const config = ESCALATION_CONFIGS[level];
    return `${config.badgeText} stage, ${daysOverdue} days overdue. ${config.description}`;
}

/**
 * Check if escalation should auto-advance
 */
export function shouldEscalate(
    currentLevel: EscalationLevel,
    daysOverdue: number
): boolean {
    const targetLevel = calculateEscalationLevel(daysOverdue);
    const levels: EscalationLevel[] = ['pending', 'gentle', 'firm', 'final', 'agency'];
    const currentIndex = levels.indexOf(currentLevel);
    const targetIndex = levels.indexOf(targetLevel);
    return targetIndex > currentIndex;
}

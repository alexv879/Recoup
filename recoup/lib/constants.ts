/**
 * Application Constants
 * Centralized configuration for gamification, limits, and other app settings
 */

export const GAMIFICATION_POINTS = {
    // Invoice actions
    invoice_created: 10,
    first_invoice_created: 50,
    invoice_paid: 25,
    invoice_overdue: -5,

    // Collection actions
    collection_reminder_sent: 5,
    collection_call_made: 15,
    payment_collected: 50,

    // Voice actions
    voice_transcript_finalized: 5,
    voice_invoice_submitted: 10,

    // Onboarding actions
    onboarding_step_completed: 20,
    onboarding_completed: 100,

    // Referral actions
    referral_invite_sent: 10,
    referral_signup: 25,
    referral_payment: 100,

    // Social actions
    feedback_submitted: 5,
    review_submitted: 10,
} as const;

export const ACHIEVEMENTS = {
    FIRST_INVOICE: {
        id: 'first_invoice',
        name: 'First Steps',
        description: 'Created your first invoice',
        icon: '📄',
        xpRequired: 50,
        category: 'onboarding',
    },
    PAYMENT_COLLECTOR: {
        id: 'payment_collector',
        name: 'Payment Collector',
        description: 'Collected your first payment',
        icon: '💰',
        xpRequired: 100,
        category: 'collections',
    },
    VOICE_MASTER: {
        id: 'voice_master',
        name: 'Voice Master',
        description: 'Used voice input 10 times',
        icon: '🎤',
        xpRequired: 150,
        category: 'voice',
    },
    REFERRAL_CHAMPION: {
        id: 'referral_champion',
        name: 'Referral Champion',
        description: 'Referred 5 friends',
        icon: '👥',
        xpRequired: 200,
        category: 'referrals',
    },
    CONSISTENT_CREATOR: {
        id: 'consistent_creator',
        name: 'Consistent Creator',
        description: 'Created 50 invoices',
        icon: '📊',
        xpRequired: 500,
        category: 'productivity',
    },
} as const;
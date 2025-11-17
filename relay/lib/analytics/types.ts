// TypeScript types for analytics events
export type AnalyticsEventType =
    | 'signup_initiated'
    | 'signup_completed'
    | 'email_verified'
    | 'referral_applied'
    | 'first_invoice_created'
    | 'invoice_details_filled'
    | 'invoice_sent_to_client'
    | 'first_reminder_set'
    | 'payment_received_via_relay'
    | 'invoice_view'
    | 'reminder_delivered'
    | 'report_generated'
    | 'automation_rule_created'
    | 'help_content_viewed'
    | 'upgrade_cta_shown'
    | 'upgrade_cta_clicked'
    | 'upgrade_started'
    | 'payment_failed'
    | 'subscription_activated'
    | 'invoice_dispute_filed'
    | 'user_login'
    | 'subscription_renewed'
    | 'subscription_cancelled'
    // Batch 2 events
    | 'notification_delivered'
    | 'badge_awarded'
    | 'support_ticket_escalated'
    | 'experiment_exposed'
    | 'retention_purge_executed'
    | 'fraud_flagged'
    | 'social_proof_impression'
    | 'behavioral_trigger_incomplete_invoice'
    | 'behavioral_trigger_invoice_created_not_sent';

export interface AnalyticsEvent {
    type: AnalyticsEventType;
    userId: string;
    timestamp: number;
    [key: string]: any;
}

export interface AnalyticsEventResult {
    success: boolean;
    error?: string;
}

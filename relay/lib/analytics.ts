/**
 * ANALYTICS EVENT LAYER
 *
 * Comprehensive event tracking for Relay using Mixpanel/Amplitude
 * Based on research doc: 30-core event schema for funnel optimization
 *
 * Events cover: Signup → Invoice → Send → Payment → Upgrade → Referral → Voice
 *
 * Usage:
 * - trackEvent('invoice_created', { amount: 500, currency: 'GBP' })
 * - identifyUser(userId, { email, tier, createdAt })
 * - trackPageView('/dashboard')
 */

'use client';

import { logInfo, logError } from '@/utils/logger';

// Environment check - only track in production (or set NEXT_PUBLIC_ENABLE_ANALYTICS=true in dev)
const ANALYTICS_ENABLED =
  process.env.NODE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

// ============================================================
// EVENT SCHEMA (30 Core Events from Research)
// Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.8
//           RESEARCH_SUMMARIES_MAPPING.md Event Source Table
// All event names use snake_case as per research spec
// ============================================================

/**
 * Signup & Activation Events (P0)
 */
export type SignupEvent =
  | 'signup_started'              // User began signup form
  | 'signup_completed'            // User account created
  | 'email_verified'              // Email verification confirmed
  | 'activation_step_completed'   // Onboarding checklist step done
  | 'onboarding_checklist_view';  // User viewed onboarding panel

/**
 * Invoice Events (P0)
 */
export type InvoiceEvent =
  | 'first_invoice_created'       // First invoice milestone (activation)
  | 'invoice_created'             // Any invoice created
  | 'invoice_sent'                // Invoice sent to client
  | 'invoice_overdue_view';       // User viewed overdue invoice

/**
 * Payment Events (P0)
 */
export type PaymentEvent =
  | 'payment_received'            // Client paid invoice
  | 'payment_claim_submitted'     // Client clicked "I Paid"
  | 'payment_claim_status_changed' // Verification status updated (approved/rejected)
  | 'payment_evidence_uploaded'   // Evidence file uploaded (Phase 2 Task 7)
  | 'payment_claim_auto_rejected' // Claim auto-rejected due to deadline expiry
  | 'verification_reminder_sent'; // Verification deadline reminder sent (24h or 6h)

/**
 * Collections Events (P0)
 */
export type CollectionsEvent =
  | 'reminder_scheduled'          // Reminder scheduled for invoice
  | 'collections_escalated'       // Escalation level changed (gentle→firm→final→agency)
  | 'escalation_paused'           // Collections automation paused for invoice
  | 'escalation_resumed'          // Collections automation resumed for invoice
  | 'email_template_previewed'    // Email template preview loaded
  | 'late_payment_interest_calculated' // Interest calculator viewed
  | 'interest_manually_added_initiated' // User clicked to add interest to invoice
  | 'email_sent'                  // Reminder email sent via SendGrid
  | 'email_delivered'             // Email successfully delivered (SendGrid webhook)
  | 'email_failed'                // Email failed to send (SendGrid webhook)
  | 'sms_sent';                   // SMS reminder sent via Twilio

/**
 * Voice Input Events (P0)
 */
export type VoiceEvent =
  | 'voice_recording_started'     // User pressed mic button
  | 'voice_transcript_finalized'  // Transcript completed
  | 'voice_invoice_submitted';    // Invoice created via voice

/**
 * Pricing & Subscription Events (P0)
 * Phase 2 Task 8: Pricing V3 events
 */
export type PricingEvent =
  | 'pricing_view'                // User viewed pricing page (legacy)
  | 'pricing_view_v3'             // User viewed Pricing V3 page (3-tier)
  | 'pricing_toggle_annual'       // User toggled annual/monthly billing
  | 'plan_cta_click'              // User clicked plan CTA button (legacy)
  | 'plan_upgrade_initiated'      // User initiated upgrade to higher tier (V3)
  | 'subscription_activated';     // Subscription payment successful

/**
 * Referral Events (P1)
 */
export type ReferralEvent =
  | 'referral_link_copied'        // User copied referral link
  | 'referral_signup'             // Referred user signed up
  | 'referral_paid_conversion';   // Referred user upgraded to paid

/**
 * Support & Help Events (P1)
 */
export type SupportEvent =
  | 'help_article_view'           // User viewed KB article
  | 'support_ticket_created';     // Support ticket opened

/**
 * Gamification & Growth Events (P2)
 */
export type GrowthEvent =
  | 'badge_awarded'               // User earned achievement badge
  | 'k_factor_report_generated'   // Weekly K-factor calculation job
  | 'tool_interest_calculated'    // User used late payment calculator
  | 'dynamic_stat_displayed';     // Social proof stat shown

/**
 * Experimentation & Analytics Events (P2)
 */
export type MetaEvent =
  | 'ab_test_variant_assigned'    // A/B test variant assigned
  | 'error_occurred';             // Error tracking event

/**
 * All Event Types Combined (30 events total)
 */
export type AnalyticsEvent =
  | SignupEvent
  | InvoiceEvent
  | PaymentEvent
  | CollectionsEvent
  | VoiceEvent
  | PricingEvent
  | ReferralEvent
  | SupportEvent
  | GrowthEvent
  | MetaEvent
  | SpecialEvent; // Include SpecialEvent to support additional events like 'aha_moment_reached'

/**
 * Special Events (not in 30 core, but important)
 */
export type SpecialEvent =
  | 'aha_moment_reached';         // Composite event for Aha Moment

// ============================================================
// EVENT PROPERTIES SCHEMA
// Based on RESEARCH_SUMMARIES_MAPPING.md Event Properties Table
// All properties use snake_case as per research spec (line 241)
// ============================================================

interface BaseEventProperties {
  timestamp?: number;
  page_url?: string;
  user_agent?: string;
  referrer?: string;
  session_id?: string;
}

// Signup & Activation Properties
interface SignupProperties extends BaseEventProperties {
  source?: string;                    // signup_started
  user_id?: string;                   // signup_completed
  plan?: string;                      // signup_completed (default: 'free')
  step_key?: string;                  // activation_step_completed
}

// Invoice Properties (from research: invoice_id, amount, line_items, has_voice_meta)
interface InvoiceProperties extends BaseEventProperties {
  invoice_id?: string;
  amount?: number;
  line_items?: number;                // Number of line items
  has_voice_meta?: boolean;           // Created via voice
  send_method?: string;               // invoice_sent
  days_overdue?: number;              // invoice_overdue_view
}

// Payment Properties (from research: invoice_id, amount, days_since_due, claim_id, status)
interface PaymentProperties extends BaseEventProperties {
  invoice_id?: string;
  amount?: number;
  days_since_due?: number;            // payment_received
  claim_id?: string;                  // payment_claim_submitted
  previous_status?: string;           // payment_claim_status_changed
  new_status?: string;                // payment_claim_status_changed
}

// Collections Properties (from research: invoice_id, previous_level, new_level, days_overdue)
interface CollectionsProperties extends BaseEventProperties {
  invoice_id?: string;
  schedule_offset_days?: number;      // reminder_scheduled
  previous_level?: string;            // collections_escalated
  new_level?: string;                 // collections_escalated
  days_overdue?: number;              // collections_escalated, email_sent
  reminder_level?: string;            // email_template_previewed, email_sent, email_delivered, email_failed (day5/day15/day30)
  principal_amount?: number;          // late_payment_interest_calculated
  total_interest?: number;            // late_payment_interest_calculated
  fixed_fee?: number;                 // late_payment_interest_calculated
  total_claimable?: number;           // late_payment_interest_calculated
  amount_added?: number;              // interest_manually_added_initiated
  recipient_email?: string;           // email_sent
  amount?: number;                    // email_sent (invoice amount in pounds)
  manual_trigger?: boolean;           // email_sent (true if manually triggered)
  sendgrid_message_id?: string;       // email_delivered, email_failed
  error_message?: string;             // email_failed
  invoice_reference?: string;         // invoice_reference
  email_type?: string;                // email_sent
  sms_type?: string;                  // sms_sent
  escalation_level?: string;          // Added to support collections escalation
  template_level?: string;            // Added to support collections escalation
  freelancer_id?: string;             // Added to support collections escalation
}

// Voice Input Properties (from research: invoice_id, device_type, segments, latency_ms_avg)
interface VoiceProperties extends BaseEventProperties {
  invoice_id?: string;
  device_type?: string;               // voice_recording_started (mobile/desktop)
  network_type?: string;              // voice_recording_started (wifi/cellular)
  segments?: number;                  // voice_transcript_finalized
  latency_ms_avg?: number;            // voice_transcript_finalized (WER monitoring)
}

// Pricing Properties (from research: user_id, plan_id, is_annual, context)
interface PricingProperties extends BaseEventProperties {
  user_id?: string;
  is_annual?: boolean;                // pricing_toggle_annual
  plan_id?: string;                   // plan_cta_click, subscription_activated
  context?: 'monthly' | 'annual';     // plan_cta_click
}

// Referral Properties (from research: referrer_id, referred_user_id)
interface ReferralProperties extends BaseEventProperties {
  user_id?: string;
  referrer_id?: string;               // referral_signup, referral_paid_conversion
  referred_user_id?: string;          // referral_signup, referral_paid_conversion
}

// Support Properties (from research: article_id, category, ticket_id, priority, sla_target_hours)
interface SupportProperties extends BaseEventProperties {
  article_id?: string;                // help_article_view
  category?: string;                  // help_article_view
  ticket_id?: string;                 // support_ticket_created
  priority?: string;                  // support_ticket_created
  sla_target_hours?: number;          // support_ticket_created
}

// Growth Properties (from research: badge_key, week_start, stat_key, experiment_key)
interface GrowthProperties extends BaseEventProperties {
  user_id?: string;
  badge_key?: string;                 // badge_awarded
  week_start?: string;                // k_factor_report_generated
  invites_sent?: number;              // k_factor_report_generated
  conversion_rate?: number;           // k_factor_report_generated
  stat_key?: string;                  // dynamic_stat_displayed
  principal_amount?: number;          // tool_interest_calculated
}

// Experimentation Properties (from research: experiment_key, variant_key, feature, severity)
interface ExperimentProperties extends BaseEventProperties {
  experiment_key?: string;            // ab_test_variant_assigned
  variant_key?: string;               // ab_test_variant_assigned
  feature?: string;                   // error_occurred
  severity?: 'low' | 'medium' | 'high' | 'critical'; // error_occurred
  trace_id?: string;                  // error_occurred
}

export type EventProperties =
  | SignupProperties
  | InvoiceProperties
  | PaymentProperties
  | CollectionsProperties
  | VoiceProperties
  | PricingProperties
  | ReferralProperties
  | SupportProperties
  | GrowthProperties
  | ExperimentProperties
  | BaseEventProperties;

// ============================================================
// USER PROPERTIES SCHEMA
// ============================================================

export interface UserProperties {
  email?: string;
  name?: string;
  subscription_tier?: 'free' | 'starter' | 'pro' | 'business';
  is_founding_member?: boolean;
  created_at?: string;
  business_name?: string;

  // Cumulative metrics
  total_invoices_created?: number;
  total_amount_invoiced?: number;
  total_payments_received?: number;
  total_amount_collected?: number;

  // Activation metrics
  first_invoice_sent?: boolean;
  first_payment_received?: boolean;
  collections_enabled?: boolean;
  voice_adopted?: boolean;

  // Engagement
  last_login_at?: string;
  days_since_signup?: number;
  invoices_this_month?: number;

  // Aha Moment
  aha_moment_reached?: boolean; // New property for Aha Moment
}

// ============================================================
// ANALYTICS CLIENT (Mixpanel/Amplitude)
// ============================================================

class AnalyticsClient {
  private initialized = false;
  private mixpanel: any = null;

  /**
   * Initialize analytics (call once on app startup)
   */
  async initialize() {
    if (!ANALYTICS_ENABLED) {
      logInfo('Analytics disabled (not in production)');
      return;
    }

    if (!MIXPANEL_TOKEN) {
      logError('NEXT_PUBLIC_MIXPANEL_TOKEN not configured', new Error('Missing env var'));
      return;
    }

    try {
      // Dynamically import Mixpanel (only in browser, only if enabled)
      if (typeof window !== 'undefined') {
        const mixpanelModule = await import('mixpanel-browser');
        this.mixpanel = mixpanelModule.default;

        this.mixpanel.init(MIXPANEL_TOKEN, {
          debug: process.env.NODE_ENV === 'development',
          track_pageview: false, // We'll track manually
          persistence: 'localStorage',
          ignore_dnt: false, // Respect Do Not Track
        });

        this.initialized = true;
        logInfo('Analytics initialized (Mixpanel)');
      }
    } catch (error) {
      logError('Failed to initialize analytics', error as Error);
    }
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent, properties?: EventProperties) {
    if (!ANALYTICS_ENABLED || !this.initialized || !this.mixpanel) {
      console.log('[Analytics Debug]', event, properties); // Debug in dev
      return;
    }

    try {
      // Enrich with automatic properties
      const enrichedProperties = {
        ...properties,
        timestamp: Date.now(),
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      };

      this.mixpanel.track(event, enrichedProperties);

      logInfo('Analytics event tracked', { event, properties: enrichedProperties });
    } catch (error) {
      logError('Failed to track event', error as Error);
    }
  }

  /**
   * Identify user (call on login/signup)
   */
  identify(userId: string, properties?: UserProperties) {
    if (!ANALYTICS_ENABLED || !this.initialized || !this.mixpanel) {
      console.log('[Analytics Debug] Identify:', userId, properties);
      return;
    }

    try {
      this.mixpanel.identify(userId);

      if (properties) {
        this.mixpanel.people.set(properties);
      }

      logInfo('User identified', { userId, properties });
    } catch (error) {
      logError('Failed to identify user', error as Error);
    }
  }

  /**
   * Update user properties (incremental)
   */
  updateUser(properties: Partial<UserProperties>) {
    if (!ANALYTICS_ENABLED || !this.initialized || !this.mixpanel) {
      console.log('[Analytics Debug] Update user:', properties);
      return;
    }

    try {
      this.mixpanel.people.set(properties);
      logInfo('User properties updated', { properties });
    } catch (error) {
      logError('Failed to update user properties', error as Error);
    }
  }

  /**
   * Increment a user property (e.g., invoice count)
   */
  incrementUserProperty(property: string, value: number = 1) {
    if (!ANALYTICS_ENABLED || !this.initialized || !this.mixpanel) {
      console.log('[Analytics Debug] Increment:', property, value);
      return;
    }

    try {
      this.mixpanel.people.increment(property, value);
      logInfo('User property incremented', { property, value });
    } catch (error) {
      logError('Failed to increment user property', error as Error);
    }
  }

  /**
   * Track page view (uses appropriate event based on page)
   */
  trackPageView(pageName: string, properties?: BaseEventProperties) {
    // Map page names to appropriate events
    const eventMapping: Record<string, AnalyticsEvent> = {
      '/dashboard': 'onboarding_checklist_view',
      '/pricing': 'pricing_view',
    };

    const event = eventMapping[pageName] || 'onboarding_checklist_view';

    this.track(event, {
      ...properties,
      page_url: pageName,
    });
  }

  /**
   * Reset user (call on logout)
   */
  reset() {
    if (!ANALYTICS_ENABLED || !this.initialized || !this.mixpanel) {
      return;
    }

    try {
      this.mixpanel.reset();
      logInfo('Analytics reset (user logged out)');
    } catch (error) {
      logError('Failed to reset analytics', error as Error);
    }
  }
}

// Singleton instance
const analytics = new AnalyticsClient();

// ============================================================
// EXPORTED HELPER FUNCTIONS
// ============================================================

/**
 * Initialize analytics (call in app startup)
 */
export async function initializeAnalytics() {
  await analytics.initialize();
}

/**
 * Track an event
 */
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties) {
  analytics.track(event, properties);
}

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: UserProperties) {
  analytics.identify(userId, properties);
}

/**
 * Update user properties
 */
export function updateUserProperties(properties: Partial<UserProperties>) {
  analytics.updateUser(properties);
}

/**
 * Increment user property
 */
export function incrementUserProperty(property: string, value?: number) {
  analytics.incrementUserProperty(property, value);
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, properties?: BaseEventProperties) {
  analytics.trackPageView(pageName, properties);
}

/**
 * Reset analytics (logout)
 */
export function resetAnalytics() {
  analytics.reset();
}

// ============================================================
// REACT HOOKS
// Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.8 "Client Hook: useTrack(event, propsDeps[])"
// ============================================================

/**
 * Hook to track event with dependency array
 * Re-tracks when dependencies change
 *
 * Usage:
 * useTrack('invoice_created', { invoice_id: 'abc123', amount: 500 }, [invoiceId]);
 */
export function useTrack(
  event: AnalyticsEvent,
  properties?: EventProperties,
  deps: React.DependencyList = []
) {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      trackEvent(event, properties);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook to track component mount (fire once)
 */
export function useTrackMount(event: AnalyticsEvent, properties?: EventProperties) {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      trackEvent(event, properties);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Hook to track page view
 */
export function useTrackPageView(pageName: string) {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      trackPageView(pageName);
    }
  }, [pageName]);
}

// ============================================================
// FUNNEL TRACKING HELPERS
// Based on MASTER_IMPLEMENTATION_AUDIT_V1.md §4.8 Funnel Tracking
// ============================================================

/**
 * Track composite Aha Moment event (first collection sent AND first payment received)
 * Fires only once per user when both milestones are reached
 * Based on freemium-conversion-guide.md and activation funnel spec
 */
export function trackAhaMoment(userId: string, userProps: UserProperties) {
  if (userProps.first_invoice_sent && userProps.first_payment_received) {
    // Only fire if not already marked
    if (!userProps.aha_moment_reached) {
      trackEvent('aha_moment_reached', { user_id: userId });
      updateUserProperties({ aha_moment_reached: true });
    }
  }
}

/**
 * Track complete signup funnel (signup_started → signup_completed → email_verified)
 */
export function trackSignupFunnel(step: 'started' | 'completed' | 'verified', properties?: SignupProperties) {
  if (step === 'started') {
    trackEvent('signup_started', properties);
  } else if (step === 'completed') {
    trackEvent('signup_completed', properties);
  } else {
    trackEvent('email_verified', properties);
  }
}

/**
 * Track activation funnel (first_invoice_created → invoice_sent → payment_received)
 */
export function trackActivationFunnel(
  step: 'first_invoice' | 'invoice_sent' | 'payment_received',
  properties?: InvoiceProperties | PaymentProperties
) {
  if (step === 'first_invoice') {
    trackEvent('first_invoice_created', properties as InvoiceProperties);
  } else if (step === 'invoice_sent') {
    trackEvent('invoice_sent', properties as InvoiceProperties);
  } else {
    trackEvent('payment_received', properties as PaymentProperties);
  }
}

/**
 * Track upgrade funnel (pricing_view → plan_cta_click → subscription_activated)
 */
export function trackUpgradeFunnel(
  step: 'pricing_view' | 'plan_cta_click' | 'subscription_activated',
  properties?: PricingProperties
) {
  trackEvent(step, properties);
}

// Fix missing React import for hooks
import React from 'react';

export default analytics;

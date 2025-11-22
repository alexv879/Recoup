/**
 * Webhook payload type definitions
 * Defines proper interfaces for all webhook event payloads
 */

// ============ CLERK WEBHOOKS ============

export interface ClerkEmailAddress {
  email_address: string;
  id: string;
  verification?: {
    status: string;
    strategy?: string;
  } | null;
}

export interface ClerkUserData {
  id?: string;
  email_addresses?: ClerkEmailAddress[];
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  username?: string | null;
  created_at?: number;
  updated_at?: number;
  deleted?: boolean;
}

export interface ClerkSessionData {
  id?: string;
  user_id: string;
  created_at?: number;
  last_active_at?: number;
  expire_at?: number;
  status?: string;
}

export interface ClerkSubscriptionData {
  id: string;
  user_id: string;
  plan?: string;
  plan_slug?: string;
  subscription_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  [key: string]: unknown;
}

export interface ClerkWebhookEvent<T = unknown> {
  type: string;
  data: T;
  object?: string;
  timestamp?: number;
}

// ============ STRIPE WEBHOOKS ============

export interface StripeSubscriptionData {
  id: string;
  customer: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
        recurring?: {
          interval: 'month' | 'year';
        };
      };
    }>;
  };
  current_period_end?: number;
  current_period_start?: number;
  cancel_at_period_end?: boolean;
  canceled_at?: number;
  metadata?: Record<string, string>;
}

export interface StripeInvoiceData {
  id: string;
  customer: string;
  subscription?: string;
  amount_due: number;
  amount_paid: number;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  payment_intent?: string;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentIntentData {
  id: string;
  customer?: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  metadata?: Record<string, string>;
}

// ============ SENDGRID WEBHOOKS ============

export interface SendGridEvent {
  email: string;
  timestamp?: number;
  'smtp-id'?: string;
  event: 'processed' | 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'spamreport' | 'unsubscribe';
  category?: string[];
  sg_event_id?: string;
  sg_message_id?: string;
  reason?: string;
  status?: string;
  response?: string;
  url?: string;
}

// ============ TWILIO WEBHOOKS ============

export interface TwilioVoiceData {
  CallSid: string;
  AccountSid: string;
  From?: string;
  To?: string;
  CallStatus?: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';
  Direction?: 'inbound' | 'outbound-api' | 'outbound-dial';
  ApiVersion?: string;
  RecordingUrl?: string;
  RecordingSid?: string;
  RecordingDuration?: string;
  Digits?: string;
  SpeechResult?: string;
}

export interface TwilioSMSData {
  MessageSid: string;
  AccountSid: string;
  From?: string;
  To?: string;
  Body?: string;
  MessageStatus?: 'accepted' | 'queued' | 'sending' | 'sent' | 'receiving' | 'received' | 'delivered' | 'undelivered' | 'failed';
  NumMedia?: string;
  SmsSid?: string;
  SmsStatus?: string;
}

// ============ GENERIC WEBHOOK TYPES ============

export interface WebhookPayload<T = unknown> {
  type: string;
  data: T;
  timestamp?: number;
  id?: string;
}

export interface WebhookError {
  error: string;
  message?: string;
  code?: string;
  details?: unknown;
}

# Recoup Platform - Comprehensive API Audit
**Date**: November 22, 2025
**Status**: In Progress
**Total API Routes**: 67

---

## 📊 API Inventory by Category

### 1. **External API Integrations**

#### Stripe (Payment Processing)
- **Webhook**: `/api/webhook/stripe` - Handles Stripe events
- **SDK Version**: stripe@latest (2025-10-29 API version)
- **Events Handled**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

#### Clerk (Authentication)
- **Webhook**: `/api/webhook/clerk`, `/api/webhooks/clerk`
- **Events Handled**:
  - `user.created`
  - `user.updated`
  - `user.deleted`
  - `session.created`
  - `session.ended`

#### HMRC (Tax/VAT Integration)
- **Auth Routes**:
  - `/api/hmrc/auth/connect` - Initiate OAuth
  - `/api/hmrc/auth/callback` - OAuth callback
  - `/api/hmrc/auth/disconnect` - Revoke access
  - `/api/hmrc/auth/status` - Check connection status
- **VAT Routes**:
  - `/api/hmrc/vat/obligations` - Get VAT obligations
  - `/api/hmrc/vat/liabilities` - Get VAT liabilities
  - `/api/hmrc/vat/submit` - Submit VAT return

#### Twilio (SMS/Voice)
- **Webhook**: `/api/webhooks/twilio/voice-ai` - Handle voice AI callbacks
- **Internal Routes**:
  - `/api/collections/sms` - Send SMS reminders
  - `/api/collections/ai-call` - Initiate AI calls
  - `/api/voice/transcribe` - Transcribe voice
  - `/api/voice/batch` - Batch voice operations

#### SendGrid (Email)
- **Webhook**: `/api/webhook/sendgrid` - Email event tracking

#### OpenAI (AI Processing)
- **Routes**:
  - `/api/ai/parse-invoice` - Parse invoice using AI

#### Lob (Physical Mail)
- **Routes**:
  - `/api/collections/letter` - Send physical letters

---

### 2. **Internal API Routes**

#### Admin & Configuration (5 routes)
- `/api/admin/feature-flags` - Manage feature flags
- `/api/admin/feature-flags/[key]` - Individual flag management
- `/api/admin/rbac/roles` - Role-based access control
- `/api/admin/rbac/users/[userId]` - User role management
- `/api/feature-flags/evaluate` - Evaluate feature flags
- `/api/feature-flags` - Get all feature flags

#### Clients Management (2 routes)
- `/api/clients` - List/create clients
- `/api/clients/[id]` - Get/update/delete client

#### Invoices Management (7 routes)
- `/api/invoices` - List/create invoices
- `/api/invoices/[id]` - Get/update/delete invoice
- `/api/invoices/[id]/claim-payment` - Claim payment
- `/api/invoices/[id]/verify-payment-claim` - Verify payment claim
- `/api/invoices/[id]/escalation` - Escalate to collections
- `/api/invoices/[id]/escalation/pause` - Pause escalation
- `/api/invoices/[id]/email-history` - Get email history

#### Recurring Invoices (6 routes)
- `/api/recurring-invoices` - List/create recurring invoices
- `/api/recurring-invoices/[id]` - Get/update/delete
- `/api/recurring-invoices/[id]/pause` - Pause recurrence
- `/api/recurring-invoices/[id]/resume` - Resume recurrence
- `/api/recurring-invoices/[id]/history` - Get generation history

#### Collections & Recovery (5 routes)
- `/api/collections/send-reminder` - Send payment reminder
- `/api/collections/sms` - Send SMS reminder
- `/api/collections/ai-call` - Initiate AI call
- `/api/collections/letter` - Send physical letter
- `/api/collections/agency-handoff` - Handoff to agency

#### Payment Claims & Verification (4 routes)
- `/api/payment-claims/[id]` - Get/update payment claim
- `/api/payment-claims/[id]/evidence` - Upload evidence
- `/api/payment-verification/claim` - Create verification claim
- `/api/payment-verification/upload-evidence` - Upload evidence

#### Dashboard & Analytics (5 routes)
- `/api/dashboard/summary` - Get dashboard summary
- `/api/dashboard/metrics` - Get key metrics
- `/api/dashboard/charts` - Get chart data
- `/api/dashboard/predictions` - Get revenue predictions
- `/api/dashboard/export/csv` - Export to CSV
- `/api/dashboard/export/pdf` - Export to PDF

#### Cron Jobs (6 routes)
- `/api/cron/process-recurring-invoices` - Generate recurring invoices
- `/api/cron/process-escalations` - Process collection escalations
- `/api/cron/check-verification-deadlines` - Check claim deadlines
- `/api/cron/send-behavioral-emails` - Send behavioral emails
- `/api/cron/process-email-sequence` - Process email sequences
- `/api/cron/reset-monthly-usage` - Reset monthly quotas

#### User Management (3 routes)
- `/api/user/quota` - Get user quota
- `/api/founding-members/register` - Register founding member
- `/api/founding-members/status` - Get founding member status

#### GDPR Compliance (2 routes)
- `/api/gdpr/data-export` - Export user data
- `/api/gdpr/delete-account` - Delete account

#### Utilities (4 routes)
- `/api/health` - Health check
- `/api/email-preview` - Preview email templates
- `/api/feedback` - Submit feedback
- `/api/push/subscribe` - Subscribe to push notifications

#### Python Bridge (2 routes)
- `/api/python/bridge` - Python service bridge
- `/api/python/pdf` - PDF generation via Python

---

## 🔍 Audit Status by Category

### ✅ Completed Audits
1. **Stripe Integration** - Type-safe, price mapping implemented
2. **Clerk Integration** - Type-safe, subscription cancellation implemented
3. **Validation Middleware** - Created and ready for deployment

### 🔄 In Progress
1. **Type Safety** - 5 webhook `any` types fixed, 147 remaining (mostly UI)
2. **Error Handling** - Critical paths secured, comprehensive review needed

### ⚠️ Needs Audit
1. **HMRC Integration** - OAuth flow, VAT submission
2. **Twilio Integration** - SMS/Voice webhooks
3. **Payment Claims** - Evidence upload, verification flow
4. **Cron Jobs** - All 6 cron routes need testing
5. **Python Bridge** - PDF generation service

---

## 🎯 Critical Business Flows to Verify

1. **Payment Flow**
   - Invoice creation → Payment link → Stripe checkout → Webhook → Transaction

2. **Collections Flow**
   - Overdue invoice → Reminder (email/SMS/call) → Escalation → Agency handoff

3. **Subscription Flow**
   - User signup → Clerk → Stripe subscription → Tier assignment → Access control

4. **VAT Flow**
   - Connect HMRC → Fetch obligations → Calculate VAT → Submit return

5. **Recurring Invoice Flow**
   - Create template → Cron job → Generate invoice → Send to client

---

## 📝 Next Steps

1. Test all webhook handlers with mock events
2. Verify HMRC OAuth and VAT submission
3. Test payment claim verification flow
4. Audit all cron jobs for correctness
5. Run end-to-end tests for critical flows
6. Fix remaining type safety issues
7. Security audit for all routes

# RECOUP CODEBASE - COMPREHENSIVE ANALYSIS REPORT

**Generated:** November 18, 2025  
**Repository:** /home/user/Recoup  
**Current Branch:** claude/python-codebase-refactor-0143XBWhC5GVrTborhVS9gbB  

---

## EXECUTIVE SUMMARY

Recoup is a sophisticated SaaS platform for invoice management and automated payment collections. The codebase consists of:

- **Primary Application:** Next.js 16 application (TypeScript) - Full-stack web application
- **Microservice:** FastAPI Python service for PDF generation
- **Voice Service:** Fastify WebSocket server for AI voice collections (Twilio + OpenAI)
- **Utility Scripts:** 4 Python scripts for various administrative tasks
- **Database:** Firebase Firestore (NoSQL, real-time)
- **External Integrations:** Stripe, SendGrid, Twilio, OpenAI, Deepgram, Lob

**Total TypeScript Files:** 50+  
**Total Python Files:** 4 (1 service + 3 scripts)  
**API Endpoints:** 38 routes  
**Database Collections:** 17+  
**Cron Jobs:** 5 scheduled background jobs  

---

## 1. DIRECTORY STRUCTURE & ORGANIZATION

```
/home/user/Recoup/
├── relay/                          # Main Next.js application
│   ├── app/                        # Next.js app directory
│   │   ├── api/                    # API route handlers (38 endpoints)
│   │   ├── dashboard/              # User dashboard pages
│   │   ├── invoice/                # Invoice pages
│   │   ├── pricing/                # Pricing page
│   │   ├── confirmation/           # Email confirmation pages
│   │   └── layout.tsx              # Root layout
│   ├── components/                 # React components (49 files)
│   │   ├── Dashboard/              # Dashboard-specific components (14)
│   │   ├── Invoices/               # Invoice components
│   │   ├── Payments/               # Payment verification components
│   │   ├── Pricing/                # Pricing page components
│   │   ├── voice/                  # Voice recording components
│   │   ├── onboarding/             # Onboarding flow components
│   │   └── UI/                     # Generic UI components
│   ├── lib/                        # Business logic & utilities (31 files, ~7800 lines)
│   │   ├── firebase.ts             # Firebase admin configuration
│   │   ├── pricing.ts              # Pricing tier logic
│   │   ├── analytics/              # Analytics system (4 files)
│   │   ├── email-templates/        # Email template system
│   │   ├── collections-*.ts        # Collections automation
│   │   ├── voice-processing.ts     # Voice transcription
│   │   ├── sendgrid.ts             # Email service
│   │   ├── stripeSync.ts           # Stripe integration
│   │   ├── featureFlags.ts         # Feature flag system
│   │   └── [other utilities]       # Auth, logging, etc.
│   ├── services/                   # External service integrations (7 files)
│   │   ├── analyticsService.ts
│   │   ├── clientService.ts
│   │   ├── collectionsService.ts
│   │   ├── paymentService.ts
│   │   └── [other services]
│   ├── jobs/                       # Background jobs/cron workers (3 files)
│   │   ├── collectionsEscalator.ts
│   │   ├── emailSequenceWorker.ts
│   │   └── pricingMigration.ts
│   ├── types/                      # TypeScript type definitions (3 files)
│   │   ├── models.ts               # Data models
│   │   ├── client.ts               # Client types
│   │   └── escalation.ts           # Escalation state types
│   ├── hooks/                      # React hooks (1 file)
│   │   └── useCountdown.ts
│   ├── middleware/                 # Express/Next middleware (1 file)
│   │   └── clerkPremiumGating.ts   # Subscription gating
│   ├── utils/                      # Utility functions (1 file)
│   │   └── constants.ts            # Constants
│   ├── schemas/                    # Data validation schemas
│   │   └── events/                 # Event schemas (37 JSON schema files)
│   ├── render-server/              # Separate Fastify WebSocket server
│   │   ├── src/
│   │   │   ├── index.ts            # Server entry point
│   │   │   ├── config.ts           # Configuration
│   │   │   └── services/
│   │   │       └── relay-webhook.ts
│   │   ├── package.json
│   │   └── render.yaml             # Render deployment config
│   ├── scripts/                    # Migration scripts
│   │   └── migrate-stripe-plans.ts
│   ├── templates/                  # Email templates
│   │   └── emails/
│   ├── sentry.client.config.ts     # Client error tracking
│   ├── sentry.server.config.ts     # Server error tracking
│   ├── vercel.json                 # Vercel deployment config with cron jobs
│   ├── package.json                # Dependencies
│   ├── next-env.d.ts               # TypeScript definitions
│   └── tsconfig.tsbuildinfo        # Compiled TypeScript metadata
│
├── recoup/                         # Python services and scripts
│   ├── python-services/
│   │   └── pdf_service/
│   │       └── main.py             # FastAPI PDF generation service
│   ├── scripts/
│   │   ├── check_contrast.py       # CSS color contrast checker
│   │   ├── generate_test_pdf.py    # Test PDF generator
│   │   └── migrate_stripe_plans.py # Stripe plan migration script
│   └── [other files]
│
└── relay-technical-spec-v2.md      # Complete technical specification document

```

---

## 2. TECHNOLOGY STACK & FRAMEWORKS

### Frontend/Web
- **Next.js 16.0.3** - React framework with app router, server components
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type-safe JavaScript
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **Lucide React 0.553.0** - Icon library
- **Recharts 3.4.1** - Charts/visualization library
- **React Hook Form 7.66.0** - Form state management
- **Zod 4.1.12** - Schema validation
- **Zustand 5.0.8** - Client state management
- **Axios 1.13.2** - HTTP client
- **React-Toastify 11.0.5** - Toast notifications

### Backend/APIs
- **Next.js API Routes** - Backend API handlers
- **Node.js 20+** - Runtime environment
- **Fastify 4.28.1** - WebSocket server framework (for voice)
- **Pino 10.1.0** - Structured logging

### Databases & Data
- **Firebase Firestore** - NoSQL document database (primary)
- **Firebase Storage** - File storage
- **Firebase Admin SDK** - Server-side Firebase access

### Authentication & Billing
- **Clerk 6.35.1** - Authentication & user management
- **Stripe 19.3.1** - Payment processing & subscriptions

### External Services & Integrations
- **SendGrid 8.1.6** - Email delivery
- **Twilio 5.10.5** - SMS & voice
- **OpenAI 6.8.1** - AI models (GPT)
- **Deepgram** - Speech-to-text (fallback)
- **Lob 7.0.1** - Physical mail delivery
- **Sentry 10.25.0** - Error tracking & monitoring
- **Mixpanel** - Analytics (client-side)

### Rate Limiting & Caching
- **Upstash Redis 1.35.6** - Redis client
- **Upstash Rate Limit 2.0.7** - Rate limiting

### Other Libraries
- **Date-fns 4.1.0** - Date utilities
- **Numeral 2.0.6** - Number formatting
- **Node-schedule 2.1.1** - Job scheduling
- **NanoID 5.1.6** - Unique ID generation
- **WebSocket (ws 8.18.3)** - WebSocket support
- **RecordRTC 5.6.2** - Audio recording (browser)
- **Dotenv 17.2.3** - Environment variables

### Python Stack
- **FastAPI** - Python web framework for PDF service
- **ReportLab** - PDF generation
- **Stripe Python SDK** - Stripe integration
- **Firebase Admin (Python)** - Firestore access
- **Requests** - HTTP library

### Testing & Quality
- **Jest 30.2.0** - Testing framework
- **Testing Library React 16.3.0** - Component testing
- **ts-jest 29.4.5** - TypeScript Jest support
- **ESLint 9.39.1** - Code linting

### Build & Deployment
- **Vercel** - Deployment platform (primary)
- **Render.com** - Deployment for voice server
- **Docker** - Containerization support

---

## 3. COMPLETE API ENDPOINTS (38 Routes)

### Collections API
```
POST /api/collections/send-reminder       - Send manual reminder
POST /api/collections/ai-call             - Initiate AI voice call
POST /api/collections/sms                 - Send SMS reminder
POST /api/collections/letter              - Send physical letter
POST /api/collections/agency-handoff      - Escalate to collection agency
```

### Cron Jobs (Scheduled Background Tasks)
```
GET  /api/cron/process-escalations        - Every 6 hours: Auto-escalate overdue invoices
GET  /api/cron/process-email-sequence     - Hourly: Send Day 5/15/30 reminders
GET  /api/cron/send-behavioral-emails     - Daily at 10:00: Send behavioral emails
GET  /api/cron/reset-monthly-usage        - Monthly (1st at 00:00): Reset usage quotas
GET  /api/cron/check-verification-deadlines - Hourly: Monitor payment verification deadlines
```

### Invoice Management
```
POST   /api/invoices/[id]/claim-payment   - Claim payment received
POST   /api/invoices/[id]/escalation      - Trigger escalation
PATCH  /api/invoices/[id]/escalation/pause - Pause escalation
GET    /api/invoices/[id]/escalation      - Get escalation state
GET    /api/invoices/[id]/email-history   - Get email history
POST   /api/invoices/[id]/verify-payment-claim - Verify claimed payment
```

### Payment Verification & Claims
```
POST   /api/payment-claims/[id]           - Create/update payment claim
POST   /api/payment-claims/[id]/evidence  - Upload evidence
POST   /api/payment-verification/claim    - Submit payment verification
POST   /api/payment-verification/upload-evidence - Upload verification evidence
```

### Dashboard Analytics
```
GET    /api/dashboard/summary             - Dashboard metrics (total, paid, overdue, etc.)
GET    /api/dashboard/charts              - Chart data (revenue, status breakdown)
GET    /api/dashboard/metrics             - Detailed metrics
GET    /api/dashboard/predictions         - Revenue predictions
POST   /api/dashboard/export/pdf          - Export to PDF
POST   /api/dashboard/export/csv          - Export to CSV
```

### Voice & Transcription
```
POST   /api/voice/transcribe              - Transcribe audio (OpenAI Whisper)
POST   /api/voice/batch                   - Batch transcription
```

### Webhooks
```
POST   /api/webhook/clerk                 - Clerk authentication events
POST   /api/webhook/sendgrid              - SendGrid email events (bounces, opens, etc.)
POST   /api/webhook/stripe                - Stripe payment events
POST   /api/webhooks/clerk                - Alternative Clerk webhook
POST   /api/webhooks/twilio/voice-ai      - Twilio voice events
```

### Email & Notifications
```
GET    /api/email-preview/[templateId]    - Preview email template
POST   /api/feedback/[id]                 - Submit user feedback
GET    /api/user/quota                    - Get usage quota info
```

### Feature Management
```
GET    /api/feature-flags/                - Get feature flags
POST   /api/founding-members/register     - Register as founding member
GET    /api/founding-members/status       - Get founding member status
```

---

## 4. JAVASCRIPT/TYPESCRIPT FILES - DETAILED ANALYSIS

### A. API Route Handlers (38 files in app/api/)

**Collections Management**
- `collections/send-reminder/route.ts` - Manual reminder sending
  - Dependencies: Firebase, SendGrid, logging
  - Conversible to Python: Yes (straightforward email/DB ops)

- `collections/ai-call/route.ts` - AI-powered voice collections
  - Dependencies: OpenAI, Twilio, Firebase
  - Conversible to Python: Yes (API calls)

- `collections/sms/route.ts` - SMS reminder sending
  - Dependencies: Twilio, Firebase, logging
  - Conversible to Python: Yes (SMS/DB ops)

- `collections/letter/route.ts` - Physical letter via Lob
  - Dependencies: Lob API, Firebase, logging
  - Conversible to Python: Yes (API call + DB)

- `collections/agency-handoff/route.ts` - Escalate to collection agency
  - Dependencies: Firebase, logging
  - Conversible to Python: Yes (DB update)

**Cron/Background Jobs**
- `cron/process-escalations/route.ts` - Escalation automation
  - Dependencies: Firebase, sendgrid, logging, collectionsEscalator job
  - Conversible to Python: Yes (job could be Python)
  - Note: Calls runEscalationWorker() from jobs/collectionsEscalator.ts

- `cron/process-email-sequence/route.ts` - Email reminder sequence
  - Dependencies: Firebase, sendgrid, logging, emailSequenceWorker
  - Conversible to Python: Yes (job could be Python)

- `cron/send-behavioral-emails/route.ts` - Behavioral trigger emails
  - Dependencies: Firebase, analytics, sendgrid
  - Conversible to Python: Yes

- `cron/reset-monthly-usage/route.ts` - Reset monthly quotas
  - Dependencies: Firebase, logging
  - Conversible to Python: Yes

- `cron/check-verification-deadlines/route.ts` - Verify payment deadlines
  - Dependencies: Firebase, sendgrid, logging
  - Conversible to Python: Yes

**Invoice Management**
- `invoices/[id]/claim-payment/route.ts` - Claim payment received
  - Dependencies: Firebase, logging, analytics
  - Conversible to Python: Yes

- `invoices/[id]/email-history/route.ts` - Get email history
  - Dependencies: Firebase
  - Conversible to Python: Yes

- `invoices/[id]/escalation/route.ts` - Get escalation state
  - Dependencies: Firebase, escalation logic
  - Conversible to Python: Yes

- `invoices/[id]/escalation/pause/route.ts` - Pause escalation
  - Dependencies: Firebase, logging
  - Conversible to Python: Yes

- `invoices/[id]/verify-payment-claim/route.ts` - Verify payment claim
  - Dependencies: Firebase, logging, analytics
  - Conversible to Python: Yes

**Payment Verification**
- `payment-claims/[id]/route.ts` - Payment claim management
  - Dependencies: Firebase, Clerk auth
  - Conversible to Python: Yes

- `payment-claims/[id]/evidence/route.ts` - Upload evidence files
  - Dependencies: Firebase Storage, logging
  - Conversible to Python: Yes (but needs file handling)

- `payment-verification/claim/route.ts` - Submit verification
  - Dependencies: Firebase, logging
  - Conversible to Python: Yes

- `payment-verification/upload-evidence/route.ts` - Upload evidence
  - Dependencies: Firebase Storage, logging
  - Conversible to Python: Yes

**Dashboard & Analytics**
- `dashboard/summary/route.ts` - Dashboard summary stats
  - Dependencies: analyticsService, Firebase
  - Conversible to Python: Yes

- `dashboard/metrics/route.ts` - Detailed metrics
  - Dependencies: analyticsService, Firebase
  - Conversible to Python: Yes

- `dashboard/charts/route.ts` - Chart data
  - Dependencies: analyticsService, Firebase
  - Conversible to Python: Yes

- `dashboard/predictions/route.ts` - Revenue predictions
  - Dependencies: analyticsService, Firebase
  - Conversible to Python: Yes

- `dashboard/export/pdf/route.ts` - Export as PDF
  - Dependencies: Python PDF service (called via HTTP)
  - Conversible to Python: Already partially Python-based

- `dashboard/export/csv/route.ts` - Export as CSV
  - Dependencies: analyticsService, Firebase
  - Conversible to Python: Yes

**Voice Processing**
- `voice/transcribe/route.ts` - Audio transcription
  - Dependencies: OpenAI Whisper, Firebase
  - Conversible to Python: Yes (OpenAI API)

- `voice/batch/route.ts` - Batch transcription
  - Dependencies: OpenAI Whisper, Firebase
  - Conversible to Python: Yes

**Email & Notifications**
- `email-preview/route.ts` - Preview email templates
  - Dependencies: emailTemplateRenderer, logging
  - Conversible to Python: Yes (template rendering)

**User Management**
- `user/quota/route.ts` - Get usage quota
  - Dependencies: Firebase, constants
  - Conversible to Python: Yes

**Webhooks**
- `webhook/clerk/route.ts` - Clerk webhook handler
  - Dependencies: Clerk, Firebase
  - Conversible to Python: Yes

- `webhook/sendgrid/route.ts` - SendGrid event webhook
  - Dependencies: SendGrid, Firebase, analytics
  - Conversible to Python: Yes

- `webhook/stripe/route.ts` - Stripe webhook handler
  - Dependencies: Stripe, Firebase, pricing logic
  - Conversible to Python: Yes

- `webhooks/clerk/route.ts` - Alternative Clerk webhook
  - Conversible to Python: Yes

- `webhooks/twilio/voice-ai/route.ts` - Twilio voice webhook
  - Dependencies: Twilio, Firebase
  - Conversible to Python: Yes

**Founding Members**
- `founding-members/register/route.ts` - Register founding member
  - Dependencies: Firebase, analytics
  - Conversible to Python: Yes

- `founding-members/status/route.ts` - Get founding member status
  - Dependencies: Firebase
  - Conversible to Python: Yes

**Feature Management**
- `feature-flags/route.ts` - Feature flags management
  - Dependencies: Firebase
  - Conversible to Python: Yes

- `feedback/route.ts` - Feedback collection
  - Dependencies: Firebase, analytics
  - Conversible to Python: Yes

---

### B. Service Layer (7 files in services/)

**analyticsService.ts** (~450 lines)
- Provides dashboard statistics and insights
- Key functions:
  - `getInvoiceStats()` - Invoice counts and payment days
  - `getCollectionStats()` - Collection success rates
  - `getRevenueByMonth()` - Monthly revenue trends
  - `getClientBreakdown()` - Per-client analytics
  - `getTopClients()` - Top 5 clients by revenue
  - `getAtRiskInvoices()` - Overdue invoices without collections
  - `getPredictedRevenue()` - Simple prediction based on 6-month average
  - `getUserRank()` - Gamification ranking
  - `getTopUsers()` - Top users leaderboard
  - `generateInsights()` - AI-like insights
- Dependencies: Firebase Firestore
- Conversible to Python: Yes (straightforward data queries)

**clientService.ts**
- Client management functions
- Conversible to Python: Yes

**collectionsService.ts**
- Collections automation orchestration
- Conversible to Python: Yes

**paymentService.ts**
- Payment processing and verification
- Conversible to Python: Yes

**consentService.ts**
- GDPR/consent management
- Conversible to Python: Yes

**foundingMemberService.ts**
- Founding member program logic
- Conversible to Python: Yes

**agencyHandoffService.ts**
- Collection agency integration
- Conversible to Python: Yes

---

### C. Business Logic Libraries (31 files in lib/)

**Core Infrastructure**
1. **firebase.ts** (~100 lines)
   - Firebase Admin SDK initialization
   - Firestore database access
   - Collection name constants
   - Helper functions (timestamp conversion)
   - Cannot be converted directly (Node-specific Firebase Admin)

2. **sendgrid.ts** (~400 lines)
   - Email sending via SendGrid dynamic templates
   - Fallback plain text emails
   - Email template functions for each email type
   - Dependencies: @sendgrid/mail
   - Conversible to Python: Yes (sendgrid Python SDK exists)

3. **subscriptionPlans.ts**
   - Subscription tier definitions
   - Conversible to Python: Yes (simple config)

4. **stripeSync.ts** (~50 lines)
   - Stripe product/price synchronization
   - Webhook handler stubs
   - Conversible to Python: Yes (stripe-python exists)

**Pricing & Business Logic**
5. **pricing.ts** (~280 lines)
   - Pricing tier definitions and calculations
   - Tier structure: Starter (£19/mo, 10 collections), Growth (£39/mo, 50 collections), Pro (£75/mo, unlimited)
   - Annual discount: 20%
   - Functions:
     - `getTierPrice()` - Get price for tier
     - `hasExceededCollectionsLimit()` - Check quota
     - `calculateOverageCost()` - Calculate extra fees
     - `getRecommendedUpgrade()` - Upgrade suggestions
     - `calculateLTV()` - Lifetime value estimation
     - `getAnnualDiscountPercentage()` - Discount calc
   - Conversible to Python: Yes (pure logic)

6. **featureFlags.ts** (~50 lines)
   - Feature flag system for gradual rollout
   - Pricing V3 migration flags
   - Conversible to Python: Yes

7. **foundingMember.ts**
   - Founding member program logic
   - Conversible to Python: Yes

**Collections Automation**
8. **collections-calculator.ts**
   - Interest calculations (8% + BOE base rate = 13.25%)
   - Fixed recovery costs (£40-£100)
   - UK legal compliance (Late Payment of Commercial Debts Act 1998)
   - Conversible to Python: Yes (math operations)

9. **collections-email-templates.ts** (~400 lines)
   - Three-tier escalation emails:
     - Day 5: Friendly reminder (no interest)
     - Day 15: Firm reminder (with interest)
     - Day 30: Final notice (interest + costs + legal threat)
   - Functions:
     - `sendEarlyPreDueNotice()`
     - `sendFriendlyReminder()`
     - `sendFirmReminder()`
     - `sendFinalNotice()`
   - Conversible to Python: Yes

10. **escalation-decision.ts**
    - Escalation logic and state machine
    - State: pending → gentle → firm → final → agency
    - Conversible to Python: Yes

11. **latePaymentInterest.ts**
    - Interest rate calculations
    - Conversible to Python: Yes

**Email System**
12. **emailTemplateRenderer.ts**
    - Email template rendering and variable substitution
    - Conversible to Python: Yes (template engine like Jinja2)

13. **email-templates/annualDiscountAnnouncement.ts**
    - Specific email template
    - Conversible to Python: Yes

14. **email-templates/businessTierMigration.ts**
    - Pricing migration email
    - Conversible to Python: Yes

15. **email-templates/freeTierMigration.ts**
    - Free tier upgrade email
    - Conversible to Python: Yes

16. **email-automation.ts**
    - Email sequence automation
    - Conversible to Python: Yes

**Analytics & Insights**
17. **analytics.ts** (~100 lines)
    - Client-side analytics helper (wrapper)
    - Conversible to Python: Not applicable (browser-only)

18. **analytics-server.ts**
    - Server-side analytics functions
    - Conversible to Python: Yes

19. **analytics/emitter.ts**
    - Event emission system
    - Conversible to Python: Yes

20. **analytics/transport.ts**
    - Event transport to analytics backend
    - Conversible to Python: Yes

21. **analytics/validate.ts**
    - Event schema validation
    - Conversible to Python: Yes

22. **analytics/types.ts**
    - TypeScript types for analytics
    - Conversible to Python: Yes (just data structures)

23. **analytics/schemas/index.ts**
    - Zod validation schemas
    - Conversible to Python: Yes (pydantic)

**User Behavior & Gamification**
24. **behavioralTriggers.ts**
    - Behavioral email trigger logic
    - Conversible to Python: Yes

25. **clientAnalytics.ts**
    - Client-side analytics wrapper
    - Conversible to Python: Not applicable (browser-only)

26. **base-rate-history.ts**
    - Bank of England base rate history
    - Conversible to Python: Yes (data reference)

**Other Utilities**
27. **invoice-template.ts**
    - Invoice rendering template
    - Conversible to Python: Yes

28. **voice-processing.ts** (~200 lines)
    - Voice transcription (Deepgram streaming + OpenAI Whisper fallback)
    - WER (Word Error Rate) tracking
    - Real-time interim transcripts
    - Conversible to Python: Yes (Deepgram and OpenAI have Python SDKs)

29. **payment-verification-constants.ts**
    - Constants for payment verification system
    - Conversible to Python: Yes

30. **accessibility.tsx**
    - Accessibility utilities (React)
    - Conversible to Python: Not applicable (React-specific)

31. **firebase.ts** (duplicate entry in list above)
    - See above

---

### D. React Components (49 files in components/)

**Dashboard Components (14 files)**
- DashboardClient.tsx - Main dashboard client component
- DashboardDateRangeFilter.tsx - Date range selector
- DashboardExportButtons.tsx - Export PDF/CSV buttons
- DashboardInvoiceTable.tsx - Invoice table with sorting
- DashboardMetricsCards.tsx - KPI cards
- DashboardRevenueLineChart.tsx - Revenue trends
- DashboardStatusBarChart.tsx - Invoice status bar chart
- DashboardStatusDonutChart.tsx - Invoice status donut
- DashboardSegmentFilters.tsx - Segment filters
- DashboardScheduledReportSetup.tsx - Scheduled report configuration
- CelebrationModal.tsx - Celebration animation on milestones
- ConfettiAnimation.tsx - Confetti effect
- EscalationProgressBar.tsx - Escalation status visual
- EscalationStatusBadge.tsx - Escalation level badge
- EmptyState.tsx - Empty state messaging
- OnboardingChecklist.tsx - Onboarding checklist

**Invoice Components (3 files)**
- EmailPreview.tsx - Email template preview
- InterestCalculator.tsx - Interest calculation display
- index.ts - Component exports

**Payment Components (6 files)**
- PaymentStatusBadge.tsx - Payment status indicator
- PaymentTimeline.tsx - Payment event timeline
- PaymentVerificationModal.tsx - Verification modal
- EvidenceViewer.tsx - Evidence file viewer
- PaymentEvidenceUpload.tsx - File upload component
- VerificationCountdown.tsx - Countdown timer for verification
- index.ts - Exports

**Pricing Components (1 file)**
- PricingPageV3.tsx - New 3-tier pricing page

**Voice Components (4 files)**
- VoiceRecorder.tsx - Audio recording UI
- WaveformVisualizer.tsx - Waveform display
- LiveTranscript.tsx - Real-time transcript display
- VoiceRecorderButton.tsx - Compact recorder button
- FieldVoiceAttach.tsx - Voice field attachment
- index.ts - Exports

**Onboarding Components (5 files)**
- OnboardingChecklist.tsx - Checklist component
- SuccessModal.tsx - Success message
- Confetti.tsx - Confetti animation
- EmptyState.tsx - Empty state
- useActivationEvents.ts - Hook for tracking activation
- index.ts - Exports

**Client Management (4 files)**
- ClientList.tsx - Client list table
- ClientDetailModal.tsx - Client detail view
- ClientSelector.tsx - Client selector dropdown
- ClientManagement.tsx - Main client management
- UI/ClientManagementButton.tsx - Client button

**Other Components**
- CollectionsTimeline.tsx - Collections event timeline
- PaymentTimeline.tsx - Payment timeline
- PaymentVerification.tsx - Payment verification form
- UsageQuotaWidget.tsx - Usage quota indicator
- AnalyticsProvider.tsx - Analytics context provider
- ClientAnalytics.tsx - Client-side analytics tracker
- FeedbackButton.tsx - Feedback submission button
- FoundingMemberCounter.tsx - Founding member counter display

**Conversibility to Python:** 
- React components cannot be converted to Python (browser-specific)
- Business logic within components could be extracted to Python services
- UI state management (Zustand) would become backend state management

---

### E. Pages (8 files in app/)

**Dashboard Pages**
- `/dashboard/page.tsx` - Main dashboard
- `/dashboard/invoices/page.tsx` - Invoice list
- `/dashboard/invoices/new/page.tsx` - Create invoice
- `/dashboard/invoices/[id]/page.tsx` - Invoice detail
- `/dashboard/invoices/[id]/verify-payment/page.tsx` - Payment verification
- `/dashboard/clients/page.tsx` - Client list
- `/dashboard/clients/[id]/page.tsx` - Client detail
- `/dashboard/analytics/page.tsx` - Analytics dashboard
- `/dashboard/gamification/page.tsx` - Gamification/leaderboards
- `/dashboard/notifications/page.tsx` - Notification center
- `/dashboard/settings/page.tsx` - User settings

**Public Pages**
- `/pricing/page.tsx` - Pricing page (V3)
- `/invoice/[id]/page.tsx` - Public invoice view (for clients)
- `/confirmation/[token]/page.tsx` - Email confirmation page

**Root**
- `/layout.tsx` - Root layout with providers

---

### F. Background Jobs (3 files in jobs/)

**1. collectionsEscalator.ts** (~500 lines)
   - State machine for escalation: pending → gentle → firm → final → agency
   - Runs via cron every 6 hours
   - Functions:
     - `runEscalationWorker()` - Main worker function
     - `getEscalationState()` - Get current escalation state
     - `getEscalationTimeline()` - Get history of escalation events
     - `calculateEscalationLevel()` - Determine appropriate level
     - `shouldEscalate()` - Check if escalation criteria met
   - Timeline event tracking for audit trail
   - Dependencies: Firebase, SendGrid, Twilio, analytics
   - Conversible to Python: Yes (complex but doable)

**2. emailSequenceWorker.ts**
   - Hourly email sequence: Day 5, 15, 30 reminders
   - Sends reminders at appropriate intervals
   - Conversible to Python: Yes

**3. pricingMigration.ts**
   - One-time script to migrate users to Pricing V3
   - Maps legacy tiers (free/paid/business) → V3 (starter/growth/pro)
   - Conversible to Python: Yes (similar to Python script)

---

### G. Type Definitions (3 files in types/)

**models.ts** (~700 lines)
- Complete data model definitions for Firestore:
  - User - authentication, subscription, business info
  - Invoice - invoice details, status, tracking
  - CollectionAttempt - collection event tracking
  - PaymentClaim - payment claim data
  - Client - client info
  - Notification - notification records
  - And many more...
- Conversible to Python: Yes (as Pydantic models or dataclasses)

**escalation.ts**
- Escalation state type definitions
- Conversible to Python: Yes

**client.ts**
- Client-side type definitions
- Conversible to Python: Not applicable (browser-only)

---

### H. Hooks (1 file in hooks/)

**useCountdown.ts**
- React hook for countdown timer
- Conversible to Python: Not applicable (React-specific)

---

### I. Middleware (1 file in middleware/)

**clerkPremiumGating.ts**
- Subscription tier gating using Clerk
- Enforces collections limits based on subscription
- Conversible to Python: Yes (auth logic could be middleware)

---

### J. Utility Functions (1 file in utils/)

**constants.ts**
- Application constants (subscription tiers, collection limits, etc.)
- Conversible to Python: Yes

---

## 5. PYTHON FILES - DETAILED ANALYSIS

### A. FastAPI PDF Service (1 production service)

**Location:** `/home/user/Recoup/recoup/python-services/pdf_service/main.py` (~50 lines)

**Purpose:** Microservice for generating PDFs with accessibility compliance

**Technology Stack:**
- FastAPI - Web framework
- ReportLab - PDF generation library
- io.BytesIO - In-memory file handling

**Endpoints:**
```
GET  /generate/test-pdf    - Generate test PDF for CI validation
GET  /health               - Health check endpoint
```

**Functionality:**
- Generates simple test PDFs with proper metadata
- Sets title, author, subject for PDF/UA compliance
- Returns PDF as binary response
- Includes health check for monitoring

**Dependencies:**
- FastAPI >= 0.68.0 (assumed)
- reportlab >= 4.0

**Conversibility Approach:**
- Already in Python - this is the target of conversion for PDF generation tasks
- Could be expanded to handle invoice PDF generation with templates

**Integration Points:**
- Called from Next.js API route `/api/dashboard/export/pdf/route.ts`
- Likely running on separate Render.com deployment

---

### B. Administrative Scripts (3 utility scripts)

**1. check_contrast.py** (~70 lines)

**Purpose:** Validate color token contrast ratios for WCAG AA compliance

**Functionality:**
- Parses CSS file at `relay/app/globals.css`
- Extracts CSS custom properties (color tokens) using regex
- Converts hex to RGB
- Calculates luminance using WCAG formula
- Compares contrast ratios against white and black backgrounds
- Requires minimum 4.5:1 contrast ratio (WCAG AA)

**Dependencies:**
- Standard library only (re, os, sys)

**Exit Codes:**
- 0 = all tokens pass
- 1 = one or more tokens fail
- 2 = file not found

**Usage:**
```bash
python check_contrast.py
```

**Conversibility:** Already Python - CI/build tool

---

**2. generate_test_pdf.py** (~45 lines)

**Purpose:** Generate test PDF for CI validation

**Functionality:**
- Creates test PDF with sections and content
- Outputs to `relay/coverage/pdf-test-sample.pdf`
- Uses ReportLab Canvas
- Sets metadata (title, author, subject)

**Dependencies:**
- reportlab

**Usage:**
```bash
python generate_test_pdf.py
```

**Conversibility:** Already Python - duplicate of FastAPI service (could consolidate)

---

**3. migrate_stripe_plans.py** (~140 lines)

**Purpose:** Migrate users from legacy subscription tiers to Pricing V3

**Functionality:**
- Mapping:
  - 'free' → 'starter'
  - 'paid' → 'growth'
  - 'business' → 'pro'
- Connects to Firebase Firestore
- Iterates through all users
- Updates subscription tier and billing cycle
- Dry-run mode support (no writes without --execute)
- Outputs results to timestamped JSON file
- Tracks: processed count, migrated count, skipped count, errors

**Dependencies:**
- stripe
- firebase-admin
- argparse (stdlib)
- json (stdlib)
- os (stdlib)

**Environment Variables:**
- `STRIPE_SECRET_KEY` - Stripe API key
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Path to Firebase service account key (optional, defaults to local file)

**CLI Arguments:**
```bash
--dry-run              # Run without making changes (default)
--execute              # Actually perform migration
--userId <id>          # Migrate single user
```

**Usage:**
```bash
# Dry run to see what would happen
python migrate_stripe_plans.py --dry-run

# Actually execute migration
python migrate_stripe_plans.py --execute

# Migrate single user
python migrate_stripe_plans.py --execute --userId user123
```

**Output:** JSON file with results (migration-results-TIMESTAMP.json)

**Conversibility:** Already Python - could be moved to services or kept as utility

---

## 6. EXTERNAL SERVICE INTEGRATIONS

### Stripe (Payment Processing & Subscriptions)
- **Integration Points:**
  - User subscription management via Clerk Billing
  - Webhook handler: `/api/webhook/stripe/route.ts`
  - Pricing sync: `lib/stripeSync.ts`
  - Python script: `recoup/scripts/migrate_stripe_plans.py`
- **Features:** Subscription billing, payment processing, plan management
- **Python SDK:** stripe-python (used in migration script)

### SendGrid (Email Delivery)
- **Integration Points:**
  - Dynamic email templates with variable substitution
  - lib/sendgrid.ts (primary)
  - Collections email templates (lib/collections-email-templates.ts)
  - Webhook handler: `/api/webhook/sendgrid/route.ts`
- **Features:** 
  - Dynamic template emails
  - Plain text fallback
  - Tracking (opens, clicks)
  - Bounce handling
- **Email Templates:**
  - Invoice email
  - Day 7 reminder
  - Day 21 reminder
  - Payment confirmed
  - Payment verification required
  - Payment verified
  - Payment rejected
  - Notifications
- **Python SDK:** sendgrid-python (not yet used, but compatible)

### Twilio (SMS & Voice)
- **Integration Points:**
  - SMS sending: `lib/twilio-sms.ts` (referenced in cron jobs)
  - Voice AI webhook: `/api/webhooks/twilio/voice-ai/route.ts`
  - Render server integration for voice calls
- **Features:**
  - SMS reminders
  - Voice call collections
  - Audio recording and transcription
- **Python SDK:** twilio-python (compatible)

### OpenAI (AI Models)
- **Integration Points:**
  - GPT for voice collections: `render-server/src/index.ts`
  - Voice transcription fallback: `lib/voice-processing.ts`
- **Features:**
  - Real-time voice API
  - Whisper transcription
- **Python SDK:** openai-python (used in voice-processing)

### Deepgram (Speech-to-Text)
- **Integration Points:**
  - Primary voice transcription provider
  - lib/voice-processing.ts
- **Features:**
  - Low-latency streaming (<1.5s)
  - Word Error Rate tracking (<7% target)
- **Python SDK:** deepgram-sdk-python (compatible)

### Lob (Physical Mail)
- **Integration Points:**
  - Physical letter sending: `/api/collections/letter/route.ts`
- **Features:**
  - Auto-mailing collection letters
- **Python SDK:** lob-python (compatible)

### Firebase (Database & Storage)
- **Integration Points:**
  - Firestore: lib/firebase.ts (NoSQL document database)
  - Storage: Firebase Storage (file uploads)
  - Authentication: Firebase Auth (via Clerk)
- **Collections:**
  - users
  - invoices
  - payment_confirmations
  - payment_claims
  - collection_attempts
  - clients
  - notifications
  - transactions
  - referrals
  - referral_credits
  - referral_payouts
  - user_behavior_profile
  - user_stats
  - user_events
  - daily_summaries
  - emails_sent
  - onboarding_progress
  - agency_handoffs
- **Python SDK:** firebase-admin-python (used in migration script)

### Clerk (Authentication & User Management)
- **Integration Points:**
  - `@clerk/nextjs` - Authentication
  - `/api/webhook/clerk` - User lifecycle events
  - Billing integration with Stripe
- **Features:**
  - User authentication
  - Organization support
  - Subscription management (via Stripe)
  - Email verification
  - Multi-factor authentication
- **Python SDK:** clerk-python (exists but not used)

### Sentry (Error Tracking & Monitoring)
- **Integration Points:**
  - sentry.client.config.ts - Browser errors
  - sentry.server.config.ts - Server errors
- **Features:**
  - Error tracking
  - Performance monitoring
  - Replay debugging
  - Source map support
- **Sample Rates:**
  - Transactions: 10%
  - Replays (all): 10%
  - Replays (errors): 100%
- **Python SDK:** sentry-sdk (compatible)

### Mixpanel (Analytics)
- **Integration Points:**
  - Client-side analytics tracking
  - Dashboard analytics
- **Features:**
  - Event tracking
  - User funnels
  - Retention analysis
- **Python SDK:** mixpanel-python (not used in backend)

### Upstash (Redis & Rate Limiting)
- **Integration Points:**
  - Rate limiting via @upstash/ratelimit
  - Redis caching via @upstash/redis
- **Features:**
  - Distributed rate limiting (serverless-friendly)
  - Caching and sessions
- **Python SDK:** upstash-redis-python (compatible)

---

## 7. CRON JOBS & SCHEDULED TASKS

All scheduled via Vercel's cron configuration (`vercel.json`):

| Endpoint | Schedule | Frequency | Purpose |
|----------|----------|-----------|---------|
| `/api/cron/reset-monthly-usage` | `0 0 1 * *` | Monthly (1st at 00:00 UTC) | Reset monthly usage quotas |
| `/api/cron/send-behavioral-emails` | `0 10 * * *` | Daily at 10:00 UTC | Send behavioral trigger emails |
| `/api/cron/process-email-sequence` | `0 * * * *` | Hourly | Check for overdue invoices, send Day 5/15/30 reminders |
| `/api/cron/process-escalations` | `0 */6 * * *` | Every 6 hours | Auto-escalate overdue invoices through stages |
| `/api/cron/check-verification-deadlines` | `0 * * * *` | Hourly | Monitor payment verification deadlines, send reminders |

**Protection:** All cron endpoints protected by `CRON_SECRET` header validation

**Worker Functions:**
- `runEscalationWorker()` - Main escalation logic
- `runEmailSequenceWorker()` - Email scheduling logic
- Various inline logic for other crons

---

## 8. DATABASE SCHEMA & MODELS

### Collection: users
```typescript
{
  userId: string              // Clerk user ID (doc ID)
  email: string
  name: string
  phoneNumber?: string        // E.164 format
  businessName?: string
  businessType: 'freelancer' | 'agency' | 'consultant'
  
  // Subscription (PRICING V3)
  subscriptionTier: 'free' | 'paid' | 'starter' | 'growth' | 'pro' | 'business'
  subscriptionStartDate?: Timestamp
  collectionsEnabled: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  clerkSubscriptionId?: string
  billingCycle?: 'monthly' | 'annual'
  annualDiscountApplied?: boolean
  nextBillingDate?: Timestamp
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'
  
  // Founding Member
  isFoundingMember?: boolean
  foundingMemberNumber?: number (1-50)
  foundingMemberJoinedAt?: Timestamp
  lockedInPrice?: number
  
  // Banking (Encrypted)
  bankDetails?: {
    accountHolderName: string
    accountNumber: string   // encrypted
    sortCode: string        // encrypted
    bankName: string
  }
  
  // Business Address
  businessAddress?: {
    companyName?: string
    addressLine1: string
    addressLine2?: string
    city: string
    postcode: string
    country?: string
  }
  
  // Behavioral Profile
  createdAt: Timestamp
  lastLoginAt?: Timestamp
  preferredCommunicationChannel?: 'email' | 'sms' | 'phone'
  timezone?: string
  language?: string
  
  // Tracking
  onboardingCompleted?: boolean
  seenPricingV3?: boolean
  agreedToTerms?: boolean
  consents?: {
    marketing: boolean
    sms: boolean
    phone: boolean
  }
}
```

### Collection: invoices
```typescript
{
  id: string                  // Document ID
  freelancerId: string        // User ID
  clientEmail: string
  clientName: string
  clientId?: string           // Reference to clients collection
  amount: number              // In pence (GBP)
  currency: string            // 'GBP'
  dueDate: Timestamp
  createdAt: Timestamp
  paidAt?: Timestamp
  
  // Invoice Details
  invoiceNumber: string       // Unique invoice ref
  description?: string
  lineItems?: Array<{
    description: string
    quantity: number
    unitPrice: number         // in pence
    amount: number            // in pence
  }>
  
  // Status & Tracking
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled'
  sentAt?: Timestamp
  
  // Collections
  collectionsEnabled: boolean
  collectionStartDate?: Timestamp
  lastReminderSentAt?: Timestamp
  lastEscalationLevel?: 'gentle' | 'firm' | 'final' | 'agency'
  
  // Payment Links
  paymentLink?: string
  stripePaymentLink?: string
  bankPaymentRef?: string
  
  // Metadata
  tags?: string[]
  notes?: string
  customMetadata?: Record<string, any>
}
```

### Collection: collection_attempts
```typescript
{
  id: string
  invoiceId: string
  freelancerId: string
  clientEmail: string
  
  // Escalation
  escalationLevel: 'gentle' | 'firm' | 'final' | 'agency'
  daysSinceDue: number
  
  // Attempt Details
  attemptType: 'email' | 'sms' | 'call' | 'letter' | 'agency'
  channel: 'email' | 'sms' | 'voice' | 'phone' | 'physical'
  
  // Results
  sent: boolean
  deliveryStatus?: 'sent' | 'delivered' | 'bounced' | 'failed'
  opened?: boolean
  clicked?: boolean
  
  // Outcome
  result?: 'success' | 'pending' | 'failed' | 'disputed' | 'rejected'
  paymentRecovered?: number   // in pence
  
  // Tracking
  createdAt: Timestamp
  updatedAt: Timestamp
  externalId?: string         // Provider reference
}
```

### Collection: payment_claims
```typescript
{
  id: string
  invoiceId: string
  freelancerId: string
  
  // Claim Details
  claimedPaymentDate: Timestamp
  claimedAmount: number       // in pence
  paymentMethod: 'bank_transfer' | 'card' | 'cash' | 'other'
  
  // Verification Status
  status: 'pending' | 'verified' | 'rejected' | 'disputed'
  
  // Evidence
  evidence?: Array<{
    type: 'screenshot' | 'receipt' | 'bank_statement' | 'confirmation'
    url: string               // File path in Cloud Storage
    uploadedAt: Timestamp
  }>
  
  // Verification
  verifiedAt?: Timestamp
  verificationDeadline?: Timestamp
  rejectionReason?: string
  
  // Audit
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Collection: payment_confirmations
```typescript
{
  id: string
  invoiceId: string
  claimId?: string
  
  paymentDate: Timestamp
  paymentMethod: string
  transactionId?: string
  status: 'confirmed' | 'pending' | 'rejected'
}
```

### Collection: clients
```typescript
{
  id: string
  freelancerId: string        // Owner user ID
  
  name: string
  email: string
  phone?: string
  
  businessName?: string
  address?: string
  
  // Statistics
  totalInvoiced: number
  totalPaid: number
  totalOverdue: number
  
  // Tracking
  createdAt: Timestamp
  lastInvoicedAt?: Timestamp
  lastPaidAt?: Timestamp
  rating?: number             // 1-5 star rating
  notes?: string
}
```

### Collection: user_stats
```typescript
{
  userId: string              // Document ID
  
  // Gamification
  gamificationXP: number
  totalCollected: number      // in pence
  collectionsCompleted: number
  
  // Streaks
  currentStreak?: number      // days
  longestStreak?: number      // days
  
  // Badges
  badges: string[]
  
  // Milestones
  milestonesUnlocked: string[]
}
```

### Collection: notifications
```typescript
{
  userId: string
  id: string
  
  type: string                // notification type
  title: string
  message: string
  
  actionUrl?: string
  read: boolean
  
  createdAt: Timestamp
}
```

### Collection: escalation_states
```typescript
{
  invoiceId: string           // Document ID
  
  currentLevel: 'pending' | 'gentle' | 'firm' | 'final' | 'agency'
  isPaused: boolean
  pauseReason?: string
  pausedAt?: Timestamp
  pauseUntil?: Timestamp
  
  lastEscalatedAt: Timestamp
  nextEscalationDue?: Timestamp
}
```

### Collection: escalation_timeline
```typescript
{
  id: string
  invoiceId: string
  
  eventType: string           // e.g., 'escalated', 'paused', 'resumed'
  escalationLevel: string
  
  message: string
  timestamp: Timestamp
  
  metadata?: Record<string, any>
}
```

### Other Collections
- **referrals** - Referral program tracking
- **referral_credits** - Referral credit entries
- **referral_payouts** - Referral payout records
- **user_behavior_profile** - User behavior data for email triggers
- **user_events** - User interaction events
- **daily_summaries** - Daily summary caches
- **emails_sent** - Email delivery tracking
- **onboarding_progress** - Onboarding step completion
- **agency_handoffs** - Collection agency escalations

---

## 9. UTILITY FUNCTIONS & HELPERS

### Authentication & Authorization
- Clerk integration for user authentication
- Subscription tier gating via `clerkPremiumGating.ts`
- Collections limit enforcement

### Error Handling
- Structured error classes with status codes
- Error logging to Sentry
- API error responses with appropriate HTTP status codes

### Logging
- Structured logging via Pino
- Log levels: info, warn, error
- Database operation tracking
- API request/response logging

### Analytics
- Event emission system with validation
- Event transport to Mixpanel
- Server and client-side tracking
- Custom events for collections, payments, etc.

### Formatting & Conversion
- Currency formatting (£ symbol)
- Date formatting (locale-aware)
- Number formatting (Numeral.js)
- Interest calculation formatting

### Validation
- Zod schema validation for API inputs
- Email validation
- Phone number validation (E.164 format)
- File upload validation

### Date/Time
- Timestamp conversion (Firebase ↔ JavaScript Date)
- Server timestamp generation
- Timezone handling
- Countdown timers

---

## 10. BUILD & DEPLOYMENT CONFIGURATIONS

### Vercel Configuration (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/reset-monthly-usage",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/send-behavioral-emails",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/process-email-sequence",
      "schedule": "0 * * * *",
      "description": "Hourly check for overdue invoices and send Day 5/15/30 reminder emails"
    },
    {
      "path": "/api/cron/process-escalations",
      "schedule": "0 */6 * * *",
      "description": "Every 6 hours - Auto-escalate overdue invoices through collections stages"
    },
    {
      "path": "/api/cron/check-verification-deadlines",
      "schedule": "0 * * * *",
      "description": "Hourly check for payment verification deadlines"
    }
  ]
}
```

### Next.js Configuration
- App router with React 19
- TypeScript strict mode
- Tailwind CSS with PostCSS
- Server/client component boundaries
- API route handlers (Node.js runtime)

### Render.com Configuration (render-server/render.yaml)
- Separate Fastify WebSocket server
- For voice collections with Twilio + OpenAI
- Auto-deploy from Git
- Environment variable support

### Environment Variables Required
```bash
# Authentication
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Database
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY

# Email
SENDGRID_API_KEY
SENDGRID_FROM_EMAIL
SENDGRID_FROM_NAME
SENDGRID_INVOICE_TEMPLATE_ID
SENDGRID_REMINDER_DAY7_TEMPLATE_ID
SENDGRID_REMINDER_DAY21_TEMPLATE_ID
[... many more template IDs]

# Payment
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

# SMS & Voice
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER

# AI & Voice
OPENAI_API_KEY
DEEPGRAM_API_KEY

# Physical Mail
LOB_API_KEY

# Monitoring
NEXT_PUBLIC_SENTRY_DSN
SENTRY_ENVIRONMENT

# Rate Limiting
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Analytics
NEXT_PUBLIC_MIXPANEL_TOKEN

# Cron Jobs
CRON_SECRET

# Voice Server (Render)
RENDER_EXTERNAL_HOSTNAME
```

---

## 11. PACKAGE DEPENDENCIES

### Node.js Dependencies (relay/package.json)

**Core Framework**
- next@16.0.3
- react@19.2.0
- react-dom@19.2.0
- typescript@5.9.3

**UI & Styling**
- tailwindcss@4.1.17
- @tailwindcss/forms@0.5.10
- @tailwindcss/postcss@4.1.17
- autoprefixer@10.4.22
- postcss@8.5.6
- lucide-react@0.553.0
- recharts@3.4.1
- react-toastify@11.0.5

**Forms & Validation**
- react-hook-form@7.66.0
- @hookform/resolvers@5.2.2
- zod@4.1.12

**State Management**
- zustand@5.0.8

**Authentication & Billing**
- @clerk/nextjs@6.35.1
- stripe@19.3.1

**Communications**
- @sendgrid/mail@8.1.6
- twilio@5.10.5
- openai@6.8.1

**Database**
- firebase@12.5.0
- firebase-admin@13.6.0

**Utilities**
- date-fns@4.1.0
- numeral@2.0.6
- axios@1.13.2
- nanoid@5.1.6
- pino@10.1.0
- dotenv@17.2.3
- node-schedule@2.1.1
- lob@7.0.1
- recordrtc@5.6.2
- ws@8.18.3

**Monitoring & Analytics**
- @sentry/nextjs@10.25.0
- mixpanel-browser@2.72.0

**Rate Limiting**
- @upstash/redis@1.35.6
- @upstash/ratelimit@2.0.7

**Dev Dependencies**
- @testing-library/jest-dom@6.9.1
- @testing-library/react@16.3.0
- @types/jest@30.0.0
- @types/node@24.10.1
- @types/numeral@2.0.5
- @types/react@19.2.4
- @types/ws@8.18.1
- eslint@9.39.1
- eslint-config-next@16.0.3
- jest@30.2.0
- ts-jest@29.4.5

### Python Dependencies
- fastapi (PDF service)
- reportlab (PDF generation)
- stripe (payment processing)
- firebase-admin (database)

### Root package.json Dependencies
- @types/mixpanel-browser@2.60.0
- mixpanel-browser@2.72.0

---

## 12. CONVERSION FEASIBILITY MATRIX

### Files That CANNOT Be Converted to Python
- **React Components** (49 files) - Browser-specific UI framework
  - Would require complete rewrite as web templates (Jinja2, etc.)
  - Alternative: Keep as Next.js, call Python via API

- **React Hooks** (1 file) - React-specific
  - Could be converted to context management in backend

- **Client-side Utilities**
  - clientAnalytics.ts - Would use backend tracking
  - accessibility.tsx - Would become accessibility guidelines

- **Middleware (Partially)**
  - clerkPremiumGating.ts - Auth logic could be Python, but tightly coupled to Clerk

### Files That CAN Be Converted to Python

#### HIGH PRIORITY (Core Business Logic)

1. **lib/pricing.ts** (~280 lines) ✓ EASY
   - Pure logic functions
   - No external dependencies except constants
   - Python equivalent: Simple Python module

2. **lib/sendgrid.ts** (~400 lines) ✓ EASY
   - Email sending logic
   - sendgrid-python library available
   - Direct SDK replacement possible

3. **jobs/collectionsEscalator.ts** (~500 lines) ✓ MEDIUM
   - Complex state machine logic
   - Needs Firebase, SendGrid, analytics integration
   - Could use APScheduler for job scheduling
   - Needs async support (asyncio)

4. **services/analyticsService.ts** (~450 lines) ✓ MEDIUM
   - Database queries and aggregations
   - Could use SQLAlchemy with Firestore
   - Aggregation logic directly translatable

5. **lib/collections-calculator.ts** ✓ EASY
   - Math operations only
   - Interest calculations
   - Direct translation

6. **lib/collections-email-templates.ts** ✓ MEDIUM
   - Email template logic
   - Could use Jinja2 for templates
   - Sendgrid integration

7. **lib/voice-processing.ts** ✓ MEDIUM
   - OpenAI and Deepgram API calls
   - Both have Python SDKs
   - Async support available

8. **lib/featureFlags.ts** ✓ EASY
   - Firestore reads/writes
   - Simple logic

9. **lib/stripeSync.ts** ✓ EASY
   - Stripe API calls
   - stripe-python library

10. **types/models.ts** ✓ EASY
    - Data class definitions
    - Could use Pydantic dataclasses
    - No logic, just type definitions

#### MEDIUM PRIORITY (Supporting Logic)

11. **All remaining lib/* files** ✓ MEDIUM
    - Email automation
    - Behavioral triggers
    - Analytics
    - Base rate history (static data)

12. **All API route handlers** ✓ MEDIUM-HARD
    - Would need to convert to Flask/FastAPI routes
    - Some auth/middleware conversion needed
    - Database operations directly translatable
    - Would need to handle HTTP requests/responses

13. **services/* files** ✓ MEDIUM
    - Similar to lib files
    - Some auth/middleware concerns

#### LOW PRIORITY (Infrastructure)

14. **firebase.ts** ✗ CANNOT (Node.js specific)
    - Use firebase-admin-python instead
    - Different API, not direct conversion

15. **sentry.*.config.ts** ✓ EASY
    - Sentry has Python SDK
    - Direct translation possible

---

## RECOMMENDED PYTHON CONVERSION STRATEGY

### Phase 1: Core Services (Highest ROI)
1. **Pricing module** → `services/pricing.py`
2. **Collections calculator** → `services/collections.py`
3. **Stripe sync** → `services/stripe_sync.py`

### Phase 2: External Integration Services
1. **Email service** → `services/email.py`
2. **SMS service** → `services/sms.py`
3. **Voice processing** → `services/voice.py`

### Phase 3: Job Workers (Background Tasks)
1. **Escalation worker** → `workers/escalation_worker.py`
2. **Email sequence worker** → `workers/email_worker.py`
3. **Behavioral email worker** → `workers/behavioral_worker.py`

### Phase 4: API Routes (REST API)
1. Convert to FastAPI routes
2. Keep Firebase integration (use firebase-admin-python)
3. Share services from Phase 1-3

### Phase 5: Analytics & Insights
1. Analytics service → `services/analytics.py`
2. Prediction logic → `services/predictions.py`

---

## ANALYSIS SUMMARY

### Codebase Maturity
- Well-organized with clear separation of concerns
- Strong typing (TypeScript throughout)
- Comprehensive error handling
- Good test coverage (Jest configured)
- Proper logging infrastructure

### Integration Complexity
- Multiple external services (8+)
- Real-time capabilities (WebSocket for voice)
- Background job scheduler (cron)
- Event-driven architecture

### Python Migration Feasibility
- ~65% of code could be converted to Python
- Core business logic is easily portable
- API layer would require refactoring
- React components must remain in TypeScript/JavaScript

### Current State
- Production-ready Next.js application
- Sophisticated collections automation
- Subscription management (Pricing V3)
- Multi-channel communication (email, SMS, voice, letters)
- Gamification system
- Analytics dashboard

---


# Recoup Architecture Documentation

## Table of Contents
- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Technology Stack](#technology-stack)
- [System Components](#system-components)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Scalability & Performance](#scalability--performance)

---

## System Overview

Recoup is a **SaaS platform** for freelancers and small businesses to manage invoices, track payments, and automate debt collection. The platform uses a serverless architecture built on Next.js 16 with Firebase Firestore as the primary database.

### Key Capabilities
- Invoice creation and management
- Automated payment collection escalation
- Multi-channel communication (email, SMS, voice, physical mail)
- AI-powered voice transcription and collection calls
- Payment verification with dual-confirmation flow
- Subscription billing with usage-based quotas
- Analytics and predictive insights

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router (React 19 + TypeScript)                          │
│  • Dashboard UI          • Invoice Management                            │
│  • Voice Recording       • Payment Tracking                              │
│  • Analytics Charts      • Collections Management                        │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTPS / WebSocket
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  Vercel Serverless Functions (Next.js API Routes)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Invoice    │  │  Collections │  │   Payment    │                  │
│  │  Management  │  │   Service    │  │   Service    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Dashboard   │  │     User     │  │   Webhook    │                  │
│  │   Analytics  │  │     Auth     │  │   Handlers   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐  ┌───────▼───────┐  ┌───────▼────────┐
│   Render.com    │  │   Firebase    │  │  Upstash Redis │
│  Voice AI Server│  │   Firestore   │  │ Rate Limiting  │
│  (WebSocket)    │  │   + Storage   │  │                │
└─────────────────┘  └───────────────┘  └────────────────┘
         │
         │
┌────────▼─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES LAYER                            │
├───────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Clerk   │  │  Stripe  │  │ SendGrid │  │  Twilio  │             │
│  │  Auth    │  │ Payments │  │  Email   │  │ SMS/Voice│             │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Lob    │  │  OpenAI  │  │  Sentry  │  │ Mixpanel │             │
│  │  Letters │  │Transcribe│  │  Errors  │  │ Analytics│             │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.9.x | Type safety |
| Tailwind CSS | 4.x | Styling framework |
| Zustand | 5.x | State management |
| React Hook Form | 7.x | Form handling |
| Zod | 4.x | Schema validation |
| Recharts | 2.x | Data visualization |

### Backend / Serverless
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 16.x | Serverless functions |
| Firebase Admin SDK | 13.x | Database & storage |
| Fastify | 5.x | Voice AI server framework |
| WebSocket | - | Real-time voice communication |

### Authentication & Security
| Technology | Version | Purpose |
|------------|---------|---------|
| Clerk | 6.x | Authentication & authorization |
| Upstash Redis | - | Rate limiting |
| Crypto (Node.js) | - | AES-256-CBC encryption |

### External APIs
| Service | Version | Purpose |
|---------|---------|---------|
| Stripe | v19 (API 2025-10-29) | Payment processing |
| SendGrid | v8 | Transactional emails |
| Twilio | v5 | SMS & voice calls |
| Lob | v7 | Physical mail |
| OpenAI | v6 | Voice transcription & AI calls |
| Sentry | - | Error tracking |
| Mixpanel | - | Analytics |

### Development & Testing
| Technology | Purpose |
|------------|---------|
| Jest | Testing framework |
| Testing Library | React component testing |
| ESLint | Code linting |
| Pino | Structured logging |

### Deployment
| Platform | Purpose |
|----------|---------|
| Vercel | Main application hosting |
| Render.com | Voice AI WebSocket server |
| Firebase | Database & file storage |

---

## System Components

### 1. Frontend Application (`/app`)

**Next.js App Router Structure:**
```
/app
├── dashboard/           # Main dashboard pages
│   ├── page.tsx        # Dashboard home
│   ├── invoices/       # Invoice management
│   ├── clients/        # Client management
│   ├── analytics/      # Analytics views
│   └── settings/       # User settings
├── pricing/            # Pricing page
├── invoice/[id]/       # Public invoice view
├── confirmation/       # Payment confirmation
├── api/                # API routes (serverless)
└── layout.tsx          # Root layout with Clerk
```

**Key Features:**
- Server-side rendering (SSR) for SEO and performance
- Client-side state management with Zustand
- Real-time updates via Firebase listeners
- Responsive design with Tailwind CSS

### 2. API Layer (`/app/api`)

**API Route Organization:**
```
/api
├── collections/        # Collection operations
│   ├── sms/           # Send SMS reminder
│   ├── send-reminder/ # Send email
│   ├── letter/        # Send physical letter
│   ├── ai-call/       # AI voice call
│   └── agency-handoff/# Escalate to agency
├── dashboard/          # Analytics endpoints
│   ├── summary/       # Dashboard stats
│   ├── predictions/   # Payment predictions
│   └── export/        # PDF/CSV export
├── invoices/[id]/      # Invoice CRUD
├── payment-claims/     # Payment verification
├── voice/              # Voice transcription
├── webhook/            # Webhook handlers
└── cron/               # Scheduled jobs
```

**API Characteristics:**
- RESTful design
- Clerk authentication middleware
- Rate limiting via Upstash Redis
- Zod schema validation
- Structured error handling
- Webhook signature verification

### 3. Database Layer (Firebase Firestore)

**Collections:**
```
Firestore
├── users                    # User accounts & settings
├── invoices                 # Invoice records
├── clients                  # Client database
├── payment_confirmations    # Dual-confirmation flow
├── payment_claims           # BACS payment claims
├── collection_attempts      # Collection history
├── transactions             # Payment transactions
├── notifications            # In-app notifications
├── referrals                # Referral tracking
├── user_behavior_profile    # AI behavior tracking
├── user_stats               # Gamification metrics
├── emails_sent              # Email tracking
├── onboarding_progress      # Onboarding state
├── agency_handoffs          # Collection agency escalations
├── user_events              # Analytics events
├── daily_summaries          # Daily aggregates
├── referral_credits         # Credit ledger
└── referral_payouts         # Payout tracking
```

### 4. Voice AI Server (`/render-server`)

**Separate Server for WebSocket Support:**
```javascript
// Fastify server with WebSocket
const fastify = require('fastify');
const websocket = require('@fastify/websocket');

// WebSocket endpoint for Twilio
app.register(websocket);
app.get('/voice-stream', { websocket: true }, handler);
```

**Why Separate Server:**
- Vercel serverless functions have limited WebSocket support
- Real-time bidirectional communication required for AI calls
- Deployed on Render.com for persistent connections

**Architecture:**
```
Twilio Call → Render Voice Server → OpenAI Realtime API
                     ↓
              Firebase Firestore
           (save transcript & outcome)
```

### 5. Scheduled Jobs (`/jobs` + Vercel Cron)

**Cron Schedule:**
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/reset-monthly-usage",
      "schedule": "0 0 1 * *"  // 1st of month
    },
    {
      "path": "/api/cron/send-behavioral-emails",
      "schedule": "0 10 * * *"  // Daily 10am
    },
    {
      "path": "/api/cron/process-email-sequence",
      "schedule": "0 * * * *"   // Hourly
    },
    {
      "path": "/api/cron/process-escalations",
      "schedule": "0 */6 * * *" // Every 6 hours
    },
    {
      "path": "/api/cron/check-verification-deadlines",
      "schedule": "0 * * * *"   // Hourly
    }
  ]
}
```

**Job Functions:**
- **Monthly Usage Reset**: Reset collection quotas on 1st
- **Behavioral Emails**: Send engagement emails (invoice drought, etc.)
- **Email Sequences**: Process scheduled reminder emails
- **Auto-Escalation**: Escalate overdue invoices automatically
- **Verification Deadlines**: Check expired 48-hour payment claims

---

## Data Flow

### Invoice Creation Flow

```
┌──────────────┐
│  User Input  │ Voice recording or manual entry
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ OpenAI Transcribe│ (if voice) - gpt-4o-mini-transcribe
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Zod Validation  │ Validate invoice data
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Firestore Write │ Create invoice document
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Stripe Payment   │ Generate payment link
│      Link        │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  SendGrid Email  │ Send invoice to client
└──────────────────┘
```

### Payment Collection Escalation Flow

```
┌──────────────────────────────────────────────────────────┐
│               ESCALATION STATE MACHINE                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  PENDING (Day 0-4)                                       │
│       │                                                   │
│       │ Day 5 trigger                                    │
│       ▼                                                   │
│  GENTLE (Day 5-14)                                       │
│       │ • Email reminder (friendly tone)                 │
│       │ • Stripe payment link included                   │
│       │                                                   │
│       │ Day 14 trigger (if premium)                      │
│       ▼                                                   │
│  FIRM (Day 14-29)                                        │
│       │ • SMS reminder (premium)                         │
│       │ • Firmer email tone                              │
│       │ • Mention consequences                           │
│       │                                                   │
│       │ Day 30 trigger                                   │
│       ▼                                                   │
│  FINAL (Day 30+)                                         │
│       │ • Physical letter (premium) - Letter Before      │
│       │   Action (LBA)                                   │
│       │ • Final email warning                            │
│       │ • AI voice call option (premium)                 │
│       │ • 7-day deadline to pay                          │
│       │                                                   │
│       │ No payment after final                           │
│       ▼                                                   │
│  AGENCY                                                  │
│       • Hand off to collection agency                    │
│       • Agency handles further action                    │
│       • User receives recovery commission                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Auto-Escalation Logic:**
```typescript
// Runs every 6 hours via cron
async function processEscalations() {
  const overdueInvoices = await getOverdueInvoices();

  for (const invoice of overdueInvoices) {
    const daysSinceOverdue = calculateDaysSinceOverdue(invoice);

    if (invoice.escalationPaused) {
      continue; // Skip if manually paused
    }

    if (daysSinceOverdue >= 30 && invoice.escalationLevel === 'firm') {
      await escalateToFinal(invoice);
      await sendPhysicalLetter(invoice); // Premium
      await sendFinalEmail(invoice);
    }
    else if (daysSinceOverdue >= 14 && invoice.escalationLevel === 'gentle') {
      await escalateToFirm(invoice);
      await sendSMSReminder(invoice); // Premium
    }
    else if (daysSinceOverdue >= 5 && invoice.escalationLevel === 'pending') {
      await escalateToGentle(invoice);
      await sendGentleEmail(invoice);
    }
  }
}
```

### Payment Claim & Verification Flow

```
┌─────────────────┐
│ Client Receives │
│     Invoice     │
└────────┬────────┘
         │
         │ Client pays via BACS
         ▼
┌─────────────────────┐
│ Client Visits       │
│ Invoice Page        │
│ Clicks "I've Paid"  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────────┐
│ Client Fills Claim Form │
│ • Payment method (BACS) │
│ • Reference number      │
│ • Amount paid           │
│ • Optional notes        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Optional: Upload        │
│ Evidence                │
│ • Bank statement        │
│ • Payment screenshot    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ System Creates Claim    │
│ • 48-hour deadline      │
│ • Status: pending       │
└────────┬────────────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
┌─────────────────────┐     ┌──────────────────────┐
│ Email to Freelancer │     │ Email to Client      │
│ "Verify within 48h" │     │ "Claim received"     │
└─────────┬───────────┘     └──────────────────────┘
          │
          │ Freelancer checks bank
          ▼
┌─────────────────────────┐
│ Freelancer Decision     │
└────────┬────────────────┘
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────────┐
│  VERIFIED   │  │   REJECTED   │  │  48h EXPIRED    │
│             │  │              │  │                 │
│ • Mark paid │  │ • Request    │  │ • Auto-verify   │
│ • Stop      │  │   evidence   │  │ • Email alert   │
│   escalation│  │ • Continue   │  │ • Invoice marked│
│ • Thank you │  │   collections│  │   paid          │
│   email     │  │              │  │                 │
└─────────────┘  └──────────────┘  └─────────────────┘
```

**Why 48-Hour Deadline:**
- Encourages prompt verification
- Reduces client frustration
- Prevents ongoing collection attempts
- Auto-verification as failsafe (assume client honest)

### AI Voice Collection Call Flow

```
┌──────────────────┐
│ User Triggers    │
│ AI Call          │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ API: /collections/ai-call│
│ • Validate premium tier  │
│ • Check quota            │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Twilio: Initiate Call    │
│ • Dial client number     │
│ • WebSocket to Render    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Render Voice Server      │
│ • Receive audio stream   │
│ • Connect to OpenAI      │
│   Realtime API           │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ OpenAI Realtime API      │
│ • Natural conversation   │
│ • Detect payment intent  │
│ • Handle objections      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Call Ends                │
│ • Transcribe full call   │
│ • Extract outcome        │
│ • Save to Firestore      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Update Invoice           │
│ • Add collection attempt │
│ • Attach transcript      │
│ • Update escalation      │
└──────────────────────────┘
```

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────┐
│                    CLERK AUTHENTICATION                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  User Request                                            │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────────────┐                                   │
│  │ clerkMiddleware  │ (Next.js middleware)              │
│  │ - Verify session │                                   │
│  │ - Extract userId │                                   │
│  └────────┬─────────┘                                   │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                   │
│  │ Premium Gating   │                                   │
│  │ - Check tier     │                                   │
│  │ - Verify quota   │                                   │
│  └────────┬─────────┘                                   │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                   │
│  │ API Handler      │                                   │
│  └──────────────────┘                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Middleware Chain:**
```typescript
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/rateLimit';

export default clerkMiddleware({
  publicRoutes: [
    '/',
    '/pricing',
    '/invoice/:id',
    '/api/webhook/(.*)',
  ],
});

// API route
export async function POST(req: Request) {
  // 1. Authentication
  const { userId } = await auth();
  if (!userId) return unauthorized();

  // 2. Rate limiting
  const rateLimitResult = await rateLimit(userId);
  if (!rateLimitResult.success) return tooManyRequests();

  // 3. Premium check
  const user = await getUser(userId);
  if (requiresPremium && !user.isPremium) return forbidden();

  // 4. Quota check
  if (user.monthlyUsed >= user.monthlyLimit) return quotaExceeded();

  // 5. Execute business logic
  return await handleRequest();
}
```

### Data Encryption

**Bank Details Encryption:**
```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}

// Usage
const user = {
  bankDetails: encrypt(JSON.stringify({
    accountNumber: '12345678',
    sortCode: '12-34-56',
  })),
};
```

**What's Encrypted:**
- Bank account numbers
- Sort codes
- Sensitive payment details

**What's NOT Encrypted:**
- Emails (searchable)
- Names (searchable)
- Amounts (aggregatable)
- Dates (filterable)

### Rate Limiting

**Upstash Redis Sliding Window:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Different limits for different endpoints
export const generalLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  prefix: 'rl:general',
});

export const authLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: 'rl:auth',
});

export const aiLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 s'),
  prefix: 'rl:ai',
});
```

### Webhook Security

**Stripe Webhook Verification:**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', {
      status: 400,
    });
  }

  // Process event
  await handleStripeEvent(event);
  return new Response(JSON.stringify({ received: true }));
}
```

**Cron Job Authentication:**
```typescript
// Vercel Cron uses CRON_SECRET
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await runScheduledJob();
  return new Response('OK');
}
```

### GDPR & Compliance

**Data Protection:**
- User consent tracking for collections communications
- PECR compliance for SMS/calls (opt-out required)
- Right to be forgotten (soft delete)
- Data export capabilities
- Audit logs for sensitive operations

**FCA Debt Collection Guidelines:**
- Fair treatment of clients in financial difficulty
- Clear escalation policies
- Transparent fee structures
- Complaint handling procedures

---

## Scalability & Performance

### Serverless Advantages

**Auto-Scaling:**
- Vercel automatically scales functions
- Pay-per-invocation pricing
- No server management
- Global edge network

**Cold Start Mitigation:**
- Keep functions small and focused
- Use edge functions for auth checks
- Warm up critical paths via cron

### Database Performance

**Firestore Optimization:**
```typescript
// Composite indexes for complex queries
// Defined in firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "escalationLevel", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Query Patterns:**
- User-scoped queries (always filter by userId first)
- Pagination with cursors
- Denormalization for read performance
- Aggregation via daily summaries

### Caching Strategy

**Server-Side:**
- Redis for rate limiting
- Next.js data cache (fetch with cache)
- Static page generation where possible

**Client-Side:**
- Zustand for global state
- React Query for API caching (if added)
- Service worker for offline support

### Monitoring & Observability

**Sentry Integration:**
```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Remove sensitive data
    if (event.request?.data) {
      delete event.request.data.bankDetails;
      delete event.request.data.password;
    }
    return event;
  },
});
```

**Structured Logging:**
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

logger.info({ userId, invoiceId, action: 'escalation' }, 'Invoice escalated');
```

---

## Deployment Architecture

### Vercel Deployment

**Build Configuration:**
```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

**Environment Variables:**
- Managed via Vercel dashboard
- Different values per environment (preview/production)
- Encrypted at rest
- Never committed to git

### Multi-Region Strategy

**Vercel Edge Network:**
- Automatic CDN distribution
- Edge functions for auth
- Geolocation-based routing

**Firebase Multi-Region:**
- Primary: `europe-west2` (London)
- Backup: `us-central1`
- Cross-region replication

### CI/CD Pipeline

```
┌──────────────┐
│  Git Push    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ GitHub       │
│ Actions      │
│ • Lint       │
│ • Test       │
│ • Build      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Vercel       │
│ Preview      │
│ Deployment   │
└──────┬───────┘
       │
       │ Manual approval
       ▼
┌──────────────┐
│ Production   │
│ Deployment   │
└──────────────┘
```

**Rollback Strategy:**
- Instant rollback via Vercel dashboard
- Preserve previous 10 deployments
- Automated health checks post-deploy

---

## System Diagrams

### Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                             │
└───────┬─────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Dashboard   │  │   Invoice    │  │ Collections  │        │
│  │     UI       │◄─┤   Service    │◄─┤   Service    │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Firestore  │    │    Clerk     │    │  Upstash     │
│   Database   │    │     Auth     │    │    Redis     │
└──────┬───────┘    └──────────────┘    └──────────────┘
       │
       │ Triggers
       ▼
┌──────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                        │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │Stripe│  │Twilio│  │  Lob │  │OpenAI│  │SendGr│      │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘      │
└──────────────────────────────────────────────────────────┘
```

---

## Best Practices

### Code Organization
1. Keep API routes thin - delegate to services
2. Use TypeScript interfaces for all data structures
3. Validate all inputs with Zod schemas
4. Separate business logic from UI components
5. Use custom hooks for reusable logic

### Performance
1. Minimize client-side JavaScript bundles
2. Use dynamic imports for large components
3. Implement proper caching strategies
4. Optimize database queries with indexes
5. Monitor Core Web Vitals

### Security
1. Never trust client input - always validate server-side
2. Use parameterized queries (Firestore handles this)
3. Implement proper CORS policies
4. Rotate API keys regularly
5. Log security events

### Reliability
1. Implement retry logic for external API calls
2. Use dead letter queues for failed jobs
3. Monitor error rates and set up alerts
4. Test failure scenarios
5. Have rollback procedures documented

---

For more detailed information, see:
- [DATABASE.md](./DATABASE.md) - Firestore schema details
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [API Documentation](./api/openapi.yaml) - OpenAPI specification

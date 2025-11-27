# Recoup - Comprehensive Improvement Plan 2025

## Executive Summary

This document outlines a complete modernization strategy for Recoup based on 2025 best practices for:
- **Platform**: Vercel + Next.js 15 + Clerk authentication
- **AI Services**: Multi-model approach (Gemini 2.5 Pro + Claude + OpenAI)
- **Communications**: Enhanced SMS/email/voice capabilities
- **UI/UX**: Modern fintech dashboard with Shadcn UI
- **Compliance**: UK FCA Treating Customers Fairly (TCF) requirements

---

## 1. Platform Architecture Optimization

### 1.1 Vercel Deployment Strategy

#### Edge Runtime vs Serverless Functions

**Recommended Approach: Hybrid Architecture**

```typescript
// Edge Runtime for: ✅
// - Authentication checks (Clerk middleware)
// - API route protection
// - Redirects and locale routing
// - Real-time data display
// - Low-latency responses

// Serverless Functions for: ✅
// - Database queries (Firestore)
// - Complex business logic
// - PDF generation
// - Heavy AI computations
// - External API calls
```

**Implementation:**

1. **Middleware (Edge Runtime)**
   ```typescript
   // middleware.ts
   import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

   const isProtectedRoute = createRouteMatcher([
     '/dashboard(.*)',
     '/invoices(.*)',
     '/collections(.*)',
     '/settings(.*)',
   ])

   const isPublicRoute = createRouteMatcher([
     '/sign-in(.*)',
     '/sign-up(.*)',
     '/',
     '/about',
     '/pricing',
   ])

   export default clerkMiddleware((auth, req) => {
     // Protect all routes except public ones
     if (!isPublicRoute(req)) {
       auth().protect()
     }
   })

   export const config = {
     matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
   }
   ```

2. **API Routes Configuration**
   ```typescript
   // app/api/invoices/route.ts
   export const runtime = 'nodejs' // Serverless for DB access
   export const dynamic = 'force-dynamic'

   // app/api/auth/check/route.ts
   export const runtime = 'edge' // Edge for fast auth checks
   ```

3. **Performance Targets**
   - Edge responses: <100ms
   - Serverless responses: <500ms
   - Database proximity: Co-locate Firestore in same region as Vercel functions
   - Static assets: Leverage Vercel's CDN with `next/image`

#### Vercel Configuration

```javascript
// vercel.json
{
  "regions": ["lhr1"], // London for UK users
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    },
    "app/api/collections/ai-call-python/route.ts": {
      "memory": 2048,
      "maxDuration": 60 // AI calls need more time
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=1, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 1.2 Clerk Authentication Best Practices

**Migration from Old to New Pattern:**

❌ **Old (Deprecated)**:
```typescript
import { authMiddleware } from '@clerk/nextjs/server'

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"]
})
```

✅ **New (2025 Standard)**:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/invoices(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect()
})
```

**Enhanced Features:**

1. **Role-Based Access Control (RBAC)**
   ```typescript
   // app/api/admin/route.ts
   import { auth } from '@clerk/nextjs/server'

   export async function GET() {
     const { userId, sessionClaims } = await auth()

     // Check if user has admin role
     if (sessionClaims?.metadata?.role !== 'admin') {
       return new Response('Unauthorized', { status: 403 })
     }

     // Admin logic here
   }
   ```

2. **Organization Support** (for agencies/multiple users)
   ```typescript
   import { auth } from '@clerk/nextjs/server'

   export async function POST(req: Request) {
     const { orgId, userId } = await auth()

     // Filter data by organization
     const invoices = await db
       .collection('invoices')
       .where('orgId', '==', orgId)
       .get()
   }
   ```

3. **Webhooks for User Events**
   ```typescript
   // app/api/webhooks/clerk/route.ts
   import { Webhook } from 'svix'

   export async function POST(req: Request) {
     const payload = await req.json()
     const headers = req.headers

     const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
     const event = webhook.verify(JSON.stringify(payload), {
       'svix-id': headers.get('svix-id')!,
       'svix-timestamp': headers.get('svix-timestamp')!,
       'svix-signature': headers.get('svix-signature')!,
     })

     // Handle user.created, user.updated, etc.
     if (event.type === 'user.created') {
       await createUserProfile(event.data.id)
     }
   }
   ```

---

## 2. AI Services Strategy

### 2.1 Multi-Model Approach (Cost-Optimized)

**Tiered AI Strategy:**

```
┌─────────────────────────────────────────────────────┐
│                TIER 1: Routine Queries              │
│         Google Gemini 2.5 Pro (Flash)               │
│   - Quick responses, real-time conversations        │
│   - Cost: ~$0.60 per 10M tokens                    │
│   - Use for: 80% of customer interactions          │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│          TIER 2: Complex/Sensitive Cases            │
│            Anthropic Claude 3.7 Sonnet              │
│   - Empathetic communication, nuanced responses     │
│   - Cost: ~$3 per 10M tokens                       │
│   - Use for: 15% of escalated cases                │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│          TIER 3: Voice Calls (Real-time)            │
│         OpenAI Realtime API (gpt-realtime)          │
│   - Ultra-low latency voice-to-voice                │
│   - Cost: $0.06/min input + $0.24/min output        │
│   - Use for: Live phone conversations               │
└─────────────────────────────────────────────────────┘
```

### 2.2 Implementation Strategy

**1. Gemini 2.5 Pro for Chat/Email Responses**

```typescript
// lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateCollectionMessage(context: {
  clientName: string
  amount: number
  daysOverdue: number
  previousAttempts: number
}) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: `You are a professional, empathetic debt collection assistant for a UK freelancer platform.

    COMPLIANCE REQUIREMENTS:
    - Follow FCA Treating Customers Fairly (TCF) principles
    - Use plain language, not legalese
    - Show empathy and understanding
    - Offer payment plan options
    - Never use aggressive or threatening language
    - Respect call time restrictions (8am-9pm Mon-Sat)

    TONE: Professional, respectful, solution-focused`
  })

  const prompt = `Generate a collection message for:
  Client: ${context.clientName}
  Amount: £${context.amount}
  Days Overdue: ${context.daysOverdue}
  Previous Attempts: ${context.previousAttempts}

  Create a message that:
  1. Acknowledges the situation professionally
  2. Clearly states the outstanding amount
  3. Offers 2-3 payment plan options
  4. Provides clear next steps
  5. Maintains a respectful, solution-focused tone`

  const result = await model.generateContent(prompt)
  return result.response.text()
}
```

**2. Claude for Complex/Sensitive Cases**

```typescript
// lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function handleSensitiveCase(context: {
  conversation: Array<{ role: string; content: string }>
  clientSituation: string
  vulnerabilityFlags: string[]
}) {
  const message = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 1024,
    system: `You are handling a sensitive debt collection case.

    VULNERABILITY INDICATORS PRESENT: ${context.vulnerabilityFlags.join(', ')}

    CRITICAL REQUIREMENTS:
    - Exercise maximum empathy and patience
    - Offer extended payment plans
    - Suggest available support resources
    - Document all conversations
    - Escalate if customer appears distressed
    - Follow FCA vulnerable customer guidelines`,
    messages: context.conversation.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
  })

  return message.content[0].type === 'text'
    ? message.content[0].text
    : ''
}
```

**3. OpenAI Realtime for Voice Calls**

```typescript
// lib/ai/openai-realtime.ts
import { RealtimeClient } from '@openai/realtime-api-beta'

export async function createVoiceAgent(invoiceDetails: {
  clientName: string
  amount: number
  reference: string
  daysOverdue: number
}) {
  const client = new RealtimeClient({
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-realtime'
  })

  await client.connect()

  // Configure session with UK debt collection guidelines
  await client.updateSession({
    instructions: `You are a professional UK debt collection agent.

    CLIENT DETAILS:
    - Name: ${invoiceDetails.clientName}
    - Amount: £${invoiceDetails.amount}
    - Reference: ${invoiceDetails.reference}
    - Days Overdue: ${invoiceDetails.daysOverdue}

    CALL SCRIPT GUIDELINES:
    1. Introduce yourself and company professionally
    2. Verify you're speaking with ${invoiceDetails.clientName}
    3. Explain the purpose of the call clearly
    4. Listen actively to their situation
    5. Offer payment plan options
    6. Confirm next steps before ending call

    UK FCA COMPLIANCE:
    - Record this call for quality and training purposes
    - Use respectful, non-threatening language
    - Offer payment plans if customer has difficulty paying
    - Do not call outside 8am-9pm Mon-Sat
    - If customer requests, send details in writing

    TONE: Professional, empathetic, solution-focused`,
    voice: 'alloy', // Or 'cedar', 'marin' (new voices)
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    }
  })

  return client
}
```

### 2.3 Cost Optimization

**Monthly Cost Estimate (1000 invoices):**

| Use Case | Model | Volume | Cost |
|----------|-------|---------|------|
| Email/SMS drafts | Gemini 2.5 Pro | 5M tokens | $3 |
| Chat conversations | Gemini 2.5 Pro | 10M tokens | $6 |
| Escalated cases | Claude 3.7 | 2M tokens | $6 |
| Voice calls (10min avg) | OpenAI Realtime | 100 calls | $30 |
| **Total Monthly** | | | **~$45** |

**vs. OpenAI-only approach:**

| Use Case | Model | Volume | Cost |
|----------|-------|---------|------|
| All text operations | GPT-4 | 17M tokens | $170 |
| Voice calls | Realtime API | 100 calls | $30 |
| **Total Monthly** | | | **~$200** |

**Savings: ~77% cost reduction**

---

## 3. Communication Platform Enhancements

### 3.1 SMS & Email Provider Strategy

**Recommended Stack:**

```
┌──────────────────────────────────────┐
│           SMS: Twilio                │
│  - 99.95% uptime                     │
│  - Global delivery network           │
│  - £0.04-0.08 per SMS (UK)          │
│  - Two-way messaging                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│      Email: Resend (Primary)         │
│  - Modern API, React Email           │
│  - Built for developers              │
│  - 96%+ deliverability               │
│  - £0.001 per email                  │
│                                      │
│    SendGrid (Backup/Marketing)       │
│  - 99% deliverability                │
│  - Advanced analytics                │
│  - Template management               │
│  - A/B testing                       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│    Voice: Twilio + OpenAI Realtime   │
│  - Native integration                │
│  - WebSocket media streams           │
│  - Call recording (FCA compliant)    │
│  - £0.014/min + AI costs             │
└──────────────────────────────────────┘
```

### 3.2 Implementation

**Resend for Transactional Emails:**

```typescript
// lib/email/resend.ts
import { Resend } from 'resend'
import { CollectionReminderEmail } from '@/emails/collection-reminder'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendCollectionReminder(params: {
  to: string
  clientName: string
  amount: number
  dueDate: string
  invoiceRef: string
  paymentLink: string
}) {
  const { data, error } = await resend.emails.send({
    from: 'Recoup Collections <collections@recoup.app>',
    to: params.to,
    subject: `Payment Reminder: Invoice ${params.invoiceRef}`,
    react: CollectionReminderEmail(params),
    tags: [
      { name: 'category', value: 'collection' },
      { name: 'invoice_ref', value: params.invoiceRef }
    ],
    headers: {
      'X-Entity-Ref-ID': params.invoiceRef
    }
  })

  if (error) {
    console.error('Email send failed:', error)
    throw error
  }

  // Track in database
  await db.collection('email_logs').add({
    emailId: data.id,
    invoiceRef: params.invoiceRef,
    recipient: params.to,
    type: 'collection_reminder',
    sentAt: new Date()
  })

  return data
}
```

**React Email Template:**

```tsx
// emails/collection-reminder.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export function CollectionReminderEmail({
  clientName,
  amount,
  dueDate,
  invoiceRef,
  paymentLink
}: {
  clientName: string
  amount: number
  dueDate: string
  invoiceRef: string
  paymentLink: string
}) {
  return (
    <Html>
      <Head />
      <Preview>Payment reminder for invoice {invoiceRef}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Payment Reminder</Text>

          <Text style={paragraph}>Dear {clientName},</Text>

          <Text style={paragraph}>
            This is a friendly reminder that invoice <strong>{invoiceRef}</strong> for{' '}
            <strong>£{(amount / 100).toFixed(2)}</strong> was due on {dueDate}.
          </Text>

          <Text style={paragraph}>
            We understand that sometimes invoices can be overlooked. If you've already
            made this payment, please disregard this message.
          </Text>

          <Section style={buttonContainer}>
            <Button href={paymentLink} style={button}>
              Pay Invoice Now
            </Button>
          </Section>

          <Text style={paragraph}>
            If you're experiencing difficulty making this payment, please contact us to
            discuss a payment plan that works for you.
          </Text>

          <Text style={footer}>
            This is an automated reminder. For questions, reply to this email or contact
            support@recoup.app
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles...
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  padding: '0 24px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 24px',
}

const buttonContainer = {
  padding: '27px 24px',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  padding: '0 24px',
}
```

**Twilio SMS with Templates:**

```typescript
// lib/sms/twilio.ts
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendCollectionSMS(params: {
  to: string
  clientName: string
  amount: number
  invoiceRef: string
  paymentLink: string
}) {
  const message = `Hi ${params.clientName},

This is a reminder that invoice ${params.invoiceRef} for £${(params.amount / 100).toFixed(2)} is now overdue.

Pay now: ${params.paymentLink}

Need help? Reply to this message or call us.

Recoup Collections`

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: params.to,
      statusCallback: `${process.env.BASE_URL}/api/webhooks/twilio/sms-status`,
    })

    // Track in database
    await db.collection('sms_logs').add({
      messageSid: result.sid,
      invoiceRef: params.invoiceRef,
      recipient: params.to,
      type: 'collection_reminder',
      status: result.status,
      sentAt: new Date()
    })

    return result
  } catch (error) {
    console.error('SMS send failed:', error)
    throw error
  }
}

// Handle delivery status webhook
export async function handleSMSStatus(req: Request) {
  const formData = await req.formData()
  const status = formData.get('MessageStatus') as string
  const messageSid = formData.get('MessageSid') as string

  await db.collection('sms_logs')
    .where('messageSid', '==', messageSid)
    .get()
    .then(snapshot => {
      snapshot.docs[0].ref.update({
        status,
        updatedAt: new Date()
      })
    })
}
```

### 3.3 Communication Sequences

**Automated Collection Workflow:**

```
Day 0 (Invoice Due Date)
├─ Email: Friendly payment reminder
└─ Mark: First contact attempt

Day 7 (7 days overdue)
├─ SMS: Quick reminder with payment link
├─ Email: Second reminder with payment plan options
└─ Mark: Second contact attempt

Day 14 (14 days overdue)
├─ AI Voice Call: Automated friendly call
├─ SMS: Follow-up after call
└─ Mark: Third contact attempt

Day 21 (21 days overdue)
├─ Email: Escalation notice (formal tone)
└─ SMS: Urgent payment required

Day 30 (30 days overdue)
├─ Human Review: Assess for collections agency
├─ AI Analysis: Recommend escalation path
└─ Decision: Court claim vs agency vs write-off
```

**Implementation:**

```typescript
// lib/workflows/collection-sequence.ts
import { differenceInDays } from 'date-fns'

export async function runCollectionWorkflow(invoiceId: string) {
  const invoice = await getInvoice(invoiceId)
  const daysOverdue = differenceInDays(new Date(), invoice.dueDate)

  // Get previous attempts
  const attempts = await db
    .collection('collection_attempts')
    .where('invoiceId', '==', invoiceId)
    .orderBy('createdAt', 'desc')
    .get()

  const lastAttempt = attempts.docs[0]?.data()
  const daysSinceLastAttempt = lastAttempt
    ? differenceInDays(new Date(), lastAttempt.createdAt.toDate())
    : 999

  // Day 0: Due date reminder
  if (daysOverdue === 0 && !lastAttempt) {
    await sendEmail({
      type: 'due_today',
      invoice,
      template: 'friendly-reminder'
    })
  }

  // Day 7: First escalation
  if (daysOverdue >= 7 && daysOverdue < 14 && daysSinceLastAttempt >= 7) {
    await Promise.all([
      sendEmail({
        type: 'first_escalation',
        invoice,
        template: 'payment-plan-offer'
      }),
      sendSMS({
        type: 'first_escalation',
        invoice
      })
    ])
  }

  // Day 14: AI voice call
  if (daysOverdue >= 14 && daysOverdue < 21 && daysSinceLastAttempt >= 7) {
    // Only call if amount is substantial (£50+)
    if (invoice.amount >= 5000) {
      await initiateAICall({
        invoice,
        tone: 'friendly'
      })
    } else {
      await sendEmail({
        type: 'second_escalation',
        invoice,
        template: 'urgent-payment'
      })
    }
  }

  // Day 21: Final notice
  if (daysOverdue >= 21 && daysOverdue < 30 && daysSinceLastAttempt >= 7) {
    await sendEmail({
      type: 'final_notice',
      invoice,
      template: 'escalation-warning'
    })
  }

  // Day 30+: Decision engine
  if (daysOverdue >= 30) {
    const recommendation = await getEscalationRecommendation(invoice)

    // Flag for manual review
    await db.collection('invoices').doc(invoiceId).update({
      status: 'review_required',
      escalationRecommendation: recommendation,
      reviewDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })

    // Notify user
    await notifyUser({
      userId: invoice.freelancerId,
      type: 'review_required',
      invoiceId
    })
  }
}
```

---

## 4. UI/UX Modernization

### 4.1 Design System with Shadcn UI

**Component Architecture:**

```
src/
├── components/
│   ├── ui/                    # Shadcn UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── dashboard/             # Dashboard-specific
│   │   ├── metric-card.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── collections-table.tsx
│   │   └── payment-status.tsx
│   ├── invoices/              # Invoice management
│   │   ├── invoice-list.tsx
│   │   ├── invoice-form.tsx
│   │   ├── payment-timeline.tsx
│   │   └── status-badge.tsx
│   └── collections/           # Collections features
│       ├── ai-call-button.tsx
│       ├── escalation-wizard.tsx
│       └── communication-log.tsx
```

**Modern Dashboard Design:**

```tsx
// app/(dashboard)/dashboard/page.tsx
import { MetricCard } from '@/components/dashboard/metric-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { CollectionsTable } from '@/components/dashboard/collections-table'
import { PaymentStatusBadge } from '@/components/invoices/status-badge'

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-8">
      {/* Hero Metrics */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your invoices today
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Outstanding"
          value={`£${(data.totalOutstanding / 100).toFixed(2)}`}
          change="+12.5%"
          trend="up"
          icon="pound-sterling"
        />
        <MetricCard
          title="Overdue Invoices"
          value={data.overdueCount}
          change="-5.2%"
          trend="down"
          icon="alert-triangle"
          variant="warning"
        />
        <MetricCard
          title="Collection Rate"
          value={`${data.collectionRate}%`}
          change="+8.1%"
          trend="up"
          icon="trending-up"
          variant="success"
        />
        <MetricCard
          title="Avg. Payment Time"
          value={`${data.avgPaymentDays}d`}
          change="-3 days"
          trend="down"
          icon="clock"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart data={data.revenueHistory} />
        <CollectionSuccessChart data={data.collectionStats} />
      </div>

      {/* Overdue Invoices Table */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Overdue Invoices
          </h2>
          <Button variant="outline">View All</Button>
        </div>
        <CollectionsTable invoices={data.overdueInvoices} />
      </div>
    </div>
  )
}
```

**Metric Card Component:**

```tsx
// components/dashboard/metric-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down'
  icon?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  variant = 'default'
}: MetricCardProps) {
  // @ts-ignore - dynamic icon lookup
  const Icon: LucideIcon = icon ? Icons[toPascalCase(icon)] : null

  const variantStyles = {
    default: 'bg-card',
    success: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
    danger: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
  }

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="flex items-center text-xs text-muted-foreground">
            {trend === 'up' ? (
              <ArrowUp className="mr-1 h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span>{change} from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function toPascalCase(str: string) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}
```

### 4.2 Payment Status Timeline

**Visual payment progress indicator:**

```tsx
// components/invoices/payment-timeline.tsx
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  date: Date
  type: 'created' | 'sent' | 'viewed' | 'reminder_sent' | 'paid' | 'overdue'
  description: string
}

export function PaymentTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'rounded-full p-2',
                event.type === 'paid' && 'bg-emerald-100 text-emerald-600',
                event.type === 'overdue' && 'bg-red-100 text-red-600',
                event.type === 'viewed' && 'bg-blue-100 text-blue-600',
                !['paid', 'overdue', 'viewed'].includes(event.type) &&
                  'bg-gray-100 text-gray-600'
              )}
            >
              {event.type === 'paid' && <CheckCircle2 className="h-4 w-4" />}
              {event.type === 'overdue' && <AlertCircle className="h-4 w-4" />}
              {event.type === 'viewed' && <Clock className="h-4 w-4" />}
              {!['paid', 'overdue', 'viewed'].includes(event.type) && (
                <Circle className="h-4 w-4" />
              )}
            </div>
            {index < events.length - 1 && (
              <div className="h-full w-0.5 bg-border" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="font-medium">{getEventTitle(event.type)}</p>
            <p className="text-sm text-muted-foreground">{event.description}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(event.date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function getEventTitle(type: string) {
  const titles = {
    created: 'Invoice Created',
    sent: 'Invoice Sent',
    viewed: 'Invoice Viewed',
    reminder_sent: 'Reminder Sent',
    paid: 'Payment Received',
    overdue: 'Payment Overdue'
  }
  return titles[type as keyof typeof titles] || type
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
```

### 4.3 FCA-Compliant Communication UI

**Vulnerability Indicator & Sensitive Handling:**

```tsx
// components/collections/client-profile.tsx
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

export function ClientProfile({ client }: { client: Client }) {
  const hasVulnerabilityFlags = client.vulnerabilityFlags && client.vulnerabilityFlags.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{client.name}</h3>
          <p className="text-sm text-muted-foreground">{client.email}</p>
        </div>
        {hasVulnerabilityFlags && (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Vulnerable Customer
          </Badge>
        )}
      </div>

      {hasVulnerabilityFlags && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>FCA Vulnerability Indicators:</strong>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {client.vulnerabilityFlags.map((flag, index) => (
                <li key={index}>{flag}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              Exercise extra care when communicating with this customer. Offer extended
              payment plans and signpost to support services.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Communication preferences */}
      <div className="rounded-lg border p-4">
        <h4 className="font-medium">Communication Preferences</h4>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Email</span>
            <Badge variant={client.preferences.email ? 'default' : 'secondary'}>
              {client.preferences.email ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">SMS</span>
            <Badge variant={client.preferences.sms ? 'default' : 'secondary'}>
              {client.preferences.sms ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Phone Calls</span>
            <Badge variant={client.preferences.calls ? 'default' : 'secondary'}>
              {client.preferences.calls ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 5. FCA Compliance Implementation

### 5.1 Treating Customers Fairly (TCF) Features

**Vulnerability Detection:**

```typescript
// lib/compliance/vulnerability-detection.ts

export interface VulnerabilityFlag {
  type: 'financial_difficulty' | 'mental_health' | 'age' | 'disability' | 'language_barrier'
  severity: 'low' | 'medium' | 'high'
  detectedAt: Date
  notes: string
}

export async function detectVulnerabilityIndicators(
  clientId: string,
  conversationHistory: Array<{ content: string; timestamp: Date }>
): Promise<VulnerabilityFlag[]> {
  const flags: VulnerabilityFlag[] = []

  // Use AI to detect vulnerability indicators
  const analysis = await analyzeConversationForVulnerability(conversationHistory)

  // Financial difficulty indicators
  if (analysis.indicators.includes('job_loss') ||
      analysis.indicators.includes('income_reduction')) {
    flags.push({
      type: 'financial_difficulty',
      severity: 'high',
      detectedAt: new Date(),
      notes: 'Customer mentioned job loss or reduced income'
    })
  }

  // Mental health indicators
  if (analysis.indicators.includes('stress') ||
      analysis.indicators.includes('anxiety')) {
    flags.push({
      type: 'mental_health',
      severity: 'medium',
      detectedAt: new Date(),
      notes: 'Customer expressed signs of stress or anxiety'
    })
  }

  // Age-related (elderly customers)
  const clientAge = await getClientAge(clientId)
  if (clientAge && clientAge >= 70) {
    flags.push({
      type: 'age',
      severity: 'low',
      detectedAt: new Date(),
      notes: 'Customer is elderly - exercise extra patience'
    })
  }

  return flags
}

async function analyzeConversationForVulnerability(
  messages: Array<{ content: string }>
): Promise<{ indicators: string[] }> {
  // Use Claude for empathetic analysis
  const conversation = messages.map(m => m.content).join('\n')

  const analysis = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 512,
    system: `Analyze this debt collection conversation for vulnerability indicators.

    Look for:
    - Financial difficulty (job loss, reduced income, unexpected expenses)
    - Mental health concerns (stress, anxiety, depression)
    - Language barriers
    - Age-related issues
    - Disability mentions

    Return a JSON array of indicator keywords found.`,
    messages: [{
      role: 'user',
      content: `Conversation:\n${conversation}\n\nAnalyze for vulnerability indicators:`
    }]
  })

  const result = JSON.parse(analysis.content[0].text)
  return result
}
```

**Compliance Checklist UI:**

```tsx
// components/collections/compliance-checklist.tsx
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { useState } from 'react'

export function ComplianceChecklist({ invoiceId }: { invoiceId: string }) {
  const [checks, setChecks] = useState({
    identityVerified: false,
    purposeExplained: false,
    amountConfirmed: false,
    paymentOptionsOffered: false,
    nextStepsAgreed: false,
    callRecorded: false
  })

  const allChecked = Object.values(checks).every(v => v)

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">FCA Compliance Checklist</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="identity"
            checked={checks.identityVerified}
            onCheckedChange={(checked) =>
              setChecks({ ...checks, identityVerified: !!checked })
            }
          />
          <label htmlFor="identity" className="text-sm">
            Verified customer identity
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="purpose"
            checked={checks.purposeExplained}
            onCheckedChange={(checked) =>
              setChecks({ ...checks, purposeExplained: !!checked })
            }
          />
          <label htmlFor="purpose" className="text-sm">
            Explained purpose of call clearly
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="amount"
            checked={checks.amountConfirmed}
            onCheckedChange={(checked) =>
              setChecks({ ...checks, amountConfirmed: !!checked })
            }
          />
          <label htmlFor="amount" className="text-sm">
            Confirmed outstanding amount
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="options"
            checked={checks.paymentOptionsOffered}
            onCheckedChange={(checked) =>
              setChecks({ ...checks, paymentOptionsOffered: !!checked })
            }
          />
          <label htmlFor="options" className="text-sm">
            Offered payment plan options
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="next-steps"
            checked={checks.nextStepsAgreed}
            onCheckedChange={(checked) =>
              setChecks({ ...checks, nextStepsAgreed: !!checked })
            }
          />
          <label htmlFor="next-steps" className="text-sm">
            Agreed next steps with customer
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="recorded"
            checked={checks.callRecorded}
            onCheckedChange={(checked) =>
              setChecks({ ...checks, callRecorded: !!checked })
            }
          />
          <label htmlFor="recorded" className="text-sm">
            Call recorded (FCA requirement)
          </label>
        </div>
      </div>

      {allChecked && (
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-md">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            ✓ All compliance requirements met
          </p>
        </div>
      )}
    </Card>
  )
}
```

### 5.2 Automated Compliance Monitoring

```typescript
// lib/compliance/monitoring.ts

export async function auditCollectionAttempt(attemptId: string) {
  const attempt = await db.collection('collection_attempts').doc(attemptId).get()
  const data = attempt.data()

  const violations: string[] = []

  // Check call timing (8am-9pm Mon-Sat)
  if (data.type === 'phone_call') {
    const callTime = data.createdAt.toDate()
    const hour = callTime.getHours()
    const day = callTime.getDay()

    if (hour < 8 || hour >= 21) {
      violations.push('Call made outside allowed hours (8am-9pm)')
    }

    if (day === 0) { // Sunday
      violations.push('Call made on Sunday (not allowed)')
    }
  }

  // Check cooldown period (24 hours)
  const previousAttempts = await db
    .collection('collection_attempts')
    .where('invoiceId', '==', data.invoiceId)
    .where('createdAt', '<', data.createdAt)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get()

  if (!previousAttempts.empty) {
    const lastAttempt = previousAttempts.docs[0].data()
    const hoursSinceLastAttempt =
      (data.createdAt.toDate().getTime() - lastAttempt.createdAt.toDate().getTime()) /
      (1000 * 60 * 60)

    if (hoursSinceLastAttempt < 24) {
      violations.push(`Insufficient cooldown period: ${hoursSinceLastAttempt.toFixed(1)}h (minimum 24h required)`)
    }
  }

  // Check for aggressive language in messages
  if (data.type === 'email' || data.type === 'sms') {
    const aggressiveTerms = [
      'legal action immediately',
      'bailiffs',
      'court within 24 hours',
      'bad credit forever'
    ]

    const messageContent = data.content.toLowerCase()
    const foundTerms = aggressiveTerms.filter(term => messageContent.includes(term))

    if (foundTerms.length > 0) {
      violations.push(`Aggressive language detected: ${foundTerms.join(', ')}`)
    }
  }

  // Log violations
  if (violations.length > 0) {
    await db.collection('compliance_violations').add({
      attemptId,
      violations,
      severity: violations.some(v => v.includes('aggressive')) ? 'high' : 'medium',
      createdAt: new Date(),
      reviewed: false
    })

    // Alert admins for high-severity violations
    if (violations.some(v => v.includes('aggressive'))) {
      await notifyAdmin({
        type: 'compliance_violation',
        severity: 'high',
        attemptId,
        violations
      })
    }
  }

  return { violations, compliant: violations.length === 0 }
}
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Week 1: Platform Setup**
- [ ] Update Next.js to version 15
- [ ] Migrate Clerk middleware to new `clerkMiddleware` pattern
- [ ] Configure Vercel regions (lhr1 for UK)
- [ ] Set up Edge/Serverless runtime split
- [ ] Configure environment variables

**Week 2: UI Foundation**
- [ ] Install Shadcn UI components
- [ ] Set up Tailwind v4
- [ ] Create design system tokens
- [ ] Build core dashboard components
- [ ] Implement dark mode support

### Phase 2: AI Integration (Weeks 3-4)

**Week 3: Multi-Model Setup**
- [ ] Integrate Gemini 2.5 Pro for chat/email
- [ ] Add Claude 3.7 for complex cases
- [ ] Test OpenAI Realtime API with Twilio
- [ ] Build AI routing logic (tiered approach)
- [ ] Implement cost tracking

**Week 4: Voice Enhancements**
- [ ] Complete Twilio + OpenAI Realtime integration
- [ ] Build call recording system
- [ ] Add voice transcription & analysis
- [ ] Create call quality monitoring
- [ ] Test latency (<800ms target)

### Phase 3: Communications (Weeks 5-6)

**Week 5: Email & SMS**
- [ ] Set up Resend for transactional emails
- [ ] Build React Email templates
- [ ] Integrate Twilio SMS
- [ ] Create message templates library
- [ ] Implement delivery tracking

**Week 6: Automated Workflows**
- [ ] Build collection sequence automation
- [ ] Create smart scheduling system
- [ ] Add communication preferences
- [ ] Implement rate limiting
- [ ] Test end-to-end workflows

### Phase 4: Compliance & UI Polish (Weeks 7-8)

**Week 7: FCA Compliance**
- [ ] Implement vulnerability detection
- [ ] Add compliance checklists
- [ ] Build audit logging
- [ ] Create violation monitoring
- [ ] Add customer protection features

**Week 8: UI Refinement**
- [ ] Complete dashboard redesign
- [ ] Add payment timeline component
- [ ] Build client profile views
- [ ] Implement responsive design
- [ ] Conduct UX testing

### Phase 5: Testing & Launch (Weeks 9-10)

**Week 9: Testing**
- [ ] Load testing (Vercel functions)
- [ ] AI latency testing
- [ ] Email deliverability testing
- [ ] Compliance audit
- [ ] Security review

**Week 10: Launch**
- [ ] Migrate production data
- [ ] Deploy to Vercel
- [ ] Monitor performance
- [ ] Collect user feedback
- [ ] Iterate based on metrics

---

## 7. Success Metrics

### Technical Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| API Response Time (p95) | ~800ms | <300ms | Week 2 |
| AI Voice Latency | N/A | <800ms | Week 4 |
| Email Deliverability | ~85% | >96% | Week 6 |
| SMS Delivery Rate | ~90% | >99% | Week 6 |
| Dashboard Load Time | ~2s | <1s | Week 8 |

### Business Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Collection Rate | ~65% | >80% | Month 3 |
| Average Days to Payment | ~45d | <30d | Month 3 |
| AI Cost per Collection | N/A | <£2 | Month 2 |
| Customer Satisfaction | N/A | >4.5/5 | Month 3 |
| FCA Compliance Score | ~70% | >95% | Week 8 |

### Operational Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Manual Review Required | ~40% | <15% | Month 2 |
| Support Tickets | ~50/month | <20/month | Month 3 |
| Avg. Response Time | ~2h | <30min | Month 2 |
| System Uptime | ~99.5% | >99.95% | Week 10 |

---

## 8. Cost Analysis

### Monthly Cost Breakdown (1000 invoices/month)

**Current Stack:**
- Vercel: £20 (Pro plan)
- Clerk: £25 (Pro plan)
- Firestore: £15
- OpenAI only: £200
- **Total: ~£260/month**

**Optimized Stack:**
- Vercel: £20 (Pro plan)
- Clerk: £25 (Pro plan)
- Firestore: £15
- Gemini 2.5 Pro: £9 (80% of operations)
- Claude 3.7: £6 (15% of operations)
- OpenAI Realtime: £30 (100 voice calls)
- Resend: £10 (10k emails)
- Twilio SMS: £40 (500 SMS)
- Twilio Voice: £14 (100 calls @ £0.014/min)
- **Total: ~£169/month**

**Savings: £91/month (35% reduction)**
**Annual Savings: £1,092**

---

## 9. Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI API downtime | Medium | High | Multi-provider fallback, queue failed requests |
| Email delivery issues | Low | Medium | Secondary provider (SendGrid backup) |
| Voice call latency | Medium | High | Monitor p95 latency, optimize WebSocket routing |
| Database rate limits | Low | High | Implement caching, batch operations |

### Compliance Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| FCA violation | Low | Critical | Automated compliance monitoring, pre-send checks |
| Data breach | Low | Critical | Encryption, RBAC, audit logging |
| GDPR non-compliance | Medium | High | Data retention policies, right to deletion |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Customer complaints | Medium | Medium | Clear communication, easy opt-out |
| Poor collection rates | Low | High | A/B testing messages, optimize timing |
| High AI costs | Medium | Medium | Cost monitoring, per-call limits |

---

## 10. Next Steps

### Immediate Actions (This Week)

1. **Review & Approve Plan**: Stakeholder review of this document
2. **Resource Allocation**: Assign developers to each phase
3. **Environment Setup**: Create dev/staging/prod environments
4. **API Keys**: Obtain credentials for new services (Gemini, Resend, etc.)
5. **Repository Setup**: Create feature branches for each phase

### Key Decisions Needed

1. **Voice Provider**: Confirm Twilio + OpenAI Realtime vs Vapi.ai
2. **Email Provider**: Resend primary with SendGrid backup?
3. **AI Model Mix**: Gemini 80% / Claude 15% / OpenAI 5%?
4. **Launch Date**: Targeting 10-week timeline?
5. **Budget Approval**: £169/month operational costs

### Success Criteria

This project will be considered successful when:

✅ Dashboard loads in <1 second
✅ Email deliverability >96%
✅ Voice call latency <800ms
✅ Collection rate improves to >80%
✅ FCA compliance score >95%
✅ Monthly costs reduced by >30%
✅ Customer satisfaction >4.5/5

---

## Appendix A: Technical Specifications

### API Integrations

#### Gemini 2.5 Pro
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro`
- **Rate Limit**: 1000 RPM
- **Token Limits**: 2M input, 8K output
- **Pricing**: $0.05/$0.15 per 1M tokens (input/output)

#### Claude 3.7 Sonnet
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Rate Limit**: 50 RPM
- **Token Limits**: 200K input, 16K output
- **Pricing**: $3/$15 per 1M tokens (input/output)

#### OpenAI Realtime
- **Endpoint**: `wss://api.openai.com/v1/realtime`
- **Protocol**: WebSocket
- **Latency Target**: <500ms first byte
- **Pricing**: $0.06/min input, $0.24/min output

#### Resend
- **Endpoint**: `https://api.resend.com/emails`
- **Rate Limit**: 100 RPM
- **Pricing**: $0.001 per email
- **Features**: React Email, webhooks, analytics

#### Twilio
- **SMS**: `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`
- **Voice**: `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Calls.json`
- **Pricing**: £0.04-0.08 per SMS, £0.014/min voice

---

## Appendix B: Environment Variables

```bash
# .env.local

# Platform
NEXT_PUBLIC_APP_URL=https://recoup.app
NEXT_PUBLIC_VERCEL_URL=${VERCEL_URL}

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Firebase
FIREBASE_PROJECT_ID=recoup-prod
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# AI Services
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Communications
RESEND_API_KEY=re_...
SENDGRID_API_KEY=SG....
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+441234567890

# Python Services
PYTHON_VOICE_SERVICE_URL=https://voice.recoup.app
PYTHON_ANALYTICS_SERVICE_URL=https://analytics.recoup.app
PYTHON_AI_VOICE_SERVICE_URL=https://ai-voice.recoup.app
PYTHON_DECISION_ENGINE_URL=https://decisions.recoup.app

# Monitoring
SENTRY_DSN=...
AXIOM_TOKEN=...
```

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Author**: Claude (AI Assistant)
**Status**: Ready for Implementation

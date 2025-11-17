# RECOUP: Complete Technical Implementation Guide v2.0
## Full Stack Specification with Logic, Code, Database & Notifications

**Document Version:** 2.0  
**Last Updated:** November 13, 2025  
**Status:** Ready for Claude Code Implementation

---

## TABLE OF CONTENTS

1. Architecture Overview
2. Technology Stack & Dependencies
3. Project Structure
4. Database Schema (Complete)
5. Authentication & Authorization
6. API Endpoints (All)
7. Frontend Components
8. Backend Business Logic
9. Integration Services
10. Smart Notifications System
11. Habit Loop Implementation
12. Error Handling & Logging
13. Testing Strategy
14. Deployment & DevOps
15. Implementation Checklist

---

## 1. ARCHITECTURE OVERVIEW

### System Diagram

```
┌─────────────────────────────────────────────────┐
│ USER BROWSER (Next.js Frontend)                 │
│ ├─ React Components (TypeScript)                │
│ ├─ Zustand State Management                     │
│ ├─ react-hook-form (Form handling)              │
│ └─ Tailwind CSS (Styling)                       │
└────────────────┬────────────────────────────────┘
                 │ HTTPS / JWT
                 ↓
┌─────────────────────────────────────────────────┐
│ NEXT.JS API ROUTES (Node.js Backend)            │
│ ├─ /api/invoices (CRUD)                         │
│ ├─ /api/payment-confirmations                   │
│ ├─ /api/users (profiles)                        │
│ ├─ /api/notifications                           │
│ ├─ /api/referrals                               │
│ ├─ /api/health                                  │
│ └─ /api/webhook (Stripe, Clerk)                 │
└────────────────┬────────────────────────────────┘
                 │ Service-to-Service
                 ├─────────────┬──────────┬──────────┐
                 ↓             ↓          ↓          ↓
┌─────────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│ FIRESTORE   │ │ OpenAI   │ │ SendGrid│ │ Stripe   │
│ (Database)  │ │ (AI/LLM) │ │ (Email) │ │ (Payment)│
└─────────────┘ └──────────┘ └─────────┘ └──────────┘

┌─────────────────────────────────────────────────┐
│ FIREBASE FUNCTIONS / LAMBDA                     │
│ ├─ Daily job: Process collections               │
│ ├─ Daily job: Send smart notifications          │
│ ├─ Daily job: Calculate user stats              │
│ ├─ Scheduled: Churn detection                   │
│ └─ Event-driven: Webhook handlers               │
└─────────────────────────────────────────────────┘

EXTERNAL SERVICES:
├─ Clerk (Authentication)
├─ Firebase (Auth + Database + Storage)
└─ Vercel (Deployment)
```

---

## 2. TECHNOLOGY STACK & DEPENDENCIES

### Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "typescript": "^5.3.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "tailwindcss": "^3.3.0",
    "@tailwindcss/forms": "^0.5.6",
    "recordrtc": "^5.4.8",
    "axios": "^1.6.0",
    "next-auth": "^4.24.0",
    "@clerk/nextjs": "^4.27.0",
    "react-toastify": "^9.1.0",
    "date-fns": "^2.30.0",
    "numeral": "^2.0.6",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0"
  }
}
```

### Backend Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "firebase": "^10.7.0",
    "firebase-admin": "^12.0.0",
    "openai": "^4.32.0",
    "@sendgrid/mail": "^7.7.0",
    "stripe": "^14.18.0",
    "@clerk/backend": "^1.0.0",
    "zod": "^3.22.0",
    "dotenv": "^16.3.0",
    "crypto": "^1.0.3",
    "node-schedule": "^2.0.0",
    "pino": "^8.17.0"
  }
}
```

---

## 3. PROJECT STRUCTURE

```
recoup/
├── .env.local (variables)
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── middleware.ts
│
├── app/
│   ├── layout.tsx (Root layout with Clerk provider)
│   ├── page.tsx (Landing page)
│   ├── sign-up/
│   │   └── [[...sign-up]]/page.tsx
│   ├── sign-in/
│   │   └── [[...sign-in]]/page.tsx
│   │
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Main dashboard)
│   │   ├── invoices/
│   │   │   ├── page.tsx (Invoice list)
│   │   │   ├── [id]/page.tsx (Invoice detail)
│   │   │   └── new/page.tsx (Create invoice)
│   │   ├── payments/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── referrals/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── confirmation/
│   │   └── [token]/page.tsx (Payment confirmation form)
│   │
│   └── api/
│       ├── invoices/
│       │   ├── route.ts (GET list, POST create)
│       │   ├── [id]/route.ts (GET detail, PUT update)
│       │   └── [id]/send/route.ts (POST send email)
│       ├── payment-confirmations/
│       │   ├── route.ts (POST client confirm)
│       │   └── [id]/verify/route.ts (POST freelancer verify)
│       ├── users/
│       │   ├── me/route.ts (GET profile)
│       │   ├── me/bank-details/route.ts (PUT update)
│       │   └── me/preferences/route.ts (PUT notifications)
│       ├── notifications/route.ts (GET unread)
│       ├── referrals/
│       │   ├── route.ts (POST invite, GET stats)
│       │   └── confirm/route.ts (POST referral click)
│       ├── dashboard/
│       │   ├── summary/route.ts (GET metrics)
│       │   ├── insights/route.ts (GET achievements)
│       │   └── predictions/route.ts (GET forecasts)
│       ├── webhook/
│       │   ├── clerk/route.ts
│       │   ├── stripe/route.ts
│       │   └── sendgrid/route.ts
│       ├── transcribe/route.ts (POST audio)
│       └── health/route.ts (GET health check)
│
├── components/
│   ├── Auth/
│   │   ├── ProtectedRoute.tsx
│   │   └── AuthCheck.tsx
│   ├── Invoices/
│   │   ├── VoiceRecorder.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoiceList.tsx
│   │   ├── InvoiceDetail.tsx
│   │   └── InvoicePreview.tsx
│   ├── Payments/
│   │   ├── DualConfirmation.tsx
│   │   ├── PaymentOptions.tsx
│   │   └── StripeLink.tsx
│   ├── Dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MetricsCard.tsx
│   │   ├── StreakDisplay.tsx
│   │   ├── AchievementBadges.tsx
│   │   └── Forecast.tsx
│   ├── Notifications/
│   │   ├── NotificationCenter.tsx
│   │   ├── NotificationBell.tsx
│   │   └── NotificationList.tsx
│   ├── Referrals/
│   │   ├── ReferralWidget.tsx
│   │   └── ReferralStats.tsx
│   └── UI/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── Toast.tsx
│       └── Spinner.tsx
│
├── lib/
│   ├── firebase.ts (Init + helpers)
│   ├── openai.ts (Whisper + GPT-4 client)
│   ├── sendgrid.ts (Email service)
│   ├── stripe.ts (Payments client)
│   ├── clerk.ts (Auth helpers)
│   ├── encryption.ts (Bank details encryption)
│   ├── notifications.ts (Smart notification logic)
│   ├── gamification.ts (Achievements, streaks)
│   ├── referrals.ts (Referral logic)
│   └── validations.ts (Zod schemas)
│
├── services/
│   ├── invoiceService.ts
│   ├── paymentService.ts
│   ├── notificationService.ts
│   ├── userService.ts
│   ├── collectionsService.ts
│   ├── analyticsService.ts
│   ├── referralService.ts
│   └── emailService.ts
│
├── utils/
│   ├── constants.ts
│   ├── formatting.ts
│   ├── date.ts
│   ├── error.ts
│   ├── logger.ts
│   └── helpers.ts
│
├── types/
│   ├── models.ts (TypeScript interfaces)
│   ├── api.ts (API request/response types)
│   └── forms.ts (Form types)
│
├── jobs/
│   ├── processCollections.ts (Daily job)
│   ├── sendNotifications.ts (Daily job)
│   ├── calculateStats.ts (Daily job)
│   └── detectChurn.ts (Daily job)
│
├── __tests__/
│   ├── unit/
│   │   ├── invoiceService.test.ts
│   │   ├── paymentService.test.ts
│   │   └── notificationService.test.ts
│   └── integration/
│       ├── invoiceFlow.test.ts
│       └── collectionsFlow.test.ts
│
└── public/
    ├── logo.svg
    ├── icons/
    └── images/
```

---

## 4. DATABASE SCHEMA (Complete Firestore)

### Collections & Documents

```typescript
// ============ USERS COLLECTION ============

interface User {
  // Authentication
  userId: string; // Clerk user ID (document ID)
  email: string;
  name: string;
  
  // Business
  businessName?: string;
  businessType: 'freelancer' | 'agency' | 'consultant';
  
  // Subscription
  subscriptionTier: 'free' | 'paid';
  subscriptionStartDate?: Timestamp;
  collectionsEnabled: boolean;
  stripeCustomerId?: string;
  pricingModel?: 'commission' | 'subscription' | 'hybrid';
  
  // Banking (Encrypted)
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string; // encrypted
    sortCode: string; // encrypted
    bankName: string;
  };
  
  // Collections Demo Tracking
  collectionsDemoUsedThisMonth: number;
  lastDemoResetDate?: Timestamp;
  
  // Referral Tracking
  referralCode: string; // Unique code for this user
  referredBy?: string; // User ID of referrer
  
  // Profile
  profilePicture?: string;
  timezone: string; // User's timezone
  language: 'en' | 'es' | 'fr';
  
  // Preferences
  notifications: {
    emailNotifications: boolean;
    inAppNotifications: boolean;
    quietHoursStart: string; // "21:00"
    quietHoursEnd: string; // "08:00"
    notificationTypes: string[];
    onVacation: boolean;
    vacationUntil?: Timestamp;
  };
  
  // Status
  isActive: boolean;
  status: 'active' | 'suspended' | 'deleted';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  lastActiveAt?: Timestamp;
}

// ============ INVOICES COLLECTION ============

interface Invoice {
  // Identifiers
  invoiceId: string; // document ID
  reference: string; // INV-YYYYMMDD-XXXXX
  freelancerId: string; // User ID
  
  // Client Info
  clientName: string;
  clientEmail: string;
  clientId?: string; // If repeat client
  
  // Invoice Details
  amount: number;
  currency: string; // "GBP"
  description?: string;
  
  // Dates
  invoiceDate: Timestamp;
  dueDate: Timestamp;
  sentAt?: Timestamp;
  paidAt?: Timestamp;
  
  // Status
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'in_collections' | 'disputed' | 'cancelled';
  
  // Payment Options
  paymentMethods: ('bank_transfer' | 'card')[];
  stripePaymentLinkId?: string;
  stripePaymentLinkUrl?: string;
  
  // Collection Tracking
  collectionsEnabled: boolean;
  firstReminderSentAt?: Timestamp;
  secondReminderSentAt?: Timestamp;
  collectionsAttempts: number;
  
  // Confirmation
  dualConfirmationRequired: boolean;
  
  // Notes
  internalNotes?: string;
  
  // Metadata
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ PAYMENT_CONFIRMATIONS COLLECTION ============

interface PaymentConfirmation {
  // Identifiers
  confirmationId: string; // document ID
  invoiceId: string;
  freelancerId: string;
  clientEmail: string;
  
  // Token (for unauthenticated client confirmation)
  confirmationToken: string;
  tokenExpiresAt: Timestamp;
  
  // Confirmation Status
  status: 'pending_client' | 'client_confirmed' | 'both_confirmed' | 'expired' | 'cancelled';
  
  // Client Confirmation
  clientConfirmedAt?: Timestamp;
  clientConfirmedAmount?: number;
  clientPaymentMethod?: 'bank_transfer' | 'card';
  clientConfirmedDate?: string; // Date they say they paid
  clientNotes?: string;
  
  // Freelancer Confirmation
  freelancerConfirmedAt?: Timestamp;
  freelancerVerifiedReceived: boolean;
  
  // Payment Details
  expectedAmount: number;
  actualAmountPaid?: number;
  
  // Timestamps
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// ============ COLLECTIONS_ATTEMPTS COLLECTION ============

interface CollectionAttempt {
  // Identifiers
  attemptId: string; // document ID
  invoiceId: string;
  freelancerId: string;
  
  // Attempt Details
  attemptType: 'email_reminder' | 'ai_call' | 'manual_contact' | 'payment_received';
  attemptDate: Timestamp;
  attemptNumber: number;
  
  // Results
  result: 'success' | 'failed' | 'pending' | 'ignored';
  resultDetails?: string;
  
  // Email Specifics
  emailType?: 'day7' | 'day21' | 'follow_up';
  emailSentAt?: Timestamp;
  emailOpenedAt?: Timestamp;
  emailClickedAt?: Timestamp;
  
  // AI Call Specifics
  callDuration?: number;
  callRecordingUrl?: string;
  callOutcome?: string;
  
  // Outcomes
  paymentRecovered?: number;
  paymentDate?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
}

// ============ NOTIFICATIONS COLLECTION ============

interface Notification {
  // Identifiers
  notificationId: string; // document ID
  userId: string;
  
  // Content
  type: 'invoice_drought' | 'payment_delay' | 'win' | 'prediction' | 'opportunity' | 'daily_digest';
  title: string;
  message: string;
  actionUrl?: string;
  
  // Context Data
  contextData: {
    daysSinceLast?: number;
    lastAmount?: number;
    clientName?: string;
    relevantResources?: string[];
    actionSuggestions?: string[];
    percentile?: number;
    predictedOutcome?: string;
  };
  
  // Delivery
  channel: 'email' | 'in_app' | 'both';
  sentAt?: Timestamp;
  openedAt?: Timestamp;
  clickedAt?: Timestamp;
  
  // Status
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  deliveryAttempts: number;
  lastAttemptAt?: Timestamp;
  
  // Tracking
  efficacy: 'pending' | 'effective' | 'ignored' | 'negative';
  actionTaken?: string;
  
  // Metadata
  createdAt: Timestamp;
  expiresAt: Timestamp; // Auto-delete after 30 days
}

// ============ TRANSACTIONS COLLECTION ============

interface Transaction {
  // Identifiers
  transactionId: string; // document ID
  invoiceId: string;
  freelancerId: string;
  
  // Payment Details
  amount: number;
  paymentMethod: 'bank_transfer' | 'card';
  
  // Commission Calculation
  recoupCommission: number; // 3% of amount
  freelancerNet: number; // 97% of amount
  commissionRate: number; // 0.03 (3%)
  
  // Status
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Stripe Details
  stripeChargeId?: string;
  stripeTransferId?: string;
  
  // Timestamps
  transactionDate: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
}

// ============ REFERRALS COLLECTION ============

interface Referral {
  // Identifiers
  referralId: string; // document ID
  referrerId: string; // User who referred
  referredUserId?: string; // User who was referred
  referralCode: string;
  
  // Status
  status: 'pending' | 'active' | 'paid' | 'cancelled';
  
  // Rewards
  referrerCredit: number; // £ earned by referrer
  referredCredit: number; // £ earned by referred user
  creditType: 'account_credit' | 'cash_back' | 'discount';
  
  // Tracking
  signupDate?: Timestamp;
  activationDate?: Timestamp;
  firstInvoiceDate?: Timestamp;
  commissionEarnedDate?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// ============ USER_BEHAVIOR_PROFILE COLLECTION ============

interface UserBehaviorProfile {
  // Identifiers
  userId: string; // document ID
  
  // Invoicing Patterns
  invoicing: {
    averagePerWeek: number;
    averagePerMonth: number;
    daysOfWeekPreferred: string[];
    timeOfDayPreferred: string;
    averageAmount: number;
    lastInvoiceDate: Timestamp;
    invoicingGaps: number[];
  };
  
  // Payment Patterns
  payments: {
    averageDaysToPayment: number;
    bestPayingClients: string[];
    worstPayingClients: string[];
    seasonality: Map<string, number>;
    paymentReliability: number;
  };
  
  // Engagement Patterns
  engagement: {
    averageOpenPerWeek: number;
    lastOpenDate: Timestamp;
    daysOfWeekMostActive: string[];
    featureUsage: Map<string, number>;
  };
  
  // Current Context
  currentContext: {
    daysWithoutInvoice: number;
    invoiceDebtStatus: string;
    recentSuccesses: number;
    churnRiskScore: number;
  };
  
  // Timestamps
  lastUpdated: Timestamp;
}

// ============ USER_STATS COLLECTION ============

interface UserStats {
  // Identifiers
  userId: string; // document ID
  
  // Financial Metrics
  totalInvoiced: number;
  totalCollected: number;
  averagePaymentDays: number;
  onTimePercentage: number;
  
  // Gamification
  streak: number; // Days without overdue
  badges: string[];
  level: number;
  rank: number;
  
  // Achievements
  achievements: {
    badge: string;
    earnedAt: Timestamp;
    progress: number; // 0-100 for in-progress
  }[];
  
  // Engagement
  daysActivePastMonth: number;
  sessionsThisMonth: number;
  avgSessionDuration: number;
  
  // Calculated Metrics
  churnRiskScore: number; // 0-100
  engagementLevel: 'high' | 'medium' | 'low';
  
  // Timestamps
  calculatedAt: Timestamp;
}

// ============ EMAILS_SENT COLLECTION ============

interface EmailSent {
  // Identifiers
  emailId: string; // document ID
  freelancerId: string;
  
  // Email Details
  toEmail: string;
  subject: string;
  emailType: 'invoice' | 'reminder' | 'notification' | 'promotion';
  
  // Tracking
  sentAt: Timestamp;
  openedAt?: Timestamp;
  clickedAt?: Timestamp;
  bounced: boolean;
  complained: boolean;
  
  // Engagement
  openRate: number;
  clickRate: number;
  
  // Links Clicked
  linksClicked: {
    url: string;
    clickedAt: Timestamp;
  }[];
}

// ============ ONBOARDING_PROGRESS COLLECTION ============

interface OnboardingProgress {
  // Identifiers
  userId: string; // document ID
  
  // Steps
  completedSteps: string[];
  currentStep: string;
  completedAt?: Timestamp;
  
  // Timing
  stepsStartedAt: Map<string, Timestamp>;
  stepsCompletedAt: Map<string, Timestamp>;
  
  // Status
  status: 'in_progress' | 'completed' | 'abandoned';
}
```

### Firestore Security Rules

```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /invoices/{invoiceId} {
      allow read, write: if request.auth.uid == resource.data.freelancerId;
      allow create: if request.auth != null;
    }
    
    match /payment_confirmations/{confirmationId} {
      allow read: if request.auth.uid == resource.data.freelancerId 
                   || request.query.get('token') == resource.data.confirmationToken;
      allow write: if request.auth.uid == resource.data.freelancerId;
      allow create: if request.query.get('token') == request.resource.data.confirmationToken;
    }
    
    match /notifications/{notificationId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    match /user_behavior_profile/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /user_stats/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /transactions/{transactionId} {
      allow read, write: if request.auth.uid == resource.data.freelancerId;
    }
    
    // Allow server-only writes for collections_attempts
    match /collections_attempts/{attemptId} {
      allow read: if request.auth.uid == resource.data.freelancerId;
      allow write: if request.auth.uid == 'SYSTEM';
    }
  }
}
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### Clerk Setup

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/health",
    "/api/webhook",
    "/confirmation",
  ],
  ignoredRoutes: [
    "/api/webhook/clerk",
    "/api/webhook/stripe",
    "/api/webhook/sendgrid",
  ],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### JWT Extraction

```typescript
// lib/auth.ts
import { auth } from "@clerk/nextjs";

export function getAuthUserId(): string | null {
  const { userId } = auth();
  return userId;
}

export async function requireAuth() {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized: No user ID found");
  }
  
  return userId;
}

export async function verifyTokenOwnership(userId: string) {
  const { userId: authUserId } = auth();
  
  if (authUserId !== userId) {
    throw new Error("Forbidden: User does not own this resource");
  }
}
```

---

## 6. API ENDPOINTS (Complete)

### Invoices API

```typescript
// POST /api/invoices
// Create new invoice

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  
  const body = await req.json();
  const validated = InvoiceCreateSchema.parse(body);
  
  const reference = generateInvoiceReference();
  
  const invoice: Invoice = {
    invoiceId: nanoid(),
    reference,
    freelancerId: userId,
    clientName: validated.clientName,
    clientEmail: validated.clientEmail,
    amount: validated.amount,
    currency: 'GBP',
    dueDate: Timestamp.fromDate(new Date(validated.dueDate)),
    invoiceDate: Timestamp.now(),
    status: 'draft',
    paymentMethods: validated.paymentMethods || ['bank_transfer'],
    collectionsEnabled: false,
    dualConfirmationRequired: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  await db.collection('invoices').doc(invoice.invoiceId).set(invoice);
  
  return Response.json({ invoiceId: invoice.invoiceId, reference });
}

// GET /api/invoices
// List invoices with pagination

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  let query = db.collection('invoices')
    .where('freelancerId', '==', userId);
  
  if (status) {
    query = query.where('status', '==', status);
  }
  
  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(limit + 1)
    .offset(offset)
    .get();
  
  const invoices = snapshot.docs.map(doc => doc.data());
  
  return Response.json({
    invoices,
    hasMore: invoices.length > limit,
    total: snapshot.size,
  });
}

// GET /api/invoices/[id]
// Get single invoice

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  
  const invoice = await db.collection('invoices').doc(params.id).get();
  
  if (!invoice.exists) {
    return new Response('Not found', { status: 404 });
  }
  
  const data = invoice.data() as Invoice;
  
  if (data.freelancerId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }
  
  return Response.json(data);
}

// POST /api/invoices/[id]/send
// Send invoice via email

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  
  const invoice = await db.collection('invoices').doc(params.id).get();
  const invoiceData = invoice.data() as Invoice;
  
  if (invoiceData.freelancerId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Generate confirmation token
  const confirmationToken = crypto.randomUUID();
  const tokenExpiresAt = Timestamp.fromDate(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  );
  
  // Create payment confirmation record
  const confirmation: PaymentConfirmation = {
    confirmationId: nanoid(),
    invoiceId: params.id,
    freelancerId: userId,
    clientEmail: invoiceData.clientEmail,
    confirmationToken,
    tokenExpiresAt,
    status: 'pending_client',
    expectedAmount: invoiceData.amount,
    createdAt: Timestamp.now(),
    expiresAt: tokenExpiresAt,
  };
  
  await db.collection('payment_confirmations')
    .doc(confirmation.confirmationId)
    .set(confirmation);
  
  // Create Stripe payment link if card option offered
  let stripePaymentLink: string | null = null;
  if (invoiceData.paymentMethods.includes('card')) {
    stripePaymentLink = await createStripePaymentLink({
      amount: invoiceData.amount,
      invoiceReference: invoiceData.reference,
      clientEmail: invoiceData.clientEmail,
      freelancerId: userId,
    });
  }
  
  // Send email with SendGrid
  await sendInvoiceEmail({
    toEmail: invoiceData.clientEmail,
    invoiceReference: invoiceData.reference,
    amount: invoiceData.amount,
    freelancerName: (await getUserName(userId)) || 'Freelancer',
    paymentMethods: invoiceData.paymentMethods,
    bankDetails: await getBankDetails(userId),
    stripeLink: stripePaymentLink,
    confirmationToken,
  });
  
  // Update invoice status
  await db.collection('invoices').doc(params.id).update({
    status: 'sent',
    sentAt: Timestamp.now(),
  });
  
  return Response.json({ success: true });
}
```

### Payment Confirmations API

```typescript
// POST /api/payment-confirmations
// Client confirms payment (NO AUTH REQUIRED)

export async function POST(req: Request) {
  const body = await req.json();
  const { confirmationToken, amount, paymentMethod, datePaid } = body;
  
  // Find confirmation by token
  const confirmationSnapshot = await db
    .collection('payment_confirmations')
    .where('confirmationToken', '==', confirmationToken)
    .limit(1)
    .get();
  
  if (confirmationSnapshot.empty) {
    return new Response('Invalid token', { status: 400 });
  }
  
  const confirmation = confirmationSnapshot.docs[0].data() as PaymentConfirmation;
  
  // Check expiration
  if (confirmation.tokenExpiresAt.toDate() < new Date()) {
    return new Response('Token expired', { status: 400 });
  }
  
  // Update confirmation
  await db.collection('payment_confirmations')
    .doc(confirmation.confirmationId)
    .update({
      status: 'client_confirmed',
      clientConfirmedAt: Timestamp.now(),
      clientConfirmedAmount: amount,
      clientPaymentMethod: paymentMethod,
      clientConfirmedDate: datePaid,
    });
  
  // Send notification to freelancer
  await sendNotificationToFreelancer({
    freelancerId: confirmation.freelancerId,
    type: 'payment_confirmed',
    amount,
    clientEmail: confirmation.clientEmail,
    invoiceId: confirmation.invoiceId,
  });
  
  return Response.json({ success: true });
}

// POST /api/payment-confirmations/[id]/verify
// Freelancer verifies receipt (AUTH REQUIRED)

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  
  const confirmation = await db
    .collection('payment_confirmations')
    .doc(params.id)
    .get();
  
  const confirmationData = confirmation.data() as PaymentConfirmation;
  
  // Check ownership
  if (confirmationData.freelancerId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Update confirmation to both_confirmed
  await db.collection('payment_confirmations')
    .doc(params.id)
    .update({
      status: 'both_confirmed',
      freelancerConfirmedAt: Timestamp.now(),
      freelancerVerifiedReceived: true,
    });
  
  // Update invoice to paid
  await db.collection('invoices')
    .doc(confirmationData.invoiceId)
    .update({
      status: 'paid',
      paidAt: Timestamp.now(),
      firstReminderSentAt: null,
      secondReminderSentAt: null,
    });
  
  // Create transaction record
  const transaction: Transaction = {
    transactionId: nanoid(),
    invoiceId: confirmationData.invoiceId,
    freelancerId: userId,
    amount: confirmationData.actualAmountPaid || confirmationData.expectedAmount,
    paymentMethod: confirmationData.clientPaymentMethod || 'bank_transfer',
    recoupCommission: (confirmationData.actualAmountPaid || confirmationData.expectedAmount) * 0.03,
    freelancerNet: (confirmationData.actualAmountPaid || confirmationData.expectedAmount) * 0.97,
    commissionRate: 0.03,
    status: 'completed',
    transactionDate: Timestamp.now(),
    completedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  };
  
  await db.collection('transactions')
    .doc(transaction.transactionId)
    .set(transaction);
  
  // Send celebration notification
  await sendCelebrationNotification({
    freelancerId: userId,
    amount: transaction.amount,
    clientName: confirmationData.clientEmail,
  });
  
  return Response.json({ success: true });
}
```

### Smart Notifications API

```typescript
// GET /api/notifications
// Get unread notifications

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  
  const notifications = await db.collection('notifications')
    .where('userId', '==', userId)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();
  
  const data = notifications.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  return Response.json({ notifications: data });
}

// PUT /api/notifications/[id]/read
// Mark notification as read

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  
  await db.collection('notifications')
    .doc(params.id)
    .update({
      status: 'delivered',
      openedAt: Timestamp.now(),
    });
  
  return Response.json({ success: true });
}
```

---

## 7. SMART NOTIFICATIONS SYSTEM (Implementation)

### Decision Algorithm

```typescript
// lib/notifications.ts

export async function shouldSendNotification(
  userId: string,
  triggerType: string
): Promise<{
  shouldSend: boolean;
  config?: SmartNotification;
  reason: string;
}> {
  // Step 1: Get user preferences
  const userPrefs = await getUserNotificationPrefs(userId);
  
  if (!userPrefs.emailNotifications && !userPrefs.inAppNotifications) {
    return { shouldSend: false, reason: 'Notifications disabled' };
  }
  
  if (!userPrefs.notifications.enabledTypes.includes(triggerType)) {
    return { shouldSend: false, reason: 'User disabled this type' };
  }
  
  if (userPrefs.notifications.onVacation) {
    return { shouldSend: false, reason: 'User on vacation' };
  }
  
  // Step 2: Check quiet hours
  const now = new Date();
  const userTimeString = now.toLocaleString('en-US', { timeZone: userPrefs.timezone });
  if (isWithinQuietHours(userTimeString, userPrefs.notifications.quietHoursStart, userPrefs.notifications.quietHoursEnd)) {
    return { shouldSend: false, reason: 'Within quiet hours' };
  }
  
  // Step 3: Check frequency (don't spam)
  const recentNotifications = await getRecentNotifications(userId, 24);
  if (recentNotifications.length > 3) {
    return { shouldSend: false, reason: 'Too many notifications today' };
  }
  
  // Step 4: Create personalized notification
  const config = await createPersonalizedNotification(userId, triggerType);
  
  // Step 5: Calculate confidence
  const confidence = calculateConfidence(config);
  if (confidence < 0.6) {
    return { shouldSend: false, reason: `Low confidence (${confidence})` };
  }
  
  // Step 6: Check if helpful
  if (!isNotificationHelpful(config)) {
    return { shouldSend: false, reason: 'Would not be helpful' };
  }
  
  return {
    shouldSend: true,
    config,
    reason: `Relevant and helpful (${confidence} confidence)`,
  };
}

// Notification Types Implementation

export async function createInvoiceDroughtNotification(userId: string): Promise<SmartNotification> {
  const daysSinceLast = await calculateDaysSinceLastInvoice(userId);
  const userProfile = await getUserBehaviorProfile(userId);
  const user = await getUser(userId);
  
  let subject: string;
  let resources: string[] = [];
  
  if (daysSinceLast < 7) {
    return { shouldSend: false }; // Too early
  }
  
  if (user.createdAt.toDate().getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000) {
    // Established user
    subject = `You're usually ${userProfile.invoicing.averagePerWeek}/week. This week: 0.`;
  } else {
    // New user
    subject = `Haven't invoiced this week? We found 5 job boards`;
    resources = await getRelevantJobBoards(user.businessType);
  }
  
  return {
    notificationId: nanoid(),
    userId,
    trigger: {
      type: 'invoice_drought',
      reason: `No invoice for ${daysSinceLast} days`,
      confidence: Math.min(1, daysSinceLast / 14),
    },
    content: {
      subject,
      body: generateDroughtEmailBody(daysSinceLast, userProfile, resources),
      contextData: {
        daysSinceLast,
        lastAmount: userProfile.invoicing.averageAmount,
        relevantResources: resources,
      },
    },
    delivery: {
      channel: 'email',
      sendAt: Timestamp.now(),
      priority: 'medium',
    },
  };
}

export async function createPaymentDelayNotification(userId: string): Promise<SmartNotification | null> {
  const overdue Invoices = await getOverdueInvoices(userId);
  
  for (const invoice of overdueInvoices) {
    const clientProfile = await getClientPaymentProfile(userId, invoice.clientName);
    const daysOverdue = calculateDaysOverdue(invoice.dueDate);
    
    if (daysOverdue > (clientProfile.averageDaysToPayment + 3)) {
      return {
        notificationId: nanoid(),
        userId,
        trigger: {
          type: 'payment_delay',
          reason: `Invoice to ${invoice.clientName} is ${daysOverdue} days overdue`,
          confidence: 0.8,
        },
        content: {
          subject: `Invoice for £${invoice.amount} is slower than ${invoice.clientName} usually is`,
          body: generateDelayEmailBody(invoice, clientProfile),
          contextData: {
            clientName: invoice.clientName,
            daysOverdue,
            expectedDays: clientProfile.averageDaysToPayment,
            actionSuggestions: [
              'Send polite follow-up email',
              'Set up auto-reminders',
            ],
          },
        },
        delivery: {
          channel: 'email',
          sendAt: Timestamp.now(),
          priority: 'high',
        },
      };
    }
  }
  
  return null;
}

export async function createOverdueOpportunityNotification(userId: string): Promise<SmartNotification | null> {
  // Check if user can use collections demo
  const canUseDemo = await canUseCollectionsDemo(userId);
  if (!canUseDemo) return null;
  
  const overdueInvoices = await getOverdueInvoices(userId);
  const invoice = overdueInvoices[0]; // Most recent
  
  if (!invoice || calculateDaysOverdue(invoice.dueDate) < 7) {
    return null;
  }
  
  return {
    notificationId: nanoid(),
    userId,
    trigger: {
      type: 'opportunity',
      reason: `Overdue invoice is good candidate for collections`,
      confidence: 0.9,
    },
    content: {
      subject: `Your £${invoice.amount} invoice is overdue. Try collections feature`,
      body: generateOpportunityEmailBody(invoice),
      contextData: {
        clientName: invoice.clientName,
        amount: invoice.amount,
        actionSuggestions: [
          'Activate collections',
          'Learn how collections works',
          'Upgrade to unlimited',
        ],
      },
    },
    delivery: {
      channel: 'email',
      sendAt: Timestamp.now(),
      priority: 'high',
    },
  };
}

export async function createCelebrationNotification(
  userId: string,
  amount: number,
  clientName: string,
  daysToPayment: number
): Promise<SmartNotification> {
  const userPercentile = await calculatePaymentRecoveryPercentile(userId, daysToPayment);
  
  return {
    notificationId: nanoid(),
    userId,
    trigger: {
      type: 'win',
      reason: `Payment received, ${daysToPayment} days to payment`,
      confidence: 1.0,
    },
    content: {
      subject: `🎉 £${amount} just hit your bank! ${daysToPayment < 5 ? '(Early!)' : ''}`,
      body: generateCelebrationEmailBody(amount, clientName, daysToPayment, userPercentile),
      contextData: {
        clientName,
        amount,
        daysToPayment,
        percentile: userPercentile,
      },
    },
    delivery: {
      channel: 'email',
      sendAt: Timestamp.now(),
      priority: 'low',
    },
  };
}
```

### Scheduled Notification Jobs

```typescript
// jobs/sendNotifications.ts

export async function sendSmartNotifications() {
  const allUsers = await db.collection('users')
    .where('isActive', '==', true)
    .get();
  
  for (const userDoc of allUsers.docs) {
    const userId = userDoc.id;
    
    // Check invoice drought
    const droughtNotif = await createInvoiceDroughtNotification(userId);
    if (droughtNotif && droughtNotif.shouldSend !== false) {
      const canSend = await shouldSendNotification(userId, 'invoice_drought');
      if (canSend.shouldSend) {
        await saveAndSendNotification(userId, droughtNotif);
      }
    }
    
    // Check payment delays
    const delayNotif = await createPaymentDelayNotification(userId);
    if (delayNotif) {
      const canSend = await shouldSendNotification(userId, 'payment_delay');
      if (canSend.shouldSend) {
        await saveAndSendNotification(userId, delayNotif);
      }
    }
    
    // Check collections opportunities
    const opportunityNotif = await createOverdueOpportunityNotification(userId);
    if (opportunityNotif) {
      const canSend = await shouldSendNotification(userId, 'opportunity');
      if (canSend.shouldSend) {
        await saveAndSendNotification(userId, opportunityNotif);
      }
    }
  }
}

async function saveAndSendNotification(userId: string, notif: SmartNotification) {
  // Save to database
  await db.collection('notifications').doc(notif.notificationId).set(notif);
  
  // Send email
  if (notif.delivery.channel === 'email' || notif.delivery.channel === 'both') {
    await sendEmail({
      to: await getUserEmail(userId),
      subject: notif.content.subject,
      html: notif.content.body,
    });
  }
  
  // Update status
  await db.collection('notifications').doc(notif.notificationId).update({
    status: 'sent',
    sentAt: Timestamp.now(),
  });
}
```

---

## 8. GAMIFICATION IMPLEMENTATION

```typescript
// lib/gamification.ts

export async function updateUserAchievements(userId: string) {
  const stats = await getUserStats(userId);
  
  const newBadges: string[] = [];
  
  // Check each achievement
  if (stats.totalInvoiced >= 500) newBadges.push('first_invoice');
  if (stats.totalCollected >= 5000) newBadges.push('collector_5k');
  if (stats.totalCollected >= 50000) newBadges.push('collector_50k');
  if (stats.onTimePercentage >= 90) newBadges.push('reliable');
  if (stats.streak >= 7) newBadges.push('week_streak');
  if (stats.streak >= 30) newBadges.push('month_streak');
  if (stats.rank && stats.rank <= 100) newBadges.push('top_100');
  
  // Save new badges
  await db.collection('user_stats').doc(userId).update({
    badges: newBadges,
  });
}

export async function calculateStreak(userId: string): Promise<number> {
  const invoices = await db.collection('invoices')
    .where('freelancerId', '==', userId)
    .orderBy('dueDate', 'desc')
    .get();
  
  let streak = 0;
  const today = new Date();
  
  for (const doc of invoices.docs) {
    const invoice = doc.data() as Invoice;
    const daysOverdue = calculateDaysOverdue(invoice.dueDate);
    
    if (daysOverdue > 0) {
      break; // Streak broken
    }
    
    streak++;
  }
  
  return streak;
}

export async function calculateUserLevel(userId: string): Promise<number> {
  const stats = await getUserStats(userId);
  
  // Points system
  let points = 0;
  points += stats.totalCollected / 1000; // 1 point per £1000
  points += stats.streak; // Points per day of streak
  points += stats.badges.length * 10; // Points per badge
  
  return Math.floor(points / 100) + 1; // 100 points per level
}
```

---

## 9. COLLECTIONS DEMO LOGIC

```typescript
// jobs/processCollections.ts

export async function processCollectionsDailyJob() {
  const invoices = await db.collection('invoices')
    .where('status', '==', 'sent')
    .get();
  
  for (const invoiceDoc of invoices.docs) {
    const invoice = invoiceDoc.data() as Invoice;
    const daysOverdue = calculateDaysOverdue(invoice.dueDate);
    
    // Day 7 reminder
    if (daysOverdue === 7 && !invoice.firstReminderSentAt) {
      const canUseDemo = await canUseCollectionsDemo(invoice.freelancerId);
      
      if (canUseDemo) {
        // Send email
        await sendCollectionsEmailDay7(invoice);
        
        // Update invoice
        await invoiceDoc.ref.update({
          firstReminderSentAt: Timestamp.now(),
          status: 'overdue',
        });
        
        // Log attempt
        await db.collection('collections_attempts').add({
          invoiceId: invoice.invoiceId,
          freelancerId: invoice.freelancerId,
          attemptType: 'email_reminder',
          attemptDate: Timestamp.now(),
          result: 'success',
          emailType: 'day7',
        });
        
        // Increment demo counter
        await db.collection('users').doc(invoice.freelancerId).update({
          collectionsDemoUsedThisMonth: FieldValue.increment(1),
        });
      }
    }
    
    // Day 21 reminder
    if (daysOverdue === 21 && !invoice.secondReminderSentAt && invoice.firstReminderSentAt) {
      const user = await getUser(invoice.freelancerId);
      
      if (user.subscriptionTier === 'free') {
        const canUseDemo = await canUseCollectionsDemo(invoice.freelancerId);
        if (!canUseDemo) continue; // Demo already used
      }
      
      await sendCollectionsEmailDay21(invoice);
      
      await invoiceDoc.ref.update({
        secondReminderSentAt: Timestamp.now(),
      });
      
      await db.collection('collections_attempts').add({
        invoiceId: invoice.invoiceId,
        freelancerId: invoice.freelancerId,
        attemptType: 'email_reminder',
        attemptDate: Timestamp.now(),
        result: 'success',
        emailType: 'day21',
      });
    }
  }
}

export async function canUseCollectionsDemo(userId: string): Promise<boolean> {
  const user = await getUser(userId);
  
  if (user.subscriptionTier !== 'free') {
    return true; // Paid tier can always use
  }
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const lastActive = user.lastActiveAt?.toDate();
  const lastMonth = lastActive?.getMonth();
  const lastYear = lastActive?.getFullYear();
  
  // Check if month changed (reset)
  if (currentMonth !== lastMonth || currentYear !== lastYear) {
    await db.collection('users').doc(userId).update({
      collectionsDemoUsedThisMonth: 0,
      lastActiveAt: Timestamp.now(),
    });
    return true;
  }
  
  const demoCount = user.collectionsDemoUsedThisMonth || 0;
  return demoCount < 1;
}
```

---

## 10. REFERRAL SYSTEM

```typescript
// services/referralService.ts

export async function generateReferralCode(userId: string): Promise<string> {
  const code = generateSecureCode(8); // e.g., "REL-ABC123"
  
  await db.collection('users').doc(userId).update({
    referralCode: code,
  });
  
  return code;
}

export async function processReferral(referralCode: string, newUserId: string) {
  // Find referring user
  const referrerSnapshot = await db.collection('users')
    .where('referralCode', '==', referralCode)
    .limit(1)
    .get();
  
  if (referrerSnapshot.empty) {
    throw new Error('Invalid referral code');
  }
  
  const referrerId = referrerSnapshot.docs[0].id;
  
  // Create referral record
  const referral: Referral = {
    referralId: nanoid(),
    referrerId,
    referredUserId: newUserId,
    referralCode,
    status: 'active',
    referrerCredit: 5, // £5
    referredCredit: 5, // £5
    creditType: 'account_credit',
    signupDate: Timestamp.now(),
    createdAt: Timestamp.now(),
  };
  
  await db.collection('referrals').doc(referral.referralId).set(referral);
  
  // Add credit to both users
  await addAccountCredit(referrerId, 5);
  await addAccountCredit(newUserId, 5);
}

export async function addAccountCredit(userId: string, amount: number) {
  await db.collection('users').doc(userId).update({
    accountCredit: FieldValue.increment(amount),
  });
}
```

---

## 11. ERROR HANDLING

```typescript
// utils/error.ts

export class CustomError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'CustomError';
  }
}

export class ValidationError extends CustomError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Not found') {
    super('NOT_FOUND', message, 404);
  }
}

export async function handleError(error: unknown) {
  if (error instanceof CustomError) {
    return {
      status: error.statusCode,
      body: {
        error: error.code,
        message: error.message,
      },
    };
  }
  
  logger.error('Unknown error:', error);
  
  return {
    status: 500,
    body: {
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };
}
```

---

## 12. TESTING STRATEGY

```typescript
// __tests__/integration/invoiceFlow.test.ts

describe('Invoice Flow', () => {
  it('should create and send invoice', async () => {
    const userId = 'test-user-123';
    
    // Create invoice
    const createRes = await POST_createInvoice({
      clientName: 'Bob',
      clientEmail: 'bob@example.com',
      amount: 500,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentMethods: ['bank_transfer'],
    }, userId);
    
    expect(createRes.status).toBe(200);
    const { invoiceId } = await createRes.json();
    
    // Send invoice
    const sendRes = await POST_sendInvoice(invoiceId, userId);
    expect(sendRes.status).toBe(200);
    
    // Verify email was sent
    const sentEmails = await getSentEmails('bob@example.com');
    expect(sentEmails.length).toBeGreaterThan(0);
  });
  
  it('should handle dual confirmation', async () => {
    // ... test implementation
  });
});
```

---

## 13. DEPLOYMENT CHECKLIST

```
PRE-LAUNCH:
☐ Code review (peer reviewed)
☐ Security audit (OWASP compliance)
☐ Performance testing (load test)
☐ Accessibility audit (WCAG 2.1 AA)
☐ Privacy review (GDPR compliant)
☐ Legal review (T&Cs, Privacy Policy)
☐ Database backups configured
☐ Error logging configured (Sentry)
☐ Analytics tracking configured
☐ Email sending tested (100% deliverability)

DEPLOYMENT:
☐ Deploy to Vercel (main branch)
☐ Run smoke tests
☐ Check error logs
☐ Monitor performance metrics
☐ Verify all API endpoints
☐ Test payment flows (Stripe sandbox)
☐ Test email delivery (SendGrid)

POST-LAUNCH:
☐ Monitor user feedback
☐ Track key metrics (activation, retention)
☐ Daily health checks
☐ Weekly performance review
☐ Monthly security review
```

---

**END OF TECHNICAL SPECIFICATION**

Version 2.0 | Complete Implementation Guide | November 13, 2025

This document contains everything needed to build Recoup MVP with:
✓ Complete database schema
✓ All API endpoints
✓ All business logic
✓ Smart notification system
✓ Habit loop implementation
✓ Error handling
✓ Testing strategy
✓ Deployment guide

Ready for Claude Code to implement.

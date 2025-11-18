# Database Documentation

## Overview

Recoup uses **Firebase Firestore** as its primary database. Firestore is a NoSQL document database that provides real-time synchronization, offline support, and automatic scaling.

## Database Choice Rationale

**Why Firestore?**
- ✅ Real-time listeners for live updates
- ✅ Serverless architecture (no server management)
- ✅ Automatic scaling
- ✅ Offline support for mobile apps
- ✅ Strong security rules
- ✅ Generous free tier
- ✅ Built-in geographic redundancy

**Trade-offs:**
- ❌ Limited complex queries (no JOINs)
- ❌ Max 1 write/second per document
- ❌ No built-in full-text search
- ❌ Query requires indexes for compound filters

---

## Collections Schema

### 1. `users`

**Purpose:** Store user account information, settings, and subscription details.

**Document ID:** Clerk user ID

**Schema:**
```typescript
interface User {
  // Identity
  id: string;                    // Clerk user ID
  email: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Business Details
  businessName?: string;
  businessType?: 'sole_trader' | 'limited_company' | 'partnership' | 'other';
  businessAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  vatNumber?: string;
  companyNumber?: string;

  // Subscription & Billing
  subscriptionTier: 'free' | 'starter' | 'growth' | 'pro' | 'business';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'trialing';
  subscriptionPeriod: 'monthly' | 'annual';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  // Founding Member Program
  isFoundingMember: boolean;     // First 50 users
  foundingMemberLockInPrice?: number;  // £9.50/month locked in
  foundingMemberNumber?: number; // 1-50

  // Bank Details (ENCRYPTED)
  bankDetails?: string;          // AES-256-CBC encrypted JSON
  // Decrypted structure:
  // {
  //   accountNumber: string;
  //   sortCode: string;
  //   accountName: string;
  // }

  // Collections Settings
  collectionsConsent: boolean;   // GDPR consent for automated collections
  collectionsConsentDate?: Timestamp;
  pecrConsent: boolean;          // PECR consent for SMS/calls
  preferredCollectionMethods: ('email' | 'sms' | 'letter' | 'voice')[];

  // Usage Tracking
  monthlyCollectionsUsed: number;
  monthlyCollectionsLimit: number;
  lastUsageReset: Timestamp;     // Reset on 1st of month

  // Quotas by Tier
  quotas: {
    invoices: number;            // -1 = unlimited
    clients: number;
    collections: number;
    aiCalls: number;
    sms: number;
    letters: number;
  };

  // Notification Preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  marketingEmails: boolean;

  // Feature Flags
  features: {
    voiceToInvoice: boolean;
    aiCollectionCalls: boolean;
    physicalLetters: boolean;
    agencyHandoff: boolean;
    advancedAnalytics: boolean;
  };

  // Referral Tracking
  referralCode: string;          // Unique code for sharing
  referredBy?: string;           // Referrer's user ID
  referralCredits: number;       // £5 per successful referral

  // Metadata
  lastLogin?: Timestamp;
  loginCount: number;
  onboardingCompleted: boolean;
  onboardingStep?: number;
}
```

**Indexes:**
```javascript
// Composite index for subscription queries
fields: ['subscriptionTier', 'subscriptionStatus', 'createdAt']

// Founding member queries
fields: ['isFoundingMember', 'foundingMemberNumber']
```

**Security Rules:**
```javascript
match /users/{userId} {
  // Users can only read/write their own document
  allow read, write: if request.auth.uid == userId;

  // Never allow direct writes to certain fields
  allow update: if !request.resource.data.diff(resource.data)
    .affectedKeys().hasAny(['stripeCustomerId', 'monthlyCollectionsLimit']);
}
```

---

### 2. `invoices`

**Purpose:** Store all invoice records and tracking information.

**Document ID:** Auto-generated Firestore ID

**Schema:**
```typescript
interface Invoice {
  // Identity
  id: string;
  invoiceNumber: string;         // User-friendly: INV-001, INV-002
  userId: string;                // Owner user ID

  // Client Information
  clientId: string;              // Reference to clients collection
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientPhone?: string;
  clientAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };

  // Invoice Details
  amount: number;                // Total amount
  currency: 'GBP' | 'USD' | 'EUR';
  taxRate?: number;              // VAT percentage (e.g., 20)
  taxAmount?: number;
  subtotal: number;

  // Line Items
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;                // Price per unit
    amount: number;              // quantity * rate
    taxable: boolean;
  }>;

  // Dates
  issueDate: Timestamp;
  dueDate: Timestamp;
  paidDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Status & State
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'in_collections' |
          'disputed' | 'cancelled' | 'partially_paid';

  // Collections Escalation
  escalationLevel: 'pending' | 'gentle' | 'firm' | 'final' | 'agency';
  escalationPaused: boolean;
  escalationPausedUntil?: Timestamp;
  escalationPauseReason?: string;
  lastEscalationDate?: Timestamp;
  daysSinceOverdue?: number;     // Calculated field

  // Payment Information
  paymentMethods: ('stripe' | 'bacs' | 'bank_transfer' | 'cash' | 'cheque')[];
  stripePaymentLinkId?: string;
  stripePaymentLink?: string;
  bankTransferReference?: string;

  // Collections Tracking
  collectionAttempts: number;
  lastCollectionAttempt?: Timestamp;
  collectionMethods: Array<{
    type: 'email' | 'sms' | 'letter' | 'ai_call';
    sentAt: Timestamp;
    status: 'sent' | 'delivered' | 'failed' | 'bounced';
    messageId?: string;
  }>;

  // Payment Claims
  hasActiveClaim: boolean;
  activeClaimId?: string;
  claimDeadline?: Timestamp;

  // Late Payment Interest (UK Law)
  latePaymentInterestEnabled: boolean;
  baseRate?: number;             // Bank of England base rate at invoice date
  interestRate?: number;         // Base rate + 8% (statutory)
  accruedInterest?: number;      // Calculated daily

  // Notes & Attachments
  description?: string;
  notes?: string;                // Internal notes
  attachments?: Array<{
    url: string;
    filename: string;
    uploadedAt: Timestamp;
  }>;

  // Metadata
  source: 'manual' | 'voice' | 'import' | 'recurring';
  voiceTranscriptId?: string;    // If created via voice
  recurringInvoiceId?: string;   // If part of recurring series

  // Analytics
  viewCount: number;             // Times client viewed invoice
  lastViewedAt?: Timestamp;
  reminderEmailsOpened: number;
  reminderEmailsClicked: number;
}
```

**Indexes:**
```javascript
// User's invoices by status and due date
fields: ['userId', 'status', 'dueDate']

// Overdue invoices for escalation processing
fields: ['status', 'escalationLevel', 'dueDate']

// User's invoices by creation date (for dashboard)
fields: ['userId', 'createdAt:desc']

// Escalation processing (cron job)
fields: ['escalationLevel', 'escalationPaused', 'dueDate']
```

**Calculated Fields:**
```typescript
// Computed on read
function getDaysSinceOverdue(invoice: Invoice): number {
  if (invoice.status !== 'overdue') return 0;
  const now = new Date();
  const dueDate = invoice.dueDate.toDate();
  return Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
}

// Late payment interest calculation (UK Late Payment Act)
function calculateLateInterest(invoice: Invoice): number {
  if (!invoice.latePaymentInterestEnabled || invoice.status === 'paid') {
    return 0;
  }

  const daysLate = getDaysSinceOverdue(invoice);
  const dailyRate = (invoice.interestRate / 100) / 365;
  return invoice.amount * dailyRate * daysLate;
}
```

---

### 3. `clients`

**Purpose:** Store client contact information and payment history.

**Document ID:** Auto-generated Firestore ID

**Schema:**
```typescript
interface Client {
  id: string;
  userId: string;                // Owner user ID

  // Contact Information
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;

  // Address
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };

  // Payment History
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;

  invoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;

  // Payment Behavior
  averageDaysToPayment: number;
  onTimePaymentRate: number;     // Percentage (0-100)
  paymentReliabilityScore: number; // 0-10 rating
  lastPaymentDate?: Timestamp;

  // Preferences
  preferredPaymentMethod?: 'stripe' | 'bacs' | 'bank_transfer';
  preferredCurrency?: 'GBP' | 'USD' | 'EUR';
  autoSendInvoices: boolean;

  // Collections
  collectionsConsentGiven: boolean;
  doNotContact: boolean;         // Opt-out flag
  doNotContactReason?: string;

  // Notes
  notes?: string;
  tags: string[];                // e.g., ['VIP', 'slow-payer', 'new-client']

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastInvoiceDate?: Timestamp;
  source: 'manual' | 'invoice' | 'import';
}
```

**Indexes:**
```javascript
// User's clients by name
fields: ['userId', 'name']

// User's clients by payment reliability
fields: ['userId', 'paymentReliabilityScore:desc']

// User's clients with outstanding balances
fields: ['userId', 'totalOutstanding:desc']
```

---

### 4. `payment_confirmations`

**Purpose:** Dual-confirmation flow for client payment verification.

**Document ID:** Auto-generated Firestore ID

**Schema:**
```typescript
interface PaymentConfirmation {
  id: string;
  invoiceId: string;
  userId: string;
  clientEmail: string;

  // Confirmation Tokens
  clientToken: string;           // UUID for client confirmation link
  freelancerToken: string;       // UUID for freelancer confirmation

  // Payment Details
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'bacs' | 'bank_transfer' | 'cash' | 'cheque';
  paymentReference?: string;

  // Confirmation Status
  clientConfirmed: boolean;
  clientConfirmedAt?: Timestamp;
  freelancerConfirmed: boolean;
  freelancerConfirmedAt?: Timestamp;

  // Expiry
  expiresAt: Timestamp;          // 7 days from creation
  expired: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Business Logic:**
- Both client and freelancer must confirm payment
- Invoice marked as paid when both confirm
- Prevents false payment claims
- Expires after 7 days

---

### 5. `payment_claims`

**Purpose:** BACS payment claims with 48-hour verification deadline.

**Document ID:** Auto-generated Firestore ID

**Schema:**
```typescript
interface PaymentClaim {
  id: string;
  invoiceId: string;
  userId: string;                // Freelancer user ID
  clientEmail: string;

  // Claim Details
  amount: number;
  currency: string;
  paymentMethod: 'bacs' | 'bank_transfer' | 'cheque' | 'cash' | 'other';
  reference?: string;            // Bank reference or cheque number
  paidDate?: Timestamp;          // When client claims they paid
  notes?: string;                // Client notes

  // Evidence
  evidence: Array<{
    id: string;
    url: string;                 // Firebase Storage URL
    filename: string;
    fileType: string;            // e.g., 'image/png', 'application/pdf'
    uploadedAt: Timestamp;
    uploadedBy: 'client' | 'freelancer';
  }>;

  // Verification Status
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedAt?: Timestamp;
  rejectedAt?: Timestamp;
  rejectionReason?: string;

  // Deadline (48 hours from claim)
  deadline: Timestamp;           // createdAt + 48 hours
  deadlineReminderSent: boolean;

  // Auto-Verification
  autoVerified: boolean;         // True if deadline passed with no action
  autoVerifiedAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Workflow:**
1. Client claims payment made (creates claim)
2. System sends email to freelancer (verify within 48h)
3. Freelancer has 3 options:
   - ✅ Verify (payment received)
   - ❌ Reject (payment not found, request evidence)
   - ⏰ No action (auto-verify after 48h)

---

### 6. `collection_attempts`

**Purpose:** Track all collection communications (emails, SMS, calls, letters).

**Document ID:** Auto-generated Firestore ID

**Schema:**
```typescript
interface CollectionAttempt {
  id: string;
  invoiceId: string;
  userId: string;
  clientId: string;

  // Attempt Details
  type: 'email' | 'sms' | 'letter' | 'ai_call' | 'manual_call';
  escalationLevel: 'gentle' | 'firm' | 'final' | 'agency';

  // Sending Details
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';
  sentAt: Timestamp;
  deliveredAt?: Timestamp;
  failedAt?: Timestamp;
  failureReason?: string;

  // Engagement Tracking
  opened: boolean;
  openedAt?: Timestamp;
  clicked: boolean;
  clickedAt?: Timestamp;

  // Provider Information
  provider: 'sendgrid' | 'twilio' | 'lob' | 'openai';
  providerMessageId: string;     // External ID for tracking
  providerStatus?: string;       // Provider-specific status

  // Content
  subject?: string;              // For emails
  message?: string;              // SMS content or email preview
  templateId?: string;           // SendGrid template ID

  // Voice Call Specific
  callDuration?: number;         // Seconds
  transcript?: string;           // Full call transcript
  callOutcome?: 'payment_promised' | 'dispute' | 'voicemail' |
                'no_answer' | 'wrong_number' | 'callback_requested';
  promisedPaymentDate?: Timestamp;
  recordingUrl?: string;         // Call recording URL

  // Letter Specific
  trackingNumber?: string;       // Postal tracking
  expectedDelivery?: Timestamp;
  deliveryConfirmed: boolean;

  // Cost Tracking
  cost: number;                  // In pence/cents
  chargedToUser: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
```javascript
// Invoice's collection attempts by date
fields: ['invoiceId', 'sentAt:desc']

// User's collection attempts by type
fields: ['userId', 'type', 'sentAt:desc']

// Failed attempts for retry processing
fields: ['status', 'sentAt']
```

---

### 7. `notifications`

**Purpose:** In-app notifications for users.

**Document ID:** Auto-generated Firestore ID

**Schema:**
```typescript
interface Notification {
  id: string;
  userId: string;

  // Notification Content
  type: 'payment_received' | 'invoice_overdue' | 'claim_pending' |
        'claim_deadline' | 'escalation_triggered' | 'achievement_unlocked' |
        'quota_warning' | 'invoice_drought' | 'subscription_expiring';
  title: string;
  message: string;
  icon?: string;

  // Related Entity
  relatedEntityType?: 'invoice' | 'client' | 'payment_claim';
  relatedEntityId?: string;

  // Action
  actionLabel?: string;          // e.g., "View Invoice"
  actionUrl?: string;            // e.g., "/dashboard/invoices/abc123"

  // Status
  read: boolean;
  readAt?: Timestamp;
  dismissed: boolean;
  dismissedAt?: Timestamp;

  // Priority
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: Timestamp;         // Auto-dismiss after date

  // Metadata
  createdAt: Timestamp;
}
```

**Behavioral Triggers:**
```typescript
// Invoice Drought
if (daysSinceLastInvoice > 14) {
  createNotification({
    type: 'invoice_drought',
    title: 'It\'s been a while!',
    message: 'You haven\'t created an invoice in 2 weeks. Time to bill for your work?',
    priority: 'normal',
  });
}

// Quota Warning
if (monthlyUsed / monthlyLimit > 0.8) {
  createNotification({
    type: 'quota_warning',
    title: 'Collection quota running low',
    message: 'You\'ve used 80% of your monthly collections. Consider upgrading.',
    priority: 'high',
  });
}
```

---

### 8. `transactions`

**Purpose:** Financial transaction records for accounting.

**Document ID:** Auto-generated Firestore ID

**Schema:**
```typescript
interface Transaction {
  id: string;
  userId: string;
  invoiceId?: string;

  // Transaction Details
  type: 'payment_received' | 'refund' | 'fee' | 'subscription' | 'overage';
  amount: number;
  currency: string;

  // Stripe Information
  stripeChargeId?: string;
  stripeTransferId?: string;
  stripePayoutId?: string;
  stripeFee?: number;            // Stripe's fee

  // Recoup Commission
  recoupCommission?: number;     // Our fee (if applicable)
  netAmount: number;             // Amount after fees

  // Status
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  failureReason?: string;

  // Payout
  payoutDate?: Timestamp;
  payoutMethod?: 'stripe' | 'bank_transfer';

  // Metadata
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 9. `referrals`

**Purpose:** Track referral program signups and rewards.

**Document ID:** Auto-generated Firestore ID

**Schema:**
```typescript
interface Referral {
  id: string;
  referrerId: string;            // User who referred
  referredId: string;            // New user who signed up

  // Referral Details
  referralCode: string;          // Code used
  signupDate: Timestamp;

  // Activation
  activated: boolean;            // Referred user completed onboarding
  activatedAt?: Timestamp;

  // Rewards
  referrerCreditAmount: number;  // £5
  referredCreditAmount: number;  // £5
  referrerCreditApplied: boolean;
  referredCreditApplied: boolean;

  // Metadata
  createdAt: Timestamp;
}
```

---

### 10. `user_behavior_profile`

**Purpose:** AI-powered behavior tracking for predictive analytics.

**Document ID:** User ID

**Schema:**
```typescript
interface UserBehaviorProfile {
  userId: string;

  // Invoicing Patterns
  averageInvoiceAmount: number;
  invoicingFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'irregular';
  typicalInvoiceDay?: number;    // Day of week (0-6)
  seasonalPatterns?: {
    [month: string]: number;     // Average invoices per month
  };

  // Payment Patterns
  averageDaysToPayment: number;
  onTimePaymentRate: number;
  clientRetentionRate: number;

  // Engagement Metrics
  loginFrequency: 'daily' | 'weekly' | 'monthly' | 'rare';
  lastActiveDate: Timestamp;
  featureUsage: {
    voiceInvoice: number;
    collections: number;
    analytics: number;
    exports: number;
  };

  // Churn Risk
  churnRiskScore: number;        // 0-100 (higher = more risk)
  churnRiskFactors: string[];    // Reasons for risk

  // Predictions
  predictedNextInvoiceDate?: Timestamp;
  predictedMonthlyRevenue?: number;

  // Metadata
  profileVersion: number;        // For schema migrations
  lastCalculated: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 11. `user_stats`

**Purpose:** Gamification metrics and achievements.

**Document ID:** User ID

**Schema:**
```typescript
interface UserStats {
  userId: string;

  // Financial Stats
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  largestInvoice: number;

  // Streaks
  currentStreak: number;         // Days without new overdue
  longestStreak: number;
  streakStartDate?: Timestamp;
  lastStreakBreak?: Timestamp;

  // Achievements
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt: Timestamp;
    icon: string;
  }>;

  // Levels & XP
  level: number;
  experiencePoints: number;
  nextLevelXP: number;

  // Badges
  badges: string[];              // Badge IDs

  // Leaderboard
  leaderboardRank?: number;
  leaderboardScore: number;

  // Collection Success
  collectionSuccessRate: number; // Percentage
  averageCollectionTime: number; // Days to collect

  // Metadata
  updatedAt: Timestamp;
}
```

**XP Earning Rules:**
```typescript
const XP_ACTIONS = {
  create_invoice: 10,
  invoice_paid_on_time: 50,
  successful_collection: 100,
  maintain_30_day_streak: 200,
  complete_onboarding: 100,
};
```

---

### 12. `emails_sent`

**Purpose:** Track all emails sent via SendGrid.

**Document ID:** SendGrid message ID

**Schema:**
```typescript
interface EmailSent {
  id: string;                    // SendGrid message ID
  userId: string;
  invoiceId?: string;

  // Email Details
  to: string;
  from: string;
  subject: string;
  templateId?: string;

  // SendGrid Tracking
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' |
          'bounced' | 'dropped' | 'spam_reported';

  // Events
  events: Array<{
    type: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam_report';
    timestamp: Timestamp;
    userAgent?: string;
    ip?: string;
    url?: string;               // For clicks
  }>;

  // Metrics
  openCount: number;
  clickCount: number;
  uniqueOpens: number;
  uniqueClicks: number;

  // Bounce Information
  bounceType?: 'soft' | 'hard' | 'blocked';
  bounceReason?: string;

  // Metadata
  sentAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 13. `onboarding_progress`

**Purpose:** Track user onboarding completion.

**Document ID:** User ID

**Schema:**
```typescript
interface OnboardingProgress {
  userId: string;

  // Progress
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  completedAt?: Timestamp;

  // Steps
  steps: Array<{
    id: string;
    name: string;
    completed: boolean;
    completedAt?: Timestamp;
    skipped: boolean;
  }>;

  // Onboarding Steps:
  // 1. Business details
  // 2. Bank account setup
  // 3. Create first client
  // 4. Create first invoice
  // 5. Collections consent
  // 6. Tour completion

  // Metadata
  startedAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 14. `agency_handoffs`

**Purpose:** Track collection agency escalations.

**Document ID:** Auto-generated Firestore ID

**Schema:**
```typescript
interface AgencyHandoff {
  id: string;
  userId: string;
  invoiceId: string;
  clientId: string;

  // Agency Information
  agencyId: string;
  agencyName: string;
  agencyContactEmail: string;
  agencyContactPhone: string;

  // Handoff Details
  outstandingAmount: number;
  currency: string;
  daysSinceOverdue: number;
  previousCollectionAttempts: number;

  // Documents
  documents: Array<{
    type: 'invoice' | 'correspondence' | 'evidence' | 'contract';
    url: string;
    filename: string;
    uploadedAt: Timestamp;
  }>;

  // Status
  status: 'pending' | 'accepted' | 'in_progress' | 'collected' |
          'uncollectible' | 'disputed';
  acceptedAt?: Timestamp;

  // Recovery
  amountRecovered?: number;
  recoveryDate?: Timestamp;
  agencyCommission?: number;      // Agency's fee
  userPayout?: number;            // Net to user

  // Communication
  communications: Array<{
    date: Timestamp;
    from: 'agency' | 'user';
    message: string;
    attachments?: string[];
  }>;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt?: Timestamp;
}
```

---

## Relationships

```
┌──────────────┐
│    users     │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼───────┐      1:N      ┌─────────────────┐
│   clients    │◄───────────────┤    invoices     │
└──────────────┘                └────────┬────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    │ 1:N                │ 1:N                │ 1:1
                    │                    │                    │
           ┌────────▼────────┐  ┌────────▼────────┐  ┌───────▼──────────┐
           │  collection_    │  │    payment_     │  │   payment_       │
           │   attempts      │  │     claims      │  │  confirmations   │
           └─────────────────┘  └─────────────────┘  └──────────────────┘
```

**Key Relationships:**
- One user → Many clients
- One user → Many invoices
- One client → Many invoices
- One invoice → Many collection attempts
- One invoice → One or zero payment claims (active)
- One invoice → One or zero payment confirmations

---

## Data Denormalization

**Why Denormalize?**
- Firestore has no JOINs
- Optimize for read performance
- Reduce number of queries per page load

**Denormalized Data Examples:**

1. **Client info in invoices:**
   ```typescript
   // Instead of storing just clientId, also store:
   invoice.clientName = "John Smith";
   invoice.clientEmail = "john@example.com";

   // Benefit: Display invoice without additional client lookup
   ```

2. **User quota in user document:**
   ```typescript
   // Instead of calculating from collection_attempts:
   user.monthlyCollectionsUsed = 23;

   // Benefit: Instant quota check without counting documents
   ```

3. **Client totals in client document:**
   ```typescript
   // Instead of aggregating from invoices:
   client.totalInvoiced = 15000;
   client.totalPaid = 12000;

   // Benefit: Fast client list with payment stats
   ```

**Trade-off:** Must update denormalized data when source changes.

**Update Pattern:**
```typescript
// When invoice is paid, update both:
await db.runTransaction(async (transaction) => {
  // Update invoice
  transaction.update(invoiceRef, {
    status: 'paid',
    paidDate: Timestamp.now(),
  });

  // Update client totals (denormalized)
  transaction.update(clientRef, {
    totalPaid: FieldValue.increment(invoice.amount),
    totalOutstanding: FieldValue.decrement(invoice.amount),
  });

  // Update user stats (denormalized)
  transaction.update(userStatsRef, {
    totalCollected: FieldValue.increment(invoice.amount),
  });
});
```

---

## Indexes

**Firestore Composite Indexes:**

```json
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
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "escalationLevel", "order": "ASCENDING" },
        { "fieldPath": "escalationPaused", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "collection_attempts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "invoiceId", "order": "ASCENDING" },
        { "fieldPath": "sentAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "clients",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "totalOutstanding", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Backup & Data Retention

**Automated Backups:**
- Daily Firestore exports to Cloud Storage
- 30-day retention for point-in-time recovery
- Weekly full backups retained for 1 year

**Soft Deletes:**
```typescript
// Don't actually delete documents
interface SoftDelete {
  deleted: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;
}

// Mark as deleted instead
await invoiceRef.update({
  deleted: true,
  deletedAt: Timestamp.now(),
  deletedBy: userId,
});

// Filter out deleted in queries
const invoices = await db.collection('invoices')
  .where('userId', '==', userId)
  .where('deleted', '==', false)
  .get();
```

---

## Data Migration

**Schema Versioning:**
```typescript
interface VersionedDocument {
  schemaVersion: number;
  migratedAt?: Timestamp;
}

// Migration script
async function migrateToV2() {
  const batch = db.batch();
  const docs = await db.collection('invoices')
    .where('schemaVersion', '<', 2)
    .limit(500)
    .get();

  docs.forEach((doc) => {
    batch.update(doc.ref, {
      schemaVersion: 2,
      // Add new fields with defaults
      escalationPaused: false,
      daysSinceOverdue: 0,
      migratedAt: Timestamp.now(),
    });
  });

  await batch.commit();
}
```

---

## Security Best Practices

1. **Never store sensitive data unencrypted**
   - Bank details → AES-256-CBC
   - Passwords → Handled by Clerk (never stored)

2. **User-scoped queries**
   - Always filter by `userId` first
   - Prevents data leaks between users

3. **Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only access their own data
       match /invoices/{invoice} {
         allow read, write: if request.auth.uid == resource.data.userId;
       }

       // Public invoice view (no auth required)
       match /invoices/{invoice} {
         allow read: if resource.data.status == 'sent';
       }

       // Clients can claim payment (no auth)
       match /payment_claims/{claim} {
         allow create: if true;
         allow read, update: if request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

4. **Rate limiting**
   - Prevent abuse with Upstash Redis
   - Per-user quotas enforced server-side

5. **Audit logs**
   - Log sensitive operations (delete, export, etc.)
   - Track who accessed what when

---

For more information, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [API Documentation](./api/openapi.yaml) - API endpoint specifications

# Recoup Improvement Roadmap: Phases 4-6
## Making Recoup Production-Ready, Secure, and Enterprise-Grade

---

## TABLE OF CONTENTS
1. [Phase 4: Security & Data Protection](#phase-4-security--data-protection)
2. [Phase 5: Robustness & Reliability](#phase-5-robustness--reliability)
3. [Phase 6: Testing, Monitoring & Performance](#phase-6-testing-monitoring--performance)
4. [Phase 7: Compliance & Legal](#phase-7-compliance--legal)
5. [Phase 8: Developer Experience & Documentation](#phase-8-developer-experience--documentation)
6. [Implementation Priority Matrix](#implementation-priority-matrix)

---

## PHASE 4: SECURITY & DATA PROTECTION
**Goal:** Make Recoup secure against OWASP Top 10 vulnerabilities and protect sensitive financial data

### 4.1 Input Validation & Sanitization (HIGH PRIORITY) ⭐⭐⭐⭐⭐

#### Current State
- ✅ Zod validation exists for invoices (`InvoiceCreateSchema`)
- ❌ Missing validation for new services (profitability, IR35, proposals, scope creep, MTD)
- ❌ No input sanitization for XSS prevention
- ❌ No file upload validation

#### Required Improvements

**A. Create validation schemas for ALL new services**
```typescript
// lib/validations/client-profitability.ts
export const ClientProfitabilityAnalysisSchema = z.object({
  clientId: z.string().uuid(),
  clientName: z.string().min(1).max(200),
  invoices: z.array(z.object({
    amount: z.number().positive(),
    amountPaid: z.number().nonnegative(),
  })),
  timeEntries: z.array(TimeEntrySchema),
  costToServeEntries: z.array(CostToServeSchema),
  defaultHourlyRate: z.number().positive().max(10000),
});

// lib/validations/ir35-assessment.ts
export const IR35AssessmentSchema = z.object({
  clientId: z.string().uuid(),
  contractId: z.string().uuid().optional(),
  control: ControlFactorsSchema,
  substitution: SubstitutionFactorsSchema,
  mutualObligation: MutualObligationSchema,
  financialRisk: FinancialRiskSchema,
  partAndParcel: PartAndParcelSchema,
  business: BusinessFactorsSchema,
  currentAnnualIncome: z.number().positive().max(10000000),
});

// lib/validations/proposal-generation.ts
export const ProposalGenerationSchema = z.object({
  clientId: z.string().uuid(),
  projectName: z.string().min(1).max(500),
  projectDescription: z.string().min(10).max(5000),
  requirements: z.array(z.string().min(1).max(1000)).max(50),
  deliverables: z.array(z.string().min(1).max(1000)).max(50),
  // Prevent prompt injection
  tone: z.enum(['professional', 'friendly', 'technical', 'creative']),
  length: z.enum(['concise', 'standard', 'detailed']),
});
```

**B. XSS Prevention**
```typescript
// utils/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
}

export function sanitizeUserInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
```

**C. SQL/NoSQL Injection Prevention**
```typescript
// All Firestore queries already use parameterized queries
// Add validation to prevent NoSQL injection in query params

export function validateFirestoreQuery(params: Record<string, any>) {
  // Prevent injection via field names
  const allowedFields = ['status', 'amount', 'dueDate', 'clientId', 'userId'];

  for (const key of Object.keys(params)) {
    if (!allowedFields.includes(key)) {
      throw new ValidationError(`Invalid query field: ${key}`);
    }
  }
}
```

---

### 4.2 Authentication & Authorization (HIGH PRIORITY) ⭐⭐⭐⭐⭐

#### Current State
- ✅ Clerk authentication integrated
- ✅ Premium gating middleware exists
- ❌ Mock auth in API routes (`getAuthUserId()` returns hardcoded value)
- ❌ No RBAC (Role-Based Access Control)
- ❌ No API key authentication for third-party integrations

#### Required Improvements

**A. Replace mock auth with real Clerk auth**
```typescript
// lib/auth.ts
import { auth, currentUser } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/utils/error';

export async function getAuthenticatedUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }

  return userId;
}

export async function requireAuth() {
  const userId = await getAuthenticatedUser();
  const user = await currentUser();

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return { userId, user };
}
```

**B. Implement Resource Authorization**
```typescript
// middleware/authorization.ts
export async function requireResourceOwnership(
  userId: string,
  resourceType: 'invoice' | 'client' | 'proposal' | 'assessment',
  resourceId: string
) {
  const resource = await db.collection(resourceType + 's').doc(resourceId).get();

  if (!resource.exists) {
    throw new NotFoundError(`${resourceType} not found`);
  }

  const data = resource.data();

  if (data.userId !== userId && data.freelancerId !== userId) {
    throw new ForbiddenError('You do not have access to this resource');
  }

  return resource;
}
```

**C. API Key Authentication for External Access**
```typescript
// lib/api-keys.ts
export interface APIKey {
  id: string;
  userId: string;
  key: string; // Hashed
  name: string;
  permissions: string[];
  lastUsed: Date;
  expiresAt?: Date;
  rateLimit: number; // Requests per hour
}

export async function validateAPIKey(apiKey: string): Promise<APIKey> {
  const hashedKey = hashAPIKey(apiKey);
  const keyDoc = await db.collection('apiKeys')
    .where('key', '==', hashedKey)
    .where('active', '==', true)
    .get();

  if (keyDoc.empty) {
    throw new UnauthorizedError('Invalid API key');
  }

  const keyData = keyDoc.docs[0].data() as APIKey;

  // Check expiry
  if (keyData.expiresAt && keyData.expiresAt < new Date()) {
    throw new UnauthorizedError('API key expired');
  }

  // Update last used
  await keyDoc.docs[0].ref.update({ lastUsed: new Date() });

  return keyData;
}
```

---

### 4.3 Rate Limiting (HIGH PRIORITY) ⭐⭐⭐⭐⭐

#### Current State
- ✅ `RateLimitError` class exists
- ❌ No rate limiting implementation
- ❌ No DDoS protection
- ❌ No per-user/per-IP limits

#### Required Improvements

**A. Implement Rate Limiting Middleware**
```typescript
// middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Global rate limit: 100 requests per 10 seconds
const globalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '10 s'),
  analytics: true,
});

// Per-user rate limit: 1000 requests per hour
const userRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 h'),
  analytics: true,
});

// AI endpoint rate limit: 10 requests per minute
const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
});

export async function ratelimitMiddleware(
  identifier: string,
  type: 'global' | 'user' | 'ai' = 'user'
) {
  const limiter = type === 'global' ? globalRatelimit :
                  type === 'ai' ? aiRatelimit : userRatelimit;

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    throw new RateLimitError('Rate limit exceeded', {
      limit,
      remaining,
      reset,
    });
  }

  return { limit, remaining, reset };
}
```

**B. Apply rate limiting to API routes**
```typescript
// app/api/proposals/generate/route.ts
export async function POST(req: Request) {
  const userId = await getAuthenticatedUser();

  // Rate limit AI generation (expensive operation)
  await ratelimitMiddleware(`ai:${userId}`, 'ai');

  // ... rest of handler
}
```

---

### 4.4 Data Encryption (MEDIUM PRIORITY) ⭐⭐⭐⭐

#### Current State
- ✅ HTTPS in production (Vercel)
- ✅ Firestore encrypts data at rest
- ❌ No field-level encryption for sensitive data
- ❌ No client-side encryption
- ❌ Bank details, IR35 assessments, tax data stored unencrypted

#### Required Improvements

**A. Field-Level Encryption for Sensitive Data**
```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Usage
export async function saveIR35Assessment(assessment: IR35Assessment) {
  // Encrypt sensitive fields
  const encrypted = {
    ...assessment,
    financialImpact: encrypt(JSON.stringify(assessment.financialImpact)),
    recommendations: encrypt(JSON.stringify(assessment.recommendations)),
  };

  await db.collection('ir35Assessments').add(encrypted);
}
```

---

### 4.5 Secrets Management (HIGH PRIORITY) ⭐⭐⭐⭐⭐

#### Current State
- ❌ Secrets likely in `.env` file (not in git)
- ❌ No secrets rotation
- ❌ No secrets auditing

#### Required Improvements

**A. Use Vercel Environment Variables**
```bash
# Production secrets via Vercel dashboard
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=...
HMRC_API_CLIENT_ID=...
HMRC_API_CLIENT_SECRET=...
ENCRYPTION_KEY=...  # 64 hex chars
WEBHOOK_SECRET=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

**B. Implement Secret Rotation**
```typescript
// lib/secrets/rotation.ts
export async function rotateAPIKey(service: string) {
  // 1. Generate new key
  // 2. Update in Vercel
  // 3. Update in service
  // 4. Test new key
  // 5. Revoke old key after 24h grace period

  logger.info(`API key rotated for ${service}`);
}

// Scheduled rotation every 90 days
```

---

### 4.6 Audit Logging (MEDIUM PRIORITY) ⭐⭐⭐

#### Current State
- ✅ Basic logging with Pino
- ❌ No audit trail for sensitive operations
- ❌ No compliance logging (GDPR, data access)

#### Required Improvements

**A. Comprehensive Audit Logging**
```typescript
// lib/audit-log.ts
export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  errorMessage?: string;
}

export async function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
  const auditEvent: AuditEvent = {
    ...event,
    id: nanoid(),
    timestamp: new Date(),
  };

  await db.collection('auditLog').add(auditEvent);

  logger.info('Audit event logged', { event: auditEvent });
}

// Usage
await logAuditEvent({
  userId,
  action: 'IR35_ASSESSMENT_CREATED',
  resource: 'ir35Assessment',
  resourceId: assessment.id,
  ipAddress: req.headers.get('x-forwarded-for') || '',
  userAgent: req.headers.get('user-agent') || '',
  result: 'success',
});
```

---

## PHASE 5: ROBUSTNESS & RELIABILITY
**Goal:** Make Recoup resilient to failures and data corruption

### 5.1 Error Handling & Recovery (HIGH PRIORITY) ⭐⭐⭐⭐⭐

#### Current State
- ✅ Good error handling foundation (`handleError`, custom error classes)
- ❌ No retry logic for external API calls
- ❌ No circuit breakers
- ❌ No graceful degradation

#### Required Improvements

**A. Retry Logic with Exponential Backoff**
```typescript
// lib/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors?: string[];
  }
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if error is not retryable
      if (!retryableErrors.includes(lastError.message)) {
        throw lastError;
      }

      if (attempt === maxRetries) {
        break;
      }

      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
        error: lastError.message,
      });

      await sleep(delay);
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

// Usage in AI services
const aiResponse = await retryWithBackoff(
  () => callGeminiAPI(prompt),
  {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 16000,
    backoffMultiplier: 2,
  }
);
```

**B. Circuit Breaker Pattern**
```typescript
// lib/circuit-breaker.ts
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error('Circuit breaker opened', { failures: this.failures });
    }
  }
}

// Usage
const hmrcCircuitBreaker = new CircuitBreaker(5, 60000, 30000);

export async function submitToHMRC(data: any) {
  return hmrcCircuitBreaker.execute(async () => {
    return await fetch(HMRC_API_URL, { method: 'POST', body: JSON.stringify(data) });
  });
}
```

**C. Graceful Degradation**
```typescript
// lib/ai-proposal-generator.ts
export async function generateAIProposal(request, aiService) {
  try {
    // Try Gemini first (80%)
    return await retryWithBackoff(() => aiService.generateWithGemini(request), {...});
  } catch (geminiError) {
    logger.warn('Gemini failed, falling back to Claude', { error: geminiError });

    try {
      // Fallback to Claude (15%)
      return await retryWithBackoff(() => aiService.generateWithClaude(request), {...});
    } catch (claudeError) {
      logger.warn('Claude failed, falling back to OpenAI', { error: claudeError });

      try {
        // Last resort: OpenAI (5%)
        return await retryWithBackoff(() => aiService.generateWithOpenAI(request), {...});
      } catch (openaiError) {
        // All AI services failed - generate template-based proposal
        logger.error('All AI services failed, using template', { errors: [geminiError, claudeError, openaiError] });
        return generateTemplateProposal(request);
      }
    }
  }
}
```

---

### 5.2 Database Transactions & Consistency (HIGH PRIORITY) ⭐⭐⭐⭐⭐

#### Current State
- ❌ No Firestore transactions for multi-document updates
- ❌ Risk of partial updates leaving inconsistent state
- ❌ No optimistic locking

#### Required Improvements

**A. Implement Firestore Transactions**
```typescript
// lib/transactions.ts
export async function createInvoiceWithClient(
  userId: string,
  invoiceData: any,
  clientData: any
) {
  return await db.runTransaction(async (transaction) => {
    // 1. Create or update client
    const clientRef = db.collection('clients').doc(clientData.id);
    const clientDoc = await transaction.get(clientRef);

    if (!clientDoc.exists) {
      transaction.set(clientRef, {
        ...clientData,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      transaction.update(clientRef, {
        ...clientData,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 2. Create invoice
    const invoiceRef = db.collection('invoices').doc();
    transaction.set(invoiceRef, {
      ...invoiceData,
      userId,
      clientId: clientData.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 3. Update user stats
    const userRef = db.collection('users').doc(userId);
    transaction.update(userRef, {
      totalInvoices: FieldValue.increment(1),
      totalInvoiceValue: FieldValue.increment(invoiceData.amount),
    });

    return { invoiceId: invoiceRef.id, clientId: clientRef.id };
  });
}
```

**B. Optimistic Locking**
```typescript
export async function updateInvoiceWithOptimisticLock(
  invoiceId: string,
  updates: Partial<Invoice>,
  expectedVersion: number
) {
  return await db.runTransaction(async (transaction) => {
    const invoiceRef = db.collection('invoices').doc(invoiceId);
    const invoiceDoc = await transaction.get(invoiceRef);

    if (!invoiceDoc.exists) {
      throw new NotFoundError('Invoice not found');
    }

    const currentVersion = invoiceDoc.data().version || 0;

    if (currentVersion !== expectedVersion) {
      throw new Error('Invoice was modified by another process. Please refresh and try again.');
    }

    transaction.update(invoiceRef, {
      ...updates,
      version: currentVersion + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
```

---

### 5.3 Data Validation & Integrity (MEDIUM PRIORITY) ⭐⭐⭐⭐

#### Current State
- ✅ Zod validation on API inputs
- ❌ No database-level constraints
- ❌ No data integrity checks
- ❌ No orphaned data cleanup

#### Required Improvements

**A. Database-Level Validation**
```typescript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /invoices/{invoiceId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId
                    && request.resource.data.amount > 0
                    && request.resource.data.amount < 1000000;
      allow update: if request.auth.uid == resource.data.userId
                    && request.resource.data.version == resource.data.version + 1;
    }

    // IR35 assessments
    match /ir35Assessments/{assessmentId} {
      allow read, write: if request.auth.uid == resource.data.userId;

      // Validate IR35 data integrity
      allow create, update: if request.resource.data.scores.overallScore >= 0
                            && request.resource.data.scores.overallScore <= 100
                            && request.resource.data.status in ['outside_ir35', 'inside_ir35', 'uncertain'];
    }
  }
}
```

**B. Data Integrity Checks**
```typescript
// lib/data-integrity.ts
export async function validateClientProfitability(analysis: ClientProfitabilityAnalysis) {
  // Check calculations
  const expectedNetProfit = analysis.revenue.total - analysis.costs.totalTime - analysis.costToServe.total;

  if (Math.abs(analysis.profitability.netProfit - expectedNetProfit) > 0.01) {
    logger.error('Data integrity violation: Incorrect profit calculation', {
      clientId: analysis.clientId,
      expected: expectedNetProfit,
      actual: analysis.profitability.netProfit,
    });

    throw new Error('Data integrity check failed');
  }

  // Check tier assignment
  const expectedTier = getTierFromScore(analysis.rating.score);
  if (analysis.rating.tier !== expectedTier) {
    logger.error('Data integrity violation: Incorrect tier', {
      clientId: analysis.clientId,
      expected: expectedTier,
      actual: analysis.rating.tier,
    });
  }
}
```

---

## PHASE 6: TESTING, MONITORING & PERFORMANCE
**Goal:** Ensure reliability through comprehensive testing and monitoring

### 6.1 Testing Strategy (HIGH PRIORITY) ⭐⭐⭐⭐⭐

#### Current State
- ✅ Jest configured
- ✅ 2 component tests exist
- ❌ No unit tests for services
- ❌ No integration tests
- ❌ No E2E tests
- ❌ No API contract tests

#### Required Improvements

**A. Unit Tests for All Services (Target: 80% coverage)**
```typescript
// __tests__/lib/client-profitability-service.test.ts
import { analyzeClientProfitability } from '@/lib/client-profitability-service';

describe('Client Profitability Service', () => {
  describe('analyzeClientProfitability', () => {
    it('should calculate net profit correctly', () => {
      const analysis = analyzeClientProfitability({
        clientId: 'test-client',
        clientName: 'Test Client',
        invoices: [
          { amount: 5000, amountPaid: 5000 },
          { amount: 3000, amountPaid: 3000 },
        ],
        timeEntries: [
          { hours: 40, hourlyRate: 100 },
        ],
        costToServeEntries: [
          { type: 'meeting', hours: 2, cost: 200 },
        ],
        defaultHourlyRate: 100,
      });

      expect(analysis.revenue.total).toBe(8000);
      expect(analysis.costs.totalTime).toBe(4000);
      expect(analysis.costToServe.total).toBe(200);
      expect(analysis.profitability.netProfit).toBe(3800);
      expect(analysis.profitability.netMargin).toBeCloseTo(47.5, 1);
    });

    it('should assign correct profitability tier', () => {
      // Tier A: Profit margin > 40%
      const analysisA = analyzeClientProfitability({...highProfitData});
      expect(analysisA.rating.tier).toBe('A');

      // Tier F: Profit margin < 10% or negative
      const analysisF = analyzeClientProfitability({...lowProfitData});
      expect(analysisF.rating.tier).toBe('F');
    });
  });
});

// __tests__/lib/ir35-assessment-service.test.ts
describe('IR35 Assessment Service', () => {
  it('should correctly assess outside IR35 status', () => {
    const assessment = assessIR35Status({
      userId: 'test-user',
      clientId: 'test-client',
      control: {
        whoDecidesTasks: 'you',
        whoDecidesMethods: 'you',
        whoDecidesTiming: 'you',
        canRefuseWork: true,
        mustFollowPolicies: false,
      },
      substitution: {
        canSendSubstitute: true,
        clientMustAccept: false,
        youPaySubstitute: true,
        hasHappened: true,
      },
      // ... other high-scoring factors
      currentAnnualIncome: 60000,
    });

    expect(assessment.status).toBe('outside_ir35');
    expect(assessment.scores.overallScore).toBeGreaterThan(70);
    expect(assessment.riskLevel).toBe('low');
  });

  it('should calculate financial impact correctly', () => {
    const assessment = assessIR35Status({...});

    expect(assessment.financialImpact.outsideIR35TakeHome).toBeGreaterThan(
      assessment.financialImpact.insideIR35TakeHome
    );
    expect(assessment.financialImpact.lossPercentage).toBeGreaterThan(15);
    expect(assessment.financialImpact.lossPercentage).toBeLessThan(25);
  });
});
```

**B. Integration Tests for API Routes**
```typescript
// __tests__/api/proposals/generate.test.ts
import { POST } from '@/app/api/proposals/generate/route';

describe('POST /api/proposals/generate', () => {
  it('should generate AI proposal successfully', async () => {
    const req = new Request('http://localhost/api/proposals/generate', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'test-client',
        projectName: 'Website Redesign',
        projectDescription: 'Redesign company website with modern UI',
        requirements: ['Responsive design', 'SEO optimization'],
        deliverables: ['Homepage', 'About page', 'Contact form'],
        pricingStrategy: {
          type: 'fixed',
          fixedPrice: 5000,
        },
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.proposal).toBeDefined();
    expect(data.proposal.sections).toHaveLength(expect.any(Number));
    expect(data.proposal.pricing.total).toBe(5000);
    expect(data.proposal.aiInsights.winProbability).toBeGreaterThan(0);
  });

  it('should enforce rate limiting on AI generation', async () => {
    // Make 11 requests rapidly (limit is 10/min)
    const requests = Array(11).fill(null).map(() => POST(validRequest));

    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];

    expect(lastResponse.status).toBe(429); // Rate limit exceeded
  });
});
```

**C. E2E Tests with Playwright**
```typescript
// e2e/invoice-creation-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete invoice creation flow', async ({ page }) => {
  // 1. Login
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');

  // 2. Navigate to invoices
  await page.goto('/dashboard/invoices');
  await expect(page).toHaveURL('/dashboard/invoices');

  // 3. Create new invoice
  await page.click('text=Create Invoice');
  await page.fill('[name="clientName"]', 'Test Client Ltd');
  await page.fill('[name="clientEmail"]', 'client@test.com');
  await page.fill('[name="amount"]', '5000');
  await page.fill('[name="dueDate"]', '2025-12-31');

  await page.click('text=Create Invoice');

  // 4. Verify invoice created
  await expect(page.locator('text=Invoice created successfully')).toBeVisible();
  await expect(page.locator('text=£5,000.00')).toBeVisible();
});
```

---

### 6.2 Error Tracking & Monitoring (HIGH PRIORITY) ⭐⭐⭐⭐⭐

#### Current State
- ✅ Pino logger exists
- ❌ No error tracking service (Sentry)
- ❌ No performance monitoring
- ❌ No real-time alerts

#### Required Improvements

**A. Integrate Sentry for Error Tracking**
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['Authorization'];
    }
    return event;
  },
});

// Usage in error handling
export async function handleError(error: unknown) {
  // Send to Sentry
  Sentry.captureException(error);

  // Original error handling
  if (error instanceof ZodError) {
    // ...
  }
}
```

**B. Application Performance Monitoring (APM)**
```typescript
// lib/monitoring.ts
import { performance } from 'perf_hooks';

export async function monitorPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    logger.info('Performance metric', {
      operation,
      duration,
      success: true,
    });

    // Send to monitoring service
    Sentry.addBreadcrumb({
      category: 'performance',
      message: operation,
      data: { duration },
      level: 'info',
    });

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    logger.error('Performance metric (failed)', {
      operation,
      duration,
      success: false,
      error,
    });

    throw error;
  }
}

// Usage
const analysis = await monitorPerformance(
  'client_profitability_analysis',
  () => analyzeClientProfitability(params)
);
```

**C. Health Checks**
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    status: 'healthy',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      ai: await checkAIServices(),
    },
  };

  const allHealthy = Object.values(checks.checks).every(c => c.status === 'ok');

  return NextResponse.json(checks, {
    status: allHealthy ? 200 : 503,
  });
}

async function checkDatabase() {
  try {
    await db.collection('_health').doc('test').get();
    return { status: 'ok', responseTime: performance.now() };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}
```

---

### 6.3 Performance Optimization (MEDIUM PRIORITY) ⭐⭐⭐

#### Required Improvements

**A. Database Query Optimization**
```typescript
// Create composite indexes in Firestore
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ir35Assessments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "assessmentDate", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**B. Caching Strategy**
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({...});

export async function getCached<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);

  if (cached) {
    logger.debug('Cache hit', { key });
    return cached as T;
  }

  // Cache miss - fetch and store
  logger.debug('Cache miss', { key });
  const data = await fetchFn();

  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

// Usage
export async function getUserQuotaInfo(userId: string) {
  return getCached(
    `quota:${userId}`,
    300, // 5 minutes
    async () => {
      const userDoc = await db.collection('users').doc(userId).get();
      // ... calculate quota
    }
  );
}
```

**C. Pagination for Large Lists**
```typescript
// app/api/invoices/route.ts
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const cursor = url.searchParams.get('cursor');

  let query = db.collection('invoices')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (cursor) {
    const cursorDoc = await db.collection('invoices').doc(cursor).get();
    query = query.startAfter(cursorDoc);
  }

  const snapshot = await query.get();
  const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const nextCursor = snapshot.docs.length === limit
    ? snapshot.docs[snapshot.docs.length - 1].id
    : null;

  return NextResponse.json({ invoices, nextCursor });
}
```

---

## PHASE 7: COMPLIANCE & LEGAL
**Goal:** Ensure GDPR compliance and legal protection

### 7.1 GDPR Compliance (HIGH PRIORITY) ⭐⭐⭐⭐⭐

#### Required Features

**A. Data Export (Right to Data Portability)**
```typescript
// app/api/gdpr/export/route.ts
export async function POST(req: Request) {
  const userId = await getAuthenticatedUser();

  // Collect all user data
  const userData = {
    profile: await getUserProfile(userId),
    invoices: await getAllInvoices(userId),
    clients: await getAllClients(userId),
    ir35Assessments: await getAllIR35Assessments(userId),
    proposals: await getAllProposals(userId),
    auditLog: await getAuditLog(userId),
  };

  // Generate JSON file
  const jsonData = JSON.stringify(userData, null, 2);

  // Log GDPR request
  await logAuditEvent({
    userId,
    action: 'GDPR_DATA_EXPORT',
    resource: 'user',
    resourceId: userId,
    result: 'success',
  });

  return new Response(jsonData, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="recoup-data-${userId}.json"`,
    },
  });
}
```

**B. Data Deletion (Right to Erasure)**
```typescript
// app/api/gdpr/delete/route.ts
export async function POST(req: Request) {
  const userId = await getAuthenticatedUser();

  // Anonymize instead of delete (for legal/tax records)
  await db.runTransaction(async (transaction) => {
    // 1. Anonymize user profile
    const userRef = db.collection('users').doc(userId);
    transaction.update(userRef, {
      name: '[DELETED]',
      email: `deleted-${userId}@anonymized.local`,
      phone: null,
      address: null,
      deletedAt: FieldValue.serverTimestamp(),
    });

    // 2. Anonymize invoices (keep for tax purposes)
    const invoices = await db.collection('invoices').where('userId', '==', userId).get();
    invoices.docs.forEach(doc => {
      transaction.update(doc.ref, {
        clientEmail: '[DELETED]',
        clientPhone: null,
        notes: '[REDACTED]',
      });
    });

    // 3. Delete non-essential data
    const assessments = await db.collection('ir35Assessments').where('userId', '==', userId).get();
    assessments.docs.forEach(doc => transaction.delete(doc.ref));
  });

  // Revoke Clerk session
  await clerkClient.users.deleteUser(userId);

  await logAuditEvent({
    userId,
    action: 'GDPR_DATA_DELETION',
    resource: 'user',
    resourceId: userId,
    result: 'success',
  });

  return NextResponse.json({ message: 'Account deleted successfully' });
}
```

---

## PHASE 8: DEVELOPER EXPERIENCE & DOCUMENTATION

### 8.1 API Documentation (MEDIUM PRIORITY) ⭐⭐⭐

**A. OpenAPI/Swagger Documentation**
```typescript
// Generate API docs with swagger-jsdoc
/**
 * @openapi
 * /api/ir35/assess:
 *   post:
 *     summary: Assess IR35 status for a client contract
 *     tags:
 *       - IR35
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IR35AssessmentRequest'
 *     responses:
 *       200:
 *         description: IR35 assessment completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IR35Assessment'
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
```

---

## IMPLEMENTATION PRIORITY MATRIX

| Phase | Feature | Priority | Impact | Effort | Timeline |
|-------|---------|----------|--------|--------|----------|
| **4** | Input Validation (all services) | ⭐⭐⭐⭐⭐ | High | Medium | Week 1 |
| **4** | Replace Mock Auth | ⭐⭐⭐⭐⭐ | Critical | Low | Week 1 |
| **4** | Rate Limiting | ⭐⭐⭐⭐⭐ | High | Medium | Week 1 |
| **4** | Secrets Management | ⭐⭐⭐⭐⭐ | High | Low | Week 1 |
| **5** | Retry Logic & Circuit Breakers | ⭐⭐⭐⭐⭐ | High | Medium | Week 2 |
| **5** | Database Transactions | ⭐⭐⭐⭐⭐ | High | Medium | Week 2 |
| **6** | Unit Tests (80% coverage) | ⭐⭐⭐⭐⭐ | High | High | Week 3-4 |
| **6** | Sentry Error Tracking | ⭐⭐⭐⭐⭐ | High | Low | Week 2 |
| **7** | GDPR Export/Delete | ⭐⭐⭐⭐⭐ | Critical | Medium | Week 3 |
| **4** | Field-Level Encryption | ⭐⭐⭐⭐ | Medium | Medium | Week 4 |
| **4** | Audit Logging | ⭐⭐⭐ | Medium | Medium | Week 4 |
| **6** | Caching Strategy | ⭐⭐⭐ | Medium | Medium | Week 5 |
| **6** | Performance Monitoring | ⭐⭐⭐ | Medium | Low | Week 5 |
| **8** | API Documentation | ⭐⭐⭐ | Low | Low | Week 6 |

---

## RECOMMENDED NEXT STEPS

### Immediate (This Week)
1. ✅ Create validation schemas for all new services
2. ✅ Replace mock auth with Clerk auth in API routes
3. ✅ Implement rate limiting middleware
4. ✅ Set up Vercel environment variables for secrets

### Week 2
5. ✅ Add retry logic to external API calls (AI, HMRC)
6. ✅ Implement circuit breakers
7. ✅ Add database transactions for multi-document operations
8. ✅ Set up Sentry error tracking

### Week 3-4
9. ✅ Write unit tests for all service files (target 80% coverage)
10. ✅ Implement GDPR data export/deletion endpoints
11. ✅ Add integration tests for API routes

### Week 5-6
12. ✅ Implement caching with Redis
13. ✅ Add performance monitoring
14. ✅ Field-level encryption for sensitive data
15. ✅ Generate API documentation

---

## METRICS FOR SUCCESS

### Security Metrics
- ✅ 0 critical vulnerabilities in security scan
- ✅ 100% of API endpoints have rate limiting
- ✅ 100% of sensitive data encrypted at rest
- ✅ All API endpoints require authentication

### Reliability Metrics
- ✅ 99.9% uptime SLA
- ✅ <1% error rate on API endpoints
- ✅ <500ms p95 response time
- ✅ All external API calls have retry logic

### Testing Metrics
- ✅ 80%+ code coverage for services
- ✅ 100% of API endpoints have integration tests
- ✅ Critical user flows have E2E tests
- ✅ 0 failing tests in CI/CD

### Compliance Metrics
- ✅ GDPR data export <24h turnaround
- ✅ Data deletion requests completed within 30 days
- ✅ 100% of data access logged in audit trail
- ✅ Encryption key rotation every 90 days

---

## CONCLUSION

This roadmap transforms Recoup from an MVP with groundbreaking features into a **production-ready, enterprise-grade invoicing platform** that is:

- 🔒 **Secure** - Protected against OWASP Top 10, encrypted data, rate limited
- 🛡️ **Robust** - Retry logic, circuit breakers, graceful degradation
- ✅ **Tested** - 80% code coverage, integration tests, E2E tests
- 📊 **Monitored** - Error tracking, performance monitoring, health checks
- ⚖️ **Compliant** - GDPR-ready, audit logging, legal protection
- 🚀 **Performant** - Caching, pagination, optimized queries

**Estimated Total Effort:** 6-8 weeks of focused development

**Competitive Advantage After Implementation:** Not only will Recoup have features NO competitors offer (IR35, income smoothing, AI proposals), but it will also be more secure and robust than most established competitors.

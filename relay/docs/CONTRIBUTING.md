# Contributing to Recoup

Thank you for your interest in contributing to Recoup! This guide will help you understand our development process, coding standards, and best practices.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Git Workflow](#git-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and professional in all interactions.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or insulting/derogatory comments
- Public or private harassment
- Publishing others' private information without permission

---

## Getting Started

### Before You Begin

1. **Read the documentation:**
   - [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Set up your development environment
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand the system architecture
   - [DATABASE.md](./DATABASE.md) - Learn the database schema

2. **Set up your development environment:**
   ```bash
   git clone https://github.com/alexv879/Recoup.git
   cd Recoup/relay
   npm install
   cp .env.example .env.local
   # Configure environment variables
   npm run dev
   ```

3. **Find an issue to work on:**
   - Check the [Issues](https://github.com/alexv879/Recoup/issues) page
   - Look for issues labeled `good-first-issue` or `help-wanted`
   - Comment on the issue to indicate you're working on it

---

## Development Workflow

### 1. Create a Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks

**Examples:**
- `feature/ai-voice-calls`
- `fix/invoice-validation-error`
- `refactor/payment-service`
- `docs/api-documentation`

### 2. Make Your Changes

- Write clean, readable code
- Follow our [Coding Standards](#coding-standards)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run type-check

# Test locally
npm run dev
```

### 4. Commit Your Changes

See [Git Workflow](#git-workflow) for commit message guidelines.

---

## Coding Standards

### TypeScript

#### Use Strict Type Checking

```typescript
// ✅ Good - Explicit types
interface Invoice {
  id: string;
  amount: number;
  dueDate: Date;
}

function createInvoice(data: Invoice): Promise<string> {
  // ...
}

// ❌ Bad - Using 'any'
function createInvoice(data: any): any {
  // ...
}
```

#### Prefer Interfaces Over Types for Objects

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
}

// ❌ Avoid (unless necessary for unions/intersections)
type User = {
  id: string;
  name: string;
};
```

#### Use Enums for Fixed Sets of Values

```typescript
// ✅ Good
enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

// ❌ Bad
const status = 'draft'; // No type safety
```

### React & Next.js

#### Use Server Components by Default

```typescript
// ✅ Good - Server component (default in app/)
export default async function DashboardPage() {
  const data = await fetchData();
  return <Dashboard data={data} />;
}

// Use client components only when needed
'use client';
export default function InteractiveChart({ data }) {
  const [filter, setFilter] = useState('all');
  // ...
}
```

#### Component Naming

```typescript
// ✅ Good - PascalCase for components
export function InvoiceList({ invoices }: Props) {}

// ❌ Bad
export function invoiceList({ invoices }: Props) {}
```

#### Props Interface

```typescript
// ✅ Good - Define props interface
interface InvoiceCardProps {
  invoice: Invoice;
  onUpdate: (id: string) => void;
  className?: string;
}

export function InvoiceCard({ invoice, onUpdate, className }: InvoiceCardProps) {
  // ...
}
```

#### Use Custom Hooks for Reusable Logic

```typescript
// ✅ Good
function useInvoices(userId: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices(userId).then(setInvoices).finally(() => setLoading(false));
  }, [userId]);

  return { invoices, loading };
}

// Usage
function InvoiceList() {
  const { invoices, loading } = useInvoices(userId);
  // ...
}
```

### API Routes

#### Use Consistent Error Handling

```typescript
// ✅ Good
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = schema.parse(body);

    const result = await performAction(validated);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('API error:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Validate All Inputs with Zod

```typescript
import { z } from 'zod';

const createInvoiceSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
});

export async function POST(req: Request) {
  const body = await req.json();

  // Throws ZodError if validation fails
  const data = createInvoiceSchema.parse(body);

  // Now 'data' is type-safe and validated
}
```

#### Rate Limit Sensitive Endpoints

```typescript
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const { userId } = await auth();

  // Apply rate limiting
  const { success } = await rateLimit.limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Handle request...
}
```

### Database Operations

#### Always Scope Queries by User

```typescript
// ✅ Good
const invoices = await db
  .collection('invoices')
  .where('userId', '==', userId)
  .where('status', '==', 'overdue')
  .get();

// ❌ Bad - Missing user filter (security risk!)
const invoices = await db
  .collection('invoices')
  .where('status', '==', 'overdue')
  .get();
```

#### Use Transactions for Related Updates

```typescript
// ✅ Good
await db.runTransaction(async (transaction) => {
  transaction.update(invoiceRef, { status: 'paid' });
  transaction.update(clientRef, {
    totalPaid: FieldValue.increment(amount),
  });
  transaction.update(userStatsRef, {
    totalCollected: FieldValue.increment(amount),
  });
});

// ❌ Bad - Race conditions possible
await invoiceRef.update({ status: 'paid' });
await clientRef.update({ totalPaid: client.totalPaid + amount });
await userStatsRef.update({ totalCollected: stats.totalCollected + amount });
```

#### Handle Firestore Timestamps Correctly

```typescript
import { Timestamp } from 'firebase-admin/firestore';

// ✅ Good
const invoice = {
  amount: 1500,
  createdAt: Timestamp.now(),
  dueDate: Timestamp.fromDate(new Date('2025-12-01')),
};

// Convert to Date when needed
const dueDate = invoice.dueDate.toDate();
```

### Styling with Tailwind CSS

#### Use Tailwind Classes

```tsx
// ✅ Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-semibold">Invoice #001</h2>
  <span className="text-green-600">Paid</span>
</div>

// ❌ Avoid inline styles (use Tailwind instead)
<div style={{ padding: '16px', backgroundColor: 'white' }}>
```

#### Extract Repeated Classes to Components

```tsx
// ✅ Good
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

// ❌ Bad - Repeating classes everywhere
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">...</div>
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">...</div>
```

#### Use Tailwind v4 @import Syntax

```css
/* app/globals.css */
@import "tailwindcss";

/* Custom utilities */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

### Error Handling

#### Use Try-Catch for Async Operations

```typescript
// ✅ Good
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  Sentry.captureException(error);
  throw new Error('Operation failed');
}
```

#### Log Errors with Context

```typescript
// ✅ Good
console.error('Failed to create invoice', {
  userId,
  amount,
  error: error.message,
});

// ❌ Bad
console.error(error);
```

### Security Best Practices

#### Never Trust Client Input

```typescript
// ✅ Good
const { userId } = await auth(); // Server-side auth
const invoice = await getInvoice(invoiceId);

if (invoice.userId !== userId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ❌ Bad - Trusting client-provided userId
const { userId } = await req.json();
```

#### Encrypt Sensitive Data

```typescript
import { encrypt, decrypt } from '@/lib/encryption';

// ✅ Good
const encryptedBankDetails = encrypt(JSON.stringify(bankDetails));
await userRef.update({ bankDetails: encryptedBankDetails });

// ❌ Bad - Storing plaintext
await userRef.update({ bankDetails: JSON.stringify(bankDetails) });
```

#### Sanitize User Input

```typescript
import DOMPurify from 'isomorphic-dompurify';

// ✅ Good
const sanitizedNotes = DOMPurify.sanitize(userInput);

// ❌ Bad - XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

---

## Git Workflow

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

#### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Maintenance tasks, dependency updates

#### Examples

```bash
# Feature
feat(invoices): add voice-to-invoice transcription

# Bug fix
fix(collections): resolve SMS sending timeout issue

# Documentation
docs(api): add OpenAPI specification

# Refactor
refactor(payment): extract payment verification logic to service

# Breaking change
feat(auth): migrate to Clerk v6

BREAKING CHANGE: Auth provider changed from Auth0 to Clerk
```

### Commit Best Practices

1. **Make atomic commits** - One logical change per commit
2. **Write descriptive messages** - Explain WHY, not just WHAT
3. **Reference issues** - Include `Fixes #123` or `Closes #456`
4. **Keep commits small** - Easier to review and revert if needed

---

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateLateFee } from '@/lib/calculations';

describe('calculateLateFee', () => {
  it('should calculate late fee for overdue invoices', () => {
    const invoice = {
      amount: 1000,
      dueDate: new Date('2025-01-01'),
      baseRate: 5.25,
    };

    const lateFee = calculateLateFee(invoice, new Date('2025-01-31'));

    expect(lateFee).toBeCloseTo(11.93, 2); // 30 days * (5.25% + 8%) / 365 * 1000
  });

  it('should return 0 for invoices not overdue', () => {
    const invoice = {
      amount: 1000,
      dueDate: new Date('2025-12-01'),
      baseRate: 5.25,
    };

    const lateFee = calculateLateFee(invoice, new Date('2025-01-01'));

    expect(lateFee).toBe(0);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { POST } from '@/app/api/invoices/route';

describe('POST /api/invoices', () => {
  it('should create invoice with valid data', async () => {
    const request = new Request('http://localhost:3000/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: 1500,
        dueDate: '2025-12-01',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data.amount).toBe(1500);
  });

  it('should reject invalid email', async () => {
    const request = new Request('http://localhost:3000/api/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientName: 'Test',
        clientEmail: 'invalid-email',
        amount: 1500,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

### Test Coverage Requirements

- **Minimum coverage:** 70%
- **Critical paths:** 90%+ (payments, collections, auth)
- **Run coverage:** `npm run test:coverage`

---

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass:**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

2. **Update documentation** if needed

3. **Add screenshots** for UI changes

4. **Test locally** with production-like data

### PR Title Format

Follow the same format as commit messages:

```
feat(invoices): add bulk invoice creation
fix(api): resolve rate limiting issue
docs: update contributing guidelines
```

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Fixes #123
Closes #456
```

### PR Size Guidelines

- **Small:** < 200 lines changed ✅
- **Medium:** 200-500 lines changed ⚠️
- **Large:** > 500 lines changed ❌ (split into smaller PRs)

---

## Code Review Guidelines

### For Reviewers

#### What to Check

1. **Correctness** - Does the code do what it's supposed to?
2. **Security** - Are there any security vulnerabilities?
3. **Performance** - Are there any performance issues?
4. **Tests** - Are there adequate tests?
5. **Documentation** - Is the code well-documented?
6. **Style** - Does it follow our coding standards?

#### How to Review

- **Be constructive** - Suggest improvements, don't just criticize
- **Ask questions** - "Why did you choose this approach?"
- **Approve promptly** - Don't block PRs unnecessarily
- **Test locally** - For significant changes, pull and test

#### Review Comments

```markdown
# ✅ Good review comments
"Consider extracting this logic into a separate function for reusability"
"This query could benefit from an index on the `userId` field"
"Nice use of TypeScript here! 👍"

# ❌ Poor review comments
"This is wrong"
"Bad code"
"Why did you do it this way?"
```

### For Authors

- **Respond to all comments** - Even if just to acknowledge
- **Don't take it personally** - Reviews are about the code, not you
- **Ask for clarification** - If a comment is unclear
- **Update the PR** - Address feedback promptly
- **Mark conversations as resolved** - When addressed

---

## Style Guide

### File Organization

```
app/
├── api/                  # API routes
│   └── invoices/
│       └── route.ts
├── dashboard/            # Dashboard pages
│   └── page.tsx
├── layout.tsx            # Root layout
└── globals.css           # Global styles

components/
├── Dashboard/            # Feature-specific components
│   ├── InvoiceList.tsx
│   └── InvoiceCard.tsx
└── UI/                   # Reusable UI components
    ├── Button.tsx
    └── Input.tsx

lib/
├── firebase-admin.ts     # Firebase setup
├── auth.ts               # Auth helpers
└── utils.ts              # Utility functions

types/
├── invoice.ts            # Invoice types
└── user.ts               # User types
```

### Import Order

```typescript
// 1. React & Next.js
import { useState } from 'react';
import { NextResponse } from 'next/server';

// 2. External libraries
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

// 3. Internal libraries
import { db } from '@/lib/firebase-admin';
import { auth } from '@clerk/nextjs/server';

// 4. Components
import { InvoiceCard } from '@/components/Dashboard/InvoiceCard';
import { Button } from '@/components/UI/Button';

// 5. Types
import type { Invoice } from '@/types/invoice';

// 6. Utilities
import { formatCurrency } from '@/lib/utils';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `InvoiceList` |
| Functions | camelCase | `calculateTotal` |
| Variables | camelCase | `userId` |
| Constants | UPPER_SNAKE_CASE | `MAX_INVOICES` |
| Types/Interfaces | PascalCase | `Invoice` |
| Files (components) | PascalCase.tsx | `InvoiceCard.tsx` |
| Files (utilities) | kebab-case.ts | `date-utils.ts` |

---

## Documentation Standards

### JSDoc Comments

```typescript
/**
 * Creates a new invoice and generates a Stripe payment link
 *
 * @param userId - The ID of the user creating the invoice
 * @param data - Invoice data including client info and amount
 * @returns The created invoice with payment link
 * @throws {Error} If invoice creation fails
 *
 * @example
 * ```typescript
 * const invoice = await createInvoice('user_123', {
 *   clientName: 'John Smith',
 *   amount: 1500,
 *   dueDate: new Date('2025-12-01'),
 * });
 * ```
 */
export async function createInvoice(
  userId: string,
  data: CreateInvoiceData
): Promise<Invoice> {
  // Implementation...
}
```

### README Files

Every major feature should have a README explaining:
- What it does
- How to use it
- Configuration options
- Examples

---

## Questions?

- **General questions:** Open a [Discussion](https://github.com/alexv879/Recoup/discussions)
- **Bug reports:** Open an [Issue](https://github.com/alexv879/Recoup/issues)
- **Security issues:** Email security@relaysoftware.co.uk (do not open public issues)

---

Thank you for contributing to Recoup! 🎉

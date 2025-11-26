# RECOUP Security Architecture

## Overview

RECOUP implements **defense-in-depth** security with multiple layers of protection:

1. **Encryption at Rest** - AES-256-GCM for all sensitive data
2. **Webhook Security** - Signature validation for all incoming webhooks
3. **Input Validation** - Comprehensive sanitization to prevent injection attacks
4. **Authentication** - Clerk-based auth with role-based access control
5. **Multi-Tenancy Isolation** - Cryptographic separation of customer data
6. **Rate Limiting** - Protection against brute force and DoS attacks

## Table of Contents

- [Encryption](#encryption)
- [Webhook Security](#webhook-security)
- [Input Validation](#input-validation)
- [Authentication & Authorization](#authentication--authorization)
- [Secure Storage](#secure-storage)
- [API Security](#api-security)
- [Compliance](#compliance)
- [Security Checklist](#security-checklist)

## Encryption

### Overview

All sensitive data is encrypted using **AES-256-GCM** (Authenticated Encryption):
- **Algorithm**: AES-256-GCM
- **Key Derivation**: HKDF-SHA256
- **Per-User Keys**: Each userId gets unique encryption key
- **Authenticated**: Prevents tampering (AEAD)

### What Gets Encrypted

✅ **Personal Identifiable Information (PII)**
- Full names
- Email addresses
- Phone numbers
- Physical addresses
- Tax IDs

✅ **Payment Information**
- Card numbers (if stored)
- Bank account numbers
- Sort codes
- IBANs

✅ **Communication Content**
- Email message bodies
- SMS message content
- WhatsApp messages
- Voice call recording URLs

✅ **API Keys & Secrets**
- Third-party API keys
- OAuth access tokens
- OAuth refresh tokens
- Webhook secrets

### Usage

```typescript
import { secureInvoiceStorage, secureMessageStorage } from '@/lib/secure-storage';

// Store encrypted invoice
await secureInvoiceStorage.createInvoice(userId, invoiceData);

// Store encrypted message
await secureMessageStorage.storeMessage(userId, {
    invoiceId: 'inv_123',
    attemptType: 'sms_reminder',
    smsContent: 'Your invoice is overdue...',
    recipientPhone: '+447123456789',
    result: 'sent',
});
```

See [ENCRYPTION.md](./ENCRYPTION.md) for full documentation.

## Webhook Security

### Overview

All incoming webhooks MUST be validated to prevent:
- **Replay attacks** - Old webhooks being resent
- **Man-in-the-middle attacks** - Tampered payloads
- **Unauthorized access** - Fake webhooks from attackers

### Supported Providers

#### 1. Stripe Webhooks

```typescript
import { validateStripeSignature } from '@/lib/webhook-security';

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    const isValid = validateStripeSignature(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process webhook...
}
```

#### 2. Clerk Webhooks (SVIX)

```typescript
import { validateClerkSignature } from '@/lib/webhook-security';

export async function POST(req: NextRequest) {
    const rawBody = await req.text();

    const isValid = validateClerkSignature(rawBody, {
        'svix-id': req.headers.get('svix-id')!,
        'svix-timestamp': req.headers.get('svix-timestamp')!,
        'svix-signature': req.headers.get('svix-signature')!,
    }, process.env.CLERK_WEBHOOK_SECRET!);

    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process webhook...
}
```

#### 3. Twilio Webhooks

```typescript
import { validateTwilioSignature } from '@/lib/webhook-security';

export async function POST(req: NextRequest) {
    const fullUrl = req.url;
    const formData = await req.formData();
    const params = Object.fromEntries(formData);
    const signature = req.headers.get('x-twilio-signature')!;

    const isValid = validateTwilioSignature(
        fullUrl,
        params,
        signature,
        process.env.TWILIO_AUTH_TOKEN!
    );

    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Process webhook...
}
```

### Replay Attack Prevention

All webhook validators check timestamp freshness (5-minute window):

```typescript
import { isWebhookTimestampValid } from '@/lib/webhook-security';

const timestamp = parseInt(req.headers.get('x-timestamp')!, 10);
if (!isWebhookTimestampValid(timestamp, 300)) {
    return NextResponse.json({ error: 'Webhook too old' }, { status: 400 });
}
```

## Input Validation

### Overview

All user input MUST be validated and sanitized to prevent:
- **SQL/NoSQL Injection** - Malicious database queries
- **XSS (Cross-Site Scripting)** - Injected JavaScript
- **Path Traversal** - Accessing unauthorized files
- **Prototype Pollution** - Object property injection
- **SSRF (Server-Side Request Forgery)** - Internal network access

### String Sanitization

```typescript
import { sanitizeString, sanitizeHTML } from '@/lib/input-validation';

// Sanitize user input (prevent XSS)
const safeName = sanitizeString(userInput);

// Sanitize HTML (strip dangerous tags/attributes)
const safeHTML = sanitizeHTML(htmlInput);
```

### Email & Phone Validation

```typescript
import { isValidEmail, isValidUKPhone } from '@/lib/input-validation';

if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
}

if (!isValidUKPhone(phone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
}
```

### Firestore Query Protection

```typescript
import { sanitizeFirestoreValue } from '@/lib/input-validation';

// Prevent NoSQL injection
const safeValue = sanitizeFirestoreValue(userInput);

await db.collection('invoices')
    .where('clientName', '==', safeValue) // Safe
    .get();
```

### File Upload Validation

```typescript
import { isValidFileUpload } from '@/lib/input-validation';

const validation = isValidFileUpload({
    name: file.name,
    size: file.size,
    type: file.type,
});

if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
}
```

### URL Validation (SSRF Prevention)

```typescript
import { isValidURL } from '@/lib/input-validation';

// Blocks localhost, private IPs, metadata endpoints
if (!isValidURL(imageUrl)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
}
```

### Object Sanitization

```typescript
import { sanitizeObjectForDB } from '@/lib/input-validation';

// Prevent prototype pollution and NoSQL injection
const safeObject = sanitizeObjectForDB(userProvidedData);
await db.collection('users').doc(userId).update(safeObject);
```

## Authentication & Authorization

### Clerk Authentication

All API routes require Clerk authentication:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // User is authenticated...
}
```

### Role-Based Access Control

Admin-only endpoints:

```typescript
import { clerkClient } from '@clerk/nextjs/server';

const client = await clerkClient();
const user = await client.users.getUser(userId);
const isAdmin = user.publicMetadata?.role === 'admin';

if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Multi-Tenancy Isolation

Every query MUST be scoped by userId:

```typescript
// ✅ CORRECT - User can only access their own data
const invoices = await db.collection('invoices')
    .where('freelancerId', '==', userId)
    .get();

// ❌ WRONG - Security vulnerability!
const invoices = await db.collection('invoices').get();
```

## Secure Storage

### Overview

Use `secure-storage.ts` for all sensitive data operations:

```typescript
import {
    secureInvoiceStorage,
    secureMessageStorage,
    secureIntegrationStorage,
    secureUserStorage
} from '@/lib/secure-storage';
```

### Invoice Data

```typescript
// Store invoice with encrypted client data
await secureInvoiceStorage.createInvoice(userId, {
    invoiceId: 'inv_123',
    clientName: 'John Doe', // Will be encrypted
    clientEmail: 'john@example.com', // Will be encrypted
    clientPhone: '+447123456789', // Will be encrypted
    amount: 1000, // Not encrypted (needed for queries)
});

// Retrieve with decryption
const invoice = await secureInvoiceStorage.getInvoice(userId, 'inv_123');
// invoice.clientName is decrypted automatically
```

### Message Content

```typescript
// Store encrypted SMS/email content
await secureMessageStorage.storeMessage(userId, {
    invoiceId: 'inv_123',
    attemptType: 'sms_reminder',
    smsContent: 'Payment reminder message', // Encrypted
    recipientPhone: '+447123456789', // Encrypted
    result: 'sent',
});
```

### API Keys & Integrations

```typescript
// Store encrypted API keys
await secureIntegrationStorage.storeIntegration(userId, {
    provider: 'stripe',
    apiKey: 'sk_test_...', // Encrypted
    webhookSecret: 'whsec_...', // Encrypted
});

// Retrieve with decryption
const integration = await secureIntegrationStorage.getIntegration(userId, integrationId);
```

## API Security

### Rate Limiting

**TODO**: Implement rate limiting with Upstash Redis

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    const { success } = await ratelimit.limit(userId);

    if (!success) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Process request...
}
```

### CORS Configuration

Configure CORS in `next.config.js`:

```javascript
module.exports = {
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
                ],
            },
        ];
    },
};
```

### Content Security Policy

Add CSP headers for XSS protection:

```javascript
const securityHeaders = [
    {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.dev; ...",
    },
    {
        key: 'X-Frame-Options',
        value: 'DENY',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
];
```

## Compliance

### GDPR Compliance

✅ **Right to be forgotten**: Delete encrypted data
✅ **Data portability**: Decrypt and export user data
✅ **Data minimization**: Only encrypt necessary fields
✅ **Encryption at rest**: AES-256-GCM
✅ **Access controls**: User-scoped queries

### PCI-DSS Compliance

✅ **Requirement 3**: Encrypt stored cardholder data
✅ **Requirement 4**: Encrypt transmission (HTTPS)
✅ **Strong cryptography**: AES-256
⚠️ **Key management**: Use AWS KMS/Google Cloud KMS in production

### FCA Compliance (UK Debt Collection)

✅ **Call recording encryption**: Voice URLs encrypted
✅ **SMS opt-out**: Immediate processing required
✅ **Consent tracking**: Stored and validated
✅ **Audit trails**: All actions logged

## Security Checklist

### Pre-Deployment

- [ ] `ENCRYPTION_MASTER_KEY` set in environment
- [ ] All webhook secrets configured
- [ ] Clerk authentication enabled
- [ ] HTTPS enforced (no HTTP)
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] CSP headers set
- [ ] Firestore security rules deployed
- [ ] Error messages don't leak sensitive data
- [ ] Logging doesn't log PII/secrets

### Code Review

- [ ] All user input validated
- [ ] All database queries scoped by userId
- [ ] All sensitive data encrypted before storage
- [ ] All webhooks validate signatures
- [ ] No hardcoded secrets in code
- [ ] No SQL/NoSQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No path traversal vulnerabilities
- [ ] No SSRF vulnerabilities
- [ ] Error handling doesn't expose internals

### Ongoing Monitoring

- [ ] Monitor failed authentication attempts
- [ ] Monitor webhook signature failures
- [ ] Monitor encryption/decryption errors
- [ ] Set up Sentry for error tracking
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Penetration testing (annually)

## Vulnerability Reporting

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email: security@yourdomain.com
3. Include: Description, steps to reproduce, impact assessment
4. Allow 90 days for fix before public disclosure

## Security Updates

- **2025-01**: Implemented AES-256-GCM encryption
- **2025-01**: Added webhook signature validation
- **2025-01**: Implemented input validation framework
- **2025-01**: Added secure storage abstraction

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ICO Data Security Guidance](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/security/)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)

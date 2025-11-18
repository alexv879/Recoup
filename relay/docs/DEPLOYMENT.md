# Deployment Guide

Complete guide for deploying Recoup to production environments.

## Table of Contents
- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Vercel Deployment](#vercel-deployment)
- [Render.com Voice Server](#rendercom-voice-server)
- [Firebase Setup](#firebase-setup)
- [Environment Variables](#environment-variables)
- [Cron Jobs](#cron-jobs)
- [Domain Configuration](#domain-configuration)
- [Monitoring & Alerts](#monitoring--alerts)
- [Rollback Procedures](#rollback-procedures)
- [Production Best Practices](#production-best-practices)

---

## Overview

Recoup uses a **multi-service architecture** deployed across different platforms:

| Component | Platform | Purpose |
|-----------|----------|---------|
| Main Application | Vercel | Next.js app + API routes |
| Voice AI Server | Render.com | WebSocket server for AI calls |
| Database | Firebase | Firestore + Storage |
| Rate Limiting | Upstash | Redis for rate limits |
| Error Tracking | Sentry | Error monitoring |

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] TypeScript compiles: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in production build

### Security

- [ ] All environment variables configured
- [ ] Sensitive data encrypted (bank details)
- [ ] Firestore security rules deployed
- [ ] API rate limiting enabled
- [ ] Webhook signature verification enabled
- [ ] CORS configured correctly

### External Services

- [ ] Clerk production app configured
- [ ] Stripe live mode keys ready
- [ ] SendGrid verified sender
- [ ] Twilio phone number purchased
- [ ] Lob account verified
- [ ] OpenAI API key with sufficient credits
- [ ] Firebase production project created

### Performance

- [ ] Images optimized
- [ ] Bundle size acceptable (<300kb initial load)
- [ ] Database indexes created
- [ ] Caching strategy implemented

### Documentation

- [ ] README updated
- [ ] CHANGELOG updated
- [ ] API documentation current
- [ ] Environment variables documented

---

## Vercel Deployment

### 1. Create Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
cd relay
vercel link

# Choose or create project
# - Set up and deploy: Yes
# - Scope: Your account/team
# - Link to existing project: No
# - Project name: recoup-production
# - Directory: ./
# - Override settings: No
```

### 2. Configure Project Settings

#### Framework Preset
- Framework: **Next.js**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

#### Node.js Version
- Environment: **Node.js 18.x**

#### Environment Variables

Add all environment variables via Vercel dashboard:

```bash
# Or use CLI
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add FIREBASE_PROJECT_ID production
# ... add all required vars
```

**Important:** Never commit `.env` files to git!

### 3. Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or use Git integration (recommended)
git push origin main  # Auto-deploys main branch
```

### 4. Configure Vercel Settings

#### Build & Development Settings

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

#### Edge Functions (Optional)

For auth middleware:

```javascript
// middleware.ts
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
  runtime: 'edge',  // Run on edge for faster auth
};
```

### 5. Set Up Custom Domain

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add custom domain: `relaysoftware.co.uk`
3. Configure DNS:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21`
   - TTL: `300`

4. Add `www` subdomain:
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

5. Wait for SSL certificate provisioning (5-10 minutes)

### 6. Configure Redirects

In `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://relaysoftware.co.uk"
        }
      ]
    }
  ]
}
```

---

## Render.com Voice Server

The voice AI server requires WebSocket support, so it's deployed separately on Render.com.

### 1. Create Render Service

1. Go to https://dashboard.render.com
2. Click **New → Web Service**
3. Connect GitHub repository
4. Configure:
   - **Name:** recoup-voice-server
   - **Environment:** Node
   - **Region:** Oregon (US West)
   - **Branch:** main
   - **Root Directory:** render-server
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### 2. Configure Environment Variables

Add in Render dashboard:

```bash
OPENAI_API_KEY=sk-xxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
FIREBASE_PROJECT_ID=recoup-production
FIREBASE_CLIENT_EMAIL=xxxxx@recoup.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NODE_ENV=production
PORT=10000
```

### 3. Configure Health Check

- **Path:** `/health`
- **Timeout:** 30 seconds
- **Interval:** 60 seconds

### 4. Deploy

```bash
# Manual deploy via dashboard
# Or auto-deploy on push to main branch
```

### 5. Test WebSocket Connection

```bash
# Install wscat
npm install -g wscat

# Test connection
wscat -c wss://recoup-voice-server.onrender.com/voice-stream

# Should respond with connection confirmation
```

### 6. Update Twilio Webhook

Set Twilio webhook URL to:
```
https://recoup-voice-server.onrender.com/voice-stream
```

---

## Firebase Setup

### 1. Create Production Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Create project via console:
# - Go to https://console.firebase.google.com
# - Create new project: "recoup-production"
# - Enable Google Analytics: Yes
```

### 2. Enable Services

#### Firestore Database

1. Go to Build → Firestore Database
2. Click "Create database"
3. Start in **production mode**
4. Choose location: `europe-west2` (London)

#### Storage

1. Go to Build → Storage
2. Click "Get started"
3. Start in **production mode**
4. Use same location as Firestore

### 3. Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }

    // Invoices collection
    match /invoices/{invoiceId} {
      allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() &&
                               resource.data.userId == request.auth.uid;

      // Public invoice view
      allow get: if resource.data.status == 'sent';
    }

    // Payment claims (public creation for client claims)
    match /payment_claims/{claimId} {
      allow create: if true;  // Clients can claim without auth
      allow read, update: if isAuthenticated() &&
                            resource.data.userId == request.auth.uid;
    }

    // Other collections - user-scoped
    match /{collection}/{docId} {
      allow read, write: if isAuthenticated() &&
                           resource.data.userId == request.auth.uid;
    }
  }
}
```

### 4. Create Indexes

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

**firestore.indexes.json:**
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
      "collectionGroup": "collection_attempts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "invoiceId", "order": "ASCENDING" },
        { "fieldPath": "sentAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 5. Create Service Account

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Add to Vercel environment variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (wrap in quotes, keep `\n`)

### 6. Set Up Backup

```bash
# Create Cloud Storage bucket for backups
gsutil mb -l europe-west2 gs://recoup-backups

# Enable automatic exports
gcloud firestore operations list

# Or use Firebase Console:
# Firestore → Import/Export → Schedule automatic exports
```

---

## Environment Variables

### Production Environment Variables

**Required for Vercel:**

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=recoup-production
FIREBASE_PROJECT_ID=recoup-production
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@recoup-production.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Stripe (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_API_VERSION=2025-10-29

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@relaysoftware.co.uk
SENDGRID_FROM_NAME="Recoup"

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+44xxxxxxxxxx
TWILIO_VERIFY_SID=VAxxxxx

# Lob
LOB_API_KEY=live_xxxxx

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx
SENTRY_ORG=relaysoftware
SENTRY_PROJECT=recoup

# Encryption
ENCRYPTION_KEY=<64-char-hex-string>
CRON_SECRET=<64-char-hex-string>

# App URLs
NEXT_PUBLIC_APP_URL=https://relaysoftware.co.uk
VOICE_SERVER_URL=https://recoup-voice-server.onrender.com

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

### Managing Secrets

#### Using Vercel CLI

```bash
# Add production secret
vercel env add MY_SECRET production

# Pull environment variables locally
vercel env pull .env.production

# Never commit .env files!
```

#### Secret Rotation

**Quarterly rotation schedule:**
1. Generate new secret
2. Add to Vercel with different name (e.g., `NEW_ENCRYPTION_KEY`)
3. Deploy with dual support for old and new
4. Migrate data
5. Remove old secret
6. Redeploy

---

## Cron Jobs

### Configure Vercel Cron

**vercel.json:**
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
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/process-escalations",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/check-verification-deadlines",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Cron Authentication

```typescript
// app/api/cron/[job]/route.ts
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Run job...
}
```

### Monitoring Cron Jobs

1. Go to Vercel Dashboard → Project → Cron
2. View execution logs
3. Set up alerts for failures

---

## Domain Configuration

### DNS Settings

**For `relaysoftware.co.uk`:**

```
Type    Name    Value                       TTL
A       @       76.76.21.21                 300
CNAME   www     cname.vercel-dns.com        300
TXT     @       "v=spf1 include:sendgrid.net ~all"  300
```

### SSL Certificate

- **Automatic:** Vercel provisions Let's Encrypt certificate
- **Custom:** Upload custom SSL certificate in Vercel dashboard

### Email DNS Records (SendGrid)

```
Type    Name                          Value
CNAME   em123.relaysoftware.co.uk    u123456.wl.sendgrid.net
CNAME   s1._domainkey                s1.domainkey.u123456.wl.sendgrid.net
CNAME   s2._domainkey                s2.domainkey.u123456.wl.sendgrid.net
```

---

## Monitoring & Alerts

### Sentry Setup

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,  // 10% of transactions
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

### Uptime Monitoring

Use **UptimeRobot** or **Pingdom**:

- Monitor: `https://relaysoftware.co.uk`
- Interval: 5 minutes
- Alert on: 2 consecutive failures
- Notification: Email + Slack

### Performance Monitoring

**Vercel Analytics:**
- Enable in Vercel dashboard
- Monitor Core Web Vitals
- Set up alerts for degradation

**Custom Metrics:**
```typescript
import { track } from '@vercel/analytics';

track('invoice_created', {
  amount: 1500,
  currency: 'GBP',
});
```

### Alert Configuration

**Sentry Alerts:**
- Error rate > 5% in 5 minutes
- New error type detected
- Performance degradation (P95 > 3s)

**Vercel Alerts:**
- Build failures
- Deployment errors
- Function timeouts

---

## Rollback Procedures

### Quick Rollback (Vercel)

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or use dashboard:
# Vercel Dashboard → Project → Deployments → ... → Promote to Production
```

### Database Rollback

```bash
# Restore from backup
gcloud firestore import gs://recoup-backups/2025-01-15

# Or use Firebase Console:
# Firestore → Import/Export → Import data
```

### Code Rollback

```bash
# Revert commit
git revert <commit-hash>
git push origin main

# Or reset to previous commit
git reset --hard <commit-hash>
git push --force origin main  # Dangerous!
```

---

## Production Best Practices

### Security

1. **Enable 2FA** on all service accounts
2. **Rotate secrets** quarterly
3. **Audit access logs** monthly
4. **Keep dependencies updated** (Dependabot)
5. **Run security scans** (Snyk, npm audit)

### Performance

1. **Monitor Core Web Vitals**
2. **Optimize images** (Next.js Image component)
3. **Use CDN** (Vercel Edge Network)
4. **Implement caching** (Redis, SWR)
5. **Minimize bundle size** (<300kb gzipped)

### Reliability

1. **Set up error tracking** (Sentry)
2. **Configure uptime monitoring** (UptimeRobot)
3. **Test failure scenarios**
4. **Have rollback plan ready**
5. **Maintain incident runbook**

### Cost Optimization

1. **Monitor usage** (Vercel, Firebase, Stripe)
2. **Set budget alerts** (Google Cloud, Stripe)
3. **Optimize database queries** (reduce reads)
4. **Use caching** (reduce API calls)
5. **Review logs regularly** (identify inefficiencies)

### Compliance

1. **GDPR compliance** (data processing agreements)
2. **Regular backups** (30-day retention)
3. **Audit logs** (access tracking)
4. **Data encryption** (at rest and in transit)
5. **Security reviews** (quarterly)

---

## Post-Deployment Checklist

- [ ] All services running (Vercel, Render, Firebase)
- [ ] Domain DNS propagated
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Cron jobs executing
- [ ] Webhooks configured (Stripe, Clerk, SendGrid)
- [ ] Error tracking working (Sentry)
- [ ] Uptime monitoring active
- [ ] Analytics tracking
- [ ] Backups configured
- [ ] Alerts set up
- [ ] Documentation updated
- [ ] Team notified

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass
- [ ] Code reviewed and approved
- [ ] Changelog updated
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] External services tested

### Deployment

- [ ] Deploy to Vercel
- [ ] Deploy voice server to Render
- [ ] Run database migrations
- [ ] Verify cron jobs
- [ ] Test critical paths
- [ ] Check error logs

### Post-Deployment

- [ ] Smoke test main features
- [ ] Verify webhooks working
- [ ] Check performance metrics
- [ ] Monitor error rates
- [ ] Notify team
- [ ] Update status page

---

For troubleshooting deployment issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

For local development, see [LOCAL_SETUP.md](./LOCAL_SETUP.md).

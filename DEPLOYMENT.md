# Recoup Deployment Guide

This document provides comprehensive guidance for deploying Recoup to production and managing the deployment lifecycle.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Deployment Process](#deployment-process)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & Services

- [ ] **Vercel Account** (hosting platform)
- [ ] **GitHub Repository** access
- [ ] **Firebase Project** (production)
- [ ] **Stripe Account** (production mode)
- [ ] **Clerk Account** (authentication)
- [ ] **SendGrid Account** (email delivery)
- [ ] **Twilio Account** (SMS/voice)
- [ ] **Upstash Redis** (rate limiting)
- [ ] **Sentry Account** (error tracking)
- [ ] **Domain** configured (recoup.app)

### Required Access Levels

- [ ] GitHub repository write access
- [ ] Vercel project admin access
- [ ] Firebase project owner access
- [ ] Stripe account admin access

---

## Environment Setup

### 1. Create Production Environment Variables

Create a `.env.production` file based on `.env.example`:

```bash
cp .env.example .env.production
```

#### Critical Environment Variables

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://recoup.app

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Payment Processing
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Database
FIREBASE_PROJECT_ID=recoup-production
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@recoup-production.iam.gserviceaccount.com

# Email
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=team@recoup.app

# SMS/Voice
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx

# Security
CRON_SECRET=<generate-secure-random-string>

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 2. Configure Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variables
vercel env add STRIPE_SECRET_KEY production
vercel env add CLERK_SECRET_KEY production
# ... add all required variables
```

### 3. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

```
Settings → Secrets and variables → Actions → New repository secret
```

Required secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLERK_SECRET_KEY`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `SENDGRID_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `CRON_SECRET`
- `CODECOV_TOKEN` (optional)
- `SNYK_TOKEN` (optional)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm run test:ci`)
- [ ] Test coverage ≥ 80% on critical paths
- [ ] Linting passing (`npm run lint`)
- [ ] Type checking passing (`npm run type-check`)
- [ ] No console.log statements in production code
- [ ] No TODO comments without issue links

### Security

- [ ] All API keys rotated if exposed
- [ ] Environment variables configured correctly
- [ ] Webhook signatures verified
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] CSP headers configured
- [ ] Sensitive data encrypted at rest

### Database

- [ ] Firestore indexes created
- [ ] Firestore rules deployed
- [ ] Backup strategy in place
- [ ] Data migrations tested on staging
- [ ] Connection pooling optimized

### External Services

- [ ] Stripe webhook endpoints configured
- [ ] SendGrid domain verified
- [ ] Twilio numbers provisioned
- [ ] DNS records configured
- [ ] SSL certificates valid

### Documentation

- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Migration scripts documented
- [ ] Runbook updated
- [ ] Changelog updated

---

## Deployment Process

### Option 1: Automatic Deployment (Recommended)

Merging to `main` branch triggers automatic deployment via GitHub Actions.

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes and commit
git add .
git commit -m "feat: your feature description"

# 3. Push to GitHub
git push origin feature/your-feature

# 4. Create Pull Request
# GitHub Actions will run tests automatically

# 5. After approval, merge to main
# Deployment will trigger automatically
```

**GitHub Actions Workflow:**

1. ✅ Run linting and type checking
2. ✅ Run unit tests
3. ✅ Run integration tests
4. ✅ Check test coverage (must be ≥ 80%)
5. ✅ Build Next.js application
6. ✅ Deploy to Vercel production
7. ✅ Run smoke tests
8. ✅ Notify team

### Option 2: Manual Deployment

```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Build locally to verify
npm run build

# 3. Deploy to production
vercel --prod

# 4. Verify deployment
curl https://recoup.app/api/health
```

### Option 3: Rollback Deployment

See [ROLLBACK.md](./ROLLBACK.md) for detailed rollback procedures.

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# API health check
curl https://recoup.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "services": {
    "api": "operational",
    "database": "operational",
    "environment": "configured"
  }
}
```

### 2. Smoke Tests

Run critical user journeys:

#### Test 1: User Authentication

```bash
# Visit login page
open https://recoup.app/sign-in

# Verify:
# - Page loads without errors
# - Clerk authentication widget appears
# - Login flow completes successfully
```

#### Test 2: Dashboard Access

```bash
# Visit dashboard
open https://recoup.app/dashboard

# Verify:
# - Dashboard loads
# - Data displays correctly
# - No console errors
```

#### Test 3: Payment Processing

```bash
# Create test invoice
# Initiate payment confirmation
# Verify webhook receives event
# Check transaction recorded correctly
```

#### Test 4: Webhooks

```bash
# Send test Stripe webhook
curl -X POST https://recoup.app/api/webhook/stripe \
  -H "stripe-signature: test_signature" \
  -d @test-webhook.json

# Verify webhook processed successfully
```

### 3. Monitoring Checks

#### Vercel Dashboard

- [ ] Deployment status: Success
- [ ] Build time: < 3 minutes
- [ ] Function execution time: < 10s
- [ ] Error rate: < 1%

#### Sentry

- [ ] No new critical errors
- [ ] Error rate within acceptable range
- [ ] Performance metrics normal

#### Firestore

- [ ] Read/write rates normal
- [ ] No index warnings
- [ ] Connection pool healthy

---

## Monitoring

### Real-Time Monitoring

#### Vercel Analytics

Monitor in Vercel dashboard:

- **Traffic**: Request volume
- **Performance**: Response times
- **Errors**: Error rates
- **Functions**: Execution times

#### Sentry

Track errors and performance:

```typescript
// Errors are automatically tracked
// Performance monitoring enabled
```

View at: https://sentry.io/organizations/recoup/

### Alerts

Configure alerts for:

- [ ] Error rate > 5%
- [ ] Response time > 3s
- [ ] Database queries > 5s
- [ ] Failed webhook deliveries
- [ ] Payment processing failures
- [ ] SSL certificate expiration

### Logs

View logs in real-time:

```bash
# Vercel logs
vercel logs --follow

# Filter by function
vercel logs --follow api/webhook/stripe

# View specific deployment
vercel logs --deployment <deployment-url>
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails

**Symptom**: GitHub Actions or Vercel deployment fails

**Solutions**:

```bash
# Check build logs
vercel logs --deployment <url>

# Verify environment variables
vercel env ls production

# Test build locally
npm run build

# Check for missing dependencies
npm ci
```

#### 2. Webhook Failures

**Symptom**: Stripe/SendGrid webhooks not processing

**Solutions**:

```bash
# Verify webhook signature
# Check STRIPE_WEBHOOK_SECRET is correct

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Check webhook logs in Stripe dashboard
# https://dashboard.stripe.com/webhooks
```

#### 3. Database Connection Issues

**Symptom**: Firestore queries failing

**Solutions**:

```bash
# Verify Firebase credentials
# Check FIREBASE_PRIVATE_KEY formatting (must include \n)

# Test connection
node -e "require('./lib/firebase').db.collection('users').limit(1).get().then(() => console.log('OK'))"

# Check Firestore indexes
# https://console.firebase.google.com/project/recoup-production/firestore/indexes
```

#### 4. Authentication Failures

**Symptom**: Users cannot log in

**Solutions**:

```bash
# Verify Clerk configuration
# Check CLERK_SECRET_KEY is correct

# Verify domain allowlist in Clerk dashboard
# https://dashboard.clerk.com/apps/recoup/instances/production

# Check middleware configuration
```

#### 5. High Error Rates

**Symptom**: Sentry showing elevated errors

**Solutions**:

1. Check Sentry dashboard for error patterns
2. Review recent deployments
3. Check for breaking API changes
4. Verify external service status
5. Consider rollback if critical

---

## Emergency Contacts

- **On-Call Engineer**: See PagerDuty schedule
- **DevOps Lead**: [contact info]
- **CTO**: [contact info]

## External Service Status Pages

- Vercel: https://vercel-status.com
- Stripe: https://status.stripe.com
- Clerk: https://status.clerk.com
- SendGrid: https://status.sendgrid.com
- Twilio: https://status.twilio.com
- Firebase: https://status.firebase.google.com

---

## Deployment Frequency

**Recommended Schedule:**

- **Staging**: Deploy on every PR merge to `develop`
- **Production**: Deploy 2-3 times per week
- **Hotfixes**: Deploy immediately after approval
- **Major releases**: Deploy during low-traffic hours (weekends)

---

## Success Criteria

A deployment is considered successful when:

- ✅ All automated tests pass
- ✅ Health check endpoint returns 200
- ✅ Smoke tests complete successfully
- ✅ Error rate < 1% in first 30 minutes
- ✅ Response time < 1s (p95)
- ✅ No critical Sentry alerts

If any criteria fail, initiate rollback procedure immediately.

---

## Additional Resources

- [Rollback Procedures](./ROLLBACK.md)
- [Database Migrations](./relay/scripts/migrations/README.md)
- [Testing Guide](./relay/__tests__/README.md)
- [API Documentation](./docs/api.md)
- [Architecture Overview](./docs/architecture.md)

---

**Last Updated**: 2024-01-15
**Document Owner**: DevOps Team
**Review Cycle**: Monthly

# 🚀 Recoup Deployment Guide
**Production Deployment Runbook**

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Required Before ANY Deployment:
- [ ] All tests passing locally (`npm test`)
- [ ] TypeScript compilation clean (`npm run build`)
- [ ] No critical TODOs in code (check LAUNCH_READINESS_AUDIT.md)
- [ ] All environment variables configured
- [ ] Database migrations applied (if any)
- [ ] Stripe webhooks configured
- [ ] Twilio webhooks configured
- [ ] SendGrid/Resend templates created
- [ ] Sentry project created
- [ ] Clerk application configured

---

## 🔧 ENVIRONMENT VARIABLES

### Required for All Environments:

```bash
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_****
CLERK_SECRET_KEY=sk_****
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Firebase
FIREBASE_PROJECT_ID=recoup-****
FIREBASE_CLIENT_EMAIL=****@****.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n****\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_FIREBASE_API_KEY=****
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=recoup-****.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=recoup-****
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=recoup-****.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=****
NEXT_PUBLIC_FIREBASE_APP_ID=****

# Stripe
STRIPE_SECRET_KEY=sk_****
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_****
STRIPE_WEBHOOK_SECRET=whsec_****

# Twilio
TWILIO_ACCOUNT_SID=AC****
TWILIO_AUTH_TOKEN=****
TWILIO_PHONE_NUMBER=+44****
TWILIO_VERIFY_SERVICE_SID=VA****

# Email (SendGrid)
SENDGRID_API_KEY=SG.****
SENDGRID_FROM_EMAIL=noreply@recoup.app
SENDGRID_FROM_NAME="Recoup"

# AI Services
OPENAI_API_KEY=sk-****
ANTHROPIC_API_KEY=sk-ant-****
GEMINI_API_KEY=****

# Deepgram (Voice transcription)
DEEPGRAM_API_KEY=****

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://****@sentry.io/****
SENTRY_AUTH_TOKEN=****

# Application
NEXT_PUBLIC_APP_URL=https://app.recoup.io
NODE_ENV=production
```

### Vercel Deployment:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add all variables from above
3. Set appropriate scopes (Production, Preview, Development)

---

## 🌍 DEPLOYMENT ENVIRONMENTS

### 1. Development
- **URL:** http://localhost:3000
- **Purpose:** Local development and testing
- **Database:** Firebase Development project
- **Stripe:** Test mode
- **Run:** `npm run dev`

### 2. Staging/Preview (Vercel)
- **URL:** https://recoup-****-preview.vercel.app
- **Purpose:** Pre-production testing
- **Database:** Firebase Staging project
- **Stripe:** Test mode
- **Trigger:** Any push to non-main branches

### 3. Production
- **URL:** https://app.recoup.io
- **Purpose:** Live customer-facing application
- **Database:** Firebase Production project
- **Stripe:** Live mode
- **Trigger:** Merge to `main` branch or `release/**` tags

---

## 📦 DEPLOYMENT PROCESS

### Option 1: Automatic Deployment (Recommended)

**Via GitHub Actions CI/CD:**
```bash
# 1. Ensure you're on feature branch
git checkout claude/feature-name

# 2. Commit all changes
git add -A
git commit -m "feat: describe your changes"

# 3. Push to trigger CI pipeline
git push origin claude/feature-name

# 4. CI pipeline runs automatically:
#    - Builds TypeScript
#    - Runs tests
#    - Security scans
#    - Deploys to preview URL

# 5. Merge to main for production deployment
git checkout main
git merge claude/feature-name
git push origin main

# 6. Production deployment triggers automatically
#    - Full CI pipeline runs
#    - Deploys to production
#    - Runs health checks
```

### Option 2: Manual Deployment (Vercel CLI)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
cd recoup
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs <deployment-url>
```

---

## 🔍 POST-DEPLOYMENT VERIFICATION

### 1. Health Checks
```bash
# Basic health check
curl https://app.recoup.io/api/health

# Expected response:
# {"status":"healthy","timestamp":"2025-11-20T...","uptime":123.45}

# Comprehensive readiness check
curl https://app.recoup.io/api/readiness

# Expected response:
# {"status":"ready","checks":[...all pass...],"responseTime":150}
```

### 2. Critical User Flows
- [ ] User can sign up (Clerk auth works)
- [ ] User can create invoice
- [ ] Stripe payment flow works
- [ ] Email sending works
- [ ] Webhook endpoints respond

### 3. Monitor Errors
```bash
# Check Sentry dashboard for errors
# https://sentry.io/organizations/recoup/issues/

# Check Vercel logs
vercel logs --prod

# Check Firestore for failed operations
# Firebase Console → Firestore → _errors collection
```

---

## 🚨 ROLLBACK PROCEDURE

### If Deployment Fails or Critical Bug Found:

**Immediate Rollback (Vercel):**
```bash
# 1. List recent deployments
vercel ls

# 2. Find last known good deployment
# Look for deployments with "READY" status from before the issue

# 3. Promote previous deployment to production
vercel promote <previous-deployment-url>

# Alternative: Use Vercel Dashboard
# Go to Deployments → Find good deployment → Click "Promote to Production"
```

**Emergency Hotfix:**
```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-fix

# 2. Make minimal fix
# ... edit files ...

# 3. Test locally
npm run build
npm test

# 4. Commit and push
git add -A
git commit -m "hotfix: critical issue description"
git push origin hotfix/critical-fix

# 5. Merge to main immediately
git checkout main
git merge hotfix/critical-fix
git push origin main

# 6. Delete hotfix branch
git branch -d hotfix/critical-fix
git push origin --delete hotfix/critical-fix
```

---

## 📊 MONITORING & ALERTS

### Sentry Setup:
1. Errors automatically tracked via `sentry.server.config.ts` and `sentry.client.config.ts`
2. Configure alerts in Sentry dashboard
3. Set up Slack/email notifications

### Key Metrics to Monitor:
- **Error Rate:** Should be < 0.1%
- **Response Time:** P95 < 500ms, P99 < 2000ms
- **Uptime:** > 99.9%
- **Payment Success Rate:** > 99%
- **Webhook Success Rate:** > 99.5%

### Recommended Alerts:
- Error rate > 1% in 5 minutes
- Response time P95 > 1000ms
- Health check failing
- Payment failures > 5 in 10 minutes
- Database connection errors

---

## 🔐 SECURITY CONSIDERATIONS

### Before Production Launch:
- [ ] All environment secrets in Vercel (never in code)
- [ ] Stripe webhook signature verification enabled
- [ ] Twilio webhook signature verification enabled
- [ ] Rate limiting configured on public endpoints
- [ ] CORS configured correctly
- [ ] CSP headers configured
- [ ] Clerk production mode enabled
- [ ] Firebase security rules deployed
- [ ] All API keys rotated from test values

---

## 🐛 TROUBLESHOOTING

### Build Fails:
```bash
# Check TypeScript errors
npm run build

# Check for missing dependencies
npm ci

# Verify Node version
node --version  # Should be >= 18.0.0
```

### Runtime Errors:
```bash
# Check environment variables
vercel env ls

# Check Sentry for stack traces
# Sentry Dashboard → Issues

# Check Vercel logs
vercel logs --prod --follow

# Test API endpoints
curl -v https://app.recoup.io/api/health
curl -v https://app.recoup.io/api/readiness
```

### Database Issues:
```bash
# Check Firebase console for connection errors
# Firebase Console → Firestore → Usage

# Verify service account permissions
# Firebase Console → IAM & Admin → Service Accounts

# Test Firestore connection locally
npm run dev
# Open http://localhost:3000/api/readiness
```

### Payment Issues:
```bash
# Verify Stripe webhook endpoint
# Stripe Dashboard → Developers → Webhooks
# Should point to: https://app.recoup.io/api/webhook/stripe

# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Check Stripe logs
# Stripe Dashboard → Developers → Logs
```

---

## 📞 INCIDENT RESPONSE

### Severity 1 (Revenue Impact - Production Down):
1. **Immediate:** Rollback to last known good deployment
2. **Alert:** Notify team in #incidents Slack channel
3. **Investigate:** Check Sentry, Vercel logs, Firestore
4. **Fix:** Create hotfix branch, test, deploy
5. **Post-mortem:** Document what happened and prevention steps

### Severity 2 (Degraded Performance):
1. **Monitor:** Check metrics dashboard
2. **Investigate:** Identify slow queries, high error rates
3. **Mitigate:** Scale resources if needed
4. **Fix:** Deploy optimization fix during low-traffic window

### Severity 3 (Non-Critical Bug):
1. **Document:** Create GitHub issue
2. **Prioritize:** Add to sprint backlog
3. **Fix:** Include in next regular deployment

---

## ✅ DEPLOYMENT CHECKLIST TEMPLATE

Use this for each production deployment:

```markdown
## Deployment: [Feature Name] - [Date]

### Pre-Deployment:
- [ ] All tests passing
- [ ] TypeScript builds successfully
- [ ] Code reviewed and approved
- [ ] Database migrations prepared (if needed)
- [ ] Environment variables updated (if needed)
- [ ] Stakeholders notified

### Deployment:
- [ ] Merged to main branch
- [ ] CI/CD pipeline passed
- [ ] Deployment successful
- [ ] Health check: /api/health returns 200
- [ ] Readiness check: /api/readiness returns 200

### Post-Deployment:
- [ ] Critical user flows tested
- [ ] No errors in Sentry (first 15 minutes)
- [ ] Stripe payments working
- [ ] Email sending working
- [ ] Performance metrics normal
- [ ] Stakeholders notified of success

### Rollback Plan (if needed):
- Previous deployment URL: [URL]
- Rollback command: `vercel promote [URL]`
```

---

## 🎯 FINAL PRODUCTION LAUNCH CHECKLIST

Before announcing to users:
- [ ] All items in LAUNCH_READINESS_AUDIT.md resolved
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Legal review (Terms, Privacy Policy)
- [ ] Customer support training completed
- [ ] Monitoring dashboards configured
- [ ] Incident response procedures documented
- [ ] Backup and disaster recovery tested
- [ ] Performance baselines established
- [ ] Revenue workflows end-to-end tested

---

**Document Version:** 1.0
**Last Updated:** 2025-11-20
**Maintained By:** Development Team

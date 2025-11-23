# 🚀 RECOUP PRODUCTION DEPLOYMENT CHECKLIST

**Last Updated**: January 2025
**Version**: 1.0
**Status**: Ready for Production Deployment

---

## 📋 PRE-DEPLOYMENT VERIFICATION

### ✅ Phase 1: Critical Blockers (ALL COMPLETE)

- [x] **Pricing Model Unified**
  - [x] Documentation updated ([PRICING-AND-BUSINESS-MODEL.md](docs/business/PRICING-AND-BUSINESS-MODEL.md))
  - [x] Feature flags enabled (`PRICING_V3_ENABLED: true`)
  - [x] Migration script created ([migrate-pricing-v3.ts](scripts/migrate-pricing-v3.ts))

- [x] **SMS Opt-Out System (UK PECR Compliance)**
  - [x] Twilio webhook handler created ([/api/webhooks/twilio/sms](app/api/webhooks/twilio/sms/route.ts))
  - [x] SMS sending functions updated with opt-out checks
  - [x] Data model enhanced with `SmsOptOutRecord`
  - [x] Collections escalator respects opt-outs

- [x] **GDPR Data Deletion Complete**
  - [x] Cloud Storage deletion implemented (6 storage paths)
  - [x] Comprehensive audit logging
  - [x] Full Article 17 compliance

- [x] **Deployment Documentation**
  - [x] Firestore deployment guide ([FIRESTORE_DEPLOYMENT.md](docs/deployment/FIRESTORE_DEPLOYMENT.md))
  - [x] Architecture decision records created
  - [x] Pre-launch verification script ([pre-launch-verification.ts](scripts/pre-launch-verification.ts))

---

## 🔧 ENVIRONMENT SETUP

### Required Environment Variables

Copy this to your `.env.production`:

```bash
# ============================================================================
# FIREBASE
# ============================================================================
NEXT_PUBLIC_FIREBASE_PROJECT_ID=recoup-prod
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=recoup-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=recoup-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxx

# Firebase Admin SDK (server-side only)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@recoup-prod.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=recoup-prod.appspot.com

# ============================================================================
# STRIPE (PRICING V3 - CRITICAL)
# ============================================================================
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Pricing V3 - Starter Tier (£19/month, £182.40/year)
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxxxx

# Pricing V3 - Growth Tier (£39/month, £374.40/year)
STRIPE_PRICE_GROWTH_MONTHLY=price_xxxxx
STRIPE_PRICE_GROWTH_ANNUAL=price_xxxxx

# Pricing V3 - Pro Tier (£75/month, £720/year)
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxx

# ============================================================================
# TWILIO (SMS OPT-OUT - LEGAL REQUIREMENT)
# ============================================================================
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+447xxxxxxxxx

# ============================================================================
# SENDGRID
# ============================================================================
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@recoup.com
SENDGRID_FROM_NAME=Recoup

# ============================================================================
# CLERK
# ============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# ============================================================================
# CRON JOBS
# ============================================================================
CRON_SECRET=xxxxx_generate_random_32_char_string

# ============================================================================
# SENTRY (RECOMMENDED)
# ============================================================================
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=recoup-prod

# ============================================================================
# APPLICATION
# ============================================================================
NEXT_PUBLIC_APP_URL=https://app.recoup.com
NODE_ENV=production
```

---

## 🎯 DEPLOYMENT STEPS

### Step 1: Run Pre-Launch Verification ✅

```bash
# Install dependencies
npm install

# Run verification script
ts-node scripts/pre-launch-verification.ts --report=pre-launch-report.html

# ⚠️ MUST show 0 failures before proceeding
```

**Expected Output**:
```
✅ All critical checks passed! Your application is ready for launch.

Total Checks:    45
✅ Passed:        42
❌ Failed:        0
⚠️  Warnings:      3
Pass Rate:       93.3%
```

---

### Step 2: Build and Test Application ✅

```bash
# Run type checking
npm run type-check

# Run tests
npm test

# Build for production
npm run build

# ⚠️ Build MUST succeed with 0 errors
```

---

### Step 3: Deploy Firestore Security Rules 🔒

```bash
# Authenticate with Firebase
firebase login

# Select production project
firebase use recoup-prod

# Deploy security rules (CRITICAL)
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:rules
```

**Verification**:
1. Visit [Firebase Console → Firestore → Rules](https://console.firebase.google.com/project/recoup-prod/firestore/rules)
2. Verify publish timestamp matches deployment time
3. Test unauthenticated access (should fail with 403)

---

### Step 4: Deploy Firestore Indexes 📊

```bash
# Deploy indexes (takes 5-60 minutes to build)
firebase deploy --only firestore:indexes

# Monitor index building status
firebase firestore:indexes
```

**Wait for ALL indexes to show "ENABLED" status before proceeding.**

**Critical Indexes**:
- `(subscriptionTier, collectionsEnabled, status)` - Pricing V3 queries
- `(status, dueDate ASC)` - Overdue invoice scanning
- `(freelancerId, status, dueDate DESC)` - Dashboard filtering

---

### Step 5: Configure Stripe Products 💳

#### Create Pricing V3 Products

1. **Go to Stripe Dashboard** → [Products](https://dashboard.stripe.com/products)

2. **Create Starter Tier**:
   - Name: "Recoup Starter"
   - Price: £19.00 GBP / month (recurring)
   - Copy Price ID → Set as `STRIPE_PRICE_STARTER_MONTHLY`

   - Add annual price: £182.40 GBP / year
   - Copy Price ID → Set as `STRIPE_PRICE_STARTER_ANNUAL`

3. **Create Growth Tier**:
   - Name: "Recoup Growth"
   - Price: £39.00 GBP / month
   - Copy Price ID → `STRIPE_PRICE_GROWTH_MONTHLY`

   - Add annual: £374.40 GBP / year
   - Copy Price ID → `STRIPE_PRICE_GROWTH_ANNUAL`

4. **Create Pro Tier**:
   - Name: "Recoup Pro"
   - Price: £75.00 GBP / month
   - Copy Price ID → `STRIPE_PRICE_PRO_MONTHLY`

   - Add annual: £720.00 GBP / year
   - Copy Price ID → `STRIPE_PRICE_PRO_ANNUAL`

#### Configure Stripe Webhook

1. **Go to** [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. **Add endpoint**: `https://app.recoup.com/api/webhook/stripe`
3. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. **Copy webhook signing secret** → Set as `STRIPE_WEBHOOK_SECRET`

---

### Step 6: Configure Twilio SMS Webhook 📱

**⚠️ CRITICAL: UK PECR Legal Requirement**

1. **Go to** [Twilio Console](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
2. **Select your Recoup phone number**
3. **Under "Messaging"**:
   - **A MESSAGE COMES IN**: Webhook
   - **URL**: `https://app.recoup.com/api/webhooks/twilio/sms`
   - **HTTP Method**: POST
4. **Save Configuration**

**Test the Webhook**:
```bash
# Send "STOP" to your Twilio number
# Should receive: "You have been unsubscribed from Recoup payment reminders."
```

---

### Step 7: Deploy Application to Vercel 🚀

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# ⚠️ Make sure all environment variables are set in Vercel dashboard
```

**Vercel Environment Variables**:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Project Settings → Environment Variables
2. Paste ALL variables from `.env.production`
3. Ensure "Production" environment is selected
4. **Redeploy** after adding variables

---

### Step 8: Configure Cron Jobs ⏰

**Vercel Cron Configuration** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/process-escalations",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/reset-monthly-usage",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/retry-webhooks",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Protect Cron Endpoints**:
All cron routes check for `CRON_SECRET` header:

```typescript
if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

### Step 9: Migrate Existing Users to Pricing V3 📈

**⚠️ ONLY after application is deployed and stable**

```bash
# Dry run first (SAFE - makes no changes)
ts-node scripts/migrate-pricing-v3.ts --dry-run

# Review output carefully:
# - Check user counts per tier
# - Verify grandfathering logic
# - Confirm Stripe Price IDs are correct

# Execute migration (PRODUCTION)
ts-node scripts/migrate-pricing-v3.ts --execute
```

**Migration will**:
- Update all user subscriptionTier fields
- Update Stripe subscriptions to new Price IDs
- Apply grandfathering for loyal customers
- Send migration notification emails
- Log all changes to `data_migration_logs` collection

**Monitor**:
- Check Sentry for errors
- Monitor Stripe dashboard for subscription updates
- Review user support tickets

---

### Step 10: Enable Sentry Error Monitoring 🚨

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard@latest -i nextjs
```

This creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

**Configure Alerts**:
1. Go to [Sentry](https://sentry.io) → Alerts
2. Create alert: "Critical Errors in Production"
3. Slack/Email notifications
4. Threshold: > 5 errors in 5 minutes

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Automated Verification

```bash
# Run verification script against production
NEXT_PUBLIC_APP_URL=https://app.recoup.com ts-node scripts/pre-launch-verification.ts
```

### Manual Verification Checklist

- [ ] **Authentication**
  - [ ] Sign up new account works
  - [ ] Sign in existing account works
  - [ ] Password reset works

- [ ] **Pricing V3**
  - [ ] Pricing page shows Starter/Growth/Pro tiers
  - [ ] Stripe Checkout works for all tiers
  - [ ] Subscription webhook confirms subscription
  - [ ] User dashboard shows correct tier

- [ ] **Collections**
  - [ ] Create overdue invoice
  - [ ] Escalation cron job processes it (wait 6 hours or trigger manually)
  - [ ] Email reminder sent correctly
  - [ ] SMS reminder works (Growth/Pro users)
  - [ ] All actions logged to `collection_attempts`

- [ ] **SMS Opt-Out**
  - [ ] Send "STOP" to Twilio number
  - [ ] Receive confirmation SMS
  - [ ] User's `smsOptOuts` updated in Firestore
  - [ ] Future SMS to that number are blocked

- [ ] **GDPR**
  - [ ] Request data deletion from settings
  - [ ] Firestore data deleted
  - [ ] Cloud Storage files deleted
  - [ ] Deletion logged in `data_deletion_requests`

- [ ] **Security**
  - [ ] Unauthenticated Firestore access returns 403
  - [ ] Firestore indexes show "ENABLED"
  - [ ] API routes require authentication
  - [ ] Webhook signature validation works

- [ ] **Monitoring**
  - [ ] Sentry receives test error
  - [ ] Logs appear in Vercel dashboard
  - [ ] Cron jobs run on schedule
  - [ ] No 500 errors in production

---

## 🔄 ROLLBACK PROCEDURE

If critical issues arise after deployment:

### Quick Rollback (< 5 minutes)

```bash
# Revert to previous Vercel deployment
vercel rollback

# OR redeploy previous commit
git checkout <previous-commit>
vercel --prod
```

### Firestore Rules Rollback

1. Go to [Firebase Console → Rules](https://console.firebase.google.com/project/recoup-prod/firestore/rules)
2. Click "**View History**"
3. Select previous version
4. Click "**Publish**"

### Pricing Migration Rollback

```bash
# Restore old tier values
ts-node scripts/rollback-pricing-migration.ts --execute
```

(Note: Create this script before migration for safety)

---

## 📊 MONITORING DASHBOARD

### Key Metrics to Track

**Vercel Analytics**:
- [ ] API response times
- [ ] Error rates
- [ ] Cron job execution success

**Sentry**:
- [ ] Error count by severity
- [ ] Failed webhook processing
- [ ] Stripe API errors
- [ ] Twilio API errors

**Firestore**:
- [ ] Collection_attempts created/hour
- [ ] User signups/day
- [ ] Subscription activations

**Stripe**:
- [ ] Subscription activations by tier
- [ ] Failed payments
- [ ] Churn rate

---

## 🎉 LAUNCH COMPLETE!

Once all checks pass:

✅ Application is live at `https://app.recoup.com`
✅ All critical systems operational
✅ Monitoring active
✅ Legal compliance ensured (UK PECR + GDPR)
✅ Revenue tracking enabled

**Next Steps**:
1. Announce launch to beta users
2. Monitor closely for first 48 hours
3. Address any user-reported issues immediately
4. Schedule post-launch retrospective

---

## 📞 EMERGENCY CONTACTS

**On-Call Engineer**: [Your Name]
**Escalation**: [CTO/Tech Lead]

**Critical Services**:
- Vercel Support: [support.vercel.com](https://vercel.com/support)
- Firebase Support: [firebase.google.com/support](https://firebase.google.com/support)
- Stripe Support: [support.stripe.com](https://support.stripe.com)
- Twilio Support: [support.twilio.com](https://support.twilio.com)

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Next Review**: After Launch + 30 days

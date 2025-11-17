# RELAY FOUNDING 50 LAUNCH CHECKLIST
## Week 14-16 Launch Preparation

**Last Updated:** November 15, 2025
**Target Launch:** Week 14-16 (Founding 50 Program)

---

## ✅ CODE IMPLEMENTATION (COMPLETE)

- [x] Update tier constants from 2-tier to 4-tier
- [x] Add founding member fields to User model
- [x] Add usage tracking fields to User model
- [x] Create Clerk premium gating helper
- [x] Create founding member service
- [x] Create founding member API endpoints
- [x] Create pricing page with Clerk PricingTable
- [x] Create founding member counter component
- [x] Create Clerk webhook handler
- [x] Update SMS collection route to use new gating
- [x] Add CLERK_WEBHOOK_SECRET to .env.example
- [x] Create comprehensive documentation

---

## 🔧 CLERK DASHBOARD SETUP (REQUIRED)

### 1. Create Subscription Plans

**Go to:** https://dashboard.clerk.com → Configure → Subscription Plans

- [ ] **FREE Plan** (£0/month)
  - Slug: `free`
  - Features: `unlimited_invoices`, `day_5_email_reminder`, `bacs_i_paid_button`, `demo_collections_1_per_month`

- [ ] **STARTER FOUNDING** (£12/month)
  - Slug: `starter_founding`
  - Features: `collections_limit_10`, `email_reminders_all_days`

- [ ] **STARTER STANDARD** (£24/month)
  - Slug: `starter_standard`
  - Same features as Founding

- [ ] **PRO FOUNDING** (£22/month) ⭐
  - Slug: `pro_founding`
  - Features: `collections_limit_25`, `sms_reminders`, `ai_voice_calls_5_per_month`, `advanced_analytics`, `priority_support`

- [ ] **PRO STANDARD** (£45/month) ⭐
  - Slug: `pro_standard`
  - Same features as Founding

- [ ] **BUSINESS FOUNDING** (£75/month)
  - Slug: `business_founding`
  - Features: `collections_unlimited`, `physical_letters_15_per_month`, `ai_voice_calls_20_per_month`, `dedicated_account_manager`

- [ ] **BUSINESS STANDARD** (£150/month)
  - Slug: `business_standard`
  - Same features as Founding

### 2. Connect Stripe

- [ ] Clerk Dashboard → Integrations → Stripe
- [ ] Click "Connect Stripe"
- [ ] Select your existing Stripe account
- [ ] Verify connection status shows "Connected"

### 3. Configure Webhook

- [ ] Clerk Dashboard → Webhooks → Add Endpoint
- [ ] URL: `https://your-domain.com/api/webhooks/clerk`
- [ ] Select events:
  - [x] `subscription.created`
  - [x] `subscription.updated`
  - [x] `subscription.deleted`
- [ ] Copy webhook secret
- [ ] Add to `.env.local`: `CLERK_WEBHOOK_SECRET=whsec_xxxxx`

---

## 💻 CODE UPDATES (REMAINING)

### Update Collection API Routes

- [x] ✅ `app/api/collections/sms/route.ts` (DONE)
- [ ] `app/api/collections/ai-call/route.ts`
- [ ] `app/api/collections/letter/route.ts`
- [ ] `app/api/collections/agency-handoff/route.ts`

**Pattern for each file:**
```typescript
import { requireClerkFeature, incrementUsageCounter } from '@/middleware/clerkPremiumGating';

// Replace old premium check with:
await requireClerkFeature(userId, 'ai_voice_calls_5_per_month'); // or appropriate feature

// After successful action:
await incrementUsageCounter(userId, 'collection'); // or 'ai_call', 'letter'
```

**Estimated time:** 15 minutes per route = 45 minutes total

---

## 📊 DASHBOARD UPDATES (OPTIONAL BUT RECOMMENDED)

### Create Usage Quota Widget

**File:** `app/dashboard/components/UsageQuotaWidget.tsx`

- [ ] Show current usage (X/Y collections used this month)
- [ ] Progress bar (green <50%, yellow 50-80%, red >80%)
- [ ] Upgrade CTA when >80% used
- [ ] Display tier name and limit

**Estimated time:** 2-3 hours

**Priority:** HIGH (users need to see their quota)

### Update Dashboard Home Page

**File:** `app/dashboard/page.tsx`

- [ ] Add `<UsageQuotaWidget />` component
- [ ] Show founding member badge if applicable
- [ ] Display subscription tier prominently

**Estimated time:** 1 hour

---

## 🔄 CRON JOBS (REQUIRED)

### Monthly Usage Reset

**File:** `app/api/cron/reset-monthly-usage/route.ts` (CREATE NEW)

- [ ] Create cron job route
- [ ] Verify cron secret
- [ ] Call `resetMonthlyUsage()` from clerkPremiumGating.ts
- [ ] Schedule in Vercel: Run on 1st of every month at 00:00 UTC

**Code:**
```typescript
import { resetMonthlyUsage } from '@/middleware/clerkPremiumGating';

export async function GET(req: Request) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  await resetMonthlyUsage(); // Resets all users
  return NextResponse.json({ success: true });
}
```

**Estimated time:** 1 hour

**Priority:** HIGH (critical for quota enforcement)

---

## 🧪 TESTING CHECKLIST

### Unit Tests

- [ ] Test `normalizeTier()` function (legacy 'paid' → 'pro')
- [ ] Test `checkClerkFeatureAccess()` with quota limits
- [ ] Test `registerAsFoundingMember()` race condition
- [ ] Test `mapPlanSlugToTier()` with all 7 plan slugs

### Integration Tests

- [ ] **Subscription Flow:**
  - [ ] Visit `/pricing`
  - [ ] Click "Subscribe to Pro (Founding)"
  - [ ] Complete Stripe test checkout
  - [ ] Verify webhook fires in Clerk Dashboard > Webhooks > Logs
  - [ ] Check user tier updated in Firestore (`subscriptionTier = 'pro'`)
  - [ ] Verify `collectionsLimitPerMonth = 25`

- [ ] **Usage Quota:**
  - [ ] Free user sends 1 collection → Success
  - [ ] Free user tries 2nd collection → 402 error with upgrade prompt
  - [ ] Starter user sends 10 collections → Success
  - [ ] Starter user tries 11th → Blocked
  - [ ] Pro user sends 25 collections → Success
  - [ ] Pro user tries 26th → Blocked
  - [ ] Business user sends 50+ collections → All succeed (unlimited)

- [ ] **Founding Member:**
  - [ ] Register 1st user → Member #1, locked price £22
  - [ ] Register 50th user → Member #50
  - [ ] Try to register 51st user → Error "All spots claimed"
  - [ ] Check counter on pricing page updates in real-time

- [ ] **Webhook Syncing:**
  - [ ] Subscribe in Clerk → Tier updates in Firestore
  - [ ] Upgrade from Starter → Pro → Firestore reflects change
  - [ ] Cancel subscription → Downgrades to 'free' tier

- [ ] **Feature Access:**
  - [ ] Free user tries SMS → 402 error
  - [ ] Starter user tries SMS → 402 error (SMS requires Pro+)
  - [ ] Pro user sends SMS → Success ✅
  - [ ] Pro user tries physical letter → 402 error (requires Business)
  - [ ] Business user sends letter → Success ✅

### End-to-End Test Scenarios

**Scenario 1: New User (Free Tier)**
- [ ] Sign up
- [ ] Create invoice
- [ ] Send invoice (email)
- [ ] Enable collections
- [ ] Day 5 email reminder sent
- [ ] Try to send 2nd collection this month → Blocked
- [ ] See upgrade prompt

**Scenario 2: Founding Member (Pro Tier)**
- [ ] Visit `/pricing`
- [ ] See "X/50 spots remaining"
- [ ] Subscribe to Pro (Founding) for £22
- [ ] Verify founding member badge in dashboard
- [ ] Send 10 SMS reminders
- [ ] Check usage quota: "10/25 used"
- [ ] Send 15 more SMS → Success
- [ ] Try 26th → Blocked with upgrade to Business CTA

**Scenario 3: Business User (Unlimited)**
- [ ] Subscribe to Business tier (£75)
- [ ] Send 50 collections (mix of email/SMS/letters)
- [ ] No quota limit enforced
- [ ] Verify unlimited badge in dashboard

---

## 📱 MOBILE TESTING

- [ ] Pricing page responsive on mobile
- [ ] Founding member banner stacks properly
- [ ] Pricing table usable on small screens
- [ ] Dashboard quota widget visible on mobile
- [ ] Clerk checkout works on mobile browsers

---

## 🚀 DEPLOYMENT

### Pre-Production

- [ ] Deploy to staging environment
- [ ] Run all tests on staging
- [ ] Verify webhook URL accessible from internet
- [ ] Check Clerk webhook logs (no errors)
- [ ] Test with real Stripe test cards

### Production

- [ ] Set `NODE_ENV=production` in Vercel
- [ ] Update `CLERK_WEBHOOK_SECRET` in production env vars
- [ ] Switch Clerk to production mode
- [ ] Switch Stripe to live mode
- [ ] Verify all 7 plans created in production Clerk account
- [ ] Test 1 real subscription (yourself or team member)

### Post-Deployment

- [ ] Monitor Clerk webhook logs (first 24 hours)
- [ ] Check Sentry for errors
- [ ] Verify founding member counter updates
- [ ] Monitor first 10 signups for issues

---

## 📢 LAUNCH PREPARATION

### Content & Marketing

- [ ] **Landing Page Copy:**
  - [ ] Founding 50 headline
  - [ ] Value proposition (76% late payment crisis)
  - [ ] Social proof messaging
  - [ ] FAQ section complete

- [ ] **Email Campaign:**
  - [ ] Waitlist email: "Founding 50 opens in 48 hours"
  - [ ] Launch day email: "Founding 50 is live!"
  - [ ] Reminder email (24 hours before close or at 40/50)

- [ ] **Social Media:**
  - [ ] Twitter announcement thread (10-15 tweets)
  - [ ] LinkedIn post (founder story)
  - [ ] Product Hunt submission prepared

### Analytics Setup

- [ ] Google Analytics tracking code
- [ ] Conversion tracking (signup → subscription)
- [ ] Founding member conversion funnel
- [ ] Revenue tracking (MRR)

---

## 🎯 LAUNCH DAY CHECKLIST

### 6 Hours Before Launch

- [ ] Final code review
- [ ] Database backup (Firestore export)
- [ ] Verify all env vars in production
- [ ] Test subscription flow one more time
- [ ] Check founding member counter starts at 0

### Launch Time

- [ ] Send launch email to waitlist
- [ ] Post on Twitter with #BuildInPublic
- [ ] Post on LinkedIn
- [ ] Submit to Product Hunt
- [ ] Post in r/freelanceuk (helpful, not spammy)

### First Hour

- [ ] Monitor signups in real-time
- [ ] Watch Clerk webhook logs
- [ ] Check Sentry for errors
- [ ] Respond to questions/comments
- [ ] Screenshot early testimonials

### First 24 Hours

- [ ] Track founding member signups (target: 10-20)
- [ ] Monitor MRR growth
- [ ] Collect early feedback
- [ ] Fix any critical bugs immediately
- [ ] Post update: "X/50 founding spots claimed!"

---

## 📊 SUCCESS METRICS

### Day 1 Goals

- [ ] 10+ founding members signed up
- [ ] £220+ MRR (10 users × £22 Pro tier)
- [ ] 0 critical bugs
- [ ] 100+ waitlist signups

### Week 1 Goals

- [ ] 30+ founding members (60% filled)
- [ ] £660+ MRR
- [ ] 5+ testimonials collected
- [ ] NPS survey sent to early users

### Week 2-3 Goals

- [ ] 50/50 founding spots filled
- [ ] £1,100 MRR (founding member goal)
- [ ] Product Hunt #1 product of the day
- [ ] 500+ total users (free + paid)

---

## ⚠️ KNOWN ISSUES & WORKAROUNDS

### If Clerk Billing Not Available

**Symptom:** Clerk dashboard doesn't show "Subscription Plans" option

**Workaround:**
1. Contact Clerk support to enable Clerk Billing (may be in beta)
2. OR build custom Stripe checkout (fallback plan, +20 hours)

### If Webhook Doesn't Fire

**Debug steps:**
1. Check Clerk Dashboard → Webhooks → Logs
2. Verify webhook URL is publicly accessible (not localhost)
3. Check `CLERK_WEBHOOK_SECRET` matches
4. Test with Clerk's "Send Test Event" button

### If Counter Shows Wrong Number

**Debug:**
1. Run Firestore query manually:
   ```javascript
   db.collection('users').where('isFoundingMember', '==', true).count()
   ```
2. Check for duplicate registrations (should be impossible with transaction)
3. Verify `foundingMemberNumber` field is set correctly

---

## 🆘 EMERGENCY CONTACTS

**Critical Bug (Production Down):**
- Vercel Status: https://vercel.com/status
- Clerk Status: https://status.clerk.com
- Stripe Status: https://status.stripe.com

**Support Channels:**
- Clerk Discord: https://clerk.com/discord
- Stripe Support: https://support.stripe.com

---

## 📝 POST-LAUNCH TASKS

### Week 1 After Launch

- [ ] Send thank you email to founding members
- [ ] Create founding member private Discord/Slack
- [ ] Schedule 1-on-1 calls with first 10 users
- [ ] Publish "Founding 50 filled in X days" blog post

### Month 1 After Launch

- [ ] Analyze founding member tier distribution
- [ ] Calculate actual LTV (vs projected £685)
- [ ] Measure free-to-paid conversion rate
- [ ] Identify top feature requests
- [ ] Plan Month 4-6 roadmap based on feedback

---

## ✅ SIGN-OFF

**Developer:** _______________ Date: ___________
- [ ] All code implemented and tested
- [ ] Documentation complete
- [ ] No known critical bugs

**Clerk Setup:** _______________ Date: ___________
- [ ] All 7 plans created
- [ ] Stripe connected
- [ ] Webhook configured

**Final Check:** _______________ Date: ___________
- [ ] End-to-end flow tested
- [ ] Founding member counter working
- [ ] Ready to launch

---

**🚀 You're ready to launch the Founding 50 program!**

Good luck! 🎉

**Next Step:** Complete the Clerk Dashboard setup (30-60 minutes) and run through the testing checklist (2-3 hours).

After that, you're live! 🚀

# CLERK SETUP GUIDE
## Production-Ready Subscription Configuration

**Last Updated:** November 15, 2025
**Estimated Setup Time:** 30-45 minutes

---

## 🎯 OVERVIEW

This guide walks you through setting up Clerk Billing for Relay's 4-tier freemium model.

**Key Decision:** We use **4 base subscription plans** with Clerk's discount/coupon system for founding members, NOT 7 separate plans.

### Why This Approach?

✅ **Simpler**: 4 plans instead of 7
✅ **Flexible**: Apply discounts via Clerk's promotion codes
✅ **Scalable**: Easy to add future discounts (e.g., annual billing, referrals)
✅ **Standard**: Uses Clerk's built-in discount features

---

## 📋 SETUP STEPS

### Step 1: Create 4 Subscription Plans in Clerk

**Go to:** [Clerk Dashboard](https://dashboard.clerk.com) → **Configure** → **Subscriptions** → **Plans**

#### Plan 1: FREE (£0/month)

**Configuration:**
- **Name:** Free
- **Slug:** `free`
- **Price:** £0/month
- **Billing Interval:** Monthly
- **Trial Period:** None

**Features to add:**
```
unlimited_invoices
day_5_email_reminder
bacs_i_paid_button
demo_collections_1_per_month
```

**Description:**
```
Perfect for getting started with invoice management
```

---

#### Plan 2: STARTER (£24/month)

**Configuration:**
- **Name:** Starter
- **Slug:** `starter`
- **Price:** £24/month
- **Billing Interval:** Monthly
- **Trial Period:** 14 days (optional)

**Features to add:**
```
collections_limit_10
email_reminders_all_days
unlimited_invoices
priority_email_support
```

**Description:**
```
For freelancers sending 6-10 invoices per month
```

---

#### Plan 3: PRO (£45/month) ⭐ MOST POPULAR

**Configuration:**
- **Name:** Pro
- **Slug:** `pro`
- **Price:** £45/month
- **Billing Interval:** Monthly
- **Trial Period:** 14 days (optional)
- **Badge:** "Most Popular"

**Features to add:**
```
collections_limit_25
sms_reminders
ai_voice_calls_5_per_month
advanced_analytics
priority_support
email_reminders_all_days
unlimited_invoices
```

**Description:**
```
For growing businesses needing automation
```

---

#### Plan 4: BUSINESS (£150/month)

**Configuration:**
- **Name:** Business
- **Slug:** `business`
- **Price:** £150/month
- **Billing Interval:** Monthly
- **Trial Period:** 14 days (optional)

**Features to add:**
```
collections_unlimited
physical_letters_15_per_month
ai_voice_calls_20_per_month
dedicated_account_manager
advanced_analytics
priority_support
sms_reminders
unlimited_invoices
```

**Description:**
```
For agencies managing 20+ invoices per month
```

---

### Step 2: Create Founding Member Discount Codes

**Go to:** Clerk Dashboard → **Subscriptions** → **Promotions** → **Create Promotion**

#### Founding 50 - Starter (50% off for life)

**Configuration:**
- **Name:** Founding 50 - Starter
- **Code:** `FOUNDING50_STARTER` (auto-generated)
- **Type:** Percentage Discount
- **Amount:** 50% off
- **Duration:** Forever
- **Applies to:** Starter plan only
- **Max Redemptions:** 50 (global limit)
- **Active:** Yes

**Result:** £24/month → £12/month forever

---

#### Founding 50 - Pro (50% off for life)

**Configuration:**
- **Name:** Founding 50 - Pro
- **Code:** `FOUNDING50_PRO`
- **Type:** Percentage Discount
- **Amount:** 50% off
- **Duration:** Forever
- **Applies to:** Pro plan only
- **Max Redemptions:** 50 (global limit)
- **Active:** Yes

**Result:** £45/month → £22.50/month forever (round to £22 in marketing)

---

#### Founding 50 - Business (50% off for life)

**Configuration:**
- **Name:** Founding 50 - Business
- **Code:** `FOUNDING50_BUSINESS`
- **Type:** Percentage Discount
- **Amount:** 50% off
- **Duration:** Forever
- **Applies to:** Business plan only
- **Max Redemptions:** 50 (global limit)
- **Active:** Yes

**Result:** £150/month → £75/month forever

---

### Step 3: Connect Stripe to Clerk

**Go to:** Clerk Dashboard → **Integrations** → **Stripe**

1. Click **"Connect Stripe"**
2. Select your Stripe account (you should already have one)
3. Authorize Clerk to access your Stripe account
4. Verify connection shows **"Connected ✓"**

**What Clerk does automatically:**
- ✅ Creates Stripe products for each plan
- ✅ Creates Stripe prices (£24, £45, £150)
- ✅ Syncs subscription changes to Stripe
- ✅ Handles payment failures and retries
- ✅ Manages customer billing portal

---

### Step 4: Configure Webhook

**Go to:** Clerk Dashboard → **Webhooks** → **Add Endpoint**

**Webhook Configuration:**
- **Endpoint URL:** `https://your-production-domain.com/api/webhooks/clerk`
- **Description:** Sync subscriptions to Firestore
- **Events to subscribe:**
  - ✅ `subscription.created`
  - ✅ `subscription.updated`
  - ✅ `subscription.deleted`
- **API Version:** Latest

**After creation:**
1. Copy the **Signing Secret** (starts with `whsec_...`)
2. Add to your `.env.local` file:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   ```
3. Deploy to production with this env var

---

### Step 5: Update Environment Variables

Add these to your production environment (Vercel/hosting):

```env
# Clerk Webhook Secret
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Cron Secret (for monthly usage reset)
CRON_SECRET=your-random-secret-here-use-strong-password
```

**Generate a strong CRON_SECRET:**
```bash
# Use this command to generate a secure random secret:
openssl rand -base64 32
```

---

### Step 6: Set Up Vercel Cron Job

**File:** `vercel.json` (create in project root)

```json
{
  "crons": [
    {
      "path": "/api/cron/reset-monthly-usage",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

**What this does:**
- Runs on the 1st of every month at 00:00 UTC
- Resets `collectionsUsedThisMonth` to 0 for all users
- Ensures fair quota enforcement

**Add CRON_SECRET to Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `CRON_SECRET` = `[your generated secret]`
3. Scope: Production, Preview, Development

---

## 🧪 TESTING CHECKLIST

### Test 1: Free Plan (Default)

1. Sign up as new user
2. Verify user gets `free` tier in Firestore
3. Check `collectionsLimitPerMonth = 1`
4. Try to send 2 collections → Should block on 2nd

**Expected Firestore User Document:**
```json
{
  "subscriptionTier": "free",
  "collectionsLimitPerMonth": 1,
  "collectionsUsedThisMonth": 0
}
```

---

### Test 2: Subscribe to Starter (Standard Price)

1. Visit `/pricing` page
2. Click **"Subscribe to Starter"** (£24/month)
3. Complete Stripe test checkout
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
4. Verify redirect to dashboard
5. Check Firestore user document updated:

**Expected:**
```json
{
  "subscriptionTier": "starter",
  "clerkSubscriptionId": "sub_xxxxx",
  "collectionsLimitPerMonth": 10,
  "collectionsUsedThisMonth": 0,
  "isFoundingMember": false
}
```

6. Check Clerk Dashboard → Webhooks → Logs
7. Verify `subscription.created` event fired successfully

---

### Test 3: Subscribe with Founding Member Discount

1. Visit `/pricing` page
2. Click **"Subscribe to Pro (Founding 50)"**
3. Clerk should show Pro plan with 50% discount applied (£22.50/month)
4. Complete checkout
5. Check Firestore:

**Expected:**
```json
{
  "subscriptionTier": "pro",
  "clerkSubscriptionId": "sub_xxxxx",
  "collectionsLimitPerMonth": 25,
  "collectionsUsedThisMonth": 0,
  "isFoundingMember": true,
  "foundingMemberNumber": 1,
  "lockedInPrice": 22
}
```

6. Verify founding member badge shows in dashboard
7. Check counter on pricing page decrements (49/50 remaining)

---

### Test 4: Usage Quota Enforcement

**Pro user (25 collections/month):**

1. Send 24 collections → All succeed
2. Check dashboard widget: "24/25 used" (yellow warning)
3. Send 25th collection → Success
4. Dashboard shows: "25/25 used" (red alert)
5. Try 26th collection → **402 Payment Required**

**Expected error response:**
```json
{
  "error": "Upgrade Required",
  "reason": "You've used 25/25 collections this month",
  "suggestedTier": "business",
  "upgradeUrl": "/pricing"
}
```

---

### Test 5: Plan Upgrade

1. User on Starter (£24/month) visits `/pricing`
2. Clicks **"Upgrade to Pro"** (£45/month)
3. Clerk handles upgrade (prorated billing)
4. Webhook fires `subscription.updated`
5. Firestore updates:

**Before:**
```json
{
  "subscriptionTier": "starter",
  "collectionsLimitPerMonth": 10,
  "collectionsUsedThisMonth": 7
}
```

**After:**
```json
{
  "subscriptionTier": "pro",
  "collectionsLimitPerMonth": 25,
  "collectionsUsedThisMonth": 7  // Preserved on upgrade
}
```

---

### Test 6: Subscription Cancellation

1. User clicks **Manage Billing** (Clerk's UserButton)
2. Goes to Clerk billing portal
3. Clicks **"Cancel Subscription"**
4. Confirms cancellation
5. Webhook fires `subscription.deleted`
6. Firestore downgrades:

**After cancellation:**
```json
{
  "subscriptionTier": "free",
  "clerkSubscriptionId": null,
  "collectionsLimitPerMonth": 1,
  "collectionsUsedThisMonth": 0,
  // Founding member status PRESERVED
  "isFoundingMember": true,
  "foundingMemberNumber": 1,
  "lockedInPrice": 22
}
```

**Note:** Founding member can re-subscribe anytime at £22/month

---

### Test 7: Monthly Reset Cron

**Manual Test:**
1. Set a user's `collectionsUsedThisMonth = 15`
2. Call cron endpoint manually:
   ```bash
   curl -X GET https://your-domain.com/api/cron/reset-monthly-usage \
     -H "x-cron-secret: your-cron-secret"
   ```
3. Check Firestore: `collectionsUsedThisMonth = 0`
4. Verify `monthlyUsageResetDate` updated to current timestamp

**Automated Test (Wait for 1st of month):**
1. Wait until 1st of month at 00:00 UTC
2. Check Vercel logs for cron execution
3. Verify all users reset to 0

---

## 🔐 SECURITY CHECKLIST

- [x] `CLERK_WEBHOOK_SECRET` is set (verifies webhook authenticity)
- [x] `CRON_SECRET` is set (prevents unauthorized cron calls)
- [x] Webhook signature validation enabled in `app/api/webhooks/clerk/route.ts`
- [x] All API routes check authentication (`await auth()`)
- [x] Premium features gated by `requireClerkFeature()`
- [x] Usage quotas enforced before actions
- [x] Founding member registration uses atomic transactions

---

## 🎨 PRICING PAGE INTEGRATION

### How Users Subscribe

**Free → Paid:**
1. Visit `/pricing` page
2. See 4 tiers with features
3. See founding member banner: "🔥 Only X/50 spots remaining!"
4. Click **"Subscribe to [Tier]"**
5. Clerk's `<PricingTable />` component handles checkout
6. Redirect to `/dashboard` after success

**Founding Member Flow:**
1. User clicks **"Claim Founding Member Spot"** on Pro tier
2. Clerk shows Pro plan with `FOUNDING50_PRO` discount auto-applied
3. Price shows £22.50/month (displayed as £22)
4. After checkout, webhook syncs to Firestore
5. `registerAsFoundingMember()` called (atomic transaction)
6. User gets badge: "🏆 Founding Member #23"

---

## 🛠️ TROUBLESHOOTING

### Issue: Webhook not firing

**Symptoms:**
- User subscribes but tier doesn't update in Firestore
- Webhook logs show no events

**Solution:**
1. Check webhook URL is publicly accessible (not `localhost`)
2. Verify `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard
3. Check Clerk Dashboard → Webhooks → Logs for errors
4. Test webhook with "Send Test Event" button

---

### Issue: Discount code not applying

**Symptoms:**
- User tries to subscribe as founding member
- Full price (£45) shown instead of discounted (£22)

**Solution:**
1. Check promotion code `FOUNDING50_PRO` is active
2. Verify max redemptions not reached (50 limit)
3. Ensure code applies to correct plan (Pro only)
4. Check pricing page passes discount code to Clerk

---

### Issue: Usage quota not enforcing

**Symptoms:**
- User sends more collections than allowed
- No 402 error thrown

**Solution:**
1. Check `collectionsUsedThisMonth` field exists in Firestore
2. Verify `requireClerkFeature()` is called before action
3. Ensure `incrementUsageCounter()` called after action
4. Check user's `collectionsLimitPerMonth` is set correctly

---

### Issue: Cron job not running

**Symptoms:**
- Users' quotas don't reset on 1st of month
- Vercel logs show no cron execution

**Solution:**
1. Check `vercel.json` exists in project root
2. Verify cron schedule: `"0 0 1 * *"` (1st at 00:00 UTC)
3. Ensure `CRON_SECRET` env var is set in Vercel
4. Check Vercel → Project → Settings → Cron Jobs shows schedule
5. Manually trigger: Settings → Cron Jobs → Run Now

---

## 📊 POST-LAUNCH MONITORING

### Key Metrics to Track

**Clerk Dashboard:**
- Active subscriptions by tier
- Churn rate (cancellations)
- MRR (Monthly Recurring Revenue)
- Upgrade/downgrade trends

**Firestore Queries:**
```javascript
// Founding members count
db.collection('users').where('isFoundingMember', '==', true).count()

// Users by tier
db.collection('users').where('subscriptionTier', '==', 'pro').count()

// Users near quota limit
db.collection('users')
  .where('collectionsUsedThisMonth', '>=', 20)
  .where('collectionsLimitPerMonth', '==', 25)
  .get()
```

**Vercel Analytics:**
- `/pricing` page views
- Checkout conversion rate
- Time from signup to first subscription

---

## ✅ LAUNCH READINESS

Before launching to production, verify:

- [x] All 4 plans created in Clerk
- [x] 3 founding member discount codes created (50 redemptions each)
- [x] Stripe connected to Clerk
- [x] Webhook configured with correct production URL
- [x] `CLERK_WEBHOOK_SECRET` added to production env
- [x] `CRON_SECRET` added to production env
- [x] `vercel.json` cron configured
- [x] Test subscription flow end-to-end
- [x] Test usage quota enforcement
- [x] Test founding member registration
- [x] Monitor webhook logs (first 24 hours)

---

## 🚀 YOU'RE READY TO LAUNCH!

Once all checkboxes above are ticked, you can launch the Founding 50 program.

**Next Steps:**
1. Announce to waitlist
2. Monitor first 10 signups closely
3. Collect testimonials from founding members
4. Adjust pricing/features based on feedback

Good luck! 🎉

---

**Questions or Issues?**
- Clerk Support: https://clerk.com/support
- Stripe Support: https://support.stripe.com
- Relay Documentation: See `IMPLEMENTATION_SUMMARY.md`

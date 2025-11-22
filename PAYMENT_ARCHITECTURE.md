# PAYMENT ARCHITECTURE DOCUMENTATION

## 🏦 Payment Flows in Recoup

There are **TWO SEPARATE payment flows** - it's critical to understand the difference:

---

## 1️⃣ SUBSCRIPTION PAYMENTS (Platform Revenue)

**Who**: Freelancer → Recoup (the platform)
**What**: Monthly/annual subscription fees (Free/Pro/MTD-Pro)
**How**: Clerk Billing (subscriptions configured in Clerk Dashboard)

### Flow:
```
User signs up (Clerk)
  ↓
User clicks "Upgrade to Pro"
  ↓
Clerk Subscription Checkout
  ↓
User enters payment details (Clerk hosted page)
  ↓
Clerk creates Subscription
  ↓
Clerk webhook → Update user.subscriptionTier in Firestore
  ↓
User gets Pro features
```

### Key Points:
- ✅ Clerk handles AUTHENTICATION + BILLING (all-in-one)
- ✅ Subscriptions configured in Clerk Dashboard (Free/Pro/MTD-Pro tiers)
- ✅ Platform keeps 100% of subscription revenue (£10 or £20/month, minus Clerk fees)
- ✅ Simpler than Stripe Billing (one vendor for auth + subscriptions)

### Implementation:
- **Clerk Subscription Plans** configured in Clerk Dashboard
- **Clerk Checkout** triggered from pricing page
- **Clerk Webhook** updates Firestore with subscription status
- **Subscription tiers**: free, pro, mtd-pro

---

## 2️⃣ CLIENT PAYMENTS (Freelancer Revenue)

**Who**: Client → Freelancer (NOT through platform)
**What**: Payment for invoices (the freelancer's actual work)
**How**: Stripe Payment Links (direct to freelancer)

### Flow:
```
Freelancer creates invoice
  ↓
Recoup generates Stripe Payment Link
  ↓
Client clicks link and pays
  ↓
Money goes DIRECTLY to freelancer's Stripe account
  ↓
Stripe webhook → Update invoice.status = 'paid' in Recoup
  ↓
Recoup tracks payment (but never touches the money)
```

### Key Points:
- ✅ Money goes DIRECTLY client → freelancer
- ✅ Platform NEVER touches client payment funds
- ✅ Platform just tracks payment status (paid/unpaid)
- ✅ No transaction fees to platform (freelancer keeps 100% minus Stripe fees)
- ❌ We do NOT use Stripe Connect (too complex, unnecessary)

### Implementation:
- **Stripe Payment Links** created for each invoice
- **Freelancer's Stripe account** (they sign up separately with Stripe)
- **Webhook** just updates invoice status in Recoup
- **No fund handling** by platform

---

## 🔄 Current Implementation Status

### ✅ What's Correct:
- Clerk for authentication (users, sessions, profiles)
- Stripe payment links for invoices (already in codebase)
- Payment claim verification system (freelancer confirms payment)
- Firestore for data storage

### ❌ What's Missing/Wrong:
1. **Clerk Subscription Plans** - NOT YET CONFIGURED
   - Need to create subscription plans in Clerk Dashboard
   - Plans: free (£0), pro (£10/month), mtd-pro (£20/month)
   - Users can't upgrade until Clerk plans are configured

2. **Clerk webhook** handles subscriptions correctly
   - ✅ Already listens to: subscription.created, subscription.updated, subscription.deleted
   - ✅ Updates user.subscriptionTier in Firestore
   - ⚠️ May need to map expense tier names (free/pro/mtd-pro) in webhook

3. **Pricing page** needs expense tier integration
   - Old pricing page shows collections-based tiers (£19/£39/£75)
   - Need new pricing page for expense tiers (£0/£10/£20)
   - "Upgrade" buttons should link to Clerk checkout

4. **Payment Link generation** is correct but incomplete
   - Works for invoices
   - But doesn't track freelancer's Stripe account
   - Need to store freelancer's Stripe account ID

---

## 🛠️ What Needs to be Fixed

### Priority 1: Configure Clerk Subscription Plans
1. Create subscription plans in Clerk Dashboard:
   - Free: £0/month (50 expenses, 10 OCR)
   - Pro: £10/month (unlimited expenses, unlimited OCR)
   - MTD-Pro: £20/month (all Pro + HMRC filing)
2. Get plan slugs/IDs from Clerk
3. Update Clerk webhook to map expense tier plan slugs
4. Test subscription flow end-to-end

### Priority 2: Create Expense Pricing Page
1. Create new pricing page component for expense tiers
2. Add "Upgrade to Pro" / "Upgrade to MTD-Pro" buttons
3. Link buttons to Clerk subscription checkout
4. Show expense tier features (not collections features)
5. Add MTD upgrade banner to dashboard

### Priority 3: Update Clerk Webhook Mapping
1. Ensure webhook maps Clerk plan slugs to: free, pro, mtd-pro
2. Update user.subscriptionTier correctly
3. Set expense quotas based on tier
4. Handle annual vs monthly plans

### Priority 4: Clarify Client Payments
1. ✅ Already documented that money goes direct to freelancer
2. Remove any code that suggests platform handles funds
3. Add optional: Freelancer can connect their Stripe account (for auto payment links)

---

## 💰 Revenue Model Summary

**Platform Revenue (How we make money):**
- Subscription fees: £10/month (Pro), £20/month (MTD-Pro)
- Charged via: Stripe Billing
- Paid by: Freelancers

**Freelancer Revenue (Not our money):**
- Invoice payments: Variable (their work)
- Charged via: Stripe Payment Links (or manual)
- Paid by: Clients
- Goes to: Freelancer's bank account (NOT platform)

**Platform does NOT:**
- ❌ Take transaction fees from client payments
- ❌ Hold funds in escrow
- ❌ Process client payments through our account
- ❌ Use Stripe Connect (unnecessary complexity)

**Platform DOES:**
- ✅ Track payment status (paid/unpaid)
- ✅ Generate payment links for convenience
- ✅ Send reminders to clients
- ✅ Provide collections automation

---

## 🔐 Security Implications

Since platform never touches client funds:
- ✅ Much simpler compliance (no PCI DSS Level 1)
- ✅ No liability for disputed payments
- ✅ No need for escrow accounts
- ✅ No need for payment processor licenses
- ✅ Freelancers have full control of their money

---

## 📋 Next Steps

1. ✅ Document architecture (this file)
2. ⏳ Configure Clerk subscription plans (Free/Pro/MTD-Pro)
3. ⏳ Update Clerk webhook to handle expense tier slugs
4. ⏳ Create expense pricing page UI with Clerk checkout links
5. ⏳ Test end-to-end subscription flow
6. ⏳ Update README with Clerk billing setup instructions

---

This architecture is:
- **Simple**: Two clear payment flows, no complexity
- **Safe**: Platform never handles client funds
- **Scalable**: Stripe Billing handles all subscription logic
- **Compliant**: Minimal regulatory burden

Last updated: 2025-11-21

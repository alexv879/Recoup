# CLERK SUBSCRIPTION SETUP GUIDE

## 🎯 Overview

Recoup uses Clerk for BOTH authentication AND subscription billing. This simplifies our stack by using a single vendor for user management and payments.

**Subscription Tiers:**
- **Free**: £0/month (50 expenses, 10 OCR per month)
- **Pro**: £10/month (unlimited expenses, unlimited OCR)
- **MTD-Pro**: £20/month (all Pro features + HMRC quarterly filing)

---

## 📋 Step 1: Create Subscription Plans in Clerk Dashboard

Go to: https://dashboard.clerk.com → Your Application → Billing

### Plan 1: Free Tier
- **Name**: Free
- **Slug**: `free` or `expense_free`
- **Price**: £0/month
- **Features to highlight**:
  - 50 expenses per month
  - 10 receipt OCR per month
  - 100MB receipt storage
  - Basic invoicing
  - Revenue recovery dashboard
  - Tax deduction tracking

### Plan 2: Pro Tier
- **Name**: Pro
- **Slug**: `pro` or `expense_pro`
- **Monthly Price**: £10/month
- **Annual Price**: £96/year (20% discount)
- **Features to highlight**:
  - Unlimited expenses
  - Unlimited receipt OCR
  - 1GB receipt storage
  - Advanced collections
  - Bulk expense import
  - AI revenue forecasting
  - Client expense reports

### Plan 3: MTD-Pro Tier
- **Name**: MTD-Pro
- **Slug**: `mtd_pro` or `expense_mtd_pro`
- **Monthly Price**: £20/month
- **Annual Price**: £192/year (20% discount)
- **Features to highlight**:
  - All Pro features
  - HMRC quarterly submissions
  - VAT filing integration
  - Annual tax declarations
  - Audit-proof digital records
  - Compliance reports
  - Priority support

---

## 🔧 Step 2: Configure Clerk Webhook

1. Go to: https://dashboard.clerk.com → Webhooks
2. Click "Add Endpoint"
3. **URL**: `https://your-domain.com/api/webhooks/clerk`
4. **Events to subscribe**:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.deleted`
5. Copy the **Signing Secret**
6. Add to your `.env.local`:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## 🎨 Step 3: Update Pricing Page

The pricing page needs to link to Clerk's subscription checkout. You have two options:

### Option A: Clerk Elements (Recommended)
Use Clerk's pre-built pricing components that handle checkout automatically.

```tsx
import { PricingTable } from '@clerk/clerk-react';

export function PricingPage() {
  return (
    <PricingTable
      plans={['free', 'pro', 'mtd_pro']}
      highlightedPlan="pro"
    />
  );
}
```

### Option B: Custom UI with Clerk Links
Build custom pricing cards and link to Clerk's subscription flow:

```tsx
<a
  href={`https://your-clerk-domain.clerk.accounts.dev/subscribe?plan=pro`}
  className="btn-primary"
>
  Upgrade to Pro
</a>
```

---

## 🧪 Step 4: Test Subscription Flow

1. **Test Card Numbers** (Clerk Sandbox):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. **Test Flow**:
   ```
   Sign up → Create account (user.created webhook fires)
   ↓
   Go to Pricing Page
   ↓
   Click "Upgrade to Pro" → Clerk Checkout
   ↓
   Enter test card → Subscribe (subscription.created webhook fires)
   ↓
   Check Firestore: user.subscriptionTier should = 'pro'
   ↓
   Check quotas: expensesPerMonth should = null (unlimited)
   ```

3. **Verify Webhook in Clerk Dashboard**:
   - Go to: Webhooks → Your endpoint
   - Click "Logs" to see webhook delivery status
   - Ensure `subscription.created` was sent successfully

---

## 🔐 Environment Variables Required

Add these to your `.env.local`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxx

# Clerk Webhook
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxx

# Clerk Sign-in/Sign-up URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

## 📊 How the Webhook Works

### 1. User Signs Up
```
Clerk → user.created webhook → Firestore
```
Creates user document with Free tier quotas:
```typescript
{
  subscriptionTier: 'free',
  expensesPerMonth: 50,
  ocrProcessingPerMonth: 10,
  receiptStorageMB: 100,
  mtdEnabled: false
}
```

### 2. User Upgrades to Pro
```
Clerk → subscription.created webhook → Firestore
```
Updates user document with Pro tier quotas:
```typescript
{
  subscriptionTier: 'pro',
  expensesPerMonth: null, // Unlimited
  ocrProcessingPerMonth: null, // Unlimited
  receiptStorageMB: 1000, // 1GB
  mtdEnabled: false,
  clerkSubscriptionId: 'sub_xxxx',
  clerkPlanSlug: 'pro'
}
```

### 3. User Upgrades to MTD-Pro
```
Clerk → subscription.updated webhook → Firestore
```
Updates user document with MTD-Pro quotas:
```typescript
{
  subscriptionTier: 'pro', // Still mapped to 'pro' tier
  expensesPerMonth: null,
  ocrProcessingPerMonth: null,
  receiptStorageMB: 1000,
  mtdEnabled: true, // ✅ MTD ENABLED
  clerkPlanSlug: 'mtd_pro' // Used to detect MTD plan
}
```

### 4. User Cancels
```
Clerk → subscription.deleted webhook → Firestore
```
Downgrades user back to Free tier quotas.

---

## 🎯 Plan Slug Mapping

The webhook automatically maps Clerk plan slugs to our subscription tiers:

| Clerk Plan Slug | Subscription Tier | MTD Enabled | Quotas |
|-----------------|-------------------|-------------|--------|
| `free`, `expense_free` | `free` | No | 50 expenses, 10 OCR |
| `pro`, `expense_pro`, `pro_monthly`, `pro_annual` | `pro` | No | Unlimited |
| `mtd_pro`, `expense_mtd_pro`, `mtd_pro_monthly`, `mtd_pro_annual` | `pro` | **Yes** | Unlimited + HMRC |

The webhook detects MTD plans by checking if the plan slug contains "mtd" and sets `mtdEnabled: true`.

---

## 🚨 Common Issues

### Issue 1: Webhook Not Firing
- Check webhook URL is correct and accessible
- Verify CLERK_WEBHOOK_SECRET is set
- Check Clerk Dashboard → Webhooks → Logs for errors

### Issue 2: Plan Slug Not Recognized
- Ensure plan slug matches one of the supported slugs in webhook mapping
- Check webhook logs: `Unknown plan slug in subscription.created`
- Add new slug to `mapPlanSlugToTier()` function if needed

### Issue 3: User Stuck on Free Tier After Payment
- Check Firestore: Does user have `clerkSubscriptionId`?
- Check Clerk Dashboard → Subscriptions: Is subscription active?
- Check webhook delivery in Clerk Dashboard → Webhooks → Logs

---

## 📚 Next Steps

1. ✅ Configure subscription plans in Clerk Dashboard
2. ✅ Set up webhook endpoint
3. ⏳ Create expense pricing page (see NEXT TASK)
4. ⏳ Add upgrade CTAs throughout dashboard
5. ⏳ Test end-to-end subscription flow
6. ⏳ Deploy to production

---

Last updated: 2025-11-21

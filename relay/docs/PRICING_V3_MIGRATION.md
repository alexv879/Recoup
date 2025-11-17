# Pricing V3 Migration Guide

**Implementation:** Phase 2 Task 8  
**Status:** Ready for deployment  
**Version:** 3.0 (3-Tier Rationalization)

---

## Overview

This guide covers the migration from our current 4-tier pricing (Free/Paid/Business/Pro) to a simplified 3-tier structure (Starter/Growth/Pro) with annual billing discounts.

### Key Changes

**Old Structure (4 tiers):**
- Free: £0/month (demo only)
- Paid: £24/month (legacy catch-all)
- Business: £49/month (mid-tier)
- Pro: £75/month (enterprise)

**New Structure (3 tiers):**
- Starter: £19/month or £182/year (10 collections, 1 user)
- Growth: £39/month or £374/year (50 collections, 5 users) ⭐ Most Popular
- Pro: £75/month or £720/year (unlimited, dedicated support)

### Benefits

- **Simpler decision-making:** 3 clear tiers vs 4 confusing options
- **Anchor pricing:** Pro listed first at £75, makes Growth (£39) appear as 47% discount
- **Decoy effect:** Growth is "best value" (50 collections for £39)
- **Annual discounts:** 20% savings (2.4 months free)
- **Better positioning:** Pricing psychology aligned with research

---

## Architecture

### New Files Created

#### 1. Components
- `components/Pricing/PricingPageV3.tsx` (520 lines)
  - 3-tier pricing cards with annual toggle
  - Feature comparison table
  - WCAG AAA accessible (7:1+ contrast, ARIA labels, keyboard nav)
  - Analytics tracking: `pricing_view_v3`, `pricing_toggle_annual`, `plan_upgrade_initiated`

#### 2. Feature Flags
- `lib/featureFlags.ts` (200 lines)
  - `PRICING_V3_ENABLED`: Master flag for V3 visibility
  - `PRICING_MIGRATION_MODE`: preview | active | complete
  - `PRICING_V3_ROLLOUT_PERCENTAGE`: 0-100 gradual rollout
  - Helper functions: `shouldShowPricingV3()`, `mapOldTierToV3()`, `getTierPrice()`

- `app/api/feature-flags/route.ts` (120 lines)
  - GET: Retrieve current flags (personalized for user)
  - POST: Update flags (admin only)

#### 3. Pricing Logic
- `lib/pricing.ts` (280 lines)
  - `PRICING_TIERS`: Complete tier definitions with features
  - `getTierPrice()`: Monthly or annual pricing
  - `getTierCollectionsLimit()`: Collections per tier
  - `calculateOverageCost()`: £1-2 per collection beyond limit
  - `getRecommendedUpgrade()`: Suggest upgrade if >80% limit usage
  - `calculateLTV()`: Lifetime value calculations

#### 4. Migration Script
- `scripts/migrate-stripe-plans.ts` (400 lines)
  - Dry-run mode: Test without changes (`--dry-run`)
  - Production mode: Execute migration (`--execute`)
  - Batch processing with rate limiting
  - Error handling with detailed logs
  - Creates Stripe prices and products
  - Sends migration emails

#### 5. Email Templates
- `lib/email-templates/freeTierMigration.ts` (180 lines)
  - Subject: "🎉 Unlock More Collections with Your Free Trial"
  - 30-day trial for Starter plan
  - HTML + plain text versions

- `lib/email-templates/businessTierMigration.ts` (220 lines)
  - Subject: "🚀 You've Been Upgraded to Pro"
  - 3-month price lock at old Business rate
  - Highlights Pro features

- `lib/email-templates/annualDiscountAnnouncement.ts` (240 lines)
  - Subject: "💰 Save £XX/year with Annual Billing"
  - Comparison table (monthly vs annual)
  - 20% savings messaging

#### 6. Analytics Events
- `schemas/events/pricing_view_v3.json` (30 lines)
- `schemas/events/pricing_toggle_annual.json` (updated, 40 lines)
- `schemas/events/plan_upgrade_initiated.json` (45 lines)

### Modified Files

- `types/models.ts` - User interface updated:
  - Added `'growth'` to `subscriptionTier` enum
  - New fields: `billingCycle`, `annualDiscountApplied`, `nextBillingDate`, `subscriptionStatus`
  - Updated comments for Pricing V3

- `lib/analytics.ts` - PricingEvent type updated:
  - Added `pricing_view_v3`
  - Added `plan_upgrade_initiated`
  - Updated `pricing_toggle_annual` documentation

---

## Migration Mapping

### Tier Transitions

| Old Tier | New Tier | Action | Communication |
|----------|----------|--------|---------------|
| free | starter | Auto-migrate + 30-day trial email | `freeTierMigration.ts` |
| paid | growth | Auto-migrate (silent) | None (seamless) |
| business | pro | Auto-migrate + 3-month price lock | `businessTierMigration.ts` |
| starter | starter | No change | None |
| pro | pro | No change | None |

### Price Lock Strategy

**Business → Pro Migration:**
- First 3 months: Keep current Business price (£49/month or actual)
- After 3 months: Transition to Pro price (£75/month)
- Reminder email sent 2 weeks before price change
- Option to switch to annual (£720/year) to save £180

---

## Deployment Steps

### Phase 1: Feature Flag Setup (Day 1)

1. **Initialize feature flags in Firestore:**

```bash
# Connect to Firebase Console
# Navigate to: Firestore Database > system_config > feature_flags

# Set initial values:
{
  "PRICING_V3_ENABLED": false,
  "PRICING_MIGRATION_MODE": "preview",
  "PRICING_V3_ROLLOUT_PERCENTAGE": 0,
  "updatedAt": "2025-11-16T00:00:00.000Z"
}
```

2. **Verify feature flag API:**

```bash
curl https://relay.app/api/feature-flags
# Expected response:
{
  "success": true,
  "flags": {
    "PRICING_V3_ENABLED": false,
    "PRICING_MIGRATION_MODE": "preview"
  },
  "userId": null
}
```

### Phase 2: Stripe Plan Creation (Day 2-3)

1. **Run migration script in dry-run mode:**

```bash
cd relay
node scripts/migrate-stripe-plans.ts --dry-run
```

Review output for any errors. Expected:
- Scanned users count
- Migration plan for each tier
- No actual changes made

2. **Create Stripe prices manually (optional):**

Alternatively, let migration script auto-create prices on execution.

### Phase 3: Internal QA (Day 4-7)

1. **Enable V3 for admins only:**

```bash
# Update feature flags via API or Firebase Console
{
  "PRICING_V3_ENABLED": true,
  "PRICING_MIGRATION_MODE": "preview",
  "PRICING_V3_ROLLOUT_PERCENTAGE": 0
}
```

2. **Manual testing checklist:**
   - [ ] Visit `/pricing` - V3 page loads
   - [ ] Annual toggle switches prices correctly
   - [ ] Starter CTA redirects to signup with `?plan=starter&billing=monthly`
   - [ ] Growth CTA redirects correctly (most popular badge visible)
   - [ ] Pro CTA redirects correctly
   - [ ] Feature comparison table displays all features
   - [ ] Keyboard navigation works (Tab, Enter, Space)
   - [ ] Screen reader announces prices on toggle
   - [ ] Mobile responsive (test on 375px, 768px, 1024px viewports)
   - [ ] Analytics events fire (check Mixpanel/console)

3. **Test migration script:**

Create test users in staging environment:
```bash
# Staging Firestore: Add test users with various tiers
# Run dry-run first
node scripts/migrate-stripe-plans.ts --dry-run

# Review logs, then execute
node scripts/migrate-stripe-plans.ts --execute
```

### Phase 4: Gradual Rollout (Day 8-14)

1. **10% rollout:**

```bash
# Update feature flags
{
  "PRICING_V3_ENABLED": true,
  "PRICING_MIGRATION_MODE": "active",
  "PRICING_V3_ROLLOUT_PERCENTAGE": 10
}
```

Monitor for 48 hours:
- Conversion rate (target: ≥10% trial-to-paid)
- Page load errors (Sentry)
- User feedback (support tickets)

2. **50% rollout (if 10% successful):**

```bash
{
  "PRICING_V3_ENABLED": true,
  "PRICING_MIGRATION_MODE": "active",
  "PRICING_V3_ROLLOUT_PERCENTAGE": 50
}
```

Monitor for 7 days.

3. **100% rollout:**

```bash
{
  "PRICING_V3_ENABLED": true,
  "PRICING_MIGRATION_MODE": "active",
  "PRICING_V3_ROLLOUT_PERCENTAGE": 100
}
```

### Phase 5: User Migration (Day 15-30)

**IMPORTANT:** Backup Firestore before executing!

1. **Pre-migration communication:**

Send announcement email to all users:
- Subject: "Introducing Simpler Pricing - More Value for You"
- Timeline: Migration happening in 7 days
- FAQ link: `/pricing-migration-faq`

2. **Execute migration:**

```bash
# PRODUCTION - NO DRY RUN
node scripts/migrate-stripe-plans.ts --execute
```

This will:
- Update Firestore user records
- Update Stripe subscriptions
- Send tier-specific emails

3. **Monitor migration:**

Check `migration-results-{timestamp}.json` file for:
- Total processed
- Successful migrations
- Errors (investigate and retry)

### Phase 6: Post-Migration (Day 31+)

1. **Mark migration complete:**

```bash
{
  "PRICING_V3_ENABLED": true,
  "PRICING_MIGRATION_MODE": "complete",
  "PRICING_V3_ROLLOUT_PERCENTAGE": 100
}
```

2. **Send follow-up emails:**

After 2-3 months, send annual discount emails to monthly users:
```typescript
import { getAnnualDiscountEmailHtml } from '@/lib/email-templates/annualDiscountAnnouncement';

// Send to users on monthly plans
// Target: 40% conversion to annual
```

---

## Testing Checklist

### Functional Tests

- [ ] **Pricing Page V3:**
  - [ ] All 3 tiers display correctly
  - [ ] Prices match spec (£19/£39/£75 monthly)
  - [ ] Annual toggle updates prices (£182/£374/£720)
  - [ ] "Most Popular" badge on Growth tier
  - [ ] 30-day trial CTA text on all tiers
  - [ ] Feature comparison table complete

- [ ] **Feature Flags:**
  - [ ] GET /api/feature-flags returns correct values
  - [ ] POST /api/feature-flags updates (admin only)
  - [ ] Rollout percentage works (test with user IDs)
  - [ ] `shouldShowPricingV3()` deterministic (same user always same result)

- [ ] **Migration Script:**
  - [ ] Dry-run mode lists all changes without executing
  - [ ] Execute mode updates Firestore
  - [ ] Stripe subscriptions updated correctly
  - [ ] Emails sent (check SendGrid logs)
  - [ ] Results file generated with summary

- [ ] **Email Templates:**
  - [ ] Free tier email renders (HTML + text)
  - [ ] Business tier email renders (HTML + text)
  - [ ] Annual discount email renders (HTML + text)
  - [ ] All links work (dashboard, pricing, billing settings)
  - [ ] Unsubscribe link present

### Accessibility Tests

- [ ] **Keyboard Navigation:**
  - [ ] Tab through all elements
  - [ ] Enter/Space activates buttons
  - [ ] Focus indicators visible (blue ring)

- [ ] **Screen Readers:**
  - [ ] ARIA labels read correctly
  - [ ] Price changes announced on toggle
  - [ ] Role="switch" on toggle button
  - [ ] Role="dialog" not used (static page)

- [ ] **Color Contrast:**
  - [ ] Text: 7:1+ ratio (WCAG AAA)
  - [ ] Buttons: 7:1+ ratio
  - [ ] Disabled states: 4.5:1+ ratio

### Analytics Tests

- [ ] **pricing_view_v3 fires:**
  - [ ] On page load
  - [ ] Contains variant: "v3_three_tier"
  - [ ] Contains user_id (if logged in)

- [ ] **pricing_toggle_annual fires:**
  - [ ] On toggle click
  - [ ] Contains billing_cycle (monthly or annual)
  - [ ] Contains current_tier

- [ ] **plan_upgrade_initiated fires:**
  - [ ] On CTA button click
  - [ ] Contains plan_id, plan_name, price
  - [ ] Contains billing_cycle

---

## Monitoring

### Success Metrics (Track in Mixpanel)

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Trial signups | 200-250/month | <150/month |
| Trial-to-paid conversion | 10-12% | <8% |
| Growth tier adoption | 50-60% | <40% |
| Annual billing rate | 35-40% | <25% |
| Starter → Growth upgrades | 15-20/month | <10/month |
| Growth → Pro upgrades | 5-10/month | <3/month |
| Monthly churn | 3-5% | >7% |
| ARPU (avg revenue per user) | £40-45 | <£35 |

### Mixpanel Funnels

**Funnel 1: Pricing Page → Signup**
1. pricing_view_v3
2. plan_upgrade_initiated
3. signup_started
4. signup_completed
5. subscription_activated

**Funnel 2: Annual Toggle → Conversion**
1. pricing_view_v3
2. pricing_toggle_annual (billing_cycle: annual)
3. plan_upgrade_initiated
4. subscription_activated

**Funnel 3: Tier Adoption**
- Segment by plan_id (starter/growth/pro)
- Track distribution over time
- Goal: 25% Starter, 55% Growth, 20% Pro

### Sentry Alerts

Monitor for errors:
- Stripe API failures (subscription update errors)
- Firestore write failures (migration script)
- SendGrid email delivery failures
- Feature flag fetch errors

---

## Rollback Procedure

### Emergency Rollback (If Critical Issues)

1. **Disable Pricing V3 immediately:**

```bash
# Via Firebase Console or API
{
  "PRICING_V3_ENABLED": false,
  "PRICING_MIGRATION_MODE": "preview",
  "PRICING_V3_ROLLOUT_PERCENTAGE": 0
}
```

This reverts all users to old pricing page.

2. **Revert Stripe subscriptions (if needed):**

```bash
# Manual script to revert each user
# Example for one user:
stripe subscriptions update sub_xxx \
  --items[0][price]=price_old_business_tier
```

3. **Send apology email:**

Template: "We're Making Improvements - Pricing Page Temporarily Unavailable"

### Partial Rollback (If Specific Tier Issues)

1. **Identify problematic tier** (e.g., Growth tier signup broken)

2. **Disable only that tier:**

Edit `components/Pricing/PricingPageV3.tsx`:
```typescript
// Temporarily hide Growth tier
const PRICING_TIERS = [
  // ... Pro tier
  // ... Starter tier (skip Growth)
];
```

3. **Deploy hotfix within 1 hour**

### Post-Rollback Actions

1. Investigate root cause (check Sentry, Mixpanel, user feedback)
2. Fix issue in development
3. Test fix extensively in staging
4. Re-deploy with gradual rollout (10% → 50% → 100%)

---

## Communication Strategy

### Email Timeline

**T-14 days:** Announcement email
- Subject: "Introducing Simpler Pricing - More Value for You"
- Target: All users
- CTA: "Preview New Pricing"

**T-7 days:** Reminder email
- Subject: "New Pricing Goes Live in 7 Days"
- Target: All users
- CTA: "See Your New Plan"

**T-0 (Migration Day):** Tier-specific emails
- Free users: 30-day trial offer
- Business users: Pro upgrade with price lock
- Paid users: Silent migration (no email)

**T+7 days:** Follow-up email
- Subject: "Welcome to Your New Plan - Here's What Changed"
- Target: All migrated users
- FAQ link

**T+60 days:** Annual discount campaign
- Target: Monthly subscribers
- Goal: Convert 40% to annual

### Support Resources

1. **FAQ Page:** `/pricing-migration-faq`
   - "Why did my plan change?"
   - "What happens to my current billing?"
   - "Can I keep my old price?"
   - "How do I upgrade/downgrade?"

2. **In-App Notification:**
   - Banner: "New pricing now live! [Learn More]"
   - Dismissible after first view

3. **Support Ticket Templates:**
   - "Pricing Migration: Tier Change Questions"
   - "Pricing Migration: Billing Issues"
   - "Pricing Migration: Feature Access"

---

## Troubleshooting

### Issue 1: Feature Flag Not Applying

**Symptom:** User sees old pricing page despite V3 enabled

**Causes:**
- Browser cache
- Feature flag not synced from Firestore
- Rollout percentage excludes user

**Solutions:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check Firestore: `system_config/feature_flags` document exists
3. Check rollout: `shouldShowPricingV3(userId, percentage)` returns true

### Issue 2: Migration Script Fails

**Symptom:** Errors in migration results JSON file

**Common Errors:**
- "Missing Stripe subscription or customer ID" → User has no Stripe data, skip or manually fix
- "Stripe API error: rate_limit" → Script hitting rate limits, add delays between batches
- "Firestore permission denied" → Service account lacks write permissions

**Solutions:**
1. Review `migration-results-{timestamp}.json` for specific errors
2. Retry failed users individually:
   ```bash
   node scripts/migrate-single-user.ts --userId=user_xxx
   ```
3. Check Stripe API logs in Dashboard

### Issue 3: Emails Not Sending

**Symptom:** Users not receiving migration emails

**Causes:**
- SendGrid API key invalid
- Email template errors (syntax or data)
- User email bounced/unsubscribed

**Solutions:**
1. Check SendGrid activity logs: Dashboard → Email Activity
2. Test email template:
   ```typescript
   import { getFreeTierMigrationEmailHtml } from '@/lib/email-templates/freeTierMigration';
   console.log(getFreeTierMigrationEmailHtml({ name: 'Test', email: 'test@example.com', userId: 'test' }));
   ```
3. Verify user email in Firestore (not bounced)

### Issue 4: Annual Toggle Not Working

**Symptom:** Prices don't update when toggle clicked

**Causes:**
- React state not updating
- Analytics event blocking state change
- Cached component

**Solutions:**
1. Check browser console for errors
2. Verify `isAnnual` state in React DevTools
3. Test `handleToggleAnnual()` function in isolation

### Issue 5: Stripe Subscription Update Fails

**Symptom:** User stays on old tier despite migration

**Causes:**
- Stripe subscription paused/canceled
- Payment method expired
- Proration settings incorrect

**Solutions:**
1. Check Stripe subscription status: Dashboard → Subscriptions
2. Update subscription manually in Stripe Dashboard
3. Re-run migration for specific user:
   ```bash
   node scripts/migrate-stripe-plans.ts --execute --userId=user_xxx
   ```

---

## Appendix

### Pricing Calculation Reference

```typescript
// Starter
monthlyPrice: £19
annualPrice: £19 × 12 × 0.8 = £182.40 → £182 (rounded down)
annualSavings: (£19 × 12) - £182 = £228 - £182 = £46

// Growth
monthlyPrice: £39
annualPrice: £39 × 12 × 0.8 = £374.40 → £374 (rounded down)
annualSavings: (£39 × 12) - £374 = £468 - £374 = £94

// Pro
monthlyPrice: £75
annualPrice: £75 × 12 × 0.8 = £720
annualSavings: (£75 × 12) - £720 = £900 - £720 = £180
```

### Collections Limits

| Tier | Monthly Limit | Overage Cost |
|------|---------------|--------------|
| Starter | 10 | £2 per collection |
| Growth | 50 | £1.50 per collection |
| Pro | Unlimited | N/A |

### Feature Matrix

| Feature | Starter | Growth | Pro |
|---------|---------|--------|-----|
| Collections/month | 10 | 50 | Unlimited |
| Team members | 1 | 5 | Unlimited |
| Email reminders | ✓ | ✓ | ✓ |
| SMS reminders | — | ✓ | ✓ |
| WhatsApp reminders | — | ✓ | ✓ |
| Phone calls | — | — | ✓ |
| Payment verification | — | ✓ | ✓ |
| Escalation automation | — | ✓ | ✓ |
| AI analytics | — | Basic | Advanced |
| Custom workflows | — | — | ✓ |
| API access | — | — | ✓ |
| Support response | 48h | 24h | 2h |
| Dedicated manager | — | — | ✓ |

---

**Document Version:** 1.0  
**Created:** November 2025  
**Phase:** 2 (Weeks 4-6)  
**Research Sources:** 
- pricing-implementation-framework.md
- saas-pricing-optimization-guide.md
- VIRAL_SAAS_STRATEGY.md

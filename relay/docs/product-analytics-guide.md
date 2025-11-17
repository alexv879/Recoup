# PRODUCT ANALYTICS FOR SAAS APPLICATIONS

**Complete Guide: Tools, Metrics, Events & Implementation**

---

## PART 1: ANALYTICS TOOLS COMPARISON

### 1.1 Product Analytics Tools: Mixpanel vs Amplitude vs Heap vs PostHog

| Feature | Mixpanel | Amplitude | Heap | PostHog |
|---------|----------|-----------|------|---------|
| **Setup** | Requires engineering | Requires engineering | Autocapture (no coding) | Flexible (code/autocapture) |
| **Pricing Model** | Event-based | Monthly Tracked Users (MTUs) | Session-based | Usage-based |
| **Free Tier** | 1M events/month | 50,000 MTUs/month | 10,000 sessions/month | 3M events + 1M recordings/month |
| **Starter Plan** | $20+/month (20M events) | $49/month (300k MTUs) | $3,600/year (usage-based) | Usage-based (pay-as-you-go) |
| **Enterprise** | $833+/month | $995+/month (custom) | Custom quotes | Custom pricing |
| **Session Replay** | Limited | Limited | Full (included) | Yes (included) |
| **Autocapture** | No (manual events) | No (manual events) | Yes (all clicks tracked) | Yes (via SDK) |
| **Retention Analysis** | ✓ Cohorts, ✓ Funnels | ✓ Cohorts, ✓ Funnels | ✓ Cohorts, ✓ Funnels | ✓ Cohorts, ✓ Funnels |
| **A/B Testing** | Via third-party | Built-in | Via third-party | Built-in |
| **Feature Flags** | Via third-party | Built-in | Via third-party | Built-in |
| **Best For** | Growth/product teams | Enterprise SaaS | UX/product analytics | Open-source, startups |
| **Learning Curve** | Steep | Steep | Moderate | Moderate |

---

### **Recommendation by Use Case:**

**For SaaS invoicing/collections software:**
- **Small teams (0-50 people):** PostHog (free tier is generous, all features included)
- **Growth-focused:** Mixpanel (best funnel analysis + segmentation)
- **Enterprise-ready:** Amplitude (better cross-platform, designed for scale)
- **Product-focused:** Heap (easiest setup, autocapture eliminates manual event tracking)

---

### 1.2 Session Replay Tools: LogRocket vs FullStory vs Hotjar

| Feature | LogRocket | FullStory | Hotjar | OpenReplay |
|---------|-----------|-----------|--------|-----------|
| **Session Replay** | ✓ Full console/network | ✓ Comprehensive | ✓ Basic | ✓ Full |
| **Error Tracking** | ✓ JavaScript errors | ✓ Limited | ✗ None | ✓ Yes |
| **Performance Monitoring** | ✓ Page load, responsiveness | ✓ Performance metrics | ✗ None | ✓ Yes |
| **Heatmaps** | ✓ Yes | ✓ Yes | ✓ Yes (main feature) | Limited |
| **Funnel Analysis** | ✓ Limited | ✓ Yes | ✓ Yes | ✓ Yes |
| **Best For** | Developers/engineers | Product teams | Marketers | Budget-conscious devs |
| **Pricing** | $99-399/month | Starting ~$500-1k/month | $99-549/month | Open-source (free) |
| **Primary Use** | Debug issues + perf | Customer support insights | A/B testing + feedback | Developer debugging |

**Recommendation:** Use LogRocket or FullStory alongside your product analytics (Mixpanel/Amplitude) for debugging user issues. Hotjar is better for heatmaps and marketing optimization.

---

## PART 2: EVENT TRACKING SCHEMA

### 2.1 Core Events to Track (20+ Events for Invoicing Software)

#### **ACQUISITION EVENTS** (How users find you)

```
Event: user_signed_up
Properties:
  - signup_source (organic, referral, paid_ad, email)
  - utm_source (google, facebook, linkedin)
  - utm_campaign (Q4_campaign, referral_promo)
  - utm_medium (cpc, organic, email)
  - utm_content (top_banner, footer_link)
  - signup_date
  - user_plan (free, trial, pro, enterprise)

Event: utm_tracked
Properties:
  - utm_source
  - utm_medium
  - utm_campaign
  - utm_content
  - utm_term (for search)
  - referrer_url

Event: referral_source
Properties:
  - referred_by (user_id)
  - referral_source_name (word_of_mouth, product_hunt, blog)
```

**Purpose:** Track where acquisition is coming from to optimize marketing spend.[136][133]

---

#### **ACTIVATION EVENTS** (Key value moments)

```
Event: onboarding_started
Properties:
  - step_1_begun
  - timestamp

Event: onboarding_completed
Properties:
  - all_steps_completed
  - total_time_minutes
  - steps_skipped (number)

Event: first_invoice_created
Properties:
  - invoice_amount
  - client_count
  - time_to_first_invoice_minutes
  - client_name

Event: first_invoice_sent
Properties:
  - invoice_id
  - send_method (email, manual)
  - recipient_email
  - time_to_first_send_hours

Event: payment_received
Properties:
  - invoice_id
  - payment_amount
  - payment_method (bank, card, paypal)
  - time_to_payment_days
  - payment_status (on_time, late, early)

Event: first_reminder_sent
Properties:
  - reminder_type (automated, manual)
  - reminder_level (1st, 2nd, 3rd, final_notice)
  - invoice_age_days
```

**Purpose:** Measure activation rate (% reaching first value), time-to-first-value (TTFV), time-to-activation.[138][139][140]

**Key Metrics:** 
- TTV under 15 min = 4-5x higher Day 7 retention
- TTV under 1 hour = 2-3x higher Day 7 retention[140]
- Target activation rate: 60%+[141]

---

#### **ENGAGEMENT EVENTS** (How much users use the product)

```
Event: invoice_list_viewed
Properties:
  - view_type (all, overdue, pending, paid)
  - filters_applied (yes/no)
  - invoices_shown (count)

Event: dashboard_viewed
Properties:
  - dashboard_type (overview, collections, analytics)
  - chart_viewed (revenue_trend, status_breakdown)
  - filter_used (date_range, client, status)

Event: feature_used
Properties:
  - feature_name (bulk_reminders, sms_alerts, voice_input, integrations)
  - feature_category (invoicing, collections, automation)
  - usage_count (daily)
  - time_in_feature_seconds

Event: client_profile_viewed
Properties:
  - client_id
  - invoice_count
  - total_outstanding

Event: filter_applied
Properties:
  - filter_type (date, status, client, payment_method)
  - filter_value (example values)

Event: export_clicked
Properties:
  - export_format (pdf, csv, email)
  - data_range (7d, 30d, 90d, ytd)
  - export_success (yes/no)

Event: settings_changed
Properties:
  - setting_name (late_payment_interest, reminder_schedule)
  - old_value
  - new_value
```

**Purpose:** Measure DAU (Daily Active Users), WAU (Weekly Active Users), MAU (Monthly Active Users), and feature adoption rates.[134][127]

**Engagement Ratios:**
- DAU/MAU ratio: 0.5 is gold standard (50% of MAU active daily)[134]
- WAU/MAU ratio: Shows weekly engagement consistency
- DAU/WAU ratio: Among weekly users, % active daily

---

#### **MONETIZATION EVENTS** (Free-to-paid conversion)

```
Event: upgrade_triggered
Properties:
  - trigger_reason (quota_hit, feature_locked, manual_click)
  - quota_name (invoices, clients, reminders)
  - current_plan (free, trial)
  - target_plan (pro, pro_plus, enterprise)
  - trigger_date

Event: upgrade_completed
Properties:
  - plan_selected (pro, pro_plus, enterprise)
  - plan_price (monthly or annual)
  - billing_cycle (monthly, annual)
  - payment_method (card, invoice)
  - upgrade_time_days_from_signup

Event: trial_started
Properties:
  - trial_plan (pro_trial)
  - trial_duration_days

Event: trial_ended
Properties:
  - trial_converted (yes/no)
  - conversion_plan (if yes)
  - reason_for_churn (if no - optional user-provided)

Event: payment_failed
Properties:
  - payment_method
  - error_code
  - retry_count

Event: downgrade_attempted
Properties:
  - current_plan
  - target_plan
  - reason (if provided)
```

**Purpose:** Track free-to-paid conversion funnel, time-to-upgrade, upgrade triggers.[146]

**Key Metrics:**
- Free-to-paid conversion rate: (Paying customers / Free users) × 100
- Time to conversion: Days from signup to first paid conversion
- Upgrade triggers: Quota hits, feature locks, time-based offers

---

#### **RETENTION & CHURN EVENTS** (User stickiness)

```
Event: session_started
Properties:
  - session_id
  - user_id
  - session_date
  - session_day_of_week

Event: session_ended
Properties:
  - session_id
  - session_duration_minutes
  - invoices_actioned (count)

Event: inactivity_warning
Properties:
  - days_since_last_login
  - warning_sent_date

Event: churn_signal
Properties:
  - signal_type (no_login_7d, no_login_14d, feature_never_used)
  - user_segment (free, trial, pro)

Event: account_cancelled
Properties:
  - cancellation_date
  - days_active (total)
  - plan_at_cancellation
  - cancellation_reason (provided via survey)
  - mau_on_cancellation (last active date)

Event: account_reactivated
Properties:
  - reactivation_date
  - days_since_cancellation
  - reactivation_reason (email, in-product prompt)
```

**Purpose:** Measure Day 7, Day 30, Day 60, Day 90 retention by cohort.[147][144]

**Retention Benchmarks:**
- Day 7 retention: 60%+ (excellent)
- Day 30 retention: 40-60% (typical for SaaS)
- Day 90 retention: 30-50%
- Monthly churn (B2B SaaS): 1% or less[147]

---

### 2.2 Event Naming Convention (Best Practices)

Use consistent naming across all events:

```
Format: [object]_[action]
Examples:
- invoice_created (not "new_invoice" or "invoice_gen")
- payment_received (not "payment_done" or "got_paid")
- reminder_sent (not "email_reminder" or "reminder_output")
- user_signed_up (not "signup" or "registration")

Naming Rules:
✓ Use snake_case (lowercase with underscores)
✓ Use past tense for completed actions
✓ Use present tense for ongoing states
✓ Keep names short but descriptive (<30 chars)
✓ Avoid marketing/sales language
✓ Use consistent prefixes (invoice_*, reminder_*, payment_*)
```

---

## PART 3: FUNNEL ANALYSIS

### 3.1 Key Conversion Funnels

**Funnel 1: Free Signup → First Value → Upgrade**

```
Step 1: Visitor Lands on Site
- Users: 10,000
- Conversion: 100%

Step 2: Sign Up (Free Account)
- Users: 1,500
- Conversion: 15% (from visitor)
- Drop-off: 8,500 (85%)

Step 3: Complete Onboarding
- Users: 1,050
- Conversion: 70% (from signups)
- Drop-off: 450 (30% of signups)

Step 4: Create First Invoice
- Users: 840
- Conversion: 80% (from onboarded)
- Drop-off: 210 (20%)

Step 5: Send First Invoice
- Users: 756
- Conversion: 90% (from created)
- Drop-off: 84 (10%)

Step 6: Receive First Payment
- Users: 604
- Conversion: 80% (from sent)
- Drop-off: 152 (20%)

Step 7: Upgrade to Paid Plan
- Users: 181
- Conversion: 30% (from paid invoicers)
- Drop-off: 423 (70%)

FINAL CONVERSION: 181 / 10,000 = 1.8% from visitor → paid customer
```

**Optimization Opportunities:**
- Step 2 (15% signup rate): Reduce friction in signup form
- Step 3 (30% drop-off): Simplify onboarding steps
- Step 7 (70% don't upgrade): Better monetization messaging

---

**Funnel 2: Collections Workflow**

```
Step 1: Invoice Created
- Invoices: 5,000/month
- Conversion: 100%

Step 2: Invoice Sent
- Invoices: 4,750
- Conversion: 95% (sent within 24hrs)
- Drop-off: 250 (never sent)

Step 3: Payment Received (On-time)
- Invoices: 3,325
- Conversion: 70% (within 30 days)
- Drop-off: 1,425 (30% overdue/unpaid)

Step 4: First Reminder Sent (to overdue)
- Invoices: 1,000
- Conversion: 70% (of overdue invoices)
- Drop-off: 425 (no reminder sent)

Step 5: Payment After Reminder
- Invoices: 550
- Conversion: 55% (of reminded invoices)
- Drop-off: 450 (still unpaid after reminder)

Step 6: Final Notice / Escalation
- Invoices: 350
- Conversion: 78% (of those sent final notice)
- Drop-off: 100 (still not paid)

OVERALL RECOVERY RATE: (3,325 + 550 + 350) / 5,000 = 82.5% collected
REMINDER EFFECTIVENESS: 550 paid out of 1,000 reminded = 55% conversion[97]
```

---

### 3.2 Segment-Based Funnels

**By Acquisition Source:**

```
Organic Traffic Signup → Upgrade Funnel:
Signup: 300 users
Create Invoice: 270 (90%)
Upgrade: 108 (40% of invoice creators)
Conversion: 36%

Paid Ad Signup → Upgrade Funnel:
Signup: 150 users
Create Invoice: 105 (70%)
Upgrade: 26 (25% of invoice creators)
Conversion: 17%

Referral Signup → Upgrade Funnel:
Signup: 120 users
Create Invoice: 108 (90%)
Upgrade: 49 (45% of invoice creators)
Conversion: 41%

→ Finding: Organic + referral users convert 2-3x better than paid ads
```

**By User Segment:**

```
Solopreneurs:
Signup: 500
First Invoice: 450 (90%)
Upgrade: 135 (30%)
Conversion: 27%

Small Agencies (2-10 staff):
Signup: 300
First Invoice: 285 (95%)
Upgrade: 114 (40%)
Conversion: 38%

Enterprise (100+ staff):
Signup: 50
First Invoice: 50 (100%)
Upgrade: 35 (70%)
Conversion: 70%

→ Finding: Enterprise users convert 2.6x better, justify enterprise support
```

---

## PART 4: RETENTION & COHORT ANALYSIS

### 4.1 Cohort Retention Table

```
Cohort (Month Signed Up) | Week 1 | Week 4 | Month 1 | Month 2 | Month 3
January                  | 100%   | 75%    | 70%     | 55%     | 45%
February                 | 100%   | 78%    | 72%     | 58%     | 48%
March                    | 100%   | 81%    | 75%     | 62%     | 52%
April                    | 100%   | 83%    | 78%     | 65%     | 55%
May                      | 100%   | 85%    | 80%     | 68%     | 58%

Insights:
- Month 3 retention improving (Jan 45% → May 58%)
- April cohort trend positive (+3% vs March)
- Week 1-4 drop-off = 15-20% (normal for SaaS)
- Target: Get Week 4 retention to 90%
```

---

### 4.2 Retention by Activation Status

```
ACTIVATED USERS (Created first invoice within 24hrs):
Day 7:  80%
Day 30: 65%
Day 60: 52%
Day 90: 45%

NON-ACTIVATED USERS (Never created invoice):
Day 7:  15%
Day 30: 8%
Day 60: 4%
Day 90: 2%

→ Finding: Activation drives 5-22x higher retention[141]
```

---

### 4.3 Churn Reasons & Cohort Analysis

```
Monthly Churn Rate by Reason:
- Pricing too high: 35%
- Missing features: 25%
- Found competitor: 15%
- Company scale down: 15%
- Technical issues: 10%

Action Plan:
- Pricing: Create tier (Pro → Enterprise) addressing 35%
- Features: Build top 3 missing (voice input, SMS, mobile) addressing 25%
- Competitors: Improve UX/onboarding addressing 15%
```

---

## PART 5: KEY METRICS DASHBOARD

### Core AARRR (Pirate) Metrics

```
ACQUISITION:
- Monthly Signups: 500
- Signup Source Breakdown: Organic 40%, Paid Ads 35%, Referral 25%
- Cost Per Acquisition (CPA): £8.50

ACTIVATION:
- Activation Rate: 65% (created first invoice)
- Time to First Value: 2.5 hours (median)
- Onboarding Completion: 78%
- Feature Adoption Rate: 24.5%

RETENTION:
- Day 7: 72%
- Day 30: 58%
- Day 90: 45%
- DAU/MAU: 0.45 (monthly active users daily)
- WAU/MAU: 0.72 (weekly active users monthly)

REVENUE (Monetization):
- Free-to-Paid Conversion: 18%
- Time to Upgrade: 8 days (median)
- Monthly Recurring Revenue (MRR): £12,500
- Average Revenue Per User (ARPU): £28
- Customer Lifetime Value (CLV): £280 (10 months avg)

REFERRAL:
- Referral Rate: 12% (paid users referring others)
- Viral Coefficient: 1.15 (each user refers 1.15 others)
- Referral Conversion: 35% (referred signups → paid)
```

---

**Implementation Version:** 1.0  
**Last Updated:** November 2025  
**For Use With:** Mixpanel, Amplitude, Heap, PostHog
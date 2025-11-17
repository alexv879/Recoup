# SaaS Product Analytics Strategy – Relay
## Complete Guide to Event Tracking, Funnels & Retention

---

## PART 1: ANALYTICS TOOLS COMPARISON

### 1. Mixpanel vs Amplitude vs Heap[116][117][119][120]

**Fundamental Differences[119][120]:**

The three leading product analytics platforms differ in core philosophy:
- **Amplitude:** Event-based (requires upfront instrumentation planning)
- **Mixpanel:** Granular event tracking (emphasis on real-time analysis)
- **Heap:** Automatic event capture (retroactive analysis without planning)

---

### Mixpanel – Best for Real-Time Event Analysis[116][119]

**Key Characteristics:**
- **Pricing:** Free tier (1M events/month), then $0.00028 per additional event[121]
- **Best for:** Teams with clear KPIs who want real-time dashboards
- **Event model:** Manual instrumentation required upfront
- **Setup time:** 3-7 days to instrument properly
- **Data latency:** Near real-time updates (minutes)

**Strengths:**
- ✅ Real-time dashboards (immediate event visibility as they occur)
- ✅ Granular event properties (track exactly what you need)
- ✅ Developer-friendly API
- ✅ Cross-platform consistency

**Weaknesses:**
- ❌ Requires extensive planning before implementation
- ❌ Steeper learning curve
- ❌ More expensive at scale (event-based pricing)

**Ideal for Relay:** YES – If you have clear event taxonomy and want to monitor real-time user behavior (invoice creation, reminders sent, etc.)

**Estimated Cost (Relay):**
- Free tier: 1M events/month
- Light usage (10K+ users): ~$500-1,000/month
- Growth phase (50K+ users): ~$2,000-5,000/month

---

### Amplitude – Best for Behavioral Analysis & Cohorts[116][119][120]

**Key Characteristics:**
- **Pricing:** Free tier (50K Monthly Tracked Users), Plus plan $49/month[121]
- **Best for:** PLG companies, product teams analyzing behavioral patterns
- **Event model:** Instrumented (manual) with limited auto-capture
- **Setup time:** 3-7 days
- **Data latency:** Quick processing (varies by complexity)

**Strengths:**
- ✅ Exceptional behavioral cohort analysis
- ✅ Predictive analytics (AI-powered insights)
- ✅ Multi-product tracking (for complex products)
- ✅ Revenue attribution modeling
- ✅ Warehouse connectivity (enterprise data)

**Weaknesses:**
- ❌ Requires event planning upfront
- ❌ Complex queries may take longer
- ❌ MTU-based pricing (charges per tracked user)

**Ideal for Relay:** YES – Especially for understanding which user segments convert to paid, retention cohorts by signup source

**Estimated Cost (Relay):**
- Free tier: 50K MTUs
- Growth: $49-99/month
- Scale (100K+ MTUs): Custom pricing

---

### Heap – Best for Rapid Deployment[116][119][120]

**Key Characteristics:**
- **Pricing:** Free tier (10K sessions/month), then custom pricing ($40K-120K/year typical)[121]
- **Best for:** Early-stage teams, rapid iteration
- **Event model:** Automatic capture (zero instrumentation needed)
- **Setup time:** Minutes (code snippet deployment)
- **Data latency:** Slight delay as platform processes all interactions

**Strengths:**
- ✅ Get data in MINUTES (no planning required)
- ✅ Retroactive analysis (discover metrics after the fact)
- ✅ No decision paralysis on what to track
- ✅ Visual event definition (non-technical users can create events)

**Weaknesses:**
- ❌ Captures EVERYTHING (data bloat)
- ❌ Expensive at scale (session-based pricing)
- ❌ Less suitable for real-time monitoring
- ❌ Complex queries may be slower

**Ideal for Relay:** MAYBE – Good if you want quick setup and exploration, but becomes expensive as you scale

**Estimated Cost (Relay):**
- Free tier: 10K sessions/month
- Light usage: $40-50K/year
- Growth: $100K+/year

---

### Comparison Matrix

| Feature | Mixpanel | Amplitude | Heap |
|---------|----------|-----------|------|
| **Setup Speed** | 3-7 days | 3-7 days | Minutes |
| **Event Instrumentation** | Manual (required) | Manual (required) | Automatic (zero) |
| **Real-Time Dashboards** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Cohort Analysis** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Pricing Complexity** | Event-based | MTU-based | Session-based |
| **Free Tier Generosity** | ⭐⭐⭐⭐ (1M events) | ⭐⭐⭐ (50K MTU) | ⭐ (10K sessions) |
| **PLG/Freemium Focus** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Enterprise Features** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

**Recommendation for Relay:** Start with **Mixpanel** (best free tier + real-time for monitoring user activation) or **Amplitude** (better for understanding conversion patterns). Both are industry leaders for SaaS product analytics.

---

### 2. Session Replay Tools: LogRocket vs FullStory vs Hotjar[126][127][129][130][132]

**Use Case:** Understand WHY users are dropping off funnels (qualitative insights to complement quantitative analytics)

---

### LogRocket – Best for Developers (Error Tracking)[129][130][132]

**Focus:** Technical performance + error tracking + session replay

**Best Features:**
- ✅ AI-first approach (Galileo AI recommends impactful sessions)
- ✅ Conditional recording (capture only relevant sessions)
- ✅ Console logs + network requests
- ✅ Front-end performance monitoring
- ✅ Error tracking (ties sessions to JS errors)

**Ideal For:** Dev teams debugging issues

**Pricing:** Custom (typically $400-1,000+/month for meaningful usage)

---

### FullStory – Best for UX Analytics[129][130][132]

**Focus:** User experience + session replay + heatmaps

**Best Features:**
- ✅ Records EVERY user session
- ✅ Heatmaps (click tracking)
- ✅ Rage click detection (user frustration indicator)
- ✅ Form analytics (where users abandon?)
- ✅ Digital experience monitoring

**Ideal For:** Product + UX teams optimizing user flows

**Pricing:** Custom (typically $500-2,000+/month)

---

### Hotjar – Best for Budget-Conscious Teams[126][127][130]

**Focus:** Session replay + heatmaps + surveys + feedback

**Best Features:**
- ✅ Affordable entry point ($32/month)
- ✅ Heatmaps (visual engagement)
- ✅ Session recordings
- ✅ Built-in surveys
- ✅ User feedback tools

**Ideal For:** Early-stage teams on budget

**Pricing:** Starts at $32/month (Observe Plus plan)

---

**Session Replay Recommendation for Relay:**
- **Start:** Hotjar ($32-80/month) for early exploration + feedback collection
- **Scale:** Upgrade to FullStory when you need deeper UX analytics + heatmaps
- **For Developers:** Add LogRocket for error tracking + performance monitoring

**Why session replay matters for freemium onboarding:**
Session replays reveal why users aren't creating invoices (confusion? unclear navigation? buried button?) even when quantitative data shows drop-offs. Combined with product analytics, session replay is invaluable.

---

## PART 2: EVENT TRACKING SCHEMA FOR RELAY

### 20+ Events to Track (Acquisition through Retention)

Building a comprehensive event schema ensures you capture behavior at every stage of the funnel.

---

### ACQUISITION EVENTS (Source Tracking)

Track where users come from to understand which channels drive conversions.

| Event | Properties | Purpose | Frequency |
|-------|-----------|---------|-----------|
| **signup_initiated** | utm_source, utm_medium, utm_campaign, referrer_url | First touch attribution | Per signup |
| **signup_completed** | signup_method (email/google/linkedin), plan_tier (free vs trial), email_domain (company or personal) | Understand signup completion | Per signup |
| **email_verified** | days_to_verify | Measure conversion momentum | Per verified user |
| **referral_applied** | referral_code, referral_source | Track viral/referral growth | Per referral |

---

### ACTIVATION EVENTS (Aha Moment)

Track key actions that indicate user has experienced product value.

| Event | Properties | Purpose | Frequency |
|-------|-----------|---------|-----------|
| **first_invoice_created** | invoice_amount_gbp, invoice_type (freelance/agency) | Core activation metric | Per user (first) |
| **invoice_details_filled** | fields_completed (client name, amount, due date) | Onboarding progress | Per invoice |
| **invoice_sent_to_client** | send_method (email/link), invoice_number | Actual engagement with product | Per invoice |
| **first_reminder_set** | reminder_type (email/sms), reminder_count | Engagement with core feature | Per user (first) |
| **payment_received_via_relay** | invoice_amount_gbp, days_to_payment, payment_source | Tangible value achieved | Per payment |

---

### ENGAGEMENT EVENTS (Feature Usage)

Track how users engage with key features.

| Event | Properties | Purpose | Frequency |
|-------|-----------|---------|-----------|
| **invoice_view** | invoice_id, time_on_page | Usage tracking | Per view |
| **reminder_delivered** | reminder_type (email/sms), client_response (opened/not), delay_since_due | Feature engagement | Per reminder |
| **report_generated** | report_type (cash flow/collections/client), report_date_range | Feature adoption | Per report |
| **automation_rule_created** | rule_type (auto-reminder/escalation) | Engagement with automations | Per rule |
| **settings_updated** | setting_type (payment terms/reminder frequency) | Customization engagement | Per update |
| **help_content_viewed** | article_id, content_type (guide/FAQ/video) | Onboarding + education | Per view |

---

### MONETIZATION EVENTS (Upgrade & Revenue)

Track conversion from free to paid.

| Event | Properties | Purpose | Frequency |
|-------|-----------|---------|-----------|
| **upgrade_cta_shown** | cta_type (in-app banner/email/checkout), trigger_reason (usage limit/trial ending) | Conversion funnel | Per user |
| **upgrade_cta_clicked** | cta_type, cta_position | Intent signal | Per click |
| **upgrade_started** | plan_selected (pro/enterprise), billing_cycle (monthly/annual) | Conversion progress | Per start |
| **payment_failed** | payment_method, failure_reason (expired card/insufficient funds) | Revenue leakage | Per failure |
| **subscription_activated** | plan_tier, annual_contract_value_gbp, payment_method | Revenue achieved | Per new subscription |
| **invoice_dispute_filed** | invoice_amount_gbp, dispute_type (partial/full), time_since_due | Pro feature usage (early indicator of engagement) | Per dispute |

---

### RETENTION EVENTS (Ongoing Usage)

Track whether users continue to engage.

| Event | Properties | Purpose | Frequency |
|-------|-----------|---------|-----------|
| **user_login** | login_method, days_since_last_login | Activity tracking | Per login |
| **subscription_renewed** | plan_tier, renewal_amount_gbp | Retention metric | Per renewal |
| **subscription_cancelled** | plan_tier, reason_for_cancel (feature gaps/price/found alternative), time_subscribed_days | Churn tracking | Per cancellation |
| **feature_stopped_using** | feature_type (invoicing/reminders/disputes), days_since_last_use | Churn indicator | Per feature |

---

### Event Schema Example (JSON Format)

```json
{
  "event_name": "first_invoice_created",
  "user_id": "user_12345",
  "timestamp": "2025-11-15T14:32:00Z",
  "properties": {
    "invoice_amount_gbp": 2500,
    "invoice_type": "freelance",
    "client_name": "Acme Corp",
    "time_to_first_invoice_minutes": 45,
    "utm_source": "organic_search",
    "utm_campaign": "blog_late_payments",
    "signup_date": "2025-11-15T13:47:00Z"
  },
  "user_properties": {
    "plan_tier": "free",
    "account_age_days": 0,
    "email_domain": "gmail.com",
    "signup_source": "organic_search"
  }
}
```

---

## PART 3: FUNNEL ANALYSIS FOR RELAY

### Critical Funnels to Track[135][136][137][141]

---

### FUNNEL 1: Signup → Activation → Upgrade

**What It Measures:** Path to conversion for new users

**Stages:**

```
Stage 1: Signup Completed
  ↓ (100% = baseline)
  
Stage 2: Email Verified
  ↓ (Target: 90%+ of signups verify)
  
Stage 3: First Invoice Created (ACTIVATION)
  ↓ (Target: 20-30% of signups create invoice)
  
Stage 4: First Invoice Sent to Client
  ↓ (Target: 15-20% of signups send invoice)
  
Stage 5: Pro Upgrade (MONETIZATION)
  ↓ (Target: 5-8% of signups upgrade by Day 14)
```

**Expected Funnel Performance (Benchmark):**

```
100 signups
→ 90 verify email (90%)
→ 25 create invoice (25% of signups, 28% of verified)
→ 18 send to client (18% of signups, 72% of invoice creators)
→ 5-8 upgrade to Pro (5-8% of signups)
```

**Drop-Off Analysis by Stage:**

| Stage | Common Reason for Drop-Off | Solution |
|-------|---|---|
| Signup → Email Verify | Email verification email missed (spam) | Simplify or resend |
| Email Verify → First Invoice | Unclear how to start | Improve onboarding email |
| First Invoice → Send | Confusion about next step | Add in-app guidance |
| Send → Upgrade | Don't see value yet | Time upgrade prompt better |

---

### FUNNEL 2: Invoice Send → Payment Received → Upgrade

**What It Measures:** Time from invoice sent to payment + upgrade decision

**Stages:**

```
Stage 1: Invoice Sent to Client
  ↓
  
Stage 2: Invoice Viewed by Client
  ↓ (Target: 80%+ of sent invoices viewed)
  
Stage 3: Payment Received (User Gets Paid)
  ↓ (Target: 70-80% paid on time)
  
Stage 4: User Marks Invoice as Paid in Relay
  ↓ (Target: 60-70% of paid invoices logged)
  
Stage 5: Pro Upgrade (User Sees Value)
  ↓ (Target: 10-15% of paid users upgrade)
```

**Why This Matters:** Users who receive payment are MOST likely to upgrade (they experienced value). This is your highest-converting audience.

---

### FUNNEL 3: Trial Day 7 → Trial Day 14 → Upgrade Decision

**What It Measures:** Time to upgrade decision during trial period

**Stages:**

```
Day 0: Signup Initiated
Day 3: First Invoice Created
Day 7: Still Active? (or Churned?)
Day 14: Trial Ends → Upgrade or Churn?
```

**Expected Performance:**

```
100 trial signups (Day 0)
→ 25 create invoice (Day 3) [25%]
→ 15 still active (Day 7) [15%]
→ 5-8 upgrade (Day 14) [5-8%]
→ 7-10 churn (Day 14) [7-10%]
```

**Critical Insight:** Most churn happens between Days 1-3 (if no invoice created). Secondary churn at Day 14 when trial expires.

---

### FUNNEL 4: Overdue Invoice → Collections Action → Upgrade

**What It Measures:** Engagement with core problem (late payment)

**Stages:**

```
Stage 1: Invoice Marked Overdue (3+ days past due)
  ↓
  
Stage 2: User Logs In & Sees Overdue Indicator
  ↓ (Target: 70%+ notice it)
  
Stage 3: User Sends Reminder (Email or SMS)
  ↓ (Target: 40-50% take action)
  
Stage 4: Client Pays Following Reminder
  ↓ (Target: 60-70% pay after reminder)
  
Stage 5: Pro Upgrade (User Realizes Value of Automation)
  ↓ (Target: 20%+ of overdue users upgrade)
```

**Why This Matters:** Users with overdue invoices have their BIGGEST pain point activated. This is conversion gold if you solve it.

---

### FUNNEL 5: Free-to-Paid Conversion (Full Journey)

**What It Measures:** Overall freemium conversion rate

**Stages:**

```
All Free Users (Baseline = 100%)
  ↓
  
Activated Users (Created 1+ Invoice): 25-30%
  ↓
  
Engaged Users (Sent 5+ Invoices): 10-15%
  ↓
  
Paying Users (Upgraded to Pro): 2-5%
```

**Conversion Rate Targets (Industry Benchmarks):**[62][65]
- Freemium: 3-5% (good), 5-8% (excellent)
- Free trial: 8-12% (good), 15-25% (excellent)
- Relay target (freemium): 5-8%

---

## PART 4: RETENTION & COHORT ANALYSIS

### Cohort Analysis Framework[131][134]

**What is a Cohort?** A group of users who shared a particular characteristic or experience within a time period.

**Types of Cohorts:**
1. **Acquisition cohort:** Users grouped by signup date (e.g., "November 2025 cohorts")
2. **Behavioral cohort:** Users grouped by action (e.g., "users who created 5+ invoices")
3. **Feature cohort:** Users grouped by feature usage (e.g., "users who enabled SMS reminders")

---

### Cohort Retention Table Example

**Time-Based Cohort (Acquisition Date):**

```
Cohort       | W0    | W1  | W2  | W3  | W4  | W8  | W12 | W16
─────────────┼───────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Sept 2025    | 100%  | 60% | 45% | 35% | 30% | 20% | 15% | 12%
Oct 2025     | 100%  | 65% | 50% | 40% | 35% | 25% | 20% | -
Nov 2025     | 100%  | 62% | 48% | 38% | 32% | -   | -   | -
─────────────┼───────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Average      | 100%  | 62% | 48% | 38% | 32% | 23% | 18% | 12%
```

**How to Read It:**
- **Horizontally:** How one cohort's retention changes over time
  - Sept cohort: 100% → 60% (Week 1) → 45% (Week 2) [30% churn by Week 2]
- **Vertically:** Retention rates across cohorts at same point in lifecycle
  - Week 1: Sept (60%), Oct (65%), Nov (62%) [consistent ~63% retention]
- **Diagonally:** Retention at same calendar date across cohorts
  - Week 4: Sept (30%), Oct (35%), Nov (32%) [stabilizing around 32%]

---

### Cohort Retention Curve (Visual)

Plotting retention curves shows pattern clarity:

```
% Retained
100% |●
     |
 80% |  ●
     |
 60% |    ● ●
     |      ●
 40% |        ● ●
     |          ●
 20% |            ● ●
     |
  0% |________________
     W0  W1  W2  W3  W4  W8  W12
     
     Each line = one monthly cohort
     Steep drop early, then levels off = healthy pattern
```

**Healthy Pattern:**
- Sharp drop Week 0-2 (expected churn)
- Levels off by Week 4 (stable retained users)
- Reaches steady state 15-20% retention (core engaged users)

**Unhealthy Pattern:**
- Continuous decline (no plateau)
- Retention <10% by Week 4 (product issues)
- Different cohorts have wildly different curves (inconsistent onboarding)

---

### Behavioral Cohort: Invoice Creators vs Non-Creators

**Cohort Definition:**
- **Group A:** Users who created invoice (Week 1 of signup)
- **Group B:** Users who didn't create invoice (Week 1 of signup)

**Retention Comparison:**

```
Cohort                  | W0   | W1  | W2  | W4   | W8   | W12
────────────────────────┼──────┼─────┼─────┼──────┼──────┼─────
Created Invoice         | 100% | 85% | 70% | 50%  | 35%  | 25%
Did NOT Create Invoice  | 100% | 20% | 10% |  5%  |  2%  | <1%
────────────────────────┼──────┼─────┼─────┼──────┼──────┼─────
Difference              | 0%   | 65% | 60% | 45%  | 33%  | 24%
```

**Insight:** Invoice creation at onboarding is THE activation metric. Users who create invoice are 50x more likely to be retained.

---

### Churn Rate Calculation by Cohort

**Formula:** 
```
Churn Rate (Month N) = (Users Lost from Previous Month) / (Users at Start of Previous Month)
```

**Example:**

```
Oct Cohort (50 users on Oct 1):
- Oct 31: 40 users remain [20% churn in October]
- Nov 30: 36 users remain [10% churn in November = 4 lost / 40 remaining]
- Dec 31: 33 users remain [8.3% churn in December]

Pattern: 20% → 10% → 8% [declining churn = stabilizing]
```

**Monthly Average Churn Rate:**
Average of all cohorts' monthly churn rates = stable user loss metric

```
Target for Relay (freemium):
- Month 1: 25-30% churn (expected)
- Month 2-3: 15-20% churn
- Month 4+: 5-10% monthly churn (stabilized)

This yields 1-year retention of 40-50% (healthy freemium)
```

---

### Churn Reasons (Qualitative Analysis)

**Exit Survey:** When user cancels (pro plan) or churns (free plan), ask:

```
"Why are you leaving Relay?"
- Feature gap (what was missing?)
- Price too high
- Found better alternative (which one?)
- Not enough time to use it
- Switched to manual (invoicing/collections)
- Technical issues
- Poor customer support
- Other ___________
```

**Action:**
- Aggregate churn reasons by cohort
- If 30%+ churn because "feature X," prioritize feature
- If 20%+ churn because "price," test price reduction
- If 25%+ churn because "found alternative," study competitor

---

### Retention Metrics to Track

| Metric | Target (Relay) | Calculation |
|--------|---|---|
| **Day 1 Retention** | 60%+ | Users active Day 1 / Day 0 signups |
| **Day 7 Retention** | 25-30% | Users active Day 7 / Day 0 signups |
| **Day 30 Retention** | 15-20% | Users active Day 30 / Day 0 signups |
| **Monthly Churn Rate** | 5-10% | (Users Lost) / (Users Start of Month) |
| **Annual Retention** | 40-50% | Users active Day 365 / Day 0 signups |

---

## PART 5: IMPLEMENTATION ROADMAP

### Week 1: Event Schema Planning
- [ ] Define all 20+ events (use list above as template)
- [ ] Document event properties (what data to capture)
- [ ] Create data dictionary
- [ ] Get team agreement on naming conventions

### Week 2: Analytics Platform Setup
- [ ] Choose platform (recommend: Mixpanel or Amplitude)
- [ ] Create development environment
- [ ] Implement event tracking in code
- [ ] Set up custom dashboards for key funnels

### Week 3: Funnel Setup
- [ ] Define 5 critical funnels
- [ ] Build funnel reports in analytics platform
- [ ] Set baseline metrics
- [ ] Identify drop-off points

### Week 4: Cohort Analysis
- [ ] Segment users by acquisition date
- [ ] Create retention cohort tables
- [ ] Identify churn patterns
- [ ] Set up exit surveys for context

### Month 2: Analysis & Action
- [ ] Review weekly funnel performance
- [ ] Identify top drop-off points
- [ ] Run A/B tests to address friction
- [ ] Measure impact of improvements

---

## PART 6: EXPECTED METRICS & TARGETS FOR RELAY

### Acquisition Metrics

```
Monthly Signups Target:
Month 1-2: 100-200 signups
Month 3-4: 200-400 signups
Month 5-6: 400-800 signups
```

### Activation Metrics

```
% of Signups Creating First Invoice:
Target: 25-30% within Week 1
Target: 35-40% within Week 2
(Industry benchmark for comparable SaaS: 20-30%)
```

### Engagement Metrics

```
Weekly Active Users (WAU):
Target: 40-50% of total users weekly
Monthly Active Users (MAU):
Target: 60-70% of total users monthly

Days to First Reminder Created:
Median: 2-3 days from signup
(Earlier = higher engagement)
```

### Monetization Metrics

```
Free-to-Paid Conversion:
Target: 5-8% by Day 14 (trial end)
Target: 8-12% by Day 30
Target: 12-15% by Day 60

Average Time to Upgrade:
Median: 7-10 days from signup
(Users who get paid faster → upgrade faster)

Monthly Recurring Revenue (MRR):
Target: £500 Month 1 → £5,000 Month 6 → £20,000 Month 12
(Based on ~15% conversion of active users to Pro at £9.99/month)
```

### Retention Metrics

```
Day 1 Retention: 60%+
Day 7 Retention: 25-35%
Day 30 Retention: 15-20%
Day 90 Retention: 10-15%
Annual Retention: 40-50%

Monthly Churn Rate (Pro Users):
Target: 5-8% (good)
Target: <5% (excellent)
```

---

## MEASUREMENT DASHBOARD TEMPLATE

### Weekly Metrics Review

```
WEEK OF: ___________

ACQUISITION:
├─ New signups: ___
├─ Signup sources: [Organic %, Paid %, Referral %]
└─ Email verification rate: ___%

ACTIVATION:
├─ % created invoice (Day 1): ___%
├─ % created invoice (Day 7): ___%
├─ Median days to first invoice: __ days
└─ % sent to client: ___%

ENGAGEMENT:
├─ Weekly Active Users (WAU): ___
├─ Invoices created (weekly): ___
├─ Reminders sent: ___
└─ Feature adoption (% using X feature): ___%

MONETIZATION:
├─ Pro upgrades (weekly): ___
├─ Trial-to-paid conversion rate: ___%
├─ MRR: £___
└─ % of signups that upgraded: ___%

RETENTION:
├─ Users active this week: ___
├─ Users churned: ___
├─ Churn rate (if applicable): ___%
└─ Top churn reason: ___________

BOTTLENECKS:
├─ Biggest funnel drop-off: [Stage name] at ___%
├─ Root cause hypothesis: ___________
└─ Experiment to run this week: ___________
```

---

This comprehensive product analytics strategy will give Relay complete visibility into user behavior from acquisition through retention, enabling rapid optimization of the freemium funnel.

# Product Analytics – Quick Reference & Implementation Guide

## QUICK DECISION MATRIX: WHICH ANALYTICS TOOL?

**Choose Mixpanel if:**
✅ You want real-time dashboards
✅ You have clear event taxonomy
✅ You can spare 3-7 days for setup
✅ You want best free tier (1M events)
✅ You prioritize developer experience

**Choose Amplitude if:**
✅ You want advanced cohort analysis
✅ You need predictive analytics (AI insights)
✅ You're building a PLG product
✅ You need multi-product tracking
✅ You want enterprise features

**Choose Heap if:**
✅ You want to get data immediately (minutes, not days)
✅ You're unsure what metrics matter
✅ You want retroactive analysis
✅ You have limited engineering resources

**Recommendation for Relay:** Mixpanel (real-time monitoring for user activation is critical) or Amplitude (better for conversion analysis)

---

## 20 CRITICAL EVENTS (QUICK LIST)

### Acquisition (4 events)
1. `signup_initiated` – User starts signup form
2. `signup_completed` – Email/password created
3. `email_verified` – Email confirmation clicked
4. `referral_applied` – User entered referral code

### Activation (5 events)
5. `first_invoice_created` – User creates first invoice
6. `invoice_details_filled` – Form completed
7. `invoice_sent_to_client` – Invoice delivered
8. `first_reminder_set` – Reminder configured
9. `payment_received_via_relay` – User gets paid

### Engagement (5 events)
10. `invoice_view` – User views invoice
11. `reminder_delivered` – Email/SMS sent
12. `report_generated` – User accesses reports
13. `automation_rule_created` – User creates automation
14. `help_content_viewed` – User reads help article

### Monetization (6 events)
15. `upgrade_cta_shown` – Upgrade prompt displayed
16. `upgrade_cta_clicked` – User clicks upgrade
17. `upgrade_started` – Payment form opened
18. `payment_failed` – Transaction failed
19. `subscription_activated` – Pro plan begins
20. `invoice_dispute_filed` – Pro feature engagement

### Retention (3 events)
21. `user_login` – Activity indicator
22. `subscription_renewed` – Auto-renewal
23. `subscription_cancelled` – User cancels

---

## PLATFORM PRICING SUMMARY

| Platform | Free Tier | Paid Starting | Best For |
|----------|-----------|---|---|
| **Mixpanel** | 1M events/month | $0.00028/event | Real-time dashboards |
| **Amplitude** | 50K MTU | $49/month (Plus) | Cohort analysis |
| **Heap** | 10K sessions | $40K-120K/year | Rapid deployment |
| **Hotjar** (session replay) | 10K sessions/month | $32/month | UX insights |
| **LogRocket** (errors + replay) | Custom | $400-1000+/mo | Dev debugging |

**Recommendation:** Start with Mixpanel + Hotjar (total: ~$100-300/month initially)

---

## FUNNEL QUICK REFERENCE

### 5 Core Funnels to Track

#### Funnel 1: Signup → Activation → Upgrade
```
100 signups
→ 90 verify email (90%)
→ 25 create invoice (28% of verified = 25%)
→ 18 send to client (72% of creators = 18%)
→ 5-8 upgrade (28-44% of senders = 5-8%)
```

#### Funnel 2: Invoice Send → Payment → Upgrade
```
100 invoices sent
→ 80 viewed by client (80%)
→ 60 paid (75% payment rate)
→ 50 logged in Relay (83%)
→ 5-8 upgrade (10-15%)
```

#### Funnel 3: Trial Week 1-14 → Upgrade
```
Day 0: 100 trial signups
Day 3: 25 create invoice (25% activation)
Day 7: 15 still active (60% retention)
Day 14: 5-8 upgrade (5-8% conversion)
```

#### Funnel 4: Overdue Invoice → Upgrade
```
100 overdue invoices
→ 70 user notices (70%)
→ 35 sends reminder (50% action)
→ 25 gets paid (71% response)
→ 5 upgrades (20% of paid users)
```

#### Funnel 5: Overall Free-to-Paid
```
1,000 free users
→ 250 activated (25%)
→ 50 engaged (5%)
→ 5-8 paid (0.5-0.8%)
```

---

## RETENTION METRICS TARGETS

### By Week (Acquisition Cohort)

| Week | Target | Interpretation |
|------|--------|---|
| **Week 0** | 100% | Baseline |
| **Week 1** | 60%+ | 40% drop-off expected |
| **Week 2** | 45%+ | Stabilizing |
| **Week 4** | 30%+ | Core users remain |
| **Week 8** | 20%+ | Engaged segment |
| **Week 12** | 15%+ | Loyal users |

### Churn Rate by Stage

| Period | Monthly Churn | Interpretation |
|--------|---|---|
| **Month 1** | 25-30% | Expected high churn |
| **Month 2-3** | 15-20% | Stabilizing |
| **Month 4+** | 5-10% | Mature churn rate |

---

## ACTIVATION COHORT ANALYSIS

**Most Important Finding:** Users who create an invoice are retained at 5x rate

| Cohort | Week 1 Retention | Week 4 Retention | Upgrade Rate |
|--------|---|---|---|
| **Created Invoice** | 85% | 50% | 15% |
| **Did NOT Create** | 20% | 5% | 2% |
| **Difference** | 65% | 45% | 13% |

**Action:** Optimize "first invoice creation" experience more than anything else

---

## EVENT TRACKING CHECKLIST

### Before Implementation
- [ ] Define all 20+ events clearly
- [ ] Document expected properties for each event
- [ ] Create naming conventions (snake_case: `first_invoice_created`)
- [ ] Get team buy-in on event schema
- [ ] Test tracking in development environment

### During Implementation
- [ ] Code event tracking for each key action
- [ ] Set up tracking in frontend + backend
- [ ] Test events fire correctly
- [ ] Verify data appears in analytics platform
- [ ] Set up initial dashboards

### After Launch
- [ ] Monitor event quality (no duplicates, correct properties)
- [ ] Weekly review of key metrics
- [ ] Identify data gaps (unexpected events missing)
- [ ] Refine event properties based on learnings
- [ ] Share dashboards with team

---

## WEEKLY METRICS REVIEW TEMPLATE

```
WEEK: ________

ACQUISITION:
- New signups: __
- Signup source breakdown: [%]
- Email verification rate: __%

ACTIVATION:
- % creating invoice: __%
- Median days to first invoice: __ days
- % invoice sent to client: __%
- % created reminder: __%

ENGAGEMENT:
- Weekly active users: ___
- % using email reminders: __%
- % using SMS reminders: __%
- % viewing reports: __%

MONETIZATION:
- New Pro signups: __
- Trial-to-paid conversion: __%
- Avg time to upgrade: __ days
- MRR: £__

RETENTION:
- Users active this week: ___
- Churn rate: __%
- Day 7 retention (new cohort): __%

CRITICAL FINDING THIS WEEK:
[Biggest insight or bottleneck identified]

EXPERIMENT TO RUN:
[One thing to test to improve metrics]
```

---

## COMMON ANALYTICS MISTAKES (AVOID THESE)

❌ **No event naming convention** → Confusion and duplicates
✅ **Use consistent naming** (snake_case, prefixed by stage)

❌ **Tracking too many events** → Analysis paralysis
✅ **Start with 20-30 critical events**, add gradually

❌ **Forgetting user properties** → Can't segment later
✅ **Capture signup source, plan tier, email domain for all users**

❌ **Not setting up alerts** → Miss critical changes
✅ **Alert on: Conversion drop >20%, Churn spike >2x, Error rate >5%**

❌ **Raw dashboard nobody uses** → No action taken
✅ **Create 3-5 focused dashboards** (acquisition, activation, monetization, retention)

❌ **Setting metrics but never checking** → Why collect data?
✅ **Weekly review of key funnel metrics**, adjust based on findings

❌ **Mixing up correlation and causation** → Wrong conclusions
✅ **Always ask: Why did this happen? What's the mechanism?**

---

## GETTING STARTED (WEEK 1 ACTION PLAN)

### Day 1-2: Choose Platform
- [ ] Sign up for Mixpanel free tier (or Amplitude)
- [ ] Create project for Relay
- [ ] Invite team members
- [ ] Explore platform UI

### Day 3-4: Plan Events
- [ ] Use 20-event list above as template
- [ ] Add any product-specific events
- [ ] Document event properties
- [ ] Get team sign-off

### Day 5: Initial Setup
- [ ] Implement tracking code in app
- [ ] Test 5-10 events in dev environment
- [ ] Verify data appears in analytics
- [ ] Set up first dashboard

### Following Week: Build Dashboards
- [ ] Create acquisition overview dashboard
- [ ] Create funnel analysis (signup → activation → upgrade)
- [ ] Create retention cohort table
- [ ] Set up real-time alerts

---

## EXPECTED ANALYTICS MATURITY TIMELINE

**Week 1-2:** Tracking implemented, basic dashboards live
**Week 3-4:** First insights appear, bottlenecks identified
**Month 2:** Weekly metrics reviews, optimization experiments start
**Month 3:** Data-driven roadmap prioritization based on metrics
**Month 4+:** Predictive insights (cohort-based forecasting)

---

## KEY METRICS DASHBOARD LAYOUT

### Dashboard 1: ACQUISITION
- Daily/weekly signups (trending)
- Signup source breakdown (pie chart)
- Email verification rate (%)
- Signup-to-activate conversion rate

### Dashboard 2: ACTIVATION (Most Important)
- % of users creating first invoice (by day/week)
- Median time to first invoice
- % invoice sent to client
- % set up first reminder
- Invoice creation funnel visualization

### Dashboard 3: MONETIZATION
- Trial-to-paid conversion rate
- Avg days from signup to upgrade
- Pro upgrades (trending)
- MRR (monthly recurring revenue)
- Revenue by plan tier

### Dashboard 4: RETENTION
- Cohort retention table (by signup date)
- Day 7/14/30/90 retention rates
- Monthly churn rate
- Churn by signup source

### Dashboard 5: FEATURE ADOPTION
- % using SMS reminders
- % using dispute feature
- % accessing reports
- Feature usage over time

---

## SESSION REPLAY TOOL QUICK START

**Buy:** Hotjar ($32/month)
**Setup:** 30 minutes (code snippet)
**Use:** Watch 5-10 session replays of users who churned

**What to Look For:**
- Where do users click vs. expect to click?
- Do users read copy or skip?
- Where do users get stuck (rage clicks)?
- Are buttons obvious?
- Do users scroll or bounce?

**Action:** Fix top 3 UX issues discovered, then retest

---

## SUCCESS METRICS (30-DAY TARGET)

By end of Month 1 of analytics implementation:

✅ 20+ events tracking in real-time
✅ 3+ dashboards built and shared
✅ Weekly metrics review cadence established
✅ 1-2 experiments identified from data insights
✅ Team aligned on key metrics to optimize
✅ Baseline metrics established for all 5 funnels

---

This framework provides complete visibility into Relay's user behavior and will guide all optimization efforts through the freemium → paid conversion funnel.

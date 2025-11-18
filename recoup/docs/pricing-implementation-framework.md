# SaaS Pricing Optimization: Implementation & Testing Framework

## Quick Reference: Relay Recommended Pricing Strategy

### Proposed 3-Tier Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRICING PAGE LAYOUT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRO (Enterprise)                                              │
│  └─ £75/month (or £720/year, save £180)                       │
│     ├─ Unlimited collections                                  │
│     ├─ Unlimited team members                                 │
│     ├─ AI-powered recovery strategies                         │
│     ├─ All channels (Email/SMS/WhatsApp/Phone)               │
│     ├─ Dedicated support                                      │
│     └─ [START 30-DAY TRIAL]                                   │
│                                                                 │
│  ★ GROWTH (Recommended)                                        │
│  └─ £39/month (or £374/year, save £94) ← DEFAULT SELECTION  │
│     ├─ 50 collections per month                              │
│     ├─ 5 team members                                         │
│     ├─ Smart reminders (Email + SMS + WhatsApp)              │
│     ├─ Basic AI analytics                                     │
│     ├─ Email support (24hr response)                          │
│     └─ [START 30-DAY TRIAL]                                   │
│                                                                 │
│  STARTER (Building)                                            │
│  └─ £19/month (or £182/year, save £46)                       │
│     ├─ 10 collections per month                              │
│     ├─ 1 team member                                          │
│     ├─ Basic email reminders                                  │
│     ├─ Manual collection tracking                             │
│     ├─ Email support (48hr response)                          │
│     └─ [START 30-DAY TRIAL]                                   │
│                                                                 │
│  Additional collections: £1-2 per collection beyond tier limit │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Pricing Psychology Applied

**Anchoring Effect:**
- Pro tier listed first (£75/month)
- Growth appears as "47% discount" (£39 vs £75)
- Conversion to Growth increases 20-30%

**Charm Pricing:**
- £19 appeals to freelancers (not £20)
- £39 appeals to growing teams (not £40)
- £75 remains rounded for premium feel

**Decoy Effect:**
- Growth is "best value" (50 collections for £39)
- Between Starter (£19, 10 collections) and Pro (£75, unlimited)
- Ratio: 50 for 39 = 1.28 per £ vs Pro 1.33 per £
- Feels "best value" = most users choose Growth

**Social Proof:**
- "Join 10,000+ freelancers and growing teams"
- Show badge: "90% of teams choose Growth"
- Default selection: Growth tier (pre-selected)

---

## Van Westendorp Price Sensitivity Survey

### Sample Survey Questions

```
Thank you for your interest in Relay Collections.

To help us understand your needs, please answer 4 quick questions 
about pricing. This will take 2 minutes.

---

QUESTION 1 (Too Expensive Threshold)
"At what PRICE would you consider Relay Collections to be so EXPENSIVE 
that you would NOT consider buying it, no matter what features it has?"

[£ ________] per month

---

QUESTION 2 (Too Cheap - Quality Concerns)
"At what PRICE would you consider Relay Collections to be so CHEAP 
that you'd feel the QUALITY couldn't be very good?"

[£ ________] per month

---

QUESTION 3 (Good Value/Bargain)
"At what PRICE would you consider Relay Collections to be a BARGAIN—
a great buy for the money?"

[£ ________] per month

---

QUESTION 4 (Expensive but Fair)
"At what PRICE would you consider Relay Collections EXPENSIVE, 
but you'd still be willing to buy it?"

[£ ________] per month

---

DEMOGRAPHICS (Optional)
- Role: [ ] Freelancer [ ] Agency Owner [ ] In-house
- Company Size: [ ] Solo [ ] 2-5 [ ] 6-20 [ ] 21-50 [ ] 50+
- Industry: _______________
```

### Survey Respondent Targets

**Sample Size:** 400-600 respondents

**Segments to Target:**
1. Freelancers (50% of sample)
   - Self-employed
   - 1 person companies
   - Price-sensitive

2. Small Agencies (30% of sample)
   - 2-20 employees
   - Growing revenue
   - Mid-market sweet spot

3. Mid-Market (20% of sample)
   - 20-100 employees
   - Established revenue
   - Enterprise candidates

### Analysis & Interpretation

**Plot Responses on Graph:**

```
Cumulative % of Respondents
100% |                              Too Cheap Line
     |                            /
 80% |                     Cheap /
     |                        /
 60% |                   Expensive /
     |                          /
 40% |                     Too Expensive /
     |                                /
 20% |
     |
  0% |____________________________
    £10  £15  £20  £25  £30  £35  £40
    
Key Intersections:
- "Too Cheap" ∩ "Expensive" = Point of Marginal Cheapness (PMC)
- "Cheap" ∩ "Too Expensive" = Point of Marginal Expensiveness (PME)
- "Cheap" ∩ "Expensive" = Optimal Price Point
```

**Expected Output (Collections Software):**
- PMC: £18-22 (lower bound)
- Optimal: £28-32 (sweet spot)
- PME: £38-42 (upper bound)
- Acceptable range: £20-40

---

## A/B Testing Framework

### Test #1: Price Point Optimization (Month 5-6)

**Hypothesis:**
"Increasing Growth tier from £39 to £44 (+13%) will increase revenue 
5-8% despite lower conversions"

**Test Setup:**

| Aspect | Value |
|---|---|
| Control Price | £39/month |
| Test Price | £44/month |
| Tier | Growth (50 collections) |
| Variant Split | 50/50 random |
| Duration | 8-10 weeks |
| Minimum Sample | 400 conversions per variant |
| Success Metric | Revenue per visitor (£ not %) |

**Traffic Calculation:**
- Assume 200 signups/month
- 10% trial-to-paid conversion = 20 paid users/month
- Need 400 × 2 variants = 800 paid users total
- Timeline: 40 months... TOO LONG

**Solution: Run Simultaneously**
- 100 to Control (£39)
- 100 to Test (£44)
- Duration: 4 weeks per variant = 8 weeks total
- Both reach 400 by week 8

**Metrics to Track:**

Primary:
- Conversion rate (% of trialists who upgrade)
- Revenue per visitor (price × conversion rate)

Secondary:
- 30-day retention (churn rate by price point)
- ARPU (avg revenue per user)
- Expansion revenue (average overage fees)

By Segment:
- Freelancers: Conversion % by price
- Agencies: Conversion % by price
- Enterprise: Conversion % by price

**Decision Criteria:**
- Win if: Revenue per visitor increases ≥5%
- Call if: p-value < 0.05 (95% confidence)
- Analyze by segment before deciding

### Test #2: Annual vs Monthly Incentive (Month 7-8)

**Hypothesis:**
"20% annual discount will drive 40% of users to annual plans, 
increasing LTV 20%"

**Test Setup:**

| Aspect | Control | Test |
|---|---|---|
| Monthly | £39/month | £39/month |
| Annual | No option | £374/year (save £94) |
| Messaging | Default monthly | "Save £94/year" |
| Split | 50% | 50% |

**Expected Outcome:**
- Control: 90% monthly, 10% annual
- Test: 60% monthly, 40% annual

**Revenue Impact:**
- Control: (90% × £39 × 12 × retention) + (10% × £374 × retention)
- Test: (60% × £39 × 12 × retention) + (40% × £374 × retention)
- Expected gain: +15-20% annual revenue

**Duration:** 8-10 weeks (need 400+ annual conversions)

### Test #3: Decoy Effect Validation (Month 9-10)

**Hypothesis:**
"Adding £24/month 'Mid' tier between Starter & Growth will 
shift 30% more users to Growth tier, increasing ARPU by 8%"

**Test Setup:**

Control (Current):
```
Starter: £19 (10 collections)
Growth: £39 (50 collections)  
Pro: £75 (unlimited)
```

Test (With Decoy):
```
Starter: £19 (10 collections)
Mid: £24 (20 collections)      ← NEW DECOY
Growth: £39 (50 collections)
Pro: £75 (unlimited)
```

**Expected Result:**
- Control: 30% Starter, 50% Growth, 20% Pro
- Test: 20% Starter, 60% Growth, 20% Pro
- ARPU: (30% × £19) + (50% × £39) + (20% × £75) = £42.70
- ARPU: (20% × £19) + (60% × £39) + (20% × £75) = £42.40

Hmm, this actually shows negative impact. Let's recalculate...

**Alternative Decoy (Higher-Value):**

Test:
```
Starter: £19 (10 collections)
Growth: £39 (50 collections)
Premium: £55 (75 collections)  ← DECOY (between Growth & Pro)
Pro: £75 (unlimited + support)
```

Expected:
- Control: 30% Starter, 50% Growth, 20% Pro = £42.70 ARPU
- Test: 25% Starter, 35% Growth, 25% Premium, 15% Pro = £44.20 ARPU
- Result: +3.5% ARPU, no cannibalization

**Duration:** 8-10 weeks

---

## Competitive Pricing Analysis Summary

### Current Market Positioning

```
Price Range for Mid-Tier Plan:
£11-70 (7x range)

Specific Competitors:
- Wave Free (£0) — Freemium baseline
- FreshBooks Lite (£15) — Budget
- Xero Early (£13) — Budget
- Zoho Standard (£21) — Value
- FreshBooks Plus (£25) — Value
- Wave Pro (£20) — Value
- Chaser Growth (£30) — Collections
- FreshBooks Premium (£50) — Premium
- Xero Established (£70) — Enterprise
- Chaser Enterprise (£150+) — Enterprise Collections

Relay Growth (£39) Position:
- Above average invoicing (closer to premium)
- Below enterprise/collections software
- Sweet spot for SMB collections focus
```

### Recommended Positioning vs Competitors

**Relay as Premium Collections-First Platform:**

Rationale:
1. Collections = higher ROI than invoicing (pay for itself in 1-2 recoveries)
2. Collections users = less price-sensitive than invoicing-only
3. Collections = higher switching costs (integrations, workflows)
4. Competitors: Chaser at £30+ for collections, Xero/FreshBooks for invoicing
5. Relay positioning: Collections-focused invoicing (middle ground)

Pricing:
- Starter (£19) — Undercut FreshBooks/Xero, attract volume
- Growth (£39) — Above Chaser Growth (£30) but below Chaser Scale (£60)
- Pro (£75) — Premium collections positioning

---

## Pricing Elasticity Calculation for Relay

### Data-Driven Elasticity Estimate

**Assumption Inputs:**
- Target: Collections-first SMB SaaS
- Customer base: Freelancers + Small Agencies
- Comparable elasticity: 0.7-0.9 (moderate inelasticity)

**Projected Price Response:**

| Scenario | Price Change | Expected Conversion Impact | Elasticity | Revenue Impact |
|---|---|---|---|---|
| Price +5% (£39→£41) | +5% | -3% to -4% conversions | -0.65 | +0.5-1.5% |
| Price +10% (£39→£43) | +10% | -7% to -8% conversions | -0.75 | +1-2.5% |
| Price +15% (£39→£45) | +15% | -10% to -12% conversions | -0.75 | +2-5% |
| Price +20% (£39→£47) | +20% | -14% to -16% conversions | -0.75 | +2-6% |

**Interpretation:**
- Collections software exhibits 0.7-0.9 elasticity (moderate inelasticity)
- Raising prices 10-15% should increase revenue 1-2.5%
- Elasticity likely lower (0.6-0.7) due to limited competitors
- Room to raise prices before revenue decreases

### Strategic Implication

**Growth tier pricing options ranked by revenue:**

| Option | Annual Revenue (100 users/mo) | ARPU | Rank |
|---|---|---|---|
| £35/month (10% discount) | High conversion, lower price = £39/user | £35 | 2nd |
| **£39/month (Current)** | **Medium conversion** | **£39/user** | **Baseline** |
| £44/month (13% increase) | Medium-low conversion | £40-41/user | 1st (if elasticity <0.75) |
| £49/month (26% increase) | Low conversion | £40-42/user | 1st (if elasticity <0.65) |

**Recommendation:** Test £44/month (13% increase) before raising further

---

## Discount Strategy Implementation

### Recommended Discount Schedule

**Standard Discounts (20% annual):**
```
Monthly Plans:
- Starter: £19/month
- Growth:  £39/month
- Pro:     £75/month

Annual Plans (20% discount = 2.4 months free):
- Starter: £182.40/year (£15.20/month, save £45.60)
- Growth:  £374.40/year (£31.20/month, save £93.60)
- Pro:     £720/year (£60/month, save £180)
```

**Multi-Year Commitment (Tiered):**
```
1-Year:   15% discount (equivalent to 1.8 months free)
2-Year:   20% discount (equivalent to 2.4 months free) ← STANDARD
3-Year:   25% discount (equivalent to 3 months free) + locked pricing
```

**Founding Member Launch Offer (Time-Limited):**
```
Valid through: March 31, 2025

Launch Offer: 40% off first 3 months, then 20% off annual commitment

Example for Growth tier:
- Months 1-3: £23.40/month (40% off £39)
- Total for 3 months: £70.20
- Months 4+: £374.40/year (standard 20% annual discount)
- Transition message sent at end of Month 3

NOT lifetime pricing (prevents long-term lock-in)
```

### Promotional Calendar

```
Q1 2025:
- Week 1-4: Launch offer (40% off first 3 months)
- Week 5-8: Standard pricing (20% annual discount available)
- Week 9-12: Limited time: "50% off annual plans" (if needed for growth)

Q2 2025:
- Week 1-4: Standard pricing
- Week 5-8: Early adopter offer (25% off annual for new signups)
- Week 9-12: Standard pricing

Q3 2025:
- Week 1-4: Standard pricing
- Week 5-8: Mid-year sale (15% off any annual plan)
- Week 9-12: Standard pricing

Q4 2025:
- Week 1-4: Black Friday prep (hint "coming Nov 28")
- Week 5-8: Black Friday/Cyber Monday (30% off annual plans)
- Week 9-12: End-of-year offer (20% off annual plans)
```

---

## Risk Mitigation & Success Metrics

### Key Metrics Dashboard

**Monthly Tracking:**

| Metric | Target | Benchmark | Alert Threshold |
|---|---|---|---|
| Trial signups | 200-250/mo | 180/mo | <150 |
| Trial-to-paid conversion | 10-12% | 9% | <8% |
| Average paid ARPU | £40-45 | £39 | <£35 |
| Monthly churn | 3-5% | 4% | >7% |
| Annual commitment rate | 35-40% | 30% | <25% |
| Expansion revenue | £5-8/user | $0-2 | <£3 |
| LTV (12-month) | £420-550 | £430 | <£350 |
| CAC payback period | 3-4 months | 4 months | >5 months |

### Success Criteria (First 3 Months)

**Should NOT price if:**
- Trial conversion drops >20% (indicates over-pricing)
- Churn increases >2% points (indicates value misalignment)
- Growth tier adoption <40% (indicates pricing tiers misaligned)
- Qualitative feedback consistently negative on price

**Should Proceed if:**
- ARPU increases 5-10% (revenue growth despite possible conversion loss)
- Churn stays within 0.5% points (acceptable variance)
- Growth tier adoption 50%+ (pricing psychology working)
- Positive feedback in customer interviews

---

## Conclusion: Implementation Roadmap

**Month 1-2:** Van Westendorp + Competitor Research (Done)
**Month 3:** Finalize pricing, messaging, launch strategy
**Month 4:** Soft launch new pricing to 20% of user base
**Month 5-6:** A/B test price point (£39 vs £44)
**Month 7-8:** A/B test annual vs monthly incentive
**Month 9-10:** A/B test decoy effect (3-tier vs 4-tier)
**Month 11+:** Optimize based on results, scale winner

Expected outcome: 10-15% revenue growth without sacrificing customer acquisition

---

## Resources & References

All files available in implementation package:
- [168] SaaS Pricing Optimization Guide
- [164] Annual Discount Benchmarks (JSON)
- [165] Competitor Pricing Comparison (CSV)
- [166] Price Elasticity Benchmarks (JSON)
- [167] Van Westendorp Template (JSON)

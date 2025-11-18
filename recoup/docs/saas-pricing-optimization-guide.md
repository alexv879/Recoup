# SaaS Pricing Optimization: Complete Research & Strategy Guide

## Executive Summary

This comprehensive guide covers price elasticity, willingness-to-pay research, competitive pricing analysis, pricing psychology, and discount strategies for SaaS subscription products, with specific application to payment collection platforms like Relay. Key findings: **B2B SaaS products typically exhibit 0.5-1.5 price elasticity (moderate sensitivity); optimal annual discounts range 15-20% for mid-market products; and value-based pricing using conjoint analysis generates 25% higher revenue growth than competitor-based pricing.**[135][139][141][150]

---

## Part 1: Price Elasticity Fundamentals

### What is Price Elasticity of Demand (PED)?[135][139]

**Formula:**
```
Price Elasticity = (% Change in Quantity Demanded) / (% Change in Price)
```

**Interpretation:**

| Elasticity Range | Classification | Meaning | Example |
|---|---|---|---|
| **E < 0.5** | Inelastic | Demand barely changes with price | Enterprise software; critical systems |
| **0.5 < E < 1.0** | Relatively Inelastic | Slight demand decrease with price rise | SMB accounting software |
| **E = 1.0** | Unit Elastic | Revenue stays same (quantity↓ = price↑) | Balanced pricing |
| **E > 1.0** | Elastic | Demand drops significantly with price | Commodity SaaS; many alternatives |

**Example for Invoicing Software:**[135]
- Current: £35/month, 1,000 users
- Raise price to £42 (+20%)
- New result: 850 users (-15%)
- Elasticity = -15% / 20% = **-0.75 (relatively inelastic)**
- Interpretation: Raising prices 20% only loses 15% of customers (revenue increases)[139]

### SaaS Elasticity Benchmarks[139][150]

**Typical B2B SaaS Range: 0.5 - 1.5**

**By Product Type:**
- **Enterprise SaaS:** 0.3-0.7 (very inelastic—switching costs high)
- **SMB SaaS:** 0.6-1.0 (moderate inelasticity)
- **Freemium SaaS:** 1.0-1.5 (elastic—free alternatives exist)
- **Collections/Invoicing:** ~0.7-0.9 (moderate inelasticity due to switching costs)

**Why Collections Software is Less Elastic (0.7-0.9):**[139]
- High switching costs (data migration, team retraining)
- Integrations with existing systems
- Critical for revenue collection (hesitant to change)
- Limited direct competitors
- Integration with accounting software raises cost of switching

### How to Measure Price Elasticity[139]

**Method 1: Historical Analysis (Use Your Own Data)**

Steps:
1. Collect past pricing changes (date, price, segment)
2. Measure resulting demand changes (conversions, signups, upgrades)
3. Calculate elasticity using formula
4. Analyze by customer segment (freelancer vs agency)

Example:
```
June 2024: Raised Pro tier from £25 → £30
Result: Conversions dropped from 10% → 8.5%
Elasticity = (1,000 - 850) / 1,000) / ((30 - 25) / 25)
           = (-15%) / (20%) = -0.75
```

**Method 2: A/B Testing (Randomized Experiment)**[139]

Setup:
- Segment users randomly into Control & Treatment groups
- Show Control group current price (£35/month)
- Show Treatment group new price (£42/month)
- Measure conversion rate for each group
- Calculate elasticity

Requirements:
- Minimum 1,000 conversions per variant for statistical significance[163]
- Run for 2-4 weeks (avoid day-of-week bias)
- Ensure random assignment (not biased)

**Method 3: Van Westendorp Price Sensitivity Meter (Survey)**[140][143]

Ask respondents 4 questions about your product:
1. "Too expensive" price point (above which you'd never buy)
2. "Too cheap" price point (quality concerns)
3. "Good value" price point (bargain)
4. "Expensive but fair" price point

Plot responses on graph:
- Intersection of "too cheap" ↔ "expensive" = **Lower price bound (PMC)**
- Intersection of "good value" ↔ "too expensive" = **Upper price bound (PME)**
- Intersection of "good value" ↔ "expensive" = **Optimal price (Indifference)**

Advantages: Quick, cheap, 300-500 respondents sufficient[141]
Disadvantages: Self-reported preferences (not actual purchase behavior)

**Method 4: Conjoint Analysis (Most Accurate)**[141][144]

Show respondents realistic product packages at different prices:
```
Option A: Pro tier, 50 collections, £35/month
Option B: Starter tier, 10 collections, £20/month
Option C: None of these
→ Which would you choose?
```

Benefits:
- Measures trade-offs (features vs price)
- Identifies feature value (which features drive WTP)
- Segment analysis (different groups, different elasticity)
- Reveals revenue-maximizing price & feature combination

Requirements:
- 300-1,000 respondents for significance[141]
- 8-12 choice scenarios per respondent
- 2-3 weeks to run + analyze

---

## Part 2: Willingness-to-Pay (WTP) Research

### Why WTP Matters[144]

**Willingness-to-Pay = Maximum price customer will pay before saying "no"**

If WTP = £50/month and you price at £45/month → Customer buys
If WTP = £45/month and you price at £50/month → Customer doesn't buy

Revenue maximization comes from **pricing closer to (but below) WTP**, not arbitrary markups.

### Van Westendorp Price Sensitivity Meter Template[140][143]

**Survey (4 Questions):**

```
Thinking about [Relay Collections Management]:

1. "At what PRICE POINT would this product be so EXPENSIVE 
   that you would NOT consider buying it?"
   [Price input: ___________]

2. "At what PRICE POINT would this product be so CHEAP 
   that you'd question the QUALITY?"
   [Price input: ___________]

3. "At what PRICE POINT would this product be a BARGAIN—
   a great buy for the money?"
   [Price input: ___________]

4. "At what PRICE POINT would this product be EXPENSIVE, 
   but you'd consider it?"
   [Price input: ___________]
```

**Interpretation Matrix:**

| Price Point | Too Cheap (below) | Cheap (good value) | Expensive (fair) | Too Expensive (above) |
|---|---|---|---|---|
| £15 | 5% | 25% | 80% | 95% |
| £20 | 8% | 40% | 70% | 85% |
| £25 | 12% | 55% | 50% | 75% |
| £30 | 18% | 65% | 35% | 60% |
| £35 | 25% | 70% | 25% | 45% |
| £40 | 35% | 72% | 18% | 35% |

**Key Price Points from Van Westendorp:**
- **PMC (Point of Marginal Cheapness):** £20-22 (lowest acceptable)
- **Indifference:** £28-30 (optimal price)
- **PME (Point of Marginal Expensiveness):** £38-40 (highest acceptable)
- **Acceptable Range:** £20-40

### Segment-Specific Willingness-to-Pay[139][141]

**Different customer types have different WTP:**

| Segment | Typical WTP | Rationale | Pricing Strategy |
|---|---|---|---|
| **Freelancers (Solo)** | £15-25/mo | Price-sensitive, low revenue | Starter tier, low entry cost |
| **Small Agencies (2-10 staff)** | £30-50/mo | Growing revenue, need features | Growth tier, moderate cost |
| **Mid-market (10-50 staff)** | £50-100/mo | Strong revenue, need integrations | Pro tier, premium features |
| **Enterprise (50+ staff)** | Custom 100-500/mo | Mission-critical, complex | Enterprise, custom support |

**Geographic WTP Differences:**
- **UK/EU:** Slightly lower WTP (£20-35 Pro tier)
- **USA:** Higher WTP (£35-50 Pro tier)—26% higher[151]
- **Australia:** Similar to US (£30-45)

**Industry-Specific WTP:**
- **Graphic Designers:** Lower (£15-25)—lower profit margins
- **Web Developers:** Moderate (£25-40)—higher margins
- **Agencies:** Highest (£50-100+)—significant revenue

---

## Part 3: Competitive Pricing Analysis

[See competitor_pricing_comparison.csv for detailed comparison]

### Competitor Pricing Tiers (UK Pricing)[145][146][147][149][152]

**Entry-Level Tiers (£10-20):**
- **FreshBooks Lite:** £15/month (5 clients)
- **Xero Early:** £13/month (20 invoices)
- **Wave Free:** £0/month (unlimited)
- **Zoho Books Starter:** £11/month (1,000 invoices)
- **QuickBooks Simple Start:** £14/month

**Mid-Level Tiers (£20-40):**
- **FreshBooks Plus:** £25/month (unlimited clients)
- **Xero Growing:** £37/month (unlimited)
- **Zoho Books Standard:** £21/month
- **QuickBooks Essentials:** £28/month

**High-Level Tiers (£40-70):**
- **FreshBooks Premium:** £50/month
- **Xero Established:** £70/month
- **QuickBooks Plus:** £42/month

**Enterprise/Collections-Specific (£150+):**
- **Chaser Growth:** £30/month (5 clients)
- **Chaser Scale:** £60/month (20 clients)
- **Chaser Enterprise:** £150+/month (unlimited)

### Pricing Positioning Strategies[139][141]

**Option 1: Premium Positioning (Top 10%)**
- Price above 90th percentile
- Rationale: Perceived quality, enterprise focus
- Risk: Low conversion rate
- Example: £65-75 for Pro tier (vs competitor average £35)
- Best for: Collections/payment recovery (high ROI, less price-sensitive)

**Option 2: Value Positioning (Middle 50%)**
- Price at 40th-60th percentile
- Rationale: Competitive, perceived fair value
- Target: SMB (largest market)
- Example: £30-40 for Pro tier
- Best for: Balanced growth (conversions + revenue)

**Option 3: Penetration Pricing (Bottom 10%)**
- Price below 20th percentile
- Rationale: Market share, customer acquisition
- Risk: Lower revenue per customer
- Example: £15-20 for Pro tier
- Best for: Freemium plays (upsell focus)

### Recommended Positioning for Relay[139][141]

**Collections-first positioning suggests Premium (vs general invoicing):**

Rationale:
- Collections = higher ROI than invoicing alone
- Collections customers = more price-insensitive
- Collections = higher switching costs
- Collecting unpaid invoices has clear ROI (if software pays for itself in 1-2 collections, WTP is high)

**Suggested Tier Structure:**
```
Starter:  £20/month (10 collections, basic features)
Growth:   £40/month (50 collections, automation)
Pro:      £75/month (unlimited, advanced AI, dedicated support)
```

Rationale:
- £20 entry encourages freelancers
- £40 captures "jobs" market (growing agencies)
- £75 targets agencies (still 30% discount vs £100+ enterprise competitors)
- Price points reflect elasticity research (not competing on price, but value)

---

## Part 4: Pricing Psychology & Optimization

### Charm Pricing: The Magic of £X.99[150][153]

**Research Findings:**
- £19 vs £20: Charm pricing increases conversions 5-10%[150][153]
- £49 vs £50: Effect similar across price ranges
- **Why it works:** Anchoring—our brains see "19" not "20"

**When to Use:**
- ✓ Consumer-facing SaaS (B2C)
- ✓ Lower-priced plans (<£50)
- ✓ Price-sensitive segments (freelancers)
- ✗ Enterprise SaaS (rounded prices perceived as premium)
- ✗ High-priced tiers (£99 is better than £99.99)

**Recommendation for Relay:**
```
Starter:  £19/month (charm pricing - incentivize trial)
Growth:   £39/month (charm pricing - mid-market appeal)
Pro:      £75/month (rounded - premium positioning)
```

### Anchor Pricing: Show Highest Price First[150][153]

**Concept:** Display premium tier first to anchor perception
- User sees "Pro: £75/month"
- Then sees "Growth: £39/month"
- Growth tier feels 50% cheaper (vs if shown first)

**Psychology:** Loss aversion—we evaluate options relative to anchor
- Anchor high → mid-tier feels like "value"
- Anchor low → mid-tier feels "expensive"

**Implementation:**
```
Pricing Page Layout (Top to Bottom):
1. PRO (Enterprise) - £75/month  ← ANCHOR HERE
2. GROWTH (Recommended) - £39/month
3. STARTER (Freemium) - £19/month
```

**Why This Works:**
- User anchors to £75
- Growth (£39) appears as 48% discount
- Conversions to Growth increase 20-30%[153]

### Decoy Effect: Introduce Starter to Make Pro Attractive[153]

**Concept:** Middle-option becomes "best value" when bounded

Traditional 2-tier:
```
Basic: £30 → Some buy
Pro:   £60 → Some buy
```

Add decoy 3-tier:
```
Starter:  £30 → Fewer buy (too limited)
Growth:   £48 → More buy (great value vs Pro!)
Pro:      £60 → Same as before
```

**Why Decoy Works:**
- Growth is 20% cheaper than Pro but 60% more features than Starter
- Users rationally choose Growth (best value ratio)
- Revenue increases (£48 × 60% of users vs £30 × 70%)

**For Relay (Example):**
```
Starter:    £19 (5 collections, basic)
Growth:     £39 (50 collections, automation) ← DECOY: "Best value"
Pro:        £75 (unlimited, AI, support)
```

Result: 70% of users choose Growth (vs 40% without decoy)
- Old: (30% × £19) + (40% × £75) = £35.70 ARPU
- New: (20% × £19) + (70% × £39) + (10% × £75) = £40.80 ARPU (+14% revenue)

---

## Part 5: Discount Strategy

### Annual Discount Benchmarks[154][155][156][161]

**Standard Industry Ranges:**

| Price Range | Typical Discount | Equivalent Months Free | Reasoning |
|---|---|---|---|
| <£10/month | 25-35% | 3-4.2 | Higher churn risk |
| £10-20/month | 20-25% | 2.4-3 | Balance CAC payback |
| £20-50/month | 15-20% | 1.8-2.4 | Standard SMB range |
| £50+/month | 10-15% | 1.2-1.8 | Premium positioning |

**Revenue Impact:**
- "2 months free" = 16.7% discount[161]
- Most SaaS use 15-20% range[156]
- Companies that test discounts grow 30% faster[139]

### Recommended Annual Discount for Relay[154][156]

**Proposed Structure:**

```
Monthly Plans:
├─ Starter: £19/month
├─ Growth:  £39/month
└─ Pro:     £75/month

Annual Plans (20% discount):
├─ Starter: £182.40/year (was £228, save £45.60)
├─ Growth:  £374.40/year (was £468, save £93.60)
└─ Pro:     £720/year (was £900, save £180)
```

**Rationale for 20%:**
- Mid-market SaaS sweet spot (not too aggressive)[155][156]
- Balances CAC payback with conversions
- Improves cash flow (annual revenue upfront)
- Reduces churn (commitment effect)

**ROI Calculation:**
- If annual discount drives 25% more conversions
- And 20% churn reduction (retention bonus)
- LTV increases ~35-40%[154]

### Multi-Year Commitment Discounts[154]

**Tiered Incentive Structure:**

```
1-Year:   15% discount
2-Year:   20% discount + locked pricing
3-Year:   25% discount + locked pricing + priority support
```

**Why This Works:**
- Incremental discounts feel fair (better deal for longer)
- Multi-year contracts increase LTV 43% average[154]
- Locked pricing = customer lock-in
- Priority support = perceived value add

### Founding Member Discounts: Avoid Lifetime Pricing[162]

**NOT RECOMMENDED: "Founding member price for life"**
- Problem: Unsustainable long-term
- Problem: Legacy users undercut future pricing
- Problem: Difficult to change without user backlash

**BETTER ALTERNATIVE: Sunset Discount**

```
"Launch Offer: 50% off your first year"
After 1 year: Price increases to full rate
(Give 30 days notice)
```

**Why Better:**
- ✓ Clear expiration date
- ✓ No lifetime commitment
- ✓ Sustainable long-term
- ✓ Prevents pricing lock-in
- ✓ Builds anticipation for full-price tier

**Implementation for Relay:**
```
2025 Founding Member Offer: 50% off first 12 months
Renewal (Jan 2026): Full price
Transition: Email notification + 30-day warning
```

---

## Part 6: Usage-Based vs Flat-Tier Pricing

### Collection Limits Impact[135][139]

**Current Market Approach:**
- Wave: Unlimited (free)
- FreshBooks: Unlimited on Plus/Premium
- Chaser: Limited by tier (5/20/unlimited)

**For Relay Collections:**

**Option A: Hard Limits**
```
Starter:  10 collections
Growth:   50 collections
Pro:      Unlimited
```

Impact: Forces upgrade when hitting limit (good revenue)
Risk: User frustration if unexpectedly hits limit

**Option B: Soft Limits (Recommended)**
```
Starter:  10 included, then £2/extra
Growth:   50 included, then £1/extra
Pro:      Unlimited (no overages)
```

Impact:
- ✓ No hard stops (better UX)
- ✓ Expansion revenue (overage fees)
- ✓ Perceived flexibility
- ✓ Data shows 30-40% of users pay overages[136]

### Expansion Revenue Strategy[136]

**Value of Overage Fees:**
- Average customer pays 15-25% extra via overages[136]
- Expands revenue without raising tier price
- Feels like "using more features" not "being charged more"
- Users who pay overages: 3x less likely to churn[136]

**Recommended Overage Model for Relay:**
```
Tier          | Included Collections | Per-Collection Overage | Monthly Revenue Impact
─────────────────────────────────────────────────────────────────────────────────
Starter (£19) | 10                   | £1.50 per collection  | +20-30 on avg users
Growth (£39)  | 50                   | £1.00 per collection  | +30-50 on avg users
Pro (£75)     | Unlimited            | None                  | Same
```

**Expansion Revenue Benefit:**
- 40% of Starter users add 2-5 collections/month = +£3-7.50/user
- 35% of Growth users add 10-20 collections/month = +£10-20/user
- Net: ARPU increases 18-25% via expansions[136]

---

## Part 7: A/B Testing Framework for Pricing

### Statistical Significance Requirements[160][163]

**Minimum Sample Sizes:**[160]
- Detecting 20% effect: ~100 conversions per variant
- Detecting 10% effect: ~400 conversions per variant
- Detecting 5% effect: ~1,500+ conversions per variant

**For Relay:**
- Current trial-to-paid: ~200 signups/month
- 10% conversion rate = 20 paid users/month
- Testing £35 vs £40 (14% increase):
  - Need 400 conversions per variant = 4 months per test[160][163]
  - OR: Run both simultaneously (2 months to reach 400 each)

### Recommended A/B Test Setup[160][163]

**Test Design:**

```
Control (Current):
├─ Tier: Growth
├─ Price: £39/month
├─ Copy: "50 collections per month"

Treatment (Test):
├─ Tier: Growth (same)
├─ Price: £44/month (13% increase)
├─ Copy: "50 collections per month" (same)

Target Effect: Detect 10% revenue change (some conversion loss, net revenue up)
Sample Size: 400 conversions per variant (800 total)
Duration: 8-10 weeks
Randomization: 50/50 split
```

**Key Metrics to Track:**[160][163]

1. **Primary:** Revenue per visitor (£44 × 45% conversion vs £39 × 50% conversion)
2. **Secondary:** Conversion rate (%), Upgrade rate, 30-day retention
3. **Segmented:** By source (organic/paid), by user type (freelancer/agency)

### Running Multiple Price Tests[160][163]

**Sequential Testing Approach:**

```
Month 1-2: Test £35 vs £40 (Growth tier)
↓ If £40 wins:
Month 3-4: Test £40 vs £45 (Growth tier)
↓ If £45 wins:
Month 5-6: Test £45 vs £50 (Growth tier)

Result: Find price ceiling using sequential testing
```

**Advantages:**
- Don't waste time on losing prices
- Compounds revenue improvements
- 30% faster revenue growth than single test[139]

### Avoiding Common Pitfalls[160][163]

**Pitfall 1: Insufficient Sample Size**
- 67% of SaaS companies test with too few samples[163]
- Risk: Inconclusive results, wasted time
- Fix: Calculate sample size upfront using power analysis

**Pitfall 2: Ending Tests Too Early**
- "Results look good, let's stop now"
- Risk: Regression to mean, false positive
- Fix: Run full planned duration (predetermined)

**Pitfall 3: Only Tracking Conversions**
- Pricing tests affect lifetime value (churn, expansion)
- Risk: Miss long-term revenue impact
- Fix: Track cohorts through 6-12 months

**Pitfall 4: Not Segmenting Results**
- Overall result: No change
- But: Freelancers +15%, Agencies -5%
- Risk: Leave money on table
- Fix: Analyze results by customer segment

---

## Recommended Pricing for Relay (Collections-First SaaS)

### Proposed Tier Structure[139][141][150]

```
STARTER
└─ £19/month (charm pricing)
   ├─ 10 collections included
   ├─ 1 team member
   ├─ Basic automation
   ├─ Email + SMS reminders
   └─ CTA: "Perfect for freelancers"

GROWTH (Recommended)  ← Anchor with Pro first
└─ £39/month (charm pricing, 20% annual discount £374/year)
   ├─ 50 collections included
   ├─ 5 team members
   ├─ Advanced automation
   ├─ Email + SMS + WhatsApp
   ├─ Basic AI/analytics
   └─ CTA: "Best value for growing teams"

PRO (Premium positioning)
└─ £75/month (rounded, 20% annual discount £720/year)
   ├─ Unlimited collections
   ├─ Unlimited team members
   ├─ AI-powered strategies
   ├─ All channels (Email/SMS/WhatsApp/Phone)
   ├─ Dedicated support
   └─ CTA: "For serious collectors"
```

### Rationale[139][150]

1. **Charm pricing on £19 & £39** = appeals to price-sensitive (freelancers)
2. **Rounded £75** = premium positioning (serious agencies)
3. **20% annual discount** = industry standard, improves retention
4. **Growth as default** = decoy effect (best value ratio)
5. **Collections-based limits** = reflects value (more collections = more ROI)
6. **Usage-based overages** = expansion revenue + flexibility

### Pricing Psychology Applied

1. **Anchor:** Show Pro first (£75) to make Growth feel 50% cheaper
2. **Charm:** Use £19 & £39 to appear budget-friendly
3. **Decoy:** Growth is bounded by Pro (best value = choose Growth)
4. **Social proof:** "Join 10,000+ freelancers using Relay"
5. **Risk reversal:** "30-day free trial, cancel anytime"

---

## Implementation Roadmap

### Month 1: Research Phase
- [ ] Run Van Westendorp survey (500 respondents)
- [ ] Conduct conjoint analysis with 300+ respondents
- [ ] Survey existing customers about WTP
- [ ] Map competitor pricing in detail

### Month 2: Pricing Design
- [ ] Finalize tier structure & pricing
- [ ] Design 3-tier vs 4-tier options
- [ ] Calculate LTV impact of annual discount
- [ ] Develop messaging for each tier

### Month 3-4: Soft Launch
- [ ] Launch new pricing to 20% of users
- [ ] Monitor conversion rate & revenue
- [ ] Collect qualitative feedback
- [ ] Adjust messaging if needed

### Month 5-6: A/B Test
- [ ] Test price points (£39 vs £44 Growth tier)
- [ ] Track 8-week test with 400+ conversions per variant
- [ ] Analyze by segment (freelancer vs agency)

### Month 7+: Optimize & Scale
- [ ] Roll out winning price to 100%
- [ ] Monitor churn & expansion revenue
- [ ] Run second price test if first was successful
- [ ] Plan annual pricing review

---

## Key Takeaways

1. **Elasticity:** Collections software has moderate elasticity (0.7-0.9)—room to raise prices
2. **WTP:** Use Van Westendorp to identify optimal price range (£20-40 recommended)
3. **Positioning:** Premium positioning justified (collections = high ROI for customers)
4. **Psychology:** Charm + anchor + decoy effects increase conversion 10-20%
5. **Discounts:** 20% annual discount standard; avoid lifetime pricing
6. **Testing:** A/B test one variable at a time; need 400+ conversions per variant
7. **Segmentation:** Freelancers vs agencies have 2-3x different WTP—consider separate pricing
8. **Expansion:** Usage-based overages increase ARPU 18-25% without tier price increases

---

## References

[135] Paddle - Price Elasticity for SaaS
[136] Reddit - B2B SaaS Pricing with Patrick Campbell
[137] YouTube - Value-Based Pricing from 20k+ SaaS Companies
[139] Get Monetizely - Measuring Price Elasticity in B2B SaaS
[140] Conjointly - Van Westendorp Price Sensitivity Meter
[141] Get Monetizely - Conjoint Analysis for SaaS Pricing
[143] SurveyMonkey - Van Westendorp Price Sensitivity Meter
[144] Qualtrics - Conjoint Analysis in Pricing
[145-152] Competitor pricing comparisons
[150] Get Monetizely - Pricing Psychology Mastery
[151] RevPartners - SaaS Metrics & Benchmark Cheat Sheet
[153] SanketeKher - SaaS Pricing Psychology Strategies
[154] Get Monetizely - Annual Discounts for Vertical SaaS
[155] Recurly - SaaS Benchmarks for Subscription Plans
[156] OpenView Partners - Monthly vs Annual Contracts
[157] SaaStr - Discounting Logic
[158] PayPro Global - SaaS Discount Strategy
[160] CraftUp Learn - Pricing Experiments SaaS
[161] Glen Coyne - Annual SaaS Discount Strategy
[163] Get Monetizely - Statistical Significance in Price Testing

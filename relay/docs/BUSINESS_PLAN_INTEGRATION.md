# Relay Business Plan Integration (Strategic & Financial Layer)
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Bridge product implementation roadmap to business model: positioning, monetization levers, growth loops, financial projections, behavioral frameworks (Hooked + Oversubscribed), risk mitigation, KPI targets.

## 2. Positioning Statement
"Relay helps freelancers and small agencies recover more revenue faster through automated, compliant collections and ultra-fast voice-powered invoicing."
Differentiators: Voice invoice creation; compliant interest & compensation automation; escalation visualization; referral & social proof loop.

## 3. Target Segments
| Segment | Need | Segment Size (UK/EU est.) | Core Value Prop |
|---------|------|---------------------------|-----------------|
| Freelance Designers/Developers | Overdue invoice recovery | ~1.2M+ | Faster payments + less chasing |
| Small Agencies (2–20 staff) | Cash flow predictability | ~250K | Recovery automation & analytics |
| Consultants | High-value invoices | ~180K | Legal escalation & professional image |

## 4. Pricing Strategy (Migration to 3 Tiers)
Starter (£19), Growth (£39), Pro (£75) monthly; 20% annual discount. Lifetime founding discount preserved for early adopters. Enterprise (custom) reserved for advanced integrations (API volume, dedicated success). Decoy anchored with Growth (feature concentration).

## 5. Revenue Model Drivers
1. New MRR (plan upgrades).  
2. Upsell conversion from recovered revenue improvements (case studies).  
3. Referral loop reducing CAC.  
4. Annual prepay improving retention & cash flow.  
5. Add-on (future): AI collections voice calls (usage-based).  

## 6. Growth Loops
Acquisition → Activation → Recovery Success → Social Proof Display → Referrals → Additional Acquisition.
Key Loop Accelerators: Dynamic anonymized stats, badges (social status), milestone emails.

## 7. Hooked Model Mapping
| Stage | Mechanism | KPI |
|-------|-----------|-----|
| Trigger | Onboarding emails, dashboard checklist | Activation first invoice rate |
| Action | Create/send invoice (voice faster) | Time-to-first-invoice |
| Variable Reward | Payment success + confetti + recovery stats | Recovery rate, days to payment |
| Investment | Adding clients, enabling voice, configuring templates | Retention (Day 30), upgrade rate |

## 8. Oversubscribed Levers
Scarcity: Founding discount limited cohort.  
Status: Badges & recovery leaderboard.  
Authority: Publish monthly recovery benchmarks report.  
Momentum: Timed upgrade prompts at usage thresholds (invoice cap).  
Social Proof: Dynamic "£X recovered today" stats.

## 9. KPI Targets (12-Month Horizon)
| KPI | Month 0 Baseline | Month 12 Target |
|-----|------------------|-----------------|
| Activation first invoice <24h | 20% | 50% |
| Free→Paid conversion | 3% | 7% |
| Recovery rate | 70% | 85% |
| Avg Days to Payment | 35 | 20 |
| Referral K-factor | 0.3 | 0.9 |
| Voice Adoption (invoice sessions) | 0% | 45% |
| Monthly Net Churn | - | <4% |
| Annual Prepay Mix | 0% | 35% of paid |

## 10. Financial Projection (Illustrative)
Assumptions:  
- Month 0 paying users: 200 (mix Starter 60%, Growth 30%, Pro 10%).  
- Monthly new free signups: 1200.  
- Activation: increases gradually to target.  
- Conversion uplift influenced by onboarding & voice feature.  
Simplified Projection Table (MRR Approx):
| Month | Paying Users | ARPU (£) | MRR (£) |
|-------|--------------|----------|---------|
| 0 | 200 | 32 | 6,400 |
| 3 | 350 | 34 | 11,900 |
| 6 | 600 | 36 | 21,600 |
| 9 | 900 | 37 | 33,300 |
| 12 | 1300 | 38 | 49,400 |
Drivers: ARPU gain via pricing rationalization & Pro plan adoption (better recovery analytics). Annual prepay recognized proportionally (not full cash inflow here).

## 11. CAC & Referral Impact
Baseline CAC (paid acquisition): £60.  
Referral share target Month 12: 25% of new paying users.  
Effective blended CAC reduces to ≈ £45 (model: CAC_blended = (paid_CAC*paid_ratio + referral_CAC*ref_ratio)). Referral CAC assumed negligible aside from incentive credits.

## 12. Unit Economics Snapshot (Month 12 Goal)
Gross Margin assumption (SaaS): 85%.  
Support + Infra cost per user: £4/mo.  
Net Contribution/user (avg): (ARPU £38 * 0.85) - £4 ≈ £28.3.  
Payback Period (CAC £45): ~1.6 months.

## 13. Upgrade Triggers & Messaging
Trigger Points: Invoice cap, overdue invoices count, voice feature engagement, recovery improvement prediction.  
Messaging Framework: Problem (manual chasing) → Outcome (85% recovery) → Proof (stat + anonymized cohort) → Low-risk (money-back guarantee).

## 14. Risk Matrix (Business-Level)
| Risk | Impact | Mitigation | Metric Watch |
|------|--------|-----------|--------------|
| Pricing confusion | Medium | FAQ + migration banner | Support tickets volume |
| Voice accuracy dissatisfaction | High | Fallback batch + WER monitoring | Feature usage churn |
| Low referral adoption | Medium | In-app milestone prompts | Referral K-factor |
| High churn early cohorts | High | Activation improvements + win-back emails | Net churn |
| Compliance/interest miscalc | High | Unit tests + audit trail | Charge dispute count |

## 15. Strategic Milestones
Q1: Voice MVP, pricing refactor, activation improvements.  
Q2: Collections visualization, referral loop launch, accessibility pass.  
Q3: AI collections calls (beta), content pillar traction, experiment scaling.  
Q4: Enterprise pilot, advanced predictive analytics (payment forecasting).

## 16. Experiment Portfolio Governance
Rule: Max 3 concurrent; each must have clear hypothesis & primary metric.  
Adoption Threshold: ≥5% lift with ≥95% confidence and no negative side-effect metric (e.g., unsubscribe rate).  
Archive: Experiments archived in `analytics/experiments/` with outcome summary.

## 17. Data & Analytics Governance
Event Schema versioning (EVENT_SCHEMA.json).  
Monthly audit: property drift, PII leakage checks.  
Retention compliance executed (evidence purge).  
Documented operational procedures updated after each phase.

## 18. Success Criteria for Funding Narrative
Demonstrable reduction in days to payment, increase in recovery rate, strong activation funnel conversion, healthy referral-driven growth share.

## 19. Executive Dashboard Summary (Metrics to Display)
1. Activation (first invoice <24h %)  
2. Recovery rate & trend line  
3. Voice adoption %  
4. Free→Paid conversion (rolling 30d)  
5. Referral K-factor  
6. Churn %  
7. MRR & Net adds  
8. Average days to payment  
9. Experiment outcomes (last 2)  
10. Support SLA breach rate

## 20. Go / No-Go Strategic Gates
Gate 1 (Post Phase 1): Activation ≥30%; proceed with pricing full migration.  
Gate 2 (Post Phase 2): Recovery ≥75%; allocate resources to referral expansion.  
Gate 3 (Post Phase 3): K-factor ≥0.6; greenlight AI collections voice pilot.  
Gate 4 (Post Phase 4): MRR growth trajectory meets projection; prepare enterprise pilot.

## 21. Decision Log (Business Layer)
```
2025-11-15 | Tier rationalization (3 tiers) | Improve clarity & ARPU | Product | Revisit Q3 2026
2025-11-15 | Annual discount 20% | Balance retention & margin | Product | Revisit Q2 2026
2025-11-15 | Founding discount lifetime honored | Early adopter trust | Founder | Revisit never
```

## 22. Open Strategic Questions
1. Enterprise pricing guardrails?  
2. Voice feature potential usage-based pricing tier?  
3. International late fee variations (expansion).  
4. Additional growth lever: partnerships or integrations marketplace?  
5. Predictive analytics monetization (add-on vs core Pro).

## 23. Next Actions
1. Validate pricing migration outcome analytics instrumentation.  
2. Draft recovery benchmarks report template.  
3. Populate executive dashboard skeleton.  
4. Define enterprise pilot qualification criteria.  
5. Evaluate usage-based voice pricing feasibility.

End of Business Plan Integration v1

# Relay Rolling Roadmap & Migration Plan
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Operational playbook for phased rollout, pricing migration, feature flags, success metrics tracking, risk management, communication cadence. Complements MASTER_IMPLEMENTATION_AUDIT and ENGINEERING_IMPLEMENTATION_SPECS.

## 2. Guiding Principles
1. Measure before optimize (analytics first).  
2. Ship smallest viable slice for feedback.  
3. Backwards compatibility with clear rollback paths.  
4. Compliance & accessibility not deferred.  
5. Communicate user-facing changes with clear value framing.

## 3. Phase Breakdown (90 Days)
| Phase | Weeks | Focus | Key Deliverables | Gates |
|-------|-------|-------|------------------|-------|
| 1 | 1–3 | Activation & Instrumentation | Analytics layer, Voice MVP, Checklist, Interest util, Email worker | P0 events firing; voice latency baseline established |
| 2 | 4–6 | Collections & Pricing | Escalation engine + timeline, Payment claim upgrade, Pricing 3-tier | Recovery rate trending upward | 
| 3 | 7–9 | Growth & Compliance | Referral program, Accessibility upgrades, Help center scaffold | Axe CI clean; referral dashboard live |
| 4 | 10–12 | Delight & Content | Micro-interactions, Content pillar + tool, Iterative improvements | Activation >35%; K-factor report produced |

## 4. Pricing Migration Plan
Current State: 4 tiers (Free/Starter/Pro/Business + founding discount).  
Target: 3 tiers (Starter/Growth/Pro) + Annual 20% discount; Enterprise by contact.
Steps:
1. Analysis: Export subscription counts & revenue per tier.  
2. Mapping: Business → Pro or Enterprise negotiation; Starter remains; Founding discount preserved per user token.  
3. Stripe Prep: Create new plan IDs (`starter_monthly`, `growth_monthly`, `pro_monthly`, annual variants).  
4. Feature Flags: `PRICING_V3_ENABLED=false` initially.  
5. Dual Rendering: Hidden path `/pricing-v3-preview` for internal QA.  
6. Communication: Email sequence to Business users (value framing + migration incentive).  
7. Launch: Flip flag → replace pricing page; monitor upgrade events & support tickets.  
8. Follow-up: 30-day analysis vs baseline (conversion, ARPU).  
Rollback: Re-enable legacy component; maintain mapping table.  
Success Criteria: Pricing page bounce down 10%; plan selection CTR up 15%; free→paid +1–2pp.

## 5. Feature Flag Strategy
| Flag | Default | Scope | Rollout Criteria | Rollback Condition |
|------|---------|-------|------------------|--------------------|
| VOICE_INPUT_ENABLED | false | Invoice creation page | Successful latency tests p95<1500ms | Error rate >10% sessions |
| PRICING_V3_ENABLED | false | Pricing page | Internal QA + migration comm sent | Conversion drop >5% week over week |
| COLLECTIONS_AUTOMATION_V2 | false | Escalation job + UI | Interest calc validated | Incorrect charge application incidents |
| REFERRAL_PROGRAM_V1 | false | Dashboard referrals page | Fraud heuristics active | Abuse/fraud > threshold |

## 6. Communication Cadence
Internal:
- Weekly engineering sync: phase status & blockers.  
- Bi-weekly metrics review: activation, conversion, recovery.  
External (users):
- Pre-pricing migration email (T-7 days).  
- Launch day changelog + blog post (pricing & voice).  
- Monthly “Recovery Insights” report (collections metrics anonymized).  

## 7. Metrics & Monitoring Implementation
Dashboards:
1. Activation Funnel: signup→invoice_created→invoice_sent→payment_received.  
2. Recovery KPIs: recovery_rate, days_sales_outstanding (DSO).  
3. Voice Usage: sessions_with_voice / total_invoice_sessions.  
4. Referral: K-factor = invites_sent * conversion_rate.  
5. Pricing Conversion: plan_selection_rate, upgrade_time_median.
Alert Thresholds:
```
activation_first_invoice_rate <30% for 3 days → alert
voice_error_rate >10% daily → disable flag
recovery_rate_weekly_drop >10% → investigate collections changes
referral_fraud_flags >5/week → manual review
```

## 8. Resource & Capacity Estimates
| Epic | Eng Weeks (1 dev equiv) | Parallelization |
|------|------------------------|----------------|
| Analytics Layer | 1.5 | High |
| Voice Input MVP | 2 | Medium |
| Onboarding Checklist | 1 | High |
| Interest + Escalation | 2.5 | Medium |
| Email Worker + Templates | 1 | High |
| Pricing Refactor | 1.5 | Medium |
| Referral Program | 1.5 | Medium |
| Accessibility Enhancements | 1 | High |
| Micro-interactions | 0.5 | High |
| Content Pillar + Tool | 1 | Medium |
Total (sequential) ≈ 14 Weeks; parallel execution fits 90-day goal.

## 9. Go / No-Go Checklists
Voice Launch:
[] p95 latency <1500ms  [] Confetti events unaffected  [] Error logging integrated  [] Consent text approved.
Pricing Launch:
[] All new plan IDs live  [] Migration emails sent  [] Legacy banner visible  [] Conversion baseline captured.
Collections Automation:
[] Interest util validated  [] Escalation thresholds correct  [] Pause/resume test passed  [] Audit trail persists.
Referral Program:
[] Fraud heuristics active  [] Milestone awarding tested  [] K-factor script output  [] Share events tracked.

## 10. Risk Register (Expanded)
| Risk | Likelihood | Impact | Mitigation | Owner |
|------|-----------|--------|-----------|-------|
| Voice transcription poor | Med | High | Fallback batch, monitor WER | Eng Lead |
| Pricing confusion | Med | Med | Clear comms + FAQ | Product |
| Escalation misapplies charges | Low | High | Unit tests + sandbox simulation | Eng |
| Referral fraud spike | Med | Med | Heuristics + manual review queue | Growth |
| Accessibility regression | Low | Med | Axe CI + manual audit | QA |
| Email deliverability drop | Low | Med | Auth record verification, warm IP | Ops |

## 11. Data & Instrumentation Rollout
Order:
1. Implement wrapper & minimal events (signup/invoice/payment).  
2. Add collections & voice events.  
3. Add referral & pricing events.  
4. Introduce error taxonomy & performance metrics.  
5. Weekly funnel report automation.

## 12. Pricing Migration Communication Assets
Email 1 (Announcement): Value framing + timeline.  
Email 2 (Reminder): Last chance to accept migration incentive.  
FAQ Items: Why fewer tiers? How founding discount persists? What happens to Business plan?  
In-App Banner: “New pricing launching DATE – See improvements”.

## 13. Post-Launch Optimization Loop
Cadence: Weekly review → identify friction event drop-offs → propose small experiments (subject lines, CTA copy, plan card micro-copy).  
Metrics for experiments: conversion uplift %, confidence interval, time-to-value delta.

## 14. Data Retention & Compliance Steps
Evidence files: retention 30 days then purge job.  
Transcripts: store only final text; raw audio ephemeral unless opted in.  
Late charge audit trail: 7-year retention (metadata only).  
Deletion workflow: user request triggers anonymization of events & removal of PII fields.

## 15. Rollback Procedures (Detailed)
Voice: Flip flag; remove recorder UI; maintain transcript objects but mark `method:'manual'` for fallback.  
Pricing: Re-render legacy component; maintain redirect from `/pricing` to `/pricing-legacy`; revert plan selection events mapping.  
Collections: Disable escalation job; revert status UI to “Overdue” simple badge; stop interest application; log rollback event.

## 16. Success Metrics Targets (Reiterated)
Activation first invoice <24h: 40% target.  
Free→Paid conversion: 5–8%.  
Recovery rate: ≥80%.  
Voice usage share: ≥30%.  
Referral K-factor: 0.8–1.0.  
Accessibility serious issues: 0.  
Pricing page bounce reduction: ≥10%.  
Average upgrade time: <10 days.

## 17. Decision Log Template
```
DATE | Decision | Options Considered | Rationale | Owner | Revisit Date
```
Start using for: Pricing discount %, referral milestone thresholds, evidence retention length.

## 18. Weekly Report Outline
Sections: Funnel Metrics | Recovery KPIs | Voice Performance | Referral Stats | Experiments | Risks & Mitigations.  
Auto-generated file path: `analytics/weekly/YYYY-MM-DD.md`.

## 19. Outstanding Actions Before Phase 1 Start
[] Finalize event property schema  [] Add feature flags  [] Provision API keys  [] Draft pricing migration FAQ  [] Confirm retention durations  [] Baseline metrics capture (export).  

## 20. Stakeholder Sign-Off
| Role | Name | Approved |
|------|------|----------|
| Product | TBD | [ ] |
| Engineering | TBD | [ ] |
| Growth | TBD | [ ] |
| Compliance | TBD | [ ] |

End of Rolling Roadmap & Migration Plan v1

---
## 21. Support SLA Instrumentation Plan
Metrics: FRT (First Response Time), RTS (Resolution Time), Escalation Count, SLA Breach Rate.
Instrumentation Steps:
1. Ticket creation event logs SLA target hours.  
2. Cron updates elapsed; if >80% -> warning notification; if breach -> escalation event.  
3. Weekly SLA report appended to `analytics/weekly/YYYY-MM-DD.md`.
Thresholds: Free FRT target <4h; Pro <2h; Breach rate goal <5%.

## 22. Email Deliverability Checklist
Pre-Launch:
[] SPF record published  
[] DKIM keys validated  
[] DMARC policy p=none initial  
[] Plain text fallback present  
[] Unsubscribe link (non-transactional)  
[] Seed inbox tests (Gmail, Outlook, iCloud)  
Ramp: Move DMARC → quarantine (Week 2) → reject (Week 6).

## 23. Performance Budget Enforcement
Tooling: Lighthouse CI + custom WS latency collector.
Failure Conditions: Dashboard TTI >2500ms for 3 runs; Voice partial latency p95 >1500ms; Pricing LCP >2200ms; JS main bundle >300KB gzip.
Action: Block deployment; trigger optimization task (code splitting or caching).

## 24. Experiment Backlog & Cadence
Initial Experiments (rotate every 2 weeks):
1. Welcome subject emotional vs plain.  
2. Pricing card layout variant.  
3. Reminder first notice Day 5 vs Day 7.  
4. CTA copy invoice creation.  
Data Collection: Use `ab_test_variant_assigned` & funnel events.  
Decision Rule: ≥95% statistical confidence & ≥5% relative uplift to adopt.

## 25. Referral Program Communication Assets (Detailed)
Launch Email: "Earn credits helping others get paid" including two-sided rewards summary.  
In-App Modal: After first payment → referral CTA with projected credit calculator.  
Help Center Article: "How Referral Credits Work".  
Banner Rotation: Weekly dynamic stat (total credits awarded).  
KPIs: Referral signup volume, paid conversion rate, K-factor.

## 26. Dynamic Social Proof Rollout
Phase 2 Introduce anonymized daily recovery stats; hide if sample<50.
Validation: Manual review of data feed for outliers before enabling on pricing.
Monitoring: If anomaly (>200% spike) hide and alert.

## 27. Data Retention Operational Tasks
Jobs:
- Nightly evidence purge (older than 30d).  
- Weekly DMARC aggregate parsing.  
- Monthly transcript privacy audit (verify no raw audio persisted).  
Logs retained in `compliance/retention/YYYY-MM-DD.json`.

## 28. Business Plan Integration Hooks
Metrics imported: Activation %, Recovery %, Conversion %, K-factor, Voice adoption.
Review Cadence: Monthly; adjust projections if deviation >10% from target.
Flagged Items: Pricing ARPU shift; referral CAC reduction; collections recovery improvement.

## 29. Rollback Drill Schedule
Quarterly simulated rollback of voice & pricing features (staging).  
Checklist outcome recorded; diff of database state inspected for anomalies.

## 30. Expanded Risk Register Entries
| Risk | New Trigger | Mitigation Update |
|------|-------------|-------------------|
| Referral abuse via disposable emails | >3 disposable domains/week | Add domain blacklist auto-update |
| Stat misrepresentation (social proof) | Data feed stale >15m | Auto-hide + regenerate cache |
| Pricing confusion post-migration | Support tickets > baseline +30% | Launch contextual FAQ popover |
| SLA breaches surge | Breach rate >8% week | Temporary staff allocation + automation tuning |

## 31. Success Metrics Phase Gate Summary (Updated)
Phase 1 Exit: Activation first invoice ≥30%, analytics events ≥90% implemented, voice latency p95 <1500ms.  
Phase 2 Exit: Recovery rate ≥75%, pricing conversion uplift baseline +1pp, escalation timeline visible.  
Phase 3 Exit: Accessibility axe serious=0, referral K-factor ≥0.6, help center categories live.  
Phase 4 Exit: Activation ≥40%, recovery ≥80%, conversion ≥5%, voice usage ≥30%, K-factor ≥0.8.

## 32. Decision Log (Initial Entries Placeholder)
Will be appended as decisions finalized:
```
2025-11-15 | Annual discount fixed at 20% | Considered 15/20/25 | Balances value & margin | Product | 2026-01-15
2025-11-15 | Evidence retention 30d | Considered 30/60/90 | Minimizes storage & exposure | Compliance | 2026-02-01
```

## 33. Documentation Integrity Check
All research-derived items tracked: Verified against RESEARCH_SUMMARIES_MAPPING supplemental table (no orphaned insights). Future placeholders flagged.

---
End of Rolling Roadmap & Migration Plan v1 (Augmented)

---
## 34. Extended Documents Reference
The following newly added specification documents support roadmap execution beyond initial 90‑day phases:
| Doc | Purpose | Roadmap Phase Alignment |
|-----|---------|--------------------------|
| notifications-system-spec.md | Implement unified notification delivery & suppression | Phase 2 (Escalation visibility) |
| support-sla-spec.md | SLA metrics, escalation, breach automation | Phase 3 (Help center & support) |
| retention-lifecycle-spec.md | Data minimization & purge workflow | Phase 1 (Compliance early) |
| analytics-event-emitter-spec.md | Reliable client/server event instrumentation | Phase 1 (Activation metrics) |
| experiments-framework-spec.md | Controlled A/B testing harness | Phase 4 (Optimization loop) |
| performance-ci-config.md | Automated performance budget enforcement | Cross‑phase (Continuous) |
| fraud-heuristics-spec.md | Guard against referral/collections abuse | Phase 3 (Growth & Compliance) |
| dynamic-social-proof-spec.md | Real‑time anonymized stats for conversion uplift | Phase 2/4 (Pricing & Delight) |
| accessibility-action-list.md | Concrete tasks ensuring WCAG compliance | Phase 3 (Accessibility upgrades) |
| event-schemas-batch-2.md | Additional events to complete instrumentation | Phase 1 (Baseline extension) |

## 35. Extended Phase Gate Additions
Phase 1 Exit (Extended): Batch‑2 events implemented; retention purge job dry run successful.
Phase 2 Exit (Extended): Notifications unread latency <1s; social proof stats privacy threshold enforced.
Phase 3 Exit (Extended): SLA breach rate <5%; accessibility action list tasks 100% complete.
Phase 4 Exit (Extended): Experiment harness ≥2 completed tests with statistical confidence; performance CI zero sustained budget breaches.

## 36. Additional Risk Mitigations (Extended Scope)
| Risk | Mitigation | Trigger Threshold |
|------|-----------|-------------------|
| Notification fatigue | 24h behavioral cap enforcement | >5 behavioral sends/24h |
| Experiment contamination | Deterministic assignment hash | Variant imbalance >1.1x |
| Social proof misinterpretation | Hide stats < sample threshold | sample_size <50 |
| Performance regression silent | CI gating & alert channel | 2 consecutive CI fails |
| Retention purge failure | Daily integrity audit & checksum | Missing purge log vs schedule |

## 37. Action Items to Integrate Extended Docs
1. Scaffold analytics emitter & validate batch‑2 schemas.
2. Implement notification repository + suppression rules.
3. Create ticket model & SLA cron job.
4. Add retention queue & anonymization util.
5. Configure Lighthouse CI + Web Vitals collection.
6. Implement experiment assignment API & exposure events.
7. Deploy social proof stats service & caching.
8. Codify fraud heuristics & override workflow.
9. Execute accessibility tasks & contrast token mapping.

## 38. Decision Log (Extended Entries Placeholder)
Future decisions to append: Notification quiet hours localization, sample size threshold default, fraud score threshold for auto‑flag.

---

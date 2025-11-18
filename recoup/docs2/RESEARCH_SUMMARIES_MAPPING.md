# Relay Research Summaries & Feature Mapping (Full Set)
Version: 1.0  |  Date: 15 Nov 2025

## Purpose
This document enumerates each research source (25) with: Purpose, Top 5 Actionable Highlights, Mapped Features (in product or planned), Unresolved Items (gaps), and Priority Tag (P0/P1/P2). Use this to ensure no research insight is lost during implementation.

Legend:  
Status Codes → Implemented (I), Planned (P), Gap (G), Needs Validation (V)  
Priority → P0 (High impact), P1 (Medium), P2 (Supporting / Later)

---
## 1. Voice Input Business UX (P0)
Purpose: Define business value + differentiator for rapid invoice creation.
Top 5 Highlights:
1. 30–40% faster time-to-first-invoice with voice dictation.  
2. Hybrid transcription (streaming low-latency + accurate batch).  
3. WER benchmark goal <7% final transcript.  
4. Immediate interim text → confidence & edit control.  
5. Privacy toggle for raw audio retention.  
Mapped Features: Voice Input MVP (P), Latency metrics (G), Privacy toggle (G).  
Unresolved: Latency instrumentation spec, fallback heuristics, consent UI wording.  

## 2. Voice-to-Text UX Guide (P0)
Purpose: Micro-interaction patterns for transcription UI.
Top 5 Highlights: Waveform animation, Interim transcript opacity 0.6, Error retry pattern, Accessible record button ARIA, Manual segment editing.
Mapped: Waveform component (P), Interim styling (P), Accessibility spec (P).  
Unresolved: Editing pattern diff vs invoice field, error states library.

## 3. Invoice Creation UX (P1)
Purpose: Optimal single-page layout & progressive disclosure.
Top 5: Inline validation on blur, Dynamic line item add, Client auto-complete, Real-time totals, Minimal friction default currency.
Mapped: Single-page invoice (I partial), Validation (V), Auto-complete (G).  
Unresolved: Currency fallback rules, validation message copy list.

## 4. Multistep Form UX (P2)
Purpose: Guidelines contrasting multi-step vs single page.
Top 5: Reduce steps for first task; use multi-step only for complex flows; show progress indicator; keep action above fold; escape hatch cancel.
Mapped: Single-page chosen (I), Progress indicator (G for long forms), Cancel flow (V).  
Unresolved: Decision log linking rationale.

## 5. Dashboard & Onboarding (P0)
Purpose: Activation acceleration via checklist & empty states.
Top 5: 3-step checklist, Confetti only for first successes, Empty states with single CTA, Dwell-based tooltip hints, Activation milestone tracking.
Mapped: Checklist (P), Confetti triggers (P), Tooltips (G).  
Unresolved: Tooltip dwell timers, milestone schema finalization.

## 6. Email Reminder Best Practices (P0)
Purpose: Tone ladder & engagement optimization.
Top 5: Day 5 friendly, Day 15 firm, Day 30 legal, Personalization tokens, Clear subject urgency.
Mapped: Tone ladder templates (P), Personalization tokens (P).  
Unresolved: Final template A/B set, fallback for missing client name.

## 7. Transactional Email Template Guide (P1)
Purpose: Structure & deliverability fundamentals.
Top 5: Plain text early, SPF/DKIM/DMARC essential, Clear unsubscribe mechanics (non-critical onboarding), Accessible CTA contrasts, Avoid spam trigger words.
Mapped: Plain text welcome (P), Auth records (G), Accessibility CTA (G).  
Unresolved: DMARC policy level decision, spam vocab blacklist.

## 8. Pricing Implementation Framework (P0)
Purpose: Tier psychology & revenue optimization.
Top 5: 3-tier anchor (Starter/Growth/Pro), Annual 20% toggle, Middle tier “Most Popular”, Decoy comparison row, Transparent upgrade triggers.
Mapped: Pricing page (I misaligned), Annual toggle (G), Decoy row (G).  
Unresolved: Migration script, messaging strategy for legacy Business tier.

## 9. SaaS Pricing Optimization Guide (P1)
Purpose: Research-driven price sensitivity & upgrade friction reduction.
Top 5: Van Westendorp acceptable range, Remove cognitive overload >4 tiers, Highlight value vs cost (ROI examples), Annual prepay retention boost, Harmonize rounding (£19/£39/£75).
Mapped: ROI examples (P), Round pricing (G).  
Unresolved: Survey integration, periodic price review process.

## 10. Freemium Conversion Optimization (P0)
Purpose: Increase free→paid via triggers & nurture.
Top 5: Time-based Day 7 & 14 upgrade emails, Usage threshold prompts, Limit-based friction (invoice cap), Social proof mid-sequence, Behavioral re-engagement (no login 7d).
Mapped: Sequence (P), Limit upgrade email (G).  
Unresolved: Invoice cap constant confirmation, dynamic usage prompt copy.

## 11. Collections Implementation Guide (P0)
Purpose: Escalation automation for late payments.
Top 5: Gentle→Firm→Final→Agency progression, Timeline visualization, Pause on claim, Interest application logic, Recovery KPIs (DSO, recovery rate).
Mapped: Escalation engine (P), Pause logic (P), KPIs (G).  
Unresolved: Visualization spec, agency handoff criteria.

## 12. Late Payment Law Guide (P0)
Purpose: Compliance & charge calculations.
Top 5: Interest formula base+8%, Fixed fees £40/£70/£100, Clear disclosure before application, Transparent final notice language, Audit trail of charge calc.
Mapped: Interest util (P), Final notice template (P).  
Unresolved: Disclosure placement, audit trail schema.

## 13. Payment Verification Guide (P1)
Purpose: Evidence-based pause & trust.
Top 5: Evidence upload, 48h verification window, Status chip, Auto-resume collections, Reason taxonomy.
Mapped: Basic verify UI (I), Evidence upload (P), Countdown (P).  
Unresolved: Reason taxonomy list, reminder scheduling during pause.

## 14. Help Documentation Structure (P1)
Purpose: Self-service deflection.
Top 5: 5 category architecture, Search gap analysis monthly, Contextual tooltips linking articles, Article success metric (CTR), Versioning & changelog.
Mapped: Categories (G), Tooltips (G), Gap analysis (G).  
Unresolved: Category list finalization, success KPIs thresholds.

## 15. Support Strategy Guide (P1)
Purpose: Tiered SLA & escalation.
Top 5: Tier 1 self-serve, Tier 2 async email (<24h), Tier 3 priority (Pro), Escalation triggers, Metrics: FRT/RTS/CSAT.
Mapped: Priority support (P), SLAs (G).  
Unresolved: FRT instrumentation, escalation trigger definitions.

## 16. Accessibility Financial UX (P1)
Purpose: WCAG AA/AAA for financial accuracy & trust.
Top 5: 7:1 contrast for figures, Skip link, ARIA live for dynamic statuses, Reduced motion preference, Accessible PDF tagging.
Mapped: Contrast audit (G), Skip link (P), Live regions (P).  
Unresolved: PDF tagging pipeline selection, color palette mapping table.

## 17. Analytics Dashboard Guide (P0)
Purpose: KPIs & visualization.
Top 5: Activation funnel, Recovery rate chart, Cohort retention, Voice adoption metric, Referral K-factor display.
Mapped: Metrics list (P), Dashboard (G).  
Unresolved: Chart component selection, K-factor formula script.

## 18. Referral Program Guide (P1)
Purpose: Viral loop structure.
Top 5: Two-sided credit £5/£5 baseline, Milestones & bonus month, Fraud heuristics (IP/domain), Share modal with copy tracking, Weekly K-factor report.
Mapped: Credit constants (I), Fraud heuristics (P), Report (P).  
Unresolved: Milestone thresholds, share tracking event properties.

## 19. Product Analytics Strategy (P0)
Purpose: Event schema & iteration cadence.
Top 5: 30 core events, Weekly funnel review, Cohort retention analysis, Property standardization (snake_case), Error event capturing.
Mapped: Event list (P), Wrapper (P).  
Unresolved: Full property spec, error taxonomy.

## 20. Microinteractions & Delightful UX (P2)
Purpose: Emotional reinforcement & perceived performance.
Top 5: Skeletons over spinners, Confetti rare events, Optimistic invoice send, Gentle motion respecting reduce, Accessible toast focus behavior.
Mapped: Confetti plan (P), Skeletons (P).  
Unresolved: Toast aria design, fallback animation tokens.

## 21. Content Marketing Strategy (P2)
Purpose: Pillar / cluster organic growth.
Top 5: Pillar page, Interest calculator tool, Monthly calendar, Attribution events, Lead magnet PDF.
Mapped: Pillar page (P), Tool (P), Attribution events (P).  
Unresolved: Calendar draft, lead magnet design.

## 22. Terms of Service (P2)
Purpose: Legal baseline & user obligations.
Top 5: Acceptable use boundaries, Late payment charge disclosure, Data retention clause, Limitation of liability summary, Modification notification process.
Mapped: Disclosure (P), Retention policy (G).  
Unresolved: Notification automation, retention enforcement script.

## 23. Privacy Policy (P2)
Purpose: GDPR compliance & transparency.
Top 5: Data categories enumerated, User rights (access/delete), Third-party processors list, Retention schedules, Contact DPO method.
Mapped: Processors list (G), Retention schedule (G).  
Unresolved: DPO contact integration, deletion workflow confirmation.

## 24. Onboarding Email Sequence (P0)
Purpose: Activation & conversion nurture.
Top 5: 5-email ladder, Behavioral triggers (invoice not sent, no login), Plain text early vs HTML later, Subject line testing framework, Upgrade pitch ROI framing.
Mapped: Sequence doc (I), Trigger logic (P).  
Unresolved: Implementation worker, A/B test harness, variant subject list storage.

## 25. Growth & Referral (General) (P1)
Purpose: Compound user acquisition momentum.
Top 5: Scarcity (Founding 50), Social proof dynamic stats, Badge milestones, Viral coefficient target 0.8–1.0, Temporal upgrade prompts.
Mapped: Founding 50 (I), Dynamic stats (G), Badges (P).  
Unresolved: Badge taxonomy, dynamic anonymized stats service.

---
## Cross-Cutting Gaps Summary
| Category | Key Missing Items |
|----------|-------------------|
| Voice | Latency instrumentation, consent copy, fallback heuristics |
| Pricing | Annual toggle, migration script, decoy comparison row |
| Collections | Timeline visualization components, agency handoff rules |
| Emails | DMARC policy, rejection reason taxonomy, A/B test harness |
| Analytics | Property schema, error taxonomy, K-factor formula implementation |
| Accessibility | Contrast map finalization, PDF tagging pipeline, live region coverage audit |
| Referral | Milestone thresholds, share event properties, fraud heuristics list completeness |
| Support/Help | Category tree, SLAs instrumentation, search gap review process |
| Content | Calendar, lead magnet asset, attribution event enrichment |
| Legal/Compliance | Retention enforcement automation, audit trail schema for late charges |

---
## Supplemental Integration Items (Additional Research-Derived Details)
These items were present in the broader research set but only partially surfaced earlier; they are now explicitly captured to avoid loss of fidelity.

| Area | Additional Detail | Source Doc(s) | Mapping |
|------|-------------------|---------------|---------|
| Notifications Taxonomy | System vs Behavioral vs Escalation categories; quiet hours config | (P1 notifications section) | ENGINEERING_SPEC §2.13 |
| Gamification & Badges | Leaderboard (recovery rate), badges: "First Payment", "£10K Collected", "Recovery 80%+" | microinteractions-delightful-ux.md + growth notes | ENGINEERING_SPEC §2.15 |
| Dynamic Social Proof | Real-time anonymized recovery stats (e.g., "Users recovered £X today") | pricing & growth strategy docs | ENGINEERING_SPEC §2.18 |
| AI Collections Calls | Voice synthesis + scripted escalation (future) placeholder | collections_implementation_guide.md | ENGINEERING_SPEC §2.19 (future) |
| Security Email Auth | SPF include, DKIM 2048-bit keys, DMARC policy "quarantine" ramp to "reject" | transactional email template guide | ENGINEERING_SPEC §2.16 |
| Data Retention | Evidence files 30d purge, transcripts final text only, late charge logs 7y | privacy-policy.md + late-payment-law-guide.md | ENGINEERING_SPEC §2.17 |
| Deletion Workflow | Pseudonymize userId in events, remove PII fields (email, name) | privacy-policy.md | ENGINEERING_SPEC §2.17 |
| Support SLAs | FRT <4h (free), <2h (Pro), priority direct channel | support-strategy-guide.md | ENGINEERING_SPEC §2.14 |
| Help Center Categories | Invoicing, Payments, Collections, Voice & Accessibility, Account & Billing | help-documentation-guide.md | ENGINEERING_SPEC §2.14 |
| Performance Budgets | TTI <2.5s, transcript latency p95<1.5s, pricing page LCP <2.2s | product-analytics-strategy.md | ENGINEERING_SPEC §4 (Non-Functional) |
| Experiment Backlog | Subject lines, CTA copy, pricing card layout, reminder timing | onboarding-email-sequence.md + pricing optimization | ROLLING_ROADMAP §8/§13 |
| Badge Taxonomy | Activation, Recovery, Referral, Growth milestones | growth & referral program guide | ENGINEERING_SPEC §2.15 |
| Fraud Heuristics Thresholds | >2 overlapping IPs, >3 disposable domains/week, identical payment method reuse | referral-program-guide.md | ENGINEERING_SPEC §2.8 |
| A/B Test Harness | Subject line variant store, CTA label enumeration, pricing layout toggles | onboarding-email-sequence.md | ENGINEERING_SPEC §3 / ROLLING_ROADMAP §13 |

---
## Event Source Comprehensive Reference (All Planned P0/P1 Events)
This table extends earlier partial lists to include every tracked event derived from research.

| Event | Properties (Core) | Origin | Priority |
|-------|-------------------|--------|----------|
| signup_started | { source } | client | P0 |
| signup_completed | { user_id, plan='free' } | server | P0 |
| email_verified | { user_id } | server | P0 |
| first_invoice_created | { invoice_id, amount, has_voice_meta } | server | P0 |
| invoice_created | { invoice_id, amount, line_items, has_voice_meta } | client | P0 |
| invoice_sent | { invoice_id, send_method } | server | P0 |
| reminder_scheduled | { invoice_id, schedule_offset_days } | server | P0 |
| payment_received | { invoice_id, amount, days_since_due } | server | P0 |
| payment_claim_submitted | { claim_id, invoice_id } | client | P1 |
| payment_claim_status_changed | { claim_id, previous_status, new_status } | server | P1 |
| collections_escalated | { invoice_id, previous_level, new_level, days_overdue } | job | P0 |
| activation_step_completed | { user_id, step_key } | client | P0 |
| onboarding_checklist_view | { user_id } | client | P1 |
| voice_recording_started | { invoice_id, device_type, network_type } | client | P0 |
| voice_transcript_finalized | { invoice_id, segments, latency_ms_avg } | client | P0 |
| referral_link_copied | { user_id } | client | P1 |
| referral_signup | { referrer_id, referred_user_id } | server | P1 |
| referral_paid_conversion | { referrer_id, referred_user_id } | server | P1 |
| pricing_view | { user_id? } | client | P0 |
| pricing_toggle_annual | { user_id, is_annual } | client | P0 |
| plan_cta_click | { plan_id, context='monthly'|'annual' } | client | P0 |
| subscription_activated | { user_id, plan_id } | server | P0 |
| invoice_overdue_view | { invoice_id, days_overdue } | client | P1 |
| help_article_view | { article_id, category } | client | P1 |
| support_ticket_created | { ticket_id, priority, sla_target_hours } | server | P1 |
| badge_awarded | { user_id, badge_key } | server | P2 |
| k_factor_report_generated | { week_start, invites_sent, conversion_rate } | job | P2 |
| tool_interest_calculated | { principal_amount, days_overdue } | client | P2 |
| dynamic_stat_displayed | { stat_key } | client | P2 |
| ab_test_variant_assigned | { experiment_key, variant_key } | client | P2 |
| error_occurred | { feature, severity, trace_id } | client/server | P0 |

All properties follow snake_case and exclude raw PII (emails hashed).

---
## Complete P0/P1 Gap Closure Targets
| Gap Item | Resolution Path | Target Date |
|----------|-----------------|------------|
| Latency instrumentation | Add WS metrics collector (ENG SPEC §2.1) | Phase 1 Week 2 |
| Annual pricing toggle | Implement UI + state (ENG SPEC §2.4) | Phase 2 Week 5 |
| Timeline visualization | Build components (ENG SPEC §2.6) | Phase 2 Week 4 |
| DMARC policy final | Gradual p=quarantine→reject | Phase 1 Week 3 |
| Property schema finalization | Publish EVENT_SCHEMA.md | Phase 1 Week 1 |
| Contrast map | Accessibility audit script | Phase 3 Week 7 |
| Milestone thresholds | Define & seed referral milestones | Phase 3 Week 8 |
| Help center category tree | Implement KB integration | Phase 3 Week 7 |
| Retention enforcement | Evidence purge job | Phase 1 Week 3 |
| Audit trail schema | Extend late charges logger | Phase 2 Week 6 |

---
## Assurance Note
All research-derived actionable insights are now either: (a) mapped to an existing spec section, (b) listed as a gap with resolution path, or (c) scheduled in the roadmap. No previously referenced insight remains untracked.


---
## Next Actions From Research Perspective
1. Finalize event property schema (analytics & growth).  
2. Draft latency monitoring spec for voice streaming.  
3. Produce pricing migration playbook (see rollout doc).  
4. Author reason taxonomy for payment claim rejection (13–15 canonical reasons).  
5. Define referral milestones & fraud heuristic thresholds.  
6. Establish accessibility palette and PDF tagging decision (tool vs manual).  
7. Create help center category blueprint (5 primary + 3 sub per).  
8. Draft A/B testing matrix (subject lines, CTA wording).  
9. Produce retention & deletion workflow spec (privacy compliance).  
10. Build badge taxonomy (activation, recovery, referral).  

---
## Traceability Matrix (Sample Rows)
| Research Doc | Feature / Epic | Acceptance Reference |
|--------------|----------------|----------------------|
| Voice Input UX | VoiceRecorderButton | ENGINEERING_SPEC §2.1 |
| Pricing Framework | Pricing Tier Refactor | ROLLOUT_PLAN §3.2 |
| Collections Guide | Escalation State Machine | ENGINEERING_SPEC §2.6 |
| Late Payment Law | Interest Calculator | ENGINEERING_SPEC §2.3 |
| Onboarding Sequence | Behavioral Email Worker | ENGINEERING_SPEC §2.5 |
| Product Analytics Strategy | Event Wrapper & Schema | ENGINEERING_SPEC §3.1 |
| Accessibility Financial UX | ARIA Live Regions | ENGINEERING_SPEC §4.3 |
| Referral Program Guide | Referral Milestones | ENGINEERING_SPEC §2.8 |

---
## Validation Checklist (Before Build Freeze)
[] All top 5 highlights per doc mapped to at least one epic or acceptance criteria.  
[] No unresolved P0 gaps remain unassigned.  
[] Pricing migration decision ratified.  
[] Interest calculator tested against sample invoices.  
[] Accessibility palette passes automated contrast tooling.  
[] Analytics events implemented with property schema.  
[] Email authentication (SPF/DKIM/DMARC) records verified.  
[] Referral fraud rules deployed & monitored.  
[] Help center categories created & linked in UI.  

---
End of Research Summaries & Mapping v1

---
## Extended Specification Documents (Traceability Index)
The following documents have been added to ensure every unresolved research gap now has a canonical implementation reference.

| Gap / Research Area | New Doc | Purpose Linkage |
|---------------------|---------|-----------------|
| Notifications taxonomy & suppression | notifications-system-spec.md | Formalizes types, quiet hours, rate limits |
| Support SLAs & escalation metrics | support-sla-spec.md | Converts SLA research into cron + event model |
| Retention & deletion workflow | retention-lifecycle-spec.md | Enforces data minimization & anonymization |
| Analytics wrapper & full property schemas | analytics-event-emitter-spec.md | Implements validation + batching + retry |
| A/B test harness & subject line variants | experiments-framework-spec.md | Experiment lifecycle & exposure events |
| Performance budgets enforcement | performance-ci-config.md | CI gating & telemetry aggregation |
| Fraud heuristics (referral & collections) | fraud-heuristics-spec.md | Rule engine, scoring, override workflow |
| Dynamic social proof stats | dynamic-social-proof-spec.md | Privacy-preserving real-time conversion cues |
| Accessibility palette & ARIA inventory | accessibility-action-list.md | Concrete WCAG AA/AAA execution list |
| Additional event schemas (batch 2) | event-schemas-batch-2.md | Completes instrumentation coverage |

Validation Update Checklist:
[] Each new doc cross-linked in ENGINEERING_SPEC §11  [] Batch-2 schemas present  [] All prior “Unresolved” items now point to a doc or timeline entry.

Documentation Completeness Assertion: With these extended documents, no research-derived actionable item remains without (a) spec, (b) scheduled resolution path, or (c) explicit future placeholder justification.

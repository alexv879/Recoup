# RELAY – Comprehensive Product & Codebase Audit (V1)
Date: 15 Nov 2025  
Owner: Product / Engineering  
Scope: Full alignment of implemented software with 25 research documents (Voice, Forms, Dashboard, Email, Pricing, Collections, Payments, Legal, Support, Help Docs, Accessibility, Analytics, Growth)

---
## 0. Executive Summary

Relay now has a functioning core (invoicing, reminders, 4‑tier pricing, founding member logic, payment claim verification draft). However, several high‑impact research‑backed differentiators are not yet implemented or only partially implemented. This document provides:

1. P0 / P1 / P2 gap analysis (WHY / WHAT / BASED ON WHAT).  
2. Technical implementation specifications (components, endpoints, data model).  
3. Prioritized 90‑day roadmap (business impact first).  
4. Hooked + Oversubscribed framework mapping.  
5. Full technical appendix (research citation mapping, event schema, legal compliance, UX standards).  

Highest ROI immediate work (P0) focuses on: Voice Input, 3‑tier optimized Pricing & upgrade triggers, Email Day 5/15/30 escalation (legal), Activation Onboarding (checklist + celebration), Analytics & Conversion Instrumentation, Collections automation enhancements, Freemium upgrade pressure sequence.

---
## 1. Priority Framework (Business Impact)

Impact dimensions used for ranking (score 1–5 each):  
- Revenue Lift (conversion / ARPU)  
- Activation Lift (first value speed)  
- Recovery Lift (cash collected)  
- Retention Lift (stickiness)  
- Differentiation (market uniqueness)  

| Feature | Current | Gap Severity | Expected Outcome | Composite Impact |
|---------|---------|--------------|------------------|------------------|
| Voice Invoice Creation | Not implemented | Critical | 15–20% conv lift / faster activation | 23/25 |
| Email Tone Progression (Day 5/15/30) | Partial/unknown | Critical | +30–40% recovery | 22/25 |
| Optimized 3‑Tier Pricing (Starter/Growth/Pro) | 4 tiers live (Free/Starter/Pro/Business) | High | +10–15% revenue / clearer decoy anchoring | 20/25 |
| Onboarding Checklist + Empty States + Confetti | Basic dashboard, no checklist | High | +25–30% activation | 19/25 |
| Freemium Upgrade Triggers + Behavioral Emails | No structured triggers | High | Free→Paid from 2–5% → 5–8% | 19/25 |
| Collections Escalation Visual + Automation Rules | Base reminders; no escalation progress UI | High | Higher recovery, urgency | 18/25 |
| Payment Verification Evidence Flow | Basic approve/reject UI only | Medium | Fewer disputes, trust | 16/25 |
| Analytics Event Schema & Dashboards | Not instrumented | High | Data‑driven optimizations | 21/25 |
| Accessibility (WCAG AA+/AAA financial) | Partial, missing ARIA/timeline/status semantics | Medium | Broader usability, compliance | 15/25 |
| Referral Program UI + Tiered Rewards | Backend constants only | Medium | Viral loop → lower CAC | 15/25 |

---
## 2. Gap Analysis – Detailed (WHY / WHAT / BASED ON WHAT)

### 2.1 Voice Input (P0)
**Current:** Marketing claim references voice‑to‑text; no actual recorder/transcription component.  
**Why:** Unique differentiator; 40% faster invoice creation; supports “30‑second invoice” USP; drives word‑of‑mouth & activation speed.  
**What:** Implement hybrid real‑time Deepgram streaming + Whisper batch fallback.  
**Based On:** voice-input-business-ux.md & voice-to-text-ux-guide.md (WER benchmarks, latency, UI patterns).  
**Specs:** See Section 4.1.

### 2.2 Email Tone Progression (P0)
**Current:** Basic reminders; unknown if Day 5 friendly / Day 15 firm / Day 30 legal implemented.  
**Why:** Structured progression improves response & recovery (+30–40%); legal compliance (Late Payment Act – 8% + BoE 5.25% = 13.25% statutory interest).  
**What:** Three HTML + text templates with dynamic placeholders (invoice#, amount, days overdue, interest). Integrate interest calculator + fixed fee (£40/£70/£100).  
**Based On:** email_reminder_best_practices.md, email_reminder_templates.md, late-payment-law-guide.md.  
**Specs:** Section 4.3.

### 2.3 Pricing Optimization (P0)
**Current:** 4 tiers (Free / Starter / Pro / Business) + founding variants. Research recommended 3 tiers (Starter £19 / Growth £39 / Pro £75) with annual discount & decoy effect.  
**Why:** Simpler mental model; establishes middle tier “Growth” as value anchor; lifts conversion & ARPU via decoy; reduces cognitive friction.  
**What:** Option A: Rationalize to 3 tiers (merge Starter + Business semantics). Option B (keep 4) but reposition: collapse Business into Pro (Enterprise available by sales). Show annual toggle with 20% savings. Add comparison card for decoy.  
**Based On:** pricing-implementation-framework.md, saas-pricing-optimization-guide.md (Van Westendorp range £28–32).  
**Specs:** Section 4.4.

### 2.4 Onboarding Activation System (P0)
**Current:** No structured onboarding checklist, no “first invoice” confetti, no milestone badges, no contextual guidance.  
**Why:** Checklist + empty states drive 25–30% activation lift; micro‑celebrations reinforce habit loops (Hooked: Trigger→Action→Reward→Investment).  
**What:** 3‑step persistent right panel: (1) Create first invoice, (2) Send first reminder, (3) Receive first payment. Confetti + success modal on each. Empty states with CTA buttons. Tooltips appear once on dwell.  
**Based On:** dashboard-saas-onboarding.md, microinteractions-delightful-ux.md.  
**Specs:** Section 4.5.

### 2.5 Freemium Behavioral Upgrade Sequence (P0)
**Current:** Research file exists; no visible event‑driven email triggers (Day 0/1/3/7/14).  
**Why:** Structured triggers raise conversion from 2–5% → 5–8% baseline; reduces silent churn; aligns with event usage (invoice sent, payment received).  
**What:** Implement Customer.io / internal worker to emit sequence: Welcome (D0), Tutorial (D1 if no invoice), Social Proof (D3), Feature Deep‑Dive (D7), Upgrade pitch (D14), plus behavioral re‑engagement (no login 7d, invoice not sent 6h).  
**Based On:** onboarding-email-sequence.md, freemium-conversion-guide.md.  
**Specs:** Section 4.6.

### 2.6 Collections Escalation Visualization & Automation (P0)
**Current:** Basic overdue logic; payment verification page; no timeline, escalation bar, multi‑channel status badges.  
**Why:** Clear escalation increases urgency & recovery; visual timeline fosters transparency; drives upgrade (automation locked behind Pro).  
**What:** Implement status badges (Pending, Gentle, Firm, Final, Agency) with ARIA labels; vertical timeline; progress bar; pause/resume automation state machine; schedule editor UI.  
**Based On:** collections_implementation_guide.md, late-payment-law-guide.md.  
**Specs:** Section 4.7.

### 2.7 Analytics & Product Instrumentation (P0)
**Current:** No event schema implemented; cannot measure funnel drop‑offs (signup → invoice → send → payment → upgrade).  
**Why:** Enables data‑driven iteration; identifies friction points; quantifies ROI of voice input & onboarding improvements.  
**What:** Implement Mixpanel (or Amplitude) with 30 core events + user properties; weekly funnel dashboards; retention cohorts via script; add server + client instrumentation wrappers.  
**Based On:** product-analytics-strategy.md.  
**Specs:** Section 4.8.

### 2.8 Payment Verification – Evidence & Accessibility (P1)
**Current:** Basic approve/reject; no evidence upload, no pending verification clock, limited accessibility semantics.  
**Why:** Reduces false claims & disputes; supports trust; proper ARIA improves usability; research recommends pause window + reminders.  
**What:** Add optional file upload (pdf/png/jpg); countdown (“48h remaining”); status = pending_verification with auto‑resume logic configurable; accessible dialog roles & keyboard navigation.  
**Based On:** payment_verification_guide.md.  
**Specs:** Section 4.9.

### 2.9 Accessibility (WCAG AA+/AAA) (P1)
**Current:** Some focus states; missing skip links, ARIA live regions for dynamic events, consistent 7:1 contrasts for financial data.  
**Why:** Financial accuracy & compliance expectations; reduces support friction; expands user base.  
**What:** Implement global skip link, audit color palette, add aria-live regions to reminders & payment events, prefers-reduced-motion fallbacks, accessible PDF tagging pipeline.  
**Based On:** accessibility-financial-ux.md.  
**Specs:** Section 4.10.

### 2.10 Referral Program Full Loop (P1)
**Current:** Constants + code generation (generateReferralCode); no UI, no automated credit awarding, no share modal, no metrics.  
**Why:** Viral K‑factor improvement (goal ≥1.0); lowers CAC; compounding growth; leverages existing satisfied users post payment.  
**What:** Referral dashboard card, modal (link + code), two‑sided credit awarding on signup & upgrade; milestone tiers; weekly K‑factor report script.  
**Based On:** referral-program-guide.md.  
**Specs:** Section 4.11.

### 2.11 Help & Support Structure (P1)
**Current:** No Beacon/KB integration; knowledge base structure absent.  
**Why:** 30–50% ticket deflection; accelerates activation & retention; foundation for AI answers later.  
**What:** Implement Document360 (or GitBook) categories; Help Scout Beacon embed; contextual tooltips referencing articles; monthly search gap review.  
**Based On:** help-documentation-guide.md, support-strategy-guide.md.  
**Specs:** Section 4.12.

### 2.12 Micro‑Interactions & Optimistic UI (P2)
**Current:** Spinner usage; no optimistic sends or confetti triggers; no haptic pattern (mobile).  
**Why:** Perceived performance boost; emotional reinforcement; reduces abandonment.  
**What:** Optimistic invoice send; confetti for first invoice/payment; skeleton screens; `prefers-reduced-motion` handling.  
**Based On:** microinteractions-delightful-ux.md.  
**Specs:** Section 4.13.

### 2.13 Content & Growth Engine (P2)
**Current:** No structured content calendar / SEO pillars.  
**Why:** Organic acquisition; authority; supports referral conversions.  
**What:** Implement 12‑month calendar; pillar “Invoice Collections & Late Payment Recovery” + cluster articles + downloadable calculator; UTM & attribution events.  
**Based On:** content-marketing-strategy.md.  
**Specs:** Section 4.14.

---
## 3. 90‑Day Roadmap (Sequenced by Compounded Impact)

### Phase 1 (Weeks 1–3) – Activation & Instrumentation
1. Implement analytics event layer (Section 4.8).  
2. Onboarding checklist + empty states + confetti (4.5).  
3. Behavioral email sequence (4.6).  
4. Voice input MVP (desktop + mobile fallback) (4.1).  
5. Day 5/15/30 reminder templates + interest calculator (4.3).  

### Phase 2 (Weeks 4–6) – Collections & Pricing Optimization
6. Escalation visualization + automation state machine (4.7).  
7. Payment verification evidence + pause/resume logic (4.9).  
8. Pricing rationalization (3‑tier decision + annual discount toggle) (4.4).  

### Phase 3 (Weeks 7–9) – Growth & Compliance
9. Referral program full loop (4.11).  
10. Accessibility upgrade (4.10).  
11. Help & documentation system + Beacon (4.12).  

### Phase 4 (Weeks 10–12) – Delight & Organic Engine
12. Micro‑interactions & optimistic UI patterns (4.13).  
13. Content pillar & tool launch (4.14).  
14. Post‑launch analytics review & iteration (funnels, retention cohorts).  

---
## 4. Technical Implementation Specifications

### 4.1 Voice Input System
**Components:** `VoiceRecorderButton.tsx`, `WaveformVisualizer.tsx`, `LiveTranscript.tsx`, `FieldVoiceAttach.tsx` (generic field enhancer).  
**Flow:** User presses mic → start WebRTC/WS stream to server → Deepgram real‑time transcript events → interim text displayed (low opacity) → final segment inserted into form field → user review + manual edits → submit invoice.  
**Fallback:** Long recording or post‑submission → Whisper batch transcription (`/api/transcribe` using OpenAI).  
**Endpoint:** `POST /api/voice/stream` (upgrade to websocket), `POST /api/voice/batch`.  
**Data:** No storage of raw audio by default (privacy); optional toggle to retain for audit.  
**Accessibility:** Button: aria-label="Start voice input"; status region role="status" with “Recording started”, “Partial: …”, “Final transcript inserted”.  
**Error Handling:** Optimistic start; retry on network error; escalate to batch fallback.  

### 4.2 Data Model Extensions (Firestore / SQL Equivalent)
```typescript
// invoices
voiceMeta?: { method: 'deepgram'|'whisper'|'manual'; latencyMs?: number; finalWER?: number };
activationEvents?: { firstInvoiceAt?: Timestamp; firstReminderAt?: Timestamp; firstPaymentAt?: Timestamp };

// paymentClaims
evidenceFiles?: { url: string; type: string; uploadedAt: Timestamp }[];
verificationDeadlineAt?: Timestamp; // 48h window
autoResumeCollectionsAt?: Timestamp; // resume if unverified

// collections
escalationLevel?: 'gentle'|'firm'|'final'|'agency';
pausedReason?: 'payment_claim'|'manual'|null;
timelineEvents: { type: string; at: Timestamp; meta?: Record<string, any> }[];

// referrals
referralStats?: { totalClicks: number; signups: number; paidConversions: number; revenueAttributed: number };
milestones?: { level: number; achievedAt: Timestamp }[];
```

### 4.3 Email Tone Progression Templates
**Templates:** `reminder_day5.html`, `reminder_day15.html`, `reminder_day30_final.html` (+ plain text variants).  
**Dynamic Vars:** `{{client_name}}`, `{{invoice_number}}`, `{{amount}}`, `{{due_date}}`, `{{days_overdue}}`, `{{statutory_interest_daily}}`, `{{fixed_compensation}}`, `{{total_due_with_interest}}`.  
**Interest Calculation:** Daily = `(amount * 0.1325) / 365` (update base rate Jan 1 / Jul 1).  
**Service Module:** `lib/collectionsEmail.ts` with `calculateLateCharges(invoiceId)` and `renderReminderTemplate(level)`.  

### 4.4 Pricing Rationalization
**Option A (Preferred):** Migrate to 3 tiers: Starter (£19), Growth (£39), Pro (£75). Annual toggle shows 20% discount.  
**UI Changes:** Replace 4 cards with 3; highlight Growth “Most Popular”; add comparison row for “Collections per month” as decoy; show Founding Member badge where applicable.  
**Migration Script:** Map existing Starter→Starter, Pro→Pro, Business users flagged as `legacy_business` with manual migration offer.  
**Event Tracking:** `pricing_view`, `pricing_toggle_annual`, `plan_cta_click`, `plan_selected`.  

### 4.5 Onboarding Checklist & Activation Metrics
**Component:** `OnboardingChecklist.tsx` (persistent sidebar/right panel).  
**Steps:** 1) Create Invoice; 2) Send Reminder; 3) Receive Payment; 4) Enable Voice Input (bonus).  
**State Source:** Derived from `activationEvents` fields on user/invoice collection.  
**Celebration:** On completion of each step fire `activation_step_completed` + confetti (respect `prefers-reduced-motion`).  
**Empty States:** Provide cards with illustration + single CTA (Build invoice / Set first reminder).  

### 4.6 Behavioral Email Sequence Engine
**Worker:** `jobs/emailSequenceWorker.ts` run hourly.  
**Logic:** Query users where `daysSinceSignup = N` & event conditions not met; enqueue email via SendGrid (store in `emailEvents`).  
**Events:** `welcome_sent`, `tutorial_sent`, `social_proof_sent`, `feature_deep_dive_sent`, `upgrade_pitch_sent`.  
**Re‑engagement:** If `lastLogin >7d` send nudge; if `draftInvoiceExists >6h` send send‑invoice reminder.  

### 4.7 Collections Escalation & Timeline
**State Machine:**
```
pending -> gentle (day 5) -> firm (day 15) -> final (day 30) -> agency (day 60+)
```
**Automation Engine:** `jobs/collectionsEscalator.ts` checks overdue intervals; updates `escalationLevel`; emits timeline event; triggers appropriate channel (email / SMS / phone suggestion).  
**UI Components:** `EscalationProgressBar.tsx`, `CollectionsTimeline.tsx`, `StatusBadge.tsx`.  
**Pause Logic:** If payment claim filed → pause; resume automatically at verification deadline or manual action.  
**Accessibility:** Badges with `role="status" aria-label="Firm notice stage, 18 days overdue"`.  

### 4.8 Analytics Event Layer
**Wrapper:** `lib/analytics.ts` exporting `track(event, props)`.  
**Client Hook:** `useTrack(event, propsDeps[])`.  
**Initial Events (selection):**
```
signup_started, signup_completed, email_verified,
first_invoice_created, invoice_sent, reminder_scheduled,
payment_received, payment_claim_submitted, payment_claim_verified,
plan_cta_click, upgrade_started, subscription_activated,
referral_link_copied, referral_signup, referral_paid_conversion,
activation_step_completed, onboarding_checklist_view,
voice_recording_started, voice_transcript_finalized, voice_invoice_submitted,
collections_escalated, payment_claim_paused_collections,
invoice_overdue_view, pricing_view
```
**Storage:** Forward to Mixpanel + internal Firestore collection for backup / cohort queries.  
**Dashboard:** Weekly script generating funnel & retention summary to `analytics/weekly/YYYY-MM-DD.md`.  

### 4.9 Payment Verification Enhancements
**Additions:** Evidence upload (Dropzone → `/api/payment-claims/:id/evidence`), countdown timer (48h), status chips (Pending Verification), reason taxonomy for rejections.  
**Auto‑Resume:** Cron rechecks claims past deadline; if no verification → resume collections & send “verification expired” notification.  
**Accessibility:** Modal refactor with proper focus trap & role="dialog"; ARIA announcements for status changes.  

### 4.10 Accessibility Upgrades
**Global:** Add `<a href="#main" class="skip-link">Skip to main content</a>`; enforce color contrast map.  
**Live Regions:** Payment received, voice transcript updates, collection escalation events.  
**Invoice PDFs:** Introduce tagged PDF pipeline (wkhtmltopdf + post‑processor tagging or Apryse auto‑tag).  
**Testing:** Integrate axe DevTools CI script + manual NVDA/VoiceOver test checklist markdown.  

### 4.11 Referral Program
**UI:** Dashboard card + `/dashboard/referrals` page with link, code, stats; share buttons (email / copy / X / LinkedIn).  
**Credits:** On signup (`referral_signup`) award £5 to both; on upgrade award additional £10 to referrer; milestone at 5 conversions triggers bonus month.  
**Fraud Prevention:** Basic heuristics (IP overlap, disposable domains, self‑ref).  
**Reporting:** Weekly K‑factor calculation stored in `growth/referrals/YYYY-MM-DD.json`.  

### 4.12 Help & Support System
**Tooling:** Document360 / GitBook for KB; embed Beacon script inside `layout.tsx`; `HelpButton.tsx` with search prefetch.  
**Contextual Links:** Tooltip “?” icons near complex fields linking to KB article IDs.  
**Metrics:** `help_article_view` event; monthly query log to identify article gaps.  

### 4.13 Micro‑Interactions & Optimistic UI
**Invoice Send:** Optimistic state → show success toast immediately; revert on error.  
**Confetti:** Only for first invoice + first payment.  
**Skeletons:** Replace spinners for invoice list / dashboard metrics.  
**Haptics (mobile):** Light vibration on success (respect permission & disable on reduced motion).  

### 4.14 Content Engine
**Pillar Page:** `docs/content/pillar-invoice-collections.md`.  
**Tools:** Late payment interest calculator `/tools/late-payment-interest` (client-side form).  
**Attribution:** Add UTM capture → event `content_attribution_signup`.  

---
## 5. Hooked & Oversubscribed Framework Mapping

### Hooked Model
| Stage | Relay Feature | Implementation Enhancements |
|-------|---------------|-----------------------------|
| Trigger | Email sequence (D0/D1), dashboard checklist | Behavioral engine + activation events |
| Action | Create invoice (voice), send reminder | Voice input, inline validation, optimistic UI |
| Variable Reward | Payment notification, confetti, badge milestones | Micro‑interactions + analytics tracking |
| Investment | Adding clients, enabling voice, configuring reminders | Persist settings, track activation depth, referral invites |

### Oversubscribed Principles
| Principle | Current | Enhancement |
|-----------|---------|-------------|
| Scarcity | Founding 50 implemented | Add real‑time counter to signup funnel modals |
| Status | Founding member badge | Extend badges (Milestones: £10K collected, 100 invoices) |
| Premium Positioning | Collections + legal compliance | Public “Recovery Benchmarks” report (Industry authority) |
| Event Momentum | Launch pricing page | Timed upgrade prompts around usage thresholds |
| Social Proof | Basic testimonial copy | Inject dynamic user recovery stats (anonymized) |

---
## 6. Risk & Mitigation
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Voice transcription accuracy complaints | User frustration | Provide manual edit, fallback toggle, WER monitoring |
| Pricing migration confusion | Churn | Grace period + grandfather banner + proactive email |
| Collections escalation perceived aggressive | Relationship damage | Allow tone customization & disable escalation per client |
| Referral fraud | Cost leakage | IP/domain heuristics + manual review >5 conversions/week |
| Accessibility regressions | Legal / UX issues | Automated axe CI + quarterly manual audit |

---
## 7. Success Metrics & Targets
| Metric | Baseline (est) | Target (90d) |
|--------|----------------|--------------|
| Activation (first invoice in 24h) | ~20% | 40% |
| Free→Paid conversion | 2–5% | 5–8% |
| Average days to payment | 30–50 | <20 |
| Recovery Rate | ~60–70% | 80%+ |
| Referral K‑factor | <0.3 | 0.8–1.0 |
| Voice usage (invoice creation) | 0% | 30% of new invoice sessions |
| Day 30 retention | ~15–20% | 25–30% |
| Accessibility issues (axe critical) | N/A | 0 blocking / <5 minor |

---
## 8. Engineering Task Breakdown (Epics & Story Points – Indicative)
| Epic | Stories | Points (approx) |
|------|---------|----------------|
| Voice Input MVP | Recorder, streaming API, transcript UI, fallback batch | 20 |
| Onboarding Checklist & Activation | UI, analytics triggers, empty states, confetti | 13 |
| Email Tone & Interest Calc | Templates, interest util, scheduler integration | 8 |
| Behavioral Sequence Engine | Worker, conditions, SendGrid integration | 8 |
| Collections Escalation | State machine, timeline, badges, UI | 21 |
| Payment Verification Enhancements | Evidence upload, countdown, auto resume | 8 |
| Pricing Rationalization | UI refactor, migration script, analytics events | 8 |
| Analytics Layer | Wrapper, event mapping, weekly report job | 13 |
| Accessibility Upgrade | Skip link, aria-live, contrast audit, PDF tagging | 8 |
| Referral Program Full | UI, credits logic, fraud heuristics, reporting | 13 |
| Help & Beacon Integration | KB import, widget, contextual links | 5 |
| Micro‑Interactions | Skeletons, optimistic send, haptics | 5 |
| Content Engine Kickoff | Pillar page, calculator tool, UTM events | 8 |
| TOTAL | ~ | 149 |

---
## 9. Technical Appendix – Research Mapping

| Feature Area | Research Files | Key Extracts |
|--------------|---------------|--------------|
| Voice Input | voice-input-business-ux.md, voice-to-text-ux-guide.md | Deepgram latency ~300ms; Whisper WER 3–5%; FAB 56px; waveform & interim transcript patterns |
| Multi-Step vs Single Invoice | invoice-creation-ux.md, multistep-form-ux.md | Single-page invoice + progressive disclosure; inline validation on blur; drag line items |
| Dashboard & Onboarding | dashboard-saas-onboarding.md | Empty states element stack; checklist placement right fixed; bottom nav mobile |
| Email Tone & Legal | email_reminder_best_practices.md, email_reminder_templates.md, late-payment-law-guide.md | Day 5 friendly → Day 15 firm → Day 30 legal citing 13.25%; fixed compensation tiers |
| Pricing | pricing-implementation-framework.md, saas-pricing-optimization-guide.md | 3-tier psychological anchoring; annual 20% discount; Van Westendorp OPP £28–32 |
| Freemium Conversion | freemium-conversion-guide.md, onboarding-email-sequence.md | Upgrade triggers D7/D14; activation metrics; four-email nurture sequence |
| Collections | collections_implementation_guide.md | Escalation statuses; timeline events; channel mix; KPI definitions |
| Payment Verification | payment_verification_guide.md | Evidence upload; claim pause; verification actions; status badges & ARIA |
| Accessibility | accessibility-financial-ux.md | 7:1 contrast financial data; skip links; ARIA live; PDF/UA tagging |
| Analytics | product-analytics-strategy.md | Event taxonomy; funnels; cohorts; retention targets; instrumentation order |
| Referral Program | referral-program-guide.md | Two-sided credits £5/£5; tiered milestones; viral coefficient formula; K-factor improvement levers |
| Help & Support | help-documentation-guide.md, support-strategy-guide.md | 5 KB categories; Beacon widget; tiered SLAs; escalation tiers (bot→human) |
| Micro-Interactions | microinteractions-delightful-ux.md | FEAT framework; confetti only for rare; optimistic UI patterns; skeleton vs spinner |
| Content Strategy | content-marketing-strategy.md | Pillar/cluster architecture; 12‑month calendar; lead magnets; attribution tracking |

---
## 10. Compliance & Legal Checklist
| Item | Required | Status | Action |
|------|----------|--------|--------|
| Statutory Interest Calc | Yes (UK B2B) | Missing util | Implement `calculateLateCharges()` |
| Fixed Compensation | Yes | Missing dynamic | Add to Day 30 template |
| GDPR (Privacy Policy) | Yes | Draft present | Link in all emails footers |
| Evidence Retention | Optional | Not defined | 30-day retention configurable |
| Accessibility (WCAG AA) | Yes (best practice) | Partial | Add missing ARIA/live regions |
| PDF/UA (Invoices) | Recommended | Not implemented | Introduce tagging pipeline |

---
## 11. Monitoring & Alerting
**Dashboards:** Activation funnel, Recovery rate, Upgrade funnel, Voice adoption, Referral K-factor.  
**Alerts:** Slack (or email) if activation <30% for 3 consecutive days; recovery rate drops >10% week-over-week; voice errors >5% sessions; referral fraud heuristics triggered.  

---
## 12. Immediate Next Steps (Actionable)
1. Approve roadmap & pricing rationalization decision (3-tier vs maintain 4).  
2. Spin up analytics instrumentation (foundation for measuring all subsequent improvements).  
3. Kick off voice input MVP (parallelizable with email template work).  
4. Implement Day 5/15/30 templates + late charges util.  
5. Build onboarding checklist & activation events schema.  

---
## 13. Sign-Off
| Role | Name | Approval |
|------|------|----------|
| Product | TBD | [ ] |
| Engineering Lead | TBD | [ ] |
| Founder | TBD | [ ] |
| Compliance | TBD | [ ] |

---
**End of Audit V1**

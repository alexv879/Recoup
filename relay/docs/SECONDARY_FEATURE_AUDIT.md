# Relay Secondary Feature Audit
Version: 1.0 | Date: 15 Nov 2025

## 1. Scope
Audit of secondary (non-core P0) features: notifications, support/help center, gamification/badges, security/email auth, dynamic social proof, data retention/deletion, performance instrumentation, experiments, accessibility expansion, referral fraud heuristics.

## 2. Method
Reviewed codebase structure vs specs; identified presence, partial implementation, or absence. Mapped to engineering spec sections and gap resolution timeline.

## 3. Status Legend
I = Implemented, P = Planned (spec present), G = Gap (spec but no code), V = Needs Validation (code present but incomplete), F = Future placeholder.

## 4. Audit Table
| Feature Area | Current State | Code Evidence | Spec Ref | Status | Notes |
|--------------|--------------|--------------|----------|--------|-------|
| Notifications Taxonomy | Basic email only | No `notifications/` components found | ENG §2.13 | G | Need data model & delivery API |
| Support Ticketing & SLA | Not present | No support ticket CRUD | ENG §2.14 | G | SLA metrics & escalation cron missing |
| Help Center Integration | Absent | No KB embed | ENG §2.14 | G | Requires external provider integration |
| Gamification Badges | Absent | No badge model | ENG §2.15 | G | Data model addition + awarding logic |
| Dynamic Social Proof | Absent | No `dynamicStats.ts` | ENG §2.18 | G | Implement caching & threshold logic |
| AI Collections Calls | Placeholder | None | ENG §2.19 | F | Defer until post Phase 3 |
| Security Email Auth | Partially assumed | No DNS verification script | ENG §2.16 | G | Create build check & reporting |
| Data Retention Jobs | Absent | No purge cron | ENG §2.17 | G | Add nightly purge & deletion workflow |
| Deletion Workflow | Absent | No anonymize job | ENG §2.17 | G | Implement hashed user id transform |
| Performance Budgets | Not enforced | No Lighthouse CI config | ENG §2.23 | G | Add CI step & thresholds |
| A/B Test Harness | Absent | No experiments model | ENG §2.24 | G | Add assignment endpoint & event emission |
| Experiment Backlog | Document only | N/A | ENG §2.25 | P | Populate tracking file |
| Accessibility Enhancements (Skip link etc.) | Partial generic | Skip link not found | ENG §2.10 | G | Implement skip link + live regions |
| Referral Fraud Heuristics | Partial concept | Referral constants only | ENG §2.8 | G | Implement detection & flags |
| Badge Award Events | None | - | ENG §2.15 | G | Event schema poised, implementation absent |
| Support Escalation Events | None | - | ENG §2.22 | G | Add escalation cron & event emission |
| Error Taxonomy | Basic logging | No standardized severity mapping | ENG §2.20 | V | Normalize error_occurred severity |

## 5. Gaps & Required Actions
| Gap | Action | Owner | Phase | Effort (pts) |
|-----|--------|-------|-------|--------------|
| Notifications system | Implement model + API endpoints + UI list | Eng | 3 | 8 |
| Support/SLA | Build ticket model + SLA cron | Eng | 3 | 8 |
| Help center | Integrate provider + tooltips | Eng | 3 | 5 |
| Badges | Data model + awarding triggers | Eng | 3 | 5 |
| Dynamic stats | Implement service + caching | Eng | 2 | 5 |
| Email auth verification | DNS check script + report | Eng | 1 | 3 |
| Retention purge | Nightly job + deletion workflow | Eng | 1 | 5 |
| Performance budgets | Add CI & thresholds | Eng | 1 | 3 |
| A/B harness | Experiment assignment & storage | Eng | 2 | 5 |
| Accessibility skip link/live regions | Add components + audit | Eng | 3 | 3 |
| Referral fraud heuristics | Implement detection on signup/upgrade | Eng | 3 | 5 |
| Error taxonomy | Define severity + schema enforcement | Eng | 1 | 2 |

## 6. Prioritization Rationale
Early (Phase 1): Retention purge & email auth (compliance), performance budgets (prevent regression), error taxonomy (observability).  
Phase 2: Dynamic stats (supports pricing), A/B harness (enables optimization).  
Phase 3: Support/SLA, badges, help center, notifications (enhanced retention & differentiation).

## 7. Acceptance Criteria Snapshots (Selected)
Notifications: Creating new notification persists and increments unread count; retrieval returns newest first; ARIA live region narrates message.  
Badges: Awarding a badge produces `badge_awarded` event and updates user.badges; duplication prevented.  
Retention purge: Files older than retention threshold are not accessible; log entry created.  
Email auth: DNS script exits non-zero if any record missing; pipeline blocks deploy.  
Performance budgets: CI fails if metrics exceed thresholds.

## 8. Risk Considerations
Help center delay increases support burden; mitigation: publish minimal FAQ page interim.  
Notification overload risks fatigue; mitigation: behavioral suppression & rate limits.  
Dynamic stats misinterpretation if sample small; mitigation: threshold gating/hide.

## 9. Tracking & Verification Plan
Add checklist entries to weekly report verifying progress for each gap item until status transitions to P (planned) then I (implemented).

## 10. Next Immediate Steps
1. Implement DNS verification script stub.  
2. Draft retention purge job outline.  
3. Define error taxonomy severity mapping JSON.  
4. Create experiment assignments table schema.  
5. Add skip link to layout component.

End of Secondary Feature Audit v1

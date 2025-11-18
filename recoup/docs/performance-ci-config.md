# Performance CI Configuration Specification
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Automated enforcement of performance budgets (TTI, LCP, bundle size, voice latency) via CI gating.

## 2. Tooling
- Lighthouse CI for page metrics (`/dashboard`, `/pricing`).
- Custom WebSocket latency collector for voice partial transcripts.
- Bundle analyzer script during build (webpack stats JSON).

## 3. Budgets
| Metric | Budget | Source |
|--------|--------|--------|
| Dashboard TTI | <2500ms | Lighthouse CI |
| Pricing LCP | <2200ms | Lighthouse CI |
| Main JS gzip | <300KB | Build analyzer |
| Voice partial p95 | <1500ms | Latency collector |

## 4. CI Steps
1. Build project → output stats.
2. Run Lighthouse CI (3 runs each target page) → median.
3. Execute voice latency synthetic test (local WS harness).
4. Compare results vs budgets; fail if any exceed.
5. Post summary artifact `performance/report.json`.

## 5. Failure Policy
Two consecutive failures → open ticket labeled `performance-regression`.
Critical breach (p95 latency >2000ms) → auto-disable `VOICE_INPUT_ENABLED` flag.

## 6. Reporting
Weekly trend appended to analytics report.
Store last 30 reports for baseline comparison.

## 7. Testing
Mock stats file ensures parser correctness.
Latency harness simulation ensures p95 calculation accurate.

## 8. Open Questions
1. Include CLS/INP metrics now? (defer)
2. Automate bundle diff suggestion? (future)

Completion Criteria: CI blocking implemented; artifact published; rollback trigger documented.

---
Traceability: Performance budgets & enforcement gap.
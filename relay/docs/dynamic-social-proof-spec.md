# Dynamic Social Proof Service Specification
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Surface real-time anonymized aggregate stats (e.g., amount recovered today) to increase conversion without exposing user-level data.

## 2. Stats Catalog
| Key | Definition | Sample Privacy Threshold |
|-----|------------|--------------------------|
| total_recovered_today | Sum paid amounts where payment date = today | ≥50 invoices contributing |
| avg_days_to_payment_last_7d | Mean (paid_at - due_date) for last 7d paid invoices | ≥100 invoices |
| recovery_rate_last_30d | (total recovered / total invoiced overdue) | ≥200 invoices |

## 3. Service Flow
Cron (5m) → query aggregates → store `dynamic_stats { key, value, sample_size, updated_at }` → cache in memory (TTL 5m) → pricing page fetch.

## 4. API
`GET /api/dynamic-stats` returns filtered stats where `sample_size >= threshold`.

## 5. Privacy & Safeguards
Hide stats below threshold; never show single large payment outliers (cap contribution at P95 of historical values).
Round values (e.g., nearest £100) for large sums.

## 6. Event
`dynamic_stat_displayed { stat_key }` on initial render per session.

## 7. Caching Strategy
In-memory LRU; key invalidation when new record timestamp differs > TTL.

## 8. Tests
Unit: threshold filtering, rounding logic, outlier capping.
Integration: cron run populates stats; API returns expected subset.

## 9. Open Questions
1. Additional stat: "% invoices paid on first reminder"? (future)
2. Localization for currency formatting multi-region?

Completion Criteria: Stats service live; privacy thresholds enforced; event logging active.

---
Traceability: Dynamic social proof gap & growth conversion research.
# Fraud Heuristics Specification
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Detect and mitigate referral & collections abuse while minimizing false positives.

## 2. Signals (Referral)
| Signal | Threshold | Action |
|--------|-----------|--------|
| Referred signups sharing IP | >2 within 24h | Flag score +2 |
| Disposable email domain | any | Flag score +3 |
| Rapid signups (<1m apart) | >3 sequence | Flag score +2 |
| Same payment method reused | >1 different user | Flag score +4 |

## 3. Signals (Collections)
| Signal | Threshold | Action |
|--------|-----------|--------|
| Repeated claim on same invoice | >1 | Manual review |
| Excessive pause requests | >3 active / user | Flag score +2 |
| Invoice amount variance vs history | >3x avg | Flag score +1 |

## 4. Scoring
Total score ≥5 → emit `fraud_flagged { user_id, score }` & queue manual review.
Score decay: -1 per 7 days without new flags.

## 5. Data Model
```
fraud_signal { id, user_id, type, score_delta, context, created_at }
fraud_profile { user_id, cumulative_score, last_updated }
```

## 6. Workflow
Signal ingestion → update profile → threshold check → event emit + notification (staff channel).

## 7. Overrides
Manual override sets `cumulative_score=0` and locks decay for 14d.

## 8. Privacy
Store minimal context (hash IP). No raw payment details.

## 9. Tests
Unit: scoring aggregation, decay logic.
Integration: multiple signals crossing threshold; override effectiveness.

## 10. Open Questions
1. Include geo distance anomaly? (future)
2. Automated suspension vs manual only?

Completion Criteria: Signals ingested; threshold event emitted; override path functioning.

---
Traceability: Referral fraud & collections abuse research gaps.
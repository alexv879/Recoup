# Experiments Framework Specification
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Consistent A/B test assignment & exposure event logging enabling controlled product optimization.

## 2. Experiment Data Model
```
experiment_definition {
  key: string,
  variants: string[],
  status: 'draft'|'active'|'paused'|'completed',
  created_at: Timestamp,
  hypothesis: string,
  primary_metric: string,
  guardrail_metrics: string[]
}
experiment_assignment {
  user_id: string,
  experiment_key: string,
  variant_key: string,
  assigned_at: Timestamp
}
```

## 3. Assignment Algorithm
Deterministic hashing to prevent imbalance:
`hash = sha256(user_id + experiment_key)` → integer → modulo variant count.

## 4. Events
- `ab_test_variant_assigned { experiment_key, variant_key }`
- `experiment_exposed { experiment_key, variant_key, context }`

## 5. Lifecycle
1. Draft definition (inactive, no assignment).
2. Activate → assignments begin.
3. Pause → no new assignments; exposures still logged.
4. Complete → freeze & snapshot results.

## 6. API
`POST /api/experiments/assign` body `{ experiment_key }` returns variant.
`GET /api/experiments/:key/results` summary (post completion).

## 7. Metrics & Analysis
Primary metric uplift % + confidence interval (stat library external). Guardrails monitored for regressions (>5% degrade triggers pause).

## 8. Privacy & Ethics
Exclude experiments on sensitive billing without opt-in. Provide kill-switch env var `EXPERIMENTS_ENABLED=false`.

## 9. Testing
Unit: hashing stability; distribution fairness (simulate 10k assignments, variance <2%).
Integration: assignment → exposure event chain.
Edge: pause & resume retaining existing assignments.

## 10. Open Questions
1. Include variant override for staff preview? (likely yes)
2. Multi-metric support per experiment? (defer)

Completion Criteria: Assignment API live; exposure events logged; distribution fairness validated.

---
Traceability: Experiment backlog & A/B harness research items.
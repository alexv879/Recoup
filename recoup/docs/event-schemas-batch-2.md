# Event Schemas Batch 2
Version: 1.0 | Date: 15 Nov 2025

## Purpose
Extend instrumentation to cover notifications, badges, support escalation, experiments, retention, fraud, social proof impressions.

## Events & Core Properties
| Event | Properties | Notes |
|-------|-----------|-------|
| notification_delivered | { notification_id, type } | From notifications system |
| badge_awarded | { user_id, badge_key } | Gamification milestone |
| support_ticket_escalated | { ticket_id, priority, elapsed_hours } | SLA breach |
| experiment_exposed | { experiment_key, variant_key, context } | User saw experimental element |
| retention_purge_executed | { user_id_hash } | Deletion workflow completion |
| fraud_flagged | { user_id, score } | Fraud profile threshold crossed |
| social_proof_impression | { stat_key } | Visibility of dynamic stat |

## JSON Schema Conventions
- `additionalProperties: false`
- Required fields enumerated per event.
- Type safety (numbers vs strings) & enumerations where relevant.
- Privacy: hashed or anonymized where necessary (`user_id_hash`).

## Acceptance Criteria
[] All schemas added to `schemas/events/` directory.
[] Validation integrated into analytics emitter.
[] No PII leakage (review against denylist).

## Open Questions
1. Include `user_plan` in support escalation event? (pending)
2. Add `sampling_rate` to social proof impressions? (future)

---
Traceability: Completes remaining instrumentation gaps from research mapping.
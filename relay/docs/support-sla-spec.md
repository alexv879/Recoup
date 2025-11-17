# Support SLA & Ticketing Specification
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Implement ticket model, SLA tracking, escalation automation, analytics events supporting FRT/RTS metrics.

## 2. Ticket Data Model
```
support_ticket {
  id: string,
  user_id: string,
  priority: 'low'|'normal'|'high'|'critical',
  status: 'open'|'in_progress'|'waiting_user'|'resolved'|'breached'|'escalated',
  sla_target_hours: number,
  created_at: Timestamp,
  updated_at: Timestamp,
  first_response_at?: Timestamp,
  resolved_at?: Timestamp,
  escalation_at?: Timestamp,
  tags: string[],
  last_user_reply_at?: Timestamp
}
```

Priority → SLA Targets:
| Priority | SLA Target (hrs) | Response Target (hrs) |
|----------|------------------|-----------------------|
| low | 72 | 24 |
| normal | 48 | 12 |
| high | 24 | 4 |
| critical | 8 | 1 |

## 3. SLA Cron (Hourly)
Steps:
1. Load open tickets; compute `elapsed = now - created_at`.
2. If `elapsed > sla_target_hours` → status `breached`, emit `support_ticket_escalated`.
3. Warning notification at 80% threshold before breach.
4. Record metrics row `slaMetrics/{date}` summarizing breach counts.

## 4. Events
- `support_ticket_created { ticket_id, priority, sla_target_hours }`
- `support_ticket_escalated { ticket_id, priority, elapsed_hours }`
- `support_ticket_resolved { ticket_id, resolution_time_hours }`

## 5. API Endpoints
`POST /api/support/tickets` create.
`GET /api/support/tickets?status=` list.
`PATCH /api/support/tickets/:id` status updates.

## 6. Dashboard Metrics
- FRT = first_response_at - created_at.
- RTS = resolved_at - created_at.
- Breach Rate = breached tickets / total resolved.

## 7. Accessibility
Form fields labeled; status badges carry `aria-label` with state & SLA remaining hours.

## 8. Security
Authorization: user can view own tickets; staff role required for managing others.
Input validation: tags sanitized (alphanumeric + dash).

## 9. Test Plan
Unit: SLA classification logic, breach threshold, response time calculations.
Integration: cron job escalation path, metrics document creation.
Performance: ensure hourly job <500ms for 10k tickets.

## 10. Open Questions
1. Track CSAT survey integration now or later? (defer)
2. Include user plan in escalation event? (likely yes)

Completion Criteria: Cron registered; events logged; dashboard shows SLA metrics; breach rate <5% target.

---
Traceability: Support strategy research (FRT/RTS/CSAT) & SLA instrumentation gap.
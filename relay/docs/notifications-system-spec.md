# Notifications System Specification
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Unified in-app notification delivery (system, behavioral, escalation) with suppression, rate limits, accessibility, analytics instrumentation.

## 2. Scope & Types
| Type | Examples | Priority |
|------|----------|----------|
| system | plan change, payment received | P0 |
| behavioral | nudge: "Send draft invoice" | P1 |
| escalation | collections stage advance | P0 |

## 3. Data Model
```
notification {
  id: string,
  user_id: string,
  type: 'system'|'behavioral'|'escalation',
  code: string,
  created_at: Timestamp,
  read_at?: Timestamp,
  meta: Record<string, any>
}
user.notification_prefs {
  quiet_hours?: { start: '22:00', end: '07:00', tz: 'Europe/London' },
  behavioral_enabled: boolean,
  escalation_push_enabled: boolean
}
```

## 4. Delivery Flow
1. Producer enqueues raw event → normalization.
2. Suppression & rate limit filter.
3. Persist notification row.
4. WebSocket broadcast + ARIA live region insertion.
5. `notification_delivered` event emitted.

## 5. Rate Limits & Suppression
- Behavioral: ≤5 per rolling 24h.
- Quiet hours: suppress non-escalation between configured hours.
- Duplicate prevention: identical `code` within 2h suppressed.

## 6. API Endpoints
`GET /api/notifications?cursor=` → paginated (default 20).
`POST /api/notifications/mark-read` body: `{ids: string[]}`.
`POST /api/notifications/prefs` update prefs object.

## 7. Accessibility
- Live region `role="status"` appended for new notification text.
- Mark-read buttons keyboard focusable & announce state.
- Color contrast 4.5:1 minimum.

## 8. Performance
- Unread count memoized; target update <1s after mark-read.
- Query uses composite index `(user_id, created_at DESC)`.

## 9. Analytics Event
Schema: `notification_delivered { notification_id, type }`.
Additional: `notification_read { notification_id, latency_seconds }` (future optional).

## 10. Security & Privacy
- Meta must exclude raw PII; only IDs & hashed email if needed.
- Quiet hours processed in user’s timezone (tz required for activation).

## 11. Test Plan
Unit: rate limit logic, quiet hours suppression, duplicate detection.
Integration: enqueue → delivery path; mark-read updates unread count.
Accessibility: axe scan component, screen reader announcements snapshot.

## 12. Open Questions
1. Should escalation bypass quiet hours always? (currently yes)
2. Add digest batch for suppressed behavioral notifications? (future)

Completion Criteria: All endpoints live; latency <1s; event schema validated; rate limits enforced.

---
Traceability: Research notifications taxonomy & suppression gaps.
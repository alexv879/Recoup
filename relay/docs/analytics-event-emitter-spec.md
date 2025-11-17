# Analytics Event Emitter Specification
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Provide a robust, privacy-conscious, schema‑validated event emission layer (client & server) backing activation, recovery, growth metrics.

## 2. Architecture Overview
Components:
- `lib/analytics/schemas/` JSON schemas (existing + batch 2).
- `lib/analytics/validate.ts` AJV validator instance (precompiled).
- `lib/analytics/emitter.ts` queue + flush logic.
- `lib/analytics/transport.ts` adapter (Mixpanel/Amplitude; fallback to internal log).

## 3. Emission Flow
`track(name, props)` → validate schema → enrich (timestamp, user_id) → queue → background flush (interval 5s or size ≥20) → transport → success/fail callback.

## 4. Offline & Retry
Browser: localStorage spool `relay_event_queue` max 200 items; flush on online event.
Server: retry up to 3 attempts with exponential backoff (250ms, 500ms, 1000ms) then log.

## 5. Privacy Enforcement
- Email hashed (sha256 + static salt) before schema validation.
- Reject props containing keys from denylist [`raw_email`, `client_address`].

## 6. Performance Targets
- Validation <1ms/event (compile schemas once).
- Flush batch network call <200ms median.

## 7. Types (TypeScript)
```
export type EventName = 'invoice_created' | 'voice_recording_started' | ...;
export interface BaseEvent { name: EventName; props: Record<string, any>; ts: number; user_id?: string; }
```

## 8. Error Handling
Validation failure: emit internal `error_occurred { feature:'analytics', severity:'low' }`.
Transport failure: queue retained & retried; after final attempt flagged.

## 9. Testing
Unit: schema validation paths, privacy filter, hashing consistency.
Integration: offline queue simulation, retry logic, transport adapter switching.
Load: 1000 events flush performance sample.

## 10. Open Questions
1. Multi-tenant future segmentation keys? (defer)
2. Toggle for disabling third-party (privacy-only mode)?

Completion Criteria: Wrapper integrated; batch 2 schemas published; offline queue functional; privacy filters enforced.

---
Traceability: Product analytics strategy (wrapper + property standardization) & unresolved schema gaps.
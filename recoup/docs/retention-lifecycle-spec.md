# Data Retention & Deletion Lifecycle Specification
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Codify purge schedules, anonymization, compliance logging aligned with privacy & legal research.

## 2. Retention Policy Summary
| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| Evidence files | 30 days | Minimize sensitive storage |
| Voice raw audio | Ephemeral (<24h) unless opt-in | Privacy & storage cost |
| Transcripts (final text) | Indefinite (user deletable) | Business history |
| Late charge audit logs | 7 years | Legal compliance |
| Email auth reports | 1 year | Deliverability trend |

## 3. Purge Jobs
Nightly (`02:00 UTC`): evidence purge older than 30d.
Weekly (`Sunday 03:00 UTC`): DMARC aggregate parse store summary → rotate raw >30d.
Monthly (`1st 04:00 UTC`): transcript privacy audit (verify no raw audio linger).

## 4. Deletion Workflow
Request → queue `deletion_job` with user_id.
Steps:
1. Replace PII fields (name, email) with null; store hashed user_id `usr_<sha256_prefix>`.
2. Remove evidence files & voice audio (if any).
3. Append compliance log entry.
4. Emit `retention_purge_executed { user_id_hash }`.

## 5. Compliance Log Schema
```
retention_log {
  id,
  user_id_hash,
  action: 'delete'|'purge'|'audit',
  timestamp,
  details: { items_removed:int, evidence_files:int }
}
```

## 6. Security & Integrity
- Use salted hash (rotation annually).
- Keep mapping for 30d in secure vault for potential legal hold edge cases.
- Verify deletion idempotency (repeat job does not error).

## 7. Monitoring
- Daily summary: records purged count.
- Alert if purge job fails or zero items processed ≥3 consecutive days.

## 8. Tests
Unit: anonymization util, hash generation, idempotency.
Integration: deletion job end-to-end; evidence purge selects correct set.
Audit: simulate user with mixed artifacts (invoice + evidence + transcript).

## 9. Open Questions
1. Should we retain hashed email for analytics? (currently no)
2. Legal hold override flag design?

Completion Criteria: Jobs scheduled; event emitted; compliance log entries visible; audit passes.

---
Traceability: Privacy policy retention schedule & deletion workflow research gaps.
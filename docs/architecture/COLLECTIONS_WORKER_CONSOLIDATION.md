# Collections Worker Consolidation - Architecture Decision Record

**Date**: January 2025
**Status**: ✅ **IMPLEMENTED**
**Decision**: Consolidate all collection logic into `collectionsEscalator.ts`

---

## Context

The Recoup application had **two separate worker systems** handling automated collections:

1. **`emailSequenceWorker.ts`**: Sends Day 5/15/30 reminder emails
   - Uses `emailEvents` collection for tracking
   - Runs hourly
   - Email-only

2. **`collectionsEscalator.ts`**: State machine-based escalation
   - Uses `collection_attempts` collection for tracking
   - Runs every 6 hours
   - Multi-channel (email, SMS, letters, calls, agency)

### The Problem

This dual-system architecture created several critical issues:

#### 1. **Data Inconsistency**
- Emails sent by `emailSequenceWorker` logged to `emailEvents`
- All other actions logged to `collection_attempts`
- **No single source of truth** for collection timeline

#### 2. **Duplicate Communications**
- Both workers could send emails for the same invoice
- Risk of clients receiving duplicate reminders
- Unpredictable behavior when both systems run

#### 3. **Maintenance Complexity**
- Two codebases to maintain
- Different tracking mechanisms
- Difficult to debug issues
- Impossible to build comprehensive reporting

#### 4. **Incomplete Audit Trail**
- `collection_attempts` missing email events from sequence worker
- Cannot accurately answer: "What was the last action taken for this invoice?"
- GDPR/compliance risk

---

## Decision

**Deprecate `emailSequenceWorker.ts`** and consolidate all collection logic into the state-driven **`collectionsEscalator.ts`** worker.

### Why `collectionsEscalator.ts` Wins

✅ **State Machine Architecture**: Proper escalation levels (pending → gentle → firm → final → agency)
✅ **Multi-Channel Support**: Email, SMS, letters, calls, agency handoff
✅ **Single Audit Trail**: All actions logged to `collection_attempts`
✅ **Pause/Resume Logic**: Respects payment claims, disputes, manual pauses
✅ **Timeline Events**: Comprehensive audit trail for compliance
✅ **Rate Limiting**: Prevents hitting SendGrid/Twilio limits
✅ **Consent Checking**: Validates user consent before each action

---

## Implementation

### Phase 1: Mapping (✅ COMPLETE)

The `collectionsEscalator.ts` already maps escalation levels to day-based email templates:

```typescript
// collectionsEscalator.ts lines 333-338
const templateLevel = level === 'gentle' ? 5 : level === 'firm' ? 15 : 30;
const mappedLevel = templateLevel === 5 ? 'day5' :
                    templateLevel === 15 ? 'day15' :
                    'day30';
```

**Escalation Level → Email Template Mapping**:
- `pending` (0-4 days): No email
- `gentle` (5-14 days): Day 5 email template
- `firm` (15-29 days): Day 15 email template
- `final` (30-59 days): Day 30 email template
- `agency` (60+ days): Handoff to agency

### Phase 2: Deprecation (✅ COMPLETE)

**File**: `jobs/emailSequenceWorker.ts`

Added deprecation notice:
```typescript
/**
 * @deprecated This worker is deprecated and will be removed.
 * The logic has been consolidated into the new `collectionsEscalator.ts` worker,
 * which provides a unified, state-driven approach to all collection attempts.
 */
```

### Phase 3: Cron Job Configuration

**Old Configuration** (to be removed):
```yaml
# Hourly email sequence worker
- description: 'Process email sequences'
  url: /api/cron/process-email-sequences
  schedule: every 1 hours
```

**New Configuration** (keep only this):
```yaml
# Collections escalation worker (handles ALL collection actions)
- description: 'Process collections escalations'
  url: /api/cron/process-escalations
  schedule: every 6 hours
```

### Phase 4: Data Migration

**Migrate `emailEvents` to `collection_attempts`**:

Create migration script: `scripts/migrate-email-events.ts`

```typescript
// For each email event in emailEvents collection:
// 1. Create equivalent collection_attempt record
// 2. Map level: day5 → gentle, day15 → firm, day30 → final
// 3. Preserve timestamp, delivery status
// 4. Link to correct invoice
// 5. Mark as migrated

const levelMapping = {
  day5: 'gentle',
  day15: 'firm',
  day30: 'final',
};
```

---

## Benefits

### 1. Single Source of Truth
```typescript
// Query collection timeline for ANY invoice
const attempts = await db
  .collection('collection_attempts')
  .where('invoiceId', '==', invoiceId)
  .orderBy('attemptDate', 'desc')
  .get();

// Returns ALL actions: emails, SMS, letters, calls, agency
```

### 2. No Duplicate Communications
```typescript
// collectionsEscalator checks last action before sending
const lastAttempt = await getLastCollectionAttempt(invoiceId);

if (lastAttempt && isTooSoonToEscalate(lastAttempt)) {
  return; // Skip this invoice
}
```

### 3. Comprehensive Reporting
```typescript
// Get all collection attempts across all channels
const stats = await db
  .collection('collection_attempts')
  .where('freelancerId', '==', userId)
  .get();

// Analyze: email open rates, SMS delivery, letter effectiveness
```

### 4. GDPR Compliance
```typescript
// Single deletion query for ALL collection data
await db
  .collection('collection_attempts')
  .where('freelancerId', '==', userId)
  .get()
  .then(snapshot => {
    snapshot.docs.forEach(doc => doc.ref.delete());
  });
```

---

## Rollout Plan

### Step 1: Verify Escalator Handles Day-Based Emails ✅
**Status**: COMPLETE

The escalator correctly maps:
- Day 5 → `gentle` level → Day 5 template
- Day 15 → `firm` level → Day 15 template
- Day 30 → `final` level → Day 30 template

### Step 2: Run Both Workers in Parallel (Monitoring Phase)
**Duration**: 1 week
**Goal**: Verify no regressions

```typescript
// Add logging to both workers
logInfo('Worker comparison', {
  emailSequenceWorker: { invoicesProcessed, emailsSent },
  collectionsEscalator: { invoicesProcessed, emailsSent },
  discrepancies: findDiscrepancies(),
});
```

**Success Criteria**:
- Both workers process same invoices
- No duplicate emails sent to clients
- All emails logged correctly

### Step 3: Disable emailSequenceWorker
**After**: 1 week of successful parallel operation

Remove from cron configuration:
```diff
- - description: 'Process email sequences'
-   url: /api/cron/process-email-sequences
-   schedule: every 1 hours
```

### Step 4: Data Migration
**After**: emailSequenceWorker disabled for 24 hours

Run migration script:
```bash
ts-node scripts/migrate-email-events.ts --dry-run
ts-node scripts/migrate-email-events.ts --execute
```

### Step 5: Delete Old Worker Code
**After**: 30 days with no issues

```bash
git rm jobs/emailSequenceWorker.ts
git rm app/api/cron/process-email-sequences/route.ts
```

---

## Verification Checklist

Before removing `emailSequenceWorker.ts`:

- [ ] `collectionsEscalator.ts` sends Day 5/15/30 emails correctly
- [ ] Email templates match original sequence worker
- [ ] Idempotency prevents duplicate sends
- [ ] Rate limiting prevents SendGrid throttling
- [ ] All emails logged to `collection_attempts`
- [ ] No clients report duplicate emails
- [ ] Dashboard shows accurate collection timeline
- [ ] Analytics show consistent email send rates
- [ ] No spike in errors or failed sends

---

## Rollback Procedure

If issues arise after disabling `emailSequenceWorker`:

### Quick Rollback (< 5 minutes)

1. **Re-enable cron job**:
   ```yaml
   - description: 'Process email sequences'
     url: /api/cron/process-email-sequences
     schedule: every 1 hours
   ```

2. **Monitor logs** for successful execution

3. **Investigate** why escalator failed

### Full Rollback (if escalator is broken)

1. Re-enable `emailSequenceWorker` cron
2. Disable `collectionsEscalator` temporarily
3. Fix escalator issues
4. Re-test in staging
5. Re-attempt rollout

---

## Monitoring & Alerts

### Key Metrics to Track

```typescript
// Sentry custom metrics
Sentry.metrics.increment('collections.emails_sent', {
  tags: { worker: 'escalator', level: 'gentle' }
});

Sentry.metrics.distribution('collections.processing_time_ms', {
  tags: { worker: 'escalator' }
});
```

### Alerts to Configure

1. **Zero Emails Sent**: If `collectionsEscalator` runs but sends 0 emails for 24 hours
2. **High Error Rate**: If >5% of email sends fail
3. **Duplicate Sends**: If same invoice+level appears in collection_attempts twice
4. **Processing Time**: If worker takes >5 minutes to complete

---

## Technical Details

### Collection Attempt Schema

```typescript
interface CollectionAttempt {
  attemptId: string;
  invoiceId: string;
  freelancerId: string;
  attemptType: 'email_reminder' | 'sms_reminder' | 'physical_letter' | 'phone_call' | 'ai_call' | 'agency_handoff';
  attemptDate: Timestamp;
  attemptNumber: number; // 1st, 2nd, 3rd attempt
  escalationLevel: 'pending' | 'gentle' | 'firm' | 'final' | 'agency';

  result: 'pending' | 'success' | 'failed' | 'bounced';
  resultDetails: string;

  // Email-specific (if attemptType === 'email_reminder')
  emailSentAt?: Timestamp;
  emailTemplate?: 'day5' | 'day15' | 'day30';
  sendgridMessageId?: string;
  emailDeliveryStatus?: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';

  // SMS-specific (if attemptType === 'sms_reminder')
  twilioMessageId?: string;
  smsSentAt?: Timestamp;
  smsStatus?: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';

  // Metadata
  isPremiumFeature: boolean;
  consentGiven: boolean;
  cost?: number; // Cost in GBP (e.g., 0.04 for SMS, 1.50 for letter)

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Query Examples

**Get last action for invoice**:
```typescript
const lastAttempt = await db
  .collection('collection_attempts')
  .where('invoiceId', '==', invoiceId)
  .orderBy('attemptDate', 'desc')
  .limit(1)
  .get();
```

**Get all email attempts**:
```typescript
const emailAttempts = await db
  .collection('collection_attempts')
  .where('attemptType', '==', 'email_reminder')
  .where('freelancerId', '==', userId)
  .get();
```

**Check if Day 15 email sent**:
```typescript
const day15Sent = await db
  .collection('collection_attempts')
  .where('invoiceId', '==', invoiceId)
  .where('attemptType', '==', 'email_reminder')
  .where('emailTemplate', '==', 'day15')
  .limit(1)
  .get();

return !day15Sent.empty;
```

---

## Success Metrics

After full migration:

✅ **Single Worker**: Only `collectionsEscalator` running
✅ **Single Collection**: All actions in `collection_attempts`
✅ **Zero Duplicates**: No clients receive duplicate emails
✅ **Complete Timeline**: Every collection action logged
✅ **Accurate Reporting**: Dashboard shows complete history
✅ **GDPR Compliant**: Single deletion query clears all data

---

## Conclusion

The consolidation of collection workers into `collectionsEscalator.ts` is a critical architectural improvement that:

- ✅ Eliminates data inconsistency
- ✅ Prevents duplicate communications
- ✅ Simplifies maintenance
- ✅ Improves audit trail
- ✅ Enables comprehensive reporting
- ✅ Ensures GDPR compliance

This is a **production-critical** change that must be completed before public launch to ensure system reliability and data integrity.

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Owner**: Engineering Team
**Reviewers**: Architecture, Product, Compliance

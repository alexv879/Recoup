# Collections Escalation System - Setup & Deployment Guide

**Version:** 1.0  
**Last Updated:** January 2025  
**Implementation:** Phase 2 Task 6

---

## Overview

The Collections Escalation System automatically manages overdue invoices through a 4-stage escalation process, providing visual tracking, pause/resume controls, and multi-channel reminders.

**Based on Research:**
- `collections_implementation_guide.md` (Complete Implementation Guide)
- `late-payment-escalation-flow.md` (Escalation Decision Tree)
- `MASTER_IMPLEMENTATION_AUDIT_V1.md` §4.7

**State Machine:**
```
pending (0-4d) → gentle (5-14d) → firm (15-29d) → final (30-59d) → agency (60+d)
```

---

## Architecture

### Core Components

**1. Escalation Types & State (`types/escalation.ts`)**
- `EscalationLevel` enum (pending | gentle | firm | final | agency)
- `EscalationConfig` with WCAG AAA color compliance
- `EscalationState` interface for tracking current status
- `EscalationTimelineEvent` for audit trail
- Helper functions: `calculateEscalationLevel()`, `shouldEscalate()`, `getEscalationAriaLabel()`

**2. UI Components**
- `EscalationStatusBadge.tsx` - Status indicators with color + icon + text
- `EscalationProgressBar.tsx` - 4-stage progress visualization with tooltips
- `CollectionsTimeline.tsx` - Chronological event timeline with expand/collapse

**3. Automation Worker (`jobs/collectionsEscalator.ts`)**
- `runEscalationWorker()` - Main cron function (scans all overdue invoices)
- `escalateInvoice()` - Escalate to target level + send reminders
- `pauseEscalation()` - Pause for payment claims/disputes
- `resumeEscalation()` - Resume automation
- `getEscalationState()`, `getEscalationTimeline()` - State retrieval

**4. API Endpoints**
- `GET /api/invoices/[id]/escalation` - Get current state + timeline
- `POST /api/invoices/[id]/escalation/pause` - Pause/resume escalation
- `GET /api/cron/process-escalations` - Cron endpoint (6-hour schedule)

**5. Analytics Events**
- `collections_escalated` - Level change tracked
- `escalation_paused` - Automation paused
- `escalation_resumed` - Automation resumed
- `sms_sent` - SMS reminder sent

---

## Firestore Collections

### `escalation_states` Collection

**Document ID:** `{invoiceId}`

**Schema:**
```typescript
{
  currentLevel: 'gentle' | 'firm' | 'final' | 'agency',
  isPaused: boolean,
  pauseReason?: 'payment_claim' | 'manual' | 'dispute',
  pausedAt?: Timestamp,
  pauseUntil?: Timestamp, // Auto-resume deadline
  lastEscalatedAt: Timestamp,
  nextEscalationDue?: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes Required:**
```
Collection: escalation_states
- isPaused ASC, lastEscalatedAt DESC
```

### `escalation_timeline` Collection

**Document ID:** `{invoiceId}-{eventType}-{timestamp}`

**Schema:**
```typescript
{
  eventId: string, // Unique event ID
  invoiceId: string,
  escalationLevel: 'gentle' | 'firm' | 'final' | 'agency',
  eventType: 'escalated' | 'paused' | 'resumed' | 'reminder_sent' | 'payment_received',
  channel?: 'email' | 'sms' | 'phone' | 'agency',
  timestamp: Timestamp,
  message: string, // Human-readable description
  metadata?: {
    previousLevel?: string,
    daysOverdue?: number,
    messageId?: string, // SendGrid/Twilio ID
    // ... additional context
  },
  createdAt: Timestamp
}
```

**Indexes Required:**
```
Collection: escalation_timeline
- invoiceId ASC, timestamp DESC
```

### `invoices` Collection (Updated)

**Added Fields:**
```typescript
{
  escalationLevel?: 'pending' | 'gentle' | 'firm' | 'final' | 'agency'
}
```

### `users` Collection (Updated)

**Added Fields:**
```typescript
{
  collectionsAutomation?: {
    enabled: boolean,
    customSchedule?: {
      gentle?: number, // Override day 5
      firm?: number,   // Override day 15
      final?: number,  // Override day 30
      agency?: number  // Override day 60
    }
  }
}
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Existing (already configured)
CRON_SECRET=your_cron_secret_here
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# No new variables needed for Phase 2 Task 6
```

---

## Deployment Steps

### Step 1: Deploy Code

```bash
# 1. Verify all files created
git status

# Expected new files:
# - types/escalation.ts
# - components/Dashboard/EscalationStatusBadge.tsx
# - components/Dashboard/EscalationProgressBar.tsx
# - components/Dashboard/CollectionsTimeline.tsx
# - jobs/collectionsEscalator.ts
# - app/api/cron/process-escalations/route.ts
# - app/api/invoices/[id]/escalation/route.ts
# - app/api/invoices/[id]/escalation/pause/route.ts
# - schemas/events/escalation_paused.json
# - schemas/events/escalation_resumed.json
# - schemas/events/sms_sent.json
# - docs/ESCALATION_SYSTEM_SETUP.md

# 2. Commit and push
git add .
git commit -m "feat(phase2): Collections escalation system with visual timeline and automation"
git push origin main

# 3. Deploy to Vercel
# (Automatic deployment via GitHub integration)
```

### Step 2: Create Firestore Indexes

**Via Firebase Console:**

1. Go to Firebase Console → Firestore → Indexes
2. Create composite indexes:

**escalation_states:**
```
Collection ID: escalation_states
Fields:
  - isPaused (Ascending)
  - lastEscalatedAt (Descending)
Query scope: Collection
```

**escalation_timeline:**
```
Collection ID: escalation_timeline
Fields:
  - invoiceId (Ascending)
  - timestamp (Descending)
Query scope: Collection
```

**Or via Firebase CLI:**
```bash
# Add to firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "escalation_states",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isPaused", "order": "ASCENDING" },
        { "fieldPath": "lastEscalatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "escalation_timeline",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "invoiceId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Step 3: Verify Cron Job

**Check vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/process-escalations",
      "schedule": "0 */6 * * *",
      "description": "Every 6 hours - Auto-escalate overdue invoices"
    }
  ]
}
```

**Test Cron Endpoint:**
```bash
# Get CRON_SECRET from Vercel environment variables
curl -X GET https://your-app.vercel.app/api/cron/process-escalations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "scannedCount": 45,
  "escalatedCount": 12,
  "pausedCount": 3,
  "skippedCount": 30,
  "errors": [],
  "duration": "2345ms",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

### Step 4: Enable for Users

**Default Behavior:**
- Automation enabled by default for all users
- Uses standard schedule (5d → 15d → 30d → 60d)
- Email channel enabled by default
- SMS requires explicit consent

**To Disable for Specific User:**
```typescript
// Update user document in Firestore
await db.collection('users').doc(userId).update({
  'collectionsAutomation.enabled': false
});
```

**To Customize Schedule for User:**
```typescript
await db.collection('users').doc(userId).update({
  'collectionsAutomation.enabled': true,
  'collectionsAutomation.customSchedule': {
    gentle: 3,  // Escalate at day 3 instead of 5
    firm: 10,   // Escalate at day 10 instead of 15
    final: 21,  // Escalate at day 21 instead of 30
    agency: 45  // Escalate at day 45 instead of 60
  }
});
```

---

## Integration with Existing Systems

### Payment Claims Auto-Pause

When a payment claim is submitted (via "I Paid" button), escalation automatically pauses:

**In `app/api/payment-confirmation/[id]/route.ts`:**
```typescript
// After creating payment claim
await pauseEscalation(invoiceId, 'payment_claim', pauseUntil48Hours);
```

**Auto-Resume Logic:**
- If freelancer verifies payment → Escalation remains paused (invoice moves to 'paid')
- If 48 hours expire with no verification → Auto-resume escalation

### Email Sequence Integration

The existing email sequence worker (`jobs/emailSequenceWorker.ts`) and escalation worker run independently:

**Email Worker (Hourly):**
- Sends Day 5/15/30 reminder emails
- Records email events in `emailEvents` collection
- Does NOT change escalation level

**Escalation Worker (Every 6 Hours):**
- Updates escalation level based on days overdue
- Sends email + SMS (if channels enabled)
- Records escalation events in `escalation_timeline`

**Coordination:**
- Both systems respect pause status
- Both check `collectionsAutomation.enabled` flag
- Timeline shows all events (emails + escalations)

### Agency Handoff Integration

When invoice reaches 60+ days (agency level):

**Automatic:**
- Escalation level set to 'agency'
- Timeline event recorded
- Analytics event fired

**Manual Agency Escalation:**
User must use existing agency handoff UI (`app/api/collections/agency-handoff/route.ts`):
```typescript
// This endpoint handles actual agency submission
POST /api/collections/agency-handoff
{
  "invoiceId": "...",
  "agencyId": "agency_intrum_uk",
  "notes": "..."
}
```

---

## Testing Checklist

### Unit Tests (Manual Testing)

**Test 1: Auto-Escalation**
1. Create invoice with due date 7 days ago
2. Wait for next cron run (or trigger manually)
3. Verify:
   - ✅ Escalation level = 'gentle'
   - ✅ Timeline event created
   - ✅ Email sent
   - ✅ Analytics event fired

**Test 2: Pause/Resume**
1. Submit payment claim for overdue invoice
2. Verify:
   - ✅ Escalation paused (isPaused = true)
   - ✅ Timeline shows pause event
3. Wait 48 hours (or manually resume)
4. Verify:
   - ✅ Escalation resumed (isPaused = false)
   - ✅ Timeline shows resume event

**Test 3: Manual Pause**
1. Call `POST /api/invoices/[id]/escalation/pause` with action='pause'
2. Verify:
   - ✅ Escalation paused
   - ✅ Timeline updated
   - ✅ Badge shows "⏸️ Paused"
3. Call same endpoint with action='resume'
4. Verify:
   - ✅ Escalation resumed
   - ✅ Timeline updated

**Test 4: Progress Bar UI**
1. Navigate to overdue invoice details
2. Verify:
   - ✅ Progress bar shows current stage
   - ✅ Completed stages filled with color
   - ✅ Future stages grayed out
   - ✅ Tooltips appear on hover
   - ✅ Keyboard navigation works (Tab → Space)

**Test 5: Timeline UI**
1. View collections timeline for invoice
2. Verify:
   - ✅ Events in chronological order (newest first)
   - ✅ Click to expand metadata
   - ✅ Icons + colors correct per event type
   - ✅ ARIA labels present

**Test 6: Accessibility**
1. Use screen reader (NVDA/VoiceOver)
2. Verify:
   - ✅ Badge announces: "Firm notice stage, 18 days overdue"
   - ✅ Progress bar: "Escalation level 2 of 4"
   - ✅ Timeline: "Escalated event, Firm notice sent..."
3. Test keyboard navigation:
   - ✅ Tab through all interactive elements
   - ✅ Focus indicators visible
   - ✅ No keyboard traps

### Integration Tests

**Test 7: Multi-Channel Escalation**
1. Create invoice for user with SMS consent
2. Escalate to 'firm' level
3. Verify:
   - ✅ Email sent
   - ✅ SMS sent (if user has phone number)
   - ✅ Timeline shows both events
   - ✅ Analytics events for both channels

**Test 8: Custom Schedule**
1. Set user custom schedule (gentle = 3 days)
2. Create invoice with due date 4 days ago
3. Verify:
   - ✅ Escalation level = 'gentle' (not pending)
   - ✅ Email sent at day 3 (not day 5)

---

## Monitoring & Alerts

### Success Metrics (Phase 2 Gate)

**From ROLLING_ROADMAP_AND_MIGRATION_PLAN.md:**
- **Recovery rate:** ≥80% target (currently baseline)
- **Escalation accuracy:** <1% incorrect escalations
- **Timeline visibility:** ≥90% users view timeline on overdue invoices

### Mixpanel Dashboards

**Escalation Funnel:**
```
Overdue Invoices (100%)
  → Gentle (65%)
    → Firm (40%)
      → Final (18%)
        → Agency (5%)
          → Recovered (3%)
```

**Key Events to Monitor:**
- `collections_escalated` (count by level)
- `escalation_paused` (count by reason)
- `escalation_resumed` (count by reason)
- `sms_sent` (count by escalation level)

**Retention Cohorts:**
- Users who view escalation progress bar: +X% retention
- Users who manually pause collections: Retention impact

### Error Monitoring

**Sentry Alerts:**
- Escalation worker failures (>5 errors per hour)
- Timeline event creation failures
- SMS send failures (if SMS consent exists)

**Firestore Monitoring:**
- Query performance (escalation_states scans)
- Write throughput (timeline events during peak escalations)

---

## Rollback Procedure

**If critical issue detected:**

### Step 1: Disable Cron Job
```bash
# Option A: Remove from vercel.json + redeploy
# Option B: Add kill switch to cron endpoint

# In route.ts:
const ESCALATION_ENABLED = process.env.ESCALATION_AUTOMATION_ENABLED === 'true';
if (!ESCALATION_ENABLED) {
  return NextResponse.json({ success: true, message: 'Escalation disabled via feature flag' });
}
```

### Step 2: Pause All Active Escalations
```typescript
// Run migration script
const overdueInvoices = await db.collection('invoices')
  .where('status', 'in', ['overdue', 'in_collections'])
  .get();

for (const doc of overdueInvoices.docs) {
  await pauseEscalation(doc.id, 'manual', /* pauseUntil */ undefined);
}
```

### Step 3: Roll Back Code
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or roll back via Vercel dashboard
```

---

## Phase 2 Completion Criteria

**Task 6 Complete When:**
- ✅ All 11 files created and deployed
- ✅ Firestore indexes created
- ✅ Cron job running every 6 hours
- ✅ Manual testing checklist passed (8/8 tests)
- ✅ Analytics events flowing to Mixpanel
- ✅ Documentation complete

**Ready for Task 7 (Payment Verification Evidence Upgrade) when:**
- ✅ 7 days of production data collected
- ✅ No critical escalation errors
- ✅ Recovery rate baseline established

---

## Support & Troubleshooting

### Common Issues

**Issue 1: Escalation not triggering**
- Check: `collectionsAutomation.enabled` = true in user doc
- Check: Invoice status = 'overdue' or 'in_collections'
- Check: Cron job running (Vercel → Deployments → Cron Logs)
- Check: Days overdue ≥ 5 for gentle level

**Issue 2: Timeline events not showing**
- Check: Firestore index created for `escalation_timeline`
- Check: `invoiceId` field matches invoice doc ID exactly
- Verify: No read errors in browser console

**Issue 3: SMS not sending despite consent**
- Check: `collectionsConsent.smsConsent` = true
- Check: `collectionsConsent.smsOptedOut` = false
- Check: `phoneNumber` field exists and E.164 format (+44...)
- Check: Twilio balance sufficient

**Issue 4: Pause/resume not working**
- Check: API endpoint authentication (Clerk userId)
- Check: Invoice ownership (freelancerId matches userId)
- Check: Firestore write permissions

### Debug Mode

**Enable verbose logging:**
```typescript
// In collectionsEscalator.ts
const DEBUG_MODE = process.env.ESCALATION_DEBUG === 'true';

if (DEBUG_MODE) {
  console.log('Escalation state:', state);
  console.log('Target level:', targetLevel);
  console.log('Should escalate:', shouldEscalate(state.currentLevel, daysOverdue));
}
```

---

## Next Steps (Phase 2 Tasks 7-8)

**Task 7: Payment Verification Evidence Upgrade**
- Add file upload for payment proof
- 48-hour countdown timer
- Auto-resume after verification deadline

**Task 8: Pricing 3-Tier Refactor**
- Migrate from 4 tiers → 3 tiers (Starter/Growth/Pro)
- Annual discount toggle (20% off)
- Feature flag: `PRICING_V3_ENABLED`

---

**Document Version:** 1.0  
**Created:** January 2025  
**Phase:** 2 (Weeks 4-6)  
**Research Sources:** 
- collections_implementation_guide.md
- late-payment-escalation-flow.md
- MASTER_IMPLEMENTATION_AUDIT_V1.md

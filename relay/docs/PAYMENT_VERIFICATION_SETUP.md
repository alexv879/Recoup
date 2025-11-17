# Payment Verification Evidence System - Setup & Deployment Guide

**Version:** 1.0  
**Last Updated:** November 2025  
**Implementation:** Phase 2 Task 7

---

## Overview

The Payment Verification Evidence System allows clients to upload proof of payment (bank statements, receipts, screenshots) when claiming payment on invoices. Freelancers receive reminders to verify claims within 48 hours, after which collections automatically resume if unverified.

**Based on Research:**
- `payment_verification_guide.md` (Complete Implementation Guide)
- `MASTER_IMPLEMENTATION_AUDIT_V1.md` §4.9

**Key Features:**
- Drag-and-drop file upload (PDF, PNG, JPG up to 10MB)
- 48-hour verification deadline with countdown timer
- Automated reminders at 24h and 6h marks
- Auto-resume collections if deadline expires
- Focus-trapped modal with 3 verification actions
- WCAG AAA accessible components

---

## Architecture

### Core Components

**1. File Upload (`components/Payments/PaymentEvidenceUpload.tsx`)**
- Drag-and-drop or click-to-browse interface
- File validation (type: PDF/PNG/JPG, size: max 10MB)
- Real-time preview for images
- Upload progress and success/error states
- ARIA labels and keyboard support

**2. Countdown Timer (`components/Payments/VerificationCountdown.tsx`)**
- Real-time countdown updating every minute
- Color-coded urgency (green → yellow → red)
- Progress bar visualization
- Accessible time announcements
- Auto-triggers callback when deadline expires

**3. Verification Modal (`components/Payments/PaymentVerificationModal.tsx`)**
- Focus trap (tab navigation contained)
- Escape key to close
- 3 action buttons:
  * **Confirm Payment** (Green) - Marks invoice paid, stops collections
  * **Request Evidence** (Yellow) - Asks client for proof
  * **Reject Claim** (Red) - Resumes collections with reason dropdown
- Shows payment details, evidence preview, countdown timer
- Rejection reasons: No payment received, Incorrect amount, Wrong invoice, Duplicate, Other

**4. Evidence Upload API (`app/api/payment-claims/[id]/evidence/route.ts`)**
- POST endpoint for file uploads
- Firebase Storage integration
- File validation and sanitization
- Metadata storage in Firestore
- Analytics event tracking

**5. Verification Deadline Cron (`app/api/cron/check-verification-deadlines/route.ts`)**
- Runs hourly (0 * * * *)
- Sends 24-hour reminder emails
- Sends 6-hour urgent reminders
- Auto-rejects claims after 48 hours
- Auto-resumes collections escalation

---

## Firebase Storage Setup

### Step 1: Create Storage Bucket

**Via Firebase Console:**

1. Go to Firebase Console → Storage
2. Click "Get started"
3. Choose production mode (or test mode for development)
4. Select region (recommend: `europe-west2` for UK)
5. Click "Done"

**Via Firebase CLI:**
```bash
firebase init storage

# This creates storage.rules file
```

### Step 2: Configure Storage Rules

**File: `storage.rules`**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Payment evidence uploads
    match /payment-evidence/{claimId}/{filename} {
      // Allow authenticated users to upload evidence
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024  // Max 10MB
                   && request.resource.contentType.matches('(application/pdf|image/png|image/jpeg)');
      
      // Allow authenticated users to read evidence for their own claims
      allow read: if request.auth != null;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**Deploy Rules:**
```bash
firebase deploy --only storage:rules
```

### Step 3: Configure CORS (Optional)

If uploading from web browser with custom domain:

**File: `cors.json`**
```json
[
  {
    "origin": ["https://your-app.vercel.app", "http://localhost:3000"],
    "method": ["GET", "POST", "PUT"],
    "maxAgeSeconds": 3600
  }
]
```

**Deploy CORS:**
```bash
gsutil cors set cors.json gs://your-project-id.appspot.com
```

---

## Firestore Updates

### `payment_claims` Collection (Updated)

**New Fields Added:**
```typescript
{
  // Evidence fields
  evidenceFileUrl?: string,      // Firebase Storage download URL
  evidenceFileName?: string,     // Original filename
  evidenceFileSize?: number,     // Bytes
  evidenceFileType?: string,     // MIME type
  evidenceUploadedAt?: Timestamp,
  evidenceUploadedBy?: string,   // User ID

  // Verification deadline tracking
  verificationDeadline?: Timestamp, // 48h after creation
  reminder24hSent?: boolean,
  reminder24hSentAt?: Timestamp,
  reminder6hSent?: boolean,
  reminder6hSentAt?: Timestamp,
  autoRejected?: boolean,        // True if deadline expired

  // Updated payment methods
  paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'card' | 'paypal' | 'other'
}
```

**Indexes Required:**
```
Collection: payment_claims
- status ASC, verificationDeadline ASC (for cron job queries)
- freelancerId ASC, status ASC (for dashboard queries)
```

**Create Indexes:**
```bash
# Via Firebase Console → Firestore → Indexes → Create Index

# Or via firestore.indexes.json:
{
  "indexes": [
    {
      "collectionGroup": "payment_claims",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "verificationDeadline", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "payment_claims",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "freelancerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}

# Deploy:
firebase deploy --only firestore:indexes
```

---

## Environment Variables

**No new variables required** - uses existing Firebase and SendGrid config:

```bash
# Existing (already configured)
FIREBASE_ADMIN_PRIVATE_KEY=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PROJECT_ID=...

SENDGRID_API_KEY=...
CRON_SECRET=...

NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Deployment Steps

### Step 1: Deploy Code

```bash
# 1. Verify all files created
git status

# Expected new files:
# - components/Payments/PaymentEvidenceUpload.tsx
# - components/Payments/VerificationCountdown.tsx
# - components/Payments/PaymentVerificationModal.tsx
# - app/api/payment-claims/[id]/evidence/route.ts
# - app/api/cron/check-verification-deadlines/route.ts
# - schemas/events/payment_evidence_uploaded.json
# - schemas/events/payment_claim_auto_rejected.json
# - schemas/events/verification_reminder_sent.json
# - docs/PAYMENT_VERIFICATION_SETUP.md

# Modified files:
# - types/models.ts (PaymentClaim interface updated)
# - lib/analytics.ts (new PaymentEvent types)
# - vercel.json (new cron job added)

# 2. Commit and push
git add .
git commit -m "feat(phase2): Payment verification evidence system with 48h deadline automation"
git push origin main

# 3. Deploy to Vercel (automatic)
```

### Step 2: Configure Firebase Storage

See "Firebase Storage Setup" section above.

### Step 3: Create Firestore Indexes

See "Firestore Updates" section above.

### Step 4: Verify Cron Job

**Check vercel.json:**
```json
{
  "path": "/api/cron/check-verification-deadlines",
  "schedule": "0 * * * *",
  "description": "Hourly check for payment verification deadlines"
}
```

**Test Cron Endpoint:**
```bash
curl -X GET https://your-app.vercel.app/api/cron/check-verification-deadlines \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "scannedCount": 5,
  "reminders24h": 1,
  "reminders6h": 0,
  "autoResumedCount": 0,
  "errors": [],
  "duration": "1234ms",
  "timestamp": "2025-11-16T10:00:00.000Z"
}
```

### Step 5: Test File Upload

**Manual Test:**
1. Create a payment claim via "I Paid" button
2. Upload a test PDF or screenshot
3. Verify file appears in Firebase Storage at `payment-evidence/{claimId}/`
4. Check Firestore for `evidenceFileUrl` field populated
5. Verify analytics event `payment_evidence_uploaded` fired

---

## Integration with Existing Systems

### Payment Claim Flow

**Before (Phase 1):**
```
Client clicks "I Paid" 
  → Claim created with status='pending_verification'
    → Collections paused indefinitely
      → Freelancer manually verifies
```

**After (Phase 2 Task 7):**
```
Client clicks "I Paid"
  → Claim created with verificationDeadline = now + 48h
    → [OPTIONAL] Client uploads evidence
      → Collections paused for 48 hours
        → Freelancer receives 24h reminder
          → Freelancer receives 6h urgent reminder
            → If verified: Collections stop permanently
            → If rejected: Collections resume immediately
            → If 48h expires: Collections auto-resume, claim auto-rejected
```

### Escalation Integration

When deadline expires, the cron job calls `resumeEscalation()` from `jobs/collectionsEscalator.ts`:

**File: `app/api/cron/check-verification-deadlines/route.ts`**
```typescript
// Auto-resume collections after 48 hours
await resumeEscalation(
  claim.invoiceId,
  'Verification deadline expired (48 hours)'
);
```

This seamlessly integrates with Phase 2 Task 6 (Collections Escalation System).

### Email Template Requirements

**New email templates needed in SendGrid:**

1. **verification_reminder_24h** (Subject: "Reminder: Verify payment claim - Invoice #123")
   - Body: 24 hours remaining notification
   - CTA: "Review Payment Claim Now" → Dashboard link
   
2. **verification_reminder_6h** (Subject: "URGENT: Verify payment claim in 6 hours - Invoice #123")
   - Body: Urgent 6-hour warning with red color scheme
   - CTA: "Review Payment Claim Now" → Dashboard link
   
3. **claim_auto_rejected** (Subject: "Payment claim expired - Invoice #123")
   - Body: Deadline expired, collections resumed
   - CTA: "View Invoice" → Dashboard link

**Create templates:**
```bash
# Via SendGrid Dashboard → Email API → Dynamic Templates
# Use existing reminder templates as base, customize for verification context
```

---

## Testing Checklist

### Unit Tests (Manual Testing)

**Test 1: File Upload - Success Path**
1. Create payment claim
2. Drag-and-drop valid PDF file (< 10MB)
3. Verify:
   - ✅ File preview appears
   - ✅ Upload progress shows
   - ✅ Success message displays
   - ✅ File URL returned in response
   - ✅ Firestore updated with evidenceFileUrl
   - ✅ Firebase Storage contains file at correct path
   - ✅ Analytics event `payment_evidence_uploaded` fired

**Test 2: File Upload - Validation Errors**
1. Try uploading 15MB file
   - ✅ Error: "File size exceeds 10MB limit"
2. Try uploading .docx file
   - ✅ Error: "Invalid file type. Only PDF, PNG, and JPG accepted"
3. Try uploading without file selected
   - ✅ Error: "No file provided"

**Test 3: Countdown Timer - Display**
1. Create payment claim
2. Open verification modal
3. Verify:
   - ✅ Timer shows correct hours/minutes remaining
   - ✅ Green background for > 24h remaining
   - ✅ Yellow background for < 24h remaining
   - ✅ Red background for < 6h remaining
   - ✅ Progress bar width decreases as time passes
   - ✅ Updates every minute automatically

**Test 4: Countdown Timer - Expired**
1. Manually set `verificationDeadline` to past timestamp
2. Open verification modal
3. Verify:
   - ✅ "Expired" badge shows
   - ✅ Red color scheme throughout
   - ✅ Message: "Deadline expired, collections will resume"
   - ✅ onDeadlineExpired callback fires

**Test 5: Verification Modal - Confirm Action**
1. Open verification modal
2. Click "Confirm Payment" button
3. Verify:
   - ✅ Loading state shows
   - ✅ Modal closes after success
   - ✅ Invoice marked as paid
   - ✅ Collections stopped permanently
   - ✅ Analytics event fired

**Test 6: Verification Modal - Request Evidence**
1. Open modal for claim with no evidence
2. Click "Request Evidence" button
3. Verify:
   - ✅ Email sent to client requesting proof
   - ✅ Modal closes
   - ✅ Timeline shows "evidence_requested" event

**Test 7: Verification Modal - Reject with Reason**
1. Open verification modal
2. Click "Reject Claim" button
3. Select rejection reason from dropdown
4. Click "Confirm Rejection"
5. Verify:
   - ✅ Rejection form shows
   - ✅ Reason required before submit
   - ✅ Modal closes after success
   - ✅ Claim status = 'rejected'
   - ✅ Collections resume immediately
   - ✅ Email sent to client with reason
   - ✅ Analytics event fired

**Test 8: Verification Modal - Accessibility**
1. Open modal
2. Test keyboard navigation:
   - ✅ Tab moves between buttons
   - ✅ Shift+Tab moves backward
   - ✅ Focus trapped within modal
   - ✅ Escape key closes modal
   - ✅ Enter/Space activates buttons
3. Test screen reader:
   - ✅ Modal announces: "Dialog: Payment Verification"
   - ✅ Countdown timer announces time remaining
   - ✅ Button labels clear and descriptive

**Test 9: 24-Hour Reminder Email**
1. Create payment claim
2. Manually set `createdAt` to 24 hours ago
3. Manually set `reminder24hSent` to false
4. Trigger cron: `curl .../check-verification-deadlines`
5. Verify:
   - ✅ Email sent to freelancer
   - ✅ Subject: "Reminder: Verify payment claim..."
   - ✅ Body: 24 hours remaining
   - ✅ CTA link to dashboard
   - ✅ `reminder24hSent` = true in Firestore
   - ✅ Analytics event fired

**Test 10: 6-Hour Urgent Reminder**
1. Create payment claim
2. Set `createdAt` to 42 hours ago (6 hours before deadline)
3. Set `reminder6hSent` to false
4. Trigger cron
5. Verify:
   - ✅ Email sent with urgent styling (red)
   - ✅ Subject: "URGENT: Verify payment claim in 6 hours"
   - ✅ Body: Urgent warning message
   - ✅ `reminder6hSent` = true

**Test 11: Auto-Resume After 48 Hours**
1. Create payment claim
2. Set `createdAt` to 49 hours ago (deadline expired)
3. Set claim status = 'pending_verification'
4. Trigger cron
5. Verify:
   - ✅ Claim status changed to 'rejected'
   - ✅ `autoRejected` = true
   - ✅ Collections escalation resumed
   - ✅ Invoice escalationLevel updated
   - ✅ Email sent to client notifying of expiry
   - ✅ Analytics event `payment_claim_auto_rejected` fired

---

## Monitoring & Alerts

### Success Metrics (Phase 2 Gate)

**From ROLLING_ROADMAP_AND_MIGRATION_PLAN.md:**
- **Evidence upload rate:** ≥40% of payment claims include evidence
- **Verification turnaround time:** <12 hours average
- **Auto-rejection rate:** <10% of claims (most verified manually)
- **Freelancer response rate:** ≥85% verify within 48 hours

### Mixpanel Dashboards

**Verification Funnel:**
```
Payment Claims Created (100%)
  → Evidence Uploaded (40%)
    → Verified Within 24h (60%)
      → Verified Within 48h (85%)
        → Auto-Rejected (15%)
```

**Key Events to Monitor:**
- `payment_claim_submitted` (baseline)
- `payment_evidence_uploaded` (conversion from submission)
- `verification_reminder_sent` (24h and 6h split)
- `payment_claim_status_changed` (verified vs rejected split)
- `payment_claim_auto_rejected` (failure metric)

**Segmentation:**
- By evidence provided: With evidence vs Without evidence
- By claim amount: <£500, £500-£2000, >£2000
- By freelancer tenure: New (<3 months) vs Established (>3 months)

### Error Monitoring

**Sentry Alerts:**
- File upload failures (>5% upload error rate)
- Firebase Storage write errors
- Cron job failures (>2 consecutive failures)
- Email delivery failures for reminders

**Firebase Monitoring:**
- Storage quota usage (alert at 80% capacity)
- Read/write throughput spikes
- Firestore index performance

---

## Rollback Procedure

**If critical issue detected:**

### Step 1: Disable Cron Job
```bash
# Option A: Remove from vercel.json + redeploy
# Option B: Add feature flag

# In route.ts:
const VERIFICATION_CRON_ENABLED = process.env.VERIFICATION_CRON_ENABLED === 'true';
if (!VERIFICATION_CRON_ENABLED) {
  return NextResponse.json({ success: true, message: 'Verification cron disabled' });
}
```

### Step 2: Pause All Active Verifications
```typescript
// Run migration script to extend all deadlines by 7 days
const pendingClaims = await db.collection('payment_claims')
  .where('status', '==', 'pending_verification')
  .get();

for (const doc of pendingClaims.docs) {
  const deadline = doc.data().verificationDeadline.toDate();
  const newDeadline = new Date(deadline.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  await doc.ref.update({
    verificationDeadline: Timestamp.fromDate(newDeadline),
    deadlineExtended: true,
    deadlineExtensionReason: 'System issue - additional time granted'
  });
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

## Phase 2 Task 7 Completion Criteria

**Complete When:**
- ✅ All 3 UI components created (Upload, Countdown, Modal)
- ✅ Evidence upload API endpoint functional
- ✅ Verification deadline cron job running hourly
- ✅ Firebase Storage rules configured
- ✅ Firestore indexes created
- ✅ Analytics events flowing to Mixpanel
- ✅ Email templates created in SendGrid
- ✅ Documentation complete
- ✅ Manual testing checklist passed (11/11 tests)

**Ready for Task 8 (Pricing 3-Tier Rationalization) when:**
- ✅ 14 days of production data collected
- ✅ No critical verification errors
- ✅ Evidence upload rate ≥30% (baseline acceptable)
- ✅ Auto-rejection rate <15%

---

## Support & Troubleshooting

### Common Issues

**Issue 1: File upload fails with "CORS error"**
- Check: Firebase Storage CORS configured correctly
- Check: `origin` in cors.json matches actual domain
- Solution: Redeploy CORS config with `gsutil cors set cors.json gs://bucket-name`

**Issue 2: Verification reminder emails not sending**
- Check: `reminder24hSent` and `reminder6hSent` flags not already true
- Check: SendGrid templates exist with correct IDs
- Check: Cron job running (Vercel → Deployments → Cron Logs)
- Verify: `verificationDeadline` timestamp correct (48h after creation)

**Issue 3: Countdown timer not updating**
- Check: `useEffect` dependency array includes `verificationDeadline`
- Check: Browser not throttling `setInterval` when tab inactive
- Solution: Use `requestAnimationFrame` or visibility API for better accuracy

**Issue 4: Modal focus trap not working**
- Check: `modalRef` attached to dialog container
- Check: No elements with `tabindex="-1"` incorrectly applied
- Verify: `querySelectorAll` selecting all focusable elements
- Test: Tab key navigation manually in multiple browsers

**Issue 5: Auto-resume not triggering after 48 hours**
- Check: Cron job running hourly (Vercel cron logs)
- Check: `resumeEscalation()` function available from `jobs/collectionsEscalator.ts`
- Verify: Escalation state exists in Firestore
- Check: No errors in cron execution logs

### Debug Mode

**Enable verbose logging:**
```typescript
// In check-verification-deadlines/route.ts
const DEBUG_MODE = process.env.VERIFICATION_DEBUG === 'true';

if (DEBUG_MODE) {
  console.log('Claim:', claim);
  console.log('Deadline:', deadline);
  console.log('Time until deadline:', timeUntilDeadline);
  console.log('Should send 24h reminder:', !reminderSent24h && now >= twentyFourHourMark);
}
```

---

## Next Steps (Phase 2 Task 8)

**Task 8: Pricing 3-Tier Rationalization**
- Migrate from 4 tiers → 3 tiers (Starter/Growth/Pro)
- Implement annual discount toggle (20% off)
- Feature flag: `PRICING_V3_ENABLED`
- Stripe plan migration script
- User communication strategy for tier changes

---

**Document Version:** 1.0  
**Created:** November 2025  
**Phase:** 2 (Weeks 4-6)  
**Research Sources:** 
- payment_verification_guide.md
- MASTER_IMPLEMENTATION_AUDIT_V1.md §4.9

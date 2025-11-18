# Recoup Rollback Procedures

This document provides detailed procedures for rolling back deployments when issues are detected in production.

## Table of Contents

1. [When to Rollback](#when-to-rollback)
2. [Rollback Decision Tree](#rollback-decision-tree)
3. [Quick Rollback (Vercel)](#quick-rollback-vercel)
4. [Database Rollback](#database-rollback)
5. [Configuration Rollback](#configuration-rollback)
6. [Post-Rollback Actions](#post-rollback-actions)
7. [Incident Report](#incident-report)

---

## When to Rollback

### Immediate Rollback Required

Roll back **immediately** if any of the following occur:

- ✋ **Critical bug** causing data corruption
- ✋ **Payment processing failures** (>5% failure rate)
- ✋ **Authentication system down** (users cannot login)
- ✋ **Database connection failures** (>50% of requests failing)
- ✋ **Security vulnerability** discovered
- ✋ **Error rate > 10%** sustained for >5 minutes
- ✋ **Complete service outage**

### Consider Rollback

Evaluate rollback if:

- ⚠️ Error rate 5-10%
- ⚠️ Response time degraded by >50%
- ⚠️ Key feature not working correctly
- ⚠️ External API integration failing
- ⚠️ Memory leaks or resource exhaustion

### Monitor (Don't Rollback)

Continue monitoring if:

- ℹ️ Error rate < 5%
- ℹ️ Minor UI issues
- ℹ️ Non-critical feature broken
- ℹ️ Issue has workaround
- ℹ️ Fix can be deployed quickly (<30 min)

---

## Rollback Decision Tree

```
Issue Detected
     │
     ├─ Is production down? ────────────────────→ YES → Immediate Rollback
     │                                             NO ↓
     ├─ Is data being corrupted? ──────────────→ YES → Immediate Rollback
     │                                             NO ↓
     ├─ Is payment processing broken? ─────────→ YES → Immediate Rollback
     │                                             NO ↓
     ├─ Error rate > 10%? ─────────────────────→ YES → Immediate Rollback
     │                                             NO ↓
     ├─ Error rate 5-10%? ─────────────────────→ YES → Consider Rollback
     │                                             NO ↓
     ├─ Can fix be deployed in < 30 min? ──────→ YES → Deploy Fix
     │                                             NO ↓
     └─ Continue monitoring ────────────────────→ Evaluate in 15 min
```

---

## Quick Rollback (Vercel)

### Option 1: Via Vercel Dashboard (Fastest)

1. **Navigate to Vercel Dashboard**
   ```
   https://vercel.com/recoup/deployments
   ```

2. **Find Last Known Good Deployment**
   - Look for deployment marked with ✅ (successful)
   - Note the timestamp and commit SHA
   - Verify it's before the issue started

3. **Promote to Production**
   - Click on the deployment
   - Click "Promote to Production"
   - Confirm promotion

4. **Verify Rollback**
   ```bash
   curl https://recoup.app/api/health
   ```

**Estimated Time**: 2-3 minutes

---

### Option 2: Via Vercel CLI

```bash
# 1. List recent deployments
vercel ls

# Example output:
# recoup.app       ready   production  v1.0.5   12m ago
# recoup.app       ready   preview     v1.0.6   5m ago  ← Current (problematic)

# 2. Get the previous deployment URL
PREVIOUS_URL="recoup-abc123.vercel.app"

# 3. Promote previous deployment to production
vercel alias set $PREVIOUS_URL recoup.app

# 4. Verify rollback
curl https://recoup.app/api/health
```

**Estimated Time**: 3-5 minutes

---

### Option 3: Via GitHub Actions Workflow

```bash
# Trigger rollback workflow
gh workflow run rollback.yml -f environment=production

# Or manually via GitHub UI:
# Actions → Deploy → Run workflow → Select "rollback"
```

**Estimated Time**: 5-7 minutes

---

## Database Rollback

### Firestore Rollback Strategy

Since Firestore doesn't support traditional rollbacks, we use:

1. **Point-in-Time Recovery** (if available)
2. **Migration Rollback Scripts**
3. **Manual Data Restoration**

### Option 1: Rollback Migration

If rollback is due to a data migration:

```bash
# 1. SSH into server or run locally
cd relay/scripts/migrations

# 2. Run rollback script
npm run migrate:rollback -- --version=v003

# 3. Verify rollback
npm run migrate:list
```

### Option 2: Restore from Backup

```bash
# 1. Access Firebase Console
open https://console.firebase.google.com/project/recoup-production/firestore

# 2. Navigate to Backups

# 3. Select backup from before deployment
# Backups are taken daily at 2 AM UTC

# 4. Restore to new collection first (test restore)
# Collection: users_backup_20240115

# 5. Verify data integrity

# 6. If verified, restore to production collection
```

**⚠️ WARNING**: Database restores can take 15-60 minutes depending on data size.

### Option 3: Manual Data Fix

For small data corruption:

```typescript
// scripts/fix-data-corruption.ts
import { db } from './lib/firebase'

async function fixCorruptedData() {
  const snapshot = await db.collection('users')
    .where('corruptedField', '!=', null)
    .get()

  for (const doc of snapshot.docs) {
    await doc.ref.update({
      corruptedField: null,
      // Restore correct values
    })
  }
}

fixCorruptedData()
```

---

## Configuration Rollback

### Environment Variables

If rollback is due to configuration change:

```bash
# 1. View current environment variables
vercel env ls production

# 2. Remove problematic variable
vercel env rm PROBLEMATIC_VAR production

# 3. Re-add with previous value
vercel env add PROBLEMATIC_VAR production
# Enter previous value when prompted

# 4. Redeploy to apply changes
vercel --prod
```

### Feature Flags

```typescript
// If issue caused by feature flag, disable it:

// lib/featureFlags.ts
export const FEATURE_FLAGS = {
  AI_VOICE_CALLS: false, // ← Disable problematic feature
  PHYSICAL_LETTERS: true,
  // ...
}

// Commit and deploy
git commit -m "fix: disable problematic feature flag"
git push origin main
```

---

## Post-Rollback Actions

### 1. Immediate Actions (0-15 minutes)

- [ ] **Verify Rollback Success**
  ```bash
  # Health check
  curl https://recoup.app/api/health

  # Check error rate in Sentry
  open https://sentry.io/organizations/recoup/issues/

  # Verify critical functionality
  npm run test:e2e:production
  ```

- [ ] **Notify Team**
  ```
  Post in #engineering Slack channel:

  🚨 PRODUCTION ROLLBACK COMPLETED 🚨

  Issue: [Brief description]
  Rolled back to: [deployment URL]
  Current status: [Stable/Monitoring]
  Incident lead: [Name]
  ```

- [ ] **Update Status Page**
  ```
  https://status.recoup.app

  Update with:
  - Issue detected at [time]
  - Rollback completed at [time]
  - Service is now stable
  - Investigating root cause
  ```

### 2. Short-term Actions (15 minutes - 2 hours)

- [ ] **Root Cause Analysis**
  - Review code changes
  - Check deployment logs
  - Analyze error patterns in Sentry
  - Review database queries
  - Check external service status

- [ ] **Document Incident**
  - Create incident report (see template below)
  - Log in incident tracking system
  - Tag affected deployments

- [ ] **Communication**
  - Email affected customers (if applicable)
  - Post mortem summary for leadership

### 3. Follow-up Actions (2-24 hours)

- [ ] **Fix Root Cause**
  - Create bug fix branch
  - Write regression test
  - Test on staging
  - Deploy fix when ready

- [ ] **Review Monitoring**
  - Add alerting for similar issues
  - Update runbook with learnings
  - Improve health checks

- [ ] **Process Improvements**
  - Update deployment checklist
  - Enhance automated tests
  - Add canary deployment if needed

---

## Incident Report

Use this template after each rollback:

```markdown
# Incident Report: [Brief Title]

## Summary
- **Date**: 2024-01-15
- **Duration**: 10:15 AM - 10:45 AM UTC (30 minutes)
- **Severity**: Critical / High / Medium
- **Impact**: [Description of user impact]

## Timeline
- 10:15 - Issue detected (elevated error rate in Sentry)
- 10:18 - Incident declared, team alerted
- 10:20 - Decision made to rollback
- 10:25 - Rollback initiated via Vercel dashboard
- 10:30 - Rollback completed
- 10:35 - Services verified stable
- 10:45 - Incident resolved

## Root Cause
[Detailed explanation of what went wrong]

## Detection
- **How detected**: Sentry alert + user reports
- **Time to detection**: 3 minutes
- **Time to resolution**: 30 minutes

## Impact
- **Users affected**: ~500 users
- **Revenue impact**: $0 (no payment failures)
- **Data integrity**: No data lost

## Resolution
1. Rolled back to deployment [sha]
2. [Additional steps taken]

## Prevention
- [ ] Add test for edge case that caused issue
- [ ] Improve monitoring for [specific metric]
- [ ] Update deployment checklist with [specific check]

## Action Items
- [ ] Deploy fix (assigned to: [name], due: [date])
- [ ] Improve test coverage (assigned to: [name], due: [date])
- [ ] Update documentation (assigned to: [name], due: [date])

## Lessons Learned
1. [Key learning 1]
2. [Key learning 2]
```

---

## Rollback Testing

**Quarterly Rollback Drill**

Practice rollback procedures every quarter:

```bash
# 1. Schedule maintenance window
# Notify team 1 week in advance

# 2. Deploy test change to production

# 3. Practice rollback procedure

# 4. Measure time to rollback

# 5. Document issues encountered

# 6. Update runbook
```

---

## Emergency Contacts

### On-Call Rotation

- **Primary**: Check PagerDuty schedule
- **Secondary**: Check PagerDuty schedule
- **Escalation**: CTO

### External Vendor Support

- **Vercel Support**: support@vercel.com
- **Firebase Support**: https://firebase.google.com/support
- **Stripe Support**: support@stripe.com (Premium tier)

---

## Rollback Success Criteria

A rollback is considered successful when:

- ✅ Error rate < 1%
- ✅ Response time back to normal (p95 < 1s)
- ✅ Health checks passing
- ✅ Critical user journeys working
- ✅ No new errors in Sentry
- ✅ Database queries performing normally

---

## Prevention Strategies

To reduce need for rollbacks:

1. **Automated Testing**: Maintain >80% test coverage
2. **Staging Environment**: Always test on staging first
3. **Gradual Rollouts**: Consider canary deployments
4. **Feature Flags**: Use flags for risky features
5. **Monitoring**: Robust alerting and monitoring
6. **Code Review**: Require 2+ approvals for production
7. **Deployment Windows**: Deploy during low-traffic periods

---

**Last Updated**: 2024-01-15
**Document Owner**: DevOps Team
**Review Cycle**: After each rollback + quarterly

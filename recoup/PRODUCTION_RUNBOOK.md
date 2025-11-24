# Recoup Production Runbook

**Last Updated**: January 2025
**Version**: 1.0
**Audience**: DevOps, SRE, Production Support

---

## 🚨 Emergency Contacts

### On-Call Rotation
- **Primary**: [Your Name] - [Phone]
- **Secondary**: [Backup Name] - [Phone]
- **Escalation**: [Manager Name] - [Phone]

### External Support
- **Vercel Support**: support@vercel.com
- **Render Support**: https://render.com/support
- **Stripe Support**: https://support.stripe.com
- **Twilio Support**: https://support.twilio.com
- **Firebase Support**: https://firebase.google.com/support

---

## 📊 System Architecture

### Production Deployment

```
┌─────────────────┐
│   Cloudflare    │ → CDN & DDoS Protection
│     (DNS)       │
└────────┬────────┘
         │
┌────────▼────────┐
│  Vercel (EU)    │ → Next.js Frontend
│  app.recoup.com │
└────────┬────────┘
         │
┌────────▼─────────────────┐
│ Render.com (Frankfurt)   │ → Python FastAPI Backend
│ recoup-backend.onrender  │
└────┬─────────────────────┘
     │
     ├──→ Firebase Firestore (EU) → Database
     ├──→ Upstash Redis (EU)      → Cache/Rate Limiting
     ├──→ Stripe (EU)              → Payments
     ├──→ Twilio (EU)              → SMS/Voice
     ├──→ SendGrid (EU)            → Email
     └──→ HMRC API (UK)            → Tax Integration
```

### Service URLs

| Service | Production URL | Status Page |
|---------|---------------|-------------|
| Frontend | https://app.recoup.com | https://vercel-status.com |
| Backend API | https://recoup-backend.onrender.com | https://renderstatus.com |
| Firebase | Console: https://console.firebase.google.com | https://status.firebase.google.com |
| Stripe | Dashboard: https://dashboard.stripe.com | https://status.stripe.com |
| Upstash | Console: https://console.upstash.com | https://status.upstash.com |

---

## 🔐 Production Credentials

### Environment Variables Checklist

**Vercel (Frontend):**
```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=recoup-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@recoup-prod.iam.gserviceaccount.com
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PYTHON_BACKEND_URL=https://recoup-backend.onrender.com
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=recoup
SENTRY_PROJECT=recoup-prod
```

**Render (Backend):**
```bash
REDIS_URL=redis://default:...@upstash-redis-eu.upstash.io:6379
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+44...
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@recoup.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIREBASE_PROJECT_ID=recoup-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@recoup-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
HMRC_CLIENT_ID=[Production Client ID]
HMRC_CLIENT_SECRET=[Production Client Secret]
HMRC_ENV=production
API_BASE_URL=https://app.recoup.com
PAYMENT_BASE_URL=https://pay.recoup.com
COMPANY_NAME=Recoup
```

### HMRC Production Setup

**CRITICAL**: Ensure HMRC uses production credentials, not test/sandbox.

1. **Register for Production HMRC API**:
   - Visit: https://developer.service.hmrc.gov.uk/
   - Create production application
   - Request OAuth 2.0 credentials
   - Set redirect URI: `https://app.recoup.com/api/hmrc/callback`

2. **Validate Credentials**:
   ```bash
   # Production credentials should NOT contain:
   # - "test"
   # - "sandbox"
   # - "demo"

   # Check environment:
   echo $HMRC_ENV  # Must be "production"
   ```

3. **Test HMRC Integration**:
   ```bash
   curl -X GET https://app.recoup.com/api/hmrc/health
   # Should return: {"status": "healthy", "env": "production"}
   ```

---

## 🔍 Monitoring & Alerting

### Health Checks

**Frontend Health**:
```bash
curl https://app.recoup.com/api/health
# Expected: {"status": "healthy"}
```

**Backend Health**:
```bash
curl https://recoup-backend.onrender.com/health
# Expected: {"status": "healthy", "services": {"redis": true, "stripe": true}}
```

### Key Metrics to Monitor

| Metric | Threshold | Alert Level | Action |
|--------|-----------|-------------|--------|
| API Response Time (p95) | > 500ms | Warning | Check Render logs, scale workers |
| API Error Rate | > 1% | Critical | Check Sentry, investigate logs |
| Stripe Webhook Failures | > 5% | Critical | Check webhook signatures, retry jobs |
| Redis Connection Errors | > 0 | Critical | Check Upstash status, restart service |
| Firebase Read/Write Errors | > 1% | Warning | Check Firebase quotas and rules |
| Cron Job Failures | > 1 failure | Warning | Check Vercel cron logs |
| AI Call Cost (daily) | > £100 | Warning | Review AI call volume, adjust limits |

### Sentry Error Tracking

**Dashboard**: https://sentry.io/organizations/recoup/projects/recoup-prod/

**Key Error Categories**:
1. Payment Processing Errors
2. Collections Automation Failures
3. HMRC API Integration Errors
4. Email/SMS Delivery Failures
5. Authentication Issues

---

## 🚨 Incident Response Procedures

### Severity Levels

**P1 - Critical (Response: Immediate)**
- Complete service outage
- Payment processing down
- Data loss or security breach
- HMRC integration failure affecting tax submissions

**P2 - High (Response: 30 minutes)**
- Partial service degradation
- Email/SMS delivery failures
- Collections automation not running
- Stripe webhooks failing

**P3 - Medium (Response: 2 hours)**
- Non-critical feature issues
- UI bugs not blocking workflows
- Performance degradation (< 2x normal)

**P4 - Low (Response: Next business day)**
- Minor UI issues
- Documentation updates
- Feature requests

### Incident Response Steps

1. **Acknowledge**:
   ```bash
   # Post in #incidents Slack channel
   "🚨 INCIDENT: [Brief description]"
   "Status: Investigating"
   "Owner: [Your name]"
   ```

2. **Assess**:
   - Check status pages (Vercel, Render, Firebase, Stripe)
   - Review Sentry errors (last 15 minutes)
   - Check monitoring dashboards
   - Verify recent deployments

3. **Mitigate**:
   - If recent deployment: Roll back immediately
   - If external service: Wait for status page updates
   - If Redis: Restart Render service
   - If Stripe: Check webhook endpoint health

4. **Communicate**:
   ```bash
   # Update every 15 minutes
   "📊 UPDATE: [What you found]"
   "⏰ ETA: [When resolved]"
   "🔧 Actions: [What you're doing]"
   ```

5. **Resolve**:
   - Verify health checks pass
   - Test affected workflows
   - Monitor for 15 minutes
   - Close incident

6. **Post-Mortem**:
   - Write incident report (template below)
   - Identify root cause
   - Create prevention tasks
   - Schedule team review

---

## 🔄 Common Operations

### Deploy New Version

**Frontend (Vercel)**:
```bash
cd recoup
git checkout main
git pull origin main
vercel --prod
# Auto-deploys on push to main branch
```

**Backend (Render)**:
```bash
# Automatically deploys on push to main
# Manual deploy via Render dashboard:
# 1. Go to https://dashboard.render.com
# 2. Select "recoup-python-backend"
# 3. Click "Manual Deploy" → "Deploy latest commit"
```

### Rollback Deployment

**Frontend (Vercel)**:
```bash
# Via Vercel Dashboard:
# 1. Go to https://vercel.com/your-team/recoup
# 2. Go to Deployments
# 3. Find last working deployment
# 4. Click "..." → "Promote to Production"
```

**Backend (Render)**:
```bash
# Via Render Dashboard:
# 1. Go to https://dashboard.render.com
# 2. Select "recoup-python-backend"
# 3. Go to Events tab
# 4. Find last working deploy
# 5. Click "Redeploy"
```

### Scale Services

**Frontend (Vercel)**:
- Automatically scales (serverless)
- Check quotas: https://vercel.com/your-team/settings/usage

**Backend (Render)**:
```bash
# Via render.yaml - edit and redeploy:
plan: starter  # Change to: standard, pro, or enterprise

# Or via Dashboard:
# 1. Go to service settings
# 2. Click "Change Instance Type"
# 3. Select new plan
```

### Restart Services

**Backend (Render)**:
```bash
# Via Dashboard:
# 1. Go to https://dashboard.render.com
# 2. Select "recoup-python-backend"
# 3. Click "Manual Deploy" → "Clear build cache & deploy"

# Via CLI:
render services restart recoup-python-backend
```

### Check Logs

**Frontend (Vercel)**:
```bash
# Real-time logs:
vercel logs --follow

# Via Dashboard:
# https://vercel.com/your-team/recoup/logs
```

**Backend (Render)**:
```bash
# Via Dashboard:
# https://dashboard.render.com → Service → Logs tab

# Download logs:
render logs recoup-python-backend --tail 1000 > logs.txt
```

**Sentry Errors**:
```bash
# https://sentry.io/organizations/recoup/issues/
# Filter by:
# - Environment: production
# - Time range: Last 24 hours
# - Severity: Error or Fatal
```

### Database Operations

**Firestore Backup**:
```bash
# Automated daily backups configured
# Manual backup:
gcloud firestore export gs://recoup-prod-backups/$(date +%Y%m%d)

# Restore from backup:
gcloud firestore import gs://recoup-prod-backups/YYYYMMDD
```

**Redis Operations**:
```bash
# Connect to Redis (via Upstash dashboard or CLI):
redis-cli -h upstash-redis-eu.upstash.io -p 6379 -a $REDIS_PASSWORD

# Clear rate limit for user (emergency):
redis-cli DEL "rate_limit:user_123:daily"

# View current keys:
redis-cli KEYS "*"

# Check Redis health:
redis-cli PING  # Should return "PONG"
```

---

## 📅 Scheduled Maintenance

### Cron Jobs

| Job | Schedule | Purpose | Verification |
|-----|----------|---------|--------------|
| Collections Escalator | Every 4 hours | Escalate overdue invoices | Check Firestore `collections` table |
| Payment Verification | Daily 2 AM UTC | Resume failed payments | Check Vercel cron logs |
| Webhook Retry | Every 15 min | Retry failed webhooks | Check `webhook_queue` table |
| Analytics Aggregation | Daily 3 AM UTC | Calculate metrics | Check `analytics` collection |
| Invoice Reminders | Daily 9 AM UTC | Send payment reminders | Check email logs |

**Check Cron Status**:
```bash
# Vercel Dashboard → Project → Cron Jobs
# https://vercel.com/your-team/recoup/settings/cron

# Check last run:
curl https://app.recoup.com/api/cron/status
```

### Maintenance Windows

**Scheduled Maintenance**: First Sunday of each month, 2-4 AM UTC

**Pre-Maintenance Checklist**:
- [ ] Announce maintenance 48 hours in advance
- [ ] Create Firestore backup
- [ ] Export Redis data
- [ ] Test rollback procedure
- [ ] Prepare monitoring dashboards

**Post-Maintenance Checklist**:
- [ ] Verify all health checks pass
- [ ] Test payment processing
- [ ] Test email/SMS delivery
- [ ] Monitor error rates for 1 hour
- [ ] Send all-clear notification

---

## 🐛 Troubleshooting Guide

### "Payment processing failed"

**Symptoms**: Users report failed payments, Stripe webhooks not processing

**Diagnosis**:
```bash
# Check Stripe webhook status
curl https://app.recoup.com/api/webhooks/stripe/test
# Check Stripe dashboard: https://dashboard.stripe.com/webhooks
```

**Resolution**:
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check webhook endpoint is reachable
3. Review Stripe webhook logs for errors
4. Manually retry failed webhooks via Stripe dashboard

### "Collections not running"

**Symptoms**: Overdue invoices not escalating, no reminders sent

**Diagnosis**:
```bash
# Check cron job logs
curl https://app.recoup.com/api/cron/collections-escalator/status

# Check Firestore for recent collections
# Should see documents with status "pending" → "sent"
```

**Resolution**:
1. Verify cron job is running (Vercel dashboard)
2. Check rate limits not exceeded (Redis)
3. Verify email/SMS credentials (SendGrid, Twilio)
4. Manually trigger job: `POST /api/cron/collections-escalator`

### "HMRC integration broken"

**Symptoms**: Tax calculations failing, MTD submissions not working

**Diagnosis**:
```bash
# Check HMRC credentials
curl https://app.recoup.com/api/hmrc/health

# Verify environment
echo $HMRC_ENV  # Must be "production"
```

**Resolution**:
1. Verify HMRC_CLIENT_ID and HMRC_CLIENT_SECRET
2. Check HMRC_ENV is "production" not "test"
3. Refresh OAuth token: `POST /api/hmrc/refresh-token`
4. Check HMRC API status: https://api.service.hmrc.gov.uk/api-status

### "High memory usage"

**Symptoms**: Render service restarting, slow response times

**Diagnosis**:
```bash
# Check Render metrics
# Dashboard → Service → Metrics tab

# Check Redis memory
redis-cli INFO memory
```

**Resolution**:
1. Restart Render service (clears memory)
2. Scale to larger instance type
3. Review code for memory leaks (Sentry)
4. Clear old Redis keys: `redis-cli FLUSHDB`

### "Email/SMS not sending"

**Symptoms**: Users not receiving notifications

**Diagnosis**:
```bash
# Check SendGrid API key
curl -H "Authorization: Bearer $SENDGRID_API_KEY" \
  https://api.sendgrid.com/v3/user/account

# Check Twilio credentials
curl -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json
```

**Resolution**:
1. Verify API keys are active
2. Check account balance (Twilio, SendGrid)
3. Review rate limits (daily SMS/email quotas)
4. Check email/SMS logs in respective dashboards

---

## 📈 Performance Optimization

### Response Time Targets

| Endpoint | Target (p95) | Max Acceptable |
|----------|--------------|----------------|
| GET /api/invoices | 200ms | 500ms |
| POST /api/invoices | 300ms | 800ms |
| GET /api/analytics | 400ms | 1000ms |
| POST /api/collections/escalate | 500ms | 1500ms |
| AI voice call | 2000ms | 5000ms |

### Caching Strategy

**Redis Cache Keys**:
- `user_tier:{user_id}` → TTL: 5 minutes
- `rate_limit:{user_id}:{period}` → TTL: varies
- `analytics:{user_id}:{date}` → TTL: 24 hours
- `idempotency:{webhook_id}` → TTL: 48 hours

**Cache Invalidation**:
```bash
# Clear user tier cache after upgrade
redis-cli DEL "user_tier:{user_id}"

# Clear rate limits (emergency)
redis-cli KEYS "rate_limit:*" | xargs redis-cli DEL

# Clear analytics cache after recalculation
redis-cli KEYS "analytics:*" | xargs redis-cli DEL
```

---

## 📝 Incident Report Template

```markdown
# Incident Report: [Brief Title]

**Date**: YYYY-MM-DD
**Severity**: P1/P2/P3/P4
**Duration**: HH:MM (start - end)
**Owner**: [Your Name]

## Summary
[1-2 sentence summary of what happened]

## Impact
- **Users Affected**: [Number or percentage]
- **Revenue Impact**: [Estimated loss]
- **Services Affected**: [Frontend/Backend/Payments/etc.]

## Timeline
- **HH:MM** - First alert received
- **HH:MM** - Investigation started
- **HH:MM** - Root cause identified
- **HH:MM** - Mitigation applied
- **HH:MM** - Service restored
- **HH:MM** - Incident closed

## Root Cause
[Detailed explanation of what caused the incident]

## Resolution
[What was done to fix the issue]

## Prevention
[Action items to prevent recurrence]
- [ ] Task 1: [Description] - Owner: [Name] - Due: [Date]
- [ ] Task 2: [Description] - Owner: [Name] - Due: [Date]

## Lessons Learned
[Key takeaways from this incident]
```

---

## 🔗 Useful Links

- **Production App**: https://app.recoup.com
- **Vercel Dashboard**: https://vercel.com/your-team/recoup
- **Render Dashboard**: https://dashboard.render.com
- **Firebase Console**: https://console.firebase.google.com/project/recoup-prod
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Sentry Errors**: https://sentry.io/organizations/recoup
- **Upstash Redis**: https://console.upstash.com
- **HMRC Developer Hub**: https://developer.service.hmrc.gov.uk

---

**Document Owner**: DevOps Team
**Review Frequency**: Monthly
**Next Review Date**: [First day of next month]

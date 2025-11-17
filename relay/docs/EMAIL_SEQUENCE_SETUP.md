# Email Sequence System Setup Guide

This guide walks through setting up the automated Day 5/15/30 email reminder system.

## Overview

The email sequence system automatically sends professionally-crafted reminder emails to clients when invoices become overdue:

- **Day 5:** Friendly reminder with gentle tone
- **Day 15:** Firm reminder with 7-day deadline
- **Day 30:** Legal final notice with interest calculation and CCJ warning

## Architecture

```
Hourly Cron → Worker → SendGrid → Client Inbox
                ↓
         emailEvents (Firestore)
                ↓
         Analytics (Mixpanel)
                ↓
         Webhook ← SendGrid (delivery tracking)
```

## Prerequisites

1. **SendGrid Account:** Sign up at https://sendgrid.com
2. **Verified Sender:** Verify your sending email in SendGrid
3. **API Key:** Create API key with full "Mail Send" permissions
4. **Firestore:** emailEvents collection created with indexes
5. **Vercel:** Cron jobs enabled (Hobby plan or higher)

## Step 1: SendGrid Configuration

### 1.1 Create API Key

1. Go to https://app.sendgrid.com/settings/api_keys
2. Click "Create API Key"
3. Name: "Relay Production"
4. Permissions: "Full Access" or "Mail Send" (full access)
5. Copy the API key (starts with `SG.`)

### 1.2 Verify Sender Identity

1. Go to https://app.sendgrid.com/settings/sender_auth
2. Click "Verify a Single Sender"
3. Enter your business details:
   - From Name: "Relay" (or your business name)
   - From Email: noreply@yourdomain.com
   - Reply To: support@yourdomain.com
4. Check your email and click verification link
5. Wait for verification (usually instant)

### 1.3 Configure Event Webhook

1. Go to https://app.sendgrid.com/settings/mail_settings
2. Find "Event Webhook" and click "Edit"
3. Enable webhook
4. Set HTTP POST URL: `https://yourdomain.com/api/webhook/sendgrid`
5. Select events to track:
   - ✅ Delivered
   - ✅ Bounced
   - ✅ Dropped
   - ✅ Deferred
   - ⬜ Opened (optional - privacy considerations)
   - ⬜ Clicked (optional)
   - ⬜ Spam Reports (optional)
6. Save configuration

### 1.4 Generate Webhook Signature Key (Recommended)

For production security:

1. In webhook settings, scroll to "Signed Event Webhook"
2. Click "Enable Signed Event Webhook"
3. Copy the Public Key (starts with `-----BEGIN PUBLIC KEY-----`)
4. Save this for environment variables

## Step 2: Environment Variables

Add these to your Vercel project or `.env.local`:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Relay

# SendGrid Webhook Verification (optional but recommended for production)
SENDGRID_WEBHOOK_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----"

# Cron Job Security (generate random secret)
CRON_SECRET=<random_64_char_string>

# App URL for payment links
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Generate CRON_SECRET

```bash
# On Mac/Linux
openssl rand -base64 48

# On Windows PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Step 3: Firestore Setup

### 3.1 Create emailEvents Collection

The collection is automatically created on first write, but you need to set up indexes.

### 3.2 Create Composite Indexes

Go to Firebase Console → Firestore → Indexes → Composite tab

**Index 1:** For checking if reminder sent
- Collection: `emailEvents`
- Fields:
  * `invoiceId` (Ascending)
  * `level` (Ascending)
  * `deliveryStatus` (Ascending)

**Index 2:** For email history queries
- Collection: `emailEvents`
- Fields:
  * `invoiceId` (Ascending)
  * `sentAt` (Descending)

## Step 4: Deployment

### 4.1 Deploy Code

```bash
# Ensure vercel.json includes cron config
git add .
git commit -m "Add email sequence system"
git push origin main

# Vercel will auto-deploy
```

### 4.2 Verify Cron Configuration

1. Go to Vercel Dashboard → Your Project
2. Click "Cron Jobs" tab
3. Verify you see:
   ```
   /api/cron/process-email-sequence
   Schedule: 0 * * * * (hourly)
   ```

### 4.3 Set Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add all variables from Step 2
3. Set for: Production, Preview, Development (as needed)
4. Redeploy to apply changes

## Step 5: Testing

### 5.1 Test Manual Send (Development)

```bash
# Create test invoice with overdue date
# Then trigger manual send

curl -X POST http://localhost:3000/api/collections/send-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "test_inv_123",
    "level": "day5"
  }'

# Expected response:
# { "success": true, "messageId": "xxxxx" }
```

### 5.2 Test Cron Worker (Development)

```bash
# Set CRON_SECRET in .env.local
# Then trigger cron endpoint

curl -X GET http://localhost:3000/api/cron/process-email-sequence \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
# {
#   "success": true,
#   "processed": 3,
#   "sent": 1,
#   "skipped": 2,
#   "failed": 0
# }
```

### 5.3 Test SendGrid Webhook (Development)

Use SendGrid's webhook testing tool or ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start local dev server
npm run dev

# In another terminal, tunnel to localhost
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Go to SendGrid webhook settings
# Set URL: https://abc123.ngrok.io/api/webhook/sendgrid
# Send a test email via manual send
# Check terminal logs for webhook events
```

### 5.4 Test Email History

```bash
curl -X GET http://localhost:3000/api/invoices/test_inv_123/email-history

# Expected response:
# {
#   "invoiceId": "test_inv_123",
#   "emailHistory": [
#     {
#       "level": "day5",
#       "sentAt": "2025-11-16T10:00:00Z",
#       "deliveryStatus": "delivered",
#       "metadata": { ... }
#     }
#   ],
#   "total": 1
# }
```

## Step 6: Monitoring

### 6.1 Check Cron Job Logs

1. Go to Vercel Dashboard → Deployments
2. Click latest deployment
3. Click "Functions" tab
4. Find `/api/cron/process-email-sequence`
5. View logs for each hourly execution

### 6.2 Check SendGrid Activity

1. Go to https://app.sendgrid.com/activity
2. Filter by:
   - Date range
   - Status (delivered, bounced, etc.)
   - To email address
3. View delivery details and bounce reasons

### 6.3 Check Firestore Data

```javascript
// In Firebase Console
// Navigate to emailEvents collection
// Query by invoiceId to see history

// Example query
db.collection('emailEvents')
  .where('invoiceId', '==', 'inv_123')
  .orderBy('sentAt', 'desc')
  .get()
```

### 6.4 Check Analytics Events

In Mixpanel (or your analytics platform):

- **email_sent:** All sent reminders
- **email_delivered:** Successful deliveries
- **email_failed:** Bounces and failures

Filter by `reminder_level` property to see Day 5/15/30 breakdown.

## Troubleshooting

### Issue: Emails not sending

**Check:**
1. SENDGRID_API_KEY is correct and not expired
2. Sender email is verified in SendGrid
3. Invoice has valid clientEmail field
4. Invoice status is 'sent' or 'overdue'
5. dueDate is in the past (≥5 days ago)
6. Check Vercel function logs for errors

### Issue: Duplicate emails sending

**Check:**
1. Firestore composite index is created
2. hasReminderBeenSent() query is working
3. No race condition from multiple cron triggers
4. deliveryStatus values are correct in emailEvents

### Issue: Webhook not receiving events

**Check:**
1. Webhook URL is correct (https, not http)
2. Endpoint is publicly accessible (not localhost)
3. SendGrid event types are selected
4. Check Vercel function logs for incoming requests
5. Test with SendGrid's "Test Your Integration" button

### Issue: Signature verification failing

**Check:**
1. SENDGRID_WEBHOOK_PUBLIC_KEY matches SendGrid dashboard
2. Key includes `-----BEGIN PUBLIC KEY-----` headers
3. Newlines are preserved in environment variable
4. Try temporarily disabling verification for testing

### Issue: Cron not triggering

**Check:**
1. vercel.json is committed to git
2. Cron schedule syntax is correct (`0 * * * *`)
3. Project is on Hobby plan or higher (not Free)
4. Check Vercel → Cron Jobs tab for status
5. Look for red error indicators

## Performance Considerations

### Batch Size

The worker processes ALL overdue invoices on each run. For large volumes:

```typescript
// Modify emailSequenceWorker.ts
// Add batch processing with cursor pagination

const BATCH_SIZE = 100;

async function runEmailSequenceWorkerBatch(startAfter?: string) {
  let query = invoicesRef
    .where('status', 'in', ['sent', 'overdue'])
    .where('dueDate', '<', new Date())
    .limit(BATCH_SIZE);
  
  if (startAfter) {
    query = query.startAfter(startAfter);
  }
  
  // Process batch...
}
```

### Rate Limiting

SendGrid free tier: 100 emails/day
Paid tiers: Much higher

If hitting rate limits:
1. Upgrade SendGrid plan
2. Add queue system (Bull, BullMQ)
3. Spread sends across multiple hours
4. Prioritize high-value invoices first

### Cost Optimization

- **SendGrid:** $15/mo for 40k emails (Essentials plan)
- **Vercel:** Cron included in Hobby ($20/mo) and Pro ($20/mo)
- **Firestore:** Free tier covers ~50k reads/day
- **Mixpanel:** Free tier covers 100k events/mo

## Security Best Practices

1. **Never log API keys** - Use logger.info, not console.log
2. **Verify webhook signatures** - Prevents spoofed events
3. **Authenticate cron endpoints** - Use CRON_SECRET bearer token
4. **Validate user ownership** - Check invoice.userId in manual sends
5. **Sanitize email content** - Prevent XSS in template variables
6. **Rate limit manual sends** - Prevent abuse of manual trigger API

## Maintenance

### Daily
- Monitor cron job logs for errors
- Check SendGrid activity for bounce patterns

### Weekly
- Review emailEvents collection size (consider retention policy)
- Analyze analytics: which reminder level performs best?
- Check delivery rates (aim for >95% delivered)

### Monthly
- Review SendGrid usage and costs
- Update email templates based on response data
- Optimize trigger timing if needed
- Clean up old emailEvents (older than 90 days)

## Next Steps

After setup is complete:

1. **Phase 1.5:** Add UI components in dashboard
   - Display email history on invoice detail page
   - Add manual send button with confirmation dialog
   - Show delivery status badges (sent/delivered/bounced)

2. **Phase 2:** Enhance tracking
   - Add open rate monitoring (if enabled)
   - Track click-through rates on payment links
   - A/B test email subject lines
   - Optimize send timing based on time zones

3. **Phase 3:** Advanced features
   - Custom email templates per user
   - Multi-language support
   - SMS fallback for high-value invoices
   - AI-powered send time optimization

## Support

- **SendGrid Docs:** https://docs.sendgrid.com
- **Vercel Cron Docs:** https://vercel.com/docs/cron-jobs
- **Firebase Docs:** https://firebase.google.com/docs/firestore

For Relay-specific issues, check internal documentation or team Slack.

---

**Last Updated:** November 16, 2025
**Version:** 1.0
**Status:** Production Ready ✅

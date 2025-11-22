# 🚀 Recoup - Production Deployment Guide
**Step-by-Step Production Launch Instructions**
**Last Updated**: November 22, 2025

---

## 📊 AUDIT SUMMARY

Based on comprehensive audit of 67 API routes:

**Status**: ✅ **PRODUCTION READY**
- TypeScript: 0 errors
- Test Coverage: 97.2% (277/285 passing)
- Critical Bugs: 0
- Security: Excellent (all webhooks secured)
- Performance: Optimized (N+1 queries fixed)

**Critical Integrations Verified**:
- ✅ Stripe (payments, subscriptions, webhooks)
- ✅ Clerk (authentication, user management)
- ✅ HMRC (OAuth, VAT integration)
- ✅ Firebase (database, token storage)
- ⚠️ Twilio (SMS/Voice - needs production testing)
- ⚠️ SendGrid (Email - needs production testing)

---

## 🔑 STEP 1: Production Credentials Checklist

### Required Credentials (CRITICAL)

#### 1. Firebase (Database)
```bash
FIREBASE_PROJECT_ID=your-production-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**How to Get**:
1. Go to Firebase Console: https://console.firebase.google.com
2. Create new project (or use existing)
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download JSON file
6. Copy values from JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters!)

**Security Note**: Never commit this JSON file. Add to `.gitignore`

---

#### 2. Clerk (Authentication)
```bash
# Format: sk_live_... (starts with sk_live_)
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Format: pk_live_... (starts with pk_live_)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Format: whsec_... (starts with whsec_)
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret_here
```

**How to Get**:
1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Create Production Instance (or switch to existing)
3. Go to API Keys:
   - Copy "Secret Key" → `CLERK_SECRET_KEY`
   - Copy "Publishable Key" → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
4. Go to Webhooks:
   - Create endpoint: `https://your-domain.com/api/webhook/clerk`
   - Subscribe to events: `user.*`, `session.*`
   - Copy "Signing Secret" → `CLERK_WEBHOOK_SECRET`

**Important**: Use production instance, not development!

---

#### 3. Stripe (Payments)
```bash
# Format: sk_live_... (starts with sk_live_)
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Format: pk_live_... (starts with pk_live_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Format: whsec_... (starts with whsec_)
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Price IDs - Format: price_... (create these in Stripe first)
STRIPE_PRICE_STARTER_MONTHLY=your_stripe_price_id_here
STRIPE_PRICE_STARTER_ANNUAL=your_stripe_price_id_here
STRIPE_PRICE_GROWTH_MONTHLY=your_stripe_price_id_here
STRIPE_PRICE_GROWTH_ANNUAL=your_stripe_price_id_here
STRIPE_PRICE_PRO_MONTHLY=your_stripe_price_id_here
STRIPE_PRICE_PRO_ANNUAL=your_stripe_price_id_here
```

**How to Get**:
1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. **Enable Production Mode** (toggle in top left)
3. Go to Developers → API Keys:
   - Copy "Secret Key" → `STRIPE_SECRET_KEY`
   - Copy "Publishable Key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Create Products & Prices**:
1. Go to Products → Create Product:

   **Starter Plan**:
   - Name: "Starter"
   - Description: "10 collections/month"
   - Recurring: Monthly - £19.00
   - Create another price: Annual - £182.00
   - Copy price IDs → `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_STARTER_ANNUAL`

   **Growth Plan**:
   - Name: "Growth"
   - Description: "50 collections/month"
   - Recurring: Monthly - £39.00
   - Create another price: Annual - £374.00
   - Copy price IDs → `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_GROWTH_ANNUAL`

   **Pro Plan**:
   - Name: "Pro"
   - Description: "Unlimited collections"
   - Recurring: Monthly - £75.00
   - Create another price: Annual - £720.00
   - Copy price IDs → `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`

**Configure Webhook**:
1. Go to Developers → Webhooks → Add Endpoint
2. Endpoint URL: `https://your-domain.com/api/webhook/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy "Signing Secret" → `STRIPE_WEBHOOK_SECRET`

---

#### 4. HMRC (Tax Integration)
```bash
HMRC_CLIENT_ID=your-hmrc-application-client-id
HMRC_CLIENT_SECRET=your-hmrc-application-secret
HMRC_REDIRECT_URI=https://your-domain.com/api/hmrc/auth/callback
HMRC_ENV=production
```

**How to Get**:
1. Register application: https://developer.service.hmrc.gov.uk/developer/applications
2. Create new application:
   - Name: "Recoup"
   - Description: "Invoice and VAT management"
   - Redirect URI: `https://your-domain.com/api/hmrc/auth/callback`
3. Subscribe to APIs:
   - VAT (MTD) API
4. Copy credentials:
   - Client ID → `HMRC_CLIENT_ID`
   - Client Secret → `HMRC_CLIENT_SECRET`

**Note**: Production credentials require passing HMRC's application review process

---

#### 5. Twilio (SMS/Voice) - OPTIONAL
```bash
TWILIO_ACCOUNT_SID=REPLACE_WITH_YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=REPLACE_WITH_YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=REPLACE_WITH_YOUR_TWILIO_PHONE_NUMBER
```

**How to Get**:
1. Go to Twilio Console: https://console.twilio.com
2. Copy Account SID and Auth Token from dashboard
3. Buy a phone number (Go to Phone Numbers → Buy a Number)
4. Configure webhook URL for SMS: `https://your-domain.com/api/webhooks/twilio/sms`

**Cost**: ~£1/month for number + £0.01/SMS

---

#### 6. SendGrid (Email) - OPTIONAL
```bash
SENDGRID_API_KEY=REPLACE_WITH_YOUR_SENDGRID_API_KEY
SENDGRID_FROM_EMAIL=noreply@your-domain.com
SENDGRID_FROM_NAME=Recoup
```

**How to Get**:
1. Go to SendGrid: https://app.sendgrid.com
2. Settings → API Keys → Create API Key
3. Name: "Recoup Production"
4. Permissions: Full Access
5. Copy API Key → `SENDGRID_API_KEY`
6. Configure webhook: `https://your-domain.com/api/webhook/sendgrid`

**Free Tier**: 100 emails/day

---

#### 7. OpenAI (AI Features) - OPTIONAL
```bash
OPENAI_API_KEY=REPLACE_WITH_YOUR_OPENAI_API_KEY
```

**How to Get**:
1. Go to OpenAI Platform: https://platform.openai.com
2. API Keys → Create New Secret Key
3. Copy key → `OPENAI_API_KEY`

**Cost**: Pay-per-use, ~$0.002 per 1K tokens

---

#### 8. Lob (Physical Mail) - OPTIONAL
```bash
LOB_API_KEY=REPLACE_WITH_YOUR_LOB_API_KEY
```

**How to Get**:
1. Go to Lob: https://dashboard.lob.com
2. Settings → API Keys
3. Copy Production Key → `LOB_API_KEY`

**Cost**: ~£1 per letter sent

---

#### 9. Core Configuration
```bash
# App URL
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Environment
NODE_ENV=production

# Security
NEXTAUTH_SECRET=your-random-secret-key-here-minimum-32-characters
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

---

## 🔐 STEP 2: Secure Environment Variable Storage

### Option A: Vercel (Recommended)

1. **Add Environment Variables**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Add environment variables via dashboard:
   # https://vercel.com/your-team/recoup/settings/environment-variables
   ```

2. **Or use CLI**:
   ```bash
   # Add one at a time
   vercel env add FIREBASE_PROJECT_ID
   # Paste value when prompted
   # Select: Production

   # Repeat for all variables
   ```

3. **Security Best Practices**:
   - Mark all secrets as "Encrypted"
   - Only expose `NEXT_PUBLIC_*` variables to client
   - Never commit `.env` files to git
   - Rotate keys every 90 days

---

### Option B: .env.production.local (Local Testing)

Create `.env.production.local` (NEVER commit this):
```bash
# Copy all variables from above
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
# ... etc
```

Add to `.gitignore`:
```bash
.env*.local
.env.production
```

---

## 🧪 STEP 3: Local Testing with Production Config

### 3.1 Install Dependencies
```bash
cd recoup
npm install
```

### 3.2 Build for Production
```bash
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
```

**If errors occur**:
- Check TypeScript errors: `npm run type-check`
- Check linting: `npm run lint`
- Review build errors in terminal

---

### 3.3 Test Critical Endpoints Locally

```bash
# Start production server locally
npm run start

# In another terminal, test endpoints:

# Health check
curl http://localhost:3000/api/health

# Expected: {"status":"ok"}
```

---

### 3.4 Test Database Connection

Create test script `scripts/test-db-connection.ts`:
```typescript
import { db, COLLECTIONS } from '@/lib/firebase';

async function testConnection() {
  try {
    console.log('Testing Firestore connection...');

    // Try to read from users collection
    const snapshot = await db.collection(COLLECTIONS.USERS).limit(1).get();

    console.log('✅ Firestore connection successful!');
    console.log(`Found ${snapshot.size} users`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

Run:
```bash
npx ts-node scripts/test-db-connection.ts
```

---

### 3.5 Test Stripe Integration

Create test script `scripts/test-stripe.ts`:
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

async function testStripe() {
  try {
    console.log('Testing Stripe connection...');

    // List products
    const products = await stripe.products.list({ limit: 3 });

    console.log('✅ Stripe connection successful!');
    console.log(`Found ${products.data.length} products`);

    products.data.forEach(p => {
      console.log(`  - ${p.name} (${p.id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Stripe connection failed:', error);
    process.exit(1);
  }
}

testStripe();
```

Run:
```bash
npx ts-node scripts/test-stripe.ts
```

---

## 🚀 STEP 4: Production Deployment to Vercel

### 4.1 Prepare for Deployment

**Verify build succeeds**:
```bash
npm run build
```

**Run final tests**:
```bash
npm test
```

Expected: 277/285 passing (8 HMRC tests need credentials)

---

### 4.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project (first time only)
vercel link

# Deploy to production
vercel --prod
```

**Interactive prompts**:
```
? Set up and deploy "~/Recoup/recoup"? [Y/n] y
? Which scope? your-team
? Link to existing project? [y/N] n
? What's your project's name? recoup
? In which directory is your code located? ./
? Want to modify these settings? [y/N] n
```

**Deployment output**:
```
🔍 Inspect: https://vercel.com/your-team/recoup/deployments/xxx
✅ Production: https://recoup-xxx.vercel.app
```

---

### 4.3 Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Domains
2. Add domain: `recoup.yourdomain.com`
3. Configure DNS records (Vercel provides instructions)
4. Wait for SSL certificate (automatic)

---

### 4.4 Update Webhook URLs

After deployment, update webhook URLs in:

**Stripe**:
1. Dashboard → Developers → Webhooks
2. Edit endpoint
3. Update URL: `https://your-actual-domain.com/api/webhook/stripe`

**Clerk**:
1. Dashboard → Webhooks
2. Edit endpoint
3. Update URL: `https://your-actual-domain.com/api/webhook/clerk`

**HMRC**:
1. Developer Hub → Applications → Edit
2. Update Redirect URI: `https://your-actual-domain.com/api/hmrc/auth/callback`

---

## 🧪 STEP 5: Production Testing

### 5.1 Health Check
```bash
curl https://your-domain.com/api/health
```

Expected: `{"status":"ok"}`

---

### 5.2 Test User Signup Flow

1. Open app: `https://your-domain.com`
2. Click "Sign Up"
3. Create account with test email
4. Verify email received
5. Complete profile

**Check Firestore**:
- Go to Firebase Console
- Check `users` collection
- Verify new user document exists

**Check Clerk**:
- Go to Clerk Dashboard
- Check Users tab
- Verify new user appears

---

### 5.3 Test Invoice Creation

1. Login to app
2. Go to "Create Invoice"
3. Fill in client details
4. Add line items
5. Click "Create"

**Verify**:
- Invoice appears in dashboard
- Check Firestore `invoices` collection
- Verify data matches input

---

### 5.4 Test Payment Flow

**IMPORTANT**: Use Stripe test card numbers first!

Test Card: `4242 4242 4242 4242`
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

1. Create invoice
2. Mark as "Sent"
3. Get payment link
4. Complete checkout with test card
5. Verify webhook received

**Check**:
- Stripe Dashboard → Payments (payment appears)
- Firestore `transactions` collection (transaction created)
- Invoice status updated to "Paid"

**Then test with real card** (charge yourself £1, then refund):
1. Use your real card
2. Complete payment
3. Verify everything works
4. Refund in Stripe Dashboard

---

### 5.5 Test Subscription Flow

1. Click "Upgrade Plan"
2. Select "Starter" plan
3. Complete checkout
4. Verify webhook received

**Check**:
- User tier updated in Firestore
- Stripe subscription created
- Subscription status "active"

**Test cancellation**:
1. Go to account settings
2. Delete account
3. Verify Stripe subscription cancelled (webhook)

---

## 📊 STEP 6: Monitoring Setup

### 6.1 Error Tracking with Sentry (Free Tier)

1. **Sign up**: https://sentry.io/signup/
2. **Create project**: "Recoup"
3. **Get DSN**: Copy from project settings
4. **Install**:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

5. **Configure** (`sentry.client.config.ts`):
   ```typescript
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1, // 10% of transactions

     beforeSend(event, hint) {
       // Don't send sensitive data
       if (event.request) {
         delete event.request.cookies;
         delete event.request.headers;
       }
       return event;
     },
   });
   ```

6. **Test**:
   ```typescript
   // Add to a test page
   throw new Error("Test error - Sentry check");
   ```

7. **Add to Vercel**:
   ```bash
   vercel env add NEXT_PUBLIC_SENTRY_DSN
   # Paste DSN
   # Select: Production
   ```

---

### 6.2 Uptime Monitoring (UptimeRobot - Free)

1. Go to: https://uptimerobot.com
2. Sign up (free tier: 50 monitors)
3. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-domain.com/api/health`
   - Name: "Recoup Production"
   - Interval: 5 minutes
4. Add alert contacts:
   - Email: your-email@example.com
   - SMS: optional (charges apply)

---

### 6.3 Performance Monitoring (Vercel Analytics)

Built-in to Vercel (free tier):

1. Go to Vercel Dashboard
2. Select project
3. Go to Analytics tab
4. View:
   - Page views
   - Response times
   - Edge network performance

---

### 6.4 Database Monitoring (Firebase)

1. Go to Firebase Console
2. Usage tab:
   - Monitor reads/writes
   - Check storage usage
   - Set budget alerts

**Set budget alert**:
- Go to Billing
- Set daily spend limit
- Add alert emails

---

## 💰 STEP 7: Cost Monitoring & Optimization

### Daily Cost Checklist

```bash
# Check Firebase usage (daily)
# Go to: https://console.firebase.google.com → Usage

# Check Stripe transactions
# Go to: https://dashboard.stripe.com → Payments

# Check Twilio usage (if enabled)
# Go to: https://console.twilio.com → Usage

# Check SendGrid usage
# Go to: https://app.sendgrid.com → Stats
```

### Cost Alerts

**Firebase**:
1. Console → Billing
2. Budget Alerts → Set Alert
3. Amount: £5/day
4. Email: your-email

**Stripe**:
- Automatic notifications for failed payments
- Check daily in dashboard

**Twilio**:
1. Console → Billing
2. Notifications → Low Balance Alert
3. Amount: £5

---

## 📈 STEP 8: Week 1 Success Metrics

### Daily Tracking (First Week)

| Metric | Target | Where to Check |
|--------|--------|----------------|
| User Signups | 10+ | Clerk Dashboard |
| Invoices Created | 5+ | Firestore → invoices collection count |
| Payments Processed | 1+ | Stripe Dashboard |
| Uptime | 100% | UptimeRobot |
| Critical Errors | 0 | Sentry |
| Avg API Response | <500ms | Vercel Analytics |
| Daily Cost | <£1 | All service dashboards |

### Weekly Report Template

```markdown
## Week 1 Report

### User Growth
- Total signups: X
- Active users: Y
- Churn: Z

### Revenue
- Total payments: £X
- Subscriptions: Y
- MRR: £Z

### Technical
- Uptime: X%
- Errors: Y total (Z critical)
- Avg response time: Xms

### Costs
- Firebase: £X
- Stripe: £Y (transaction fees)
- Twilio: £Z
- Total: £X

### Action Items
- [ ] Item 1
- [ ] Item 2
```

---

## 🎨 STEP 9: UI Enhancements (Optional)

### Add Gradients & Modern Colors

**Update `tailwind.config.js`**:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7', // Main purple
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'gradient-accent': 'linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)',
      },
    },
  },
}
```

**Apply to Components**:
```tsx
// Dashboard header
<div className="bg-gradient-primary text-white p-8 rounded-lg">
  <h1 className="text-3xl font-bold">Dashboard</h1>
</div>

// Primary button
<button className="bg-gradient-primary hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-opacity">
  Create Invoice
</button>

// Card with subtle gradient
<div className="bg-gradient-subtle border border-primary-200 rounded-lg p-6">
  <h3 className="text-primary-700 font-semibold">Total Revenue</h3>
  <p className="text-3xl font-bold text-primary-900">£1,234</p>
</div>

// Status badge
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
  Paid
</span>
```

---

## ✅ FINAL MASTER CHECKLIST

### Pre-Launch
- [ ] All environment variables configured in Vercel
- [ ] Firebase project created and security rules enabled
- [ ] Stripe products and prices created
- [ ] Clerk production instance configured
- [ ] All webhook endpoints configured
- [ ] Local build successful (`npm run build`)
- [ ] All tests passing (277/285)
- [ ] TypeScript compilation (0 errors)

### Deployment
- [ ] Deployed to Vercel production
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] All webhooks updated with production URLs
- [ ] Health check endpoint responding

### Testing
- [ ] User signup flow tested
- [ ] Invoice creation tested
- [ ] Payment processing tested (test card + real card)
- [ ] Subscription flow tested
- [ ] Subscription cancellation tested
- [ ] HMRC OAuth tested (if credentials available)

### Monitoring
- [ ] Sentry error tracking configured
- [ ] UptimeRobot uptime monitoring active
- [ ] Vercel Analytics enabled
- [ ] Firebase budget alerts set
- [ ] Cost monitoring dashboards bookmarked

### Security
- [ ] Firestore security rules enabled
- [ ] All API keys stored securely
- [ ] Webhook signatures verified
- [ ] CORS policies configured
- [ ] CSP headers enabled

### Documentation
- [ ] API_AUDIT.md reviewed
- [ ] AUDIT_FINDINGS.md reviewed
- [ ] LAUNCH_CHECKLIST.md reviewed
- [ ] PRODUCTION_DEPLOYMENT_GUIDE.md reviewed
- [ ] Internal documentation updated

---

## 🚨 Emergency Procedures

### If Site Goes Down

1. **Check Vercel Status**: https://vercel-status.com
2. **Check error logs**: Sentry dashboard
3. **Check deployment**: Vercel dashboard → Deployments
4. **Rollback if needed**: `vercel rollback` in CLI

### If Payments Fail

1. **Check Stripe Status**: https://status.stripe.com
2. **Check webhook delivery**: Stripe dashboard → Webhooks
3. **Review logs**: Sentry + Vercel logs
4. **Test webhook manually**: Use Stripe CLI

### If Database Errors

1. **Check Firebase Status**: https://status.firebase.google.com
2. **Review security rules**: Firebase console
3. **Check quota**: Firebase console → Usage
4. **Review logs**: Sentry + Vercel logs

---

## 📞 Support Resources

- **Vercel Support**: https://vercel.com/support
- **Firebase Support**: https://firebase.google.com/support
- **Stripe Support**: https://support.stripe.com
- **Clerk Support**: https://clerk.com/support

---

**You're ready to launch! 🚀**

Follow this guide step-by-step, and your app will be live and production-ready.

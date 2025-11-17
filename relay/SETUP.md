# Recoup - Detailed Setup Instructions

This guide will walk you through setting up Recoup from scratch.

## Step 1: Clone and Install

```bash
cd recoup
npm install
```

## Step 2: Set Up Clerk Authentication

1. Go to https://dashboard.clerk.com
2. Create a new application (choose "Next.js" as the framework)
3. Copy your API keys:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

## Step 3: Set Up Firebase

1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Firestore Database:
   - Go to "Build" → "Firestore Database"
   - Click "Create database"
   - Choose "Start in production mode"
   - Select a location
4. Get service account credentials:
   - Go to "Project Settings" → "Service Accounts"
   - Click "Generate new private key"
   - Download the JSON file
5. Extract values and add to `.env.local`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

   **Note:** Make sure to keep the quotes around the private key and include the newline characters (`\n`).

## Step 4: Set Up OpenAI

1. Go to https://platform.openai.com
2. Create an account or sign in
3. Go to "API keys" in your account settings
4. Click "Create new secret key"
5. Copy the key and add to `.env.local`:
   ```
   OPENAI_API_KEY=sk-proj-...
   ```

## Step 5: Set Up SendGrid

1. Go to https://sendgrid.com
2. Create an account
3. Go to "Settings" → "API Keys"
4. Click "Create API Key"
5. Give it "Full Access" permissions
6. Copy the key and add to `.env.local`:
   ```
   SENDGRID_API_KEY=SG...
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=Recoup
   ```

7. **Authenticate your domain (REQUIRED for production):**
   
   **Why:** Domain authentication (SPF, DKIM, DMARC) is essential for:
   - High inbox delivery rates (98%+ vs 70-80% without)
   - Gmail/Outlook trust and reputation
   - Protection against email spoofing
   - Professional branding (emails from @yourdomain.com, not SendGrid)

   **Steps:**
   
   a) **Go to Settings → Sender Authentication → Authenticate Your Domain**
      - Click "Get Started" under Domain Authentication
      - Enter your domain (e.g., `recoup.app`)
      - Select "Yes" for branded links (optional but recommended)
   
   b) **Add DNS Records (via your domain provider):**
      
      SendGrid will provide 3 types of DNS records to add:
      
      **SPF Record (TXT):**
      ```
      Type: TXT
      Host: @ (or your domain)
      Value: v=spf1 include:sendgrid.net ~all
      ```
      Purpose: Tells recipient servers that SendGrid can send emails from your domain
      
      **DKIM Records (CNAME - typically 3 records):**
      ```
      Type: CNAME
      Host: s1._domainkey.yourdomain.com
      Value: s1.domainkey.u[UNIQUE_ID].wl.sendgrid.net
      
      Type: CNAME
      Host: s2._domainkey.yourdomain.com
      Value: s2.domainkey.u[UNIQUE_ID].wl.sendgrid.net
      ```
      Purpose: Digital signatures proving emails are legitimately from your domain
      
      **DMARC Record (TXT):**
      ```
      Type: TXT
      Host: _dmarc.yourdomain.com
      Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com; fo=1
      ```
      Purpose: Policy for handling emails that fail SPF/DKIM checks
      
      **Progression Strategy:**
      - Week 1-2: `p=none` (monitor only, no enforcement)
      - Week 3-4: Review DMARC reports sent to your email
      - Month 2+: Change to `p=quarantine` or `p=reject` for stricter enforcement
   
   c) **Verify DNS Records:**
      - Wait 24-48 hours for DNS propagation
      - Return to SendGrid → Sender Authentication
      - Click "Verify" next to your domain
      - SendGrid will check if all records are correctly configured
      - Status should show "Verified" with green checkmarks
   
   d) **Test Email Authentication:**
      - Send a test email to your Gmail account
      - View email source (3 dots → Show original)
      - Verify you see:
        - `SPF: PASS`
        - `DKIM: PASS`
        - `DMARC: PASS`
   
   **Common DNS Provider Instructions:**
   - **Cloudflare:** DNS → Add Record
   - **GoDaddy:** DNS Management → Add
   - **Namecheap:** Advanced DNS → Add New Record
   - **AWS Route 53:** Hosted Zones → Create Record Set
   
   **Troubleshooting:**
   - If verification fails after 48 hours, check for typos in DNS records
   - Remove any existing SPF records before adding new one (only 1 SPF per domain)
   - Use https://mxtoolbox.com/spf.aspx to verify SPF record
   - Use https://mxtoolbox.com/dkim.aspx to verify DKIM records

8. **Configure sender details:**
   - Set `SENDGRID_FROM_EMAIL` to your authenticated domain email (e.g., `noreply@recoup.app`)
   - Set `SENDGRID_FROM_NAME` to your business name (e.g., `Recoup`)
   - These appear as the "From" field in recipient inboxes

9. **Create Dynamic Templates:**
   - Go to https://mc.sendgrid.com/dynamic-templates
   - Click "Create Dynamic Template"
   - Create templates for:
     - **Invoice Email** (when sending invoice to client)
     - **Day 7 Reminder** (first collection reminder)
     - **Day 21 Reminder** (second collection reminder)
     - **Payment Confirmed** (when payment is verified)
     - **Payment Verification Required** (when client claims payment, freelancer must verify)
     - **Payment Verified** (confirmation to client that payment was verified)
     - **Payment Rejected** (notification to client that claimed payment couldn't be verified)
     - **Notification** (smart notifications)
   - For each template, copy the Template ID (starts with `d-`)
   - Add Template IDs to `.env.local`:
     ```
     SENDGRID_INVOICE_TEMPLATE_ID=d-...
     SENDGRID_REMINDER_DAY7_TEMPLATE_ID=d-...
     SENDGRID_REMINDER_DAY21_TEMPLATE_ID=d-...
     SENDGRID_PAYMENT_CONFIRMED_TEMPLATE_ID=d-...
     SENDGRID_PAYMENT_VERIFICATION_TEMPLATE_ID=d-...
     SENDGRID_PAYMENT_VERIFIED_TEMPLATE_ID=d-...
     SENDGRID_PAYMENT_REJECTED_TEMPLATE_ID=d-...
     SENDGRID_NOTIFICATION_TEMPLATE_ID=d-...
     ```

10. **Configure business details:**
    - Add your business address to `.env.local` (required for GDPR/UK compliance):
      ```
      NEXT_PUBLIC_BUSINESS_ADDRESS="123 Business Street, London, UK"
      ```
    - This appears in email footers alongside privacy policy and unsubscribe links

## Step 6: Set Up Stripe

1. Go to https://dashboard.stripe.com
2. Create an account or sign in
3. Go to "Developers" → "API keys"
4. Copy your keys:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)
5. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

6. **Set up Webhooks** (for production):
   - Go to "Developers" → "Webhooks"
   - Click "Add endpoint"
   - Enter your URL: `https://yourdomain.com/api/webhook/stripe`
   - Select events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy the "Signing secret" (starts with `whsec_`)
   - Add to `.env.local`:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```

7. **For local development:**
   - Install Stripe CLI: https://stripe.com/docs/stripe-cli
   - Run: `stripe listen --forward-to localhost:3000/api/webhook/stripe`
   - Copy the webhook signing secret from the output

## Step 7: Set Up Upstash Redis

1. Go to https://console.upstash.com
2. Create an account or sign in
3. Click "Create Database"
4. Choose:
   - **Type:** Redis
   - **Name:** recoup-ratelimit
   - **Region:** Choose closest to your users
5. Once created, go to the database details
6. Copy the "REST API" credentials:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**
7. Add to `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

## Step 8: Generate Security Keys

Generate encryption key for bank details:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate cron job secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to `.env.local`:
```
ENCRYPTION_KEY=<paste-generated-hex-key>
CRON_SECRET=<paste-generated-base64-key>
```

## Step 9: Configure Application URL

Add your application URL to `.env.local`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, change this to your actual domain:
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Step 10: Verify Configuration

Your complete `.env.local` should look like this:

```bash
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI
OPENAI_API_KEY=sk-proj-...

# SendGrid
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Recoup
SENDGRID_INVOICE_TEMPLATE_ID=d-...
SENDGRID_REMINDER_DAY7_TEMPLATE_ID=d-...
SENDGRID_REMINDER_DAY21_TEMPLATE_ID=d-...
SENDGRID_PAYMENT_CONFIRMED_TEMPLATE_ID=d-...
SENDGRID_NOTIFICATION_TEMPLATE_ID=d-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Security
ENCRYPTION_KEY=<your-generated-hex-key>
CRON_SECRET=<your-generated-base64-key>

# Feature Flags
COLLECTIONS_DEMO_LIMIT=1
ENABLE_VOICE_TO_TEXT=true
ENABLE_GAMIFICATION=true
ENABLE_REFERRALS=true

# Logging
LOG_LEVEL=info
```

## Step 11: Run the Application

Start the development server:
```bash
npm run dev
```

Open your browser and navigate to: http://localhost:3000

## Step 12: Test Authentication

1. Click "Get Started" or "Sign Up"
2. Create an account using Clerk
3. You should be redirected to `/dashboard`

## Step 13: Deploy to Vercel

1. Push your code to GitHub (make sure `.env.local` is in `.gitignore`)
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your GitHub repository
5. Configure environment variables:
   - Copy all variables from your `.env.local`
   - Paste them into Vercel's environment variables section
   - Change `NEXT_PUBLIC_APP_URL` to your production URL
6. Click "Deploy"

## Troubleshooting

### "Missing publishableKey" error
- Make sure you've added `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to `.env.local`
- Restart the dev server after adding environment variables

### "Invalid credentials" error with Firebase
- Check that your `FIREBASE_PRIVATE_KEY` has proper newline characters (`\n`)
- Make sure the key is wrapped in double quotes
- Verify the email and project ID match your Firebase console

### SendGrid emails not sending
- Verify your sender email in SendGrid
- Check that your API key has "Full Access" permissions
- Make sure you've created the required dynamic templates

### Stripe webhooks not working locally
- Install Stripe CLI and run: `stripe listen --forward-to localhost:3000/api/webhook/stripe`
- Use the webhook signing secret from the CLI output

### Rate limiting not working
- Verify your Upstash Redis credentials
- Check that the database is active in Upstash console

## Next Steps

Once setup is complete, you're ready to start building features! See README.md for the development roadmap.

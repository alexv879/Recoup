# Local Development Setup

Complete guide for setting up the Recoup development environment on your local machine.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [External Service Configuration](#external-service-configuration)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js 18+** (LTS recommended)
   ```bash
   # Check version
   node --version  # Should be 18.x or higher

   # Install via nvm (recommended)
   nvm install 18
   nvm use 18
   ```

2. **npm 9+** or **pnpm 8+**
   ```bash
   # Check version
   npm --version

   # Or install pnpm (faster alternative)
   npm install -g pnpm
   ```

3. **Git**
   ```bash
   git --version
   ```

4. **VS Code** (recommended) or your preferred editor

### Recommended Tools

- **Firebase CLI** - For Firestore emulator
  ```bash
  npm install -g firebase-tools
  ```

- **Vercel CLI** - For testing serverless functions locally
  ```bash
  npm install -g vercel
  ```

- **Postman** - For API testing (or use the included collection)

---

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repo
git clone https://github.com/alexv879/Recoup.git
cd Recoup

# Navigate to the main app
cd relay
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm (faster)
pnpm install
```

**Expected time:** 2-3 minutes

### 3. Verify Installation

```bash
# Check for any vulnerabilities
npm audit

# If there are fixable issues
npm audit fix
```

---

## Environment Variables

### 1. Create Environment File

```bash
# Copy example file
cp .env.example .env.local
```

### 2. Required Environment Variables

Open `.env.local` and fill in the following variables:

#### Clerk Authentication
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

**How to get:**
1. Go to https://clerk.com
2. Create a free account
3. Create a new application
4. Copy keys from the dashboard

#### Firebase
```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
```

**How to get:**
1. Go to https://console.firebase.google.com
2. Create a new project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Copy the values from downloaded JSON file

**Important:** Wrap `FIREBASE_PRIVATE_KEY` in double quotes and keep the `\n` characters.

#### OpenAI
```bash
OPENAI_API_KEY=sk-xxxxx
```

**How to get:**
1. Go to https://platform.openai.com
2. Create account or sign in
3. Go to API Keys section
4. Create new secret key

**Cost warning:** Voice transcription costs $0.003/minute. Start with small audio files.

#### SendGrid (Email)
```bash
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME="Recoup"
```

**How to get:**
1. Go to https://sendgrid.com
2. Create free account (100 emails/day free tier)
3. Create API key with "Mail Send" permissions
4. Verify sender email address

#### Stripe (Payments)
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_API_VERSION=2025-10-29
```

**How to get:**
1. Go to https://stripe.com
2. Create account
3. Switch to "Test mode" (toggle in top right)
4. Go to Developers → API Keys
5. Copy publishable and secret keys

**Webhook setup:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe
# Or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

The CLI will output your webhook secret - add it to `.env.local`.

#### Upstash Redis (Rate Limiting)
```bash
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

**How to get:**
1. Go to https://upstash.com
2. Create free account
3. Create new Redis database
4. Copy REST URL and token

#### Twilio (SMS/Voice) - Optional for premium features
```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SID=VAxxxxx
```

**How to get:**
1. Go to https://twilio.com
2. Create account (free trial gives $15 credit)
3. Get a phone number
4. Copy Account SID and Auth Token

#### Lob (Physical Mail) - Optional for premium features
```bash
LOB_API_KEY=test_xxxxx
```

**How to get:**
1. Go to https://lob.com
2. Create account (test mode available)
3. Get test API key

#### Sentry (Error Tracking) - Optional but recommended
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=recoup
```

**How to get:**
1. Go to https://sentry.io
2. Create free account
3. Create new project (Next.js)
4. Copy DSN

#### Encryption & Security
```bash
ENCRYPTION_KEY=your-32-character-encryption-key-here
CRON_SECRET=your-random-secret-for-cron-jobs
```

**Generate secure keys:**
```bash
# Generate encryption key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate cron secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Optional Environment Variables

```bash
# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Mixpanel Analytics (optional)
NEXT_PUBLIC_MIXPANEL_TOKEN=xxxxx
```

### 4. Example `.env.local` File

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=recoup-dev
FIREBASE_PROJECT_ID=recoup-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@recoup-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=dev@localhost
SENDGRID_FROM_NAME="Recoup Dev"

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Upstash
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# Security
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
CRON_SECRET=your-cron-secret-here

# Development
NODE_ENV=development
LOG_LEVEL=debug
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Setup

### Option 1: Use Firebase Firestore (Production-like)

**Recommended for testing full features.**

1. Create Firebase project (see Environment Variables section)
2. Enable Firestore Database:
   - Go to Firebase Console → Build → Firestore Database
   - Click "Create database"
   - Start in **test mode** (for development)
   - Choose location: `europe-west2` (London) or closest to you

3. Create initial collections:
   ```bash
   # Collections will be created automatically when you add data
   # Or use Firebase Console to create them manually:
   # - users
   # - invoices
   # - clients
   # - payment_claims
   # - collection_attempts
   ```

4. Set up indexes:
   ```bash
   # Deploy Firestore indexes
   firebase deploy --only firestore:indexes

   # Or create via Firebase Console (auto-suggested when running queries)
   ```

### Option 2: Use Firestore Emulator (Offline Development)

**For working without internet or avoiding API costs.**

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase emulator:
   ```bash
   firebase init emulators
   # Select: Firestore, Functions
   ```

3. Update `.env.local`:
   ```bash
   FIRESTORE_EMULATOR_HOST=localhost:8080
   ```

4. Start emulator:
   ```bash
   firebase emulators:start
   ```

5. Emulator UI available at: http://localhost:4000

**Note:** Emulator data is cleared when stopped. Use `--import` and `--export` flags to persist data.

---

## External Service Configuration

### Clerk Development Setup

1. **Create Clerk Application:**
   - Name: "Recoup Development"
   - Choose authentication methods: Email, Google (optional)

2. **Configure allowed URLs:**
   - Sign-in URL: `http://localhost:3000/sign-in`
   - Sign-up URL: `http://localhost:3000/sign-up`
   - After sign-in URL: `http://localhost:3000/dashboard`
   - After sign-up URL: `http://localhost:3000/dashboard`

3. **Enable webhooks:**
   - Endpoint: `http://localhost:3000/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Use Clerk CLI or ngrok for local testing

### Stripe Development Setup

1. **Enable test mode** (toggle in top right)

2. **Create product for subscription testing:**
   - Go to Products → Add product
   - Name: "Recoup Starter"
   - Recurring: Monthly
   - Price: £19.00

3. **Set up webhook endpoint:**
   ```bash
   # Use Stripe CLI
   stripe listen --forward-to localhost:3000/api/webhook/stripe
   ```

4. **Test payment link creation:**
   - Create an invoice in the app
   - Verify Stripe payment link is generated
   - Test checkout in Stripe test mode

### SendGrid Development Setup

1. **Verify sender email:**
   - Go to Settings → Sender Authentication
   - Verify single sender email
   - Use this as `SENDGRID_FROM_EMAIL`

2. **Create email templates:**
   - Design → Templates
   - Create templates for:
     - Invoice email
     - Gentle reminder
     - Firm reminder
     - Final reminder

3. **Test email sending:**
   ```bash
   curl -X POST http://localhost:3000/api/collections/send-reminder \
     -H "Content-Type: application/json" \
     -d '{"invoiceId": "test-123", "reminderType": "gentle"}'
   ```

---

## Running the Application

### Start Development Server

```bash
# Navigate to relay directory
cd relay

# Start Next.js dev server
npm run dev

# Or with pnpm
pnpm dev
```

**Access the app:**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/*

### Development Mode Features

- **Hot reload** - Changes reflect immediately
- **Error overlay** - Detailed error messages
- **Fast refresh** - Preserves component state
- **Source maps** - Debug original TypeScript code

### Running with Vercel CLI (Optional)

```bash
# Install Vercel CLI
npm install -g vercel

# Link to Vercel project
vercel link

# Run development server
vercel dev
```

**Benefits:**
- Matches production environment exactly
- Tests serverless function timeouts
- Environment variables sync from Vercel

---

## Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### E2E Tests (if implemented)

```bash
# Run Playwright tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Type Checking

```bash
# Run TypeScript compiler check
npm run type-check
```

---

## Seeding Test Data

### Create Sample Data

```typescript
// scripts/seed-data.ts
import { db } from '@/lib/firebase-admin';

async function seedData() {
  // Create test user data
  await db.collection('users').doc('test-user-123').set({
    email: 'test@example.com',
    name: 'Test User',
    subscriptionTier: 'growth',
    createdAt: new Date(),
  });

  // Create test client
  await db.collection('clients').add({
    userId: 'test-user-123',
    name: 'ACME Corp',
    email: 'billing@acme.com',
    totalInvoiced: 5000,
    createdAt: new Date(),
  });

  // Create test invoice
  await db.collection('invoices').add({
    userId: 'test-user-123',
    clientName: 'ACME Corp',
    amount: 1500,
    status: 'sent',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  });
}

seedData().then(() => console.log('Data seeded!'));
```

Run the script:
```bash
npx tsx scripts/seed-data.ts
```

---

## Development Workflow

### Typical Development Session

1. **Start services:**
   ```bash
   # Terminal 1: Next.js dev server
   npm run dev

   # Terminal 2: Stripe webhook forwarding
   stripe listen --forward-to localhost:3000/api/webhook/stripe

   # Terminal 3 (optional): Firestore emulator
   firebase emulators:start
   ```

2. **Make changes:**
   - Edit files in `app/`, `components/`, `lib/`, etc.
   - Changes hot-reload automatically

3. **Test changes:**
   - Open http://localhost:3000
   - Use Postman collection for API testing
   - Check terminal for errors

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push
   ```

### Debugging Tips

1. **Use VS Code debugger:**
   - Add breakpoints in code
   - Press F5 to start debugging
   - See `.vscode/launch.json` for config

2. **Console logging:**
   ```typescript
   console.log('[DEBUG]', { userId, invoiceId });
   ```

3. **Sentry breadcrumbs:**
   ```typescript
   import * as Sentry from '@sentry/nextjs';

   Sentry.addBreadcrumb({
     message: 'Invoice escalated',
     data: { invoiceId },
   });
   ```

4. **Network tab:**
   - Open browser DevTools → Network
   - Monitor API requests/responses
   - Check request headers and payload

---

## Common Development Tasks

### Add New API Endpoint

1. Create file:
   ```bash
   touch app/api/my-endpoint/route.ts
   ```

2. Implement handler:
   ```typescript
   import { auth } from '@clerk/nextjs/server';
   import { NextResponse } from 'next/server';

   export async function POST(req: Request) {
     const { userId } = await auth();
     if (!userId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     const body = await req.json();
     // Handle request...

     return NextResponse.json({ success: true });
   }
   ```

3. Test endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/my-endpoint \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### Add New Firestore Collection

1. Create TypeScript interface:
   ```typescript
   // types/my-collection.ts
   export interface MyCollection {
     id: string;
     userId: string;
     data: string;
     createdAt: Timestamp;
   }
   ```

2. Create helper functions:
   ```typescript
   // lib/my-collection.ts
   import { db } from './firebase-admin';

   export async function createItem(userId: string, data: string) {
     return await db.collection('my_collection').add({
       userId,
       data,
       createdAt: new Date(),
     });
   }
   ```

3. Add security rules:
   ```javascript
   // firestore.rules
   match /my_collection/{docId} {
     allow read, write: if request.auth.uid == resource.data.userId;
   }
   ```

---

## IDE Setup

### VS Code Extensions (Recommended)

Install these extensions for best development experience:

1. **ESLint** - dbaeumer.vscode-eslint
2. **Prettier** - esbenp.prettier-vscode
3. **Tailwind CSS IntelliSense** - bradlc.vscode-tailwindcss
4. **TypeScript Error Translator** - mattpocock.ts-error-translator
5. **Firebase** - toba.vsfire
6. **GitLens** - eamodio.gitlens
7. **Path Intellisense** - christian-kohler.path-intellisense

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## Performance Tips

1. **Use pnpm instead of npm** (3x faster installs)
2. **Enable Turbopack** (Next.js 16):
   ```bash
   npm run dev --turbo
   ```
3. **Use SWC** for faster compilation (already enabled)
4. **Minimize hot reload scope** - edit one file at a time
5. **Close unused tabs** in browser to reduce memory

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions to common issues.

### Quick Fixes

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

**Module not found:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Firestore permission denied:**
```bash
# Check Firebase security rules
# Make sure user is authenticated
# Verify userId matches document userId
```

**Stripe webhook not working:**
```bash
# Restart Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Check webhook secret matches .env.local
```

---

## Next Steps

Once your local environment is set up:

1. ✅ Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
2. ✅ Review [CONTRIBUTING.md](./CONTRIBUTING.md) for coding standards
3. ✅ Check [DATABASE.md](./DATABASE.md) for schema details
4. ✅ Explore the codebase starting with `app/` directory
5. ✅ Create your first test invoice!

---

## Getting Help

- **Documentation Issues:** Open GitHub issue
- **Development Questions:** Check existing issues or create new one
- **External Services:** Refer to their respective documentation:
  - [Next.js Docs](https://nextjs.org/docs)
  - [Firebase Docs](https://firebase.google.com/docs)
  - [Clerk Docs](https://clerk.com/docs)
  - [Stripe Docs](https://stripe.com/docs)

Happy coding! 🚀

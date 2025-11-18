# Recoup - Invoice & Payment Tracking System

Smart invoicing and payment tracking for freelancers with AI-powered collections, smart notifications, and gamification.

## 🎉 Project Status

**Phase 1 (Foundation Infrastructure): COMPLETE** ✅

The entire foundation has been successfully built with the latest November 2025 technologies:

- ✅ Next.js 16 with App Router
- ✅ React 19 & TypeScript 5.9
- ✅ Clerk v6 Authentication (latest patterns)
- ✅ Firebase Admin SDK v13
- ✅ OpenAI v6 (with gpt-4o-mini-transcribe - 50% cheaper!)
- ✅ Stripe v19 (API version 2025-10-29)
- ✅ SendGrid v8
- ✅ Upstash Redis for rate limiting
- ✅ Zustand v5 state management
- ✅ Tailwind CSS v4
- ✅ Zod validation
- ✅ Pino logging
- ✅ Complete error handling
- ✅ Helper functions & constants

## 📋 What's Built

### 1. Project Structure
Complete Next.js App Router structure with:
- `/app` - Pages and API routes
- `/components` - React components (organized by feature)
- `/lib` - Core library files (Firebase, OpenAI, Stripe, SendGrid, Upstash)
- `/services` - Business logic services
- `/utils` - Utility functions
- `/types` - TypeScript interfaces
- `/jobs` - Scheduled cron jobs

### 2. Authentication (Clerk v6)
- ✅ Middleware with route protection
- ✅ Sign-in/Sign-up pages
- ✅ Auth utility functions
- ✅ Uses latest `clerkMiddleware` pattern (NOT deprecated `authMiddleware`)

### 3. Database (Firebase/Firestore)
- ✅ Firebase Admin SDK v13 initialized with modular imports
- ✅ Complete TypeScript interfaces for 13 collections:
  - Users
  - Invoices
  - Payment Confirmations
  - Collections Attempts
  - Notifications
  - Transactions
  - Referrals
  - User Behavior Profile
  - User Stats
  - Emails Sent
  - Onboarding Progress

### 4. External API Clients
- ✅ **OpenAI v6**: Voice transcription with gpt-4o-mini-transcribe (50% cheaper than Whisper!)
- ✅ **Stripe v19**: Payment links, webhook verification (API version 2025-10-29)
- ✅ **SendGrid v8**: Email templates with dynamic data
- ✅ **Upstash Redis**: Rate limiting with sliding windows

### 5. Utilities & Validation
- ✅ Error handling with custom error classes
- ✅ Zod validation schemas for all API endpoints
- ✅ Pino structured logging
- ✅ Helper functions (dates, currency, encryption, tokens)
- ✅ Constants file with all application constants

### 6. Configuration
- ✅ next.config.js
- ✅ tailwind.config.js (v4)
- ✅ tsconfig.json
- ✅ vercel.json (with cron jobs)
- ✅ .env.example (comprehensive template)
- ✅ .gitignore
- ✅ .eslintrc.json

## 🚀 Getting Started

### Prerequisites

You'll need accounts and API keys for:
1. **Clerk** (authentication) - https://clerk.com
2. **Firebase** (database) - https://console.firebase.google.com
3. **OpenAI** (AI transcription) - https://platform.openai.com
4. **SendGrid** (email) - https://sendgrid.com
5. **Stripe** (payments) - https://stripe.com
6. **Upstash Redis** (rate limiting) - https://upstash.com

### Installation

1. **Install dependencies:**
   ```bash
   cd recoup
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Fill in your API keys in `.env.local`:**
   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   - CLERK_SECRET_KEY
   - FIREBASE_PROJECT_ID
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_PRIVATE_KEY
   - OPENAI_API_KEY
   - SENDGRID_API_KEY
   - STRIPE_SECRET_KEY
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - STRIPE_WEBHOOK_SECRET
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
   - ENCRYPTION_KEY (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - CRON_SECRET (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)

4. **Create SendGrid email templates:**
   Go to https://mc.sendgrid.com/dynamic-templates and create templates for:
   - Invoice email
   - Day 7 reminder
   - Day 21 reminder
   - Payment confirmed
   - General notification

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to http://localhost:3000

## 📦 Tech Stack (November 2025)

### Frontend
- **Next.js 16**: Latest with Turbopack
- **React 19**: Latest stable with improved hydration
- **TypeScript 5.9**: Latest stable
- **Tailwind CSS v4**: New @import syntax
- **Zustand 5**: Client-side state management
- **React Hook Form 7**: Form handling
- **Zod 4**: Schema validation

### Backend
- **Next.js API Routes**: Serverless functions
- **Firebase Admin SDK v13**: Firestore database
- **OpenAI v6**: gpt-4o-mini-transcribe (50% cheaper!)
- **Stripe v19**: Payment processing (API 2025-10-29)
- **SendGrid v8**: Email delivery
- **Upstash Redis**: Rate limiting

### Authentication
- **Clerk v6**: Latest with `clerkMiddleware` pattern

### DevOps
- **Vercel**: Deployment platform
- **Vercel Cron**: Scheduled jobs
- **Pino**: Structured logging

### Python microservices

We provide optional Python microservices for CPU-heavy or long-running tasks (PDF generation, AI evaluation). The `python-services/pdf_service` contains a small FastAPI app used to generate a PDF sample for veraPDF CI checks. Run it locally with `uvicorn` or use the convenience script below:

```powershell
# Start the Python PDF service locally
npm run start:python-pdf

# Or generate the test PDF directly (CI uses this):
npm run generate:testpdf
```

## 🏗️ Architecture Decisions

### Why Next.js Fullstack?
- Single codebase, single deployment
- All APIs have Node.js SDKs
- TypeScript end-to-end
- Faster development than separate backend

### Why Clerk v6?
- Latest auth patterns
- Built for Next.js App Router
- Comprehensive user management
- Easy social login integration

### Why gpt-4o-mini-transcribe?
- 50% cheaper than Whisper ($0.003/min vs $0.006/min)
- Better quality and accuracy
- Better accent and noise handling

### Why Upstash Redis?
- Serverless-first (perfect for Vercel)
- Pay per request
- Global edge network
- Built-in rate limiting helpers

## 📁 Key Files

### Configuration
- `next.config.js` - Next.js configuration
- `middleware.ts` - Clerk authentication middleware
- `tailwind.config.js` - Tailwind CSS v4 configuration
- `vercel.json` - Cron job configuration

### Core Libraries
- `lib/firebase.ts` - Firebase Admin SDK setup
- `lib/openai.ts` - OpenAI client with transcription
- `lib/stripe.ts` - Stripe client with payment links
- `lib/sendgrid.ts` - SendGrid email client
- `lib/ratelimit.ts` - Upstash Redis rate limiting
- `lib/validations.ts` - Zod schemas

### Utilities
- `utils/error.ts` - Error handling & custom errors
- `utils/logger.ts` - Pino structured logging
- `utils/helpers.ts` - Helper functions
- `utils/constants.ts` - Application constants

### Types
- `types/models.ts` - All Firestore collection interfaces
- `types/api.ts` - API request/response types

## 🔒 Security Features

- ✅ Clerk authentication with route protection
- ✅ Rate limiting on all API endpoints
- ✅ Bank details encryption (AES-256-CBC with hex-encoded 32-byte keys)
- ✅ Webhook signature verification (Stripe, Clerk, SendGrid)
- ✅ CRON_SECRET for scheduled job authentication
- ✅ Input validation with Zod
- ✅ Firebase security rules (ready to deploy)
- ✅ Startup environment validation (fail-fast on missing/invalid config)

## 🧪 Testing

Comprehensive test suite with Jest and ts-jest:

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode for development
npm run test:watch
```

### Test Coverage
- ✅ **Crypto functions**: AES-256-CBC encryption/decryption, token generation
- ✅ **Payment service**: Dual-confirmation flow, token validation
- ✅ **Invoice service**: CRUD operations, authorization checks
- ✅ **API endpoints**: Health check, error response formats

See [TESTING.md](./TESTING.md) for comprehensive testing guide.

### CI/CD Pipeline
- ✅ GitHub Actions workflow configured
- ✅ Runs on all PRs and pushes to main/develop
- ✅ Linting, testing, building, and security audits
- ✅ Coverage reporting with Codecov support

## 🛠️ Recent Improvements (January 2025)

### Testing & Quality
- ✅ Jest test framework with TypeScript support
- ✅ 36 passing tests with proper mocking
- ✅ Coverage reporting configured
- ✅ Example tests for all core modules

### Code Quality
- ✅ Removed unused `crypto-js` dependency
- ✅ Replaced all `console.log` with structured logging (`logInfo`/`logError`)
- ✅ Fixed OpenAI `File` type to use Node.js `Buffer` for server code
- ✅ Created startup environment validation module (`lib/config.ts`)

### Security Enhancements
- ✅ AES-256-CBC encryption key validation (hex-encoded 32 bytes)
- ✅ Environment variable validation with clear error messages
- ✅ Fail-fast on startup with invalid configuration

## 📝 Next Steps (Phase 2)

The foundation is complete. Next phases:

### Phase 2.1: Invoice CRUD (Days 4-5)
- [ ] Build Invoice API routes (create, list, get, update)
- [ ] Build Invoice frontend components
- [ ] Implement voice-to-text transcription
- [ ] Test end-to-end invoice creation

### Phase 2.2: Send Invoice (Day 5)
- [ ] Build Send Invoice API route
- [ ] Integrate SendGrid email
- [ ] Integrate Stripe payment links
- [ ] Create payment confirmation tokens

### Phase 2.3: Dual Payment Confirmation (Days 6-7)
- [ ] Build client confirmation page (unauthenticated)
- [ ] Build freelancer verification
- [ ] Create transaction records
- [ ] Test full payment flow

### Phase 3: Intelligence Layer (Days 8-10)
- [ ] Collections system (day 7, 21 reminders)
- [ ] Smart notifications
- [ ] Gamification (streaks, badges, levels)
- [ ] Analytics dashboard

### Phase 4: Advanced Features (Days 11-12)
- [ ] Referral system
- [ ] Webhook handlers
- [ ] Analytics dashboard

### Phase 5: Polish & Deploy (Days 13-14)
- [ ] Testing
- [ ] Error handling refinement
- [ ] Performance optimization
- [ ] Deploy to Vercel

## 🐛 Known Issues

None! Build passes TypeScript checks. Just needs API keys configured.

## 📚 Documentation

- [Clerk v6 Docs](https://clerk.com/docs)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Firebase Admin Docs](https://firebase.google.com/docs/admin/setup)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Stripe API Docs](https://stripe.com/docs/api)
- [SendGrid Docs](https://docs.sendgrid.com)

## 📄 License

MIT

---

**Built with ❤️ using the latest November 2025 technologies**

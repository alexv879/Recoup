# Recoup: UK Freelancer Revenue Recovery Platform

> **Find the money you're leaving on the table.**

Recoup helps UK freelancers maximize their take-home by tracking billable expenses, automating client recharges, and preparing for MTD (Making Tax Digital) compliance.

## 🚀 What Makes Recoup Different

Unlike generic accounting tools (Xero, QuickBooks), Recoup focuses on **revenue recovery**:

- **Client Recharging**: Track which expenses you can bill back to clients
- **Tax Recoupment**: Calculate tax savings (20-45% on deductible expenses)
- **"Total Recouped" Dashboard**: See exactly how much money you've recovered
- **MTD-Ready**: Feature-flagged HMRC integration for April 2026 mandate

## 💰 Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Free** | £0/month | 50 expenses, 10 invoices, basic collections |
| **Pro** | £10/month | Unlimited expenses/invoices, OCR, SMS, analytics |
| **MTD-Pro** | £20/month | All Pro + HMRC quarterly filing (when approved) |

**Annual discount**: 20% (£96/year for Pro, £192/year for MTD-Pro)

## 🏗️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (serverless)
- **Database**: Firebase/Firestore
- **Auth & Billing**: Clerk v6 (handles both authentication AND subscriptions)
- **Client Payments**: Stripe Payment Links (direct to freelancer)
- **OCR**: OpenAI Vision (gpt-4o-mini)
- **Encryption**: AES-256-GCM (for HMRC tokens)
- **Deployment**: Vercel

## 📦 Key Features

### ✅ Implemented (Backend Complete)

- [x] Expense tracking with UK HMRC categories
- [x] Receipt upload with OCR (OpenAI Vision)
- [x] Billable expense flagging
- [x] Revenue recovery metrics calculation
- [x] Expense → Invoice conversion
- [x] MTD OAuth flow (feature-flagged)
- [x] HMRC API client (stubbed, ready to activate)
- [x] GDPR export/delete endpoints
- [x] Firebase security rules
- [x] Encrypted token storage

### 🚧 In Progress (Frontend)

- [x] Expense form component
- [x] Expense list page
- [x] Revenue recovery dashboard
- [x] MTD upgrade banner
- [ ] Invoice creation from expenses UI
- [ ] Client selector component
- [ ] Receipt thumbnail generation

### ⏳ Planned (Post-Launch)

- [ ] Mobile app (React Native)
- [ ] Bank feed integrations (Plaid/TrueLayer)
- [ ] HMRC sandbox testing
- [ ] HMRC production approval
- [ ] Bulk expense import
- [ ] Team collaboration features

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase project
- Clerk account
- OpenAI API key
- Stripe account

### Installation

```bash
# Clone the repo
git clone https://github.com/alexv879/Recoup.git
cd Recoup/recoup

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys (see below)

# Run dev server
npm run dev
```

### Environment Variables

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n"

# OpenAI (for OCR)
OPENAI_API_KEY=sk-xxx

# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=<64_character_hex_string>

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# HMRC (optional - for MTD features)
HMRC_CLIENT_ID=xxx
HMRC_CLIENT_SECRET=xxx
HMRC_REDIRECT_URI=http://localhost:3000/api/mtd/callback

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Deploy Firebase Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not already done)
firebase init

# Deploy security rules
firebase deploy --only firestore:rules,storage:rules
```

### Configure Clerk Subscriptions

**IMPORTANT**: Recoup uses Clerk for BOTH authentication AND subscription billing.

1. **Create Subscription Plans** in Clerk Dashboard:
   - Go to: https://dashboard.clerk.com → Billing
   - Create 3 plans:
     - **Free**: £0/month, slug: `free` or `expense_free`
     - **Pro**: £10/month (£96/year), slug: `pro_monthly` / `pro_annual`
     - **MTD-Pro**: £20/month (£192/year), slug: `mtd_pro_monthly` / `mtd_pro_annual`

2. **Set Up Webhook**:
   - Go to: Clerk Dashboard → Webhooks → Add Endpoint
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`, `subscription.created`, `subscription.updated`, `subscription.deleted`
   - Copy signing secret → Add to `.env.local` as `CLERK_WEBHOOK_SECRET`

3. **Add Clerk Domain** to `.env.local`:
   ```bash
   NEXT_PUBLIC_CLERK_DOMAIN=your-app.clerk.accounts.dev
   ```

**For detailed setup instructions**, see `CLERK_SUBSCRIPTION_SETUP.md`

## 📊 Database Schema

### Core Collections

- **users** - User profiles with subscription tiers
- **invoices** - Invoice management
- **expenses** - Expense tracking with OCR data
- **expense_receipts** - Receipt metadata
- **clients** - Client directory
- **transactions** - Payment tracking
- **mtd_authorizations** - HMRC OAuth tokens (encrypted)
- **mtd_submissions** - Tax submissions
- **mtd_obligations** - HMRC obligations

## 🔒 Security

- ✅ Firebase security rules (user isolation)
- ✅ Storage security rules (file validation)
- ✅ AES-256-GCM encryption for HMRC tokens
- ✅ GDPR compliant (export/delete endpoints)
- ✅ Receipt file type/size validation (10MB max)
- ✅ Clerk authentication (SSO, MFA)

## 🇬🇧 HMRC Integration (MTD)

### Current Status: ⏳ Awaiting Approval

The HMRC MTD integration is **built but feature-flagged**. To activate:

1. Register at https://developer.service.hmrc.gov.uk/
2. Create application ("Recoup")
3. Test in sandbox environment
4. Submit technical documentation
5. Wait for HMRC approval (8-12 weeks)
6. Update `user.mtdEnabled = true` to activate

### MTD Features (Ready to Activate)

- OAuth2 authorization flow
- Fraud prevention headers
- Quarterly update submissions
- VAT return filing
- Annual declarations
- Obligation tracking

## 📈 Metrics & Goals (90 Days)

**Acquisition:**
- 500 total signups
- 50% activation rate
- CAC < £20

**Revenue:**
- 50 paying users (10% conversion)
- £2,000 MRR
- <5% churn

**Product:**
- "Total Recouped" > £50,000 (across all users)
- 3+ expenses per user per week
- 60% 30-day retention

## 🛠️ Development

### Project Structure

```
/recoup
├── /app                    # Next.js App Router
│   ├── /api               # API endpoints
│   │   ├── /expenses      # Expense CRUD
│   │   ├── /revenue-recovery # Metrics
│   │   ├── /mtd           # HMRC OAuth (feature-flagged)
│   │   └── /gdpr          # Data export/delete
│   └── /dashboard         # Dashboard pages
├── /components            # React components
│   ├── /Expenses          # Expense UI
│   ├── /RevenueRecovery   # Dashboard UI
│   └── /MTD               # MTD components
├── /lib                   # Core utilities
│   ├── encryption.ts      # AES-256-GCM encryption
│   ├── openai-vision-ocr.ts # Receipt OCR
│   ├── revenue-recovery-calculator.ts # Metrics engine
│   ├── hmrc-client.ts     # HMRC API (stubbed)
│   ├── firebase.ts        # Database
│   └── pricing.ts         # Pricing tiers
└── /types                 # TypeScript interfaces
```

### Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Run ESLint

# Firebase
firebase deploy --only firestore:rules  # Deploy Firestore rules
firebase deploy --only storage:rules    # Deploy Storage rules

# Testing (TODO)
npm test                 # Run tests
npm run test:e2e         # E2E tests
```

## 🐛 Troubleshooting

### OCR Not Working
- Check `OPENAI_API_KEY` is set
- Verify receipt file is <10MB
- Ensure file type is image/* or application/pdf

### Firebase Errors
- Check `FIREBASE_PRIVATE_KEY` has `\n` for line breaks
- Deploy security rules: `firebase deploy --only firestore:rules`
- Verify service account has Firestore/Storage permissions

### HMRC Integration Inactive
- This is expected! MTD is feature-flagged off by default
- Users see "Join Waitlist" until HMRC approves
- Don't enable `user.mtdEnabled` until production approval

## 📚 Documentation

- **HMRC Developer Hub**: https://developer.service.hmrc.gov.uk/
- **OpenAI Vision Pricing**: https://openai.com/pricing
- **Firebase Security Rules**: https://firebase.google.com/docs/rules
- **Clerk Auth**: https://clerk.com/docs

## 🤝 Contributing

This is a solo-founder project. Contributions welcome after v1 launch!

## 📄 License

Proprietary - All rights reserved

## 🔗 Links

- **Website**: https://recoup.co.uk (TODO)
- **GitHub**: https://github.com/alexv879/Recoup
- **Support**: support@recoup.co.uk (TODO)

---

Built with ❤️ in the UK 🇬🇧

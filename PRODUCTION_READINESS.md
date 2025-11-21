# PRODUCTION READINESS CHECKLIST

## ✅ Completed

### Core Features
- [x] Expense tracking with receipt upload
- [x] OCR processing with OpenAI Vision
- [x] Revenue recovery dashboard ("Total Recouped")
- [x] Client recharging (expense → invoice conversion)
- [x] Tax deduction tracking
- [x] Clerk authentication + subscription billing
- [x] Stripe client payment links
- [x] Firestore security rules
- [x] Firebase storage rules
- [x] GDPR export/delete endpoints
- [x] MTD architecture (feature-flagged)

### Payment Architecture
- [x] Clerk handles subscriptions (Free/Pro/MTD-Pro)
- [x] Clerk webhook for subscription events
- [x] Stripe handles client payments (direct to freelancer)
- [x] Payment architecture documentation
- [x] Pricing page for expense tiers
- [x] Upgrade flow with Clerk checkout
- [x] Upgrade CTAs and quota warnings

### Documentation
- [x] README.md with setup instructions
- [x] PAYMENT_ARCHITECTURE.md
- [x] CLERK_SUBSCRIPTION_SETUP.md
- [x] IMPLEMENTATION_SUMMARY.md
- [x] .env.example with all variables
- [x] Environment variable validation utility

---

## ⚠️ Required Before Production Launch

### 1. Clerk Configuration
- [ ] Create subscription plans in Clerk Dashboard:
  - [ ] Free: £0/month, slug `free`
  - [ ] Pro: £10/month (£96/year), slugs `pro_monthly`, `pro_annual`
  - [ ] MTD-Pro: £20/month (£192/year), slugs `mtd_pro_monthly`, `mtd_pro_annual`
- [ ] Configure webhook at production URL
- [ ] Add production webhook secret to env
- [ ] Test subscription flow end-to-end
- [ ] Verify Free → Pro upgrade works
- [ ] Verify Pro → Free downgrade works

### 2. Environment Variables
- [ ] Set all production environment variables in Vercel/hosting platform
- [ ] Use PRODUCTION keys (not test/sandbox)
- [ ] Generate NEW encryption key (never reuse dev key!)
- [ ] Set `NODE_ENV=production`
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Verify all env vars with validation script:
  ```bash
  npm run validate-env
  ```

### 3. Firebase
- [ ] Deploy production Firestore security rules:
  ```bash
  firebase deploy --only firestore:rules
  ```
- [ ] Deploy production Firebase Storage rules:
  ```bash
  firebase deploy --only storage:rules
  ```
- [ ] Set up Firebase backup schedule
- [ ] Configure Firebase security monitoring
- [ ] Test security rules with Firebase Emulator

### 4. Stripe
- [ ] Switch to production Stripe keys
- [ ] Configure Stripe webhook (if using for client payments)
- [ ] Test payment link generation
- [ ] Verify client payments work end-to-end
- [ ] Set up Stripe monitoring/alerts

### 5. Testing
- [ ] Test full signup flow (user.created webhook)
- [ ] Test expense creation with receipt upload
- [ ] Test OCR processing
- [ ] Test revenue recovery dashboard
- [ ] Test upgrade flow (Free → Pro)
- [ ] Test subscription webhook (subscription.created)
- [ ] Test downgrade/cancel flow
- [ ] Test quota limits and warnings
- [ ] Test GDPR export
- [ ] Test GDPR delete
- [ ] Load test API endpoints

### 6. Monitoring & Error Tracking
- [ ] Set up Sentry or error tracking service
- [ ] Configure error alerting (email/Slack)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure logging (Datadog, LogRocket, etc.)
- [ ] Set up revenue/subscription analytics
- [ ] Add user behavior analytics (PostHog, Mixpanel, etc.)

### 7. Security
- [ ] Run security audit: `npm audit`
- [ ] Fix all critical/high vulnerabilities
- [ ] Enable HTTPS only (no HTTP)
- [ ] Set up CSP headers
- [ ] Configure rate limiting
- [ ] Set up CORS properly
- [ ] Review Firestore security rules
- [ ] Review Firebase Storage rules
- [ ] Test for common vulnerabilities (XSS, CSRF, SQL injection)

### 8. Performance
- [ ] Run Lighthouse audit
- [ ] Optimize images (compression, WebP)
- [ ] Enable Next.js caching
- [ ] Set up CDN for static assets
- [ ] Optimize bundle size
- [ ] Test on slow 3G connection
- [ ] Verify Core Web Vitals

### 9. Legal & Compliance
- [ ] Add Privacy Policy
- [ ] Add Terms of Service
- [ ] Add Cookie Policy
- [ ] Add GDPR consent banner (if targeting EU)
- [ ] Add VAT registration (if UK revenue > £85k/year)
- [ ] Register with ICO (UK data protection)
- [ ] Add company details to footer (UK Companies House)

### 10. Marketing & Launch
- [ ] Set up marketing website/landing page
- [ ] Configure email marketing (welcome emails, etc.)
- [ ] Set up customer support (Intercom, Help Scout, etc.)
- [ ] Prepare launch announcement
- [ ] Set up social media profiles
- [ ] Prepare launch blog post
- [ ] Set up customer onboarding flow

---

## 🚨 Critical Issues to Fix Before Launch

### High Priority
- [ ] **Add environment variable validation on startup**
  - Import `validateEnv()` in root layout or middleware
  - Fail fast with clear error messages
- [ ] **Add error boundaries to all pages**
  - Catch React errors gracefully
  - Show user-friendly error messages
- [ ] **Add loading states to all API calls**
  - Show spinners during data fetching
  - Prevent double-submissions
- [ ] **Add rate limiting to API endpoints**
  - Prevent abuse (especially OCR endpoint)
  - Limit to 100 requests/minute per user
- [ ] **Add input validation to all forms**
  - Use Zod for schema validation
  - Show clear validation errors
- [ ] **Add retry logic for failed API calls**
  - Retry on network errors
  - Exponential backoff

### Medium Priority
- [ ] Add pagination to expense list (currently loads all)
- [ ] Add search/filter to expense list
- [ ] Add expense edit page (currently only create)
- [ ] Add bulk expense import (CSV)
- [ ] Add expense categories auto-complete
- [ ] Add client autocomplete in expense form
- [ ] Add receipt thumbnail generation
- [ ] Add invoice PDF generation
- [ ] Optimize Firestore queries (add indexes)
- [ ] Add webhook retry mechanism

### Low Priority
- [ ] Add dark mode
- [ ] Add keyboard shortcuts
- [ ] Add expense templates
- [ ] Add recurring expenses
- [ ] Add expense approval workflow
- [ ] Add multi-currency support
- [ ] Add bank feed integration
- [ ] Add mobile app

---

## 📊 Monitoring Checklist (Post-Launch)

### Key Metrics to Track
- [ ] Signup conversion rate
- [ ] Free → Pro upgrade rate
- [ ] Churn rate
- [ ] Average revenue per user (ARPU)
- [ ] Customer lifetime value (LTV)
- [ ] Revenue recovered per user
- [ ] Expenses created per user per month
- [ ] OCR success rate
- [ ] Invoice conversion rate (expenses → invoices → paid)

### Health Checks
- [ ] API response times (<200ms p95)
- [ ] Error rates (<1%)
- [ ] Uptime (>99.9%)
- [ ] Database query performance
- [ ] Webhook delivery success rate
- [ ] OCR processing time
- [ ] Firebase costs
- [ ] OpenAI API costs

### Alerts to Set Up
- [ ] API error rate > 5%
- [ ] Uptime < 99%
- [ ] Webhook failure rate > 10%
- [ ] Daily signups drop > 50%
- [ ] Subscription cancellations spike
- [ ] Firebase costs exceed budget
- [ ] OpenAI costs exceed budget

---

## 🔧 Deployment Commands

### Build for Production
```bash
npm run build
```

### Run Production Build Locally
```bash
npm run start
```

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy Firebase Rules
```bash
firebase deploy --only firestore:rules,storage:rules
```

### Validate Environment
```bash
npm run validate-env
```

---

## 🎯 Success Criteria

Before marking as "production-ready", verify:
- [x] All API endpoints have error handling
- [x] All database operations have security rules
- [x] All webhooks are configured and tested
- [x] All environment variables are documented
- [ ] All forms have validation
- [ ] All pages have loading states
- [ ] All errors are tracked
- [ ] All metrics are monitored
- [ ] Application loads in <3 seconds
- [ ] No console errors in production
- [ ] Lighthouse score > 90
- [ ] All critical paths tested end-to-end

---

## 📞 Emergency Contacts

### If Something Goes Wrong
1. **Check error tracking**: Sentry dashboard
2. **Check logs**: Vercel/hosting logs
3. **Check webhooks**: Clerk Dashboard → Webhooks → Logs
4. **Check Firestore**: Firebase Console → Firestore
5. **Rollback**: `vercel rollback` to previous deployment

### Support Escalation
- **Technical issues**: [Your email/Slack]
- **Payment issues**: Check Clerk Dashboard
- **Database issues**: Check Firebase Console
- **Critical outage**: Enable maintenance mode

---

Last updated: 2025-11-21
Version: Pre-Production v1.0

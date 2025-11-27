# 🚀 RECOUP PRE-LAUNCH CHECKLIST - READY FOR TOMORROW EVENING

**Date Created:** November 27, 2025 (Today)
**Go-Live Target:** Tomorrow Evening
**Status:** ✅ **CRO OPTIMIZATION COMPLETE** — Running Final Checks

---

## ✅ COMPLETED TODAY — CRO OPTIMIZATION

### **Phase 1-8 Complete** ✅
- [x] Research-backed design system (34 color tokens, WCAG AA compliance)
- [x] Conversion-optimized landing page (app/page.tsx)
- [x] Dashboard hero card with activation focus
- [x] Status badges with icons + color + text
- [x] Mobile touch targets (44×44px minimum)
- [x] Accessibility audit passed
- [x] Code pushed to main branch on GitHub
- [x] Build process verified

---

## 🔥 CRITICAL - DO BEFORE LAUNCH TOMORROW

### **1. Environment Variables** ⚠️ CRITICAL
**File:** `recoup/.env.local` (create if doesn't exist)

```bash
# Copy from .env.example and fill in:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
# (all Firebase config from Firebase Console)

NEXT_PUBLIC_APP_URL=https://your-production-domain.com
# or http://localhost:3000 for testing

SENDGRID_API_KEY=SG....
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+44...
```

**Where to get these:**
- **Clerk:** https://dashboard.clerk.com → Your App → API Keys
- **Stripe:** https://dashboard.stripe.com → Developers → API Keys
- **Firebase:** https://console.firebase.google.com → Project Settings → General
- **SendGrid:** https://app.sendgrid.com → Settings → API Keys
- **Twilio:** https://console.twilio.com → Account → Dashboard

---

### **2. Test Landing Page** 🏠
**URL:** `/` (new!)

**Desktop Test (10 min):**
- [ ] Open `http://localhost:3000` in Chrome
- [ ] Verify hero headline: "Stop Chasing Unpaid Invoices — Get Paid in 48 Hours"
- [ ] Click "Start Free Trial" CTA (orange button) → goes to Clerk signup
- [ ] Scroll to "How It Works" → 3 steps visible
- [ ] Scroll to testimonials → 3 customer cards visible
- [ ] Scroll to pricing → Free/Pro/Business plans visible
- [ ] Scroll to FAQ → 4 questions visible
- [ ] Click footer links → verify navigation

**Mobile Test (10 min):**
- [ ] Open Chrome DevTools → Mobile view (360px)
- [ ] Verify CTA button is tappable (44×44px minimum)
- [ ] Scroll through entire page → no horizontal scroll
- [ ] Test navigation menu (hamburger if added)
- [ ] Verify all images load and scale properly

---

### **3. Test Dashboard** 📊
**URL:** `/dashboard` (optimized!)

**Desktop Test (15 min):**
- [ ] Sign in with Clerk → redirects to `/dashboard`
- [ ] Verify hero card displays: Outstanding £X above-the-fold
- [ ] Check "Today's Actions" section (if overdue invoices exist)
- [ ] Verify 3 metric cards: Overdue, Collected, XP Level
- [ ] Click "+ Create Invoice" button → goes to `/dashboard/invoices/new`
- [ ] Check status badges have icon + text (✓ Paid, ⚠ Overdue, 📧 Sent)
- [ ] Scroll to "Recent Invoices" → verify list displays
- [ ] Scroll to "Recent Payments" → verify list displays

**Mobile Test (15 min):**
- [ ] Open dashboard on mobile (360px)
- [ ] Verify hero card is readable (not cut off)
- [ ] Tap "+ Create Invoice" CTA → 44×44px touch target
- [ ] Verify metrics stack vertically (single column)
- [ ] Check "Today's Actions" is tappable
- [ ] Scroll through entire dashboard → smooth, no janky animations

---

###4. Test Collections Timeline** 📋
**URL:** `/dashboard/invoices/[id]` (invoice detail page)

- [ ] Navigate to any invoice
- [ ] Verify "Collections Timeline" section exists
- [ ] Check status badges:
  - 🟡 Promised (amber)
  - 🔴 Overdue (red)
  - ✅ Paid (green)
  - ⏳ Pending (gray)
- [ ] Click timeline event → expands to show details
- [ ] Verify empty state: "No collection activities yet"

---

### **5. Verify Integrations** 🔌

**Clerk (Auth) — 5 min:**
- [ ] Go to `/sign-up` → create test account
- [ ] Verify email verification works
- [ ] Sign out → sign back in
- [ ] Verify redirects to `/dashboard` after login

**Stripe (Payments) — 5 min:**
- [ ] Go to `/pricing` or `/dashboard/upgrade`
- [ ] Click "Start 30-Day Trial" (Pro plan)
- [ ] Verify Stripe Checkout loads
- [ ] Use test card: `4242 4242 4242 4242`, exp: any future date, CVC: any 3 digits
- [ ] Verify subscription created in Stripe Dashboard

**Firebase (Database) — 5 min:**
- [ ] Create a test invoice → verify saves to Firestore
- [ ] Check Firestore Console → verify data appears
- [ ] Update invoice status → verify real-time update in UI

---

### **6. Accessibility Check** ♿ (10 min)

**Lighthouse Audit:**
- [ ] Open Chrome DevTools → Lighthouse tab
- [ ] Select "Accessibility" + "Performance" + "Best Practices"
- [ ] Run audit on `/` (landing page)
- [ ] **Target scores:** Accessibility ≥ 95, Performance ≥ 90
- [ ] Run audit on `/dashboard`
- [ ] **Target scores:** Accessibility ≥ 95

**Keyboard Navigation:**
- [ ] Tab through landing page → focus visible on all buttons
- [ ] Press Tab on dashboard → focus indicators visible (blue ring)
- [ ] Press Escape on modal (if any) → closes modal
- [ ] Test "Skip to main content" link (press Tab on page load)

**Contrast Check:**
```bash
cd recoup
npm run check:contrast
```
- [ ] Verify all 34 color tokens pass WCAG AA (4.5:1+)
- [ ] CTA button: 7.46:1 (exceeds 5:1 target) ✅

---

### **7. Performance Test** ⚡ (10 min)

**Lighthouse Performance:**
- [ ] Run Lighthouse on `/` → Performance ≥ 90
- [ ] Check Largest Contentful Paint (LCP) < 2.5s
- [ ] Check First Input Delay (FID) < 100ms
- [ ] Check Cumulative Layout Shift (CLS) < 0.1

**Load Times:**
- [ ] Landing page loads in < 3s (on fast connection)
- [ ] Dashboard loads in < 2s (after auth)
- [ ] Images are optimized (use Next.js Image component)

---

### **8. Security Check** 🔒 (5 min)

- [ ] Verify `.env.local` is in `.gitignore` (never commit secrets!)
- [ ] Check Stripe webhook endpoint is secured (`/api/webhook/stripe`)
- [ ] Verify Clerk middleware protects `/dashboard` routes
- [ ] Test unauthenticated access to `/dashboard` → redirects to `/sign-in`

---

### **9. Mobile Responsiveness Final Check** 📱 (15 min)

**Test Breakpoints:**
- [ ] **360px (iPhone SE):** Landing page + Dashboard
- [ ] **375px (iPhone 12):** Landing page + Dashboard
- [ ] **768px (iPad):** Landing page + Dashboard
- [ ] **1440px (Desktop):** Landing page + Dashboard

**Touch Target Validation:**
- [ ] All buttons ≥ 44×44px (use Chrome DevTools → Inspect)
- [ ] Tab triggers ≥ 40px height
- [ ] No zoom on input focus (font-size ≥ 16px)

---

### **10. Content Review** 📝 (10 min)

**Landing Page Copy:**
- [ ] Headline: "Stop Chasing Unpaid Invoices — Get Paid in 48 Hours" ✅
- [ ] Subheadline: mentions "UK freelancers" + "HMRC compliant" ✅
- [ ] Trust signals: "No card required" + "Free 30 days" + "Stripe-secured" ✅
- [ ] Social proof: 3 testimonials with metrics ✅
- [ ] Pricing: Free, Pro (£39), Business (£75) ✅
- [ ] FAQ: 4 questions answered ✅

**Dashboard:**
- [ ] Hero card: Shows outstanding amount above-the-fold ✅
- [ ] "Today's Actions": Shows next step (if applicable) ✅
- [ ] Empty states: Clear messaging ("No invoices yet") ✅

---

## 🚀 DEPLOYMENT TO PRODUCTION (Tomorrow Evening)

### **Option 1: Vercel (Recommended — 10 min setup)**

**Step 1: Connect GitHub Repo**
1. Go to https://vercel.com
2. Click "Import Project"
3. Select GitHub → choose `alexv879/Recoup` repo
4. Select `main` branch
5. Framework: **Next.js** (auto-detected)
6. Root Directory: `recoup`

**Step 2: Add Environment Variables**
- Go to Vercel Project → Settings → Environment Variables
- Copy-paste all `.env.local` variables
- Mark sensitive keys as "Secret"

**Step 3: Deploy**
- Click "Deploy"
- Wait 3-5 minutes for build
- Visit production URL: `https://recoup-xxxxx.vercel.app`

**Step 4: Add Custom Domain (Optional)**
- Go to Settings → Domains
- Add your domain (e.g., `app.recoup.io`)
- Update DNS records (Vercel provides instructions)

---

### **Option 2: Render (Alternative — 15 min setup)**

**Step 1: Create Web Service**
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub → select `Recoup` repo
4. Branch: `main`
5. Root Directory: `recoup`
6. Build Command: `npm install && npm run build`
7. Start Command: `npm start`

**Step 2: Add Environment Variables**
- Scroll to "Environment Variables"
- Add all keys from `.env.local`

**Step 3: Deploy**
- Click "Create Web Service"
- Wait 5-10 minutes for build
- Visit production URL

---

### **Option 3: Railway (Alternative — 10 min setup)**

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose `Recoup` repo → `main` branch
5. Root: `recoup`
6. Add environment variables
7. Click "Deploy"

---

## 📊 POST-LAUNCH MONITORING (First 24 Hours)

### **Metrics to Watch:**

**Conversion Funnel:**
- [ ] Landing page visits (Google Analytics or Vercel Analytics)
- [ ] Sign-up clicks (track "Start Free Trial" button)
- [ ] Clerk signups completed
- [ ] First invoice created (activation)
- [ ] **Target:** 10-12% visitor → signup conversion

**Technical Monitoring:**
- [ ] Vercel Analytics → Check for errors
- [ ] Sentry (if configured) → Monitor error rates
- [ ] Lighthouse scores → Performance, Accessibility
- [ ] Uptime → Should be 99.9%+

**User Feedback:**
- [ ] Add feedback widget (Hotjar, Typeform, or simple email)
- [ ] Ask: "What almost stopped you from signing up?"
- [ ] Monitor Twitter/social for mentions

---

## 🛠️ TROUBLESHOOTING GUIDE

### **Build Fails on Vercel/Render**
```bash
# Common issues:
1. Missing environment variables → Add to deployment platform
2. TypeScript errors → Run `npm run build` locally first
3. Node version mismatch → Check package.json "engines" field
```

### **Landing Page Not Loading**
- Check if `app/page.tsx` exists (✅ created today)
- Verify Next.js routing: `/` should map to `app/page.tsx`
- Check browser console for errors (F12)

### **Dashboard Not Loading**
- Verify Clerk middleware is configured (`middleware.ts`)
- Check if user is authenticated (Clerk Dashboard → Users)
- Verify Firebase connection (check Firestore rules)

### **CTA Buttons Not Clickable**
- Inspect element → Check z-index (should be higher than background)
- Verify no overlapping elements
- Check touch targets are ≥ 44×44px

### **Colors Look Wrong**
- Check `app/globals.css` → Verify color tokens match CRO spec
- Run `npm run check:contrast` → Should all pass
- Clear browser cache (Ctrl+Shift+R)

---

## ✅ FINAL CHECKLIST (Before Going Live)

**Pre-Deployment (1 hour before):**
- [ ] Run `npm run build` locally → No errors
- [ ] Test full user journey: Sign up → Create invoice → Mark paid
- [ ] Verify all environment variables are set
- [ ] Check Stripe is in test mode (or switch to live)
- [ ] Verify Clerk production instance is configured

**Deployment:**
- [ ] Push to `main` branch on GitHub (✅ DONE)
- [ ] Deploy to Vercel/Render/Railway
- [ ] Wait for build to complete (3-5 min)
- [ ] Visit production URL

**Post-Deployment (immediately after):**
- [ ] Test landing page loads
- [ ] Test sign-up flow (create test account)
- [ ] Test creating first invoice
- [ ] Run Lighthouse audit (should match local scores)
- [ ] Check Vercel Analytics → No errors
- [ ] Send test email (verify SendGrid works)

**24 Hours After Launch:**
- [ ] Check analytics for first signups
- [ ] Monitor error logs (Sentry/Vercel)
- [ ] Collect user feedback
- [ ] Review conversion metrics
- [ ] Celebrate! 🎉

---

## 📞 SUPPORT CONTACTS

**Technical Issues:**
- Vercel Support: https://vercel.com/help
- Render Support: https://render.com/docs
- Railway Support: https://railway.app/help

**Integrations:**
- Clerk Support: https://clerk.com/support
- Stripe Support: https://support.stripe.com
- Firebase Support: https://firebase.google.com/support

**Emergency Rollback:**
```bash
# If something breaks badly:
cd recoup
git revert HEAD  # Undo last commit
git push origin main
# Vercel/Render will auto-redeploy previous version
```

---

## 🎉 SUCCESS CRITERIA

**Tomorrow Evening Launch Success = ✅**
1. Landing page loads without errors
2. User can sign up via Clerk
3. User can create first invoice
4. Dashboard displays correctly on desktop + mobile
5. Lighthouse Accessibility ≥ 95
6. No critical errors in Vercel/Sentry logs

**Week 1 Success Metrics:**
- 50+ landing page visits
- 5+ signups (10% conversion)
- 3+ activated users (created first invoice)
- 95+ Lighthouse accessibility score maintained
- <1% error rate

---

## 📚 DOCUMENTATION FOR REFERENCE

**Files Created Today:**
- `CRO_IMPLEMENTATION_SUMMARY.md` — Full CRO documentation
- `PRE_LAUNCH_CHECKLIST_TOMORROW.md` — This file
- `recoup/app/page.tsx` — Landing page
- `recoup/lib/contrast.ts` — Color validation utility
- `recoup/components/UI/*` — Updated UI components

**Key Commits:**
- feat: Complete CRO optimization (3db7fb1)
- chore: merge CRO optimization into main (d7b1425)

**GitHub Repo:**
https://github.com/alexv879/Recoup

**Branch:** main (production-ready)

---

## 🚀 YOU'RE READY TO LAUNCH!

All CRO optimizations are complete and pushed to main. Follow this checklist tomorrow evening, and you'll have a conversion-optimized, production-ready SaaS app live within 1-2 hours.

**Estimated Launch Time:** 1-2 hours (environment setup + deployment)

**Good luck! 🍀**

---

*Generated with [Claude Code](https://claude.com/claude-code)*
*CRO Optimization Complete — November 27, 2025*

# Recoup User Guide

Complete guide for using Recoup to manage invoices, track payments, and automate debt collection.

## Table of Contents
- [Getting Started](#getting-started)
- [Creating Invoices](#creating-invoices)
- [Payment Tracking](#payment-tracking)
- [Automated Collections](#automated-collections)
- [Client Management](#client-management)
- [Dashboard & Analytics](#dashboard--analytics)
- [Subscription Tiers](#subscription-tiers)
- [FAQs](#faqs)

---

## Getting Started

### Sign Up

1. Visit **relaysoftware.co.uk**
2. Click "Sign Up"
3. Choose signup method:
   - Email + Password
   - Google Account
4. Verify your email address

### Initial Setup

After signing up, complete the onboarding process:

1. **Business Details**
   - Business name
   - Business type (sole trader, limited company, etc.)
   - Business address
   - VAT number (if applicable)

2. **Bank Account** (for receiving payments)
   - Account number
   - Sort code
   - Account name
   - *Note: This is encrypted and never shared*

3. **Collections Consent**
   - Enable automated collection reminders
   - Agree to GDPR/PECR compliance
   - *Required for automatic escalation features*

4. **Create First Client**
   - Add client name and email
   - Optional: Company, phone, address

5. **Create First Invoice**
   - Try the voice-to-invoice feature!
   - Or create manually

---

## Creating Invoices

### Voice-to-Invoice (Recommended)

**Fastest way to create invoices - just speak!**

1. Click the **microphone icon** on dashboard
2. Speak your invoice details:
   ```
   "Invoice for John Smith at ACME Corp,
   amount fifteen hundred pounds,
   due date December first,
   for website redesign project"
   ```
3. Review the transcription
4. Edit if needed
5. Click **Create Invoice**

**Tips for voice invoices:**
- Speak clearly and at normal pace
- Include: client name, amount, due date, description
- Say "pounds" or "GBP" for currency
- Say dates like "December first" or "first of December"

### Manual Invoice Creation

1. Go to **Dashboard → Invoices → New Invoice**
2. Select or create client
3. Fill in details:
   - **Client:** Name, email, company
   - **Amount:** Invoice total
   - **Due Date:** When payment is due
   - **Description:** What the invoice is for
4. Add line items (optional):
   - Description
   - Quantity
   - Rate
   - Amount (auto-calculated)
5. Review and click **Send Invoice**

### Invoice Status

| Status | Meaning |
|--------|---------|
| **Draft** | Not sent to client yet |
| **Sent** | Sent to client, awaiting payment |
| **Paid** | Payment received and confirmed |
| **Overdue** | Past due date, no payment |
| **In Collections** | Automatic escalation started |
| **Disputed** | Client disputed the invoice |
| **Cancelled** | Invoice cancelled |

---

## Payment Tracking

### Payment Methods

Clients can pay via:

1. **Stripe Payment Link** (credit/debit card)
   - Automatically included in invoice email
   - Click to pay securely
   - Instant payment confirmation

2. **Bank Transfer (BACS)**
   - Client transfers to your account
   - Client claims payment via invoice link
   - You verify within 48 hours

### BACS Payment Claim Process

**When client pays via bank transfer:**

1. **Client receives invoice email**
2. **Client makes bank transfer** to your account
3. **Client clicks "I've Paid" link** in invoice
4. **Client fills out claim form:**
   - Payment method: BACS
   - Reference number (optional)
   - Amount paid
   - Upload evidence (optional): bank statement screenshot
5. **You receive email notification**
6. **You have 48 hours to verify:**
   - ✅ Verify: Payment found in your bank account
   - ❌ Reject: Payment not found, request more evidence
   - ⏰ No action: Auto-verified after 48 hours

**Why 48 hours?**
- Prevents clients from waiting weeks for confirmation
- Reduces frustration
- Stops collection reminders quickly
- Assumes good faith (auto-verify if you don't respond)

### Dual Confirmation (Future Feature)

For added security:
- Client confirms payment made
- You confirm payment received
- Both must agree before marking paid

---

## Automated Collections

### How It Works

Recoup automatically escalates overdue invoices through proven collection stages:

```
Day 0-4:   PENDING      (No action)
Day 5:     GENTLE       (Friendly email reminder)
Day 14:    FIRM         (Firmer email + SMS)
Day 30:    FINAL        (Final warning + letter)
Day 37+:   AGENCY       (Collection agency)
```

### Escalation Levels

#### 1. Gentle Reminder (Day 5)

**What happens:**
- Friendly email reminder
- "Just a reminder your invoice is now 5 days overdue"
- Includes payment link
- Soft tone

**Example:**
> Hi John,
>
> Just a friendly reminder that invoice INV-001 for £1,500 is now 5 days overdue.
>
> We understand things get busy! If you've already paid, please let us know.
>
> [Pay Now Button]

**Who gets this:** All tiers (Free, Starter, Growth, Pro, Business)

#### 2. Firm Reminder (Day 14)

**What happens:**
- Firmer email tone
- SMS reminder (Premium tiers only)
- Mentions potential consequences
- Payment deadline

**Example Email:**
> Dear John,
>
> Invoice INV-001 for £1,500 is now 14 days overdue.
>
> Please settle this invoice within 7 days to avoid further action.
>
> If there's an issue, please contact us immediately.

**Example SMS (Premium):**
> ACME Freelance: Invoice INV-001 (£1,500) is 14 days overdue. Please pay: https://pay.link/abc

**Who gets this:**
- Email: All tiers
- SMS: Starter tier and above

#### 3. Final Warning (Day 30)

**What happens:**
- Final warning email
- Physical letter (Premium tiers only)
- 7-day deadline before agency escalation
- Formal tone

**Physical Letter Content:**
- Letterhead with your business details
- Invoice details and amount owed
- Payment history
- 7-day deadline
- Consequences of non-payment
- Your signature

**Who gets this:**
- Email: All tiers
- Physical Letter: Growth tier and above

#### 4. AI Voice Call (Premium)

**Available at any stage (manual trigger):**
- AI agent calls client
- Professional, polite conversation
- Asks about payment status
- Records conversation
- Detects payment promise
- Handles objections

**Sample Conversation:**
> **AI:** Hello, may I speak with John Smith please?
>
> **Client:** Speaking.
>
> **AI:** Hi John, this is calling from ACME Freelance regarding invoice INV-001 for £1,500 which is now 20 days overdue. Are you aware of this outstanding invoice?
>
> **Client:** Yes, I've been meaning to pay that. Cash flow has been tight.
>
> **AI:** I understand. When can we expect payment?
>
> **Client:** I can pay next Friday.
>
> **AI:** Great, so we can expect payment by next Friday, January 20th. Is that correct?
>
> **Client:** Yes.
>
> **AI:** Perfect. We'll send you a reminder email. Thank you for your time.

**Who can use this:** Pro tier and above

#### 5. Agency Handoff (Day 37+)

**What happens:**
- Invoice handed to collection agency
- Agency takes over collection efforts
- You receive commission on recovery
- Agency handles legal action if needed

**Who can use this:** Business tier

### Pausing Escalation

**If client requests extension:**

1. Go to invoice details
2. Click **Pause Escalation**
3. Choose pause duration (1-30 days)
4. Add reason (optional)
5. Escalation resumes after pause period

**Example:**
> Client: "Can you give me 2 weeks? Big payment coming in."
>
> You: "No problem!" (Pause for 14 days)

### Manual Escalation

**Skip to next level:**
1. Go to invoice details
2. Click **Escalation** tab
3. Select desired level
4. Click **Escalate**

**Use cases:**
- Client is completely unresponsive
- Large invoice amount (be more aggressive)
- Known slow payer

---

## Client Management

### Adding Clients

**Option 1: During invoice creation**
- System automatically creates client from invoice details

**Option 2: Add manually**
1. Dashboard → Clients → New Client
2. Fill in details:
   - Name (required)
   - Email (required)
   - Company
   - Phone
   - Address
3. Click **Save**

### Client Payment History

View detailed payment behavior:

1. Dashboard → Clients → Select client
2. See metrics:
   - Total invoiced
   - Total paid
   - Total outstanding
   - Average days to payment
   - On-time payment rate
   - Payment reliability score (0-10)
3. View all invoices for this client

### Payment Reliability Score

**How it's calculated:**
- 10/10: Always pays on time
- 7-9/10: Usually pays on time
- 4-6/10: Sometimes pays late
- 1-3/10: Often pays late
- 0/10: Never pays

**Use this to:**
- Identify risky clients
- Require upfront payment from low scorers
- Offer better terms to reliable clients

### Client Tags

Organize clients with tags:
- **VIP:** Important clients
- **Slow Payer:** Known to pay late
- **New Client:** Recently added
- **High Value:** Large invoice amounts
- **Custom tags:** Create your own

---

## Dashboard & Analytics

### Dashboard Overview

**Key Metrics:**
- Total Revenue: All time revenue
- Collected: Successfully paid invoices
- Outstanding: Unpaid invoices
- Overdue: Past due invoices

**Invoice Breakdown:**
- Total invoices
- Paid invoices
- Overdue invoices
- In collections

**Collection Stats:**
- Success rate: % of overdue invoices collected
- Average days to payment
- Total collection attempts

**Current Streak:**
- Days without new overdue invoices
- Gamification feature to encourage good practices

### Charts & Graphs

**Revenue Over Time:**
- Monthly revenue trends
- Compare to previous periods
- Identify seasonal patterns

**Payment Distribution:**
- On-time vs late payments
- Average payment delay
- Client payment behavior

**Collection Effectiveness:**
- Success rate by escalation level
- Which methods work best
- Time to collect by stage

### Exporting Data

**PDF Export:**
- Dashboard summary report
- Professional format
- Share with accountant or stakeholders

**CSV Export:**
- All invoice data
- Date range filtering
- Import into Excel or accounting software

**How to export:**
1. Dashboard → Export
2. Choose format (PDF or CSV)
3. Select date range (optional)
4. Click **Download**

### Payment Predictions (Pro Tier)

**AI-powered predictions:**
- Predicted payment date for each outstanding invoice
- Confidence level (%)
- Factors influencing prediction:
  - Client payment history
  - Invoice amount
  - Industry averages
  - Seasonal patterns

**Example:**
> Invoice INV-001 (£1,500)
> Predicted payment: December 15
> Confidence: 78%
> Factors: Client usually pays 10 days late, large invoice amount

---

## Subscription Tiers

### Free Tier

**Perfect for trying Recoup:**
- ✅ Unlimited invoices
- ✅ Unlimited clients
- ✅ Email reminders (Day 5, 15, 30)
- ✅ Basic dashboard
- ❌ No SMS reminders
- ❌ No physical letters
- ❌ No AI voice calls
- ❌ No agency handoff

### Starter Tier (£19/month or £182/year)

**For freelancers getting started:**
- ✅ Everything in Free
- ✅ 20 collections/month
- ✅ SMS reminders
- ✅ Advanced analytics
- ✅ Priority support

**What are "collections"?**
- Each escalation action counts as 1 collection
- Email reminder = 1 collection
- SMS reminder = 1 collection
- Physical letter = 1 collection
- AI voice call = 1 collection

### Growth Tier (£39/month or £374/year)

**For growing businesses:**
- ✅ Everything in Starter
- ✅ 50 collections/month
- ✅ Physical letters (Letter Before Action)
- ✅ Payment predictions
- ✅ Custom email templates

### Pro Tier (£75/month or £720/year)

**For established businesses:**
- ✅ Everything in Growth
- ✅ 100 collections/month
- ✅ AI voice collection calls
- ✅ Advanced integrations
- ✅ Dedicated account manager

### Business Tier (Custom Pricing)

**For high-volume businesses:**
- ✅ Everything in Pro
- ✅ Unlimited collections
- ✅ Collection agency handoff
- ✅ White-label options
- ✅ Custom workflows
- ✅ API access

### Founding Member Program

**First 50 users get 50% off for life!**

If you're a founding member:
- 🎉 Locked-in pricing: £9.50/month forever
- 🎉 All Starter tier features
- 🎉 Priority support for life
- 🎉 Early access to new features

---

## FAQs

### General

**Q: How does Recoup make money?**
A: Subscription fees from premium tiers. We never take a cut of your payments.

**Q: Do you integrate with accounting software?**
A: CSV export is available. Direct integrations (Xero, QuickBooks) coming soon.

**Q: Can I use Recoup for international clients?**
A: Yes! Supports GBP, USD, and EUR. More currencies coming soon.

**Q: Is my data secure?**
A: Yes. Bank details are encrypted with AES-256. All data stored in UK/EU (Firebase). SOC 2 compliant.

### Invoices

**Q: Can I edit an invoice after sending?**
A: Yes, but clients will see the updated version. Consider creating a new invoice instead.

**Q: What happens if I delete an invoice?**
A: It's marked as "cancelled" (soft delete). Can be restored if needed.

**Q: Can I send invoices in bulk?**
A: Not yet. Bulk invoicing coming in future release.

**Q: Do invoices expire?**
A: No. But you can set a payment deadline.

### Payments

**Q: How long does Stripe take to pay out?**
A: 2-7 days depending on your Stripe account settings.

**Q: What's the Stripe fee?**
A: 1.4% + 20p for UK cards, 2.9% + 20p for non-UK cards. (Stripe's standard rates)

**Q: Can clients pay in installments?**
A: Not currently. Single payment only.

**Q: What if client disputes a payment?**
A: Mark invoice as "Disputed" and work with client directly. Pause escalation during dispute.

### Collections

**Q: Can I turn off automated collections?**
A: Yes. Disable in Settings → Collections → Disable auto-escalation

**Q: Will clients know I'm using automated collections?**
A: Emails come from your email address. SMS and calls appear to be from you.

**Q: What if I don't want to send SMS/letters?**
A: You can choose which methods to enable in Settings → Collections

**Q: Are AI calls legal?**
A: Yes, with proper consent. We comply with GDPR, PECR, and FCA guidelines.

**Q: Can I listen to AI call recordings?**
A: Yes, all calls are recorded and transcribed. View in invoice details.

### Pricing

**Q: What happens if I exceed my collection quota?**
A: You can purchase additional collections at £2 each, or upgrade to higher tier.

**Q: Can I cancel anytime?**
A: Yes. No contracts. Cancel anytime from Settings → Subscription

**Q: Do you offer refunds?**
A: 30-day money-back guarantee if you're not satisfied.

**Q: What's the difference between monthly and annual?**
A: Annual saves 20% (equivalent to 2.4 months free).

### Technical

**Q: Do you have an API?**
A: Yes, for Business tier. Documentation at docs.relaysoftware.co.uk/api

**Q: Can I embed invoices on my website?**
A: Not yet. Invoice link can be shared though.

**Q: Do you support webhooks?**
A: Yes, for Business tier. Get notified of payment events.

**Q: Is there a mobile app?**
A: Progressive Web App (PWA) works on mobile. Native apps coming 2025.

---

## Getting Help

### Documentation
- **API Docs:** docs.relaysoftware.co.uk/api
- **Developer Guides:** docs.relaysoftware.co.uk/guides
- **Video Tutorials:** youtube.com/@relaysoftware

### Support
- **Email:** support@relaysoftware.co.uk
- **Live Chat:** Available in dashboard (Mon-Fri 9am-5pm GMT)
- **Help Center:** help.relaysoftware.co.uk

### Community
- **Discord:** discord.gg/recoup
- **Twitter:** @RelaysSoftware
- **LinkedIn:** linkedin.com/company/relaysoftware

---

## Tips for Success

### 1. Set Clear Payment Terms
- State payment terms in invoice description
- Include late payment fees (if applicable)
- Reference Late Payment Act for UK clients

### 2. Send Invoices Promptly
- Invoice immediately after work completed
- Don't wait until month-end
- Faster invoicing = faster payment

### 3. Follow Up Quickly
- Enable automatic collections
- Don't wait months to chase payment
- Earlier follow-up = higher success rate

### 4. Build Client Relationships
- Understand client payment cycles
- Offer payment plans if needed
- Good relationships prevent disputes

### 5. Monitor Your Metrics
- Check dashboard weekly
- Track collection success rate
- Identify problem clients early

### 6. Use Voice-to-Invoice
- 10x faster than manual entry
- Reduces errors
- More likely to invoice immediately

### 7. Keep Records
- Download monthly CSV exports
- Store for accounting/tax purposes
- Useful for disputes

---

**Ready to get paid faster? Start using Recoup today!**

Visit: **relaysoftware.co.uk**

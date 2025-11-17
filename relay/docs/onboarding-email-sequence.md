# ONBOARDING EMAIL BEST PRACTICES FOR SAAS FREEMIUM

**Complete 5-Email Sequence, Design Principles & Behavioral Triggers**

---

## PART 1: 5-EMAIL ONBOARDING SEQUENCE

### Overview

**Goals:**
- Get users to experience core value ("first invoice created")
- Build habit (daily/weekly usage)
- Identify upgrade opportunities
- Reduce churn and increase LTV

**Spacing:** 1 email per 2-4 days (7-14 day total sequence)[202]
- Allows time for user to explore
- Doesn't overwhelm with too many emails
- Sequence of 4-7 emails optimal for freemium SaaS[205]

---

### Email 1: Welcome (Day 0 - Immediate)

**Goal:** Orient user; explain what Relay does; first action (create invoice)

**Subject Line Options:**
- "Welcome to Relay — Let's get you paid faster" (benefit-focused)
- "Start collecting today" (action-focused)
- "Welcome aboard! Your first invoice awaits" (friendly)

**Preview Text:** "Quick start: create your first invoice in 3 minutes"

**Email Copy:**

```
Subject: Welcome to Relay — Let's get you paid faster

Hi [First Name],

Welcome to Relay! 🎉

You've just joined thousands of freelancers and agencies 
collecting payments faster and easier.

Here's what Relay does:
✓ Create and send professional invoices in 2 minutes
✓ Automatic payment reminders (get paid on time)
✓ Track overdue invoices at a glance
✓ Recover late payments automatically (Pro feature)

YOUR FIRST STEP: Create an invoice

Ready? Click below to create your first invoice:

[BUTTON: Create Your First Invoice]

(Takes 3 minutes, promise!)

Questions? Reply to this email anytime.

Best,
[Your Name]
CEO, Relay
```

**Design Notes:**
- Plain text or minimal HTML (personal feel)[215]
- Single CTA ("Create Your First Invoice")
- Mobile-optimized
- Sender: "Alex from Relay" (personal) vs "Relay Team" (formal)
  - Recommendation: Personal tone = higher open rates[206]

**Expected Metrics:**
- Open rate: 45-55% (welcome emails perform best)
- Click rate: 15-25% (high engagement expected)
- Conversion to action: 30-40% create first invoice

---

### Email 2: Tutorial (Day 1)

**Goal:** Walk through invoice creation; reduce friction; create first value

**Trigger:** If user hasn't created invoice in 24 hours

**Subject Line Options:**
- "How to create your first invoice in 3 minutes" (specific, helpful)
- "Your 3-minute tutorial" (curiosity)
- "[Name], let's create your first invoice" (personal)

**Preview Text:** "Step-by-step guide with screenshots"

**Email Copy:**

```
Subject: How to create your first invoice in 3 minutes

Hi [Name],

Ready to create your first invoice?

I'll walk you through it step-by-step (it's easier than you think):

STEP 1: Click "Create Invoice"
→ [Screenshot of dashboard with Create button highlighted]

STEP 2: Enter client details (name, email)
→ [Screenshot of client form]

STEP 3: Add invoice items (what you're billing for)
→ [Screenshot of items form]

STEP 4: Review and send
→ [Screenshot of send confirmation]

That's it! Your invoice is on its way to [client name].

[BUTTON: Create Invoice Now]

Pro tip: You can customize the email your client receives, 
add your logo, or use payment links for faster payments.

Questions? Just reply to this email.

Talk soon,
[Your Name]
```

**Design Notes:**
- Include screenshots or GIFs (visual learning)
- Video optional but recommended (higher engagement)[208]
- One clear message: "Creating an invoice is easy"
- Single CTA aligned to message

**Behavioral Trigger:**
```
IF user.status == "free" AND 
   user.invoices_created == 0 AND 
   days_since_signup >= 1
THEN send Email 2
```

**Expected Metrics:**
- Open rate: 40-50%
- Click rate: 10-15%
- Conversion: 25-35% create invoice

---

### Email 3: Social Proof & Value (Day 3)

**Goal:** Build confidence; show other users finding value; reinforce benefits

**Trigger:** Sent on Day 3 regardless (time-based, not behavioral)

**Subject Line Options:**
- "Why 84% of freelancers use automated reminders" (stat-based)
- "See how other freelancers recover late payments" (social proof)
- "The one thing we hear most from users" (curiosity)

**Preview Text:** "How automated reminders change your cash flow"

**Email Copy:**

```
Subject: Why 84% of freelancers use automated reminders

Hey [Name],

Quick stat: 84% of Relay users have reminders enabled.

Why? Because reminders work.

Here's what happens without them:
❌ 22% of invoices get paid late
❌ You chase clients manually
❌ Revenue forecasting becomes impossible

Here's what happens with Relay:
✓ Automatic reminder sent 5 days after due date
✓ Another on day 10, then final notice on day 14
✓ 55% of overdue invoices paid after first reminder

"I've collected £8,500 more this year just by 
using Relay's reminders. Seriously." 
— Tom, Manchester-based designer

What users love:
• Saves 2-3 hours per week on payment chasing
• Recover 40-60% more late payments
• Get paid 2 weeks faster (average)

Want to see it in action?

[BUTTON: See How Reminders Work]

Or just reply—I'm here if you have questions.

Best,
[Your Name]
```

**Design Notes:**
- Include specific statistic/data (84% conversion, £8,500 recovered)
- Customer quote (builds trust)
- Benefits (not features): "Save time" > "Automated reminders"
- Social proof: "84% of users" creates FOMO

**Content Formula:**
- Problem (22% late payments)
- Solution (Relay reminders)
- Proof (£8,500 recovered, customer quote)
- CTA

**Expected Metrics:**
- Open rate: 35-45%
- Click rate: 8-12%
- Engagement: 15-20% click to learn more

---

### Email 4: Feature Deep-Dive (Day 7)

**Goal:** Highlight premium feature; hint at paid plan; create upgrade pressure

**Trigger:** Sent on Day 7 (time-based)

**Subject Line Options:**
- "What happens when invoices go overdue?" (problem-focused)
- "The most powerful tool in Relay (hint: it's not reminders)" (curiosity)
- "[Name], here's what you might be missing" (FOMO)

**Preview Text:** "Automated collections save you £1000s"

**Email Copy:**

```
Subject: What happens when invoices go overdue?

Hi [Name],

By now you've probably sent a few invoices with Relay.

Reminders are great—but here's the next level:
Automated collections.

When reminders don't work, Relay takes over:

→ Late Payment Interest automatically applied (8% + BoE rate)
→ Fixed compensation charged (£40-£100)
→ Final escalation notice sent (legal language)

Example: You invoice Client X for £5,000 on the 15th.
Payment due: 15th of next month.

Without Relay: You manually chase. Maybe recover 60%.
With Relay Pro: Automatic process handles it. 85% recovery rate.

Real result from a user:
"Collections automation saved me £3,200 in 
overdue payments I would've lost." — Sarah, Leeds

This is a Pro feature, but here's why I'm telling you:
You should know what's possible.

[BUTTON: Learn About Pro Features]

Or keep using the free version—no pressure. 
Just wanted to show you the full picture.

Best,
[Your Name]
```

**Design Notes:**
- Explain premium feature without hard-sell
- Show specific value (£3,200 recovered, 85% recovery rate)
- Transparent: "This is a Pro feature"
- Educational tone > Salesy tone

**Behavioral Variant:**
If user created invoice but didn't send: 
Subject: "[Name], your invoice is almost ready"

```
Subject: [Name], your invoice is almost ready

You created an invoice yesterday but didn't send it.

No worries—maybe you're still tweaking it?

Quick reminder: Once you send it, Relay automatically:
→ Sends to your client
→ Tracks payment status
→ Reminds them if late

[BUTTON: Send Invoice Now]

That's it. Then you're hands-free while we handle follow-ups.

Talk soon,
[Your Name]
```

**Expected Metrics:**
- Open rate: 30-40%
- Click rate: 5-10%
- Upgrade interest: 5-8% upgrade intent

---

### Email 5: Soft Upgrade Pitch (Day 14)

**Goal:** Convert to paid; show ROI; address main pain points

**Trigger:** Sent on Day 14 OR if user is highly engaged (5+ invoices created)

**Subject Line Options:**
- "Get paid 2X faster with Pro" (benefit + urgency)
- "[Name], 14 days in—what's changed?" (curiosity)
- "The one thing Pro users wish they'd known earlier" (social proof)

**Preview Text:** "See your ROI in the first month"

**Email Copy:**

```
Subject: Get paid 2X faster with Pro

Hi [Name],

You've been using Relay for 2 weeks now.

Here's what I'm curious about:
Has cash flow gotten easier?

For most users, yes—because Relay handles reminders 
automatically. One less thing to worry about.

But there's a level up: Pro.

PRO INCLUDES:
✓ Automated collections (late payment interest + costs applied)
✓ SMS reminders (text reminders hit harder than email)
✓ AI-powered collection calls (coming soon)
✓ Advanced analytics (track recovery rate, days to payment)
✓ Priority support (me, directly)

PRICING:
£29/month or £290/year (save 2 months)

ROI EXAMPLE:
Invoice: £10,000
Without Pro: 70% recovery (£7,000)
With Pro: 88% recovery (£8,800)
Profit on Pro: £1,800/month

So Pro pays for itself in less than 1 week.

[BUTTON: Upgrade to Pro - First Month Free]

Or stay on Free—totally fine. 
But now you know what's possible.

Questions? Hit reply or book a 15-min call:
[BUTTON: Schedule a Call]

All the best,
[Your Name]
CEO, Relay

P.S. – 30-day money-back guarantee. 
Zero risk to try.
```

**Design Notes:**
- Show specific ROI (£1,800/month profit example)
- Pricing transparent and clear
- Risk-reversal: "30-day money-back guarantee"
- Optional CTA: Schedule call (for hesitant users)

**Behavioral Variants:**
If user created 10+ invoices:
Subject: "You're a power user—meet Pro"

If user has £10K+ invoiced:
Subject: "Pro would save you £1000s this month"

If user hasn't logged in 5+ days:
Subject: "[Name], we miss you—plus: Pro feature you'd love"

**Expected Metrics:**
- Open rate: 28-38%
- Click rate: 8-12%
- Conversion to paid: 3-8%

---

## PART 2: EMAIL DESIGN & TONE

### 2.1 Plain Text vs HTML

**Plain Text Emails (Recommended for Onboarding):**

Pros:[215][218]
- More personal, feels like 1-on-1 conversation
- Better deliverability (lower spam filter rates)
- Mobile-friendly (loads instantly)
- Higher response rates (74% of users prefer plain text)
- Less coding required

Cons:
- Can't use branding/images
- Less visual impact
- Looks less professional

**When to use:** Days 0-1, relationship-building emails, personal touch

Example:
```
Subject: Welcome to Relay — Let's get you paid faster

Hi John,

Welcome to Relay! 

You've just joined thousands of freelancers collecting 
payments faster.

Here's what Relay does:
✓ Create professional invoices in 2 minutes
✓ Automatic payment reminders
✓ Track overdue invoices at a glance

YOUR FIRST STEP: Create an invoice
https://relay.co.uk/dashboard/create-invoice

Takes 3 minutes. I promise.

Questions? Just reply to this email.

Best,
Alex
CEO, Relay
```

---

**HTML Emails (Use for Later Emails with Brand)**

Pros:
- Visual impact (logos, colors, images)
- Professional appearance
- Better for warm audiences (existing customers)
- Can include buttons/CTAs

Cons:
- Higher spam filter risk
- More complex to code
- May have display issues on some clients
- Feels more "marketing-y" (lower personal connection)

When to use: Days 3-14, feature promotions, brand-heavy

---

**Recommendation for Relay:**

```
Email 1 (Day 0): Plain text (personal, from Alex)
Email 2 (Day 1): Plain text or simple HTML (tutorial focus)
Email 3 (Day 3): HTML with branding (stat/social proof)
Email 4 (Day 7): HTML (feature showcase, can use images)
Email 5 (Day 14): HTML (professional pitch)
```

---

### 2.2 Sender Name Impact

**Research Findings:**[206][215]

| Sender | Open Rate | Engagement | Best For |
|--------|-----------|-----------|----------|
| "Alex from Relay" | 45-55% (highest) | High (personal) | Onboarding |
| "Relay Team" | 35-42% | Moderate | Feature updates |
| "noreply@relay.com" | 20-30% (lowest) | Low | Transactional |
| "Support Team" | 30-38% | Moderate-Low | Support issues |

**Recommendation:** Use personal name + title for onboarding

```
"Alex from Relay" (onboarding)
"The Relay Team" (announcements)
"Relay Support" (customer support)
```

---

## PART 3: BEHAVIORAL TRIGGERS

### 3.1 Event-Based Email Examples

**Trigger 1: User Creates Invoice But Doesn't Send**

```
Event: invoice_created AND invoice_not_sent
Delay: 6 hours
Email Subject: "[Name], your invoice is ready to send"

Email Copy:
"You created an invoice but haven't sent it yet.

Not sure if it's right? Here's what happens when you send:
→ Client receives email immediately
→ Payment tracked in your dashboard
→ Automatic reminder if they're late

[BUTTON: Send Invoice Now]"
```

**Trigger 2: Invoice Goes Overdue**

```
Event: invoice_overdue
Delay: 1 day after due date
Email Subject: "Invoice #INV-001 is now overdue"

Email Copy:
"Your invoice to [Client Name] (£[Amount]) 
is now overdue by 1 day.

Next step:
→ First reminder already sent to client
→ Second reminder on day 10
→ Final notice with late payment charges on day 14

For Pro users: Collections automation handles this.
[BUTTON: Upgrade to Pro]

Or send manual reminder:
[BUTTON: Send Reminder Now]"
```

**Trigger 3: First Payment Received**

```
Event: payment_received
Email Subject: "🎉 Payment received! [Amount] credited"

Email Copy:
"Congrats! You just got paid.

Payment: £[Amount]
From: [Client Name]
Method: [Bank Transfer]

Next steps:
→ Invoice marked as paid
→ Payment appears in your bank [date]

Pro tip: Set up a standing invoice for monthly work 
to get paid on repeat.

[BUTTON: Create Standing Invoice]"
```

**Trigger 4: No Login for 7 Days**

```
Event: no_login_7_days
Email Subject: "[Name], we miss you!"

Email Copy:
"Hey [Name],

It's been a week since you've logged into Relay.

Any issues? Missing a feature? I'm here to help.

Quick reminder: If you have any overdue invoices, 
our reminders are working in the background.

[BUTTON: Check Your Dashboard]

Reply if there's anything I can do.

Best,
Alex"
```

**Trigger 5: User Hits Free Plan Limit**

```
Event: free_plan_limit_reached
Email Subject: "You've hit your invoice limit"

Email Copy:
"You've created 50 invoices this month (your free limit).

Want to keep invoicing? Upgrade to Pro:

✓ Unlimited invoices
✓ Automated collections
✓ SMS reminders
✓ Advanced analytics

£29/month or £290/year

[BUTTON: Upgrade Now]

Questions? Book a call with me:
[BUTTON: Schedule 15-Min Call]"
```

---

### 3.2 Implementation (Customer.io / Intercom)

**Customer.io Setup:**

```
Workflow: "Onboarding Sequence"

1. Trigger: user_signed_up
   └─ Wait 0 hours
   └─ Send: Email 1 (Welcome)

2. Trigger: Days since signup = 1
   └─ Condition: user.invoices_created == 0
   └─ Wait: 0 hours
   └─ Send: Email 2 (Tutorial)

3. Trigger: Days since signup = 3
   └─ Wait: 0 hours
   └─ Send: Email 3 (Social Proof)

4. Trigger: Days since signup = 7
   └─ Wait: 0 hours
   └─ Send: Email 4 (Feature)

5. Trigger: Days since signup = 14
   └─ Condition: user.plan == "free"
   └─ Wait: 0 hours
   └─ Send: Email 5 (Upgrade)

Behavioral Trigger: User Creates Invoice
   └─ Trigger: invoice_created
   └─ Condition: invoice_status == "draft"
   └─ Wait: 6 hours
   └─ Send: "Finish Sending Invoice" email
```

---

## PART 4: METRICS & BENCHMARKS

### 4.1 Industry Benchmarks (November 2024)[212][213][214][217]

| Metric | Benchmark | SaaS Average | Top 10% |
|--------|-----------|--------------|---------|
| **Open Rate** | 42.35% | 38.14% | 55%+ |
| **Click Rate** | 2.00% | 1.29% | 4-5%+ |
| **Click-to-Open Rate** | 5.63% | 4-6% | 10%+ |
| **Unsubscribe Rate** | 0.08% | <0.1% | <0.05% |

**Automated Email Performance (Better):**[217]
- Open rate: 48.57% (vs 42% regular)
- Click rate: 4.67% (vs 2% regular)
- Conversion rate: 0.30% (vs 0.08% regular)

**Onboarding-Specific Benchmarks:**

| Email Stage | Typical Open | Typical Click | Goal |
|------------|-------------|--------------|------|
| Welcome | 45-55% | 15-25% | Highest engagement |
| Day 1 Tutorial | 40-50% | 10-15% | Drive first action |
| Day 3 Social Proof | 35-45% | 8-12% | Build confidence |
| Day 7 Feature | 30-40% | 5-10% | Premium awareness |
| Day 14 Upgrade | 28-38% | 8-12% | Conversion pitch |

**Expected Freemium Conversion:**[207][210]
- Visitor to freemium: 13.7% (average)
- Free trial conversion: 7.8% (opt-in) / 2.4% (payment required)
- Freemium to paid: 3-5% (target)
- With great onboarding: 5-8% (achievable)

---

### 4.2 Success Metrics to Track

```
ENGAGEMENT METRICS:
├─ % of users who create first invoice: 60%+ (target)
├─ Avg time to first invoice: <24 hours
├─ % of users who send first invoice: 50%+
├─ % of users who create 5+ invoices: 40%+

ACTIVATION METRICS:
├─ Email open rate: 40%+ (target)
├─ Click-through rate: 10%+ (target)
├─ Click-to-open rate: 12%+ (target)

CONVERSION METRICS:
├─ Free to paid conversion: 5%+ (target)
├─ Time to conversion: <14 days (target)
├─ Upgrade rate from onboarding: 5-8%

RETENTION METRICS:
├─ Day 7 retention: 60%+ (all onboarded users)
├─ Day 30 retention: 40%+
├─ Email unsubscribe rate: <0.1%
```

---

## PART 5: OPTIMIZATION FRAMEWORK

**Test 1: Subject Lines**
- Plain vs emotional: "Create your first invoice" vs "🎉 Let's get paid"
- Personalization: "[Name], welcome" vs "Welcome to Relay"
- Curiosity: "See what 84% of users do" vs "Why late payments happen"

**Test 2: Send Times**
- Test: 9am, 12pm, 3pm, 6pm
- Finding: 9am-11am typically best for B2B

**Test 3: Plain Text vs HTML**
- Plain text: Higher personal feel, higher response
- HTML: Higher visual impact, better branding

**Test 4: CTA Wording**
- "Create Invoice Now" vs "Let's Get Started" vs "Take 3 Minutes"
- Button color: Green (action) vs Blue (primary) vs Orange (urgency)

**Test 5: Email Frequency**
- Current: 1 per 2-4 days
- Test: 1 per day vs 1 per week
- Metric: Unsubscribe rate, click rate

---

**Onboarding Email Sequence Version:** 1.0  
**Last Updated:** November 2025  
**Freemium Conversion Target:** 5-8%
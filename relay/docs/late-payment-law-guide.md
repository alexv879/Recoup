# UK LATE PAYMENT LEGISLATION & INVOICING SOFTWARE GUIDE

**Complete Implementation for Late Payment of Commercial Debts (Interest) Act 1998**

---

## PART 1: LATE PAYMENT LAW FUNDAMENTALS

### 1.1 Statutory Interest Rate (8% + Bank of England Base Rate)

**Current Calculation (November 2025):**
- Bank of England Base Rate: **5.25%** (as of November 2024)
- Statutory Interest Rate: **8% + 5.25% = 13.25% per annum**

**Important:** The base rate changes on fixed dates (1 January and 1 July each year). Use the reference rate that was in force on either 30 June or 31 December immediately before the payment became overdue—not the rate on the day payment was made.

**Formula to Calculate Daily Interest:**

```
Annual Interest = Invoice Amount × (0.08 + Current Base Rate)
Daily Interest = Annual Interest ÷ 365
Total Interest for X Days = Daily Interest × Number of Days Overdue
```

**Example 1: Invoice of £1,000, 50 days overdue (base rate 5.25%)**
- Annual interest = £1,000 × 0.1325 = £132.50
- Daily interest = £132.50 ÷ 365 = £0.36 per day
- Interest after 50 days = £0.36 × 50 = **£18.33**

**Example 2: Invoice of £5,000, 90 days overdue (base rate 5.25%)**
- Annual interest = £5,000 × 0.1325 = £662.50
- Daily interest = £662.50 ÷ 365 = £1.82 per day
- Interest after 90 days = £1.82 × 90 = **£163.70**

**Example 3: Invoice of £12,000, 120 days overdue (base rate 5.25%)**
- Annual interest = £12,000 × 0.1325 = £1,590
- Daily interest = £1,590 ÷ 365 = £4.36 per day
- Interest after 120 days = £4.36 × 120 = **£523.29**

---

### 1.2 Fixed Compensation for Debt Recovery Costs

In addition to statutory interest, you can claim a **one-time fixed sum** per invoice for recovery costs:

| Invoice Amount | Fixed Compensation |
|----------------|--------------------|
| £0.01 to £999.99 | £40 |
| £1,000 to £9,999.99 | £70 |
| £10,000+ | £100 |

**Important:** This is compensation for recovery costs (letters, reminders, admin time)—not actual expenses. You don't need to prove costs; it's a statutory right.

**Example Calculation:**
- Invoice: £5,000, paid 60 days late
- Interest: £5,000 × 0.1325 × (60 ÷ 365) = **£109.25**
- Fixed compensation: **£70** (invoice £1,000-£9,999.99)
- **Total owed: £5,179.25**

---

### 1.3 When Statutory Interest Starts Running

Interest starts from the day **after** the due date, not the due date itself.

**Example Timeline:**
- Invoice issued: 1 November
- Payment terms: Net 30 days
- Due date: 1 December
- Interest starts: 2 December
- If still unpaid on 1 January (30 days late): Interest = 30 × daily rate

---

### 1.4 Who It Applies To

**Applies to:**
- Business-to-business transactions (both parties acting in course of business)
- Supply of goods or services for monetary consideration
- Invoices issued after 7 August 2002

**Does NOT apply to:**
- Consumer transactions (B2C)
- Payment to public authorities (unless contracted)
- Contracts with express "substantial remedy" for late payment

---

## PART 2: INVOICE TERMS & LEGAL WORDING

### 2.1 Standard Invoice Template with Late Payment Terms

```
INVOICE

Invoice Number: INV-2025-001234
Date Issued: 15 November 2025
Due Date: 15 December 2025 (Net 30)

---

TO: [Client Name]
[Client Address]

INVOICE DETAILS:

Description of Work/Services: [Details]
Amount: £[X,XXX.XX]

---

PAYMENT TERMS:

Payment is due within 30 days of invoice date (Net 30).
Please remit payment to: [Bank Details / Payment Method]

LATE PAYMENT:

Should payment not be received by the due date (15 December 2025), 
statutory interest and compensation will be charged in accordance with 
the Late Payment of Commercial Debts (Interest) Act 1998:

1. Statutory Interest: 8% + Bank of England base rate per annum 
   (currently 13.25% as of 1 July 2025)
2. Fixed Compensation: £40-£100 depending on invoice value
3. Additional Costs: Reasonable costs of debt recovery if applicable

Example: If this invoice remains unpaid after 15 December 2025, interest 
will accrue at £0.36 per day, plus fixed compensation of £70 and any 
reasonable recovery costs.

Interest and costs will be charged from the day after the due date and 
will continue to accrue daily until payment is received in full.

---

PAYMENT INSTRUCTIONS:
Bank: [Your Bank Name]
Account Name: [Your Business Name]
Sort Code: [XX-XX-XX]
Account Number: [XXXXXXXX]
Reference: INV-2025-001234

---

If you have any questions about this invoice or require alternative 
payment arrangements, please contact us within 5 days of receiving 
this invoice at [email/phone].

We appreciate your prompt payment. Thank you for your business.
```

---

### 2.2 Alternative Terms (Client-Friendly Approach)

If you want to maintain client relationships while retaining late payment rights:

```
PAYMENT TERMS:

Payment is due within 30 days of invoice date. 

In the event of late payment, statutory interest will be charged in 
accordance with the Late Payment of Commercial Debts (Interest) Act 1998 
at 8% + Bank of England base rate per annum, plus a fixed compensation 
amount of £40-£100 (depending on invoice value) and any reasonable costs 
incurred in debt recovery.

However, we greatly value our relationship with you and are happy to 
discuss payment arrangements if you experience difficulty. Please contact 
us immediately if you anticipate any payment issues.

We aim to work with our valued clients to find mutually acceptable 
solutions.
```

---

### 2.3 Payment Terms in Your Invoicing Software

If using **Xero, FreshBooks, Wave, or QuickBooks**, add standard payment terms:

**Xero Example:**
- Settings → Invoice Settings → Default Payment Terms: Net 30
- Add note to invoice footer: "Late payment interest will be charged at 8% + BoE base rate"

**FreshBooks Example:**
- Settings → Invoice Settings → Terms & Conditions
- Add: "Outstanding invoices will accrue interest at the statutory rate of 8% above Bank of England base rate from the due date"

**Wave Example:**
- Settings → Invoice Settings → Default terms
- Add to notes: "Please see our terms and conditions for late payment interest and recovery costs"

---

## PART 3: LATE PAYMENT REMINDER EMAIL TEMPLATES

### 3.1 Day 0-10: Friendly Reminder (Before Due Date)

**Subject Line:** Payment Reminder – Invoice INV-2025-001234 Due [Due Date]

**Email Body:**

```
Hi [Client Name],

I hope you're having a great day! This is a friendly reminder that your 
invoice is due for payment on [Due Date, e.g., 15 December 2025].

Invoice Details:
- Invoice Number: INV-2025-001234
- Amount: £[X,XXX.XX]
- Due Date: [Date]
- Payment Method: [Bank Transfer / Your preferred method]

If you've already processed this payment, please disregard this email.

If you have any questions about the invoice or need to arrange alternative 
payment terms, please let me know and we can discuss options.

Bank Details:
Sort Code: [XX-XX-XX]
Account: [XXXXXXXX]
Reference: INV-2025-001234

Thank you for your prompt attention to this matter.

Best regards,
[Your Name]
[Your Company]
[Contact Details]
```

---

### 3.2 Day 15-30: First Reminder (Overdue by 5-15 Days)

**Subject Line:** Overdue Payment – Invoice INV-2025-001234

**Email Body:**

```
Hi [Client Name],

I'm reaching out regarding invoice INV-2025-001234, which was due for 
payment on 15 December 2025 and is now [X] days overdue.

Invoice Details:
- Invoice Number: INV-2025-001234
- Original Amount: £[X,XXX.XX]
- Due Date: 15 December 2025
- Days Overdue: [X]

Status of Payment:
We have not received payment to date. Could you please confirm whether 
payment has been sent? If so, we would appreciate the payment reference 
so we can reconcile our accounts.

Next Steps:
If payment hasn't been sent yet, please prioritize this to avoid further 
action. Payment can be made to:

Bank: [Your Bank Name]
Sort Code: [XX-XX-XX]
Account: [XXXXXXXX]
Reference: INV-2025-001234

If you're experiencing any difficulties with payment or need to arrange 
alternative terms, please contact me immediately at [phone/email] and we 
can work together on a solution.

Thank you for your prompt attention to this matter.

Best regards,
[Your Name]
[Your Company]
[Contact Details]
```

---

### 3.3 Day 30+: Final Notice Before Legal Action (30-40 Days Overdue)

**Subject Line:** FINAL NOTICE: Invoice INV-2025-001234 – Statutory Interest & Recovery Costs Now Applicable

**Email Body:**

```
Dear [Client Name],

This is a final notice regarding invoice INV-2025-001234, which is now 
[X] days overdue.

INVOICE DETAILS:
- Invoice Number: INV-2025-001234
- Original Amount: £[X,XXX.XX]
- Due Date: 15 December 2025
- Days Overdue: [X days]

STATUTORY CHARGES NOW ACCRUING:

As the invoice remains unpaid beyond 30 days, charges are now accruing 
in accordance with the Late Payment of Commercial Debts (Interest) Act 1998:

1. STATUTORY INTEREST
   - Rate: 8% + Bank of England base rate = 13.25% p.a.
   - Daily accrual: £[X.XX] per day
   - Interest accrued to date: £[XXX.XX]
   - Interest will continue to accrue daily until payment received

2. FIXED COMPENSATION
   - Recovery cost compensation (one-off): £[40/70/100]
   - This is in addition to statutory interest

3. ADDITIONAL COSTS
   - Any further reasonable costs incurred in debt recovery 
     (solicitors' fees, collection agency fees, etc.)

TOTAL AMOUNT NOW DUE:
- Original invoice: £[X,XXX.XX]
- Interest accrued: £[XXX.XX]
- Fixed compensation: £[40/70/100]
- **Total: £[X,XXX.XX]** (Note: Interest continues to increase daily)

PAYMENT REQUIRED:

Payment must be received within 7 DAYS of this email (by [Date]).

Payment Method:
Bank: [Your Bank Name]
Sort Code: [XX-XX-XX]
Account: [XXXXXXXX]
Reference: INV-2025-001234

IMPORTANT - NEXT STEPS IF PAYMENT NOT RECEIVED:

If payment (or satisfactory written agreement to pay) is not received 
within 7 days, we will proceed with formal debt recovery action, which 
may include:

1. County Court Claim via Money Claim Online
   (Claim fee: £[35-410 depending on amount])
2. Referral to a professional debt collection agency
3. Legal proceedings for recovery of the full debt

These actions will result in:
- A County Court Judgment (CCJ) against your business
- Additional legal and court fees added to your debt
- Damage to your business credit score
- Potential enforcement action (bailiffs, asset seizure)

DISPUTE OR PAYMENT ARRANGEMENT:

If you dispute any part of this invoice or require alternative payment 
arrangements, you must contact us immediately (within 5 days) with:
- Details of your dispute (with supporting documentation), or
- A proposal for payment arrangements

Without a response within 5 days, we will assume you accept the debt and 
will proceed with formal collection.

CONTACT INFORMATION:

Please respond immediately to:
Email: [invoice@yourdomain.co.uk]
Phone: [Your Phone Number]
Address: [Your Business Address]

---

This letter is a formal demand for payment. Please note that statutory 
interest and compensation are automatic rights under UK law and will be 
charged regardless of whether explicitly requested.

We would prefer to resolve this matter amicably. However, if payment is 
not received, we will pursue all available legal remedies without further 
notice.

Yours sincerely,

[Your Name]
[Your Title]
[Your Company Name]
[Date]

---

CC: Finance Department Records
```

---

### 3.4 Email Best Practices for Freelancers (Maintaining Relationships)

For freelancers who prioritize ongoing relationships, use a softer tone:

**Subject:** Payment Reminder – Can We Help?

```
Hi [Client Name],

I hope all is well! I noticed that invoice INV-2025-001234 (£[Amount]) 
is now a few days past due.

I know you're busy, and sometimes invoices slip through the cracks. 
Rather than assume anything is wrong, I wanted to reach out and see 
if there's anything I can do to help:

- Is the invoice sitting in a queue waiting for approval?
- Do you need a different payment method?
- Are there any issues with the work I've completed?
- Would a payment plan work better for your cash flow?

I'm happy to work with you to find a solution that works. Just let me know 
what you need.

Bank details are below in case you'd like to process payment right away:

[Bank details]

Thanks, and looking forward to our continued work together!

Best,
[Your Name]
```

---

## PART 4: ESCALATION PROCEDURES & TIMELINES

### 4.1 Late Payment Escalation Timeline

```
DAY 0-30: Invoice Period
├─ Day 0: Invoice issued
├─ Day 15: Friendly reminder (optional)
└─ Day 30: Due date

DAY 31-40: Grace Period / Final Warning
├─ Day 31-35: First overdue reminder (soft tone)
├─ Day 36-40: Second reminder (firmer tone, mention interest/costs)
└─ Day 40: Final Notice (formal demand, mention legal action)

DAY 41-60: Pre-Legal Recovery
├─ Day 41-50: Consider escalation decision
├─ Day 50-60: Prepare County Court claim OR refer to agency
└─ Day 60: Refer to debt collection agency if not pursuing court

DAY 61-90: County Court OR Agency Collection
├─ Day 61-75: County Court claim in progress (14-day response period)
│  ├─ Day 14: Debtor responds or default judgment entered
│  └─ Day 75: Judgment obtained
├─ Day 76-90: Enforcement action begins (bailiffs, asset seizure)
└─ Day 90: Complete if payment received

DAY 91+: Enforcement & Collection
├─ Bailiff enforcement (3-12 weeks)
├─ Charging orders (4-8 weeks)
├─ Third-party debt orders (8-12 weeks)
└─ Write-off or settlement
```

---

### 4.2 Decision Point: County Court vs. Debt Collection Agency

| Factor | County Court | Debt Agency |
|--------|-------------|------------|
| **Timeline** | 30-90 days | 60+ days |
| **Cost** | £35-410 (small claims); 5% (fast/multi-track) | Usually 15-25% of recovered debt |
| **Your Involvement** | Active (you file claim) | Passive (agency handles) |
| **Success Rate** | High (66-75% with judgment) | Medium (50-60%) |
| **Debtor Credit** | County Court Judgment (CCJ) | Collection mark on credit report |
| **Relationship** | Damaged (legal action) | Severely damaged |
| **When to Use** | Amounts >£1,000; clear debt | Amounts >£5,000; persistent non-payer |

---

### 4.3 County Court Claim Process (Small Claims Track)

**When to File:** After 60-90 days overdue with no response to final notice

**Process:**
1. File claim via Money Claim Online (moneyclaim.gov.uk)
2. Pay court fee (see below)
3. Court serves claim on debtor
4. Debtor has 14 days to respond
5. If no response: Default judgment entered in your favor
6. If disputed: Court hearing scheduled (usually 8-12 weeks later)

**Court Fees (November 2024):**

| Claim Amount | Court Fee |
|-------------|-----------|
| Up to £300 | £35 |
| £300-£500 | £50 |
| £500-£1,000 | £70 |
| £1,000-£1,500 | £80 |
| £1,500-£3,000 | £115 |
| £3,000-£5,000 | £205 |
| £5,000-£10,000 | £455 |
| £10,000-£200,000 | 5% of claim value (max £10,000) |

**Example:** Claiming £5,000 = £205 court fee (added to claim)

**After Judgment:**
- Payment due immediately ("forthwith") or per court order
- If still unpaid after judgment: Apply for enforcement (bailiffs, charging orders, asset seizure)
- Enforcement takes 3-12 weeks

---

### 4.4 Debt Collection Agency (When to Refer)

**When to Consider:**
- Invoice 60+ days overdue
- Amount >£5,000 (justifies agency commission)
- You want to avoid court costs/time
- Debtor has resources but won't pay

**Major UK Debt Collection Agencies:**

| Agency | Focus | Contact |
|--------|-------|---------|
| **Moorcroft** | Business & consumer debt | 0845 300 2000 |
| **ARC Europe** | Multi-sector collections | 01932 251 000 |
| **Lowell Group** | Consumer & commercial | 0371 222 5000 |
| **Intrum** | Large commercial claims | 0203 633 5500 |

**Typical Process:**
1. Refer invoice to agency (provide invoice, contract, evidence of demand)
2. Agency sends demand letter (must include 14-day payment window)
3. If no response: Agency escalates (phone calls, visits, legal threats)
4. If still unpaid: Agency may suggest County Court claim OR issue Statutory Demand

**Costs:** Agency typically takes 15-25% of recovered amount (negotiable for large claims)

**Example:** Recover £5,000 from debtor
- You collect: £3,750-£4,250 (agency takes £750-£1,250)
- Agency fee worth it if debtor won't pay you directly

---

## PART 5: INTEGRATION WITH INVOICING SOFTWARE

### 5.1 Setup in Xero

1. **Settings → Invoice Settings**
   - Default payment terms: Net 30
   - Late fee: Manual entry (Xero doesn't auto-calculate)

2. **Add to Invoice Footer:**
   ```
   "Late payments: Statutory interest charged at 8% + Bank of England 
   base rate per annum from the due date, plus fixed compensation of 
   £40-£100 depending on invoice value."
   ```

3. **Workflow:**
   - Invoice issued → Set reminder in calendar for day 35
   - Day 35: Create new invoice variant with accrued interest + fixed fee
   - Send as revised invoice or separate charge note

---

### 5.2 Setup in FreshBooks

1. **Settings → Invoice Settings → Terms & Conditions**
   - Add standard payment terms

2. **Add Late Fee:**
   - Create line item: "Late Payment Charge (Statutory Interest + Compensation)"
   - Manual calculation required
   - Add as separate invoice when past 30 days

3. **Workflow:**
   - Use FreshBooks reminder automation (day 15, day 30, day 45)
   - Custom message referencing late payment terms

---

### 5.3 Setup in Wave

1. **Settings → Invoice Settings**
   - Add to notes: "Late payment interest will be charged at 8% + BoE base rate"

2. **Create Invoice Template** with late payment terms in footer

3. **Workflow:**
   - Manual reminders (Wave doesn't auto-send)
   - Create separate expense record to track interest earned for invoicing

---

### 5.4 Custom SaaS Solution (Recommended for Invoicing Platform)

If building invoicing SaaS (like "Relay"), consider:

1. **Invoice Template Option:**
   - Checkbox: "Enable Late Payment Interest"
   - Auto-populated terms mentioning statutory interest

2. **Automated Reminders:**
   - Day 15 (before due): Gentle reminder
   - Day 35 (5 days overdue): Friendly overdue notice
   - Day 45 (15 days overdue): Final notice with legal language
   - Day 60+: Escalation alert to user

3. **Interest Calculator:**
   - Input: Invoice amount, due date, current base rate
   - Output: Daily interest amount + fixed compensation
   - Auto-update when BoE base rate changes

4. **Escalation Workflow:**
   - Flag for Court Claim preparation
   - Suggest debt agency referral with agency contact details

---

## PART 6: LEGAL REFERENCES & RESOURCES

### Late Payment Legislation:
- Late Payment of Commercial Debts (Interest) Act 1998
- Late Payment of Commercial Debts Regulations 2002 (as amended 2013)
- Late Payment of Commercial Debts (Rate of Interest) (No. 3) Order 2002

### Government Resources:
- **gov.uk:** "Late commercial payments: charging interest and debt recovery"
- **payontime.co.uk:** Official government late payment information and calculator
- **Small Business Commissioner:** smallbusinesscommissioner.gov.uk

### Court Claims:
- **Money Claim Online:** moneyclaim.gov.uk
- **Courts & Tribunals Service:** justice.gov.uk

### Current Base Rates:
- **Bank of England:** bankofengland.co.uk (check official rates for 1 Jan & 1 July)

---

## SUMMARY: Late Payment Timeline for Invoicing Software

```
Day 1-30:        Invoice issued → Payment due → Normal invoicing
Day 31-35:       First reminder (email, system notification)
Day 36-40:       Second reminder (mention interest/costs)
Day 41+:         Final Notice (legal language, formal demand)

Day 60+:         Decision: 
                 Option A: County Court Claim (£35-410 fee)
                 Option B: Refer to debt agency (15-25% fee)
                 Option C: Write off (acknowledge loss)

Day 75+:         If County Court: Judgment entered
Day 90+:         If Agency/Court: Enforcement begins
```

---

**Late Payment Law Summary Version:** 1.0  
**Last Updated:** November 2025  
**Base Rate Used:** 5.25% (expires 30 June 2025, then recalculated)
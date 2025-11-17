# LATE PAYMENT ESCALATION FLOW DIAGRAM & DECISION TREE

**Visual Guide for UK Invoicing Software**

---

## PART 1: COMPLETE ESCALATION FLOWCHART (TEXT FORMAT)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INVOICE ISSUED                                   │
│                     [Day 0]                                         │
│              Invoice Amount: £[X,XXX]                              │
│              Due Date: [Day 30 from issue]                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    Payment Terms: Net 30
                             │
                    ┌────────▼────────┐
                    │  PAYMENT MADE?  │
                    └────┬────────┬───┘
                    YES  │        │  NO
                         │        │
                ┌────────┘        └─────────┐
                │                           │
        ┌───────▼──────┐        ┌──────────▼──────┐
        │  CLOSE       │        │  DAY 30         │
        │  Case        │        │  PAYMENT DUE    │
        │  Reconcile   │        │  [Send Receipt] │
        │  Invoice     │        └──────────┬──────┘
        └──────────────┘                   │
                                 PAYMENT STILL DUE?
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   DAY 31-35           │
                        │ First Reminder Email  │
                        │ (Friendly tone)       │
                        │                       │
                        │ - Check if sent       │
                        │ - Gentle follow-up    │
                        │ - Offer alt. payment  │
                        └───────────┬───────────┘
                                    │
                        PAYMENT RECEIVED?
                                    │
                        ┌───────────┴────────────┐
                        │                        │
                    YES │                    NO  │
                        │                        │
                    ┌───▼────┐          ┌─────────▼──────┐
                    │ CLOSE   │          │   DAY 35-40    │
                    │ CASE    │          │ Second Reminder│
                    └─────────┘          │ (Firmer tone)  │
                                         │                │
                                         │ - Still due?   │
                                         │ - Mention      │
                                         │   interest &   │
                                         │   costs        │
                                         │ - Request      │
                                         │   contact      │
                                         └────────┬───────┘
                                                  │
                                    PAYMENT RECEIVED?
                                         │
                        ┌────────────────┴──────────────┐
                        │                               │
                    YES │                           NO  │
                        │                               │
                    ┌───▼────┐              ┌──────────▼──────┐
                    │ CLOSE   │              │   DAY 40-45     │
                    │ CASE    │              │ FINAL NOTICE    │
                    └─────────┘              │ (Legal language)│
                                             │                │
                                             │ - CALCULATE    │
                                             │   STATUTORY    │
                                             │   INTEREST     │
                                             │   (8%+BoE)     │
                                             │ - ADD FIXED    │
                                             │   COMPENSATION │
                                             │   (£40-£100)   │
                                             │ - SET 7-DAY    │
                                             │   DEADLINE     │
                                             │ - WARN OF      │
                                             │   LEGAL ACTION │
                                             │ - SEND FORMAL  │
                                             │   EMAIL        │
                                             └────────┬───────┘
                                                      │
                                    PAYMENT RECEIVED WITHIN 7 DAYS?
                                              │
                                    ┌─────────┴────────┐
                                    │                  │
                                YES │              NO  │
                                    │                  │
                            ┌───────▼──────┐  ┌───────▼────────┐
                            │ CLOSE CASE   │  │  DAY 50-60     │
                            │ Record       │  │  ESCALATION    │
                            │ interest     │  │  DECISION      │
                            │ & fees paid  │  └───────┬────────┘
                            └──────────────┘          │
                                          ┌───────────┴────────────┐
                                          │                        │
                        DECISION POINT:   │                        │
                        Court or Agency?  │                        │
                                          │                        │
                        ┌─────────────────┴──────────────┐          │
                        │                                │          │
                    OPTION A                        OPTION B        │
              COUNTY COURT CLAIM              DEBT AGENCY           │
                        │                           │               │
                        │                           │               │
            ┌───────────▼──────────┐    ┌──────────▼─────────┐     │
            │   DAY 50-60           │    │   DAY 50-60        │     │
            │ Prepare Claim Form    │    │ Contact Agency     │     │
            │                       │    │                    │     │
            │ - Gather evidence     │    │ - Provide invoice  │     │
            │ - Calculate interest  │    │ - Provide contract │     │
            │   & costs             │    │ - Provide demand   │     │
            │ - File via Money      │    │   letter evidence  │     │
            │   Claim Online        │    │ - Agree fee split  │     │
            │ - Pay court fee       │    │   (15-25%)         │     │
            │   (£35-455)           │    │                    │     │
            └───────────┬───────────┘    └──────────┬─────────┘     │
                        │                           │               │
                ┌───────▼────────┐        ┌─────────▼──────┐        │
                │   DAY 60-65    │        │   DAY 60-70    │        │
                │   CLAIM FILED  │        │   AGENCY SENDS │        │
                │                │        │   DEMAND       │        │
                │ Court issues   │        │   LETTER       │        │
                │ claim form     │        │                │        │
                │ & serves on    │        │ 14-day window  │        │
                │ debtor         │        │ for payment    │        │
                │                │        │ starts         │        │
                └───────┬────────┘        └────────┬───────┘        │
                        │                         │                │
            ┌───────────▼────────┐      ┌─────────▼──────┐         │
            │   DAY 65-75        │      │   DAY 70-80    │         │
            │ DEBTOR RESPONDS?   │      │   DEBTOR PAYS? │         │
            │                    │      │                │         │
            │ 14-day response    │      │ If YES:        │         │
            │ period             │      │ - Case closed  │         │
            └──┬──────────────┬──┘      │ - Agency paid  │         │
               │              │         │   from debt    │         │
              YES             NO        └────────────────┘         │
               │              │                                     │
       ┌───────▼──┐   ┌──────▼──────┐                              │
       │ DEBTOR    │   │  NO         │                              │
       │ PAYS      │   │  RESPONSE   │                              │
       │           │   │             │                              │
       │ - Case    │   │ Default     │                              │
       │   closed  │   │ Judgment    │                              │
       │ - Collect │   │ Entered     │                              │
       │   money   │   │ (DAY 75)    │                              │
       └───────────┘   └──────┬──────┘                              │
                              │                                     │
                   ┌──────────▼──────────┐                          │
                   │  DAY 75-90          │                          │
                   │  JUDGMENT ENTERED   │                          │
                   │  IN YOUR FAVOR      │                          │
                   │                     │                          │
                   │ - Interest frozen   │                          │
                   │ - Full payment due  │                          │
                   │ - Prepare for       │                          │
                   │   enforcement       │                          │
                   └──────────┬──────────┘                          │
                              │                                     │
                   PAYMENT WITHIN 14 DAYS?                          │
                              │                                     │
                    ┌─────────┴──────────┐                          │
                    │                    │                          │
                YES │                NO  │                          │
                    │                    │                          │
            ┌───────▼──┐        ┌───────▼────────┐                 │
            │ COLLECT   │        │  DAY 90+       │                 │
            │ JUDGMENT  │        │ ENFORCEMENT    │                 │
            │ PAYMENT   │        │ ACTION         │                 │
            │           │        │                │                 │
            │ Case      │        │ Apply for:     │                 │
            │ closed    │        │ - Bailiff      │                 │
            └───────────┘        │   warrant      │                 │
                                 │ - Charging     │                 │
                                 │   order        │                 │
                                 │ - Asset        │                 │
                                 │   seizure      │                 │
                                 │ (3-12 weeks)   │                 │
                                 │                │                 │
                                 └────────────────┘                 │
                                                                    │
                                            IF AGENCY:              │
                                            DAY 80-120             │
                                            │                      │
                                   ┌────────▼────────┐             │
                                   │ AGENCY ESCALATES│             │
                                   │                 │             │
                                   │ Increased      │             │
                                   │ contact        │             │
                                   │ pressure       │             │
                                   │ (phone, visits)│             │
                                   │ May suggest    │             │
                                   │ Court claim    │             │
                                   │ or Statutory   │             │
                                   │ Demand         │             │
                                   └────────────────┘             │
                                                                    │
                                                                    ▼
                                                    ┌──────────────────────┐
                                                    │  DAY 120+            │
                                                    │  FINAL OUTCOMES      │
                                                    │                      │
                                                    │ A) PAID              │
                                                    │    - Full recovery   │
                                                    │    - Fees/interest   │
                                                    │                      │
                                                    │ B) SETTLEMENT        │
                                                    │    - Payment plan    │
                                                    │    - Partial payment │
                                                    │                      │
                                                    │ C) UNCOLLECTABLE     │
                                                    │    - Asset seizure   │
                                                    │    - CCJ on record   │
                                                    │    - Possible write- │
                                                    │      off             │
                                                    │                      │
                                                    │ D) BANKRUPTCY        │
                                                    │    - Debtor bankrupt │
                                                    │    - Claim for       │
                                                    │      dividend        │
                                                    └──────────────────────┘
```

---

## PART 2: DECISION TREE - COURT vs. AGENCY

```
                    INVOICE 60+ DAYS OVERDUE
                    FINAL NOTICE SENT
                                │
                ┌───────────────┴───────────────┐
                │    WHICH ROUTE?               │
                │                               │
    ┌───────────▼─────────────┐   ┌────────────▼──────────────┐
    │   OPTION A:             │   │   OPTION B:               │
    │   COUNTY COURT CLAIM    │   │   DEBT COLLECTION AGENCY  │
    │                         │   │                           │
    │   BEST FOR:             │   │   BEST FOR:               │
    │   • Clear debt          │   │   • Persistent non-payer  │
    │   • Amount >£1,000      │   │   • Avoid court fees      │
    │   • Want CCJ on record  │   │   • Amount >£5,000        │
    │   • Don't mind cost     │   │   • You want passive      │
    │   • Want enforcement    │   │     approach              │
    │   • Time not critical   │   │   • Prefer agency handles │
    │                         │   │     all contact           │
    │   COSTS:                │   │                           │
    │   • £35-455 (small)     │   │   COSTS:                  │
    │   • £455-£10k (large)   │   │   • 15-25% of amount      │
    │   • 5% (>£10,000)       │   │     recovered             │
    │   • Court fees added    │   │   • No upfront cost       │
    │     to claim            │   │                           │
    │                         │   │   TIMELINE:               │
    │   TIMELINE:             │   │   • 60-120 days average   │
    │   • 14-30 days filing   │   │   • Faster if debtor      │
    │   • 30-75 days judgment │   │     responds quickly      │
    │   • 3-12 weeks enforce  │   │   • Agency may suggest    │
    │                         │   │     court after 90 days   │
    │   OUTCOME:              │   │                           │
    │   • CCJ on credit       │   │   OUTCOME:                │
    │   • Enforcement power   │   │   • Collection mark       │
    │   • Payment from assets │   │   • Payment from debtor   │
    │   • Settlement pressure │   │   • Credit damage         │
    │                         │   │                           │
    │   IF DISPUTE:           │   │   IF DISPUTE:             │
    │   • Go to hearing       │   │   • Escalate to court     │
    │   • Judge decides       │   │   • Agency assists        │
    │                         │   │                           │
    │   IF DEBTOR PAYS:       │   │   IF DEBTOR PAYS:         │
    │   • Within 14 days:     │   │   • Agency takes fee      │
    │     settlement          │   │   • You get balance       │
    │   • After judgment:     │   │   • Case closed           │
    │     collect + costs     │   │                           │
    └───────────┬─────────────┘   └────────────┬──────────────┘
                │                              │
                │                              │
                └──────────────┬───────────────┘
                               │
                    BOTH PATHS LEAD TO:
                    1. PAYMENT
                    2. SETTLEMENT
                    3. CCJ + ENFORCEMENT
                    4. WRITE-OFF
```

---

## PART 3: EMAIL TIMELINE SUMMARY

```
DAY 15 (Optional) ──▶ FRIENDLY REMINDER
                     "Hi, your invoice is due 15 Dec"
                     (Warm tone)

DAY 31-35        ──▶ FIRST OVERDUE REMINDER
                     "Invoice is now overdue, please confirm if sent"
                     (Neutral, check tone)

DAY 36-40        ──▶ SECOND REMINDER
                     "Still outstanding, interest & costs will apply"
                     (Firmer tone, mention charges)

DAY 40-45        ──▶ FINAL NOTICE
                     "FORMAL DEMAND - 7 days to pay or face legal action"
                     • Calculate exact interest + costs
                     • Mention County Court claim
                     • Mention debt collection agency
                     (Legal language)

DAY 50-60        ──▶ ESCALATION DECISION
                     Choose: Court Claim OR Debt Agency
                     Notify debtor of choice

DAY 60-75        ──▶ COURT/AGENCY ACTION
                     File claim or refer to agency
                     Debtor notified by court/agency

DAY 75-90        ──▶ JUDGMENT/AGENCY ESCALATION
                     Court judgment OR agency pressure increases

DAY 90+          ──▶ ENFORCEMENT/AGENCY COLLECTION
                     Bailiff action OR agency continues
```

---

## PART 4: INVOICING SOFTWARE IMPLEMENTATION

### What Your Invoicing Platform Should Automate:

```
DASHBOARD VIEW:

Invoice Status: ┌──────────────────────────────────┐
                │ Current Age: 75 days              │
                │ Amount: £5,000                    │
                │ Status: OVERDUE 45 DAYS          │
                │ Interest Accrued: £187.30        │
                │ Fixed Compensation Due: £70      │
                │ TOTAL DUE: £5,257.30             │
                │                                  │
                │ NEXT ACTION: [Court Claim] /     │
                │             [Debt Agency] /      │
                │             [Send Notice]        │
                └──────────────────────────────────┘

AUTOMATIC WORKFLOWS:

✓ Day 15:  Send friendly reminder (configurable)
✓ Day 35:  Send overdue notice (auto-calculate interest)
✓ Day 45:  Send final notice (legal template)
✓ Day 50:  Alert user: "Time to escalate"
✓ Day 60:  Suggest: Court Claim OR Debt Agency
✓ Provide court filing links & debt agency contacts

CALCULATIONS:

Interest = Automatic daily calculation
Fixed Fee = £40/£70/£100 (auto-selected by amount)
Total Due = Invoice + Interest + Fixed Fee

BASE RATE UPDATES:

Auto-update on 1 Jan & 1 July
Recalculate all overdue invoices
Notify user of rate change
```

---

## PART 5: RECOMMENDED SEQUENCE FOR BUSINESS DECISIONS

### For Small Businesses (<£50k revenue):
```
Day 0-30:    Issue invoice normally
Day 31-45:   Friendly reminders (maintain goodwill)
Day 46-60:   Legal-tone final notice
Day 61+:     Accept loss OR pursue rigorously
Action:      If pursuing, use County Court (cheaper than agency)
```

### For Medium Businesses (£50k-£500k revenue):
```
Day 0-30:    Issue with clear late payment terms
Day 31-40:   Professional overdue reminders
Day 41-60:   Final legal notice
Day 61-75:   File County Court claim for debts >£2,000
             Send to agency for debts >£5,000
Day 76+:     Pursue enforcement
```

### For Invoicing SaaS (Building the Software):
```
MUST-HAVE FEATURES:
✓ Interest calculator (8% + BoE base rate)
✓ Fixed compensation calculator (£40/70/100)
✓ Email template library (Day 15, 35, 45+)
✓ Interest & costs auto-added to invoices
✓ Escalation dashboard (visual timeline)
✓ Integration with Money Claim Online info
✓ Debt agency directory & contact links
✓ Base rate auto-updater
✓ Downloadable letters & notices

NICE-TO-HAVE:
- Integrated solicitor/agency referrals
- Pre-filled court claim forms
- Payment plan calculator
- Negotiation dashboard
- Archive of resolved cases
- Compliance audit trail
```

---

**Escalation Flow Version:** 2.0  
**Last Updated:** November 2025  
**For Use With:** Invoicing Software, SaaS Platforms, Freelance Tools
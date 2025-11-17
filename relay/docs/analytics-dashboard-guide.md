# ANALYTICS DASHBOARD PATTERNS FOR FINANCIAL/INVOICING SOFTWARE

**Complete Guide: Metrics, Charts, Filters & Export**

---

## PART 1: KEY METRICS DISPLAY

### 1.1 Revenue Metrics (Primary KPIs)

**What to Display:**

| Metric | Definition | Example | Where Used |
|--------|-----------|---------|-----------|
| **Total Invoiced (MTD)** | Sum of all invoices issued this month | £45,320 | FreshBooks, Stripe, QuickBooks |
| **Total Invoiced (YTD)** | Sum of all invoices issued this year | £287,456 | FreshBooks dashboard |
| **Total Collected** | Sum of all paid invoices | £38,200 | FreshBooks, Stripe |
| **Outstanding** | Unpaid invoices (not yet due) | £7,120 | QuickBooks, FreshBooks |
| **Overdue** | Unpaid invoices (past due date) | £3,400 | QuickBooks dashboard, Chaser |

**Dashboard Card Display (Recommended):**

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  TOTAL INVOICED     │  │  TOTAL COLLECTED    │  │  OUTSTANDING        │
│  This Month         │  │  All Time           │  │  Not Yet Due        │
│                     │  │                     │  │                     │
│  £45,320            │  │  £156,200           │  │  £7,120             │
│  ↑ 12% vs last month│  │  ↑ 5% vs last month │  │  ↓ 3% vs last month │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│  OVERDUE            │  │  DUE NEXT 7 DAYS    │
│  Past Due Date      │  │  Cash Flow Alert    │
│                     │  │                     │
│  £3,400             │  │  £8,520             │
│  ↑ 24% vs last month│  │  (11 invoices)      │
└─────────────────────┘  └─────────────────────┘
```

**Color Coding Best Practices:**
- Green: Positive status (collected, on-time payments)
- Yellow/Orange: Warning (overdue, 5-10 days late)
- Red: Critical (severely overdue, >30 days)
- Blue: Neutral (information only, upcoming due dates)

---

### 1.2 Collections Metrics (Performance KPIs)

**Collection Effectiveness Index (CEI)** - Chaser.io standard[97]

```
CEI Formula:
(Beginning AR + Credit Sales - Ending AR - Ending Current AR) / 
(Beginning AR + Credit Sales - Ending AR) × 100%

Example:
- Beginning AR: £50,000
- Credit Sales this month: £80,000
- Ending AR: £60,000
- Ending Current AR (not yet due): £35,000

CEI = (50,000 + 80,000 - 60,000 - 35,000) / (50,000 + 80,000 - 60,000) × 100%
CEI = 35,000 / 70,000 × 100% = 50%

Target: 70-85% (improving); >85% (optimized)[97]
```

**Average Days to Payment (DSO - Days Sales Outstanding)**[102]

```
Formula:
DSO = (Average Accounts Receivable / Total Revenue) × 365

Example:
- Avg AR: £25,000
- Monthly Revenue: £50,000 (÷ 12 = £4,167/day)
- DSO = (25,000 / 50,000) × 365 = 182.5 days

Interpretation: On average, it takes 182.5 days to collect payment
Better target: 30-45 days for Net 30 terms[102]
```

**Reminder Effectiveness Rates**[97]

Track response rates by reminder sequence:

| Reminder | Timing | Expected Response Rate |
|----------|--------|----------------------|
| First Reminder | Day 15 | 15-25% |
| Second Reminder | Day 30-35 | 25-40% |
| Third Reminder | Day 45 | 30-50% |
| Final Notice | Day 60+ | 40-60% |
| Collection Agency | Day 75+ | 50-70% |

**Dashboard Display:**

```
COLLECTIONS PERFORMANCE

Collection Effectiveness Index: 72% ↑ 8% from last month
├─ Target: 70-85% (Improving)
└─ Action: Optimize invoice delivery & payment links

Average Days to Payment: 38 days ↓ 5 days
├─ Target: <45 days (On track)
└─ Best in class: <30 days

Reminder Effectiveness:
├─ First Reminder (Day 15): 18% paid
├─ Second Reminder (Day 30): 35% paid
├─ Third Reminder (Day 45): 42% paid
└─ Final Notice (Day 60): 55% paid
```

---

### 1.3 Cash Flow Predictions

**Predicted Revenue Next 7 Days & 30 Days** (Based on due dates)[101]

```
Calculation Logic:
1. Identify all outstanding (unpaid) invoices
2. Group by due date
3. Sum amounts by week/month
4. Add seasonal adjustments based on historical patterns

Example Dashboard:

CASH FLOW FORECAST

Next 7 Days:
├─ Due: £12,450
├─ Likely Collected: £10,000 (80% collection rate)
└─ Predicted Inflow: £10,000

Next 30 Days:
├─ Due: £45,300
├─ Likely Collected: £38,255 (84% collection rate based on CEI)
└─ Predicted Inflow: £38,255

Next 90 Days:
├─ Due: £120,500
├─ Likely Collected: £97,605 (81% collection rate)
└─ Predicted Inflow: £97,605
```

**Data Sources:**
- QuickBooks: "Cash Flow Planner" feature uses 12-month historical data[79]
- FreshBooks: Aggregates due dates from open invoices[101]
- Fundbox: Machine learning predicts payment timing based on customer payment history[101]

---

## PART 2: VISUALIZATION TYPES & RECOMMENDATIONS

### 2.1 Line Chart: Revenue Trend Over Time

**Best for:** Showing change over months/quarters

**Example Data:**
```
Month       Revenue    Collected   Outstanding
January     £45,000    £42,000     £3,000
February    £52,000    £48,500     £3,500
March       £48,000    £45,200     £2,800
April       £55,000    £51,000     £4,000
May         £58,000    £54,200     £3,800
```

**Visual:**
```
Revenue Trend (6 Months)

£60,000 │                    ╱╲
        │              ╱╱╲  ╱  ╲
        │          ╱╱╱    ╲╱    ╲╱
£50,000 │      ╱╱╱
        │  ╱╱╱
        ├─────┬─────┬─────┬─────┬─────
        Jan   Feb   Mar   Apr   May   Jun

Legend:
─── Invoiced
─── Collected
─── Outstanding
```

**Use Cases:**
- Spot revenue growth trends
- Identify seasonal patterns
- Compare YoY performance
- Forecast future revenue

---

### 2.2 Bar Chart: Invoices by Status

**Best for:** Quick comparison of invoice categories

**Example Data:**
```
Status          Count    Amount
Paid            287      £156,200
Pending (Due Soon) 42    £18,500
Outstanding     35       £7,120
Overdue 1-30 Days 18     £2,850
Overdue 30+ Days 12      £1,950
```

**Visual:**
```
Invoices by Status (Count & Amount)

Paid         ███████████████████ 287  (£156,200)
Pending      ███ 42               (£18,500)
Outstanding  ██ 35                (£7,120)
Overdue <30d  █ 18                (£2,850)
Overdue >30d  █ 12                (£1,950)
             ─────────────────────
             0    50   100  150  200  250  300
```

**Use Cases:**
- Monitor invoice lifecycle
- Identify bottlenecks (stuck in pending/overdue)
- Track collection progress
- Assess overall AR health

---

### 2.3 Donut/Pie Chart: Breakdown by Status (%)

**Best for:** Visualizing proportions at a glance

**Example Data:**
```
Paid:        70% (£156,200)
Pending:     9%  (£20,000)
Overdue:     21% (£46,950)
```

**Visual:**
```
                     Paid: 70%
                    ╱─────────╲
                  ╱             ╲
                 │               │
            Pending│            │Overdue
             9%     │          │ 21%
                     ╲ INVOICES╱
                      ╲─────────╱

Color key:
🟢 Green: Paid
🟡 Yellow: Pending
🔴 Red: Overdue
```

**Use Cases:**
- Executive summaries (board reports, stakeholder updates)
- Quick visual check of collection health
- Export for PDF reports
- Mobile dashboard (space-efficient)

---

### 2.4 Data Table: Sortable Invoice List

**Example Structure:**

```
┌────────┬──────────────┬────────────┬─────────┬──────────┬──────────┬──────────┐
│ Sort ↑ │              │            │         │ Due Date │ Days     │ Status   │
│        │ Invoice #    │ Client     │ Amount  │          │ Overdue  │          │
├────────┼──────────────┼────────────┼─────────┼──────────┼──────────┼──────────┤
│        │ INV-001234   │ Acme Corp  │ £2,500  │ 15 Nov   │ -5       │ ✓ Paid   │
│        │ INV-001235   │ Widget Inc │ £1,850  │ 20 Nov   │ 0        │ ⏳ Pending │
│        │ INV-001236   │ Smith Ltd  │ £4,200  │ 10 Nov   │ 5        │ 🔴 Overdue│
│        │ INV-001237   │ Beta Co    │ £3,100  │ 25 Nov   │ -10      │ ⏳ Pending │
│        │ INV-001238   │ Gamma Inc  │ £1,950  │ 5 Nov    │ 10       │ 🔴 Overdue│
└────────┴──────────────┴────────────┴─────────┴──────────┴──────────┴──────────┘

Interaction:
- Click column header to sort (ascending/descending)
- Click row to view invoice details/actions
- Multi-select checkboxes to bulk send reminders
- Filter buttons to show only overdue, pending, etc.
```

**Sortable Columns (in priority order):**
1. **Client Name** - Identify key accounts
2. **Amount** - Find high-value invoices
3. **Due Date** - Sort by due date (nearest first)
4. **Days Overdue** - Prioritize collection efforts
5. **Status** - Group by status (paid/overdue/pending)
6. **Invoice Date** - Sort by creation date
7. **Payment Method** - Segment by how they pay

**Column Freezing:**
- Freeze "Invoice #" column on left for easy identification
- Allow horizontal scroll to see all columns[111]

**References:**
- Notion tables: sortable, filterable, groupable views[111]
- Linear issue tables: drag-to-reorder columns, color-coded status[111]

---

## PART 3: FILTERING & SEGMENTATION

### 3.1 Date Range Filters

**Standard Quick-Select Options:**[106][113]

```
┌─ Date Range ────────────────────┐
│                                 │
│  ⚫ Today                        │
│  ⚫ Last 7 Days                  │
│  ⚫ Last 30 Days  (default)      │
│  ⚫ Last 90 Days                 │
│  ⚫ Year to Date                 │
│  ⚫ Last 12 Months               │
│  ⚫ Custom Date Range            │
│                                 │
│  If "Custom" selected:          │
│  ┌─────────────┐  ┌─────────────┐
│  │ From: [date]│  │ To: [date]  │
│  └─────────────┘  └─────────────┘
│                                 │
│         [Cancel] [Apply]        │
└─────────────────────────────────┘
```

**Best Practice Implementation:**[106][110]
- Show calendar date pickers with range selection (From/To)
- Highlight available dates
- Set current date as default selection
- Show "Apply" button to confirm before filtering
- Display visual indicator when filters are active[114]

**Use Cases:**
- Compare last 30 days vs. previous 30 days
- Year-over-year reporting
- Quarter-end reconciliation
- Fiscal year analysis

---

### 3.2 Segment Filters (Multi-Select)

**Filter By Client:**
```
┌─ Client ─────────────────────────┐
│ 🔍 Search: [_____________]       │
│                                  │
│ ☑ All Clients (current: 156)    │
│ ☐ Acme Corporation               │
│ ☐ Widget Manufacturing Inc       │
│ ☐ Smith & Associates             │
│ ☐ Beta Software Ltd              │
│ ☐ Gamma Consulting Group         │
│ ... (more clients)               │
│                                  │
│         [Clear] [Apply]          │
└──────────────────────────────────┘
```

**Filter By Invoice Status:**
```
┌─ Status ──────────────────────────┐
│ ☑ Paid           (287 invoices)   │
│ ☑ Pending        (42 invoices)    │
│ ☑ Outstanding    (35 invoices)    │
│ ☑ Overdue 1-30d  (18 invoices)    │
│ ☑ Overdue 30+d   (12 invoices)    │
│                                   │
│    [Clear All] [Apply]            │
└───────────────────────────────────┘
```

**Filter By Payment Method:**
```
┌─ Payment Method ──────────────────┐
│ ☑ Bank Transfer   (156 invoices)  │
│ ☑ Credit Card     (89 invoices)   │
│ ☑ PayPal          (42 invoices)   │
│ ☑ Cheque          (12 invoices)   │
│ ☑ Not Yet Paid    (110 invoices)  │
│                                   │
│    [Clear All] [Apply]            │
└───────────────────────────────────┘
```

**Active Filter Display:**

```
Active Filters: [Date: Last 30 days] [Status: Overdue] [Client: Acme] ✕
(Reset filters)

Current View: 18 invoices matching criteria
```

**Best Practices:**[114]
- Show count of matching items for each filter option
- Clear visual indication when filters are active
- Easy clear/reset functionality
- Search box for client names (especially with 100+ clients)
- Multi-select checkboxes (not radio buttons)

---

## PART 4: EXPORT & REPORTING

### 4.1 PDF Report Export

**Recommended Content:**

```
FINANCIAL SUMMARY REPORT
Generated: 15 November 2025

REPORT PERIOD: Last 30 Days

─────────────────────────────────

KEY METRICS

Total Invoiced:        £45,320
Total Collected:       £38,200
Outstanding:           £7,120
Overdue:               £3,400

Collection Rate:       84%
Average Days to Pay:   28 days

─────────────────────────────────

BREAKDOWN BY CLIENT

Client              Invoiced   Paid      Outstanding
Acme Corp          £12,500    £12,500   £0
Widget Inc         £8,200     £7,200    £1,000
Smith Ltd          £6,450     £5,800    £650
Beta Co            £10,100    £9,200    £900
Gamma Inc          £8,070     £3,500    £4,570

─────────────────────────────────

OVERDUE INVOICES (>5 days)

INV-001238  Beta Co      £1,950    10 days overdue
INV-001236  Smith Ltd    £4,200    5 days overdue

─────────────────────────────────

CASH FLOW FORECAST (Next 30 Days)

Expected Inflow:       £42,100
Expected Outflow:      £35,200
Projected Balance:     £89,300

─────────────────────────────────

Generated by [Your SaaS Name]
Report Format: PDF | Date: 15 Nov 2025
```

**Export Options:**
- One-page summary (executive view)
- Full details (all transactions)
- Include/exclude charts
- Customizable logo and branding

**UI Button:**
```
[📄 Export PDF] [📊 Export as Image] [📥 Download]
```

---

### 4.2 CSV Export for Accounting Integration

**Recommended Columns for CSV Export:**

```
invoice_number,client_name,invoice_date,due_date,amount,paid_amount,
outstanding_amount,status,payment_date,payment_method,notes,created_at

INV-001234,Acme Corp,2025-10-15,2025-11-15,2500.00,2500.00,0.00,Paid,
2025-11-15,Bank Transfer,Standard invoice,2025-10-15T10:30:00Z

INV-001235,Widget Inc,2025-10-20,2025-11-20,1850.00,0.00,1850.00,Pending,
NULL,NULL,Awaiting payment,2025-10-20T14:22:00Z

INV-001236,Smith Ltd,2025-10-10,2025-11-10,4200.00,0.00,4200.00,Overdue,
NULL,NULL,Follow-up sent 15 Nov,2025-10-10T09:15:00Z
```

**Why CSV Format:**
- Import to Excel, Google Sheets, Xero, QuickBooks
- Universal compatibility
- Sortable and filterable
- No special software required
- Easy to audit

**Integration Examples:**

| Target Software | Process |
|-----------------|---------|
| **Xero** | Settings → General → Import CSV → Select file → Map columns → Import |
| **QuickBooks** | File → Utilities → Import → Transactions → Select CSV → Review & Import |
| **Google Sheets** | File → Import sheet → Upload CSV → Create new spreadsheet |
| **Excel** | File → Open → Select CSV → Import wizard |

**Export UI:**
```
Export Options:

[📥 Export to CSV]    Download raw invoice data for
                      import to accounting software

[📄 Export to PDF]    Download formatted report for
                      sharing with stakeholders

[📧 Email Report]     Send summary to team/clients
```

---

### 4.3 Advanced Export Features

**Scheduled Reports:**
```
┌─ Automated Reports ──────────────┐
│                                  │
│ ☑ Daily Summary (7am)           │
│ ☑ Weekly Report (Fridays 5pm)   │
│ ☑ Monthly Report (End of month) │
│                                  │
│ Recipients:                      │
│ [ ] accounting@company.co.uk    │
│ [ ] finance@company.co.uk       │
│ [ ] director@company.co.uk      │
│                                  │
│    [Save] [Test Send]           │
└──────────────────────────────────┘
```

**Multi-Format Export:**
```
Export Format Options:

☑ PDF (formatted report)
☑ CSV (spreadsheet import)
☑ Excel (XLS with formulas)
☑ JSON (API integration)
☑ Email (auto-send to team)

Include in export:
☑ Charts
☑ Detailed transactions
☑ Client breakdown
☑ Cash flow forecast
```

---

## PART 5: COMPLETE DASHBOARD MOCKUP

```
═══════════════════════════════════════════════════════════════════════
                    FINANCIAL DASHBOARD
═══════════════════════════════════════════════════════════════════════

Date Range: [Last 30 Days ▼]  [Custom...] 
Filters: [Client: All ▼] [Status: All ▼] | Reset

───────────────────────────────────────────────────────────────────────
                        KEY METRICS (5 Cards)

┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ TOTAL INVOICED      │ │ TOTAL COLLECTED     │ │ OUTSTANDING         │
│ This Month          │ │ All Time            │ │ Not Yet Due         │
│ £45,320             │ │ £156,200            │ │ £7,120              │
│ ↑ 12% vs last month │ │ ↑ 5% vs last month  │ │ ↓ 3% vs last month  │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘

┌─────────────────────┐ ┌─────────────────────┐
│ OVERDUE             │ │ CASH FLOW (7 days)  │
│ Past Due Date       │ │ Forecast            │
│ £3,400              │ │ £10,000             │
│ ↑ 24% vs last month │ │ ↑ 8% vs last week   │
└─────────────────────┘ └─────────────────────┘

───────────────────────────────────────────────────────────────────────
                          CHART 1: Revenue Trend (Line)

Revenue Trend (6 Months)
│
£60k │                    ╱╲
│              ╱╱╲  ╱  ╲
£50k │          ╱╱╱    ╲╱    ╲╱
│      ╱╱╱
│  ╱╱╱
└─────┬─────┬─────┬─────┬─────
  Jan   Feb   Mar   Apr   May   Jun

Legend: ─ Invoiced  ─ Collected  ─ Outstanding

───────────────────────────────────────────────────────────────────────

┌────────────────────────┐  ┌────────────────────────┐
│ CHART 2: By Status     │  │ CHART 3: Status Pie    │
│        (Bar Chart)     │  │      (Donut)           │
│                        │  │                        │
│ Paid      ███████  287 │  │   Paid: 70%            │
│ Pending   ███ 42       │  │ Pending  ╱─────╲       │
│ Outstand  ██ 35        │  │  9%    │       │       │
│ Overdue   █ 30         │  │       │INVOICES│      │
│           ▁▁▁▁▁▁▁▁▁    │  │       │       │ 21%  │
│          0  100  200   │  │        ╲─────╱       │
│                        │  │      Overdue: 21%     │
└────────────────────────┘  └────────────────────────┘

───────────────────────────────────────────────────────────────────────
                   TABLE: Overdue Invoices (Sortable)

Sort By: [Days Overdue ▼]

┌────────┬──────────────┬────────────┬─────────┬──────────┬──────────┐
│ Invoice│ Client       │ Amount     │ Due Date│ Days     │ Status   │
│ #      │              │            │         │ Overdue  │          │
├────────┼──────────────┼────────────┼─────────┼──────────┼──────────┤
│INV0123│ Beta Co      │ £1,950     │ 5 Nov   │ 10 days  │ 🔴 Urgent│
│INV0236│ Smith Ltd    │ £4,200     │ 10 Nov  │ 5 days   │ 🟠 Action│
└────────┴──────────────┴────────────┴─────────┴──────────┴──────────┘

[Send Reminder] [Send Final Notice] [Escalate to Agency]

───────────────────────────────────────────────────────────────────────
                          EXPORT OPTIONS

[📄 Export PDF] [📥 Export CSV] [📊 Email Report]

═══════════════════════════════════════════════════════════════════════
```

---

## PART 6: BEST PRACTICES SUMMARY

### Card Design:
✓ Use large, prominent numbers
✓ Show trend indicator (↑ ↓) with percentage change
✓ Color-code by status (green/red)
✓ Display period (MTD, YTD, All Time)

### Charts:
✓ Line chart for trends over time
✓ Bar chart for status comparisons
✓ Donut chart for executive summaries
✓ Keep to 3-5 charts maximum (avoid clutter)

### Filters:
✓ Date range quick-select + custom picker
✓ Multi-select dropdowns (checkboxes)
✓ Show active filter count
✓ Easy reset functionality

### Tables:
✓ Sortable columns (by clicking header)
✓ Freeze first column (Invoice # or Client)
✓ Color-code status column (green/yellow/red)
✓ Clickable rows to view details

### Export:
✓ PDF for reports/sharing
✓ CSV for accounting import
✓ Scheduled/automated reports
✓ Email integration

---

**Dashboard Metrics Reference Version:** 1.0  
**Last Updated:** November 2025  
**For Use With:** Financial Software, Invoicing Platforms, SaaS Analytics
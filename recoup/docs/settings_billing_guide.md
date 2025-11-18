# Settings & Billing Page UX Patterns for Relay

## PART 1: SETTINGS NAVIGATION PATTERNS

### 1.1 Layout Decision Tree [250][251][252][253][254]

**Recommended: Sidebar Navigation**
- Best for settings/configuration pages
- Takes 15-20% screen width
- Allows vertical list of all options
- Scales better than tabs for 5+ sections
- Examples: Stripe, Notion, Linear, GitHub

**When to Use Tabs:**
- < 4 sections only
- Related content (not nested)
- Need to compare across tabs
- Mobile-first (horizontal scrolling problematic)

**When to Use Sidebar:**
- 5+ sections
- Nested items (2 levels max)
- Need to see all options at once
- Desktop-first or responsive

**Relay Recommendation: Sidebar Navigation**
- Account (Profile, Avatar, Company)
- Billing (Plan, Usage, Payment Methods)
- Notifications (Email, SMS, Webhooks)
- Team (Members, Permissions)
- Security (Password, 2FA, Sessions)
- Advanced (API Keys, Webhooks, Integrations)

### 1.2 Sidebar Best Practices [251][254]

**Optimal Size:**
- Width: 15-20% of screen (240-300px typically)
- Default state: Expanded (for first-time users)
- Collapsible: Optional (for expert users wanting more workspace)
- Two-level depth maximum (3+ levels = too complex)

**Key Features:**
- Customizable menu order (optional)
- Section grouping (Account, Billing, etc.)
- Visual distinction between active/inactive
- Icons + text labels
- Hover states showing additional actions

**Example Structure:**
```
┌─────────────────────┐
│ Settings            │ ← Main heading
├─────────────────────┤
│ Account             │ ← Section header
│  ├─ Profile         │ ← Nested item
│  ├─ Preferences     │
│  └─ Avatar          │
│                     │
│ Billing             │ ← Section header
│  ├─ Plan            │
│  ├─ Usage           │
│  └─ Payment Methods │
│                     │
│ Notifications       │ ← Section header
│  ├─ Email           │
│  └─ SMS             │
│                     │
│ Team & Security     │ ← Grouped sections
│  ├─ Members         │
│  ├─ Password        │
│  └─ 2FA             │
│                     │
│ Advanced            │ ← Collapse/expand
│  ├─ API Keys        │
│  └─ Webhooks        │
└─────────────────────┘
```

### 1.3 Mobile Responsiveness [251]

**Desktop (>1024px):**
- Sidebar visible on left
- Content area 80% width
- Maintain full navigation

**Tablet (768px-1024px):**
- Sidebar collapsible to icons only
- Toggle button to expand/collapse
- Content area expands when sidebar collapsed

**Mobile (<768px):**
- Sidebar hidden by default
- Hamburger menu to show/hide
- Full-width content when sidebar open
- Consider stacking sections as accordion

---

## PART 2: SUBSCRIPTION & BILLING MANAGEMENT

### 2.1 Billing Page Layout [72][255][267]

**Essential Sections:**

**1. Current Plan (Top Priority)**
```
┌─────────────────────────────────────┐
│ Current Plan: Professional          │
│ £29/month • 50 invoices per month   │
│                                     │
│ Next billing date: Dec 15, 2025     │
│ Auto-renews: Yes                    │
│                                     │
│ [Upgrade Plan] [Change Plan]        │
│ [Cancel Subscription]               │
└─────────────────────────────────────┘
```

**2. Usage Display (For Usage-Based Billing)**
```
Invoices Sent This Month: 35/50
████████████████░░░░░░░ 70%
```

**3. Payment Method**
```
Default Card: Visa ending in 4242
Expires: 12/27
[Add Card] [Change Card]
```

**4. Billing History**
```
Recent Invoices:
- Invoice #INV-2025-001 | Dec 1 | £29.00 | ✓ Paid
- Invoice #INV-2025-002 | Nov 1 | £29.00 | ✓ Paid
[View All] [Download PDF]
```

### 2.2 Usage Display Options [260]

**Option 1: Simple Progress Bar (Recommended for Most)**
```
Invoices Sent This Month: 35/50
[████████████░░░░░░░░░░░░░░░░░░] 70%
   12 remaining this month
```

**Option 2: Donut/Circle Chart (Visual Heavy)**
```
        35/50
     [Circle Progress]
    70% of quota used
```

**Option 3: Detailed Card Layout (Enterprise)**
```
┌─ Monthly Usage Summary ─────────────┐
│ Invoices Sent: 35 of 50 (70%)       │
│ Searches: 250 of 500 (50%)          │
│ Collections: 12 of 25 (48%)         │
│ Storage: 2.4 GB of 5 GB (48%)       │
│                                     │
│ Usage resets: Dec 15, 2025          │
│ Set alerts when... at 80%? 90%?     │
└─────────────────────────────────────┘
```

**Recommendation for Relay:**
- Simple progress bar (Option 1)
- Shows quota and percentage
- Clear remaining count
- Shows reset date

### 2.3 Upgrade Prompts [265][268]

**Option A: Inline Banner (Non-Disruptive)**
```
┌ Your account is near quota (90% used)
You can send 5 more invoices this month.
[Upgrade to Pro] [Learn more about plans]
```

**Option B: Modal (High-Priority)**
```
┌───────────────────────────────────┐
│ You've Reached Your Monthly Limit │
│                                   │
│ You can send up to 50 invoices/mo │
│ Upgrade to Pro for unlimited      │
│                                   │
│ [Upgrade Now] [Learn Plans]       │
└───────────────────────────────────┘
```

**Option C: Feature Gate (Prevent Action)**
```
Button appears disabled:
[Create Invoice] ← Grayed out

Tooltip on hover:
"You've reached your monthly invoice limit.
 Upgrade to Pro for unlimited invoices."
```

**Recommendation for Relay:**
- Banner at 80% quota
- Modal at 95% quota
- Disable feature at 100% quota
- Clear upgrade path in each message

---

## PART 3: PAYMENT METHOD MANAGEMENT

### 3.1 Card Management Section

**Display:**
```
Default Payment Method
━━━━━━━━━━━━━━━━━━━━━
🏦 Visa ending in 4242
   Expires: 12/27
   [Make default] [Remove]

Other Cards
━━━━━━━━━━━━━━━━━━━━━
Mastercard ending in 8888
Expires: 06/28
[Make default] [Remove]

American Express ending in 1234
Expires: 03/26
[Make default] [Remove]

[+ Add New Card]
```

**Add Card Flow:**
1. Click "+ Add New Card"
2. Modal opens with form
3. Fill: Card number, Expiry, CVC, Zip
4. Real-time validation (show error immediately)
5. Submit
6. Option to set as default

**Important:**
- Only show last 4 digits
- Never store full card numbers on frontend
- Use Stripe Elements/Tokenization
- Support multiple payment methods (Visa, Mastercard, Amex, Discover)

### 3.2 Invoices & Receipts

**Display:**
```
Billing History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date      | Invoice # | Amount | Status | Actions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dec 1     | #1025     | £29    | Paid   | [PDF] [Email]
Nov 1     | #1024     | £29    | Paid   | [PDF] [Email]
Oct 1     | #1023     | £29    | Paid   | [PDF] [Email]
Sep 1     | #1022     | £0     | Trial  | [PDF]
```

**Features:**
- Sort by date (newest first)
- Filter by status (Paid, Failed, Pending)
- Search by invoice number
- Download PDF
- Email receipt
- Pagination (10 per page)

---

## PART 4: NOTIFICATION PREFERENCES

### 4.1 Notification Settings Layout

**By Event Type:**
```
Billing Notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Invoice created           Email  SMS
□ Payment received          Email  SMS
□ Payment failed            Email  SMS
□ Subscription changed      Email
□ Renewal reminder (7 days) Email

Collections Notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Collection reminder sent  Email  SMS
□ Collection escalated      Email  SMS
□ Payment verification      Email

System Notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Feature announcements     Email
□ Critical alerts           Email  SMS
□ Product updates           Email
```

**By Channel:**
```
Email Notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frequency: ☑ Real-time ☐ Daily digest ☐ Weekly
           [Save]

Event Types:
□ Invoices
□ Payments
□ Collections
□ System

SMS Notifications (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frequency: ☐ Urgent only ☑ Never

Event Types:
□ Payment received
□ Collection alerts
□ System errors
```

### 4.2 Notification Defaults

**Recommended Defaults:**
- Email Invoice Sent: ON
- Email Payment Received: ON
- Email Collection Reminder: ON
- Email System Updates: OFF
- SMS Notifications: OFF (user must opt-in)
- SMS Urgent Only: ON (if opted in)

**Important:**
- Respect user preferences
- Never force notifications
- Allow per-event control
- Show frequency options
- Easy unsubscribe link in emails

---

## PART 5: PROFILE MANAGEMENT

### 5.1 Profile Settings

**Display:**
```
Profile Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First Name: [John]
Last Name: [Smith]
Email: john@company.com
     (Cannot change email - contact support)

Company Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Company Name: [Acme Corp]
Tax ID / VAT: [GB123456789]
Website: [https://acme.com]
Phone: [+44 1632 960123]

Avatar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Profile Image]
[Upload Photo] [Remove]

Timezone
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Dropdown: Europe/London]

Preferences
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Dark mode
□ Show tutorial tips
□ Show collection warnings

[Save Changes]
```

**Validation:**
- Real-time email validation
- First/Last name: min 2 chars
- Tax ID: format validation
- Website: URL format check

### 5.2 Password & Security

**Two-Factor Authentication:**
```
Security
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Two-Factor Authentication (2FA)
Status: □ Disabled ☑ Enabled

Device: Authenticator App (Google Authenticator)
Last verified: 23 days ago
[Disable 2FA] [Change method] [View backup codes]

Password
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Last changed: 90 days ago
[Change Password]

Active Sessions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chrome on Mac | London, UK | Nov 15, 2025 | Current
Safari on iPhone | London, UK | Nov 14, 2025 | [Sign Out]
Firefox on Windows | New York, USA | Nov 10, 2025 | [Sign Out]

[Sign Out All Other Sessions]
```

---

## PART 6: RECOMMENDED SETTINGS STRUCTURE FOR RELAY

**Main Navigation (Sidebar):**

```
ACCOUNT
├─ Profile
├─ Preferences
└─ Avatar & Branding

BILLING & USAGE
├─ Current Plan
├─ Usage Monitor
├─ Payment Methods
└─ Billing History

AUTOMATION
├─ Notifications
├─ Email Templates
├─ Collection Rules
└─ Reminders

TEAM & SECURITY
├─ Team Members
├─ Permissions
├─ Password
├─ Two-Factor Auth
└─ Active Sessions

ADVANCED
├─ API Keys
├─ Webhooks
└─ Integrations
```

---

## PART 7: BEST PRACTICES CHECKLIST

✅ **Navigation**
- Sidebar for 5+ sections
- Maximum 2 levels of nesting
- Collapsible for mobile
- Active section highlighted

✅ **Billing Page**
- Show current plan prominently
- Display usage with progress indicator
- Clear upgrade CTA
- Recent invoices visible
- Download invoice option

✅ **Usage Display**
- Progress bar for simple metrics
- Percentage + remaining quota
- Reset date shown
- Alert thresholds (80%, 95%)

✅ **Upgrade Prompts**
- Banner at 80% quota
- Modal at 95% quota
- Feature gating at 100%
- Clear upgrade path
- Benefits explained

✅ **Payment Methods**
- Show last 4 digits only
- Tokenization (Stripe Elements)
- Set default card
- Remove old cards
- Add new card easily

✅ **Notifications**
- Toggle per event type
- Channel preference (Email/SMS)
- Frequency options
- Defaults respect user preference
- Easy unsubscribe

✅ **Profile**
- Real-time validation
- Avatar upload
- Timezone selection
- Company details
- Preferences storage

✅ **Security**
- 2FA setup
- Password change
- Session management
- Login history
- Sign out all option

---

This guide provides Relay with comprehensive settings and billing UX patterns based on industry leaders like Stripe, Notion, Linear, and GitHub.

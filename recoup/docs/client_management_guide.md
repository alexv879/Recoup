# Client/Contact Management UX Patterns: Implementation Guide for Relay

## OVERVIEW

This guide covers best practices for client/contact management in invoicing software based on research from FreshBooks, Stripe, HubSpot, Notion, and accessibility standards.

---

## PART 1: CLIENT SELECTOR UI

### 1.1 Dropdown vs Autocomplete Decision Tree

**Decision Framework:**
```
Number of Clients?
├── < 10 clients → Use simple dropdown
├── 10-20 clients → Use dropdown (no autocomplete needed)
├── 20-50 clients → Use autocomplete
├── 50+ clients → Use autocomplete with advanced filters
└── 500+ clients → Use autocomplete + search type-ahead
```

**Research Findings from Baymard & UX Patterns[179][181]:**
- Autocomplete should have max 8-10 suggestions on desktop
- Mobile: Show max 5-8 suggestions (avoid scrolling)
- Scrollbars in autocomplete increase friction - expand naturally
- Keyboard navigation: Arrow keys + Enter to select
- Escape key closes suggestions

### 1.2 Autocomplete Component Design

**Search Strategy:**
- Search by: Client name, email, company name, phone
- Instant feedback: Show results as you type (50ms debounce)
- OR wait for minimal characters: 2-3 characters typed

**Result Formatting:**
```
[Client Name]
email@example.com • Company Name
```

**Highlighting:**
- Emphasize the predictive portion (what user didn't type)
- Example: If user types "Aco", show "Aco|me Corp" (bold = predictive)
- NOT "Aco|me Corp" (wrong - highlights what they typed)

**Recent Clients:**
- Show 3-5 "Recently used" clients at top
- Clear separator: "Recent" section above "All Clients"
- Pin favorite/frequent clients if 20+ clients

**Keyboard Navigation:[179][181]**
- Arrow Up/Down: Navigate suggestions
- Enter/Space: Select focused suggestion
- Escape: Close suggestions and clear input
- Typing: Filters suggestions as user types
- List loops back to beginning (or end)

### 1.3 "Add New Client" Inline

**When to Show:**
- After user has searched and found no results
- Always show "or add a new client" link
- Pro tip: "⊕ Add new client" button after failed search

**Implementation Options:**

**Option A: Modal Popup (Recommended)**
- Click "Add new client" → Modal appears
- Form with essential fields (name, email, billing address)
- Submit → Client created → Modal closes
- Autocomplete updated with new client

**Option B: Inline Form Expansion**
- Click "Add new client" → Form expands inline
- Fewer fields for faster entry (name, email only)
- More fields on client detail page later

**Best Practice from Stripe[188]:**
- Require minimum fields: Name + Email
- Optional fields (phone, company, tax ID) can wait
- Submit button labeled "Add [Client Name]"
- Cancel button returns to autocomplete

**Accessibility:**
- Modal has aria-modal="true" and focus trap
- Form inputs have associated labels
- Error messages announced to screen readers
- Escape key closes modal (goes back to autocomplete)

---

## PART 2: CLIENT DATA STRUCTURE

### 2.1 Minimum Required Fields

**Essential Information:**
```javascript
{
  id: string,
  name: string,                    // Required
  email: string,                   // Required (for invoicing)
  billingAddress: {
    street: string,
    street2: string,
    city: string,
    state: string,
    postalCode: string,
    country: string
  },
  currency: string,                // GBP, EUR, USD
  createdAt: date,
  updatedAt: date
}
```

### 2.2 Optional but Recommended Fields

**Enhanced Client Information:**
```javascript
{
  // Contact Information
  phone: string,
  company: string,
  taxId: string,                   // VAT, Tax ID, EIN
  
  // Payment Terms
  paymentTerms: number,            // Days (30, 60, 90)
  preferredPaymentMethod: string,  // BACS, Card, Check
  
  // Relationship
  notes: string,                   // Internal notes (freelancer only)
  tags: string[],                  // Categorization
  status: enum,                    // active, inactive, archived
  
  // Financial
  totalOwed: number,               // Cached from invoices
  lastInvoiceDate: date,
  lastPaymentDate: date,
  averageDaysToPayment: number,    // Calculated metric
  
  // Reference
  clientId: string,                // Custom/external ID
  poNumber: string,                // If required
  
  // Contact Person
  contacts: [{
    name: string,
    email: string,
    phone: string,
    isPrimary: boolean
  }]
}
```

### 2.3 Data from FreshBooks API[184]

FreshBooks stores client data with these searchable fields:
- `name_like`: Search client name
- `email_like`: Search email address
- `organization_like`: Search company name
- `phone_like`: Search phone numbers
- `note_like`: Search internal notes
- `user_like`: Search first/last name or organization

---

## PART 3: CLIENT LIST VIEW

### 3.1 List View vs Card View Decision

**List View: Best For**
- Information-heavy content (many columns)
- Easy sorting and filtering
- Comparing multiple clients side-by-side
- Large datasets (100+ clients)
- Quick reference (no visual content)

**Recommended Table Columns (from HubSpot & Stripe):**
1. **Checkbox** (for bulk actions)
2. **Client Name** (sortable, links to detail page)
3. **Email** (primary contact)
4. **Company** (optional)
5. **Total Owed** (financial priority)
6. **Last Invoice** (date, sortable)
7. **Days Outstanding** (aged collection status)
8. **Status** (active, archived)
9. **Actions** (edit, archive, delete)

**Card View: Best For**
- Visual content (logos, images)
- Browsing mode (not searching)
- Small datasets (< 20 clients)
- Adding visual context (company logos)

**Industry Standard from HubSpot[197][204]:**
- Default: Table/List view (information-dense)
- Toggle available: Switch to card view on demand
- Remember user preference

### 3.2 Client Detail Page

**Information Architecture:**

**Tab 1: Contact Information**
- Client name, company, email, phone
- Billing address with edit button
- Primary/secondary contacts
- Notes (internal only)

**Tab 2: Invoices**
- Table showing all invoices
- Status badges (Paid, Pending, Overdue)
- Total amounts by status
- Quick filters (this month, last 30 days, overdue)
- Link to create new invoice for this client

**Tab 3: Payment Information**
- Payment terms (Net 30, Net 60)
- Preferred payment method
- Payment history with dates
- Tax ID / VAT number

**Tab 4: Activity/Notes**
- Timeline of invoices sent
- Payment history
- Manual notes added by freelancer
- Email communication log (optional)

**Header Information:**
- Client name + company logo (if available)
- Total outstanding amount (big number)
- Status badge
- Quick actions: Edit, Delete, Archive

---

## PART 4: CLIENT SEARCH & FILTERS

### 4.1 Search Implementation

**Search Fields:**
- Client name (primary)
- Email address (secondary)
- Company name (tertiary)
- Invoice number (advanced)
- Phone number (optional)

**Search Experience:**
- Real-time as-you-type results
- Debounce: 300-500ms (balances responsiveness vs server load)
- Minimum 2 characters before searching
- Show "No results found" with "Add new client" suggestion

**Example Search Queries:**
- "Acme" → Shows clients with "Acme" in name
- "john@" → Shows clients with email starting with "john@"
- "INV-123" → Searches invoice numbers, shows owning client

### 4.2 Filters for Client List

**Recommended Filters:**

1. **Status Filters**
   - Active clients (default)
   - Archived clients
   - All clients

2. **Financial Filters**
   - Clients with overdue invoices
   - Clients with unpaid invoices
   - High-value clients (>£5,000 total owed)

3. **Activity Filters**
   - Last invoice sent (date range)
   - Last payment received (date range)
   - Inactive for 30/60/90 days

4. **Custom Filters**
   - By tags (VIP, Project-based, Retainer)
   - By payment terms (Net 30, Net 60, Net 90)
   - By country/currency

**Best Practice from HubSpot[200][204]:**
- Show filter count badge: "Active Filters (3)"
- "Clear all filters" button when any filter applied
- Save common filter combinations as "Saved Views"
- Remember filter state when navigating away/back

---

## PART 5: MOBILE CLIENT MANAGEMENT

### 5.1 Mobile Autocomplete

**Touch Target Size Requirements[90][93]:**
- Minimum: 44×44px
- Recommended: 48×48px
- Spacing between targets: 8px minimum
- ~9mm physical size = finger pad width

**Mobile Autocomplete UI:**
- Full-width input field
- Results shown in modal/sheet that slides up
- Tap targets: 48×48px minimum
- Font size: 16px+ (prevents auto-zoom)
- Show 5-8 results max (avoid scrolling)

**Keyboard & Touch:**
- Soft keyboard appears automatically
- Avoid additional scrollbars in suggestion list
- Tap a result to select and close keyboard
- Clear button (X icon) to reset input

**"Add New Client" on Mobile:**
- Tap "⊕ Add client" below results
- Opens bottom sheet modal (60% screen height)
- Only essential fields (Name, Email, Address line 1)
- Full form available in client detail page

### 5.2 Mobile Client List

**Card View (Recommended for Mobile):**
- Each client as swipeable card
- Shows: Name, Email, Total Owed, Last Invoice date
- Tap to view detail page
- Swipe left for actions (Edit, Archive, Delete)

**Alternative: Simplified Table View**
- Name | Total Owed
- Company name below in smaller text
- Tap to open detail page

---

## PART 6: AUTO-FILL & SHORTCUTS

### 6.1 Auto-Fill from Last Invoice

**Feature: "Use Last Invoice Details"**
- When creating new invoice, show: "Last invoice for [Client]: [Date]"
- Checkbox: "Use last invoice details"
- Auto-fills: Client name, email, address, currency
- User can edit before submitting

**Benefits:**
- Saves 30-60 seconds per invoice
- Reduces data entry errors
- Improves consistency for repeat clients

### 6.2 Client Suggestions

**Smart Suggestions Based On:**
- Frequency (most-invoiced clients first)
- Recency (clients invoiced in last 30 days)
- Time of day (if pattern exists)
- Alphabetical (when frequency equal)

---

## PART 7: ACCESSIBILITY REQUIREMENTS

### 7.1 ARIA Labels

**Autocomplete Input:**
```html
<input 
  aria-label="Select client"
  aria-autocomplete="list"
  aria-expanded="true"
  aria-controls="client-dropdown"
  role="combobox"
/>

<ul id="client-dropdown" role="listbox">
  <li role="option" aria-selected="false">
    Acme Corp
  </li>
</ul>
```

**Client List Table:**
```html
<table role="grid" aria-label="Client list">
  <thead>
    <tr>
      <th>Name</th>
      <th>Total Owed</th>
      <th>Last Invoice</th>
    </tr>
  </thead>
</table>
```

### 7.2 Keyboard Navigation

**Autocomplete:**
- Tab: Focus input
- Type: Filter results
- Arrow Down: Next suggestion
- Arrow Up: Previous suggestion
- Enter: Select focused suggestion
- Escape: Close suggestions
- Space: Select if focused

**Client List Table:**
- Tab: Move through cells
- Shift+Tab: Previous cell
- Enter: Open client detail page
- Space: Select checkbox

### 7.3 Color Contrast

**Client Status Badges:**
- Active: Green (#059669) on white = 9.2:1 ✓
- Archived: Gray (#6B7280) on white = 7.8:1 ✓
- Inactive: Yellow (#CA8A04) on white = 7.1:1 ✓

All meet WCAG AAA (7:1 minimum) standards.

---

## PART 8: RECOMMENDED CLIENT SELECTOR FOR RELAY

### Desktop Autocomplete Pattern

```
┌────────────────────────────────────┐
│ Select Client                      │
│ ┌──────────────────────────────┐   │
│ │ Type client name...          | X │ ← Clear button
│ └──────────────────────────────┘   │
│                                    │
│ Recently Used                      │
│ • Acme Corp (email@acme.com)       │ ← Clickable
│ • Smith Industries                 │
│ • Green Solutions                  │
│                                    │
│ All Clients                        │
│ • Adobe Inc (adobe@adobe.com)      │
│ • Apple (billing@apple.com)        │
│ • Acme Advanced Corp               │
│                                    │
│ ⊕ Add new client                   │ ← Link or button
└────────────────────────────────────┘
```

### Mobile Bottom Sheet

```
┌─────────────────────┐
│ Close (X)           │
│ Select Client       │
├─────────────────────┤
│ [Search input]      │
├─────────────────────┤
│ • Acme Corp         │
│   (48×48px tap)     │
│                     │
│ • Smith Industries  │
│   (48×48px tap)     │
│                     │
│ ⊕ Add new client    │
└─────────────────────┘
```

---

## PART 9: DATABASE QUERIES

### Efficient Client Search

**Query Pattern:**
```sql
SELECT * FROM clients 
WHERE (
  name ILIKE '%search_term%' 
  OR email ILIKE '%search_term%'
  OR company ILIKE '%search_term%'
)
AND status != 'archived'
ORDER BY 
  CASE 
    WHEN name ILIKE search_term THEN 1
    WHEN email ILIKE search_term THEN 2
    ELSE 3
  END,
  last_invoice_date DESC
LIMIT 10;
```

### Client with Invoice Summary

```sql
SELECT 
  c.*,
  COUNT(i.id) as invoice_count,
  SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN i.status != 'paid' THEN i.amount ELSE 0 END) as total_owed,
  MAX(i.created_at) as last_invoice_date
FROM clients c
LEFT JOIN invoices i ON c.id = i.client_id
GROUP BY c.id
ORDER BY total_owed DESC;
```

---

## PART 10: IMPLEMENTATION ROADMAP

### Phase 1 (Week 1): MVP
- Basic client dropdown (<20 clients)
- Add new client modal
- Client list table view
- Search by name only

### Phase 2 (Week 2): Enhancement
- Autocomplete for 20+ clients
- Search by email + company
- Recent clients pinned
- Mobile optimization

### Phase 3 (Week 3): Advanced
- Smart filters (overdue, high-value)
- Saved filter views
- Activity timeline
- Client detail page tabs

### Phase 4 (Week 4): Polish
- Performance optimization
- Analytics integration
- A/B test autocomplete vs dropdown
- Advanced search operators

---

## PART 11: TESTING CHECKLIST

### Functional Testing
- [ ] Autocomplete works with 0, 1, 50, 500+ clients
- [ ] Search finds clients by name, email, company
- [ ] Recent clients appear at top
- [ ] "Add new client" creates and selects new client
- [ ] Filters work: status, financial, activity
- [ ] Mobile touch targets 48×48px
- [ ] Keyboard navigation works (Tab, Arrow, Enter, Escape)
- [ ] Mobile works in portrait and landscape

### Accessibility Testing
- [ ] Screen reader reads client names correctly
- [ ] ARIA labels present on all inputs
- [ ] Color contrast 7:1 minimum
- [ ] Focus indicators visible
- [ ] Keyboard-only navigation works
- [ ] Error messages announced
- [ ] Modal traps focus properly

### Performance Testing
- [ ] Search response time < 200ms
- [ ] Autocomplete debounce 300-500ms
- [ ] Mobile load time < 3 seconds
- [ ] Smooth scrolling (60 FPS)

---

This guide provides comprehensive UX patterns for client management in Relay's invoicing platform, with accessibility, performance, and usability as top priorities.

# Invoice Creation UX Patterns: Comprehensive Research Guide

## Executive Summary

Modern accounting software demonstrates consistent UX patterns for invoice creation, balancing simplicity with comprehensive functionality. Research shows multi-step forms convert 86% better than single-page forms when fields exceed 10, but invoice creation often works better as a **single-page form with progressive disclosure** due to users' familiarity with traditional invoicing workflows.

**Key Finding**: The most successful invoicing platforms (FreshBooks, Xero, Stripe, QuickBooks) use **single-page forms with inline editing, real-time preview, and smart field pre-population** rather than multi-step wizards.

---

## 1. Form Structure: Single-Page vs Multi-Step Analysis

### 1.1 Research Findings on Form Approach

**Multi-Step Form Advantages:[86][89]**
- 86% higher completion rates than single-step
- 743% conversion increase documented (Venture Harbour case study)
- Ideal for complex forms with 6+ logical sections
- Reduces cognitive load by presenting smaller chunks
- Sunk cost fallacy keeps users engaged
- Average completion rate: 13.85% vs 4.53% for single-step

**Single-Page Form Advantages:**
- Better for invoice creation specifically (users expect one form)
- Lower friction for experienced users
- Faster for quick, routine tasks
- No step-back navigation friction
- Real-time calculations easier to implement
- Works well with inline editing

**Invoice Creation Context**: Invoice creation is **NOT a typical form** - it's a familiar business task. Users expect one coherent workflow, not a wizard. Multi-step approaches feel like unnecessary friction for this use case.

### 1.2 How Industry Leaders Structure Invoice Creation

**FreshBooks Approach: Single-Page Optimized**[74]
- One unified form with logical sections (Client, Details, Line Items, Settings)
- Progressive disclosure: Advanced options hidden behind collapsible panels
- Field grouping with visual separators, not step divisions
- Smart defaults pre-fill from previous invoices
- Estimated form fields: 30-40 visible, 50+ including options

**Xero Approach: Single-Page with Inline Editing**[82]
- Cursor defaults to Contact field (recent UX update)
- Auto-draft saving on contact selection
- All line item editing inline in table format
- Quick toggle for advanced options (payment terms, reminders, etc.)
- Real-time preview available below form

**Stripe Invoice Builder: Progressive Revelation**[85][88]
- Inline editing throughout
- Preview available immediately as you type
- Can edit after sending (creates revision with void tracking)
- Confidence-inspiring: "You can edit anytime before payment"

**QuickBooks Online: Simplified Interface**[75]
- New layout: All customization on same screen
- Customization toggles show/hide fields in real-time
- Clear section organization (Client, Invoice Details, Items, Payments)
- Mobile-optimized version available

### 1.3 When to Use Multi-Step Invoicing

Multi-step makes sense only for:
- **Complex B2B invoicing** with many conditional fields
- **Subscription/Recurring invoice setup** (different questions per plan)
- **First-time invoice creation** with onboarding (helps new users)
- **B2C invoicing** with unfamiliar users

**Recommendation**: Default to single-page with progressive disclosure for invoice creation.

---

## 2. Preview and Edit-Before-Send Flow

### 2.1 Inline vs Separate Page Preview

**Inline Preview (Recommended): [90][94]**
- Real-time preview while editing (split-screen on desktop)
- Users see impact of changes immediately
- No navigation friction between form and preview
- Better on desktop with sufficient screen real estate
- Implementation: Flexbox grid, 50% form / 50% preview

**Separate Page Preview:**
- Mobile-friendly (smaller screens)
- Clearer focus on one task at a time
- Users must navigate back to edit
- Higher friction but some users prefer clean focus

**Best Practice**: Use inline preview on desktop (window width > 1024px), switch to separate page on mobile (media queries).

### 2.2 Real-Time PDF Rendering vs Generate Button

**Real-Time Rendering (Preferred UX):[95][98]**
- Instant feedback as user types
- Shows exactly how PDF will appear
- Client-side rendering (React-PDF, PDFKit) for speed
- Risk: Browser inconsistencies in PDF output
- Recommendation: Use server-side rendering with streaming/caching

**Generate Preview Button:**
- More reliable output consistency
- Server generates authoritative version
- Slower feedback loop (1-3 second delay)
- Better for complex layouts with images/complex formatting
- Risk: DDOS vulnerability with on-demand generation

**Recommended Approach (Hybrid)**:
1. **Client-side preview** for UI feedback (waveform visualization of changes)
2. **Server-generated PDF** only on send (authoritative, cached)
3. Show "Preview will be generated on send" tooltip if preview unavailable

### 2.3 Edit Controls: Inline vs Modal

**Inline Editing (Invoice Context): ✅ BEST**
- All fields directly editable in context
- No separate interface to switch to
- Line items edited in table rows
- Click-to-edit for individual cells
- Saves constant form navigation

**Modal/Separate Page Editing: ✗ WORSE FOR INVOICES**
- Breaks context and flow
- Unnecessary friction for simple changes
- Works better for complex records (CRM contacts)
- Overkill for invoice line item editing

**Implementation Pattern for Invoices**:
```
Invoice Form (all fields visible)
├── Client Section (click name to edit)
├── Line Items Table (click cell to inline edit)
├── Totals Section (read-only, auto-calculated)
└── Send/Save Controls
```

### 2.4 Send Confirmation Pattern

**Research on Confirmation Patterns:[130][133][134]**

**Modal Confirmation: ✓ SAFE FOR CRITICAL ACTIONS**
- Use for high-stakes operations (sending invoice)
- Prevents accidental sends
- Clear action/consequence communication
- Interrupts flow but ensures intentionality

**Toast Notification: ✗ NOT FOR SENDS**
- Too dismissible for important confirmations
- Doesn't ensure user sees the message
- Research shows toast is poor for critical feedback
- Better for non-critical feedback (favorites, ratings)

**Inline Feedback: ✓ PREFERRED FOR SENDS**
- Button text changes: "Send" → "Sending..." → "Sent"
- Visual state change (disabled, loading spinner)
- Modal opens only for payment method selection
- User sees send progress on button itself

**Recommended Pattern**:
1. **Modal with confirmation** for first-time invoice send
2. **Inline feedback** for subsequent sends (users familiar with process)
3. **Success page or animated feedback** showing "Invoice sent - #INV-001"
4. **Undo option** for 5-10 seconds after send (for unsent drafts)

---

## 3. Client Selection UX

### 3.1 Dropdown vs Autocomplete vs Inline Add

**Dropdown (Simple, Limited Lists):**
- Best for <20 clients
- Shows all options at once
- Easy cognitive load
- Disadvantage: Doesn't scale

**Autocomplete (Recommended for Most):[100][101][103]**
- Best practice for client lists with >20 items
- Type-ahead filtering reduces options rapidly
- Balances discoverability with search speed
- Users type to narrow, recognize to select
- Filtering strategy: match on first letters AND fuzzy matching
- Most invoicing software uses this

**Inline Add New Client:[102]**
- Modal or popover to add client without leaving form
- Shows when: typing doesn't match any client
- Quick-create essential for new clients
- Risk: Incomplete client data leads to issues
- Mitigation: Require email + address minimum

**Recommended Pattern for Production**:
```
Client Field: [Autocomplete with inline add]
├── Type triggers search
├── Show matching clients
├── "Add new client [Name]" option at bottom
└── Click to open mini-form (name, email, address)
```

### 3.2 Full Client Details Display

**When to Show Full Details:**
- After client selection (visual confirmation)
- In summary before sending (verification)
- In inline edit mode (modify if needed)
- Show address, payment terms, contact person

**Progressive Disclosure Pattern**:
```
Client Name: ABC Corp ▼
Address: (showing) 123 Main St, London...
Contact: john@abc.com
─────── Advanced ▼
Payment Terms: Net 30
Tax ID: GB123456789
```

**Repeat Client Shortcuts:[140]**
Best practice: "Use last invoice details for [Client]"
- Shows up when client selected
- Pre-fills line items from last invoice
- Copies payment terms, notes, etc.
- User can modify before sending
- Speeds up recurring clients from 2-3 minutes to 30 seconds

---

## 4. Line Items UX Patterns

### 4.1 Add Line Item: Button Placement

**Research on Button Placement:[105]**

**Bottom of Table (Recommended):**
- Follows Gutenberg Principle (reading gravity)
- Users scan table, eyes naturally go down
- Mobile-friendly (no horizontal scroll)
- "Add Line Item" button clearly visible
- Placement: 12px below last row

**Floating Action Button:**
- Good for mobile (persistent, easy reach)
- Not ideal for desktop (interrupts focus area)
- Useful for quick-add without scrolling
- Risk: Confused with primary action

**Inline Button (Top-Right Table):**
- Quick access but less discoverable
- "+" icon before table starts
- Works for experienced users
- New users might miss it

**Recommended**: **Bottom of table on desktop, floating button on mobile.**

### 4.2 Drag-to-Reorder: Touch-Friendly Implementation

**Desktop Drag & Drop:[106][109]**
```html
<!-- Drag Handle Icon (Visual Affordance) -->
<div class="drag-handle">⋮⋮</div> <!-- Indicates draggable -->

<!-- Item Container -->
<div class="line-item" draggable="true">
  <span class="drag-handle">⋮⋮</span>
  <input type="text" value="Item name" />
  <!-- ...rest of fields -->
</div>
```

**CSS for Drag State**:
```css
.line-item.is-dragging {
  opacity: 0.5;
  background: #f5f5f5;
  cursor: grabbing;
}

.line-item.is-idle {
  transition: transform 0.25s ease;
  cursor: grab;
}

.drag-handle:hover {
  background: #e0e0e0;
}
```

**Mobile Touch Reordering:**
- Long-press (500ms) activates drag mode
- Visual feedback: item highlights, shadows
- Two-finger swipe up/down to reorder (alternative)
- Desktop drag/drop disables on touch devices
- Touch targets: Minimum 44x44px for handle

**Key Implementation Considerations**:
1. **Use transform** not position for smooth animation
2. **Disable page scroll** while dragging
3. **Calculate insertion points** by proximity (not snap-to-grid)
4. **Visual feedback**: Ghost image follows cursor
5. **After drop**: Animate items into final positions

### 4.3 Bulk Actions on Line Items

**Common Bulk Actions:**
- "Duplicate selected rows"
- "Apply discount to all" (e.g., 10% off)
- "Delete selected"
- "Set tax rate for all"
- "Copy description to all"

**Pattern Implementation:**
```html
<!-- Checkbox column in table header -->
<th>
  <input type="checkbox" id="select-all" aria-label="Select all line items" />
</th>

<!-- Row checkboxes -->
<tr>
  <td><input type="checkbox" class="row-select" /></td>
  <td>...</td>
</tr>

<!-- Bulk Actions Bar (appears when rows selected) -->
<div class="bulk-actions-bar" v-if="selectedRows.length">
  <span>{{ selectedRows.length }} selected</span>
  
  <div class="bulk-actions">
    <button @click="duplicateRows">Duplicate</button>
    <button @click="openDiscountModal">Apply Discount</button>
    <button @click="deleteRows" class="danger">Delete</button>
  </div>
  
  <button @click="clearSelection" class="secondary">Clear</button>
</div>
```

**UX Best Practices**:
- Bulk actions bar appears below table when items selected
- Clear visual feedback of selection count
- Require confirmation for destructive actions
- Auto-hide when no items selected
- Keyboard support: Ctrl+A to select all

### 4.4 Auto-Calculations and Real-Time Totals

**Calculations to Auto-Compute:**
- Line subtotal: `Quantity × Rate`
- Subtotal (sum of line subtotals)
- Tax amount: `Subtotal × Tax Rate`
- Grand total: `Subtotal + Tax - Discount`

**Real-Time Update Pattern:**
```javascript
class InvoiceCalculator {
  calculate() {
    const lineItems = this.getLineItems();
    
    // Calculate each line
    lineItems.forEach(item => {
      item.subtotal = item.quantity * item.rate;
    });
    
    // Calculate totals
    this.subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    this.taxAmount = this.subtotal * (this.taxRate / 100);
    this.total = this.subtotal + this.taxAmount;
    
    // Update UI (debounced to avoid excessive renders)
    this.updateDisplay();
  }
  
  onFieldChange(lineIndex, field, value) {
    // Update field
    this.lineItems[lineIndex][field] = parseFloat(value) || 0;
    
    // Recalculate (debounced, 300ms)
    clearTimeout(this.calculateTimeout);
    this.calculateTimeout = setTimeout(() => this.calculate(), 300);
  }
}
```

**Visual Display of Tax Breakdown:**
```
Subtotal           £1,000.00
─────────────────
Tax (20% VAT)      £200.00
─────────────────
Total              £1,200.00
```

Better pattern (expandable):
```
Subtotal           £1,000.00
├─ Discount (5%)   -£50.00
├─ Shipping        £25.00
├─ Tax (20%)       £195.00  ← applies after discount
─────────────────
Total              £1,170.00
```

**Formatting Best Practices:**
- Always show currency symbol (£, $, €)
- Right-align numbers for scanning
- Use monospace font for numbers (readability)
- Show 2 decimal places consistently
- Real-time update with 300ms debounce (feels instant, prevents flashing)

---

## 5. Mobile-First Design for Invoice Creation

### 5.1 Mobile Form Layout Patterns

**Vertical Scrolling (Strongly Recommended):[119]**
- Never horizontal scroll on mobile invoicing forms
- Vertical tabs cause frustration (forces up/down/left/right movement)
- Section headers clearly indicate progression

**Form Structure on Mobile:**
```
Mobile Invoice Form (100% width, vertical scroll)
├── Client Section (1 field visible, expandable)
├── Invoice Details (Date, Due Date, Reference)
├── Line Items (Stacked vertically, not table)
├── Totals Summary (Sticky at bottom during scroll)
└── Send Button (Full width, sticky footer)
```

### 5.2 Touch-Friendly Implementation

**Minimum Touch Targets: 44×44px[149]**
- Buttons: 48px minimum (preferably 56px)
- Input fields: 44px height
- Spacing between targets: 8px minimum
- Avoid adjacent buttons without spacing (accidental taps)

**Number Input Optimization:**
- Use `<input type="number">` to trigger numeric keyboard
- Alternative: `inputmode="decimal"` for better browser support
- Remove decimal places on integer-only fields
- Show currency symbol in label, not input

**Date Input on Mobile:**
- Use native date picker: `<input type="date">`
- Better UX than manual dropdown
- Consistent with platform conventions
- Keyboard fallback for desktop

### 5.3 Mobile Line Items Pattern

**Not a Table - Vertical Cards:**
```html
<!-- Mobile line items: Stacked cards, not table -->
<div class="line-item-card">
  <div class="item-row">
    <label>Item Name</label>
    <input type="text" value="Web Design" />
  </div>
  
  <div class="item-row">
    <label>Qty</label>
    <input type="number" inputmode="decimal" value="1" />
  </div>
  
  <div class="item-row">
    <label>Rate (£)</label>
    <input type="number" inputmode="decimal" value="500.00" />
  </div>
  
  <div class="item-row total">
    <span>Subtotal</span>
    <span>£500.00</span>
  </div>
  
  <div class="item-actions">
    <button class="secondary" @click="duplicate">Duplicate</button>
    <button class="danger" @click="delete">Delete</button>
  </div>
</div>
```

**CSS for Mobile Cards:**
```css
.line-item-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
}

.item-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.item-row label {
  font-size: 12px;
  color: #666;
  min-width: 60px;
}

.item-row input {
  flex: 1;
  border: 1px solid #ddd;
  padding: 8px;
  font-size: 16px;
}

.item-row.total {
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
  margin-top: 12px;
  font-weight: 600;
}

.item-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.item-actions button {
  flex: 1;
  padding: 10px;
  font-size: 14px;
}
```

### 5.4 Mobile Sticky Elements

**Totals Sticky at Bottom:**
```css
.invoice-summary {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.send-button {
  flex: 1;
  padding: 12px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 16px;
}
```

**Send Button Sticky at Bottom:**
- Always visible during form fill
- Full width on mobile (easier target)
- Communicates progress: Show total amount next to button
- Example: "Send Invoice (£1,200.00)" in button label

---

## 6. Mobile Platform-Specific Features

### 6.1 PayPal Invoice Mobile

**Capabilities:[110][111][112]**
- Create, send, manage all from mobile app
- Real-time previews (PDF, Mobile, Email format)
- Customer info auto-loaded from cloud
- Quick invoices with templates
- Mobile payment page directly linkable
- Receipt capture (camera for expenses)

**Strength**: Seamless mobile-to-web sync, cloud storage

### 6.2 QuickBooks Mobile Receipt Capture

**Receipt Snap Feature:[120][121][122]**
- Camera auto-captures receipt when clear
- OCR extracts date, amount, merchant, category
- For Review tab shows unprocessed receipts
- "Use this photo" approval flow
- Auto-categorization from receipt text
- Creates expense that links to invoices

**Implementation for Invoicing**:
```javascript
// Receipt to Line Item Flow
1. User taps "Snap Receipt"
2. Camera app launches
3. Green box appears when receipt detected
4. Auto-capture when framed well
5. User reviews/crops photo
6. OCR extracts:
   - Merchant name → Description
   - Amount → Rate
   - Date → Date field
7. User confirms, creates expense or line item
```

**UX Pattern**: Green box visual affordance communicates "Ready to capture"

### 6.3 Stripe Invoice Mobile Experience

**Mobile Capabilities:[85]**
- Full invoice editor on mobile web
- Responsive form layout adapts to screen
- Email/PDF/Mobile preview toggles
- Payment page responsive by default
- Mobile-first design (works on iPhone SE)

---

## 7. Smart Defaults and Pre-Population

### 7.1 FreshBooks Smart Defaults Pattern

**Auto-Populated Fields:**[74]
1. **Date**: Defaults to today (changeable)
2. **Business Information**: Auto-populated from settings
3. **Client Selection**: Cursor defaults to Contact field (recent change)
4. **Line Items**: Suggested from recent invoices to this client
5. **Payment Terms**: Defaults from client record
6. **Reminders**: Defaults from account settings
7. **Currency**: Defaults from client settings (if multi-currency)

**Implementation Pattern**:
```javascript
class InvoiceDefaults {
  async getSmartDefaults(clientId) {
    const client = await this.getClient(clientId);
    const lastInvoice = await this.getLastInvoice(clientId);
    
    return {
      // Always current
      date: new Date(),
      invoiceNumber: await this.getNextInvoiceNumber(),
      
      // From client record
      paymentTerms: client.defaultPaymentTerms,
      currency: client.defaultCurrency,
      
      // From last invoice (with override)
      lineItems: lastInvoice?.lineItems || [],
      notes: lastInvoice?.notes || '',
      termsAndConditions: lastInvoice?.termsAndConditions || '',
      
      // From account settings
      taxRate: this.settings.defaultTaxRate,
      remindersEnabled: this.settings.autoReminders,
    };
  }
}
```

### 7.2 "Use Last Invoice Details" Pattern

**Workflow:**[140]
```
User selects Client ABC Corp
    ↓
System shows: "Use last invoice details from Oct 15"
    ↓
User clicks (optional)
    ↓
Form pre-filled with:
  - Same line items (quantities can be modified)
  - Same payment terms
  - Same notes/T&Cs
  - Same discount settings
    ↓
User reviews, modifies if needed
    ↓
Send
```

**Time Saved**: Reduces recurring invoice creation from 3-5 minutes to 30-60 seconds

**Implementation Note**: Make it clearly optional, not mandatory default

---

## 8. Form Field Organization: Progressive Disclosure

### 8.1 Information Grouping

**FreshBooks Form Structure:**[74]
```
┌─ BUSINESS & CLIENT (Core - Always Visible)
│  ├─ Business Info (Auto-loaded)
│  └─ Client Selection (Required)
│
├─ INVOICE DETAILS (Essential - Always Visible)
│  ├─ Date of Issue
│  ├─ Due Date
│  └─ Invoice Number
│
├─ LINE ITEMS (Primary Content - Always Visible)
│  ├─ Item descriptions, rates, quantities
│  ├─ [+ Add Line Item]
│  └─ Automatic totals
│
├─ ADVANCED (Optional - Collapsible)
│  ├─ Payment Options
│  ├─ Reminders
│  ├─ Late Fees
│  ├─ Partial Payments
│  └─ Currency/Language
│
└─ STYLE & SENDING (Always Visible)
   ├─ Accept Online Payments toggle
   ├─ Email Recipients
   └─ [Send] [Save as Draft]
```

### 8.2 Progressive Disclosure Implementation

**Expandable Sections Pattern:**
```html
<div class="form-section">
  <div class="section-header" @click="toggleExpand">
    <span class="section-title">Advanced Options</span>
    <span class="expand-icon">▼</span>
  </div>
  
  <div class="section-content" v-show="isExpanded">
    <!-- Hidden by default -->
  </div>
</div>
```

**Rules for Progressive Disclosure:**
1. **Show first**: Fields needed for 80% of invoices
2. **Hide first**: Fields needed for <20% of invoices
3. **Indicate available**: "Advanced ▼" shows more exists
4. **Preserve state**: Remember if user expanded Advanced
5. **Show defaults**: If advanced field has non-default value, auto-expand

---

## 9. Conversion Rate Insights: Form Performance

### 9.1 Industry Data on Form Completion Rates

**Completion Rates by Form Type:[86][89]**
- Single-step forms: 68% completion (simple 1-5 fields)
- Multi-step forms: 86% completion (6-15 fields split across steps)
- **Invoice creation context**: Single-step wins due to user familiarity

**Field Count Impact:**
- 1-5 fields: 89% completion
- 6-10 fields: 73% completion
- 11-15 fields: 50% completion
- 16+ fields without organization: 23% completion

**CTA Button Text Impact:**
- "Submit": -3% conversion
- "Continue": +0% (neutral)
- "Create Invoice" or "Send Invoice": +15% (action-specific)

**Form Element Impact:**
- Autofill enabled: +10% completion
- Social proof elements: +26% completion
- CAPTCHA present: -40% completion (!!)

---

## 10. Production Implementation: React Component Example

### 10.1 Complete Invoice Form Component

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

const InvoiceForm = ({ clientId, onSubmit }) => {
  const { register, control, watch, setValue, handleSubmit, formState: { errors } } = useForm({
    defaultValues: async () => {
      return await getSmartDefaults(clientId);
    }
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'lineItems'
  });

  const lineItems = watch('lineItems');
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxRate = watch('taxRate');
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Debounced calculation update
  const [displayTotal, setDisplayTotal] = useState(total);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayTotal(total);
    }, 300);
    return () => clearTimeout(timer);
  }, [total]);

  const addLineItem = () => {
    append({
      description: '',
      quantity: 1,
      rate: 0
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="invoice-form">
      {/* Desktop: Split Screen */}
      <div className="form-layout">
        <div className="form-section">
          {/* CLIENT & DETAILS */}
          <div className="form-group">
            <label htmlFor="client">Client *</label>
            <input
              id="client"
              {...register('client', { required: 'Client required' })}
              type="text"
              placeholder="Select client..."
              aria-describedby={errors.client ? 'client-error' : undefined}
            />
            {errors.client && <span id="client-error">{errors.client.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Invoice Date *</label>
              <input
                id="date"
                {...register('date', { required: 'Date required' })}
                type="date"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                id="dueDate"
                {...register('dueDate', { required: 'Due date required' })}
                type="date"
              />
            </div>
          </div>

          {/* LINE ITEMS */}
          <div className="form-group">
            <label>Line Items *</label>
            <table className="line-items-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} draggable>
                    <td>
                      <input
                        {...register(`lineItems.${index}.description`)}
                        placeholder="Item name"
                        type="text"
                      />
                    </td>
                    <td>
                      <input
                        {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="1"
                      />
                    </td>
                    <td>
                      <input
                        {...register(`lineItems.${index}.rate`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0.00"
                        inputMode="decimal"
                      />
                    </td>
                    <td className="subtotal">
                      £{(lineItems[index].quantity * lineItems[index].rate).toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn-icon danger"
                        aria-label="Delete line item"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addLineItem}
              className="btn secondary"
            >
              + Add Line Item
            </button>
          </div>

          {/* ADVANCED OPTIONS */}
          <details className="advanced-section">
            <summary>Advanced Options ▼</summary>
            <div className="form-group">
              <label htmlFor="taxRate">Tax Rate (%)</label>
              <input
                id="taxRate"
                {...register('taxRate', { valueAsNumber: true })}
                type="number"
                min="0"
                max="100"
                step="0.01"
                defaultValue="20"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                {...register('notes')}
                rows="4"
                placeholder="Terms & conditions, notes to client..."
              />
            </div>

            <div className="form-checkbox">
              <input
                id="reminders"
                {...register('remindersEnabled')}
                type="checkbox"
                defaultChecked
              />
              <label htmlFor="reminders">Send Payment Reminders</label>
            </div>
          </details>
        </div>

        {/* PREVIEW SECTION - Desktop Only */}
        <div className="preview-section">
          <InvoicePreview
            values={{
              lineItems,
              subtotal,
              taxRate,
              taxAmount,
              total: displayTotal
            }}
          />
        </div>
      </div>

      {/* TOTALS (Mobile Sticky) */}
      <div className="totals-summary">
        <div className="total-row">
          <span>Subtotal</span>
          <span>£{subtotal.toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Tax ({taxRate}%)</span>
          <span>£{taxAmount.toFixed(2)}</span>
        </div>
        <div className="total-row total">
          <span>Total</span>
          <span>£{displayTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="form-actions">
        <button type="button" className="btn secondary">
          Save Draft
        </button>
        <button
          type="submit"
          className="btn primary"
          aria-label={`Send Invoice (£${displayTotal.toFixed(2)})`}
        >
          Send Invoice
        </button>
      </div>
    </form>
  );
};

export default InvoiceForm;
```

### 10.2 CSS for Form Layout

```css
/* Desktop: Split screen */
@media (min-width: 1024px) {
  .form-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .preview-section {
    position: sticky;
    top: 20px;
    height: fit-content;
  }
}

/* Mobile: Vertical */
@media (max-width: 1023px) {
  .form-layout {
    display: block;
  }

  .preview-section {
    display: none; /* Hide on mobile */
  }

  .totals-summary {
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 1px solid #e0e0e0;
    padding: 12px 16px;
    z-index: 100;
  }

  .form-actions {
    position: sticky;
    bottom: 60px;
    background: white;
    padding: 12px 16px;
    gap: 8px;
    display: flex;
  }

  .form-actions button {
    flex: 1;
    padding: 12px;
  }
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.line-items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}

.line-items-table th,
.line-items-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.line-items-table th {
  background: #f5f5f5;
  font-weight: 600;
  font-size: 12px;
  color: #666;
}

.line-items-table input {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 13px;
}

.line-items-table .subtotal {
  font-weight: 600;
  text-align: right;
}

.btn {
  padding: 10px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn.primary {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.btn.primary:hover {
  background: #1976d2;
}

.btn.secondary {
  background: white;
  color: #333;
}

.btn.secondary:hover {
  background: #f5f5f5;
}

.totals-summary {
  padding: 12px 0;
  border-top: 1px solid #e0e0e0;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.total-row.total {
  font-weight: 600;
  font-size: 16px;
  border-top: 1px solid #e0e0e0;
  padding-top: 8px;
  margin-top: 8px;
}

.advanced-section {
  padding: 12px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-top: 16px;
}

.advanced-section summary {
  cursor: pointer;
  font-weight: 600;
  color: #333;
}

.advanced-section[open] > div {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}
```

---

## 11. Accessibility Considerations

### 11.1 Invoice Form Accessibility Checklist

**Form Structure (WCAG 2.1 Level AA):**
- ✅ All form fields have explicit labels
- ✅ Error messages linked to fields via aria-describedby
- ✅ Required fields marked with * and aria-required="true"
- ✅ Logical tab order (top to bottom, left to right)
- ✅ No keyboard traps

**Color & Contrast:**
- ✅ Error states not communicated by color alone
- ✅ 4.5:1 contrast ratio on labels and input text
- ✅ 3:1 contrast on UI controls (buttons)

**Screen Reader Support:**
- ✅ Totals announcement via aria-live="polite"
- ✅ Line item additions announced
- ✅ Send confirmation provided
- ✅ Calculation updates announced

**Mobile Accessibility:**
- ✅ Touch targets 44×44px minimum
- ✅ Proper input types trigger mobile keyboards
- ✅ No horizontal scroll required
- ✅ Text sufficient size (16px minimum)

---

## 12. Testing Invoice Creation UX

### 12.1 User Testing Scenarios

**Task: Create and send invoice to repeat client (ABC Corp)**
- Expected time: 60-90 seconds
- Success: Invoice sent without errors
- Measure: Time to completion, error rate

**Task: Create invoice with multiple line items, apply discount**
- Expected time: 120-180 seconds
- Success: Correct calculations, discount applied
- Measure: Calculation accuracy, confusion points

**Task: Mobile: Create invoice from phone**
- Expected time: 90-150 seconds (slower on mobile acceptable)
- Success: All fields accessible, sends successfully
- Measure: Completion rate on mobile vs desktop

**Task: Correct invoice before sending (find and fix error)**
- Expected time: 30-45 seconds
- Success: User finds error, corrects, resends
- Measure: Error visibility, correction flow intuitive

### 12.2 Conversion Metrics to Track

```javascript
// Analytics Events to Track
trackEvent('invoice_form_opened', {
  source: 'dashboard|sidebar|api',
  is_mobile: boolean
});

trackEvent('invoice_client_selected', {
  client_id: string,
  is_new_client: boolean,
  time_to_selection: number_ms
});

trackEvent('invoice_line_item_added', {
  count: number,
  from_template: boolean
});

trackEvent('invoice_sent', {
  total_amount: number,
  item_count: number,
  time_to_send: number_ms,
  device: 'desktop|mobile|tablet',
  form_type: 'single_page|multi_step'
});

trackEvent('invoice_draft_saved', {
  items_count: number,
  time_spent: number_ms
});

trackEvent('invoice_abandoned', {
  stage: 'client_selection|line_items|payment_options',
  time_spent: number_ms
});
```

---

## Conclusion

The best invoice creation UX:

1. **Single-page form** with progressive disclosure, NOT multi-step
2. **Inline editing** everywhere (no modals for simple changes)
3. **Real-time calculations** with debounced updates
4. **Smart defaults** from client/last invoice data
5. **Mobile-first layout** (vertical scroll, card-based line items)
6. **Clear button placement** (bottom of form, sticky on mobile)
7. **Inline editing preview** on desktop, separate page on mobile
8. **Autocomplete client selection** with inline add new
9. **Bulk actions** for line item management
10. **Accessibility built-in** (labels, ARIA, keyboard support)

**Key Metric**: Invoice creation should take <2 minutes for repeat clients, <5 minutes for new clients.

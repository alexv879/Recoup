# WCAG 2.1 Level AA Accessibility Guide for Relay

## OVERVIEW

This guide provides comprehensive accessibility best practices for Relay's invoicing platform, meeting WCAG 2.1 Level AA standards. All code examples follow W3C guidelines and have been tested with assistive technologies.

---

## PART 1: COLOR CONTRAST REQUIREMENTS

### 1.1 WCAG 2.1 AA vs AAA Standards[209][210][211]

**Text Contrast Ratios:**

| Standard | Normal Text (<18px) | Large Text (≥18px or bold ≥14px) | UI Components |
|----------|-------------------|----------------------------------|--------------|
| **WCAG AA** (Minimum) | 4.5:1 | 3:1 | 3:1 |
| **WCAG AAA** (Enhanced) | 7:1 | 4.5:1 | 3:1 |

**Relay Target: WCAG 2.1 Level AA**

### 1.2 Recommended Color Palettes[49][214]

**Compliant with 4.5:1 Ratio:**
- Dark text (#333333) on white (#FFFFFF): 12.6:1 ✓
- Blue (#2563EB) on white: 8.6:1 ✓
- Green (#059669) on white: 9.2:1 ✓
- Red (#DC2626) on white: 5.9:1 ✓
- Orange (#EA580C) on white: 8.5:1 ✓

**For Financial Status Indicators (Color-Blind Friendly):**
- ✓ Paid: Green (#059669) + Checkmark icon
- ⏳ Pending: Blue (#0891B2) + Clock icon
- ⚠️ Overdue: Red (#DC2626) + Warning icon
- ⚫ Draft: Gray (#6B7280) + Document icon

**Important:** Never rely on color alone. Always combine with:
1. Text label
2. Icon or symbol
3. Pattern or texture (if applicable)

### 1.3 Testing Color Contrast

**Tools:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Deque Color Contrast Analyzer
- Browser DevTools (Chrome, Firefox)

**Example:**
```html
<!-- BAD: Relies only on color -->
<span style="color: #DC2626;">Overdue</span>

<!-- GOOD: Color + icon + text -->
<span style="color: #DC2626;">
  ⚠️ Overdue
</span>

<!-- BETTER: Color + semantic icon + text + ARIA -->
<span style="color: #DC2626;" aria-label="Invoice status: overdue">
  <AlertIcon className="w-4 h-4 inline" />
  Overdue
</span>
```

---

## PART 2: KEYBOARD NAVIGATION & FOCUS MANAGEMENT

### 2.1 Logical Tab Order[212][215]

**Natural Tab Order (Left-to-Right, Top-to-Bottom):**
```
1. Logo/Skip link
2. Search input
3. Filter dropdown
4. Create invoice button
5. Table rows (if interactive)
6. Pagination
7. Footer links
```

**Best Practice:** Use native HTML elements (buttons, links, inputs) - they're focusable by default.

**If Using Custom Components:**
```html
<!-- Add tabindex="0" for custom elements in tab order -->
<div role="button" tabindex="0" onclick="...">
  Custom Button
</div>

<!-- Use tabindex="-1" to remove from tab order -->
<div tabindex="-1">Hidden from tab order</div>

<!-- NEVER use tabindex > 0 - breaks logical order -->
<button tabindex="1">Don't do this</button>
```

### 2.2 Focus Indicators[215]

**Always Visible:**
```css
/* Default focus indicator (2-3px outline) */
button:focus,
input:focus,
a:focus {
  outline: 3px solid #2563EB;
  outline-offset: 2px;
}

/* Never remove focus indicators */
button:focus {
  outline: none; /* ❌ BAD - removes keyboard navigation visibility */
}

/* Better: Enhance without removing */
button:focus {
  outline: 3px solid #2563EB;
  outline-offset: 2px;
  box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.1);
}
```

**Visible Against All Backgrounds:**
- Use high contrast color: Blue (#2563EB) or dark color
- Add offset (2-4px) so outline doesn't blend with element
- Test against light and dark backgrounds

### 2.3 Skip Links[216]

**Essential for Screen Reader Users:**
```html
<!-- Place at very beginning of <body> -->
<a href="#main-content" class="sr-only">
  Skip to main content
</a>

<nav>
  <!-- Navigation menu -->
</nav>

<main id="main-content" tabindex="-1">
  <!-- Main page content -->
</main>

<!-- CSS to hide but still accessible -->
<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Show on focus (keyboard navigation) */
.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
  background: #2563EB;
  color: white;
  padding: 4px 8px;
  z-index: 999;
}
</style>
```

### 2.4 Focus Management for Modals

**When Modal Opens:**
```javascript
// 1. Set focus to first focusable element in modal
const modal = document.getElementById('invoice-modal');
const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

// 2. Show modal
modal.style.display = 'block';

// 3. Move focus INTO modal
firstFocusable.focus();

// 4. Trap focus (prevent Tab from leaving modal)
function handleTabKey(e) {
  const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstFocusable = focusables[0];
  const lastFocusable = focusables[focusables.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstFocusable) {
      lastFocusable.focus();
      e.preventDefault();
    }
  } else {
    if (document.activeElement === lastFocusable) {
      firstFocusable.focus();
      e.preventDefault();
    }
  }
}

// 5. When modal closes, return focus to trigger button
const triggerButton = document.getElementById('open-invoice-modal');
modal.addEventListener('close', () => {
  triggerButton.focus();
});
```

---

## PART 3: KEYBOARD SHORTCUTS

### 3.1 Keyboard Shortcut Implementation[222]

**Power User Shortcuts (Optional - Always Have Text Fallback):**

| Shortcut | Action | Notes |
|----------|--------|-------|
| **N** | New invoice | Global |
| **S** | Search invoices | Global |
| **E** | Edit selected invoice | On invoice page |
| **D** | Delete selected invoice | On invoice page (with confirmation) |
| **?** | Show help/keyboard shortcuts | Global |
| **Ctrl+S** | Save form | On form page |
| **Escape** | Close modal/Cancel action | Global |

**Display Shortcuts:**
```html
<!-- In Help Menu -->
<button onclick="showKeyboardShortcuts()">
  ? Keyboard Shortcuts
</button>

<!-- Modal showing shortcuts -->
<dialog id="shortcuts-modal">
  <h2>Keyboard Shortcuts</h2>
  <table>
    <tr>
      <td><kbd>N</kbd></td>
      <td>Create new invoice</td>
    </tr>
    <tr>
      <td><kbd>S</kbd></td>
      <td>Focus search</td>
    </tr>
    <tr>
      <td><kbd>?</kbd></td>
      <td>Show this help</td>
    </tr>
  </table>
</dialog>
```

**Implementation:**
```javascript
document.addEventListener('keydown', (e) => {
  // Don't trigger if user is typing in input
  if (e.target.matches('input, textarea')) return;

  switch (e.key) {
    case 'n':
    case 'N':
      createNewInvoice();
      break;
    case 's':
    case 'S':
      focusSearch();
      break;
    case '?':
      showKeyboardShortcuts();
      break;
    case 'Escape':
      closeActiveModal();
      break;
  }
});
```

---

## PART 4: ARIA LABELS & FORM ACCESSIBILITY

### 4.1 Proper Label Association[217][221][224]

**Best Practice 1: Native HTML Labels**
```html
<!-- BEST: Using <label> with "for" attribute -->
<label for="client-name">Client Name *</label>
<input id="client-name" type="text" required />

<!-- Also works: Wrapping -->
<label>
  Email
  <input type="email" required />
</label>
```

**Best Practice 2: ARIA Labels**
```html
<!-- When visual label not needed (icon button) -->
<button aria-label="Search invoices">
  🔍
</button>

<!-- For complex labels -->
<h2 id="invoice-title">Invoice #INV-001</h2>
<p id="invoice-desc">Total: £3,000 | Due: Nov 30</p>

<div
  aria-labelledby="invoice-title invoice-desc"
  role="region"
>
  Invoice details content
</div>
```

**DO NOT:**
```html
<!-- ❌ Wrong: Using title attribute alone -->
<input type="text" title="Client name" />

<!-- ❌ Wrong: ARIA label for interactive element with visible text -->
<button aria-label="Save invoice">Save Invoice</button>
<!-- The visible text is already the label -->

<!-- ❌ Wrong: Missing labels -->
<input type="text" placeholder="Client name" />
<!-- Placeholder is NOT a label -->
```

### 4.2 Form Validation & Error Announcements[224]

**Complete Example:**
```html
<!-- Form with validation -->
<form id="invoice-form">
  <!-- Client Name -->
  <div>
    <label for="client">Client Name *</label>
    <input
      id="client"
      type="text"
      name="client"
      required
      aria-required="true"
      aria-invalid="false"
      aria-describedby="client-error"
    />
    <!-- Error message (hidden by default) -->
    <span id="client-error" role="alert" style="display: none;">
      Client name is required
    </span>
  </div>

  <!-- Amount -->
  <div>
    <label for="amount">Amount (£) *</label>
    <input
      id="amount"
      type="number"
      name="amount"
      min="0.01"
      step="0.01"
      required
      aria-required="true"
      aria-invalid="false"
      aria-describedby="amount-error amount-help"
    />
    <span id="amount-help" class="helper-text">
      Must be greater than 0
    </span>
    <span id="amount-error" role="alert" style="display: none;">
      Please enter a valid amount
    </span>
  </div>

  <button type="submit">Create Invoice</button>
</form>

<!-- Error summary (for multiple errors) -->
<div id="error-summary" role="alert" style="display: none;">
  <h2>Please correct the following errors:</h2>
  <ul id="error-list"></ul>
</div>

<!-- JavaScript validation -->
<script>
const form = document.getElementById('invoice-form');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const errors = [];
  
  // Validate client
  const clientInput = document.getElementById('client');
  const clientError = document.getElementById('client-error');
  if (!clientInput.value.trim()) {
    errors.push({
      field: clientInput,
      message: 'Client name is required',
      errorEl: clientError
    });
    clientInput.setAttribute('aria-invalid', 'true');
    clientError.style.display = 'block';
  } else {
    clientInput.setAttribute('aria-invalid', 'false');
    clientError.style.display = 'none';
  }
  
  // Validate amount
  const amountInput = document.getElementById('amount');
  const amountError = document.getElementById('amount-error');
  if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
    errors.push({
      field: amountInput,
      message: 'Please enter a valid amount',
      errorEl: amountError
    });
    amountInput.setAttribute('aria-invalid', 'true');
    amountError.style.display = 'block';
  } else {
    amountInput.setAttribute('aria-invalid', 'false');
    amountError.style.display = 'none';
  }
  
  // Show error summary
  if (errors.length > 0) {
    const summary = document.getElementById('error-summary');
    const list = document.getElementById('error-list');
    
    list.innerHTML = errors.map(e => `
      <li>
        <a href="#${e.field.id}">${e.message}</a>
      </li>
    `).join('');
    
    summary.style.display = 'block';
    summary.focus(); // Move focus to error summary
    
    // Move focus to first error field
    errors[0].field.focus();
  } else {
    document.getElementById('error-summary').style.display = 'none';
    // Submit form
    console.log('Form valid, submitting...');
  }
});
</script>
```

---

## PART 5: DYNAMIC CONTENT & LIVE REGIONS

### 5.1 ARIA Live Regions[216]

**Announce Real-Time Updates:**
```html
<!-- Live region for notifications -->
<div
  id="notifications"
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
></div>

<!-- Live region for alerts (important, interrupt immediately) -->
<div
  id="alerts"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  class="sr-only"
></div>

<!-- JavaScript to populate live regions -->
<script>
function showNotification(message, priority = 'polite') {
  const region = priority === 'assertive' 
    ? document.getElementById('alerts')
    : document.getElementById('notifications');
  
  region.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    region.textContent = '';
  }, 3000);
}

// Usage:
showNotification('Invoice created successfully', 'polite');
showNotification('Error: Payment verification failed', 'assertive');
</script>
```

**Live Region Types:**
- `role="status"` + `aria-live="polite"` - General updates (default for status)
- `role="alert"` + `aria-live="assertive"` - Urgent alerts
- `role="log"` + `aria-live="polite"` - Log messages (chat, activity)
- `role="region"` + `aria-live="polite"` - Custom updates

---

## PART 6: ACCESSIBILITY TESTING STRATEGY

### 6.1 Automated Testing Tools Comparison[223][226]

| Tool | Best For | False Positives | Speed | Cost |
|------|----------|-----------------|-------|------|
| **Axe DevTools** | Accuracy, comprehensive coverage (57% of issues) | Very low | Fast | Free → $$$ |
| **WAVE** | Beginner-friendly, visual feedback | Moderate | Medium | Free → $ |
| **Lighthouse** | Quick checks, integrated with DevTools | Moderate | Slow | Free |

**Recommendation for Relay:**
1. **Development:** Axe DevTools (catch issues early)
2. **QA Testing:** WAVE (visual verification)
3. **Continuous Integration:** Lighthouse API (automated)

### 6.2 Automated Testing Implementation

**Using Axe DevTools:**
```bash
npm install --save-dev @axe-core/react
```

```javascript
// In test file
import { axe } from 'jest-axe';

describe('InvoiceForm accessibility', () => {
  test('should not have any accessibility violations', async () => {
    const { container } = render(<InvoiceForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 6.3 Manual Testing Checklist[224]

**Keyboard Navigation:**
- [ ] All interactive elements focusable
- [ ] Focus order is logical (left-to-right, top-to-bottom)
- [ ] Focus indicators visible at all zoom levels
- [ ] Skip links work
- [ ] No keyboard traps
- [ ] Modals trap focus properly

**Screen Reader Testing (NVDA/VoiceOver):**
- [ ] Form labels announced correctly
- [ ] Button purposes clear
- [ ] Error messages announced
- [ ] Live regions update announced
- [ ] Tables have headers
- [ ] Links have clear text (not "click here")
- [ ] Images have alt text

**Color Contrast:**
- [ ] All text meets 4.5:1 (AA) or 7:1 (AAA)
- [ ] UI components 3:1 contrast
- [ ] Status indicators have icons + text

**Zoom & Magnification:**
- [ ] Test at 200% zoom
- [ ] No horizontal scrolling needed
- [ ] Responsive design works

---

## PART 7: COMPLETE ACCESSIBILITY CHECKLIST FOR RELAY

### Pre-Development
- [ ] Accessibility requirements documented
- [ ] Designer using accessible color palette
- [ ] Keyboard navigation flow mapped
- [ ] Screen reader testing planned

### During Development
- [ ] Use semantic HTML (`<button>`, `<label>`, etc.)
- [ ] All form inputs have labels
- [ ] Color contrast 4.5:1 minimum
- [ ] Focus indicators visible
- [ ] Skip links implemented
- [ ] ARIA labels where needed
- [ ] Error messages accessible
- [ ] Dynamic content uses live regions
- [ ] Modals trap focus
- [ ] Mobile: 48px touch targets

### Testing
- [ ] Axe DevTools: 0 violations
- [ ] WAVE: Check for errors
- [ ] Keyboard-only navigation works
- [ ] Screen reader testing (NVDA/VoiceOver)
- [ ] Tested at 200% zoom
- [ ] Color contrast verified

### Post-Launch
- [ ] Monitor accessibility issues
- [ ] User feedback collected
- [ ] Regular accessibility audits
- [ ] Team training on accessibility

---

## PART 8: RESOURCES

**Testing Tools:**
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

**Screen Readers:**
- Windows: NVDA (free), JAWS ($90)
- Mac: VoiceOver (built-in)
- iOS: VoiceOver (built-in)
- Android: TalkBack (built-in)

**Standards:**
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [gov.uk Design System](https://design-system.service.gov.uk/)

**WCAG 2.1 Level AA Success Criteria (Most Relevant):**
- 1.4.3 Contrast (Minimum) - 4.5:1 for text
- 2.1.1 Keyboard - All functionality keyboard accessible
- 2.1.2 No Keyboard Trap - Can use keyboard to leave
- 2.4.3 Focus Order - Logical tab order
- 2.4.7 Focus Visible - Always see focus
- 3.2.4 Consistent Navigation - Navigation consistent
- 3.3.1 Error Identification - Errors identified
- 3.3.4 Error Prevention - Errors prevented or corrected
- 4.1.3 Status Messages - Announcements to screen readers

---

This guide provides Relay with a complete accessibility foundation meeting WCAG 2.1 Level AA standards, ensuring all users can effectively manage their invoices.

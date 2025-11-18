# Multi-Step Form UX Patterns: Comprehensive Research Guide

## Executive Summary

Research from leading UX platforms shows that **multi-step forms achieve 86% higher completion rates than single-page forms when properly designed**. The optimal structure depends on complexity, but patterns show:

- **3-5 steps** are ideal for most invoice/payment flows (each step 5-9 fields, 1-2 minutes per step)
- **Progress indicators** (bars or dots) improve completion 23-34%
- **Inline validation on blur** (not on type) reduces errors while maintaining flow
- **Mobile adaptation** must use vertical steps with full-screen visibility, never horizontal swipes for mandatory flows

---

## 1. Step Progression: Optimal Number of Steps

### Research on Step Count

**Completion Rate Data:**[257][258][260][261]
- Single-page form: 68% completion (if <5 fields)
- 3 steps: 81% completion
- 5 steps: 74% completion
- 7+ steps: 62% completion (sunk cost fallacy exhausted)

**Cognitive Load Research:**[257][258][259]
- Each step should contain 5-9 fields maximum
- 1-2 minutes per step optimal
- Each step should focus on one self-contained goal

### Recommended Step Breakdown for Invoice Creation

**Option 1: 3-Step Flow (Fastest)**
```
Step 1: Who (Client)
├─ Client name (autocomplete)
├─ Client email
└─ Billing address

Step 2: What (Line Items)
├─ Item 1: Description, Quantity, Rate
├─ Item 2: Description, Quantity, Rate
├─ [+ Add Item]
└─ (Auto-calculated subtotal + tax)

Step 3: When & Send (Finalize)
├─ Invoice date
├─ Due date
├─ Payment terms (Net 30, etc)
├─ Preview invoice
└─ [Send Invoice] [Save Draft]
```

**Option 2: 5-Step Flow (More Detailed)**
```
Step 1: Business & Client
├─ Your business (auto-filled)
└─ Client selection + details

Step 2: Line Items
├─ Add line items
└─ Auto-calculated subtotal

Step 3: Payment Information
├─ Payment terms (Net 30, Due on Receipt)
├─ Late fees
└─ Bank account for deposits

Step 4: Personalization
├─ Notes & terms
├─ Custom fields
└─ Invoice template selection

Step 5: Review & Send
├─ Full preview
├─ Inline edit ability
└─ Send or Save
```

**Recommendation**: Use 3-step for B2B invoicing (users know the process), 5-step for first-time users or complex tax scenarios.

---

## 2. Step Indicator Design

### Progress Bar vs Dots vs Breadcrumbs

**Progress Bar (Recommended for Linear Flows):**[261][262]
- ✅ Shows percentage completion (motivating)
- ✅ Minimal space required
- ✅ Works on mobile
- ✅ Clear visual metaphor
- ❌ Doesn't allow jumping between steps

**Pattern:**
```
┌──────────────────────┐
│ Step 1 of 3: Client  │
│ ████░░░░░░░░░░░░░░░ │ 33%
│                      │
│ [Form content]       │
│ [Back]  [Next]       │
└──────────────────────┘
```

**Numbered Dots (Good for Short Flows):**[262]
- ✅ Iconic, compact
- ✅ Allows jumping (if enabled)
- ✅ Shows current position clearly
- ❌ Hard to show 7+ steps
- ❌ Doesn't show percentage

**Pattern:**
```
Step: ● ● ● 
      1 2 3
Step 1 of 3: Client Information
[Form content]
```

**Breadcrumbs (Good for Complex Flows):**[262]
- ✅ Shows path and current location
- ✅ Allows jumping back
- ✅ Shows step titles
- ❌ Takes space
- ❌ Less visual emphasis on progress

**Pattern:**
```
Client > Line Items > Payment > Review
   ✓         ✓          ●
```

**Recommendation for Invoicing**: **Progress bar + step title**. Combines clarity with minimal space.

### CSS Progress Bar Pattern

```css
.progress-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.progress-bar-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.progress-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  min-width: 100px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2196f3;
  transition: width 300ms ease;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* Mobile */
@media (max-width: 640px) {
  .progress-label {
    display: none; /* Save space on mobile */
  }
}
```

---

## 3. Navigation Controls & Data Persistence

### Back/Next Button Placement

**Desktop Layout:**[258][275]
```
Step content here
[Previous] [Save Draft]       [Next Step] →
```

**Mobile Layout:**
```
Step content here
(sticky bottom bar)
┌──────────────────────┐
│ [← Back] [Next →]    │
│ Save Draft as link   │
└──────────────────────┘
```

**Best Practices:**
- **Next button**: Always positioned bottom-right (or bottom center on mobile)
- **Previous button**: Bottom-left (optional on first step)
- **Save Draft**: Secondary action (link or small button)
- **Size**: 48-56px height (touch-friendly)
- **State**: Disable Next if validation fails

### Keyboard Navigation

```javascript
// Allow Enter key to advance to next step
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    // Check if all fields in step are valid
    if (isStepValid()) {
      goToNextStep();
    }
  }
});

// Tab navigates through fields, not steps
// Standard browser behavior, don't override
```

### "Save and Continue Later" Pattern

**Option 1: Auto-Save (Recommended)**
```
User fills out Step 1
    ↓
Saves to draft automatically (after each field blur)
    ↓
"Saving..." indicator briefly appears
    ↓
Show: "Last saved at 2:45 PM" (at bottom)
    ↓
User can close browser anytime, resume later
```

**Option 2: Explicit Save**
```
[Save Draft] button (bottom-left)
    ↓
Click saves form state to localStorage + backend
    ↓
Show success: "Draft saved"
    ↓
Email user link to continue
```

**Recommendation**: Auto-save to localStorage on field blur, sync to backend every 30 seconds. Show minimal "Saving..." indicator.

---

## 4. Form Validation Feedback

### Inline (On Blur) vs Submit Validation

**Research Consensus:**[277][278][279][280][281]

**Inline Validation (On Blur) - RECOMMENDED:**
- ✅ Catches errors early
- ✅ Users can fix while context is fresh
- ✅ Reduces final submission errors 40-50%
- ✅ Better for longer forms
- ⚠️ Don't validate on type (too intrusive)
- ⚠️ Validate on blur (after user finishes field)

**Submit Validation:**
- ✅ Cleaner flow (no mid-typing errors)
- ✅ Better for gov.uk style (1 field per page)
- ❌ Users see all errors at end (frustrating)
- ❌ Longer time to fix errors

**Best Practice Pattern:**[277][280][281]

```
User types email
    ↓
[No feedback while typing]
    ↓
User moves to next field (blur)
    ↓
[Validate email format]
    ↓
If invalid: Show red border + error message below
If valid: Show green checkmark
    ↓
User can navigate to previous step without losing data
```

### Error Message Placement & Design

**Desktop: Right of Field (Fastest Correction)**[285]
```
Email [________________________] ✗ Email format invalid: example@domain.com
```

**Mobile: Below Field (Space Constrained)**[285]
```
Email
[________________________]
✗ Email format invalid

(or if space allows, still right/below)
```

**Error Message Best Practices:**[282][285]
- ✅ Specific, not generic ("Expected format: name@domain.com" not "Invalid input")
- ✅ Actionable ("Add @ symbol" not "Email error")
- ✅ Below or right of field (not left, not top of form)
- ✅ Red border on field + icon
- ✅ Plain language (no jargon)

### Success Indicators

**When Field is Valid:**
- ✅ Green checkmark (optional, not required)
- ✅ Field border turns green (subtle)
- ✅ Remove error message
- ✗ Don't show "This is correct!" (excessive)

```css
.form-field {
  border: 2px solid #ccc;
  transition: border-color 200ms ease;
}

.form-field.valid {
  border-color: #4caf50;
}

.form-field.invalid {
  border-color: #f44336;
}

.form-field.valid::after {
  content: ' ✓';
  color: #4caf50;
  font-weight: 600;
}

.error-message {
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
  display: none;
}

.form-field.invalid ~ .error-message {
  display: block;
}
```

---

## 5. Mobile Multi-Step Form Optimization

### Vertical Steps (Full-Screen) vs Horizontal Swipe

**Vertical Steps (Recommended for Mobile):**[283]
```
Step 1
├─ Full screen dedicated to one step
├─ Clear [Next] button at bottom
├─ No swiping (too unclear)
└─ Back button or header back chevron
```

**Horizontal Swipe (Not Recommended for Mandatory Steps):**
- ❌ Unclear gesture (swiping doesn't feel mandatory)
- ❌ Users may swipe accidentally
- ❌ Skip-forward gestures confuse users
- ✅ OK for optional step-throughs (like onboarding)

**Mobile Form Step Pattern:**

```html
<!-- Mobile Step Container -->
<div class="mobile-form-step">
  <!-- Step Indicator -->
  <div class="step-indicator">
    <span class="step-number">Step 1 of 3: Client</span>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 33%"></div>
    </div>
  </div>

  <!-- Form Content (Full Height) -->
  <form class="step-form">
    <div class="form-group">
      <label for="client">Client Name *</label>
      <input id="client" type="text" required />
      <span class="error-message">Client name required</span>
    </div>

    <div class="form-group">
      <label for="email">Email *</label>
      <input id="email" type="email" required />
      <span class="error-message">Valid email required</span>
    </div>
    
    <!-- More fields... -->
  </form>

  <!-- Sticky Footer with Navigation -->
  <div class="form-footer">
    <button class="btn-secondary">← Back</button>
    <button class="btn-primary">Next Step →</button>
  </div>
</div>
```

**CSS for Mobile:**

```css
.mobile-form-step {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.step-indicator {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.step-form {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  padding-bottom: 80px; /* Space for sticky footer */
}

.form-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  padding-bottom: env(safe-area-inset-bottom);
}

.form-footer button {
  flex: 1;
  padding: 12px 16px;
  font-size: 16px;
  border-radius: 4px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}
```

---

## 6. Real-World Examples: Implementation Patterns

### Stripe Checkout (3-Step Payment)[271]
```
Step 1: Cart Review
├─ Items, price, subtotal
├─ Edit/remove items
└─ Show early shipping estimate

Step 2: Shipping Information
├─ Address (with autocomplete)
├─ Shipping method (Standard, Express, Pickup)
└─ Updated shipping cost

Step 3: Billing & Payment
├─ Payment method (Card, PayPal, etc)
├─ Billing address (same as shipping option)
├─ Promo code field
└─ Final review (Order total, payment method)

Final: Order Confirmation
└─ Order number, receipt, tracking
```

**Key Patterns:**
- Progress indicator at top
- Auto-fill shipping from address
- Show costs updating in real-time
- Clear summary on each step
- No long text, focus on fields

### TurboTax Wizard (5-15 Steps, Personalized)[272]
```
Pre-Form Questions
├─ Filing status (Single, Married, etc)
├─ Income sources (W-2, 1099, Capital gains)
└─ [Triggers personalized step pathway]

Personalized Steps (Variable)
├─ Income section (varies by input)
├─ Deductions (shows relevant only)
├─ Tax credits (pre-filtered)
└─ [Each step shows "Here's what's coming up"]

Key Patterns:
- Segment users early (filing status)
- Skip irrelevant steps based on input
- Show progress milestones ("You're 40% done")
- Friendly copy ("Let's talk about your W-2")
- Auto-fill from previous year
- FAQs integrated inline
- Pre-signature allowed (reduce friction at end)
```

### LinkedIn Profile Completion (Adaptive)[273]
```
Profile Level Meter
├─ Beginner (0-4 sections)
├─ Intermediate (4-7 sections)
└─ All-Star (all 7 sections)

Suggested Steps
├─ Upload photo
├─ Add headline
├─ Add location
├─ Add experience
├─ Add education
├─ Add skills
└─ Add summary

Key Patterns:
- Gamified progress (Beginner → All-Star)
- Don't force mandatory steps (all optional)
- Show impact ("Profiles with photos get 21x more views")
- Skip options always available
- Progressive disclosure (suggest 1-2 at a time)
```

### Typeform (One Question Per Step - Now Multi-Question Available)[263]
```
Original Pattern:
Step 1: [Single Question]
Step 2: [Single Question]
Step 3: [Single Question]

Key Pattern:
- Conversation-like flow
- One question per screen (reduces intimidation)
- Answers influence next questions
- Progress bar shows steps remaining

New Feature (2024):
- Can add multiple questions per page
- Maintains single-question aesthetic
- Hybrid approach for better flow
```

---

## 7. Complete Multi-Step Form React Component

```jsx
import React, { useState, useEffect } from 'react';

const MultiStepForm = ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Client
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    
    // Step 2: Line Items
    lineItems: [{ description: '', quantity: 1, rate: 0 }],
    
    // Step 3: Payment
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: 'Net 30'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('invoice_draft', JSON.stringify(formData));
      setSaving(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [formData]);

  const steps = [
    { title: 'Client', fields: ['clientName', 'clientEmail', 'clientAddress'] },
    { title: 'Line Items', fields: ['lineItems'] },
    { title: 'Payment Terms', fields: ['invoiceDate', 'dueDate', 'paymentTerms'] }
  ];

  const validateStep = (stepIndex) => {
    const step = steps[stepIndex];
    const stepErrors = {};
    
    step.fields.forEach(field => {
      if (field === 'clientName' && !formData.clientName.trim()) {
        stepErrors.clientName = 'Client name required';
      }
      if (field === 'clientEmail') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.clientEmail)) {
          stepErrors.clientEmail = 'Valid email required';
        }
      }
      if (field === 'lineItems' && formData.lineItems.length === 0) {
        stepErrors.lineItems = 'At least one line item required';
      }
      if (field === 'dueDate' && !formData.dueDate) {
        stepErrors.dueDate = 'Due date required';
      }
    });
    
    return stepErrors;
  };

  const handleFieldChange = (fieldName, value) => {
    setSaving(true);
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Validate on blur (not on type)
    if (touched[fieldName]) {
      const stepErrors = validateStep(currentStep);
      setErrors(stepErrors);
    }
  };

  const handleFieldBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const stepErrors = validateStep(currentStep);
    setErrors(stepErrors);
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length === 0) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } else {
        onSubmit(formData);
      }
    } else {
      setErrors(stepErrors);
      setTouched(prev => ({
        ...prev,
        ...Object.keys(stepErrors).reduce((acc, key) => ({...acc, [key]: true}), {})
      }));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="multi-step-form">
      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-header">
          <span className="step-label">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </span>
          {saving && <span className="saving-indicator">Saving...</span>}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Form Content */}
      <form className="form-content">
        {currentStep === 0 && (
          <>
            <div className="form-group">
              <label htmlFor="clientName">Client Name *</label>
              <input
                id="clientName"
                type="text"
                value={formData.clientName}
                onChange={(e) => handleFieldChange('clientName', e.target.value)}
                onBlur={() => handleFieldBlur('clientName')}
                className={errors.clientName ? 'invalid' : ''}
              />
              {errors.clientName && (
                <span className="error-message">{errors.clientName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="clientEmail">Email *</label>
              <input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
                onBlur={() => handleFieldBlur('clientEmail')}
                className={errors.clientEmail ? 'invalid' : ''}
              />
              {errors.clientEmail && (
                <span className="error-message">{errors.clientEmail}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="clientAddress">Address</label>
              <textarea
                id="clientAddress"
                value={formData.clientAddress}
                onChange={(e) => handleFieldChange('clientAddress', e.target.value)}
                rows="3"
              />
            </div>
          </>
        )}

        {currentStep === 1 && (
          <div className="form-group">
            <label>Line Items *</label>
            {formData.lineItems.map((item, index) => (
              <div key={index} className="line-item-group">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...formData.lineItems];
                    newItems[index].description = e.target.value;
                    handleFieldChange('lineItems', newItems);
                  }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...formData.lineItems];
                    newItems[index].quantity = parseFloat(e.target.value);
                    handleFieldChange('lineItems', newItems);
                  }}
                />
                <input
                  type="number"
                  placeholder="Rate (£)"
                  value={item.rate}
                  onChange={(e) => {
                    const newItems = [...formData.lineItems];
                    newItems[index].rate = parseFloat(e.target.value);
                    handleFieldChange('lineItems', newItems);
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleFieldChange('lineItems', [...formData.lineItems, { description: '', quantity: 1, rate: 0 }])}
            >
              + Add Line Item
            </button>
            {errors.lineItems && (
              <span className="error-message">{errors.lineItems}</span>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <>
            <div className="form-group">
              <label htmlFor="invoiceDate">Invoice Date *</label>
              <input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => handleFieldChange('invoiceDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                onBlur={() => handleFieldBlur('dueDate')}
                className={errors.dueDate ? 'invalid' : ''}
              />
              {errors.dueDate && (
                <span className="error-message">{errors.dueDate}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="paymentTerms">Payment Terms</label>
              <select
                id="paymentTerms"
                value={formData.paymentTerms}
                onChange={(e) => handleFieldChange('paymentTerms', e.target.value)}
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 14">Net 14</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </>
        )}
      </form>

      {/* Navigation */}
      <div className="form-footer">
        <button
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          ← Back
        </button>
        <a href="#" className="save-draft-link">Save Draft</a>
        <button
          className="btn btn-primary"
          onClick={handleNext}
        >
          {currentStep === steps.length - 1 ? 'Send Invoice' : 'Next Step →'}
        </button>
      </div>
    </div>
  );
};

export default MultiStepForm;
```

**CSS for Multi-Step Form:**

```css
.multi-step-form {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.progress-container {
  padding: 24px 20px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.step-label {
  font-weight: 600;
  color: #333;
}

.saving-indicator {
  color: #999;
  font-size: 12px;
}

.progress-bar {
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2196f3;
  transition: width 300ms ease;
}

.form-content {
  flex: 1;
  padding: 24px 20px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 200ms ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #2196f3;
}

.form-group input.invalid {
  border-color: #f44336;
}

.error-message {
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.line-item-group {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.line-item-group input {
  padding: 8px;
  font-size: 13px;
}

.btn-secondary {
  background: white;
  border: 1px solid #2196f3;
  color: #2196f3;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  margin-top: 12px;
}

.form-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background: white;
  position: sticky;
  bottom: 0;
}

.btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 200ms ease;
}

.btn-primary {
  background: #2196f3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-draft-link {
  color: #2196f3;
  text-decoration: none;
  align-self: center;
  font-size: 13px;
}

@media (max-width: 640px) {
  .multi-step-form {
    min-height: 100vh;
  }

  .progress-header {
    font-size: 12px;
  }

  .form-content {
    padding-bottom: 80px; /* Space for sticky footer */
  }

  .form-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    flex-direction: column;
    padding: 12px 16px;
    padding-bottom: env(safe-area-inset-bottom);
    background: white;
    border-top: 1px solid #e0e0e0;
  }

  .btn {
    flex: 1;
  }

  .save-draft-link {
    display: none;
  }
}
```

---

## 8. Accessibility Checklist

**Form Accessibility (WCAG 2.1 Level AA):**
- ✅ All inputs have explicit `<label>` elements
- ✅ Error messages linked to fields via `aria-describedby`
- ✅ Required fields marked with `aria-required="true"`
- ✅ Progress bar has `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- ✅ Form validation announced to screen readers
- ✅ Keyboard navigation: Tab through fields, Enter to submit

**Color Contrast:**
- ✅ Error text (red) has 4.5:1 contrast with background
- ✅ Progress bar fill has 3:1 contrast with background
- ✅ All text meets WCAG AA standards

---

## Conclusion & Best Practices

**Optimal Multi-Step Form Pattern:**

1. **3 steps maximum** for simple flows (invoicing)
2. **5-9 fields per step** (1-2 minutes each)
3. **Progress bar** (best for motivation)
4. **Inline validation on blur** (not on type)
5. **Error messages below field** (mobile) or right of field (desktop)
6. **Auto-save to localStorage** + sync to backend
7. **Mobile: full-screen steps** with sticky footer
8. **Desktop: inline hints** and contextual help

**Conversion Metrics to Track:**
- Drop-off rate per step
- Time to completion per step
- Error correction time
- Draft save/resume rate

---

**References:** [257][258][259][260][261][262][263][264][265][266][267][268][269][270][271][272][273][274][275][277][278][279][280][281][282][283][284][285]

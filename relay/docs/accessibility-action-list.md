# Accessibility Action List
Version: 1.0 | Date: 15 Nov 2025

## 1. Purpose
Concrete WCAG AA+/AAA tasks derived from accessibility research ensuring financial UI clarity & inclusivity.

## 2. Contrast Tokens
| Token | Hex | Ratio vs #FFFFFF | Usage |
|-------|-----|------------------|-------|
| text-primary | #1F1F24 | 13.5:1 | Body text |
| text-secondary | #3A3A45 | 8.2:1 | Secondary labels |
| accent-green | #0D7F50 | 4.8:1 | Action buttons |
| accent-red | #B00020 | 5.5:1 | Error states |

## 3. Required Enhancements
[] Skip link at top of DOM → `href="#main"`.
[] ARIA live region for payment received & voice transcript updates.
[] Motion reduction: disable confetti & waveform animation when `prefers-reduced-motion`.
[] Invoice table headers `<th scope="col">` semantic.
[] Focus ring style ≥3px high contrast (#0D7F50).
[] Keyboard trap audit dialogs.
[] PDF export tagging (title, language, table headers).

## 4. Testing Strategy
- Axe CI on `/dashboard`, `/invoices/[id]`, `/pricing` pages.
- Manual screen reader pass (NVDA) for dynamic transcript updates.
- Color contrast script verifying tokens >= target ratio (financial figures aim ≥7:1).

## 5. Open Questions
1. Additional language attribute for invoice PDFs? (likely en-GB)
2. Provide high contrast theme toggle? (future)

Completion Criteria: All checklist items complete; zero serious Axe violations; contrast script passes.

---
Traceability: Accessibility financial UX research & contrast map gap.
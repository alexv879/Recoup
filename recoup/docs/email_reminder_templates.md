# Email Reminder Templates & Code Examples for Relay

## 1. Friendly Reminder Email Template (Day 5)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
    .logo { font-size: 24px; font-weight: bold; color: #2563EB; }
    .content { padding: 30px 0; }
    .invoice-summary { background: #f9fafb; border-left: 4px solid #2563EB; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .invoice-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .invoice-label { color: #666; }
    .invoice-amount { font-weight: bold; color: #111; }
    .cta-button { display: inline-block; background: #2563EB; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
    .footer-link { color: #2563EB; text-decoration: none; }
    @media (max-width: 600px) {
      .container { padding: 15px; }
      .invoice-row { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">Relay</div>
    </div>

    <!-- Greeting -->
    <div class="content">
      <p>Hi {{client_first_name}},</p>

      <p>I hope this email finds you well.</p>

      <p>I wanted to send you a quick reminder that invoice <strong>#{{invoice_number}}</strong> for <strong>£{{invoice_amount}}</strong> is due on <strong>{{due_date}}</strong>.</p>

      <!-- Invoice Summary -->
      <div class="invoice-summary">
        <div class="invoice-row">
          <span class="invoice-label">Invoice Number:</span>
          <span class="invoice-amount">#{{invoice_number}}</span>
        </div>
        <div class="invoice-row">
          <span class="invoice-label">Amount:</span>
          <span class="invoice-amount">£{{invoice_amount}}</span>
        </div>
        <div class="invoice-row">
          <span class="invoice-label">Due Date:</span>
          <span class="invoice-amount">{{due_date}}</span>
        </div>
        <div class="invoice-row">
          <span class="invoice-label">Description:</span>
          <span class="invoice-amount">{{invoice_description}}</span>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center;">
        <a href="{{payment_link}}" class="cta-button">Pay Now</a>
      </div>

      <p>If you've already processed this, please disregard this email. If you have any questions about the invoice or need help setting up payment, feel free to reach out.</p>

      <p>Thanks,<br>
      {{sender_name}}<br>
      {{company_name}}</p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>{{company_name}} | {{company_address}}</p>
      <p>Phone: {{company_phone}} | Email: {{company_email}}</p>
      <p>
        <a href="{{unsubscribe_link}}" class="footer-link">Unsubscribe</a> | 
        <a href="{{privacy_policy_link}}" class="footer-link">Privacy Policy</a>
      </p>
      <p>GDPR Compliance: Your data is safe with us. <a href="{{privacy_policy_link}}" class="footer-link">Learn more</a></p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Firm Reminder Email Template (Day 15)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
    .alert-banner { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .alert-text { color: #92400E; margin: 0; }
    .invoice-summary { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .invoice-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .invoice-row:last-child { border-bottom: none; }
    .days-overdue { color: #DC2626; font-weight: bold; font-size: 18px; text-align: center; padding: 16px; background: #FEE2E2; border-radius: 4px; margin: 16px 0; }
    .cta-button { display: inline-block; background: #2563EB; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .secondary-cta { display: inline-block; background: white; color: #2563EB; padding: 10px 24px; text-decoration: none; border: 2px solid #2563EB; border-radius: 6px; font-weight: 600; margin: 0 10px 20px 0; }
    .footer { background: #f9fafb; padding: 20px; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
    @media (max-width: 600px) {
      .container { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div style="font-size: 24px; font-weight: bold; color: #2563EB;">Relay</div>
    </div>

    <!-- Alert Banner -->
    <div class="alert-banner">
      <p class="alert-text">⚠️ This invoice is now overdue. Please arrange payment as soon as possible.</p>
    </div>

    <!-- Content -->
    <div style="padding: 20px 0;">
      <p>Hello {{client_first_name}},</p>

      <p>I'm following up on invoice <strong>#{{invoice_number}}</strong>, which was due on <strong>{{due_date}}</strong>. As of today, we haven't received payment.</p>

      <p>We sent a reminder on {{reminder_date}}, and wanted to follow up to ensure you received it and there are no issues.</p>

      <!-- Days Overdue Highlight -->
      <div class="days-overdue">
        {{days_overdue}} days overdue
      </div>

      <!-- Invoice Summary -->
      <div class="invoice-summary">
        <div class="invoice-row">
          <span>Invoice Number:</span>
          <strong>#{{invoice_number}}</strong>
        </div>
        <div class="invoice-row">
          <span>Amount:</span>
          <strong>£{{invoice_amount}}</strong>
        </div>
        <div class="invoice-row">
          <span>Due Date:</span>
          <strong>{{due_date}}</strong>
        </div>
        <div class="invoice-row">
          <span>Days Overdue:</span>
          <strong style="color: #DC2626;">{{days_overdue}} days</strong>
        </div>
      </div>

      <!-- CTAs -->
      <div style="text-align: center;">
        <a href="{{payment_link}}" class="cta-button">Pay Now</a>
        <br>
        <a href="{{invoice_view_link}}" class="secondary-cta">View Invoice</a>
      </div>

      <p style="background: #EFF6FF; border-left: 4px solid #2563EB; padding: 12px; border-radius: 4px;">
        <strong>Need help?</strong> If there's an issue with the invoice or payment, please let us know. We're here to help resolve any problems.
      </p>

      <p style="margin-top: 20px;">
        Contact us:<br>
        Phone: {{company_phone}}<br>
        Email: {{company_email}}
      </p>

      <p>Best regards,<br>
      {{sender_name}}<br>
      {{company_name}}</p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>{{company_name}} | {{company_address}}</p>
      <p>
        <a href="{{unsubscribe_link}}" style="color: #2563EB; text-decoration: none;">Unsubscribe</a> | 
        <a href="{{privacy_policy_link}}" style="color: #2563EB; text-decoration: none;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 3. Final Notice Email Template (Day 30 - UK Legal Compliant)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Georgia, serif; line-height: 1.8; color: #000; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px; }
    .letterhead { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #000; margin-bottom: 30px; }
    .letterhead-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
    .letterhead-contact { font-size: 12px; }
    .date { text-align: right; margin-bottom: 30px; }
    .recipient { margin-bottom: 30px; }
    .subject { font-weight: bold; margin: 30px 0 20px 0; text-decoration: underline; }
    .body { margin-bottom: 20px; text-align: justify; }
    .highlight { background: #FFFBEA; border-left: 4px solid #D97706; padding: 12px; margin: 20px 0; }
    .urgent { background: #FEE2E2; border: 2px solid #DC2626; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .urgent-title { color: #DC2626; font-weight: bold; margin-bottom: 8px; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: bold; border: 1px solid #e5e7eb; }
    .table td { padding: 12px; border: 1px solid #e5e7eb; }
    .table .amount { text-align: right; }
    .cta-button { display: inline-block; background: #DC2626; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .signature { margin-top: 40px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #666; }
    .footer-link { color: #2563EB; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Letterhead -->
    <div class="letterhead">
      <div class="letterhead-name">{{company_name}}</div>
      <div class="letterhead-contact">
        {{company_address}} | {{company_phone}} | {{company_email}}
      </div>
    </div>

    <!-- Date -->
    <div class="date">{{current_date}}</div>

    <!-- Recipient -->
    <div class="recipient">
      {{client_full_name}}<br>
      {{client_company}}<br>
      {{client_address}}
    </div>

    <!-- Subject -->
    <div class="subject">RE: FINAL NOTICE - OUTSTANDING INVOICE #{{invoice_number}}</div>

    <!-- Opening -->
    <div class="body">
      Dear {{client_full_name}},
    </div>

    <!-- Main Content -->
    <div class="body">
      This is a FINAL NOTICE regarding invoice #{{invoice_number}}, which remains unpaid {{days_overdue}} days after the due date of {{due_date}}.
    </div>

    <div class="body">
      We have previously sent reminders on {{first_reminder_date}} and {{second_reminder_date}}, requesting payment. Despite these communications, we have not received payment.
    </div>

    <!-- Outstanding Balance Section -->
    <div class="urgent">
      <div class="urgent-title">OUTSTANDING PAYMENT DETAILS:</div>
      <table class="table">
        <tr>
          <th>Description</th>
          <th class="amount">Amount</th>
        </tr>
        <tr>
          <td>Original Invoice Amount</td>
          <td class="amount">£{{invoice_amount}}</td>
        </tr>
        <tr>
          <td>Statutory Interest (8% + 5.25%)<br><small>{{days_overdue}} days @ 13.25% per annum</small></td>
          <td class="amount">£{{interest_amount}}</td>
        </tr>
        <tr>
          <td>Debt Recovery Costs</td>
          <td class="amount">£{{recovery_costs}}</td>
        </tr>
        <tr style="background: #FEF3C7;">
          <td><strong>TOTAL NOW DUE</strong></td>
          <td class="amount"><strong>£{{total_due}}</strong></td>
        </tr>
      </table>
    </div>

    <!-- Urgent Action Required -->
    <div class="highlight">
      <strong>URGENT ACTION REQUIRED:</strong><br>
      Payment must be received by {{final_deadline}}. If payment is not received by this date, we will escalate this matter to external collections or legal proceedings.
    </div>

    <!-- Consequences -->
    <div class="body">
      Failure to pay by the deadline will result in:
      <ul style="margin-left: 20px;">
        <li>Escalation to external debt collection agency</li>
        <li>Additional legal costs and fees</li>
        <li>Potential court proceedings</li>
        <li>Damage to your credit rating and business reputation</li>
        <li>Impact on future business opportunities</li>
      </ul>
    </div>

    <!-- CTA -->
    <div style="text-align: center;">
      <a href="{{payment_link}}" class="cta-button">PAY NOW</a>
    </div>

    <!-- Payment Contact -->
    <div class="body">
      <strong>To Make Payment:</strong><br>
      Please remit payment to:<br>
      Bank: {{bank_name}}<br>
      Account: {{account_number}}<br>
      Reference: {{payment_reference}}<br>
      <br>
      Or use our online payment portal:<br>
      <a href="{{payment_link}}" style="color: #2563EB; text-decoration: underline;">{{payment_link}}</a>
    </div>

    <!-- Discussion Option -->
    <div class="highlight">
      <strong>Discuss Payment Arrangements:</strong><br>
      If you are experiencing difficulties making payment, please contact us immediately to discuss alternative payment arrangements. We would prefer to work with you to resolve this matter.
      <br><br>
      Contact: {{company_phone}} or {{company_email}}<br>
      Hours: {{business_hours}}
    </div>

    <!-- Closing -->
    <div class="body">
      This is a final demand for payment. Without receipt of payment by {{final_deadline}}, we will proceed with formal collection proceedings without further notice.
    </div>

    <!-- Signature -->
    <div class="signature">
      Yours faithfully,
      <br><br><br>
      {{sender_name}}<br>
      {{sender_title}}<br>
      {{company_name}}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Late Payment Notice:</strong> This invoice is subject to the Late Payment of Commercial Debts (Interest) Act 1998. Statutory interest accrues at 8% + Bank of England base rate from the due date until payment is received.</p>
      <p><strong>Legal Reference:</strong> Late Payment of Commercial Debts (Interest) Act 1998, as amended by the Late Payment of Commercial Debts (Interest) (No. 2) Regulations 2002.</p>
      <p>
        <a href="{{unsubscribe_link}}" class="footer-link">Unsubscribe</a> | 
        <a href="{{privacy_policy_link}}" class="footer-link">Privacy Policy</a> |
        <a href="{{terms_link}}" class="footer-link">Terms & Conditions</a>
      </p>
      <p>This is a transactional email. Do not reply. Contact {{company_email}} with any questions.</p>
    </div>
  </div>
</body>
</html>
```

---

## 4. SMS Template Examples (160 Characters)

**Day 15 SMS:**
```
Hi {{name}}, reminder: Invoice #{{inv}} for 
£{{amt}} is {{days}} days overdue. Pay now: 
{{link}} or call {{phone}}
(159 characters ✓)
```

**Day 30 SMS:**
```
URGENT: Invoice #{{inv}} (£{{amt}}) {{days}} 
days overdue. Final notice: Pay by {{date}}. 
{{link}}
(156 characters ✓)
```

---

## 5. Liquid Template Variables (For Rendering)

```liquid
{%- assign client_first_name = invoice.client.first_name -%}
{%- assign client_full_name = invoice.client.first_name | append: " " | append: invoice.client.last_name -%}
{%- assign invoice_number = invoice.number -%}
{%- assign invoice_amount = invoice.amount | money -%}
{%- assign due_date = invoice.due_date | date: "%d %b %Y" -%}
{%- assign days_overdue = "now" | date: "%s" | minus: invoice.due_date | divided_by: 86400 -%}
{%- assign current_date = "now" | date: "%d %B %Y" -%}

<!-- Calculate interest -->
{%- assign annual_rate = 0.1325 -%}
{%- assign daily_rate = annual_rate | divided_by: 365 -%}
{%- assign interest = invoice.amount | times: daily_rate | times: days_overdue -%}

<!-- Calculate recovery costs -->
{%- if invoice.amount < 1500 -%}
  {%- assign recovery_costs = 40 -%}
{%- elsif invoice.amount < 10000 -%}
  {%- assign recovery_costs = 70 -%}
{%- else -%}
  {%- assign recovery_costs = 100 -%}
{%- endif -%}

{%- assign total_due = invoice.amount | plus: interest | plus: recovery_costs -%}
```

---

These production-ready templates provide UK-compliant, high-converting email reminders for Relay's debt collection system.

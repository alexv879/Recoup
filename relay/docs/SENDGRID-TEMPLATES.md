# SendGrid Email Templates

This document contains the HTML templates for all SendGrid email templates used in the Relay application.

## BACS Payment Claim System Templates

### 1. PAYMENT_CLAIM_NOTIFICATION
**Template ID**: `SENDGRID_TEMPLATE_PAYMENT_CLAIM_NOTIFICATION`
**To**: Freelancer
**When**: Client submits a BACS payment claim
**Purpose**: Notify freelancer to verify payment in their bank account

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Claim Received</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .highlight {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
        }
        .details {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-row:last-child {
            border-bottom: none;
        }
        .details-label {
            color: #6b7280;
            font-weight: 500;
        }
        .details-value {
            color: #111827;
            font-weight: 600;
        }
        .cta-button {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Payment Claim Received</h1>
        </div>
        <div class="content">
            <p>Hi {{freelancerName}},</p>
            
            <p><strong>{{clientName}}</strong> has submitted a payment claim for invoice <strong>#{{invoiceReference}}</strong>.</p>
            
            <div class="highlight">
                <p style="margin: 0;"><strong>⏰ Action Required:</strong> Please check your bank account and verify if you received this payment.</p>
            </div>

            <div class="details">
                <div class="details-row">
                    <span class="details-label">Invoice Number:</span>
                    <span class="details-value">#{{invoiceReference}}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Client:</span>
                    <span class="details-value">{{clientName}}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Amount:</span>
                    <span class="details-value">£{{amount}}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Payment Method:</span>
                    <span class="details-value">{{paymentMethod}}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Payment Date (claimed):</span>
                    <span class="details-value">{{paymentDate}}</span>
                </div>
                {{#if paymentReference}}
                <div class="details-row">
                    <span class="details-label">Reference:</span>
                    <span class="details-value">{{paymentReference}}</span>
                </div>
                {{/if}}
            </div>

            {{#if clientNotes}}
            <div class="details">
                <p style="margin: 0 0 8px 0;"><strong>Client Notes:</strong></p>
                <p style="margin: 0; color: #4b5563;">{{clientNotes}}</p>
            </div>
            {{/if}}

            <p style="text-align: center;">
                <a href="{{verificationUrl}}" class="cta-button">Verify Payment →</a>
            </p>

            <p><strong>What happens next?</strong></p>
            <ul>
                <li>Log into your bank account</li>
                <li>Check if you received £{{amount}} around {{paymentDate}}</li>
                <li>Click the button above to confirm or reject the claim</li>
                <li>Collection reminders are paused while this claim is pending</li>
            </ul>

            <p>If you don't see the payment, you can reject the claim and collections will resume automatically.</p>
        </div>
        <div class="footer">
            <p>Relay - Invoice Collection Automation for UK Freelancers</p>
            <p style="font-size: 12px; color: #9ca3af;">This is an automated notification. Please verify the payment in your bank account.</p>
        </div>
    </div>
</body>
</html>
```

**Dynamic Variables:**
- `{{freelancerName}}` - Freelancer's name
- `{{clientName}}` - Client's name
- `{{invoiceReference}}` - Invoice reference number
- `{{amount}}` - Payment amount
- `{{paymentMethod}}` - Payment method (Bank Transfer, Cash, Cheque)
- `{{paymentDate}}` - Date client claims payment was made
- `{{paymentReference}}` - Optional payment reference
- `{{clientNotes}}` - Optional notes from client
- `{{verificationUrl}}` - Link to verification page

---

### 2. PAYMENT_CLAIM_CONFIRMATION
**Template ID**: `SENDGRID_TEMPLATE_PAYMENT_CLAIM_CONFIRMATION`
**To**: Client
**When**: Client submits a BACS payment claim
**Purpose**: Confirm receipt of claim and explain next steps

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Claim Submitted</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .success-icon {
            text-align: center;
            font-size: 64px;
            margin: 20px 0;
        }
        .details {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-row:last-child {
            border-bottom: none;
        }
        .details-label {
            color: #6b7280;
            font-weight: 500;
        }
        .details-value {
            color: #111827;
            font-weight: 600;
        }
        .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✓ Payment Claim Submitted</h1>
        </div>
        <div class="content">
            <div class="success-icon">✅</div>
            
            <p>Hi {{clientName}},</p>
            
            <p>Thank you for confirming your payment for invoice <strong>#{{invoiceReference}}</strong>.</p>

            <div class="details">
                <div class="details-row">
                    <span class="details-label">Invoice Number:</span>
                    <span class="details-value">#{{invoiceReference}}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Amount:</span>
                    <span class="details-value">£{{amount}}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Payment Method:</span>
                    <span class="details-value">{{paymentMethod}}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Payment Date:</span>
                    <span class="details-value">{{paymentDate}}</span>
                </div>
            </div>

            <div class="info-box">
                <p style="margin: 0 0 10px 0;"><strong>What happens next?</strong></p>
                <p style="margin: 0;">{{freelancerName}} has been notified and will verify receipt of your payment in their bank account. You'll receive a confirmation email once they verify the payment.</p>
            </div>

            <p><strong>Important:</strong></p>
            <ul>
                <li>Collection reminders have been paused for this invoice</li>
                <li>Verification typically takes 1-2 business days</li>
                <li>If there's an issue, {{freelancerName}} will contact you directly</li>
            </ul>

            <p>If you have any questions, please reply to this email or contact {{freelancerName}} at {{freelancerEmail}}.</p>

            <p>Thank you,<br>The Relay Team</p>
        </div>
        <div class="footer">
            <p>Relay - Invoice Collection Automation for UK Freelancers</p>
            <p style="font-size: 12px; color: #9ca3af;">This is an automated confirmation email.</p>
        </div>
    </div>
</body>
</html>
```

**Dynamic Variables:**
- `{{clientName}}` - Client's name
- `{{invoiceReference}}` - Invoice reference number
- `{{amount}}` - Payment amount
- `{{paymentMethod}}` - Payment method
- `{{paymentDate}}` - Payment date
- `{{freelancerName}}` - Freelancer's name
- `{{freelancerEmail}}` - Freelancer's email

---

### 3. PAYMENT_CLAIM_REJECTED
**Template ID**: `SENDGRID_TEMPLATE_PAYMENT_CLAIM_REJECTED`
**To**: Client
**When**: Freelancer rejects the payment claim
**Purpose**: Notify client that payment was not found and collections will resume

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Claim Update</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
        }
        .details {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-row:last-child {
            border-bottom: none;
        }
        .details-label {
            color: #6b7280;
            font-weight: 500;
        }
        .details-value {
            color: #111827;
            font-weight: 600;
        }
        .cta-button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Payment Not Verified</h1>
        </div>
        <div class="content">
            <p>Hi {{clientName}},</p>
            
            <p>We're writing to let you know that {{freelancerName}} was unable to verify your payment claim for invoice <strong>#{{invoiceReference}}</strong>.</p>

            <div class="warning-box">
                <p style="margin: 0;"><strong>Reason:</strong> {{rejectionReason}}</p>
            </div>

            <div class="details">
                <div class="details-row">
                    <span class="details-label">Invoice Number:</span>
                    <span class="details-value">#{{invoiceReference}}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Amount Due:</span>
                    <span class="details-value">£{{amount}}</span>
                </div>
            </div>

            <p><strong>What this means:</strong></p>
            <ul>
                <li>The freelancer checked their bank account and couldn't find your payment</li>
                <li>Invoice remains unpaid and collection reminders will resume</li>
                <li>You may need to check your payment was sent correctly</li>
            </ul>

            <p><strong>Next steps:</strong></p>
            <ol>
                <li>Check your bank statement to confirm the payment was sent</li>
                <li>Verify the payment details were correct</li>
                <li>Contact {{freelancerName}} directly at {{freelancerEmail}} to resolve</li>
                <li>Or pay the invoice using the link below</li>
            </ol>

            <p style="text-align: center;">
                <a href="{{paymentUrl}}" class="cta-button">Pay Invoice →</a>
            </p>

            <p>If you believe you've already paid this invoice, please contact {{freelancerName}} directly to investigate further.</p>

            <p>Thank you,<br>The Relay Team</p>
        </div>
        <div class="footer">
            <p>Relay - Invoice Collection Automation for UK Freelancers</p>
            <p style="font-size: 12px; color: #9ca3af;">This is an automated notification.</p>
        </div>
    </div>
</body>
</html>
```

**Dynamic Variables:**
- `{{clientName}}` - Client's name
- `{{freelancerName}}` - Freelancer's name
- `{{invoiceReference}}` - Invoice reference number
- `{{amount}}` - Invoice amount
- `{{rejectionReason}}` - Reason for rejection from freelancer
- `{{freelancerEmail}}` - Freelancer's email
- `{{paymentUrl}}` - Link to payment page

---

### 4. ESCALATION_CHECK (Day 21 Pre-Escalation Email)
**Template ID**: `SENDGRID_TEMPLATE_ESCALATION_CHECK`
**To**: Client
**When**: Day 21, before escalating to AI voice call
**Purpose**: Give client final chance to confirm payment before escalation

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Urgent: Invoice Escalation Notice</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .urgent-box {
            background-color: #fee2e2;
            border: 2px solid #dc2626;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .urgent-box h2 {
            margin: 0 0 10px 0;
            color: #dc2626;
        }
        .details {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-row:last-child {
            border-bottom: none;
        }
        .details-label {
            color: #6b7280;
            font-weight: 500;
        }
        .details-value {
            color: #111827;
            font-weight: 600;
        }
        .amount-due {
            font-size: 32px;
            color: #dc2626;
            font-weight: bold;
        }
        .cta-section {
            text-align: center;
            margin: 30px 0;
        }
        .cta-button-primary {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 10px;
        }
        .cta-button-secondary {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 10px;
        }
        .timeline {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 URGENT: Invoice Escalation Notice</h1>
        </div>
        <div class="content">
            <p>Hi {{clientName}},</p>
            
            <div class="urgent-box">
                <h2>Action Required Within 72 Hours</h2>
                <p style="margin: 0; font-size: 18px;">Invoice #{{invoiceReference}} is now <strong>{{daysOverdue}} days overdue</strong></p>
                <p class="amount-due">£{{amount}}</p>
            </div>

            <p>This invoice has been overdue for {{daysOverdue}} days. Despite previous reminders, we have not received payment or confirmation.</p>

            <div class="timeline">
                <p style="margin: 0 0 10px 0;"><strong>What happens next:</strong></p>
                <p style="margin: 0;">If we don't hear from you within 72 hours, this invoice will be escalated to our automated collection system, which may include:</p>
                <ul style="margin: 10px 0 0 0;">
                    <li>Automated phone calls</li>
                    <li>Formal collection letters</li>
                    <li>Additional administrative fees</li>
                    <li>Potential impact on business relationships</li>
                </ul>
            </div>

            <div class="details">
                <div class="details-row">
                    <span class="details-label">Invoice Number:</span>
                    <span class="details-value">#{{invoiceReference}}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Original Due Date:</span>
                    <span class="details-value">{{dueDate}}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Days Overdue:</span>
                    <span class="details-value" style="color: #dc2626;">{{daysOverdue}} days</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Amount Due:</span>
                    <span class="details-value">£{{amount}}</span>
                </div>
            </div>

            <p><strong>Have you already paid?</strong></p>
            <p>If you've already sent payment via bank transfer, cash, or cheque, please click below to confirm:</p>

            <div class="cta-section">
                <a href="{{confirmPaymentUrl}}" class="cta-button-secondary">✓ I Already Paid</a>
                <br><br>
                <p style="margin: 20px 0;"><strong>- OR -</strong></p>
                <a href="{{paymentUrl}}" class="cta-button-primary">Pay Now →</a>
            </div>

            <p><strong>Having payment difficulties?</strong></p>
            <p>If you're unable to pay the full amount immediately, please contact {{freelancerName}} directly at {{freelancerEmail}} to discuss payment arrangements. Most freelancers are willing to work out a payment plan.</p>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                <strong>This is your final notice before escalation.</strong><br>
                Please take action within 72 hours to avoid additional collection activities.
            </p>

            <p>Thank you,<br>{{freelancerName}}<br>via Relay</p>
        </div>
        <div class="footer">
            <p>Relay - Invoice Collection Automation for UK Freelancers</p>
            <p style="font-size: 12px; color: #9ca3af;">This is an automated collection notice on behalf of {{freelancerName}}.</p>
        </div>
    </div>
</body>
</html>
```

**Dynamic Variables:**
- `{{clientName}}` - Client's name
- `{{invoiceReference}}` - Invoice reference number
- `{{daysOverdue}}` - Number of days overdue
- `{{amount}}` - Invoice amount
- `{{dueDate}}` - Original due date
- `{{freelancerName}}` - Freelancer's name
- `{{freelancerEmail}}` - Freelancer's email
- `{{paymentUrl}}` - Link to payment page
- `{{confirmPaymentUrl}}` - Link to "I already paid" confirmation page

---

## Implementation Notes

### Setting Up Templates in SendGrid

1. **Create each template** in SendGrid Dashboard → Email API → Dynamic Templates
2. **Copy the Template ID** for each template
3. **Add to `.env` file**:
   ```
   SENDGRID_TEMPLATE_PAYMENT_CLAIM_NOTIFICATION=d-xxxxx
   SENDGRID_TEMPLATE_PAYMENT_CLAIM_CONFIRMATION=d-xxxxx
   SENDGRID_TEMPLATE_PAYMENT_CLAIM_REJECTED=d-xxxxx
   SENDGRID_TEMPLATE_ESCALATION_CHECK=d-xxxxx
   ```

### Testing Templates

Use SendGrid's template preview feature with sample data:

```json
{
  "freelancerName": "John Smith",
  "clientName": "ABC Corporation",
  "invoiceReference": "INV-2024-001",
  "amount": "1250.00",
  "paymentMethod": "Bank Transfer (BACS)",
  "paymentDate": "15 January 2024",
  "paymentReference": "REF123456",
  "clientNotes": "Paid via BACS on 15th Jan",
  "verificationUrl": "https://relay.com/dashboard/invoices/123/verify-payment",
  "freelancerEmail": "john@example.com",
  "daysOverdue": "21",
  "dueDate": "1 January 2024",
  "paymentUrl": "https://relay.com/invoice/123",
  "confirmPaymentUrl": "https://relay.com/invoice/123"
}
```

### Handlebars Conditionals

All templates use Handlebars syntax for conditional content:
- `{{#if variable}}...{{/if}}` - Show content if variable exists
- `{{variable}}` - Display variable value
- All HTML is pre-styled for consistent branding

### Brand Colors

- Primary: `#667eea` (purple gradient start)
- Secondary: `#764ba2` (purple gradient end)
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Danger: `#dc2626` (red)
- Info: `#3b82f6` (blue)

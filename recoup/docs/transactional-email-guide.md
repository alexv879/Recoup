# Comprehensive Transactional Email Design & Deliverability Guide for SaaS

## Executive Summary

This guide provides best practices for designing, implementing, and delivering transactional emails for SaaS applications, with specific focus on invoice and payment-related communications. Key recommendations include using 60% text/40% image ratio, implementing SPF/DKIM/DMARC authentication, adopting mobile-first responsive design with 44px+ buttons, and selecting appropriate email service providers based on scale and feature requirements.

---

## PART 1: TRANSACTIONAL EMAIL TYPES FOR RELAY

### 1. Invoice Sent Confirmation (to Freelancer)

**Purpose:** Notify freelancer that an invoice has been generated and sent to the client.

**Recommended Subject Line:** `Invoice #123 sent to John Smith`
- Better than: "Your invoice is on its way" (less specific)
- Why: Includes invoice number for easy reference, client name for context

**Key Content Elements:**
- Invoice number (primary identifier)
- Client name and company
- Service description summary
- Invoice total amount
- Invoice date and due date
- "View Invoice" button (primary CTA)
- PDF attachment (backup)
- Payment methods accepted
- Support contact information

**Design Approach:**
- Header: Logo + "Invoice Notification"
- Body: Clean layout with prominent invoice summary
- Footer: Support contact, privacy policy link, company address

**Tone:** Professional, neutral-positive

**Example:**
```
From: invoices@relay.com
Subject: Invoice #1847 sent to John Smith

Hi Sarah,

Your invoice has been sent to your client. Here are the details:

Invoice #: 1847
Client: John Smith (Acme Corp)
Amount: £2,500.00
Due Date: December 20, 2025
Service: UI/UX Design - 40 hours

[View Invoice Button]

---

Payment Methods:
- Bank Transfer
- Credit Card (via Stripe)
- PayPal

If you have any questions, contact support@relay.com

Best regards,
Relay Team
```

---

### 2. Payment Received Notification (to Freelancer)

**Purpose:** Celebrate and confirm that payment has been received from the client.

**Recommended Subject Line:** `Payment received: £2,500 from John Smith`
- Better tone than: "You got paid! £2,500 from John Smith" (too casual for professional audience)
- Why: Clear, professional, includes amount and payer

**Key Content Elements:**
- Payment confirmation message
- Amount received (prominent)
- Payer name/company
- Invoice number paid (linking transaction)
- Payment date
- Payment method used
- Breakdown if partial payment
- Remaining balance (if any)
- Any additional notes (e.g., "Payment marked as received in your account")
- Support contact

**Design Approach:**
- Use positive tone and color (green accent for success)
- Include celebration graphic (optional but effective)
- Clear financial summary
- Next steps (if any)

**Tone:** Warm, congratulatory, professional

**Example:**
```
From: payments@relay.com
Subject: Payment received: £2,500 from John Smith

Hi Sarah,

Great news! You've received a payment. Here are the details:

✓ Payment Received
Amount: £2,500.00
From: John Smith (Acme Corp)
Invoice: #1847
Date Received: December 15, 2025
Payment Method: Bank Transfer
Status: Verified

This payment has been added to your account and is ready to withdraw.

[View Payment Details] [Withdraw Funds]

---

Account Balance: £5,250.00 (Available to withdraw)

Next withdrawal available: December 16, 2025

If you have any questions, contact support@relay.com

Thanks for using Relay!
Relay Team
```

---

### 3. "Payment Claimed" Notification (Fraud Prevention)

**Purpose:** Alert freelancer that a client claims they've paid but Relay hasn't verified it yet. Request freelancer to verify/reject.

**Recommended Subject Line:** `Payment verification needed for Invoice #1847`
- Better than: "John Smith claims payment on Invoice #123" (accusatory tone)
- Why: Neutral language, action-focused, includes invoice reference

**Key Content Elements:**
- Claim notification (non-accusatory)
- Client details (who claims to have paid)
- Invoice information
- Amount in question
- Claimed payment date
- Payment method claimed (if provided)
- "Verify Payment" button (primary - marks as paid)
- "Dispute Payment" button (secondary - asks for proof)
- Deadline for response (typically 5-7 days)
- Explanation of what happens if no action taken
- Support contact

**Design Approach:**
- Neutral tone, not accusatory
- Clear action buttons
- Information architecture: claims summary first, then actions
- Warning about deadline without being aggressive

**Tone:** Professional, neutral, instructional

**Example:**
```
From: disputes@relay.com
Subject: Payment verification needed for Invoice #1847

Hi Sarah,

John Smith (Acme Corp) has claimed that they paid Invoice #1847 for £2,500.00.

Claimed Payment Details:
- Amount: £2,500.00
- Date Paid: December 14, 2025
- Invoice: #1847
- Client: John Smith (Acme Corp)

Please verify if you've received this payment:

[✓ Yes, I received this payment] [✗ No, dispute this claim]

IMPORTANT: Please respond within 5 days (by December 20, 2025).

If you don't respond:
- The payment will be verified automatically after 5 days
- Funds will be released to your account

If you believe this is a disputed transaction, click the Dispute button to provide evidence.

Questions? Contact disputes@relay.com

Relay Team
```

---

### 4. Payment Verified Confirmation (to Client)

**Purpose:** Confirm to client that their payment has been verified and the invoice is now marked as paid.

**Recommended Subject Line:** `Invoice #1847 payment verified`
- Why: Clear, confirms verification, includes reference number

**Key Content Elements:**
- Verification confirmation
- Invoice number
- Amount
- Payment date
- Freelancer confirmation
- Receipt (attached or linked)
- Thank you message
- Next steps (invoice archived, ready for new invoice)
- Support contact

**Design Approach:**
- Positive confirmation
- Clean receipt summary
- Optional: link to archive invoice
- Footer: company details, next invoice notice

**Tone:** Professional, appreciative, closing

**Example:**
```
From: payments@relay.com
Subject: Invoice #1847 payment verified

Hi John,

Thank you for your payment! We've confirmed that:

✓ Payment Received
Amount: £2,500.00
From: John Smith
To: Sarah (Designer)
Invoice: #1847
Status: PAID ✓

Your receipt has been emailed separately. You can access it anytime in your account.

[View Receipt] [View All Invoices]

---

This invoice has been marked as complete. If you have any issues or need to discuss the work further, you can reach out directly to Sarah or contact support@relay.com.

Thank you for using Relay!

Relay Team
```

---

### 5. Payment Rejected Notification (to Client)

**Purpose:** Inform client that their claimed payment could not be verified and request proof or ask them to pay via alternative method.

**Recommended Subject Line:** `Payment verification failed for Invoice #1847 – Action needed`
- Why: Clear problem statement, action-oriented, includes reference

**Key Content Elements:**
- Clear rejection explanation
- Reason for rejection (e.g., "We couldn't locate payment in our system")
- Invoice details
- Options for resolution:
  - Provide payment proof (screenshot, confirmation number)
  - Pay via alternative method (link)
  - Dispute resolution process
- Deadline for response
- Support escalation contact
- FAQ section (optional)

**Design Approach:**
- Professional, not punitive tone
- Clear action buttons
- Problem → Solution structure
- Multiple resolution paths

**Tone:** Professional, helpful, problem-solving

**Example:**
```
From: payments@relay.com
Subject: Payment verification failed for Invoice #1847 – Action needed

Hi John,

We couldn't verify your claimed payment for Invoice #1847 (£2,500.00).

Invoice Details:
- Invoice #: 1847
- Amount: £2,500.00
- Due Date: December 20, 2025
- Status: PENDING

Why this happened:
We searched our payment records but couldn't locate a transaction matching your claim. This could be due to:
- Payment sent to wrong account
- Payment still processing (for bank transfers, allow 2-3 business days)
- Different amount than claimed

Next Steps:
Choose one of these options:

Option 1: Provide Payment Proof
Upload a screenshot, confirmation number, or transaction ID:
[Upload Proof]

Option 2: Pay Now
Pay using an alternative method:
[Pay via Credit Card] [Pay via Bank Transfer] [Pay via PayPal]

Option 3: Contact Support
If you believe this is an error:
[Contact Support Team]

---

Deadline: Please respond by December 20, 2025

Questions? Email support@relay.com or reply to this email.

Relay Team
```

---

## PART 2: EMAIL DESIGN TEMPLATES & PATTERNS

### Email Template Structure

**Recommended Layout:**
1. **Header Section** (60-80px)
   - Logo + company name
   - Optional: navigation links (minimal)

2. **Hero/Primary Content** (400-600px)
   - Main message/subject
   - Key details (amounts, dates, invoice numbers)
   - Primary call-to-action button

3. **Body/Details Section** (300-400px)
   - Itemized breakdown (if applicable)
   - Additional information
   - Supporting details

4. **Action Section** (80-100px)
   - Secondary CTA buttons
   - Links to view, download, or manage

5. **Footer Section** (100-150px)
   - Company contact information
   - Unsubscribe/notification preferences link
   - Privacy policy link
   - Physical address (for UK/EU compliance)
   - Social media links (optional)

### Mobile Optimization Rules

**Critical for Mobile (47.3% of opens in 2025):**

1. **Single Column Layout**
   - Stack all elements vertically
   - No side-by-side columns on mobile
   - Use CSS media queries to adjust for screens < 600px

2. **Font Sizes**
   - Body text: 14-16px minimum (no zoom required)
   - Headlines: 20-24px
   - Mobile adjustment: -2-4px smaller than desktop

3. **Button/Touch Targets**
   - Minimum 44x44px (Apple Human Interface Guidelines)
   - Recommended: 48-50px for better UX
   - Padding: 10-15px around buttons
   - Spacing between clickable elements: 12-15px

4. **Images**
   - Max width: 100% (fluid)
   - Aspect ratio: maintain proportional scaling
   - Alt text: required (shown if image fails to load)
   - Compress: optimize file size for mobile networks

5. **Line Height**
   - Desktop: 1.5em
   - Mobile: 1.6-1.7em (easier to scan on small screens)

### Branding Approach

**Logo & Domain:**
- Use custom domain: `noreply@relay.com` (not SendGrid's noreply)
- Benefits: improves trust, improves deliverability, reinforces brand
- Setup: Authenticate domain in email service provider

**Color Scheme:**
- Primary brand color: Use consistently (CTAs, highlights)
- Neutral backgrounds: White (light mode), off-white, or light gray
- Text: Dark gray (#333-#555), not pure black (more readable)
- Success states: Green (#2ecc71 or similar)
- Error/warning: Red (#e74c3c or similar)

**Typography:**
- System fonts (Arial, Helvetica, Georgia) for compatibility
- Avoid web fonts (may not render in all clients)
- Fallback stack: `Arial, Helvetica, sans-serif`

**Company Branding in Footer:**
- Company name + address
- Contact information (email, phone)
- Social media links (if applicable)
- Link to website

---

## PART 3: DELIVERABILITY & AUTHENTICATION

### Spam Avoidance Best Practices

**Subject Line Rules:**

1. **Avoid Spam Trigger Words:**
   - ❌ "FREE", "LIMITED TIME", "ACT NOW", "URGENT"
   - ✅ Clear, specific: "Invoice #1847 paid", "Payment received"

2. **Length:** 40-50 characters optimal
   - Reason: Mobile preview cuts off after 50-60 characters

3. **Personalization:** Include recipient name when possible
   - ✅ "Sarah, Invoice #1847 sent to John Smith"
   - Better engagement + lower spam score

4. **No Deception:**
   - ✅ Subject matches body content exactly
   - ❌ Subject: "Invoice" but body talks about promotions

**Content Guidelines:**

1. **Text-to-Image Ratio: 60% text / 40% images**
   - Why: Spam filters can't read text in images
   - How: Always include plain text version
   - Balance: Visuals + readable text

2. **Image Best Practices:**
   - Always include alt text
   - Compress images (target < 100KB per image)
   - Host on CDN (faster loading)
   - Use absolute URLs (not relative paths)
   - Required attributes: src, alt, width, height, border

3. **Plain Text Version:**
   - Send both HTML and plain text versions
   - Improves deliverability
   - Fallback for clients that block HTML

4. **Links:**
   - Use descriptive link text (not "Click here")
   - Limit # of links (3-5 primary, max 10 total)
   - Use trackable URLs (but be cautious with pixels in transactional emails)

### Email Authentication Setup

**Why Authentication Matters:**
- Gmail, Outlook require SPF/DKIM/DMARC for best inbox placement
- Protects against spoofing and phishing
- Improves deliverability rates (2-5% improvement typical)

#### 1. SPF (Sender Policy Framework)

**Purpose:** Tells recipient servers which IPs can send email from your domain

**Setup Steps:**
1. Identify all services sending from your domain (SendGrid, AWS SES, etc.)
2. Get their SPF include string (e.g., `include:sendgrid.net`)
3. Create SPF record:
   ```
   v=spf1 include:sendgrid.net include:amazon.com ~all
   ```
4. Add to DNS as TXT record
5. Test using: https://www.mxtoolbox.com/spf.aspx

**Example Record:**
```
v=spf1 include:sendgrid.net include:_spf.google.com ~all
```

#### 2. DKIM (DomainKeys Identified Mail)

**Purpose:** Signs emails with digital signature to prove they're from your domain

**Setup Steps:**
1. In email service provider (e.g., SendGrid): Generate DKIM key (2048-bit minimum)
2. Copy public key
3. Add to domain DNS as CNAME record
4. Activate DKIM in email service provider
5. Test: Send test email and check headers for DKIM-Signature

**Example:**
- SendGrid provides: `selector1._domainkey.relay.com` CNAME value
- Add to DNS with provided value

#### 3. DMARC (Domain-Based Message Authentication Reporting and Conformance)

**Purpose:** Policy for what to do with emails that fail SPF/DKIM

**Setup Steps:**
1. Ensure SPF and DKIM are working first
2. Create DMARC record in DNS
3. Set policy:
   - `p=none` (monitoring mode, no enforcement)
   - `p=quarantine` (failed emails go to spam)
   - `p=reject` (failed emails rejected - use after testing)
4. Add reporting email: `rua=mailto:dmarc@relay.com`

**Example Record:**
```
v=DMARC1; p=none; rua=mailto:dmarc@relay.com; fo=1
```

**Recommended Progression:**
- Week 1-2: `p=none` (monitor, don't enforce)
- Week 3-4: Review DMARC reports
- Month 2+: Move to `p=quarantine` or `p=reject`

### Email Service Provider Recommendations

[See separate comparison table - email_providers_comparison.csv]

**Quick Summary:**
- **Postmark**: Best for deliverability + reliability (recommended for critical invoices)
- **SendGrid**: Best for startups + features + integrations
- **AWS SES**: Best for cost at scale (millions of emails/month)
- **Mailgun**: Best for flexibility + API-first approach
- **Brevo**: Best for GDPR compliance + EU businesses

---

## PART 4: LEGAL COMPLIANCE

### CAN-SPAM Act (USA)

**Applies To:** All commercial/marketing emails sent to US recipients

**Requirement:** NOT applicable to pure transactional emails
- ✅ Invoice confirmations = EXEMPT
- ✅ Payment receipts = EXEMPT
- ❌ Invoice + promotional offer = NOT EXEMPT (hybrid)

**If Applicable, Must Include:**
- Clear subject line
- Sender identification
- Physical address (valid post office box OK)
- Unsubscribe link
- Opt-out compliance (within 10 business days)

**Best Practice for Transactional Emails:**
- Still include footer with company address (trust building)
- No unsubscribe required but provide notification preferences link
- 40-50 character subject lines
- Reply-to address is monitored

### GDPR (EU/UK)

**Applies To:** All recipients in EU/UK

**Key Requirements:**
1. Clear identification of sender
2. Transparency about why they're receiving the email
3. Contact information for data controller
4. Privacy policy link
5. Lawful basis for sending (transactional = performance of contract)

**Best Practice:**
- Include privacy policy link in footer
- Optional: Notification preference link (even for transactional)
- For hybrid emails (transactional + promotional): include clear unsubscribe for promotional portion
- Store compliance records (consent logs, opt-outs)

**Footer Essentials:**
```
Company Name
Address
Privacy Policy: [link]
Contact: privacy@relay.com
```

### Transactional Email-Specific Rules

**Unsubscribe Links:** NOT required for pure transactional
- Invoice confirmations: no unsubscribe needed
- Payment confirmations: no unsubscribe needed
- Hybrid (invoice + promotion): unsubscribe REQUIRED for promotional portion

**Physical Address:** NOT required for transactional under CAN-SPAM but recommended for trust

**Best Practice Compliance Checklist:**
- ✅ Clear From name + address
- ✅ Subject line matches content
- ✅ Privacy policy link in footer
- ✅ Company physical address
- ✅ Contact information
- ✅ Accurate sent-on date
- ✅ Plain text version available
- ✅ No misleading headers
- ✅ SPF/DKIM/DMARC configured

---

## PART 5: ANALYTICS & METRICS

### Key Metrics to Track

**1. Deliverability Metrics:**
- Delivery rate: Should be 98%+ (benchmark: 84.6% across all industries in 2025)
- Bounce rate: < 0.5% (hard bounces < 0.34%, soft bounces < 0.46%)
- Spam complaints: < 0.1%
- ISP monitoring: Gmail, Outlook feedback loops

**2. Engagement Metrics:**
- Open rate: Transactional emails: 5-15% typical (lower than marketing)
- Click-through rate: 1-3% (depends on CTA)
- Time to action: For payment emails, track time to payment (goal: within 24 hours)

**3. Conversion/Action Metrics:**
- Payment click rate: % who click "View Invoice"
- Payment completion rate: % who complete payment after email
- Support requests: # of replies/support tickets from email

**4. Business Metrics:**
- Revenue impact: Time to payment (days to cash)
- Customer satisfaction: Reply sentiment, support tickets
- List health: Unsubscribe rate, complaint rate

### Tracking Setup

**To Track Safely in Transactional Emails:**

1. **Avoid Tracking Pixels** in transactional emails
   - Why: Pixel tracking can trigger spam filters
   - Alternative: Track via CTA click-throughs instead

2. **Safe Tracking Methods:**
   - URL parameters: `https://relay.com/invoice/view?token=abc123&source=email`
   - Link click tracking: Via email service provider's dashboard
   - Webhook events: When recipient clicks, service provider sends webhook to your app

3. **Sensitive Data:**
   - Don't include personal/financial data in URLs
   - Use tokens/IDs instead of names/amounts
   - HTTPS only for all links

### Email Service Provider Analytics

**Postmark Dashboard:**
- Real-time delivery status
- Open rate tracking
- Click tracking (if enabled)
- Bounce categorization
- Spam complaints

**SendGrid Dashboard:**
- Advanced analytics
- Engagement metrics
- Device/browser tracking
- A/B test performance
- Subaccount reporting

**AWS SES CloudWatch:**
- Basic metrics (delivery, bounce, complaint)
- Send rate tracking
- Custom metrics via API
- Integration with other AWS services

---

## PART 6: RECOMMENDED EMAIL TEMPLATES FOR RELAY

### Template 1: Invoice Sent (With Mobile Optimization)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice Sent</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .content { padding: 30px 20px; background-color: #fff; }
        .invoice-box { background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; }
        .invoice-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .invoice-label { font-weight: 600; color: #555; }
        .invoice-value { color: #333; }
        .amount-large { font-size: 28px; font-weight: bold; color: #007bff; margin: 15px 0; }
        .button { background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 15px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        .footer-links a { color: #007bff; text-decoration: none; margin: 0 10px; }
        
        @media only screen and (max-width: 600px) {
            body { padding: 0; }
            .container { width: 100%; }
            .content { padding: 20px 15px; }
            .invoice-box { padding: 15px; margin: 15px 0; }
            .button { width: 100%; box-sizing: border-box; text-align: center; }
            .amount-large { font-size: 24px; }
            .invoice-item { flex-direction: column; }
            .invoice-label, .invoice-value { display: block; padding: 5px 0; }
        }
    </style>
</head>
<body>
    <table class="container">
        <tr>
            <td class="header">
                <div class="logo">Relay</div>
                <div style="color: #666; font-size: 14px;">Invoice Notification</div>
            </td>
        </tr>
        <tr>
            <td class="content">
                <p>Hi Sarah,</p>
                <p>Your invoice has been sent to your client. Here are the details:</p>
                
                <div class="invoice-box">
                    <div class="invoice-item">
                        <span class="invoice-label">Invoice #:</span>
                        <span class="invoice-value">1847</span>
                    </div>
                    <div class="invoice-item">
                        <span class="invoice-label">Client:</span>
                        <span class="invoice-value">John Smith (Acme Corp)</span>
                    </div>
                    <div class="invoice-item">
                        <span class="invoice-label">Service:</span>
                        <span class="invoice-value">UI/UX Design - 40 hours</span>
                    </div>
                    <div class="invoice-item">
                        <span class="invoice-label">Sent Date:</span>
                        <span class="invoice-value">December 15, 2025</span>
                    </div>
                    <div class="invoice-item">
                        <span class="invoice-label">Due Date:</span>
                        <span class="invoice-value">December 29, 2025</span>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div class="amount-large">£2,500.00</div>
                </div>
                
                <div style="text-align: center;">
                    <a href="https://relay.com/invoices/1847" class="button">View Invoice</a>
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 13px; line-height: 1.6;">
                    <strong>What happens next:</strong><br>
                    Your client has been notified of the invoice. They can view and pay it anytime before the due date using their preferred payment method (card, bank transfer, or PayPal).
                </p>
                
                <p style="color: #666; font-size: 13px;">
                    Questions? <a href="mailto:support@relay.com" style="color: #007bff;">Contact support</a>
                </p>
            </td>
        </tr>
        <tr>
            <td class="footer">
                <div style="margin-bottom: 15px;">
                    Relay Ltd | 123 Business Street, London, UK<br>
                    <a href="https://relay.com" style="color: #007bff; text-decoration: none;">www.relay.com</a>
                </div>
                <div class="footer-links">
                    <a href="https://relay.com/privacy">Privacy Policy</a> | 
                    <a href="https://relay.com/contact">Contact</a>
                </div>
                <p style="margin-top: 10px; font-size: 11px;">
                    You're receiving this because you're a freelancer on Relay. 
                    <a href="https://relay.com/notifications/preferences" style="color: #007bff;">Manage preferences</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
```

### Template 2: Payment Received

```
[Similar structure with green accents, success message, payment details, and action buttons]
```

### Template 3: Payment Verification Required

```
[Neutral tone, clear action buttons, deadline emphasis]
```

---

## PART 7: IMPLEMENTATION CHECKLIST

### Pre-Launch

- [ ] Authentication configured (SPF, DKIM, DMARC)
- [ ] Custom domain verified
- [ ] Email templates tested across clients (Gmail, Outlook, Apple Mail, iOS Mail)
- [ ] Mobile rendering verified (test on iPhone, Android)
- [ ] Compliance review (GDPR, CAN-SPAM, CASL)
- [ ] Privacy policy and contact info in footers
- [ ] Plain text versions created
- [ ] Reply-to address set up and monitored
- [ ] Unsubscribe/notification preferences configured
- [ ] Analytics/tracking setup verified
- [ ] Test emails sent to personal account
- [ ] Spam score checked (MailGenius, Mail Tester, etc.)

### Ongoing

- [ ] Monitor deliverability metrics (weekly)
- [ ] Review bounce rates (biweekly)
- [ ] Check spam complaints (biweekly)
- [ ] Monitor sender reputation (monthly)
- [ ] Review analytics for open/click rates (monthly)
- [ ] Test new template versions (before deployment)
- [ ] Update DNS records if changing providers
- [ ] Archive old emails for compliance (yearly)

---

## RESOURCES & REFERENCES

**Email Service Provider Documentation:**
- Postmark: postmarkapp.com/developer
- SendGrid: sendgrid.com/docs
- AWS SES: docs.aws.amazon.com/ses
- Mailgun: mailgun.com/docs

**Email Template Frameworks:**
- MJML: mjml.io
- Cerberus: cerberus.io
- Responsive HTML Email: leemunroe.com/responsive-html-email

**Testing Tools:**
- Email on Acid: emailonacid.com
- Litmus: litmus.com
- Mail Tester: mailtester.com
- MailGenius: mailgenius.com

**Authentication/Compliance:**
- MX Toolbox SPF Checker: mxtoolbox.com/spf
- DMARC Monitoring: dmarcian.com
- Email Compliance Guide: emailindustries.com

---

## CONCLUSION

Effective transactional email requires balancing **design excellence, technical reliability, and legal compliance**. By implementing the recommendations in this guide—particularly around authentication (SPF/DKIM/DMARC), mobile optimization, and clear content hierarchy—Relay can ensure high deliverability rates, professional brand presentation, and strong user engagement with payment-related communications.

The key to success is ongoing monitoring and optimization based on real delivery metrics and user engagement data.

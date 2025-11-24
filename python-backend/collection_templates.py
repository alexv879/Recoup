# collection_templates.py
"""
Collection message templates for email, SMS, and letters
Compliant with UK FCA guidelines and best practices
"""

from datetime import datetime, timedelta
from typing import Dict, Optional
import jinja2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import html2text


class CollectionTemplates:
    """Manages all collection communication templates"""
    
    def __init__(self):
        self.jinja_env = jinja2.Environment(
            loader=jinja2.DictLoader(self.get_templates())
        )
        
        # SMS character limits
        self.sms_limit = 160
        
        # Template categories
        self.email_templates = {
            'day_7_gentle': 'gentle_reminder_email',
            'day_14_firm': 'firm_reminder_email',
            'day_20_urgent': 'urgent_reminder_email',
            'day_30_final': 'final_notice_email',
            'payment_plan_offer': 'payment_plan_email',
            'dispute_acknowledgment': 'dispute_ack_email',
            'payment_confirmation': 'payment_confirm_email',
            'partial_payment_ack': 'partial_payment_email'
        }
        
        self.sms_templates = {
            'day_15_first': 'first_sms',
            'day_20_second': 'second_sms',
            'day_30_final': 'final_sms',
            'payment_commitment': 'commitment_sms',
            'payment_received': 'payment_received_sms'
        }
    
    def get_templates(self) -> Dict[str, str]:
        """Return all template strings"""
        
        return {
            # Email Templates
            'gentle_reminder_email': '''
Subject: Payment Reminder - Invoice #{{ invoice_number }} - £{{ amount }}

Dear {{ customer_name }},

I hope this message finds you well.

This is a friendly reminder that invoice #{{ invoice_number }} for £{{ amount }} was due on {{ due_date }}.

We understand that sometimes payments can slip through the cracks. If you've already sent the payment, please disregard this message and accept our thanks.

If you haven't yet had a chance to process this payment, you can do so quickly and securely here:
{{ payment_link }}

Invoice Details:
- Invoice Number: #{{ invoice_number }}
- Amount Due: £{{ amount }}
- Original Due Date: {{ due_date }}
- Days Overdue: {{ days_overdue }}

If you have any questions about this invoice or need to discuss payment arrangements, please don't hesitate to contact us at {{ support_email }} or {{ support_phone }}.

Best regards,
{{ company_name }}
{{ sender_name }}
{{ sender_title }}

P.S. You can view the full invoice details at: {{ invoice_link }}
            ''',
            
            'firm_reminder_email': '''
Subject: Overdue Notice - Invoice #{{ invoice_number }} - Action Required

Dear {{ customer_name }},

Invoice #{{ invoice_number }} for £{{ amount }} is now {{ days_overdue }} days overdue.

**Payment Details:**
- Invoice Number: #{{ invoice_number }}
- Original Amount: £{{ original_amount }}
- Late Payment Fee: £{{ late_fee }}
- **Total Now Due: £{{ total_amount }}**
- Original Due Date: {{ due_date }}

This invoice requires immediate attention. Please arrange payment within 48 hours to avoid further action.

**Pay Now:** {{ payment_link }}

If you're experiencing temporary difficulties, we're here to help. We can discuss:
- Payment plan options
- Partial payment arrangements
- Extension possibilities

Please contact us immediately at {{ support_phone }} or reply to this email.

**Important:** Continued non-payment may result in:
- Additional late payment charges
- Suspension of services
- Credit reporting
- Legal action

We value our relationship and want to resolve this matter quickly. Please take action today.

Regards,
{{ company_name }}
Collections Department

To dispute this invoice, please email: {{ dispute_email }}
            ''',
            
            'urgent_reminder_email': '''
Subject: URGENT - Invoice #{{ invoice_number }} - £{{ total_amount }} Now Due

Dear {{ customer_name }},

**IMMEDIATE ACTION REQUIRED**

Despite previous reminders, invoice #{{ invoice_number }} remains unpaid.

**Account Status:**
- Total Outstanding: £{{ total_amount }}
- Days Overdue: {{ days_overdue }}
- Late Fees Applied: £{{ late_fee }}

**You must take action within 5 days to avoid:**
- Referral to our legal team
- County Court proceedings
- Additional legal costs (typically £500-£2000)
- Impact on your credit rating

**Payment Options:**

1. **Pay in Full:** {{ payment_link }}

2. **Payment Plan:** Call {{ support_phone }} to arrange

3. **Partial Payment:** Make a good faith payment today to show commitment

We understand that circumstances can be challenging. If you're facing difficulties, please contact us TODAY. We're more willing to work with you now than after legal proceedings begin.

**This is not a notice we send lightly.** We've attempted to contact you {{ contact_attempts }} times about this matter.

Please don't ignore this message. The consequences of continued non-payment are serious and lasting.

Sincerely,
{{ company_name }}
{{ sender_name }}
Senior Collections Manager

Legal Notice: This is an attempt to collect a debt. Any information obtained will be used for that purpose.
            ''',
            
            'final_notice_email': '''
Subject: FINAL NOTICE - Legal Action Pending - Invoice #{{ invoice_number }}

Dear {{ customer_name }},

**FINAL NOTICE BEFORE LEGAL ACTION**

RE: Outstanding Invoice #{{ invoice_number }}
Amount Due: £{{ total_amount }}
Days Overdue: {{ days_overdue }}

This is your **FINAL OPPORTUNITY** to resolve this matter without legal intervention.

**What Happens Next:**

Unless payment is received within 7 days of this notice, we will:

1. **Initiate County Court proceedings** for the full amount plus costs
2. **Report to credit reference agencies** (affecting your credit for 6 years)
3. **Transfer to our legal recovery team** (additional costs will apply)
4. **Possible enforcement action** including bailiff attendance

**The Total Cost to You Could Exceed: £{{ estimated_total_with_legal }}**

**YOUR OPTIONS:**

✓ **Pay Now:** {{ payment_link }}
✓ **Call Immediately:** {{ support_phone }}
✓ **Email Urgently:** {{ urgent_email }}

**Payment Plan Still Available**
Even at this late stage, we can still arrange a payment plan if you contact us within 24 hours.

**This is a Legal Notice** served in accordance with the Late Payment of Commercial Debts (Interest) Act 1998 and the Pre-Action Protocol for Debt Claims.

After {{ deadline_date }}, this matter will proceed automatically to legal action without further notice.

{{ company_name }}
Legal Recovery Department

cc: Credit Control, Legal Department
            ''',
            
            'payment_plan_email': '''
Subject: Payment Plan Confirmation - Invoice #{{ invoice_number }}

Dear {{ customer_name }},

Thank you for contacting us about invoice #{{ invoice_number }}.

We're pleased to confirm the following payment arrangement:

**Payment Plan Details:**
- Total Amount Due: £{{ total_amount }}
- Initial Payment: £{{ initial_payment }} (due {{ initial_date }})
- Remaining Balance: £{{ remaining_balance }}
- Number of Installments: {{ num_installments }}
- Installment Amount: £{{ installment_amount }}
- Frequency: {{ frequency }}
- First Installment: {{ first_installment_date }}
- Final Payment: {{ final_payment_date }}

**Payment Schedule:**
{% for payment in payment_schedule %}
- {{ payment.date }}: £{{ payment.amount }}
{% endfor %}

**Important Terms:**
- Payments must be made on time to maintain this arrangement
- Missing a payment will void this agreement
- The full balance will become immediately due if the plan is broken
- No further late fees will be applied if you keep to this schedule

**How to Pay:**
- Automatic payment link: {{ autopay_link }}
- Manual payment: {{ payment_link }}

Please set up automatic payments to ensure you never miss a date.

Thank you for working with us to resolve this matter.

Best regards,
{{ company_name }}
Customer Resolution Team
            ''',
            
            'dispute_ack_email': '''
Subject: Dispute Received - Invoice #{{ invoice_number }}

Dear {{ customer_name }},

We acknowledge receipt of your dispute regarding invoice #{{ invoice_number }} for £{{ amount }}.

**Your Dispute:**
{{ dispute_reason }}

**What Happens Next:**
1. We'll review your dispute within 5 business days
2. We may contact you for additional information
3. You'll receive our decision by {{ response_date }}
4. Collection activities are paused during this review

**In the Meantime:**
- Any undisputed portion should still be paid
- Keep any supporting documentation handy
- You can add information by replying to this email

**Reference Number:** {{ dispute_ref }}

We take disputes seriously and will investigate thoroughly.

Thank you for bringing this to our attention.

Sincerely,
{{ company_name }}
Dispute Resolution Team
            ''',
            
            # SMS Templates (must be under 160 chars)
            'first_sms': '''{{ company_name }}: Invoice #{{ invoice_number }} (£{{ amount }}) overdue. Pay now: {{ short_link }} or call {{ phone }}. Reply STOP to opt out''',
            
            'second_sms': '''{{ company_name }}: £{{ amount }} now {{ days }} days late. Avoid fees & credit impact. Pay: {{ short_link }} Need help? Call {{ phone }}''',
            
            'final_sms': '''{{ company_name }}: FINAL NOTICE - £{{ amount }} unpaid. Legal action starts in 7 days unless paid. {{ short_link }}''',
            
            'commitment_sms': '''{{ company_name }}: Payment confirmed for £{{ amount }} by {{ date }}. Pay: {{ short_link }} Thank you for your commitment.''',
            
            'payment_received_sms': '''{{ company_name }}: Payment of £{{ amount }} received. Thank you! Your account is now current. Receipt: {{ receipt_link }}'''
        }
    
    def render_email(self, template_name: str, data: Dict) -> Dict[str, str]:
        """Render an email template with data"""
        
        template = self.jinja_env.get_template(template_name)
        content = template.render(**data)
        
        # Split subject and body
        lines = content.strip().split('\n')
        subject_line = lines[0].replace('Subject: ', '').strip()
        body = '\n'.join(lines[2:]).strip()  # Skip subject and blank line
        
        return {
            'subject': subject_line,
            'body_html': body.replace('\n', '<br>'),
            'body_text': body
        }
    
    def render_sms(self, template_name: str, data: Dict) -> str:
        """Render an SMS template ensuring it fits character limit"""
        
        template = self.jinja_env.get_template(template_name)
        content = template.render(**data).strip()
        
        # Ensure it fits in 160 characters
        if len(content) > self.sms_limit:
            # Shorten the link if present
            if 'short_link' in data:
                data['short_link'] = data['short_link'][:20] + '...'
                content = template.render(**data).strip()
        
        # If still too long, truncate with warning
        if len(content) > self.sms_limit:
            content = content[:self.sms_limit-3] + '...'
        
        return content
    
    def get_letter_template(self, stage: str = 'final') -> str:
        """Get physical letter template for Lob API"""
        
        return '''
        <html>
        <head>
            <style>
                @page { margin: 1in; }
                body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; }
                .header { text-align: right; margin-bottom: 30px; }
                .recipient { margin-bottom: 30px; }
                .subject { font-weight: bold; text-decoration: underline; margin: 20px 0; }
                .important { font-weight: bold; color: #d00; }
                .footer { margin-top: 50px; }
                .signature { margin-top: 40px; }
            </style>
        </head>
        <body>
            <div class="header">
                {{ company_name }}<br>
                {{ company_address }}<br>
                {{ company_phone }}<br>
                {{ current_date }}
            </div>
            
            <div class="recipient">
                {{ customer_name }}<br>
                {{ customer_address }}
            </div>
            
            <div class="subject">
                RE: FINAL DEMAND - Invoice #{{ invoice_number }}
            </div>
            
            <p>Dear {{ customer_name }},</p>
            
            <p class="important">FORMAL DEMAND FOR PAYMENT</p>
            
            <p>Despite numerous attempts to contact you via email, SMS, and telephone, the following amount remains outstanding:</p>
            
            <table>
                <tr><td>Invoice Number:</td><td>#{{ invoice_number }}</td></tr>
                <tr><td>Original Amount:</td><td>£{{ original_amount }}</td></tr>
                <tr><td>Late Payment Interest:</td><td>£{{ interest }}</td></tr>
                <tr><td>Administration Fees:</td><td>£{{ admin_fee }}</td></tr>
                <tr><td><strong>Total Now Due:</strong></td><td><strong>£{{ total_amount }}</strong></td></tr>
                <tr><td>Days Overdue:</td><td>{{ days_overdue }}</td></tr>
            </table>
            
            <p><strong>This letter serves as final notice before legal proceedings commence.</strong></p>
            
            <p>ACTION REQUIRED WITHIN 7 DAYS:</p>
            <ol>
                <li>Pay the full amount immediately via {{ payment_url }}</li>
                <li>Call {{ company_phone }} to arrange a payment plan</li>
                <li>Dispute formally in writing if you believe this is incorrect</li>
            </ol>
            
            <p class="important">FAILURE TO ACT WILL RESULT IN:</p>
            <ul>
                <li>County Court Judgment (CCJ) proceedings</li>
                <li>Additional legal costs (typically £500-£2000)</li>
                <li>Damage to your credit rating for 6 years</li>
                <li>Possible enforcement action including bailiff attendance</li>
            </ul>
            
            <p>We remain willing to discuss reasonable payment arrangements if you contact us within 48 hours of receiving this letter.</p>
            
            <p>This is a legal notice served in accordance with the Late Payment of Commercial Debts (Interest) Act 1998.</p>
            
            <div class="signature">
                <p>Yours sincerely,</p>
                <br><br>
                <p>{{ sender_name }}<br>
                {{ sender_title }}<br>
                Collections Department<br>
                {{ company_name }}</p>
            </div>
            
            <div class="footer">
                <hr>
                <small>
                    Registered in England and Wales. Company No: {{ company_registration }}<br>
                    This is an attempt to collect a debt. Any information obtained will be used for that purpose.
                </small>
            </div>
        </body>
        </html>
        '''
    
    def get_template_for_stage(self, days_overdue: int, channel: str) -> str:
        """Get appropriate template based on days overdue and channel"""
        
        if channel == 'email':
            if days_overdue <= 7:
                return 'gentle_reminder_email'
            elif days_overdue <= 14:
                return 'firm_reminder_email'
            elif days_overdue <= 25:
                return 'urgent_reminder_email'
            else:
                return 'final_notice_email'
        
        elif channel == 'sms':
            if days_overdue <= 15:
                return 'first_sms'
            elif days_overdue <= 25:
                return 'second_sms'
            else:
                return 'final_sms'
        
        elif channel == 'letter':
            return 'final_letter'
        
        return None
    
    def personalize_tone(self, template: str, client_history: Dict) -> str:
        """Adjust template tone based on client history"""
        
        if client_history.get('vip_client'):
            # Softer tone for VIP clients
            template = template.replace('FINAL NOTICE', 'Important Notice')
            template = template.replace('Legal action', 'Further steps')
        
        elif client_history.get('repeat_offender'):
            # Firmer tone for repeat late payers
            template = template.replace('We understand', 'As previously discussed')
            template = template.replace('may result', 'will result')
        
        elif client_history.get('first_time_late'):
            # Gentler tone for first-time late payers
            template = template.replace('Despite numerous attempts', 'We notice')
            template = template.replace('requires immediate', 'requires your')
        
        return template


class IndustrySpecificTemplates:
    """Industry-specific collection templates"""
    
    def __init__(self):
        self.industries = {
            'healthcare': self.healthcare_templates(),
            'construction': self.construction_templates(),
            'retail': self.retail_templates(),
            'professional_services': self.professional_services_templates(),
            'technology': self.technology_templates()
        }
    
    def healthcare_templates(self) -> Dict:
        """Templates specific to healthcare industry"""
        
        return {
            'gentle_reminder': '''
                We understand the healthcare industry's unique payment cycles. 
                If you're waiting on insurance reimbursements or grant funding, 
                please let us know so we can work with your timeline.
            ''',
            'payment_plan_offer': '''
                We offer extended payment terms for healthcare providers, 
                including quarterly payment options aligned with reimbursement schedules.
            '''
        }
    
    def construction_templates(self) -> Dict:
        """Templates specific to construction industry"""
        
        return {
            'gentle_reminder': '''
                We know construction projects often have milestone-based payments. 
                If you're waiting on a project completion or retention release, 
                please update us on the expected timeline.
            ''',
            'lien_warning': '''
                Please note that under the Construction Act, we may exercise 
                our right to file a construction lien if payment is not received.
            '''
        }
    
    def retail_templates(self) -> Dict:
        """Templates for retail businesses"""
        
        return {
            'seasonal_consideration': '''
                We understand retail cash flow can be seasonal. 
                We're happy to discuss payment arrangements that align 
                with your peak trading periods.
            '''
        }
    
    def professional_services_templates(self) -> Dict:
        """Templates for professional services"""
        
        return {
            'gentle_reminder': '''
                As fellow professionals, we understand that client payments 
                can sometimes delay your own payment schedule. 
                Please let us know if you need a brief extension.
            '''
        }
    
    def technology_templates(self) -> Dict:
        """Templates for tech companies"""
        
        return {
            'startup_friendly': '''
                We work with many startups and understand funding cycles. 
                If you're between funding rounds, we can discuss bridge 
                payment arrangements.
            '''
        }
    
    def get_industry_adjustment(self, industry: str, base_template: str) -> str:
        """Add industry-specific adjustments to base template"""
        
        if industry in self.industries:
            adjustments = self.industries[industry]
            # Add relevant adjustments to the base template
            return base_template + "\n\n" + adjustments.get('gentle_reminder', '')
        
        return base_template

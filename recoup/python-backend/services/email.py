"""
SendGrid Email Service
Converted from relay/lib/sendgrid.ts
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, To, DynamicTemplateData
import logging

logger = logging.getLogger(__name__)

# SendGrid client instance
_sg_client: Optional[SendGridAPIClient] = None


def _get_sendgrid_client() -> SendGridAPIClient:
    """
    Get or create SendGrid client instance

    Returns:
        SendGrid API client

    Raises:
        ValueError: If API key is not set
    """
    global _sg_client

    if _sg_client is None:
        api_key = os.getenv('SENDGRID_API_KEY')
        if not api_key:
            raise ValueError(
                'SENDGRID_API_KEY environment variable is required. '
                'Get your API key from https://app.sendgrid.com/settings/api_keys'
            )
        _sg_client = SendGridAPIClient(api_key)

    return _sg_client


async def send_email(
    to: str,
    template_id: str,
    dynamic_template_data: Dict[str, Any],
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
    subject: Optional[str] = None,
    fallback_text: Optional[str] = None
) -> None:
    """
    Send email using SendGrid dynamic template

    Args:
        to: Recipient email address
        template_id: SendGrid template ID
        dynamic_template_data: Template variables
        from_email: Sender email (default: from env)
        from_name: Sender name (default: from env)
        subject: Email subject (for fallback only)
        fallback_text: Plain text fallback message

    Raises:
        Exception: If email sending fails
    """
    client = _get_sendgrid_client()

    # Get sender info from env if not provided
    sender_email = from_email or os.getenv('SENDGRID_FROM_EMAIL')
    sender_name = from_name or os.getenv('SENDGRID_FROM_NAME', 'Recoup')

    if not sender_email:
        raise ValueError('Sender email not configured')

    try:
        # Check if template ID is provided
        if not template_id or template_id == 'undefined':
            # Fallback: Send plain text email if template ID missing
            logger.warning(
                f'SendGrid template ID missing, falling back to plain text email. To: {to}, Subject: {subject}'
            )

            message = Mail(
                from_email=From(sender_email, sender_name),
                to_emails=To(to),
                subject=subject or 'Notification from Recoup',
                plain_text_content=fallback_text or 'You have a notification from Recoup. Please log in to view details.',
                html_content=f'<p>{fallback_text or "You have a notification from Recoup. Please log in to view details."}</p>',
            )
        else:
            # Send using dynamic template
            message = Mail(
                from_email=From(sender_email, sender_name),
                to_emails=To(to)
            )
            message.template_id = template_id
            message.dynamic_template_data = dynamic_template_data

        response = client.send(message)
        logger.info(f'✅ Email sent to {to}. Status: {response.status_code}')

    except Exception as error:
        # Enhanced error handling with template-specific guidance
        error_msg = str(error)

        if 'template' in error_msg.lower() or 'not found' in error_msg.lower():
            logger.error(
                f'SendGrid template error - please verify template ID in .env. '
                f'Template ID: {template_id}, To: {to}'
            )
            raise Exception(
                f'SendGrid template error: Template ID "{template_id}" not found. '
                'Please verify SENDGRID_*_TEMPLATE_ID environment variables are correctly set.'
            )

        logger.error(f'SendGrid email error: {error}')
        raise Exception('Failed to send email')


async def send_invoice_email(
    to_email: str,
    invoice_reference: str,
    amount: float,
    freelancer_name: str,
    confirmation_url: str,
    currency: str = 'GBP',
    due_date: Optional[datetime] = None,
    description: Optional[str] = None,
    bank_details: Optional[str] = None,
    stripe_link: Optional[str] = None
) -> None:
    """
    Send invoice email with payment options

    Args:
        to_email: Recipient email
        invoice_reference: Invoice reference number
        amount: Invoice amount
        freelancer_name: Freelancer's name
        confirmation_url: Payment confirmation URL
        currency: Currency code (default: GBP)
        due_date: Invoice due date
        description: Invoice description
        bank_details: Bank payment details
        stripe_link: Stripe payment link
    """
    template_id = os.getenv('SENDGRID_INVOICE_TEMPLATE_ID')

    if not template_id:
        logger.warning('SENDGRID_INVOICE_TEMPLATE_ID not set')

    await send_email(
        to=to_email,
        template_id=template_id or '',
        dynamic_template_data={
            'freelancerName': freelancer_name,
            'invoiceReference': invoice_reference,
            'amount': f'{amount:.2f}',
            'currency': currency,
            'dueDate': due_date.isoformat() if due_date else None,
            'description': description,
            'bankDetails': bank_details,
            'stripeLink': stripe_link,
            'confirmationUrl': confirmation_url,
        },
        subject=f'Invoice {invoice_reference} from {freelancer_name}',
        fallback_text=(
            f'You have received invoice {invoice_reference} from {freelancer_name} '
            f'for {currency} {amount:.2f}. Due date: {due_date.strftime("%d/%m/%Y") if due_date else "Not specified"}. '
            f'View invoice: {confirmation_url}'
        ),
    )


async def send_reminder_day_5_email(
    to_email: str,
    freelancer_name: str,
    invoice_reference: str,
    amount: float,
    currency: str,
    due_date: datetime,
    days_overdue: int
) -> None:
    """Send Day 5 gentle reminder email"""
    template_id = os.getenv('SENDGRID_REMINDER_DAY5_TEMPLATE_ID')

    await send_email(
        to=to_email,
        template_id=template_id or '',
        dynamic_template_data={
            'freelancerName': freelancer_name,
            'invoiceReference': invoice_reference,
            'amount': f'{amount:.2f}',
            'currency': currency,
            'dueDate': due_date.isoformat(),
            'daysOverdue': days_overdue,
        },
        subject=f'Gentle Reminder: Invoice {invoice_reference} Payment',
        fallback_text=(
            f'Gentle reminder: Invoice {invoice_reference} from {freelancer_name} '
            f'for {currency} {amount:.2f} is now {days_overdue} days overdue.'
        ),
    )


async def send_reminder_day_15_email(
    to_email: str,
    freelancer_name: str,
    invoice_reference: str,
    amount: float,
    currency: str,
    due_date: datetime,
    days_overdue: int,
    interest_amount: float,
    total_owed: float
) -> None:
    """Send Day 15 firm reminder with interest"""
    template_id = os.getenv('SENDGRID_REMINDER_DAY15_TEMPLATE_ID')

    await send_email(
        to=to_email,
        template_id=template_id or '',
        dynamic_template_data={
            'freelancerName': freelancer_name,
            'invoiceReference': invoice_reference,
            'amount': f'{amount:.2f}',
            'currency': currency,
            'dueDate': due_date.isoformat(),
            'daysOverdue': days_overdue,
            'interestAmount': f'{interest_amount:.2f}',
            'totalOwed': f'{total_owed:.2f}',
        },
        subject=f'Firm Reminder: Invoice {invoice_reference} - Interest Accruing',
        fallback_text=(
            f'Firm reminder: Invoice {invoice_reference} from {freelancer_name} '
            f'for {currency} {amount:.2f} is {days_overdue} days overdue. '
            f'Interest accrued: {currency} {interest_amount:.2f}. Total owed: {currency} {total_owed:.2f}.'
        ),
    )


async def send_reminder_day_30_email(
    to_email: str,
    freelancer_name: str,
    invoice_reference: str,
    amount: float,
    currency: str,
    due_date: datetime,
    days_overdue: int,
    interest_amount: float,
    fixed_recovery_cost: float,
    total_owed: float
) -> None:
    """Send Day 30 final notice with full charges"""
    template_id = os.getenv('SENDGRID_REMINDER_DAY30_TEMPLATE_ID')

    await send_email(
        to=to_email,
        template_id=template_id or '',
        dynamic_template_data={
            'freelancerName': freelancer_name,
            'invoiceReference': invoice_reference,
            'amount': f'{amount:.2f}',
            'currency': currency,
            'dueDate': due_date.isoformat(),
            'daysOverdue': days_overdue,
            'interestAmount': f'{interest_amount:.2f}',
            'fixedRecoveryCost': f'{fixed_recovery_cost:.2f}',
            'totalOwed': f'{total_owed:.2f}',
        },
        subject=f'FINAL NOTICE: Invoice {invoice_reference} - Legal Action Pending',
        fallback_text=(
            f'FINAL NOTICE: Invoice {invoice_reference} from {freelancer_name} '
            f'for {currency} {amount:.2f} is {days_overdue} days overdue. '
            f'Total owed (including interest and recovery costs): {currency} {total_owed:.2f}. '
            f'Legal action may be taken if payment is not received within 7 days.'
        ),
    )


async def send_payment_confirmed_email(
    to_email: str,
    invoice_reference: str,
    amount: float,
    currency: str
) -> None:
    """Send payment confirmation email"""
    template_id = os.getenv('SENDGRID_PAYMENT_CONFIRMED_TEMPLATE_ID')

    await send_email(
        to=to_email,
        template_id=template_id or '',
        dynamic_template_data={
            'invoiceReference': invoice_reference,
            'amount': f'{amount:.2f}',
            'currency': currency,
        },
        subject=f'Payment Confirmed: Invoice {invoice_reference}',
        fallback_text=(
            f'Payment confirmed for invoice {invoice_reference}. '
            f'Amount: {currency} {amount:.2f}. Thank you!'
        ),
    )


async def send_payment_verification_required_email(
    to_email: str,
    freelancer_name: str,
    invoice_reference: str,
    amount: float,
    currency: str,
    verification_deadline: datetime,
    verification_url: str
) -> None:
    """Send payment verification required email"""
    template_id = os.getenv('SENDGRID_PAYMENT_VERIFICATION_REQUIRED_TEMPLATE_ID')

    await send_email(
        to=to_email,
        template_id=template_id or '',
        dynamic_template_data={
            'freelancerName': freelancer_name,
            'invoiceReference': invoice_reference,
            'amount': f'{amount:.2f}',
            'currency': currency,
            'verificationDeadline': verification_deadline.isoformat(),
            'verificationUrl': verification_url,
        },
        subject=f'Action Required: Verify Payment for Invoice {invoice_reference}',
        fallback_text=(
            f'Action required: Please verify payment claim for invoice {invoice_reference}. '
            f'Amount: {currency} {amount:.2f}. Deadline: {verification_deadline.strftime("%d/%m/%Y %H:%M")}. '
            f'Verify now: {verification_url}'
        ),
    )


async def send_notification_email(
    to_email: str,
    notification_title: str,
    notification_message: str,
    action_url: Optional[str] = None
) -> None:
    """Send generic notification email"""
    template_id = os.getenv('SENDGRID_NOTIFICATION_TEMPLATE_ID')

    await send_email(
        to=to_email,
        template_id=template_id or '',
        dynamic_template_data={
            'title': notification_title,
            'message': notification_message,
            'actionUrl': action_url,
        },
        subject=notification_title,
        fallback_text=notification_message,
    )

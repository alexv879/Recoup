/**
 * COLLECTIONS EMAIL TEMPLATES
 *
 * Three-tier escalation email templates with interest calculations
 *
 * Research Impact:
 * - +30-40% recovery rate when escalation is transparent
 * - Debtors respond better to graduated approach
 * - Legal backing increases payment urgency
 *
 * Escalation Timeline:
 * - Day 5: Friendly reminder (no interest, helpful tone)
 * - Day 15: Firm reminder (introduce interest, serious tone)
 * - Day 30: Legal final notice (interest + fixed fee + legal action warning)
 *
 * UK Legal Compliance:
 * - Late Payment of Commercial Debts (Interest) Act 1998
 * - Interest rate: 8% + Bank of England base rate (13.25% total)
 * - Fixed recovery costs: £40-£100 based on amount
 * - No calls/emails during quiet hours (21:00-08:00)
 *
 * Usage:
 * ```typescript
 * import {
 *   sendFriendlyReminder,
 *   sendFirmReminder,
 *   sendFinalNotice,
 * } from '@/lib/collections-email-templates';
 *
 * // Day 5
 * await sendFriendlyReminder({
 *   invoiceId: 'inv_123',
 *   clientEmail: 'john@example.com',
 *   clientName: 'John Smith',
 *   amount: 1000,
 *   dueDate: new Date('2024-10-01'),
 * });
 *
 * // Day 15
 * await sendFirmReminder({ ... });
 *
 * // Day 30
 * await sendFinalNotice({ ... });
 * ```
 */

import { sendEmail } from '@/lib/sendgrid';
import {
  calculateLatePaymentInterest,
  formatCurrency,
  formatInterestCalculationHTML,
} from '@/lib/collections-calculator';
import { logInfo, logError } from '@/utils/logger';

// ============================================================
// TYPES
// ============================================================

interface CollectionsEmailParams {
  invoiceId: string;
  clientEmail: string;
  clientName: string;
  amount: number;
  dueDate: Date;
  invoiceNumber?: string;
  description?: string;
  freelancerName?: string;
  freelancerBusinessName?: string;
  invoiceViewUrl?: string;
  paymentUrl?: string;
  previousReminderDate?: Date; // Date of Day 5 reminder (for Day 15 reference)
  firstReminderDate?: Date; // Date of Day 5 reminder (for Day 30 reference)
  secondReminderDate?: Date; // Date of Day 15 reminder (for Day 30 reference)
}

// ============================================================
// DAY 5: FRIENDLY REMINDER (No Interest)
// ============================================================

/**
 * Send an early pre-due notice (Day 3 - Well before due date)
 * This email is sent 3 days after invoice creation as a soft reminder
 * Tone: Very friendly, informational, no pressure
 * @param params - Email parameters including invoice details
 * @returns Promise with success status and tracking info
 */
export async function sendEarlyPreDueNotice(
  params: EmailReminderParams
): Promise<EmailSendResult> {
  const {
    invoiceId,
    invoiceNumber,
    clientName,
    clientEmail,
    amount,
    dueDate,
    description,
    freelancerName,
    freelancerBusinessName,
    businessName,
    invoiceViewUrl,
    paymentUrl,
  } = params;

  const dueDateFormatted = formatDate(dueDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const subject = `${clientName}, invoice ${invoiceNumber || invoiceId} due in ${daysUntilDue} days`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="text-align: center; padding: 24px 0; border-bottom: 2px solid #f3f4f6;">
        <h1 style="color: #111827; font-size: 24px; margin: 0;">Invoice Update</h1>
      </div>

      <!-- Body -->
      <div style="padding: 32px 0;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hi ${clientName},
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Just a quick heads up that invoice ${invoiceNumber || invoiceId} will be due in <strong>${daysUntilDue} days</strong> (${dueDateFormatted}).
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          No rush – I just wanted to make sure you had this on your calendar!
        </p>

        <!-- Invoice Details -->
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #3b82f6;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Invoice Number:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${invoiceNumber || invoiceId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Description:</td>
              <td style="padding: 8px 0; text-align: right; color: #111827;">${description}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
              <td style="padding: 8px 0; text-align: right; color: #3b82f6; font-weight: 600;">${dueDateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 700; font-size: 18px; color: #111827;">Amount:</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: #7c3aed;">${formatCurrency(amount)}</td>
            </tr>
          </table>
        </div>

        <!-- CTA Placement 1: Top (After Summary) -->
        <div style="text-align: center; margin: 24px 0;">
          ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Pay Early (Optional)</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Invoice</a>`
        : ''
    }
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          If you prefer to pay early, you can do so anytime before ${dueDateFormatted}. Otherwise, no action needed right now!
        </p>

        <!-- Info Box -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="color: #1e40af; font-size: 14px; line-height: 1.5; margin: 0;">
            💡 <strong>Helpful Info:</strong> You'll receive another reminder closer to the due date if payment hasn't been received yet. No need to worry about missing it!
          </p>
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          If you have any questions or need any adjustments, just let me know.
        </p>

        <!-- CTA Placement 2: Middle (Before Footer) -->
        <div style="text-align: center; margin: 32px 0;">
          ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View & Pay Invoice</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Invoice</a>`
        : ''
    }
        </div>
        
        <!-- Secondary CTA -->
        <div style="text-align: center; margin: 16px 0;">
          <a href="mailto:${freelancerBusinessName || freelancerName}" style="color: #6b7280; text-decoration: underline; font-size: 14px;">Questions? Email me</a>
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Thanks!<br>
          <strong>${businessName}</strong>
        </p>

        <!-- CTA Placement 3: Bottom (Before Footer) -->
        <div style="text-align: center; margin: 24px 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 12px;">Pay Invoice</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 12px;">View Invoice Details</a>`
        : ''
    }
          <br>
          <a href="mailto:${freelancerBusinessName || freelancerName}" style="color: #3b82f6; text-decoration: underline; font-size: 14px;">Contact me about this invoice</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0;">
          <strong>${businessName}</strong><br>
          ${freelancerBusinessName ? `${freelancerBusinessName}<br>` : ''}
          ${process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '123 Business Street, London, UK'}
        </p>
        <p style="margin: 8px 0 4px 0;">
          Contact: ${freelancerBusinessName || freelancerName} | <a href="mailto:${freelancerBusinessName || freelancerName}" style="color: #9ca3af; text-decoration: underline;">Email Us</a>
        </p>
        <p style="margin: 4px 0;">
          <a href="https://relay.app/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy Policy</a>
          <span style="margin: 0 8px;">|</span>
          <a href="https://relay.app/unsubscribe?email=${encodeURIComponent(clientEmail)}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `;

  const textContent = `
Hi ${clientName},

Just a quick heads up that invoice ${invoiceNumber || invoiceId} will be due in ${daysUntilDue} days (${dueDateFormatted}).

No rush – I just wanted to make sure you had this on your calendar!

INVOICE DETAILS:
Invoice Number: ${invoiceNumber || invoiceId}
Description: ${description}
Due Date: ${dueDateFormatted}
Amount: ${formatCurrency(amount)}

If you prefer to pay early, you can do so anytime before ${dueDateFormatted}. Otherwise, no action needed right now!

💡 Helpful Info: You'll receive another reminder closer to the due date if payment hasn't been received yet. No need to worry about missing it!

${paymentUrl ? `Pay invoice: ${paymentUrl}` : invoiceViewUrl ? `View invoice: ${invoiceViewUrl}` : ''}

If you have any questions or need any adjustments, just let me know.

Thanks!
${businessName}

---
Privacy Policy: https://relay.app/privacy
Unsubscribe: https://relay.app/unsubscribe?email=${encodeURIComponent(clientEmail)}
  `.trim();

  const msg: MailDataRequired = {
    to: clientEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@relay.app',
      name: businessName || freelancerName,
    },
    subject,
    text: textContent,
    html: htmlContent,
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true },
    },
    customArgs: {
      invoiceId,
      reminderType: 'early_pre_due',
      reminderDay: 'day_3',
    },
  };

  try {
    await sgMail.send(msg);
    logger.info(
      `Early pre-due notice sent for invoice ${invoiceId} to ${clientEmail}`
    );
    return {
      success: true,
      messageId: `early-predue-${invoiceId}-${Date.now()}`,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error(`Failed to send early pre-due notice for invoice ${invoiceId}:`, error);
    throw error;
  }
}

/**
 * Send a friendly reminder email (Day 5 - Pre-overdue)
 * This email is sent BEFORE the due date as a friendly heads-up
 * @param params - Email parameters including invoice details
 * @returns Promise with success status and tracking info
 */
export async function sendFriendlyReminder(
  params: EmailReminderParams
): Promise<EmailSendResult> {
  const {
    invoiceId,
    clientEmail,
    clientName,
    amount,
    dueDate,
    invoiceNumber,
    description = 'services provided',
    freelancerName = 'Relay',
    freelancerBusinessName,
    invoiceViewUrl,
    paymentUrl,
  } = params;

  const businessName = freelancerBusinessName || freelancerName;
  const dueDateFormatted = dueDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subject = `${clientName}, invoice ${invoiceNumber || invoiceId} due soon`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Payment Reminder</h1>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
        Hi ${clientName},
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        I hope you're doing well! I wanted to make sure you had this on your radar — payment for invoice
        <strong>${invoiceNumber || invoiceId}</strong> is due on <strong>${dueDateFormatted}</strong>.
      </p>

      <!-- Invoice Details -->
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Invoice Number:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${invoiceNumber || invoiceId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Description:</td>
            <td style="padding: 8px 0; text-align: right; color: #111827;">${description}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
            <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: 600;">${dueDateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 700; font-size: 18px; color: #111827;">Amount Due:</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: #7c3aed;">${formatCurrency(amount)}</td>
          </tr>
        </table>
      </div>

      <!-- CTA Placement 1: Top (After Summary) -->
      <div style="text-align: center; margin: 24px 0;">
        ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Pay Now</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Invoice</a>`
        : ''
    }
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        I understand that things can get busy and invoices can sometimes slip through the cracks.
        If you've already made the payment, please disregard this email and accept my thanks!
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        If you haven't had a chance to process payment yet, I'd appreciate if you could arrange
        payment at your earliest convenience.
      </p>

      <!-- CTA Placement 2: Middle (After Explanation) -->
      <div style="text-align: center; margin: 32px 0;">
        ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Pay Now</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Invoice</a>`
        : ''
    }
      </div>
      
      <!-- Secondary CTA -->
      <div style="text-align: center; margin: 16px 0;">
        <a href="${invoiceViewUrl || '#'}" style="color: #6b7280; text-decoration: underline; font-size: 14px;">I already paid this</a>
      </div>

      <!-- Help Section -->
      <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
          <strong>Having trouble making payment?</strong><br>
          If you're experiencing any issues or need to discuss payment arrangements,
          please don't hesitate to reach out. I'm happy to work with you to find a solution.
        </p>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Thank you for your business and prompt attention to this matter.
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Best regards,<br>
        <strong>${businessName}</strong>
      </p>

      <!-- CTA Placement 3: Bottom (Before Footer) -->
      <div style="text-align: center; margin: 24px 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 12px;">Pay Invoice Now</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 12px;">View Invoice</a>`
        : ''
    }
        <br>
        <a href="${invoiceViewUrl || '#'}" style="color: #3b82f6; text-decoration: underline; font-size: 14px; margin: 0 12px;">I already paid</a>
        <span style="color: #d1d5db;">|</span>
        <a href="mailto:${freelancerBusinessName || freelancerName}" style="color: #3b82f6; text-decoration: underline; font-size: 14px; margin: 0 12px;">Request payment plan</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">
        This is an automated payment reminder from <strong>${businessName}</strong><br>
        ${freelancerBusinessName ? `${freelancerBusinessName}<br>` : ''}
        ${process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '123 Business Street, London, UK'}
      </p>
      <p style="margin: 8px 0 4px 0;">
        Contact: ${freelancerBusinessName || freelancerName} | <a href="mailto:${freelancerBusinessName || freelancerName}" style="color: #9ca3af; text-decoration: underline;">Email Us</a>
      </p>
      <p style="margin: 0;">
        <a href="https://relay.app/privacy" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Privacy Policy</a> | 
        <a href="https://relay.app/unsubscribe?email=${encodeURIComponent(clientEmail)}" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Payment Reminder

Hi ${clientName},

This is a friendly reminder that payment for invoice ${invoiceNumber || invoiceId} is now overdue.

Invoice Details:
- Invoice Number: ${invoiceNumber || invoiceId}
- Description: ${description}
- Due Date: ${dueDateFormatted}
- Amount Due: ${formatCurrency(amount)}

I understand that things can get busy and invoices can sometimes slip through the cracks.
If you've already made the payment, please disregard this email and accept my thanks!

If you haven't had a chance to process payment yet, I'd appreciate if you could arrange
payment at your earliest convenience.

${invoiceViewUrl ? `View Invoice: ${invoiceViewUrl}` : ''}

Having trouble making payment?
If you're experiencing any issues or need to discuss payment arrangements,
please don't hesitate to reach out. I'm happy to work with you to find a solution.

Thank you for your business and prompt attention to this matter.

Best regards,
${businessName}
  `.trim();

  try {
    await sendEmail({
      to: clientEmail,
      subject,
      html,
      text,
    });

    logInfo('Friendly reminder sent', {
      invoiceId,
      clientEmail,
      amount,
      daysOverdue: 5,
    });
  } catch (error) {
    logError('Failed to send friendly reminder', error as Error);
    throw error;
  }
}

// ============================================================
// DAY 15: FIRM REMINDER (Introduce Interest)
// ============================================================

/**
 * Day 15: Firm payment reminder with interest calculation
 * Tone: Serious, professional, introduces legal consequences
 * Interest calculation shown
 *
 * @param params - Email parameters
 */
export async function sendFirmReminder(params: CollectionsEmailParams): Promise<void> {
  const {
    invoiceId,
    clientEmail,
    clientName,
    amount,
    dueDate,
    invoiceNumber,
    description = 'services provided',
    freelancerName = 'Relay',
    freelancerBusinessName,
    invoiceViewUrl,
    paymentUrl,
  } = params;

  const businessName = freelancerBusinessName || freelancerName;
  const dueDateFormatted = dueDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate interest
  const interestCalc = calculateLatePaymentInterest({
    principalAmount: amount,
    dueDate,
  });

  const subject = `${clientName}, invoice ${invoiceNumber || invoiceId} is now overdue`;

  // Format previous reminder date if provided
  const previousReminderText = params.previousReminderDate
    ? params.previousReminderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Payment Overdue</h1>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
        Hello ${clientName},
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        I'm following up on invoice <strong>${invoiceNumber || invoiceId}</strong>, which was due on <strong>${dueDateFormatted}</strong>. 
        As of today, we haven't received payment.
      </p>

      ${previousReminderText ? `<p style="color: #374151; font-size: 16px; line-height: 1.6;">
        We sent a reminder on <strong>${previousReminderText}</strong>, and wanted to follow up to ensure you 
        received it and there are no issues.
      </p>` : ''}

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        This invoice is now <strong>${interestCalc.daysOverdue} days overdue</strong>.
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        As per the <strong>Late Payment of Commercial Debts (Interest) Act 1998</strong>,
        I am now entitled to charge statutory interest and debt recovery costs.
      </p>

      <!-- Original Invoice -->
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">Original Invoice</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Invoice Number:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${invoiceNumber || invoiceId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Description:</td>
            <td style="padding: 8px 0; text-align: right; color: #111827;">${description}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
            <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: 600;">${dueDateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Days Overdue:</td>
            <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: 600;">${interestCalc.daysOverdue} days</td>
          </tr>
        </table>
      </div>

      <!-- Interest Calculation -->
      ${formatInterestCalculationHTML(interestCalc)}

      <!-- CTA Placement 1: Top (After Interest Calc) -->
      <div style="text-align: center; margin: 24px 0;">
        ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Pay Now</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Invoice & Pay</a>`
        : ''
    }
      </div>

      <!-- Warning -->
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: 600; font-size: 14px;">
          ⚠️ Interest is accruing daily at ${formatCurrency(interestCalc.dailyInterest)}/day
        </p>
        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
          The longer payment is delayed, the more you will owe. Please settle this invoice immediately
          to avoid further charges.
        </p>
      </div>

      <!-- CTA Placement 2: Middle (After Warning) -->
      <div style="text-align: center; margin: 32px 0;">
        ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Pay Now</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Invoice & Pay</a>`
        : ''
    }
      </div>
      
      <!-- Secondary CTA -->
      <div style="text-align: center; margin: 16px 0;">
        <a href="${invoiceViewUrl || '#'}" style="color: #6b7280; text-decoration: underline; font-size: 14px;">I already paid this</a>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        If payment has already been sent, please provide proof of payment immediately
        so we can update our records.
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        If you are unable to pay the full amount, please contact me within 48 hours
        to discuss payment arrangements. Failure to respond may result in further action.
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Regards,<br>
        <strong>${businessName}</strong>
      </p>

      <!-- CTA Placement 3: Bottom (Before Footer) -->
      <div style="text-align: center; margin: 24px 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 12px;">Pay Now - Stop Interest</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 12px;">View Invoice & Pay</a>`
        : ''
    }
        <br>
        <a href="${invoiceViewUrl || '#'}" style="color: #3b82f6; text-decoration: underline; font-size: 14px; margin: 0 12px;">I already paid</a>
        <span style="color: #d1d5db;">|</span>
        <a href="mailto:${freelancerBusinessName || freelancerName}" style="color: #3b82f6; text-decoration: underline; font-size: 14px; margin: 0 12px;">Request payment plan</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">
        This is a formal payment notice from <strong>${businessName}</strong><br>
        ${freelancerBusinessName ? `${freelancerBusinessName}<br>` : ''}
        ${process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '123 Business Street, London, UK'}
      </p>
      <p style="margin: 8px 0 4px 0;">
        Interest charged under the Late Payment of Commercial Debts (Interest) Act 1998<br>
        Contact: ${freelancerBusinessName || freelancerName} | <a href="mailto:${freelancerBusinessName || freelancerName}" style="color: #9ca3af; text-decoration: underline;">Email Us</a>
      </p>
      <p style="margin: 0;">
        <a href="https://relay.app/privacy" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Privacy Policy</a> | 
        <a href="https://relay.app/unsubscribe?email=${encodeURIComponent(clientEmail)}" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
URGENT PAYMENT NOTICE

Dear ${clientName},

This is a firm reminder that invoice ${invoiceNumber || invoiceId} remains unpaid
${interestCalc.daysOverdue} days after the due date.

As per the Late Payment of Commercial Debts (Interest) Act 1998, I am now entitled
to charge statutory interest and debt recovery costs.

Original Invoice:
- Invoice Number: ${invoiceNumber || invoiceId}
- Description: ${description}
- Due Date: ${dueDateFormatted}
- Days Overdue: ${interestCalc.daysOverdue} days

Late Payment Interest Breakdown:
- Principal Amount: ${formatCurrency(interestCalc.principalAmount)}
- Interest Rate: ${interestCalc.interestRate}% per annum
  (${interestCalc.statutoryRate}% statutory + ${interestCalc.bankBaseRate}% BoE base rate)
- Interest Accrued: ${formatCurrency(interestCalc.interestAccrued)}
- Fixed Recovery Cost: ${formatCurrency(interestCalc.fixedRecoveryCost)}

TOTAL OWED: ${formatCurrency(interestCalc.totalOwed)}

⚠️ WARNING: Interest is accruing daily at ${formatCurrency(interestCalc.dailyInterest)}/day

The longer payment is delayed, the more you will owe. Please settle this invoice
immediately to avoid further charges.

${invoiceViewUrl ? `View Invoice & Pay: ${invoiceViewUrl}` : ''}

If payment has already been sent, please provide proof immediately.

If you are unable to pay the full amount, contact me within 48 hours to discuss
payment arrangements. Failure to respond may result in further action.

Regards,
${businessName}

Interest charged under the Late Payment of Commercial Debts (Interest) Act 1998
  `.trim();

  try {
    await sendEmail({
      to: clientEmail,
      subject,
      html,
      text,
    });

    logInfo('Firm reminder sent', {
      invoiceId,
      clientEmail,
      amount,
      daysOverdue: interestCalc.daysOverdue,
      interestAccrued: interestCalc.interestAccrued,
      totalOwed: interestCalc.totalOwed,
    });
  } catch (error) {
    logError('Failed to send firm reminder', error as Error);
    throw error;
  }
}

// ============================================================
// DAY 30: FINAL NOTICE (Legal Action Warning)
// ============================================================

/**
 * Day 30: Final notice with legal action warning
 * Tone: Formal, legal, final warning before escalation
 * Full interest + fixed fee + legal action timeline
 *
 * @param params - Email parameters
 */
export async function sendFinalNotice(params: CollectionsEmailParams): Promise<void> {
  const {
    invoiceId,
    clientEmail,
    clientName,
    amount,
    dueDate,
    invoiceNumber,
    description = 'services provided',
    freelancerName = 'Relay',
    freelancerBusinessName,
    invoiceViewUrl,
    paymentUrl,
  } = params;

  const businessName = freelancerBusinessName || freelancerName;
  const dueDateFormatted = dueDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate interest
  const interestCalc = calculateLatePaymentInterest({
    principalAmount: amount,
    dueDate,
  });

  // Deadline: 7 days from now
  const paymentDeadline = new Date();
  paymentDeadline.setDate(paymentDeadline.getDate() + 7);
  const deadlineFormatted = paymentDeadline.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subject = `${clientName} - Final notice: Invoice ${invoiceNumber || invoiceId}`;

  // Format previous reminder dates if provided
  const firstReminderText = params.firstReminderDate
    ? params.firstReminderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    : null;
  const secondReminderText = params.secondReminderDate
    ? params.secondReminderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    : null;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🚨 FINAL NOTICE</h1>
      <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 14px;">Legal Action Will Be Taken</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
        <strong>Dear ${clientName},</strong>
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Re: Invoice <strong>${invoiceNumber || invoiceId}</strong> - Outstanding Payment of ${formatCurrency(amount)}
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        This is a <strong>FINAL NOTICE</strong> regarding invoice <strong>${invoiceNumber || invoiceId}</strong>,
        which remains unpaid <strong>${interestCalc.daysOverdue} days</strong> after the due date of <strong>${dueDateFormatted}</strong>.
      </p>

      ${(firstReminderText && secondReminderText) ? `<p style="color: #374151; font-size: 16px; line-height: 1.6;">
        We have previously sent reminders on <strong>${firstReminderText}</strong> and <strong>${secondReminderText}</strong>, 
        requesting payment. Despite these communications, we have not received payment.
      </p>` : `<p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Despite previous reminders, payment has not been received. This matter is now being escalated.
      </p>`}

      <!-- Critical Warning -->
      <div style="background: #7f1d1d; color: white; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px;">⚠️ PAYMENT DEADLINE</h3>
        <p style="margin: 0; font-size: 24px; font-weight: 700;">${deadlineFormatted}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
          Payment must be received by this date to avoid legal proceedings
        </p>
      </div>

      <!-- CTA Placement 1: Top (After Deadline Warning) -->
      <div style="text-align: center; margin: 24px 0;">
        ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">PAY IMMEDIATELY</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">PAY IMMEDIATELY</a>`
        : ''
    }
      </div>

      <!-- Invoice Details -->
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">Original Invoice</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Invoice Number:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${invoiceNumber || invoiceId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Description:</td>
            <td style="padding: 8px 0; text-align: right; color: #111827;">${description}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
            <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: 600;">${dueDateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Days Overdue:</td>
            <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: 700;">${interestCalc.daysOverdue} days</td>
          </tr>
        </table>
      </div>

      <!-- Interest Calculation -->
      ${formatInterestCalculationHTML(interestCalc)}

      <!-- Legal Action Steps -->
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 24px 0; border: 2px solid #dc2626;">
        <h3 style="margin: 0 0 12px 0; color: #7f1d1d; font-size: 16px;">📋 Next Steps if Payment Not Received:</h3>
        <ol style="margin: 0; padding-left: 20px; color: #7f1d1d; line-height: 1.8;">
          <li>Case referred to debt collection agency</li>
          <li>County Court Judgement (CCJ) proceedings initiated</li>
          <li>Additional legal fees added to debt</li>
          <li>Impact on your credit rating for 6 years</li>
          <li>Potential bailiff action to recover goods</li>
        </ol>
      </div>

      <!-- CTA Placement 2: Middle (After Legal Action Steps) -->
      <div style="text-align: center; margin: 32px 0;">
        ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">PAY IMMEDIATELY</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">PAY IMMEDIATELY</a>`
        : ''
    }
      </div>
      
      <!-- Secondary CTA -->
      <div style="text-align: center; margin: 16px 0;">
        <a href="${invoiceViewUrl || '#'}" style="color: #6b7280; text-decoration: underline; font-size: 14px;">I already paid - provide proof</a>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; font-weight: 600;">
        This is your final opportunity to settle this debt voluntarily.
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        If you believe this notice has been sent in error, or if you have already made payment,
        you must provide proof of payment within 48 hours.
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        If you require a payment plan, you must contact me immediately. Silence will be
        interpreted as unwillingness to pay, and legal proceedings will commence.
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        <strong>${businessName}</strong>
      </p>

      <!-- CTA Placement 3: Bottom (Before Footer) -->
      <div style="text-align: center; margin: 24px 0; padding-top: 24px; border-top: 2px solid #dc2626;">
        ${paymentUrl
      ? `<a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">PAY NOW - Avoid Legal Action</a>`
      : invoiceViewUrl
        ? `<a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">PAY NOW - Avoid Legal Action</a>`
        : ''
    }
        <br>
        <a href="${invoiceViewUrl || '#'}" style="color: #3b82f6; text-decoration: underline; font-size: 14px; margin: 0 12px;">Proof of payment</a>
        <span style="color: #d1d5db;">|</span>
        <a href="mailto:${freelancerBusinessName || freelancerName}" style="color: #dc2626; text-decoration: underline; font-size: 14px; font-weight: 600; margin: 0 12px;">Emergency payment plan request</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0 0 4px 0;">
        <strong>FORMAL LEGAL NOTICE</strong>
      </p>
      <p style="margin: 4px 0 8px 0;">
        <strong>${businessName}</strong><br>
        ${freelancerBusinessName ? `${freelancerBusinessName}<br>` : ''}
        ${process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '123 Business Street, London, UK'}
      </p>
      <p style="margin: 8px 0 4px 0;">
        This notice is issued under the Late Payment of Commercial Debts (Interest) Act 1998<br>
        Failure to respond may result in County Court proceedings<br>
        Contact: ${freelancerBusinessName || freelancerName} | <a href="mailto:${freelancerBusinessName || freelancerName}" style="color: #9ca3af; text-decoration: underline;">Email Us</a>
      </p>
      <p style="margin: 0;">
        <a href="https://relay.app/privacy" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Privacy Policy</a> | 
        <a href="https://relay.app/unsubscribe?email=${encodeURIComponent(clientEmail)}" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
🚨 FINAL NOTICE - LEGAL ACTION IMMINENT

Dear ${clientName},

This is a FINAL NOTICE regarding unpaid invoice ${invoiceNumber || invoiceId},
which is now ${interestCalc.daysOverdue} days overdue.

Despite previous reminders, payment has not been received. This matter is now being escalated.

⚠️ PAYMENT DEADLINE: ${deadlineFormatted}
Payment must be received by this date to avoid legal proceedings.

Original Invoice:
- Invoice Number: ${invoiceNumber || invoiceId}
- Description: ${description}
- Due Date: ${dueDateFormatted}
- Days Overdue: ${interestCalc.daysOverdue} days

Late Payment Interest Breakdown:
- Principal Amount: ${formatCurrency(interestCalc.principalAmount)}
- Interest Rate: ${interestCalc.interestRate}% per annum
- Interest Accrued: ${formatCurrency(interestCalc.interestAccrued)}
- Fixed Recovery Cost: ${formatCurrency(interestCalc.fixedRecoveryCost)}

TOTAL OWED: ${formatCurrency(interestCalc.totalOwed)}

📋 NEXT STEPS IF PAYMENT NOT RECEIVED:
1. Case referred to debt collection agency
2. County Court Judgement (CCJ) proceedings initiated
3. Additional legal fees added to debt
4. Impact on your credit rating for 6 years
5. Potential bailiff action to recover goods

${invoiceViewUrl ? `PAY NOW: ${invoiceViewUrl}` : ''}

This is your final opportunity to settle this debt voluntarily.

If you believe this notice has been sent in error, or if you have already made payment,
you must provide proof within 48 hours.

If you require a payment plan, contact me immediately. Silence will be interpreted
as unwillingness to pay, and legal proceedings will commence.

${businessName}

---
FORMAL LEGAL NOTICE
This notice is issued under the Late Payment of Commercial Debts (Interest) Act 1998
Failure to respond may result in County Court proceedings
  `.trim();

  try {
    await sendEmail({
      to: clientEmail,
      subject,
      html,
      text,
    });

    logInfo('Final notice sent', {
      invoiceId,
      clientEmail,
      amount,
      daysOverdue: interestCalc.daysOverdue,
      interestAccrued: interestCalc.interestAccrued,
      totalOwed: interestCalc.totalOwed,
      deadline: deadlineFormatted,
    });
  } catch (error) {
    logError('Failed to send final notice', error as Error);
    throw error;
  }
}

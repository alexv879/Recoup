import sgMail from '@sendgrid/mail';
import { firestore } from '@/lib/firebase';
import { previewEmailTemplate } from '@/lib/emailTemplateRenderer';
import { logger } from '@/utils/logger';

// Initialize SendGrid (lazy initialization to avoid build-time errors)
let isInitialized = false;

function ensureSendGridInitialized() {
  if (!isInitialized) {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is required. Get your API key from https://app.sendgrid.com/settings/api_keys');
    }
    // Note: Most SendGrid keys start with 'SG.' but validation is done by SendGrid API
    sgMail.setApiKey(apiKey);
    isInitialized = true;
  }
}

// Send email using dynamic template
export async function sendEmail(params: {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>;
  from?: { email: string; name?: string };
  subject?: string;
  fallbackText?: string;
}) {
  ensureSendGridInitialized();

  try {
    // Check if template ID is provided
    if (!params.templateId || params.templateId === 'undefined') {
      // Fallback: Send plain text email if template ID missing
      logger.warn('SendGrid template ID missing, falling back to plain text email', {
        to: params.to,
        subject: params.subject,
      });

      const msg = {
        to: params.to,
        from: params.from || {
          email: process.env.SENDGRID_FROM_EMAIL!,
          name: process.env.SENDGRID_FROM_NAME || 'Recoup',
        },
        subject: params.subject || 'Notification from Recoup',
        text: params.fallbackText || 'You have a notification from Recoup. Please log in to view details.',
        html: `<p>${params.fallbackText || 'You have a notification from Recoup. Please log in to view details.'}</p>`,
      };

      await sgMail.send(msg);
      console.log(`✅ Fallback email sent to ${params.to}`);
      return;
    }

    const msg = {
      to: params.to,
      from: params.from || {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME || 'Recoup',
      },
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData,
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${params.to}`);
  } catch (error: any) {
    // Enhanced error handling with template-specific guidance
    if (error?.response?.body?.errors) {
      const errors = error.response.body.errors;
      const isTemplateError = errors.some((e: any) =>
        e.message?.includes('template') || e.message?.includes('not found')
      );

      if (isTemplateError) {
        logger.error('SendGrid template error - please verify template ID in .env', {
          templateId: params.templateId,
          to: params.to,
          errors,
        });
        throw new Error(
          `SendGrid template error: Template ID "${params.templateId}" not found. ` +
          'Please verify SENDGRID_*_TEMPLATE_ID environment variables are correctly set. ' +
          'See SETUP.md for template creation instructions.'
        );
      }
    }

    console.error('SendGrid email error:', error);
    throw new Error('Failed to send email');
  }
}

// Send invoice email with payment options
export async function sendInvoiceEmail(params: {
  toEmail: string;
  invoiceReference: string;
  amount: number;
  currency?: string;
  freelancerName: string;
  dueDate?: Date;
  description?: string;
  bankDetails?: string;
  stripeLink?: string;
  confirmationUrl: string;
}) {
  const templateId = process.env.SENDGRID_INVOICE_TEMPLATE_ID!;

  await sendEmail({
    to: params.toEmail,
    templateId,
    dynamicTemplateData: {
      freelancerName: params.freelancerName,
      invoiceReference: params.invoiceReference,
      amount: params.amount.toFixed(2),
      currency: params.currency || 'GBP',
      dueDate: params.dueDate?.toISOString(),
      description: params.description,
      bankDetails: params.bankDetails,
      stripeLink: params.stripeLink,
      confirmationUrl: params.confirmationUrl,
    },
    subject: `Invoice ${params.invoiceReference} from ${params.freelancerName}`,
    fallbackText: `You have received invoice ${params.invoiceReference} from ${params.freelancerName} for ${params.currency || 'GBP'} ${params.amount.toFixed(2)}. Due date: ${params.dueDate?.toLocaleDateString() || 'Not specified'}. View invoice: ${params.confirmationUrl}`,
  });
}

// Send day 7 reminder email
export async function sendReminderDay7Email(params: {
  toEmail: string;
  freelancerName: string;
  invoiceReference: string;
  amount: number;
  currency: string;
  dueDate: Date;
  daysOverdue: number;
}) {
  const templateId = process.env.SENDGRID_REMINDER_DAY7_TEMPLATE_ID!;

  await sendEmail({
    to: params.toEmail,
    templateId,
    dynamicTemplateData: {
      freelancerName: params.freelancerName,
      invoiceReference: params.invoiceReference,
      amount: params.amount.toFixed(2),
      currency: params.currency,
      dueDate: params.dueDate.toISOString(),
      daysOverdue: params.daysOverdue,
    },
  });
}

// Send day 21 reminder email
export async function sendReminderDay21Email(params: {
  toEmail: string;
  freelancerName: string;
  invoiceReference: string;
  amount: number;
  currency: string;
  dueDate: Date;
  daysOverdue: number;
}) {
  const templateId = process.env.SENDGRID_REMINDER_DAY21_TEMPLATE_ID!;

  await sendEmail({
    to: params.toEmail,
    templateId,
    dynamicTemplateData: {
      freelancerName: params.freelancerName,
      invoiceReference: params.invoiceReference,
      amount: params.amount.toFixed(2),
      currency: params.currency,
      dueDate: params.dueDate.toISOString(),
      daysOverdue: params.daysOverdue,
    },
  });
}

// Send payment confirmed notification
export async function sendPaymentConfirmedEmail(params: {
  toEmail: string;
  invoiceReference: string;
  amount: number;
  clientName: string;
}) {
  const templateId = process.env.SENDGRID_PAYMENT_CONFIRMED_TEMPLATE_ID!;

  await sendEmail({
    to: params.toEmail,
    templateId,
    dynamicTemplateData: {
      invoiceReference: params.invoiceReference,
      amount: params.amount.toFixed(2),
      clientName: params.clientName,
    },
  });
}

// Send payment verification required email (fraud prevention)
export async function sendPaymentVerificationRequiredEmail(params: {
  toEmail: string;
  invoiceReference: string;
  amount: number;
  clientName: string;
  claimedPaymentDate: string;
  verifyUrl: string;
  disputeUrl: string;
  deadlineDays?: number;
}) {
  const templateId = process.env.SENDGRID_PAYMENT_VERIFICATION_TEMPLATE_ID!;

  await sendEmail({
    to: params.toEmail,
    templateId,
    dynamicTemplateData: {
      invoiceReference: params.invoiceReference,
      amount: params.amount.toFixed(2),
      clientName: params.clientName,
      claimedPaymentDate: params.claimedPaymentDate,
      verifyUrl: params.verifyUrl,
      disputeUrl: params.disputeUrl,
      deadlineDays: params.deadlineDays || 5,
    },
  });
}

// Send payment verified confirmation email (to client)
export async function sendPaymentVerifiedEmail(params: {
  toEmail: string;
  invoiceReference: string;
  amount: number;
  freelancerName: string;
  receiptUrl?: string;
}) {
  const templateId = process.env.SENDGRID_PAYMENT_VERIFIED_TEMPLATE_ID!;

  await sendEmail({
    to: params.toEmail,
    templateId,
    dynamicTemplateData: {
      invoiceReference: params.invoiceReference,
      amount: params.amount.toFixed(2),
      freelancerName: params.freelancerName,
      receiptUrl: params.receiptUrl,
    },
  });
}

// Send payment rejected notification email (to client)
export async function sendPaymentRejectedEmail(params: {
  toEmail: string;
  invoiceReference: string;
  amount: number;
  rejectionReason: string;
  uploadProofUrl: string;
  payNowUrl: string;
  supportUrl: string;
  deadlineDate: string;
}) {
  const templateId = process.env.SENDGRID_PAYMENT_REJECTED_TEMPLATE_ID!;

  await sendEmail({
    to: params.toEmail,
    templateId,
    dynamicTemplateData: {
      invoiceReference: params.invoiceReference,
      amount: params.amount.toFixed(2),
      rejectionReason: params.rejectionReason,
      uploadProofUrl: params.uploadProofUrl,
      payNowUrl: params.payNowUrl,
      supportUrl: params.supportUrl,
      deadlineDate: params.deadlineDate,
    },
  });
}

// Send smart notification email
export async function sendNotificationEmail(params: {
  toEmail: string;
  subject: string;
  message: string;
  actionUrl?: string;
}) {
  const templateId = process.env.SENDGRID_NOTIFICATION_TEMPLATE_ID!;

  await sendEmail({
    to: params.toEmail,
    templateId,
    dynamicTemplateData: {
      subject: params.subject,
      message: params.message,
      actionUrl: params.actionUrl,
    },
  });
}

/**
 * Send Day 5/15/30 reminder email using our custom templates
 * 
 * This function integrates with emailTemplateRenderer to generate emails
 * from our HTML/text templates with full variable substitution.
 * 
 * Per MASTER_IMPLEMENTATION_AUDIT_V1.md §4.6
 */
export async function sendReminderEmail(params: {
  invoiceId: string;
  level: 'day5' | 'day15' | 'day30';
  clientEmail: string;
}): Promise<{ messageId: string }> {
  ensureSendGridInitialized();

  try {
    // Get invoice data from Firestore
    const invoiceDoc = await firestore.collection('invoices').doc(params.invoiceId).get();

    if (!invoiceDoc.exists) {
      throw new Error(`Invoice ${params.invoiceId} not found`);
    }

    const invoice = invoiceDoc.data()!;

    // Get user/freelancer data
    const userDoc = await firestore.collection('users').doc(invoice.userId).get();

    if (!userDoc.exists) {
      throw new Error(`User ${invoice.userId} not found`);
    }

    const user = userDoc.data()!;

    // Calculate days overdue
    const dueDate = new Date(invoice.dueDate);
    const now = new Date();
    const diffMs = now.getTime() - dueDate.getTime();
    const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Prepare template variables
    const variables = {
      client_name: invoice.clientName || 'Client',
      invoice_number: invoice.invoiceNumber,
      amount: (invoice.amount / 100).toFixed(2), // Convert pence to pounds
      due_date: dueDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      days_overdue: daysOverdue.toString(),
      freelancer_name: user.name || user.firstName || 'Freelancer',
      freelancer_email: user.email,
      freelancer_phone: user.phone || '',
      freelancer_company: user.company || '',
      payment_link: invoice.paymentLink || `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`,
    };

    // Render email templates
    const { html, text, subject } = await previewEmailTemplate(
      params.level,
      variables,
      invoice.amount // in pence
    );

    // Prepare SendGrid message
    const from = {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@recoup.app',
      name: user.name || user.firstName || 'Recoup',
    };

    const msg = {
      to: params.clientEmail,
      from,
      subject,
      text,
      html,
      // Add custom args for webhook tracking
      customArgs: {
        invoiceId: params.invoiceId,
        reminderLevel: params.level,
        userId: invoice.userId,
      },
      // Add tracking settings
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: false,
        },
        openTracking: {
          enable: true,
        },
      },
    };

    // Send via SendGrid
    const response = await sgMail.send(msg);

    // SendGrid returns array of responses (one per email)
    const messageId = response[0].headers['x-message-id'] as string;

    logger.info('Reminder email sent successfully', {
      invoiceId: params.invoiceId,
      level: params.level,
      clientEmail: params.clientEmail,
      messageId,
    });

    return { messageId };
  } catch (error) {
    logger.error('Failed to send reminder email', {
      invoiceId: params.invoiceId,
      level: params.level,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

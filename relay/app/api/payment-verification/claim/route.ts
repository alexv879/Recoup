/**
 * PAYMENT VERIFICATION - CLAIM API
 * POST /api/payment-verification/claim
 *
 * Allows clients to claim they've paid an invoice
 * Pauses collections for 48 hours while freelancer verifies
 *
 * Research Impact:
 * - Reduces false collection attempts
 * - Improves client trust
 * - Automated 48-hour verification window
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/sendgrid';
import { trackEvent } from '@/lib/analytics';
import { errors, handleApiError } from '@/utils/error';
import { logInfo, logError } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const {
      invoiceId,
      paymentMethod,
      evidenceUrl,
      evidenceFileName,
    } = await req.json();

    // Validate required fields
    if (!invoiceId || !paymentMethod) {
      throw errors.badRequest('Missing required fields');
    }

    // Get invoice
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();

    if (!invoiceDoc.exists) {
      throw errors.notFound('Invoice not found');
    }

    const invoice = invoiceDoc.data();
    if (!invoice) {
      throw errors.notFound('Invoice not found');
    }

    // Create payment claim
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const verificationDeadline = new Date();
    verificationDeadline.setHours(verificationDeadline.getHours() + 48); // 48 hour window

    const claim = {
      id: claimId,
      invoiceId,
      claimantEmail: invoice.clientEmail || '',
      claimantName: invoice.clientName || '',
      amount: invoice.totalAmount || 0,
      paymentMethod,
      evidenceUrl: evidenceUrl || null,
      evidenceFileName: evidenceFileName || null,
      claimedAt: new Date().toISOString(),
      status: 'pending',
      verificationDeadline: verificationDeadline.toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Save claim to Firestore
    await db.collection('paymentClaims').doc(claimId).set(claim);

    // Update invoice status
    await db.collection('invoices').doc(invoiceId).update({
      paymentClaimStatus: 'pending_verification',
      paymentClaimId: claimId,
      collectionsPaused: true,
      collectionsPausedUntil: verificationDeadline.toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Send notification email to freelancer
    await sendPaymentClaimNotification({
      freelancerEmail: invoice.freelancerEmail || '',
      freelancerName: invoice.freelancerName || 'there',
      claimantName: claim.claimantName,
      invoiceNumber: invoice.invoiceNumber || invoiceId,
      amount: claim.amount,
      paymentMethod,
      hasEvidence: !!evidenceUrl,
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/collections/verify/${claimId}`,
    });

    // Send confirmation email to client
    await sendPaymentClaimConfirmation({
      clientEmail: claim.claimantEmail,
      clientName: claim.claimantName,
      invoiceNumber: invoice.invoiceNumber || invoiceId,
      amount: claim.amount,
      verificationDeadline,
    });

    // Track event
    trackEvent('payment_claim_created', {
      claimId,
      invoiceId,
      paymentMethod,
      hasEvidence: !!evidenceUrl,
      amount: claim.amount,
    });

    logInfo('Payment claim created', {
      claimId,
      invoiceId,
      paymentMethod,
    });

    return NextResponse.json({
      success: true,
      claimId,
      verificationDeadline,
      message: 'Payment claim submitted successfully. Verification pending.',
    });

  } catch (error) {
    logError('Payment claim creation failed', error as Error);
    return handleApiError(error, 'POST', '/api/payment-verification/claim');
  }
}

// ============================================================
// EMAIL NOTIFICATIONS
// ============================================================

async function sendPaymentClaimNotification(params: {
  freelancerEmail: string;
  freelancerName: string;
  claimantName: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  hasEvidence: boolean;
  verificationUrl: string;
}) {
  const {
    freelancerEmail,
    freelancerName,
    claimantName,
    invoiceNumber,
    amount,
    paymentMethod,
    hasEvidence,
    verificationUrl,
  } = params;

  const subject = `🔔 Payment claim for Invoice ${invoiceNumber} - ${claimantName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">💰 Payment Claim Received</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="font-size: 16px;">Hi <strong>${freelancerName}</strong>,</p>

    <p>
      <strong>${claimantName}</strong> has claimed they've paid invoice <strong>${invoiceNumber}</strong>
      for <strong>£${amount.toFixed(2)}</strong>.
    </p>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Claim Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${paymentMethod.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Proof of Payment</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">
            ${hasEvidence ? '✅ Provided' : '❌ Not provided'}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Verification Deadline</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px; color: #dc2626;">
            48 hours
          </td>
        </tr>
      </table>
    </div>

    ${!hasEvidence ? `
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 24px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          ⚠️ <strong>No proof of payment was provided.</strong> You can request evidence before verifying.
        </p>
      </div>
    ` : ''}

    <h3 style="font-size: 16px; margin: 24px 0 12px 0;">What happens next?</h3>
    <p style="font-size: 14px; color: #6b7280;">
      Collections have been paused for this invoice. Please verify the claim within 48 hours:
    </p>

    <ul style="font-size: 14px; color: #6b7280; line-height: 1.8;">
      <li><strong>Confirm Payment:</strong> Mark invoice as paid</li>
      <li><strong>Request Evidence:</strong> Ask for proof of payment</li>
      <li><strong>Reject Claim:</strong> Resume collections if payment not received</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Verify Payment →
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
      If you don't verify within 48 hours, collections will automatically resume.
    </p>

  </div>

  <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
      Powered by <a href="https://relay.app" style="color: #667eea; text-decoration: none;">Relay</a>
    </p>
  </div>

</body>
</html>`;

  await sendEmail({
    to: freelancerEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: 'Relay Collections',
    },
    subject,
    html,
  });
}

async function sendPaymentClaimConfirmation(params: {
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  verificationDeadline: Date;
}) {
  const {
    clientEmail,
    clientName,
    invoiceNumber,
    amount,
    verificationDeadline,
  } = params;

  const subject = `✅ Payment claim received for Invoice ${invoiceNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✅ Payment Claim Received</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="font-size: 16px;">Hi <strong>${clientName}</strong>,</p>

    <p>
      Thank you for claiming payment on invoice <strong>${invoiceNumber}</strong> for <strong>£${amount.toFixed(2)}</strong>.
    </p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>Collections have been paused</strong> while we verify your payment. You will not receive
        any further collection reminders for this invoice during the verification period.
      </p>
    </div>

    <h3 style="font-size: 16px; margin: 24px 0 12px 0;">What happens next?</h3>
    <p style="font-size: 14px; color: #6b7280;">
      Your payment claim will be verified within <strong>48 hours</strong> (by ${verificationDeadline.toLocaleString()}).
      You'll receive an email once the claim is verified.
    </p>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">Possible Outcomes:</h4>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #6b7280; line-height: 1.8;">
        <li><strong>Payment Confirmed:</strong> Invoice marked as paid, collections ended</li>
        <li><strong>Evidence Requested:</strong> We may ask for proof of payment</li>
        <li><strong>Claim Rejected:</strong> Payment not received, collections resume</li>
      </ul>
    </div>

    <p style="font-size: 14px; color: #6b7280;">
      If you have any questions, please contact us or reply to this email.
    </p>

  </div>

  <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
      Powered by <a href="https://relay.app" style="color: #667eea; text-decoration: none;">Relay</a>
    </p>
  </div>

</body>
</html>`;

  await sendEmail({
    to: clientEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: 'Relay',
    },
    subject,
    html,
  });
}

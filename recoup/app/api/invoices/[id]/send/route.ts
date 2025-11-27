/**
 * Send Invoice API Endpoint
 * POST /api/invoices/[id]/send
 *
 * Sends an invoice to the client via email with PDF attachment
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase-admin';
import { logInfo, logError } from '@/utils/logger';
import { sendInvoiceEmail } from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';

interface SendInvoiceRequest {
  message?: string;
  includePaymentLink?: boolean;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: invoiceId } = await params;

    // 2. Get invoice from Firestore
    const invoiceRef = db.collection('invoices').doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoiceData = invoiceDoc.data();

    // 3. Verify invoice belongs to user
    if (invoiceData?.freelancerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to invoice' },
        { status: 403 }
      );
    }

    // 4. Parse request body
    const body: SendInvoiceRequest = await req.json().catch(() => ({}));

    // 5. Generate payment link if needed
    let paymentLink: string | undefined;
    if (body.includePaymentLink !== false) {
      paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoiceId}`;
    }

    // 6. Send invoice email
    await sendInvoiceEmail({
      toEmail: invoiceData.clientEmail,
      invoiceReference: invoiceData.reference,
      amount: invoiceData.amount,
      currency: invoiceData.currency || 'GBP',
      freelancerName: invoiceData.businessName || 'Recoup',
      dueDate: invoiceData.dueDate?.toDate?.() || new Date(invoiceData.dueDate),
      description: body.message,
      stripeLink: paymentLink,
      confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}`,
    });

    // 7. Update invoice status
    await invoiceRef.update({
      status: invoiceData.status === 'draft' ? 'sent' : invoiceData.status,
      sentAt: new Date(),
      lastSentAt: new Date(),
      updatedAt: new Date(),
    });

    // 8. Log activity
    const activityRef = db.collection('invoiceActivities').doc();
    await activityRef.set({
      invoiceId,
      activityType: 'invoice_sent',
      timestamp: new Date(),
      details: {
        recipient: invoiceData.clientEmail,
        includePaymentLink: !!paymentLink,
      },
    });

    logInfo('Invoice sent successfully', {
      invoiceId,
      clientEmail: invoiceData.clientEmail,
    });

    return NextResponse.json({
      success: true,
      invoiceId,
      sentTo: invoiceData.clientEmail,
    });

  } catch (error: any) {
    logError('Failed to send invoice', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

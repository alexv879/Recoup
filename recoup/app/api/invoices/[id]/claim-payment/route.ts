import { NextResponse } from 'next/server';
import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';
import { sendEmail } from '@/lib/sendgrid';
import { z } from 'zod';
import { logError } from '@/utils/logger';

const paymentClaimSchema = z.object({
    paymentMethod: z.enum(['bank_transfer', 'cash', 'cheque']),
    paymentReference: z.string().optional(),
    paymentDate: z.date().or(z.string().transform((str) => new Date(str))),
    clientNotes: z.string().optional(),
});

/**
 * POST /api/invoices/[id]/claim-payment
 * Client claims they have paid the invoice via BACS/bank transfer
 * Creates a payment claim that requires freelancer verification
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validatedData = paymentClaimSchema.parse(body);

        // Get invoice
        const invoiceDoc = await db.collection(COLLECTIONS.INVOICES).doc(id).get();

        if (!invoiceDoc.exists) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const invoice = invoiceDoc.data()!;

        // Check if invoice is already paid
        if (invoice.status === 'paid') {
            return NextResponse.json({ error: 'Invoice already marked as paid' }, { status: 400 });
        }

        // Check if there's already a pending claim
        if (invoice.paymentClaimStatus === 'pending_verification') {
            return NextResponse.json({ error: 'Payment claim already pending verification' }, { status: 400 });
        }

        // Create payment claim record
        const claimRef = await db.collection(COLLECTIONS.PAYMENT_CLAIMS).add({
            invoiceId: id,
            clientName: invoice.clientName,
            clientEmail: invoice.clientEmail,
            freelancerId: invoice.freelancerId,
            amount: invoice.amount,
            paymentMethod: validatedData.paymentMethod,
            paymentReference: validatedData.paymentReference || null,
            paymentDate: Timestamp.fromDate(validatedData.paymentDate),
            clientNotes: validatedData.clientNotes || null,
            status: 'pending_verification',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        const claimId = claimRef.id;

        // Update invoice with claim reference
        await invoiceDoc.ref.update({
            paymentClaimId: claimId,
            paymentClaimStatus: 'pending_verification',
            paymentClaimDate: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        // Send notification to freelancer
        await sendEmail({
            to: invoice.freelancerEmail || invoice.clientEmail, // Fallback
            templateId: process.env.SENDGRID_TEMPLATE_PAYMENT_CLAIM_NOTIFICATION!,
            dynamicTemplateData: {
                freelancerName: invoice.freelancerName || 'Freelancer',
                clientName: invoice.clientName,
                invoiceReference: invoice.reference,
                amount: invoice.amount.toFixed(2),
                paymentMethod: validatedData.paymentMethod === 'bank_transfer' ? 'Bank Transfer (BACS)' :
                    validatedData.paymentMethod === 'cash' ? 'Cash' : 'Cheque',
                paymentDate: validatedData.paymentDate.toLocaleDateString('en-GB'),
                paymentReference: validatedData.paymentReference,
                clientNotes: validatedData.clientNotes,
                verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${id}/verify-payment`,
            },
        });

        // Send confirmation to client
        await sendEmail({
            to: invoice.clientEmail,
            templateId: process.env.SENDGRID_TEMPLATE_PAYMENT_CLAIM_CONFIRMATION!,
            dynamicTemplateData: {
                clientName: invoice.clientName,
                invoiceReference: invoice.reference,
                amount: invoice.amount.toFixed(2),
                paymentMethod: validatedData.paymentMethod === 'bank_transfer' ? 'Bank Transfer (BACS)' :
                    validatedData.paymentMethod === 'cash' ? 'Cash' : 'Cheque',
                paymentDate: validatedData.paymentDate.toLocaleDateString('en-GB'),
                freelancerName: invoice.freelancerName || 'the freelancer',
                freelancerEmail: invoice.freelancerEmail || invoice.clientEmail,
            },
        });

        return NextResponse.json({
            success: true,
            claimId,
        });
    } catch (error) {
        logError('Error claiming payment', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid payment claim data', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to submit payment claim' },
            { status: 500 }
        );
    }
}

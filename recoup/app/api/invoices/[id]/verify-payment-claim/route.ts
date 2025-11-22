import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';
import { sendEmail } from '@/lib/sendgrid';
import { z } from 'zod';
import { logError } from '@/utils/logger';

const verificationSchema = z.object({
    verified: z.boolean(),
    actualAmount: z.number().positive().optional(),
    verificationNotes: z.string().optional(),
});

/**
 * POST /api/invoices/[id]/verify-payment-claim
 * Freelancer verifies or rejects a client's payment claim
 * If verified, marks invoice as paid and stops collections
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = verificationSchema.parse(body);

        // Get invoice
        const invoiceDoc = await db.collection(COLLECTIONS.INVOICES).doc(id).get();

        if (!invoiceDoc.exists) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const invoice = invoiceDoc.data()!;

        // Verify ownership
        if (invoice.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get payment claim
        if (!invoice.paymentClaimId) {
            return NextResponse.json({ error: 'No payment claim found' }, { status: 404 });
        }

        const claimDoc = await db.collection(COLLECTIONS.PAYMENT_CLAIMS).doc(invoice.paymentClaimId).get();

        if (!claimDoc.exists) {
            return NextResponse.json({ error: 'Payment claim not found' }, { status: 404 });
        }

        const claim = claimDoc.data()!;

        if (validatedData.verified) {
            // VERIFIED - Mark invoice as paid
            const paidAmount = validatedData.actualAmount || claim.amount;

            await invoiceDoc.ref.update({
                status: 'paid',
                paidAt: claim.paymentDate,
                paidAmount: paidAmount,
                paymentMethod: claim.paymentMethod,
                paymentReference: claim.paymentReference,
                paymentClaimStatus: 'verified',
                verifiedAt: Timestamp.now(),
                verificationNotes: validatedData.verificationNotes,
                updatedAt: Timestamp.now(),
            });

            await claimDoc.ref.update({
                status: 'verified',
                verifiedAt: Timestamp.now(),
                verifiedBy: userId,
                actualAmount: paidAmount,
                verificationNotes: validatedData.verificationNotes,
                updatedAt: Timestamp.now(),
            });

            // Send confirmation email to client
            await sendEmail({
                to: invoice.clientEmail,
                templateId: process.env.SENDGRID_TEMPLATE_PAYMENT_CONFIRMED!,
                dynamicTemplateData: {
                    clientName: invoice.clientName,
                    invoiceNumber: invoice.reference,
                    amount: paidAmount.toFixed(2),
                    paymentDate: claim.paymentDate.toDate().toLocaleDateString('en-GB'),
                    freelancerName: invoice.freelancerName,
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Payment verified and invoice marked as paid',
            });
        } else {
            // REJECTED - Update claim status
            await claimDoc.ref.update({
                status: 'rejected',
                rejectedAt: Timestamp.now(),
                rejectedBy: userId,
                rejectionReason: validatedData.verificationNotes,
                updatedAt: Timestamp.now(),
            });

            await invoiceDoc.ref.update({
                paymentClaimStatus: 'rejected',
                paymentClaimId: null,
                updatedAt: Timestamp.now(),
            });

            // Notify client
            await sendEmail({
                to: invoice.clientEmail,
                templateId: process.env.SENDGRID_TEMPLATE_PAYMENT_CLAIM_REJECTED!,
                dynamicTemplateData: {
                    clientName: invoice.clientName,
                    invoiceNumber: invoice.reference,
                    amount: claim.amount.toFixed(2),
                    rejectionReason: validatedData.verificationNotes || 'Payment not found in bank account',
                    freelancerEmail: invoice.freelancerEmail,
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Payment claim rejected',
            });
        }
    } catch (error) {
        logError('Error verifying payment claim', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid verification data', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to verify payment claim' },
            { status: 500 }
        );
    }
}

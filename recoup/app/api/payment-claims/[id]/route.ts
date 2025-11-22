import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { logError } from '@/utils/logger';

/**
 * GET /api/payment-claims/[id]
 * Fetch payment claim details (authenticated)
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get payment claim
        const claimDoc = await db.collection(COLLECTIONS.PAYMENT_CLAIMS).doc(id).get();

        if (!claimDoc.exists) {
            return NextResponse.json({ error: 'Payment claim not found' }, { status: 404 });
        }

        const claim = claimDoc.data()!;

        // Verify the user is the freelancer who owns the associated invoice
        const invoiceDoc = await db.collection(COLLECTIONS.INVOICES).doc(claim.invoiceId).get();

        if (!invoiceDoc.exists) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const invoice = invoiceDoc.data()!;

        if (invoice.freelancerId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({
            claimId: id,
            ...claim,
        });
    } catch (error) {
        logError('Error fetching payment claim', error);
        return NextResponse.json(
            { error: 'Failed to fetch payment claim' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { logError } from '@/utils/logger';
import { Parser } from 'json2csv';

/**
 * GET /api/dashboard/export/csv
 * Exports invoice data as CSV for accounting integration
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all invoices for user
        const invoicesQuery = await db
            .collection(COLLECTIONS.INVOICES)
            .where('freelancerId', '==', userId)
            .get();
        const invoices = invoicesQuery.docs.map((doc) => doc.data() as Invoice);

        // Prepare CSV fields
        const fields = [
            'invoiceId', 'clientName', 'invoiceDate', 'dueDate', 'amount', 'paidAmount',
            'outstandingAmount', 'status', 'paidAt', 'createdAt'
        ];
        const opts = { fields };
        const parser = new Parser(opts);

        // Format data for CSV
        const data = invoices.map(inv => ({
            invoiceId: inv.invoiceId,
            clientName: inv.clientName,
            invoiceDate: inv.invoiceDate ? (inv.invoiceDate instanceof Date ? inv.invoiceDate.toISOString() : inv.invoiceDate.toDate().toISOString()) : null,
            dueDate: inv.dueDate ? (inv.dueDate instanceof Date ? inv.dueDate.toISOString() : inv.dueDate.toDate().toISOString()) : null,
            amount: inv.amount,
            paidAmount: inv.status === 'paid' ? inv.amount : 0,
            outstandingAmount: inv.status !== 'paid' ? inv.amount : 0,
            status: inv.status,
            paidAt: inv.paidAt ? (inv.paidAt instanceof Date ? inv.paidAt.toISOString() : inv.paidAt.toDate().toISOString()) : null,
            createdAt: inv.createdAt ? (inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt.toDate().toISOString()) : null,
        }));

        // Generate CSV
        const csv = parser.parse(data);

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="invoices.csv"',
            },
        });
    } catch (error) {
        logError('Failed to export invoices as CSV', error);
        return NextResponse.json({ error: 'Failed to export invoices as CSV' }, { status: 500 });
    }
}

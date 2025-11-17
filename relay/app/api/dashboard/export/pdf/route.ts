import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { logError } from '@/utils/logger';
import PDFDocument from 'pdfkit';
import stream from 'stream';

/**
 * GET /api/dashboard/export/pdf
 * Exports financial summary report as PDF
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

        // Calculate key metrics
        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalCollected = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
        const outstanding = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);
        const overdue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

        // Create PDF document
        const doc = new PDFDocument();
        const passThrough = new stream.PassThrough();
        doc.pipe(passThrough);

        doc.fontSize(18).text('FINANCIAL SUMMARY REPORT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString('en-GB')}`);
        doc.moveDown();
        doc.text(`Total Invoiced: £${totalInvoiced.toFixed(2)}`);
        doc.text(`Total Collected: £${totalCollected.toFixed(2)}`);
        doc.text(`Outstanding: £${outstanding.toFixed(2)}`);
        doc.text(`Overdue: £${overdue.toFixed(2)}`);
        doc.moveDown();
        doc.text('Breakdown by Client:');
        doc.moveDown();

        // Group by client
        const clients = {};
        invoices.forEach(inv => {
            if (!clients[inv.clientName]) clients[inv.clientName] = { invoiced: 0, paid: 0, outstanding: 0 };
            clients[inv.clientName].invoiced += inv.amount;
            if (inv.status === 'paid') clients[inv.clientName].paid += inv.amount;
            if (inv.status !== 'paid') clients[inv.clientName].outstanding += inv.amount;
        });
        Object.entries(clients).forEach(([name, data]) => {
            doc.text(`${name}: Invoiced £${data.invoiced.toFixed(2)}, Paid £${data.paid.toFixed(2)}, Outstanding £${data.outstanding.toFixed(2)}`);
        });

        doc.end();

        return new NextResponse(passThrough, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="financial-summary.pdf"',
            },
        });
    } catch (error) {
        logError('Failed to export financial summary as PDF', error);
        return NextResponse.json({ error: 'Failed to export financial summary as PDF' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { logError, logInfo } from '@/utils/logger';
import { Parser } from 'json2csv';
import { measurePerformance } from '@/lib/performance';

/**
 * GET /api/dashboard/export/csv
 * Exports invoice data as CSV for accounting integration
 * OPTIMIZED: Uses streaming for large datasets
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        logInfo('Starting CSV export', { userId });

        // Fetch all invoices for user
        const invoicesQuery = await measurePerformance(
            'csv_export_fetch',
            async () =>
                await db
                    .collection(COLLECTIONS.INVOICES)
                    .where('freelancerId', '==', userId)
                    .get()
        );

        const invoices = invoicesQuery.docs.map((doc) => doc.data() as Invoice);

        logInfo(`Exporting ${invoices.length} invoices to CSV`);

        // OPTIMIZATION: Use streaming for large datasets
        if (invoices.length > 1000) {
            return streamCsvExport(userId, invoices);
        }

        // For smaller datasets, use traditional approach
        const csv = await generateCsvSync(invoices);

        const duration = Date.now() - startTime;
        logInfo('CSV export completed', { userId, count: invoices.length, duration });

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`,
                'X-Export-Count': invoices.length.toString(),
                'X-Export-Duration': duration.toString(),
            },
        });
    } catch (error) {
        logError('Failed to export invoices as CSV', error);
        return NextResponse.json({ error: 'Failed to export invoices as CSV' }, { status: 500 });
    }
}

/**
 * Generate CSV synchronously (for small datasets)
 */
function generateCsvSync(invoices: Invoice[]): string {
    const fields = [
        { label: 'Invoice ID', value: 'invoiceId' },
        { label: 'Reference', value: 'reference' },
        { label: 'Client Name', value: 'clientName' },
        { label: 'Client Email', value: 'clientEmail' },
        { label: 'Invoice Date', value: 'invoiceDate' },
        { label: 'Due Date', value: 'dueDate' },
        { label: 'Amount', value: 'amount' },
        { label: 'Paid Amount', value: 'paidAmount' },
        { label: 'Outstanding Amount', value: 'outstandingAmount' },
        { label: 'Status', value: 'status' },
        { label: 'Paid At', value: 'paidAt' },
        { label: 'Payment Methods', value: 'paymentMethods' },
        { label: 'Collections Enabled', value: 'collectionsEnabled' },
        { label: 'Escalation Level', value: 'escalationLevel' },
        { label: 'Internal Notes', value: 'internalNotes' },
        { label: 'Created At', value: 'createdAt' },
    ];

    const parser = new Parser({ fields });

    const data = invoices.map((inv) => ({
        invoiceId: inv.invoiceId,
        reference: inv.reference,
        clientName: inv.clientName,
        clientEmail: inv.clientEmail,
        invoiceDate: inv.invoiceDate?.toDate().toISOString().split('T')[0] || '',
        dueDate: inv.dueDate?.toDate().toISOString().split('T')[0] || '',
        amount: inv.amount,
        paidAmount: inv.status === 'paid' ? inv.amount : 0,
        outstandingAmount: inv.status !== 'paid' ? inv.amount : 0,
        status: inv.status,
        paidAt: inv.paidAt?.toDate().toISOString() || '',
        paymentMethods: inv.paymentMethods?.join(', ') || '',
        collectionsEnabled: inv.collectionsEnabled ? 'Yes' : 'No',
        escalationLevel: inv.escalationLevel || '',
        internalNotes: inv.internalNotes || '',
        createdAt: inv.createdAt?.toDate().toISOString() || '',
    }));

    return parser.parse(data);
}

/**
 * Stream CSV export for large datasets
 * OPTIMIZATION: Processes invoices in chunks to reduce memory usage
 */
async function streamCsvExport(userId: string, invoices: Invoice[]): Promise<NextResponse> {
    const CHUNK_SIZE = 100;

    // Create readable stream
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Write CSV header
                const header = [
                    'Invoice ID',
                    'Reference',
                    'Client Name',
                    'Client Email',
                    'Invoice Date',
                    'Due Date',
                    'Amount',
                    'Paid Amount',
                    'Outstanding Amount',
                    'Status',
                    'Paid At',
                    'Payment Methods',
                    'Collections Enabled',
                    'Escalation Level',
                    'Internal Notes',
                    'Created At',
                ].join(',');

                controller.enqueue(new TextEncoder().encode(header + '\n'));

                // Process invoices in chunks
                for (let i = 0; i < invoices.length; i += CHUNK_SIZE) {
                    const chunk = invoices.slice(i, i + CHUNK_SIZE);

                    for (const inv of chunk) {
                        const row = [
                            escapeCSV(inv.invoiceId),
                            escapeCSV(inv.reference),
                            escapeCSV(inv.clientName),
                            escapeCSV(inv.clientEmail),
                            inv.invoiceDate?.toDate().toISOString().split('T')[0] || '',
                            inv.dueDate?.toDate().toISOString().split('T')[0] || '',
                            inv.amount.toString(),
                            (inv.status === 'paid' ? inv.amount : 0).toString(),
                            (inv.status !== 'paid' ? inv.amount : 0).toString(),
                            inv.status,
                            inv.paidAt?.toDate().toISOString() || '',
                            escapeCSV(inv.paymentMethods?.join(', ') || ''),
                            inv.collectionsEnabled ? 'Yes' : 'No',
                            inv.escalationLevel || '',
                            escapeCSV(inv.internalNotes || ''),
                            inv.createdAt?.toDate().toISOString() || '',
                        ].join(',');

                        controller.enqueue(new TextEncoder().encode(row + '\n'));
                    }

                    // Allow other operations to process
                    await new Promise((resolve) => setTimeout(resolve, 0));
                }

                controller.close();
                logInfo('CSV stream export completed', { userId, count: invoices.length });
            } catch (error) {
                controller.error(error);
                logError('CSV stream export failed', error);
            }
        },
    });

    return new NextResponse(stream, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`,
            'X-Export-Count': invoices.length.toString(),
            'Transfer-Encoding': 'chunked',
        },
    });
}

/**
 * Escape CSV values
 */
function escapeCSV(value: string): string {
    if (!value) return '';

    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
}


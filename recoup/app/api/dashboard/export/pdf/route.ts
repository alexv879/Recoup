import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { logError } from '@/utils/logger';
import { trackEvent } from '@/lib/analytics';
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

        // Create PDF document with accessibility metadata
        const doc = new PDFDocument({
            info: {
                Title: 'Financial Summary Report',
                Subject: 'Invoice and Payment Tracking Summary',
                Author: 'Recoup',
                Keywords: 'invoice, financial, summary, PDF/UA, accessibility',
                Creator: 'Recoup'
            },
            // Enable accessibility features
            tagged: true,
            displayTitle: true
        });
        // Ensure document language for PDF/UA
        (doc as any).info.Language = 'en-GB';
        const chunks: Buffer[] = [];
        const passThrough = new stream.PassThrough();
        passThrough.on('data', (chunk) => chunks.push(chunk));
        doc.pipe(passThrough);

        // Add accessibility structure using text with proper hierarchy
        doc.fontSize(18).text('FINANCIAL SUMMARY REPORT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString('en-GB')}`);
        doc.moveDown();

        // Financial Overview section
        doc.fontSize(14).text('Financial Overview');
        doc.moveDown();
        doc.fontSize(12).text(`Total Invoiced: £${totalInvoiced.toFixed(2)}`);
        doc.text(`Total Collected: £${totalCollected.toFixed(2)}`);
        doc.text(`Outstanding: £${outstanding.toFixed(2)}`);
        doc.text(`Overdue: £${overdue.toFixed(2)}`);
        doc.moveDown();

        // Breakdown by Client section
        doc.fontSize(14).text('Breakdown by Client');
        doc.moveDown();

        doc.end();

        // Wait for PDF generation to complete
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('PDF generation timeout after 30 seconds'));
            }, 30000);

            passThrough.on('end', () => {
                clearTimeout(timeout);
                resolve();
            });

            passThrough.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });

        const pdfBuffer = Buffer.concat(chunks);

        // Track PDF export event (server-side)
        try {
            trackEvent('pdf_exported', {
                invoice_count: invoices.length,
                total_invoiced: totalInvoiced,
            });
        } catch (error) {
            // Analytics might not be enabled in this environment; fail silently
            logError('Failed to track pdf_exported event', error as Error);
        }

        return new NextResponse(pdfBuffer, {
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

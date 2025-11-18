/**
 * Invoice Email History API
 * 
 * GET /api/invoices/[id]/email-history
 * 
 * Retrieves the history of all reminder emails sent for a specific invoice
 * 
 * Returns array of email events with:
 * - level (day5/day15/day30)
 * - sentAt timestamp
 * - deliveryStatus (queued/sent/delivered/bounced/failed)
 * - metadata (recipient, amount, days overdue, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getInvoiceEmailHistory } from '@/jobs/emailSequenceWorker';
import { firestore } from '@/lib/firebase';
import { logger, logError } from '@/utils/logger';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    let invoiceId: string | undefined;

    try {
        // Authenticate user
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        invoiceId = id;

        // Verify invoice belongs to user
        const invoiceDoc = await firestore.collection('invoices').doc(invoiceId).get();

        if (!invoiceDoc.exists) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        const invoice = invoiceDoc.data()!;

        if (invoice.userId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get email history
        const emailHistory = await getInvoiceEmailHistory(invoiceId);

        // Format response
        const formattedHistory = emailHistory.map(event => ({
            id: event.id,
            level: event.level,
            sentAt: event.sentAt,
            deliveryStatus: event.deliveryStatus,
            sendgridMessageId: event.sendgridMessageId,
            error: event.error,
            metadata: event.metadata,
        }));

        return NextResponse.json({
            invoiceId,
            emailHistory: formattedHistory,
            total: formattedHistory.length,
        });
    } catch (error) {
        logError('Failed to fetch email history', {
            invoiceId: invoiceId || 'unknown',
            error: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

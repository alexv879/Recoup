import { NextResponse } from 'next/server';
import { InvoiceUpdateSchema } from '../../../../lib/validations';
import { handleError, UnauthorizedError, NotFoundError, ForbiddenError } from '../../../../utils/error';
import { logger } from '../../../../utils/logger';

/*
import { db } from '../../../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';
*/

// Mock authentication
const getAuthUserId = (): string | null => 'user_2aXf...mock';

/**
 * GET /api/invoices/[id]
 * Retrieves a single invoice.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = getAuthUserId();
        if (!userId) throw new UnauthorizedError();

        logger.info(`[DB] Fetching invoice ${id} for user ${userId}`);
        /*
        const invoiceDoc = await db.collection('invoices').doc(params.id).get();
        if (!invoiceDoc.exists) {
          throw new NotFoundError('Invoice not found.');
        }
        const invoice = invoiceDoc.data();
        if (invoice.freelancerId !== userId) {
          throw new ForbiddenError('You do not have permission to view this invoice.');
        }
        return NextResponse.json(invoice);
        */

        // Placeholder response
        return NextResponse.json({ id: id, message: `Details for invoice ${id}` });
    } catch (error) {
        const { status, body } = await handleError(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * PUT /api/invoices/[id]
 * Updates an existing invoice.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = getAuthUserId();
        if (!userId) throw new UnauthorizedError();

        const body = await req.json();
        const validatedData = InvoiceUpdateSchema.parse(body);

        logger.info({ userId, invoiceId: id }, `Updating invoice`);
        /*
        const invoiceRef = db.collection('invoices').doc(params.id);
        // Check for ownership before updating
        await invoiceRef.update({ ...validatedData, updatedAt: Timestamp.now() });
        */

        return NextResponse.json({ id: id, ...validatedData });
    } catch (error) {
        const { status, body } = await handleError(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * DELETE /api/invoices/[id]
 * Deletes an invoice.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = getAuthUserId();
        if (!userId) throw new UnauthorizedError();

        logger.warn({ userId, invoiceId: id }, `Deleting invoice`);
        /*
        const invoiceRef = db.collection('invoices').doc(params.id);
        // Check for ownership before deleting
        await invoiceRef.delete();
        */

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        const { status, body } = await handleError(error);
        return NextResponse.json(body, { status });
    }
}
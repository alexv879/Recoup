import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { InvoiceUpdateSchema } from '../../../../lib/validations';
import { handleError, UnauthorizedError, NotFoundError, ForbiddenError } from '../../../../utils/error';
import { logger } from '../../../../utils/logger';
import { db } from '../../../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/invoices/[id]
 * Retrieves a single invoice.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        // ✅ SECURITY FIX: Real Clerk authentication
        const { userId } = await auth();
        if (!userId) {
            throw new UnauthorizedError('You must be logged in to view invoices.');
        }

        logger.info(`[DB] Fetching invoice ${id} for user ${userId}`);

        const invoiceDoc = await db.collection('invoices').doc(id).get();
        if (!invoiceDoc.exists) {
            throw new NotFoundError('Invoice not found.');
        }

        const invoice = invoiceDoc.data();
        if (invoice?.freelancerId !== userId) {
            throw new ForbiddenError('You do not have permission to view this invoice.');
        }

        return NextResponse.json({ id: invoiceDoc.id, ...invoice });
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
        // ✅ SECURITY FIX: Real Clerk authentication
        const { userId } = await auth();
        if (!userId) {
            throw new UnauthorizedError('You must be logged in to update invoices.');
        }

        const body = await req.json();
        const validatedData = InvoiceUpdateSchema.parse(body);

        logger.info({ userId, invoiceId: id }, `Updating invoice`);

        // Check for ownership before updating
        const invoiceRef = db.collection('invoices').doc(id);
        const invoiceDoc = await invoiceRef.get();

        if (!invoiceDoc.exists) {
            throw new NotFoundError('Invoice not found.');
        }

        const invoice = invoiceDoc.data();
        if (invoice?.freelancerId !== userId) {
            throw new ForbiddenError('You do not have permission to update this invoice.');
        }

        await invoiceRef.update({ ...validatedData, updatedAt: Timestamp.now() });

        return NextResponse.json({ id, ...validatedData });
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
        // ✅ SECURITY FIX: Real Clerk authentication
        const { userId } = await auth();
        if (!userId) {
            throw new UnauthorizedError('You must be logged in to delete invoices.');
        }

        logger.warn({ userId, invoiceId: id }, `Deleting invoice`);

        // Check for ownership before deleting
        const invoiceRef = db.collection('invoices').doc(id);
        const invoiceDoc = await invoiceRef.get();

        if (!invoiceDoc.exists) {
            throw new NotFoundError('Invoice not found.');
        }

        const invoice = invoiceDoc.data();
        if (invoice?.freelancerId !== userId) {
            throw new ForbiddenError('You do not have permission to delete this invoice.');
        }

        await invoiceRef.delete();

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        const { status, body } = await handleError(error);
        return NextResponse.json(body, { status });
    }
}
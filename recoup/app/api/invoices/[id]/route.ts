import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '../../../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { InvoiceUpdateSchema } from '../../../../lib/validations';
import { handleError, UnauthorizedError, NotFoundError, ForbiddenError } from '../../../../utils/error';
import { logger } from '../../../../utils/logger';

/**
 * GET /api/invoices/[id]
 * Retrieves a single invoice.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logger.info(`[DB] Fetching invoice ${id} for user ${userId}`);

    const invoiceDoc = await db.collection(COLLECTIONS.INVOICES).doc(id).get();

    if (!invoiceDoc.exists) {
      throw new NotFoundError('Invoice not found.');
    }

    const invoice = invoiceDoc.data();

    // Verify ownership
    if (invoice?.freelancerId !== userId) {
      throw new ForbiddenError('You do not have permission to view this invoice.');
    }

    return NextResponse.json({
      invoiceId: invoiceDoc.id,
      ...invoice,
    });
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
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    const body = await req.json();
    const validatedData = InvoiceUpdateSchema.parse(body);

    logger.info({ userId, invoiceId: id }, `Updating invoice`);

    // Check ownership before updating
    const invoiceRef = db.collection(COLLECTIONS.INVOICES).doc(id);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      throw new NotFoundError('Invoice not found.');
    }

    const invoice = invoiceDoc.data();
    if (invoice?.freelancerId !== userId) {
      throw new ForbiddenError('You do not have permission to update this invoice.');
    }

    // Update invoice
    await invoiceRef.update({
      ...validatedData,
      updatedAt: Timestamp.now(),
    });

    // Fetch updated invoice
    const updatedDoc = await invoiceRef.get();

    return NextResponse.json({
      invoiceId: id,
      ...updatedDoc.data(),
    });
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
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    logger.warn({ userId, invoiceId: id }, `Deleting invoice`);

    // Check ownership before deleting
    const invoiceRef = db.collection(COLLECTIONS.INVOICES).doc(id);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      throw new NotFoundError('Invoice not found.');
    }

    const invoice = invoiceDoc.data();
    if (invoice?.freelancerId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this invoice.');
    }

    // Delete invoice
    await invoiceRef.delete();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const { status, body} = await handleError(error);
    return NextResponse.json(body, { status });
  }
}

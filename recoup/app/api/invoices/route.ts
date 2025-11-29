import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS } from '../../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
import { InvoiceCreateSchema } from '../../../lib/validations';
import { handleError, UnauthorizedError } from '../../../utils/error';
import { logger } from '../../../utils/logger';
import { Invoice } from '../../../types/models';
import { trackServerEvent } from '../../../lib/analytics-server';

// Generate invoice reference in format: INV-YYYYMM-XXXXX
const generateInvoiceReference = () => {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `INV-${year}${month}-${random}`;
};

/**
 * POST /api/invoices
 * Creates a new draft invoice for the authenticated user.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in to create an invoice.');
    }

    const body = await req.json();

    // Validate request body
    const validatedData = InvoiceCreateSchema.parse(body);

    const reference = generateInvoiceReference();
    const invoiceId = `inv_${nanoid(12)}`;

    // Create invoice object
    const invoice: Omit<Invoice, 'invoiceId'> = {
      reference,
      freelancerId: userId,
      clientId: '', // Will be set when client is linked
      clientName: validatedData.clientName,
      clientEmail: validatedData.clientEmail,
      amount: validatedData.amount,
      currency: validatedData.currency || 'GBP',
      dueDate: Timestamp.fromDate(new Date(validatedData.dueDate)),
      invoiceDate: Timestamp.now(),
      status: 'draft',
      items: [], // Will be populated by frontend
      collectionsEnabled: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Save to Firebase
    await db.collection(COLLECTIONS.INVOICES).doc(invoiceId).set(invoice);

    logger.info({ userId, invoiceId, client: validatedData.clientName }, 'Successfully created draft invoice');

    // Track invoice creation event
    await trackServerEvent(
      'invoice_created',
      {
        invoice_id: invoiceId,
        amount: validatedData.amount,
        has_voice_meta: false,
        client_name: validatedData.clientName,
      },
      userId
    );

    return NextResponse.json({ invoiceId, reference }, { status: 201 });
  } catch (error) {
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * GET /api/invoices
 * Retrieves all invoices for the authenticated user.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in to view invoices.');
    }

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    // Build query
    let query = db.collection(COLLECTIONS.INVOICES).where('freelancerId', '==', userId);

    if (status) {
      query = query.where('status', '==', status);
    }

    // Execute query
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const invoices = snapshot.docs.map((doc) => ({
      invoiceId: doc.id,
      ...doc.data(),
    }));

    logger.info(`[DB] Fetched ${invoices.length} invoices for user ${userId}`);

    return NextResponse.json({ invoices });
  } catch (error) {
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}

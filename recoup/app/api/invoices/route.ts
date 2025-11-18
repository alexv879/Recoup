import { NextResponse } from 'next/server';
import { InvoiceCreateSchema } from '../../../lib/validations';
import { handleError, UnauthorizedError } from '../../../utils/error';
import { logger } from '../../../utils/logger';
import { Invoice } from '../../../types/models';
import { trackServerEvent } from '../../../lib/analytics-server';

/*
import { db } from '../../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
*/

// Mock authentication as per the technical specification's auth helpers
const getAuthUserId = (): string | null => {
    // In a real app, this would come from Clerk/NextAuth: `auth()`
    return 'user_2aXf...mock';
};

// Mock invoice reference generation
const generateInvoiceReference = () => `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;


/**
 * POST /api/invoices
 * Creates a new draft invoice for the authenticated user.
 */
export async function POST(req: Request) {
    try {
        const userId = getAuthUserId();
        if (!userId) {
            throw new UnauthorizedError('You must be logged in to create an invoice.');
        }

        const body = await req.json();

        // Validate request body
        const validatedData = InvoiceCreateSchema.parse(body);

        const reference = generateInvoiceReference();
        const invoiceId = `inv_${Math.random().toString(36).substr(2, 9)}`;

        /*
        const invoice: Omit<Invoice, 'invoiceId'> = {
          reference,
          freelancerId: userId,
          clientName: validatedData.clientName,
          clientEmail: validatedData.clientEmail,
          amount: validatedData.amount,
          currency: 'GBP',
          dueDate: Timestamp.fromDate(new Date(validatedData.dueDate)),
          invoiceDate: Timestamp.now(),
          status: 'draft',
          paymentMethods: validatedData.paymentMethods || ['bank_transfer'],
          collectionsEnabled: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await db.collection('invoices').doc(invoiceId).set(invoice);
        */

        logger.info({ userId, invoiceId, client: validatedData.clientName }, 'Successfully created draft invoice');

        // Track invoice creation event
        await trackServerEvent('invoice_created', {
            invoice_id: invoiceId,
            amount: validatedData.amount,
            has_voice_meta: false, // This would be set if created via voice
            client_name: validatedData.clientName,
        }, userId);

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
        const userId = getAuthUserId();
        if (!userId) {
            throw new UnauthorizedError('You must be logged in to view invoices.');
        }

        /*
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        let query = db.collection('invoices').where('freelancerId', '==', userId);
        if (status) {
          query = query.where('status', '==', status);
        }
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        */

        // Placeholder response
        const invoices: Invoice[] = [];
        logger.info(`[DB] Fetching invoices for user ${userId}`);

        return NextResponse.json({ invoices });
    } catch (error) {
        const { status, body } = await handleError(error);
        return NextResponse.json(body, { status });
    }
}
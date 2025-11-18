/**
 * ADMIN API: Support Tools - Payment Status Override
 * POST /api/admin/support/payment-override - Override invoice/payment status
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, FieldValue } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { requireAdmin, requireAdminPermission, createAdminAuditLog, getRequestMetadata } from '@/middleware/adminAuth';
import { formatErrorResponse, errors } from '@/utils/error';
import { logError } from '@/utils/logger';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin access
    const admin = await requireAdmin();
    await requireAdminPermission(admin.userId, 'payments:override');

    // 2. Get request body
    const body = await req.json();
    const { invoiceId, newStatus, reason, paidAmount } = body;

    if (!invoiceId || !newStatus || !reason) {
      throw errors.badRequest('invoiceId, newStatus, and reason are required');
    }

    // 3. Get current invoice
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();

    if (!invoiceDoc.exists) {
      throw errors.notFound('Invoice not found');
    }

    const currentInvoice = invoiceDoc.data() as Invoice;

    // 4. Build update object
    const updates: Partial<Invoice> = {
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    // If marking as paid, set paidAt timestamp
    if (newStatus === 'paid') {
      updates.paidAt = FieldValue.serverTimestamp() as any;
      if (paidAmount) {
        updates.amount = paidAmount;
      }
    }

    // 5. Update invoice
    await db.collection('invoices').doc(invoiceId).update(updates);

    // 6. Create audit log with detailed reason
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAdminAuditLog('payment_status_overridden', {
      adminUserId: admin.userId,
      adminEmail: admin.email,
      targetUserId: currentInvoice.freelancerId,
      targetResource: 'invoice',
      targetResourceId: invoiceId,
      changes: [
        {
          field: 'status',
          oldValue: currentInvoice.status,
          newValue: newStatus,
        },
      ],
      reason,
      ipAddress,
      userAgent,
    });

    // 7. Return updated invoice
    const updatedInvoice = await db.collection('invoices').doc(invoiceId).get();

    return NextResponse.json({
      success: true,
      data: {
        invoice: {
          invoiceId: updatedInvoice.id,
          ...updatedInvoice.data(),
        },
        message: `Invoice status updated from ${currentInvoice.status} to ${newStatus}`,
      },
    });
  } catch (error) {
    logError('Error overriding payment status', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

/**
 * Recurring Invoice API - Single Resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getRecurringInvoice,
  updateRecurringInvoice,
  pauseRecurringInvoice,
  resumeRecurringInvoice,
  cancelRecurringInvoice,
  getRecurringInvoiceHistory,
} from '@/lib/recurring-invoices';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/recurring-invoices/[id]
 * Get a specific recurring invoice
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const recurringInvoice = await getRecurringInvoice(id);

    if (!recurringInvoice) {
      return NextResponse.json(
        { error: 'Recurring invoice not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (recurringInvoice.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ recurringInvoice });
  } catch (error: any) {
    console.error('Get recurring invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recurring invoice' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/recurring-invoices/[id]
 * Update a recurring invoice
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const recurringInvoice = await getRecurringInvoice(id);

    if (!recurringInvoice) {
      return NextResponse.json(
        { error: 'Recurring invoice not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (recurringInvoice.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const updates = await request.json();

    // Recalculate totals if line items changed
    if (updates.lineItems) {
      let subtotal = 0;
      updates.lineItems.forEach((item: any) => {
        item.amount = item.quantity * item.unitPrice;
        subtotal += item.amount;
      });

      const vatRate = updates.vatRate || recurringInvoice.vatRate;
      const vatAmount = Math.round((subtotal * vatRate) / 100);
      const total = subtotal + vatAmount;

      updates.subtotal = subtotal;
      updates.vatAmount = vatAmount;
      updates.total = total;
    }

    await updateRecurringInvoice(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Recurring invoice updated successfully',
    });
  } catch (error: any) {
    console.error('Update recurring invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update recurring invoice' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recurring-invoices/[id]
 * Cancel a recurring invoice
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const recurringInvoice = await getRecurringInvoice(id);

    if (!recurringInvoice) {
      return NextResponse.json(
        { error: 'Recurring invoice not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (recurringInvoice.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await cancelRecurringInvoice(id);

    return NextResponse.json({
      success: true,
      message: 'Recurring invoice cancelled successfully',
    });
  } catch (error: any) {
    console.error('Cancel recurring invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel recurring invoice' },
      { status: 500 }
    );
  }
}

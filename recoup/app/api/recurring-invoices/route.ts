/**
 * Recurring Invoices API - List and Create
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createRecurringInvoice,
  getUserRecurringInvoices,
  validateRecurringInvoice,
  RecurringInvoiceStatus,
  RecurrenceFrequency,
  calculateNextInvoiceDate,
} from '@/lib/recurring-invoices';
import type { RecurringInvoice } from '@/lib/recurring-invoices';

/**
 * GET /api/recurring-invoices
 * Get all recurring invoices for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as RecurringInvoiceStatus | null;

    const recurringInvoices = await getUserRecurringInvoices(userId, status || undefined);

    return NextResponse.json({
      recurringInvoices,
      count: recurringInvoices.length,
    });
  } catch (error: any) {
    console.error('Get recurring invoices error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recurring invoices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recurring-invoices
 * Create a new recurring invoice
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Calculate totals from line items
    let subtotal = 0;
    if (body.lineItems && Array.isArray(body.lineItems)) {
      body.lineItems.forEach((item: any) => {
        item.amount = item.quantity * item.unitPrice;
        subtotal += item.amount;
      });
    }

    const vatRate = body.vatRate || 20; // Default to 20% UK VAT
    const vatAmount = Math.round((subtotal * vatRate) / 100);
    const total = subtotal + vatAmount;

    // Calculate next invoice date
    const nextInvoiceDate = body.nextInvoiceDate || body.startDate;

    const recurringInvoiceData: Omit<RecurringInvoice, 'id' | 'createdAt' | 'updatedAt' | 'generatedInvoiceIds' | 'totalInvoicesGenerated'> = {
      userId,
      clientId: body.clientId,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      description: body.description,
      lineItems: body.lineItems,
      subtotal,
      vatRate,
      vatAmount,
      total,
      frequency: body.frequency as RecurrenceFrequency,
      startDate: body.startDate,
      endDate: body.endDate || undefined,
      nextInvoiceDate,
      paymentTermsDays: body.paymentTermsDays || 30,
      status: RecurringInvoiceStatus.ACTIVE,
    };

    // Validate data
    const errors = validateRecurringInvoice(recurringInvoiceData);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    const id = await createRecurringInvoice(recurringInvoiceData);

    return NextResponse.json({
      success: true,
      id,
      message: 'Recurring invoice created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create recurring invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create recurring invoice' },
      { status: 500 }
    );
  }
}

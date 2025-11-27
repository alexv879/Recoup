/**
 * Convert Expenses to Invoice API
 * POST /api/expenses/convert-to-invoice
 * Converts one or more billable expenses into an invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';
import type { Expense, Invoice } from '@/types/models';

/**
 * POST /api/expenses/convert-to-invoice
 * Create invoice from selected expenses
 *
 * Body:
 * {
 *   expenseIds: string[];
 *   clientId: string;
 *   dueDate: string; // ISO date
 *   notes?: string;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { expenseIds, clientId, dueDate, notes } = body;

    // Validation
    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return NextResponse.json(
        { error: 'No expenses selected' },
        { status: 400 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        { error: 'Due date is required' },
        { status: 400 }
      );
    }

    // Fetch all selected expenses
    const expenses: (Expense & { expenseId: string })[] = [];
    for (const expenseId of expenseIds) {
      const expenseDoc = await db
        .collection(COLLECTIONS.EXPENSES)
        .doc(expenseId)
        .get();

      if (!expenseDoc.exists) {
        return NextResponse.json(
          { error: `Expense ${expenseId} not found` },
          { status: 404 }
        );
      }

      const expense = expenseDoc.data() as Expense;

      // Verify ownership
      if (expense.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Verify expense is billable and unbilled
      if (!expense.billable) {
        return NextResponse.json(
          { error: `Expense ${expenseId} is not marked as billable` },
          { status: 400 }
        );
      }

      if (expense.billingStatus !== 'unbilled') {
        return NextResponse.json(
          { error: `Expense ${expenseId} has already been billed` },
          { status: 400 }
        );
      }

      expenses.push({ ...expense, expenseId: expenseDoc.id });
    }

    // Get client details
    const clientDoc = await db.collection(COLLECTIONS.CLIENTS).doc(clientId).get();

    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const client = clientDoc.data();

    // Verify client ownership
    if (client?.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Client does not belong to you' },
        { status: 403 }
      );
    }

    // Create invoice line items from expenses
    const lineItems = expenses.map((expense) => ({
      description: `${getCategoryLabel(expense.category)}: ${expense.description}${
        expense.merchant ? ` (${expense.merchant})` : ''
      }`,
      quantity: 1,
      rate: expense.amount,
      amount: expense.amount,
    }));

    // Calculate total
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Generate invoice reference
    const invoiceCount = await getInvoiceCount(userId);
    const reference = `INV-${String(invoiceCount + 1).padStart(5, '0')}`;

    // Create invoice
    const invoiceData: Partial<Invoice> = {
      freelancerId: userId,
      clientId,
      clientName: client.name,
      clientEmail: client.email,
      reference,
      amount: totalAmount,
      currency: expenses[0].currency || 'GBP',
      status: 'draft',
      items: lineItems,
      invoiceDate: Timestamp.now(),
      dueDate: Timestamp.fromDate(new Date(dueDate)),
      collectionsEnabled: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const invoiceRef = await db.collection(COLLECTIONS.INVOICES).add(invoiceData);
    const invoiceId = invoiceRef.id;

    // Update all expenses to mark as invoiced
    const batch = db.batch();
    for (const expense of expenses) {
      const expenseRef = db.collection(COLLECTIONS.EXPENSES).doc(expense.expenseId);
      batch.update(expenseRef, {
        billingStatus: 'invoiced',
        invoiceId,
        invoicedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    await batch.commit();

    console.log('Expenses converted to invoice:', {
      userId,
      invoiceId,
      expenseCount: expenses.length,
      totalAmount: totalAmount / 100,
    });

    return NextResponse.json({
      success: true,
      invoiceId,
      expenseCount: expenses.length,
      totalAmount: totalAmount / 100,
      message: 'Invoice created successfully from expenses',
    });
  } catch (error: any) {
    console.error('Expense to invoice conversion failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert expenses to invoice' },
      { status: 500 }
    );
  }
}

/**
 * Get user's invoice count (for generating reference numbers)
 */
async function getInvoiceCount(userId: string): Promise<number> {
  const invoicesSnapshot = await db
    .collection(COLLECTIONS.INVOICES)
    .where('freelancerId', '==', userId)
    .get();

  return invoicesSnapshot.size;
}

/**
 * Get human-readable category label
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    travel: 'Travel',
    office: 'Office Supplies',
    marketing: 'Marketing',
    professional: 'Professional Services',
    training: 'Training',
    utilities: 'Utilities',
    vehicle: 'Vehicle',
    mileage: 'Mileage',
    subsistence: 'Meals & Subsistence',
    client_entertainment: 'Client Entertainment',
    premises: 'Premises',
    financial: 'Financial Costs',
    other: 'Other',
  };

  return labels[category] || category;
}

/**
 * Individual Expense API Endpoints
 * GET /api/expenses/[id] - Get single expense
 * PUT /api/expenses/[id] - Update expense
 * DELETE /api/expenses/[id] - Delete expense (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';

/**
 * GET /api/expenses/[id]
 * Get a single expense
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenseDoc = await db
      .collection(COLLECTIONS.EXPENSES)
      .doc(params.id)
      .get();

    if (!expenseDoc.exists) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const expense = expenseDoc.data();

    // Verify ownership
    if (expense?.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      expenseId: expenseDoc.id,
      ...expense,
    });
  } catch (error: any) {
    console.error('Expense fetch failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/expenses/[id]
 * Update an expense
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const expenseRef = db.collection(COLLECTIONS.EXPENSES).doc(params.id);
    const expenseDoc = await expenseRef.get();

    if (!expenseDoc.exists) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const expense = expenseDoc.data();

    // Verify ownership
    if (expense?.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare update data
    const updates: any = {
      ...body,
      updatedAt: Timestamp.now(),
      lastModifiedBy: userId,
    };

    // Don't allow changing these fields
    delete updates.expenseId;
    delete updates.userId;
    delete updates.createdAt;
    delete updates.createdBy;

    // Handle date conversion if provided
    if (body.date) {
      updates.date = Timestamp.fromDate(new Date(body.date));
    }

    // Update expense
    await expenseRef.update(updates);

    return NextResponse.json({
      success: true,
      message: 'Expense updated successfully',
    });
  } catch (error: any) {
    console.error('Expense update failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update expense' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expenses/[id]
 * Soft delete an expense
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenseRef = db.collection(COLLECTIONS.EXPENSES).doc(params.id);
    const expenseDoc = await expenseRef.get();

    if (!expenseDoc.exists) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const expense = expenseDoc.data();

    // Verify ownership
    if (expense?.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete (mark as deleted, don't actually remove)
    await expenseRef.update({
      status: 'deleted',
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error: any) {
    console.error('Expense deletion failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

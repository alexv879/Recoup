/**
 * Expense API Endpoints
 * POST /api/expenses - Create new expense
 * GET /api/expenses - List expenses (with filtering)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, COLLECTIONS, Timestamp } from '@/lib/firebase';
import { uploadReceiptFile } from '@/lib/firebase-storage';
import { extractReceiptData } from '@/lib/openai-vision-ocr';
import type { Expense } from '@/types/models';

/**
 * POST /api/expenses
 * Create a new expense
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const receiptFile = formData.get('receipt') as File | null;

    // Extract expense data from form
    const expenseData: Partial<Expense> = {
      userId,
      amount: parseInt(formData.get('amount') as string) || 0,
      currency: (formData.get('currency') as any) || 'GBP',
      date: Timestamp.fromDate(new Date(formData.get('date') as string)),
      merchant: formData.get('merchant') as string || '',
      description: formData.get('description') as string || '',
      category: formData.get('category') as any,
      billable: formData.get('billable') === 'true',
      clientId: formData.get('clientId') as string | undefined,
      clientName: formData.get('clientName') as string | undefined,
      taxDeductible: formData.get('taxDeductible') === 'true',
      taxYear: getCurrentTaxYear(),
      capitalAllowance: formData.get('capitalAllowance') === 'true',
      simplifiedExpense: formData.get('simplifiedExpense') === 'true',
      billingStatus: 'unbilled',
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
    };

    // Create expense document
    const expenseRef = await db.collection(COLLECTIONS.EXPENSES).add(expenseData);
    const expenseId = expenseRef.id;

    // Handle receipt upload if provided
    if (receiptFile && receiptFile.size > 0) {
      try {
        const { url, thumbnailUrl, size } = await uploadReceiptFile(
          userId,
          expenseId,
          receiptFile
        );

        // Update expense with receipt URL
        await expenseRef.update({
          receiptUrl: url,
          receiptThumbnailUrl: thumbnailUrl,
          ocrStatus: 'pending',
        });

        // Trigger OCR processing (async - don't wait)
        processReceiptOCR(expenseId, url).catch((error) => {
          console.error('OCR processing failed:', error);
        });
      } catch (uploadError) {
        console.error('Receipt upload failed:', uploadError);
        // Continue without receipt
      }
    }

    return NextResponse.json({
      success: true,
      expenseId,
      message: 'Expense created successfully',
    });
  } catch (error: any) {
    console.error('Expense creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/expenses
 * List expenses with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const billable = searchParams.get('billable');
    const clientId = searchParams.get('clientId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = db
      .collection(COLLECTIONS.EXPENSES)
      .where('userId', '==', userId);

    if (status) {
      query = query.where('status', '==', status);
    }

    if (billable !== null && billable !== undefined) {
      query = query.where('billable', '==', billable === 'true');
    }

    if (clientId) {
      query = query.where('clientId', '==', clientId);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    // Execute query
    const snapshot = await query
      .orderBy('date', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const expenses = snapshot.docs.map((doc) => ({
      expenseId: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      expenses,
      total: expenses.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Expense fetch failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

/**
 * Background OCR processing
 */
async function processReceiptOCR(expenseId: string, receiptUrl: string) {
  try {
    // Update status to processing
    await db.collection(COLLECTIONS.EXPENSES).doc(expenseId).update({
      ocrStatus: 'processing',
    });

    // Extract data using OpenAI Vision
    const ocrData = await extractReceiptData(receiptUrl);

    // Prepare update object
    const updates: any = {
      ocrStatus: 'completed',
      ocrData,
      updatedAt: Timestamp.now(),
    };

    // Auto-fill fields if they're empty/default
    const expenseDoc = await db
      .collection(COLLECTIONS.EXPENSES)
      .doc(expenseId)
      .get();
    const expense = expenseDoc.data();

    if (ocrData.merchant && (!expense?.merchant || expense.merchant === '')) {
      updates.merchant = ocrData.merchant;
    }

    if (ocrData.amount && expense?.amount === 0) {
      updates.amount = ocrData.amount;
    }

    if (ocrData.category && expense?.category === 'other') {
      updates.category = ocrData.category;
    }

    if (ocrData.date) {
      try {
        const parsedDate = new Date(ocrData.date);
        if (!isNaN(parsedDate.getTime())) {
          updates.date = Timestamp.fromDate(parsedDate);
        }
      } catch {
        // Ignore date parsing errors
      }
    }

    // Update expense with OCR results
    await db.collection(COLLECTIONS.EXPENSES).doc(expenseId).update(updates);

    console.log('OCR completed for expense:', expenseId);
  } catch (error) {
    console.error('OCR failed for expense:', expenseId, error);
    await db.collection(COLLECTIONS.EXPENSES).doc(expenseId).update({
      ocrStatus: 'failed',
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Get current UK tax year (e.g., "2025-26")
 */
function getCurrentTaxYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // UK tax year starts April 6
  if (month < 3) {
    // Jan-Mar: previous tax year
    return `${year - 1}-${String(year).slice(2)}`;
  } else {
    // Apr-Dec: current tax year
    return `${year}-${String(year + 1).slice(2)}`;
  }
}

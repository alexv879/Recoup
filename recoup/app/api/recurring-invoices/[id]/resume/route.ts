/**
 * Resume Recurring Invoice API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRecurringInvoice, resumeRecurringInvoice } from '@/lib/recurring-invoices';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
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

    await resumeRecurringInvoice(id);

    return NextResponse.json({
      success: true,
      message: 'Recurring invoice resumed successfully',
    });
  } catch (error: any) {
    console.error('Resume recurring invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resume recurring invoice' },
      { status: 500 }
    );
  }
}

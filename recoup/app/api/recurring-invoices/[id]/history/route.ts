/**
 * Recurring Invoice History API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRecurringInvoice, getRecurringInvoiceHistory } from '@/lib/recurring-invoices';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

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

    const history = await getRecurringInvoiceHistory(id);

    return NextResponse.json({
      history,
      count: history.length,
    });
  } catch (error: any) {
    console.error('Get recurring invoice history error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recurring invoice history' },
      { status: 500 }
    );
  }
}

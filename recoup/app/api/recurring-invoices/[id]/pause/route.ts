/**
 * Pause Recurring Invoice API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRecurringInvoice, pauseRecurringInvoice } from '@/lib/recurring-invoices';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
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

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || undefined;

    await pauseRecurringInvoice(id, reason);

    return NextResponse.json({
      success: true,
      message: 'Recurring invoice paused successfully',
    });
  } catch (error: any) {
    console.error('Pause recurring invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to pause recurring invoice' },
      { status: 500 }
    );
  }
}

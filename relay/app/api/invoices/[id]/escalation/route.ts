/**
 * Get Escalation State and Timeline for Invoice
 * GET /api/invoices/[id]/escalation
 * 
 * Returns:
 * - Current escalation level
 * - Pause status
 * - Complete timeline of escalation events
 * - Next escalation due date
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { getEscalationState, getEscalationTimeline } from '@/jobs/collectionsEscalator';
import { errors } from '@/utils/error';
import { logApiRequest, logApiResponse, logError } from '@/utils/logger';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const { id } = await params;
    const startTime = Date.now();

    try {
        // 1. Authenticate
        const { userId } = await auth();
        if (!userId) {
            throw errors.unauthorized();
        }

        logApiRequest('GET', `/api/invoices/${id}/escalation`, userId);

        // 2. Get invoice and verify ownership
        const invoiceDoc = await db.collection('invoices').doc(id).get();
        if (!invoiceDoc.exists) {
            throw errors.notFound('Invoice not found');
        }

        const invoice = invoiceDoc.data() as Invoice;
        if (invoice.freelancerId !== userId) {
            throw errors.forbidden('Not authorized to access this invoice');
        }

        // 3. Get escalation state
        const state = await getEscalationState(id);

        // 4. Get timeline events
        const timeline = await getEscalationTimeline(id);

        // 5. Calculate days overdue
        const now = Date.now();
        const daysOverdue = Math.floor(
            (now - invoice.dueDate.toMillis()) / (1000 * 60 * 60 * 24)
        );

        const duration = Date.now() - startTime;
        logApiResponse('GET', `/api/invoices/${id}/escalation`, 200, duration, userId);

        return NextResponse.json({
            escalationState: state
                ? {
                    currentLevel: state.currentLevel,
                    isPaused: state.isPaused,
                    pauseReason: state.pauseReason,
                    pausedAt: state.pausedAt?.toISOString(),
                    pauseUntil: state.pauseUntil?.toISOString(),
                    lastEscalatedAt: state.lastEscalatedAt.toISOString(),
                    nextEscalationDue: state.nextEscalationDue?.toISOString(),
                }
                : null,
            timeline: timeline.map((event) => ({
                ...event,
                timestamp: event.timestamp.toISOString(),
            })),
            daysOverdue,
            invoice: {
                reference: invoice.reference,
                amount: invoice.amount,
                dueDate: invoice.dueDate.toDate().toISOString(),
                status: invoice.status,
            },
        });
    } catch (error: any) {
        const duration = Date.now() - startTime;
        logError(`Failed to get escalation state for invoice ${id}`, error);
        logApiResponse('GET', `/api/invoices/${id}/escalation`, error.statusCode || 500, duration);

        return NextResponse.json(
            { error: error.message || 'Failed to get escalation state' },
            { status: error.statusCode || 500 }
        );
    }
}

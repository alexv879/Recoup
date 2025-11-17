/**
 * Pause/Resume Escalation Endpoint
 * POST /api/invoices/[id]/escalation/pause
 * POST /api/invoices/[id]/escalation/resume
 * 
 * Allows users to manually pause or resume collections automation
 * for specific invoices (e.g., when client disputes or requests extension)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase';
import { Invoice } from '@/types/models';
import { pauseEscalation, resumeEscalation } from '@/jobs/collectionsEscalator';
import { errors } from '@/utils/error';
import { logApiRequest, logApiResponse, logError } from '@/utils/logger';
import { track } from '@/lib/analytics';

export async function POST(
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

        const body = await req.json();
        const { action, reason, pauseUntil } = body;

        logApiRequest('POST', `/api/invoices/${id}/escalation/pause`, userId, {
            action,
            reason,
        });

        // 2. Validate action
        if (!['pause', 'resume'].includes(action)) {
            throw errors.badRequest('Invalid action. Must be "pause" or "resume"');
        }

        // 3. Get invoice and verify ownership
        const invoiceDoc = await db.collection('invoices').doc(id).get();
        if (!invoiceDoc.exists) {
            throw errors.notFound('Invoice not found');
        }

        const invoice = invoiceDoc.data() as Invoice;
        if (invoice.freelancerId !== userId) {
            throw errors.forbidden('Not authorized to access this invoice');
        }

        // 4. Execute action
        if (action === 'pause') {
            const pauseReasonValue = reason || 'manual';
            const pauseUntilDate = pauseUntil ? new Date(pauseUntil) : undefined;

            await pauseEscalation(id, pauseReasonValue, pauseUntilDate);

            // Track analytics
            await track('escalation_paused', {
                invoice_id: id,
                invoice_reference: invoice.reference,
                reason: pauseReasonValue,
                pause_until: pauseUntilDate?.toISOString(),
                freelancer_id: userId,
            });

            const duration = Date.now() - startTime;
            logApiResponse('POST', `/api/invoices/${id}/escalation/pause`, 200, duration, userId);

            return NextResponse.json({
                success: true,
                message: 'Collections paused successfully',
                pausedUntil: pauseUntilDate?.toISOString(),
            });
        } else {
            const resumeReason = reason || 'Manual resume by user';
            await resumeEscalation(id, resumeReason);

            // Track analytics
            await track('escalation_resumed', {
                invoice_id: id,
                invoice_reference: invoice.reference,
                reason: resumeReason,
                freelancer_id: userId,
            });

            const duration = Date.now() - startTime;
            logApiResponse('POST', `/api/invoices/${id}/escalation/pause`, 200, duration, userId);

            return NextResponse.json({
                success: true,
                message: 'Collections resumed successfully',
            });
        }
    } catch (error: any) {
        const duration = Date.now() - startTime;
        logError(`Failed to ${body?.action} escalation for invoice ${id}`, error);
        logApiResponse('POST', `/api/invoices/${id}/escalation/pause`, error.statusCode || 500, duration);

        return NextResponse.json(
            { error: error.message || 'Failed to update escalation' },
            { status: error.statusCode || 500 }
        );
    }
}

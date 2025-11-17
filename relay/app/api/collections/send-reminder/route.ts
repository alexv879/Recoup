/**
 * Manual Send Reminder API
 * 
 * POST /api/collections/send-reminder
 * 
 * Allows manual triggering of Day 5/15/30 reminder emails from the dashboard
 * 
 * Per MASTER_IMPLEMENTATION_AUDIT_V1.md §4.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendManualReminder } from '@/jobs/emailSequenceWorker';
import { logger } from '@/utils/logger';

interface SendReminderRequest {
    invoiceId: string;
    level: 'day5' | 'day15' | 'day30';
    overrideCheck?: boolean; // Allow resending even if already sent
}

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body: SendReminderRequest = await request.json();

        // Validate required fields
        if (!body.invoiceId) {
            return NextResponse.json(
                { error: 'invoiceId is required' },
                { status: 400 }
            );
        }

        if (!body.level) {
            return NextResponse.json(
                { error: 'level is required' },
                { status: 400 }
            );
        }

        // Validate level
        const validLevels = ['day5', 'day15', 'day30'];
        if (!validLevels.includes(body.level)) {
            return NextResponse.json(
                { error: 'level must be one of: day5, day15, day30' },
                { status: 400 }
            );
        }

        logger.info('Manual reminder send requested', {
            userId,
            invoiceId: body.invoiceId,
            level: body.level,
            override: body.overrideCheck || false,
        });

        // Send the reminder
        const result = await sendManualReminder(
            body.invoiceId,
            body.level,
            body.overrideCheck || false
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to send reminder' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
            message: `${body.level} reminder sent successfully`,
        });
    } catch (error) {
        logger.error('Manual reminder send failed', {
            error: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

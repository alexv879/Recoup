/**
 * Email Template Preview API
 * Returns rendered email templates for preview purposes
 *
 * POST /api/email-preview
 *
 * ⚠️ SECURITY: Requires authentication to prevent unauthorized access to email templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
    previewEmailTemplate,
    validateTemplateVariables,
    type ReminderLevel,
    type EmailTemplateVariables
} from '@/lib/emailTemplateRenderer';

export async function POST(request: NextRequest) {
    try {
        // ✅ SECURITY FIX: Require authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized. Please log in to preview email templates.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { level, variables, invoiceAmountPence } = body;

        // Validate inputs
        if (!level || !['day5', 'day15', 'day30'].includes(level)) {
            return NextResponse.json(
                { error: 'Invalid reminder level' },
                { status: 400 }
            );
        }

        if (!variables || typeof variables !== 'object') {
            return NextResponse.json(
                { error: 'Missing template variables' },
                { status: 400 }
            );
        }

        // Validate required fields
        try {
            validateTemplateVariables(variables as EmailTemplateVariables, level as ReminderLevel);
        } catch (validationError) {
            return NextResponse.json(
                { error: (validationError as Error).message },
                { status: 400 }
            );
        }

        // Generate preview
        const preview = previewEmailTemplate(
            level as ReminderLevel,
            variables as EmailTemplateVariables,
            invoiceAmountPence
        );

        return NextResponse.json(preview);
    } catch (error) {
        console.error('Email preview error:', error);
        return NextResponse.json(
            { error: 'Failed to generate email preview' },
            { status: 500 }
        );
    }
}

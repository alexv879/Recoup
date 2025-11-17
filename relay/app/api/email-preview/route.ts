/**
 * Email Template Preview API
 * Returns rendered email templates for preview purposes
 * 
 * POST /api/email-preview
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    previewEmailTemplate,
    validateTemplateVariables,
    type ReminderLevel,
    type EmailTemplateVariables
} from '@/lib/emailTemplateRenderer';

export async function POST(request: NextRequest) {
    try {
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

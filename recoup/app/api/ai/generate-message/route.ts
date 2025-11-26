/**
 * AI Message Generation API
 *
 * Generates personalized, context-aware collection messages using OpenAI GPT-4
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { extractMessageContext, generateMessage, MessageGenerationOptions } from '@/lib/ai-message-agent';
import { logError, logInfo } from '@/utils/logger';

/**
 * POST /api/ai/generate-message
 *
 * Generate AI-powered personalized message for invoice collection
 *
 * Body:
 * {
 *   invoiceId: string;
 *   messageType: 'email' | 'sms' | 'voice_script' | 'whatsapp';
 *   tone?: 'professional' | 'friendly' | 'firm' | 'urgent';
 *   length?: 'short' | 'medium' | 'long';
 *   includeInvoiceDetails?: boolean;
 *   includePaymentOptions?: boolean;
 *   language?: 'en-GB' | 'en-US';
 *   complianceMode?: 'fca' | 'standard';
 * }
 *
 * Returns:
 * {
 *   subject?: string; // For emails
 *   body: string;
 *   callToAction: string;
 *   metadata: {
 *     tone: string;
 *     wordCount: number;
 *     estimatedReadTime: number;
 *     complianceChecked: boolean;
 *   };
 * }
 */
export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { invoiceId, messageType, tone, length, includeInvoiceDetails, includePaymentOptions, language, complianceMode } = body;

        if (!invoiceId || !messageType) {
            return NextResponse.json(
                { error: 'invoiceId and messageType are required' },
                { status: 400 }
            );
        }

        // Validate messageType
        const validMessageTypes = ['email', 'sms', 'voice_script', 'whatsapp'];
        if (!validMessageTypes.includes(messageType)) {
            return NextResponse.json(
                { error: `messageType must be one of: ${validMessageTypes.join(', ')}` },
                { status: 400 }
            );
        }

        logInfo('AI message generation requested', {
            userId,
            invoiceId,
            messageType,
            tone: tone || 'auto',
        });

        // Extract message context (includes invoice details, client info, payment prediction)
        const context = await extractMessageContext(invoiceId, userId);

        // Generate message options
        const options: MessageGenerationOptions = {
            messageType: messageType as 'email' | 'sms' | 'voice_script' | 'whatsapp',
            tone: tone as 'professional' | 'friendly' | 'firm' | 'urgent' | undefined,
            length: length as 'short' | 'medium' | 'long' | undefined,
            includeInvoiceDetails: includeInvoiceDetails !== false, // Default true
            includePaymentOptions: includePaymentOptions !== false, // Default true
            language: (language as 'en-GB' | 'en-US') || 'en-GB',
            complianceMode: (complianceMode as 'fca' | 'standard') || 'fca', // Default FCA compliance
        };

        // Generate AI-powered message
        const message = await generateMessage(context, options);

        logInfo('AI message generated successfully', {
            userId,
            invoiceId,
            messageType,
            wordCount: message.metadata.wordCount,
            tone: message.metadata.tone,
            complianceChecked: message.metadata.complianceChecked,
        });

        return NextResponse.json(message, { status: 200 });
    } catch (error) {
        logError('AI message generation failed', error);
        return NextResponse.json(
            { error: 'Failed to generate message' },
            { status: 500 }
        );
    }
}

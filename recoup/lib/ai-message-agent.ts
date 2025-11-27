/**
 * AI Message Generation Agent
 *
 * Generates personalized, context-aware messages for:
 * - Email reminders
 * - SMS messages
 * - Voice call scripts
 * - WhatsApp messages
 *
 * **Features:**
 * - Extracts invoice details automatically
 * - Adapts tone based on payment prediction
 * - Personalizes based on client history
 * - Multi-language support
 * - Compliance-aware (FCA, PECR)
 *
 * **Powered by:**
 * - OpenAI GPT-4 for text generation
 * - Custom prompt engineering for debt collection compliance
 */

import { db, COLLECTIONS } from '@/lib/firebase';
import { predictPaymentTime } from '@/lib/ml-payment-predictor';
import { decrypt } from '@/lib/encryption';
import { logInfo, logError } from '@/utils/logger';

/**
 * Message context for AI agent
 */
export interface MessageContext {
    // Invoice details
    invoiceReference: string;
    invoiceAmount: number;
    currency: string;
    invoiceDate: Date;
    dueDate: Date;
    daysOverdue: number;
    lineItems?: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];

    // Client information
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    clientCompany?: string;

    // Freelancer information
    freelancerName: string;
    freelancerBusinessName: string;
    freelancerEmail: string;
    freelancerPhone?: string;

    // Payment context
    paymentPrediction?: {
        predictedDaysUntilPayment: number;
        paymentProbability: number;
        recommendedStrategy: 'gentle' | 'standard' | 'firm' | 'escalate';
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
    };

    // Communication history
    previousAttempts: number;
    lastContactDate?: Date;
    clientEngagement?: {
        openedEmails: boolean;
        respondedToSMS: boolean;
        answeredCalls: boolean;
    };

    // Payment options
    paymentLink?: string;
    paymentMethods: string[];
    bankDetails?: {
        accountName: string;
        sortCode: string;
        accountNumber: string;
    };
}

/**
 * Message generation options
 */
export interface MessageGenerationOptions {
    messageType: 'email' | 'sms' | 'voice_script' | 'whatsapp';
    tone?: 'professional' | 'friendly' | 'firm' | 'urgent';
    length?: 'short' | 'medium' | 'long';
    includeInvoiceDetails?: boolean;
    includePaymentOptions?: boolean;
    language?: 'en-GB' | 'en-US';
    complianceMode?: 'fca' | 'standard';
}

/**
 * Generated message result
 */
export interface GeneratedMessage {
    subject?: string; // For emails
    body: string;
    callToAction: string;
    metadata: {
        tone: string;
        wordCount: number;
        estimatedReadTime: number; // seconds
        complianceChecked: boolean;
    };
}

/**
 * Extract message context from invoice
 */
export async function extractMessageContext(
    invoiceId: string,
    freelancerId: string
): Promise<MessageContext> {
    // Get invoice
    const invoiceDoc = await db.collection(COLLECTIONS.INVOICES).doc(invoiceId).get();
    if (!invoiceDoc.exists) {
        throw new Error('Invoice not found');
    }
    const invoice = invoiceDoc.data()!;

    // Get freelancer details
    const freelancerDoc = await db.collection(COLLECTIONS.USERS).doc(freelancerId).get();
    const freelancer = freelancerDoc.exists ? freelancerDoc.data()! : null;

    // Decrypt sensitive fields
    const clientName = invoice.clientName ? decrypt(invoice.clientName) : 'Client';
    const clientEmail = invoice.clientEmail ? decrypt(invoice.clientEmail) : undefined;
    const clientPhone = invoice.clientPhone ? decrypt(invoice.clientPhone) : undefined;

    // Calculate days overdue
    const dueDate = invoice.dueDate?.toDate?.() || new Date(invoice.dueDate);
    const now = new Date();
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Get payment prediction
    let paymentPrediction;
    try {
        paymentPrediction = await predictPaymentTime(invoiceId, freelancerId);
    } catch (error) {
        logError('Failed to get payment prediction for message context', error);
    }

    // Get previous communication attempts
    const attemptsSnapshot = await db
        .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
        .where('invoiceId', '==', invoiceId)
        .get();

    const previousAttempts = attemptsSnapshot.size;
    const lastAttempt = attemptsSnapshot.docs.sort((a, b) => {
        const aDate = a.data().attemptDate?.toDate?.() || new Date(0);
        const bDate = b.data().attemptDate?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
    })[0];

    const lastContactDate = lastAttempt
        ? lastAttempt.data().attemptDate?.toDate?.()
        : undefined;

    return {
        invoiceReference: invoice.reference || invoiceId,
        invoiceAmount: invoice.amount || 0,
        currency: invoice.currency || 'GBP',
        invoiceDate: invoice.invoiceDate?.toDate?.() || new Date(invoice.invoiceDate),
        dueDate,
        daysOverdue,
        lineItems: invoice.lineItems || [],
        clientName,
        clientEmail,
        clientPhone,
        clientCompany: invoice.clientCompany,
        freelancerName: freelancer?.fullName || 'Freelancer',
        freelancerBusinessName: freelancer?.businessName || 'Business',
        freelancerEmail: freelancer?.email || '',
        freelancerPhone: freelancer?.phoneNumber,
        paymentPrediction,
        previousAttempts,
        lastContactDate,
        paymentLink: invoice.stripePaymentLinkUrl,
        paymentMethods: ['Bank Transfer', 'Stripe Payment Link'],
        bankDetails: freelancer?.bankDetails,
    };
}

/**
 * Generate AI-powered message
 */
export async function generateMessage(
    context: MessageContext,
    options: MessageGenerationOptions
): Promise<GeneratedMessage> {
    try {
        // Determine tone based on payment prediction if not specified
        const tone = options.tone || determineTone(context);

        // Build prompt for OpenAI
        const prompt = buildPrompt(context, options, tone);

        // Call OpenAI API
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: getSystemPrompt(options),
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: options.length === 'short' ? 150 : options.length === 'long' ? 500 : 300,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.choices[0]?.message?.content || '';

        // Parse generated message (extract subject and body for emails)
        const parsed = parseGeneratedMessage(generatedText, options.messageType);

        // Compliance check
        const complianceChecked = checkCompliance(parsed.body, options.complianceMode);

        logInfo('AI message generated', {
            type: options.messageType,
            tone,
            wordCount: parsed.body.split(' ').length,
            complianceChecked,
        });

        return {
            ...parsed,
            metadata: {
                tone,
                wordCount: parsed.body.split(' ').length,
                estimatedReadTime: Math.ceil(parsed.body.split(' ').length / 3), // ~180 wpm
                complianceChecked,
            },
        };
    } catch (error) {
        logError('AI message generation failed', error);

        // Fallback to template-based message
        return generateFallbackMessage(context, options);
    }
}

/**
 * Determine appropriate tone based on context
 */
function determineTone(context: MessageContext): 'professional' | 'friendly' | 'firm' | 'urgent' {
    if (!context.paymentPrediction) return 'professional';

    const { recommendedStrategy, riskLevel } = context.paymentPrediction;

    if (riskLevel === 'critical' || recommendedStrategy === 'escalate') return 'urgent';
    if (recommendedStrategy === 'firm') return 'firm';
    if (context.previousAttempts === 0) return 'friendly';
    return 'professional';
}

/**
 * Build OpenAI prompt
 */
function buildPrompt(
    context: MessageContext,
    options: MessageGenerationOptions,
    tone: string
): string {
    const { invoiceReference, invoiceAmount, currency, daysOverdue, clientName, freelancerBusinessName, lineItems } = context;

    let prompt = `Generate a ${tone} ${options.messageType} for collecting payment on an overdue invoice.\n\n`;

    prompt += `**Invoice Details:**\n`;
    prompt += `- Invoice Number: ${invoiceReference}\n`;
    prompt += `- Amount: ${currency === 'GBP' ? '£' : '$'}${invoiceAmount.toFixed(2)}\n`;
    prompt += `- Days Overdue: ${daysOverdue} days\n`;
    prompt += `- Client Name: ${clientName}\n`;
    prompt += `- Business: ${freelancerBusinessName}\n\n`;

    if (options.includeInvoiceDetails && lineItems && lineItems.length > 0) {
        prompt += `**Services/Items:**\n`;
        lineItems.forEach(item => {
            prompt += `- ${item.description} (Qty: ${item.quantity}, £${item.unitPrice.toFixed(2)})\n`;
        });
        prompt += `\n`;
    }

    if (context.paymentPrediction) {
        prompt += `**Context:**\n`;
        prompt += `- Payment Probability: ${(context.paymentPrediction.paymentProbability * 100).toFixed(0)}%\n`;
        prompt += `- Risk Level: ${context.paymentPrediction.riskLevel}\n`;
        prompt += `- Previous Attempts: ${context.previousAttempts}\n\n`;
    }

    if (options.includePaymentOptions && context.paymentLink) {
        prompt += `**Payment Link:** ${context.paymentLink}\n\n`;
    }

    prompt += `**Instructions:**\n`;
    prompt += `- Keep it concise and ${options.length || 'medium'} length\n`;
    prompt += `- Maintain a ${tone} tone\n`;
    prompt += `- Focus on the specific services provided (${lineItems?.[0]?.description || 'work completed'})\n`;
    prompt += `- Include clear next steps\n`;
    prompt += `- Be empathetic but firm about payment\n`;

    if (options.complianceMode === 'fca') {
        prompt += `- MUST comply with UK FCA debt collection regulations\n`;
        prompt += `- MUST NOT threaten or intimidate\n`;
        prompt += `- MUST be clear this is a payment request, not legal action\n`;
    }

    if (options.messageType === 'sms') {
        prompt += `- MUST be under 160 characters for SMS\n`;
    }

    if (options.messageType === 'voice_script') {
        prompt += `- Format as a conversational script\n`;
        prompt += `- Include pauses and responses to common objections\n`;
    }

    return prompt;
}

/**
 * System prompt for OpenAI
 */
function getSystemPrompt(options: MessageGenerationOptions): string {
    let basePrompt = `You are an expert debt collection communication specialist. `;

    if (options.complianceMode === 'fca') {
        basePrompt += `You MUST comply with UK FCA regulations for debt collection:
- Never threaten legal action unless instructed
- Always be respectful and professional
- Clearly state this is a payment request
- Provide clear payment options
- Allow reasonable time for payment`;
    }

    if (options.messageType === 'email') {
        basePrompt += `\n\nFormat emails with:
- Subject line (max 60 characters)
- Professional greeting
- Clear payment details
- Specific services/items
- Payment instructions
- Professional closing`;
    }

    if (options.messageType === 'sms') {
        basePrompt += `\n\nFor SMS:
- Maximum 160 characters
- Include invoice number and amount
- Include payment link if available
- Clear call to action`;
    }

    if (options.messageType === 'voice_script') {
        basePrompt += `\n\nFor voice scripts:
- Natural conversational tone
- Handle common objections
- Be empathetic
- Offer payment plan if appropriate`;
    }

    return basePrompt;
}

/**
 * Parse generated message (extract subject/body for emails)
 */
function parseGeneratedMessage(text: string, messageType: string): { subject?: string; body: string; callToAction: string } {
    if (messageType === 'email') {
        const lines = text.split('\n').filter(l => l.trim());
        const subjectLine = lines.find(l => l.toLowerCase().includes('subject:'));
        const subject = subjectLine
            ? subjectLine.replace(/subject:/i, '').trim()
            : lines[0];

        const bodyStart = subjectLine ? lines.indexOf(subjectLine) + 1 : 1;
        const body = lines.slice(bodyStart).join('\n').trim();

        // Extract CTA (usually last paragraph or contains "please", "kindly")
        const bodyLines = body.split('\n');
        const callToAction = bodyLines.reverse().find(l =>
            l.toLowerCase().includes('please') ||
            l.toLowerCase().includes('kindly') ||
            l.toLowerCase().includes('payment')
        ) || 'Please make payment at your earliest convenience';

        return { subject, body, callToAction };
    }

    // For SMS/voice, entire text is the body
    return {
        body: text.trim(),
        callToAction: 'Please make payment today',
    };
}

/**
 * Check FCA/PECR compliance
 */
function checkCompliance(message: string, mode?: string): boolean {
    if (mode !== 'fca') return true;

    const lowerMessage = message.toLowerCase();

    // Red flags for FCA non-compliance
    const redFlags = [
        'legal action',
        'lawsuit',
        'court',
        'bailiff',
        'debt collector',
        'credit score',
        'credit report',
        'immediately',
        'urgent action required',
    ];

    const hasRedFlags = redFlags.some(flag => lowerMessage.includes(flag));

    if (hasRedFlags) {
        logError('FCA compliance check failed - message contains prohibited language', new Error('Compliance violation'));
        return false;
    }

    return true;
}

/**
 * Fallback template-based message (when AI fails)
 */
function generateFallbackMessage(
    context: MessageContext,
    options: MessageGenerationOptions
): GeneratedMessage {
    const { invoiceReference, invoiceAmount, currency, daysOverdue, clientName, freelancerBusinessName } = context;

    if (options.messageType === 'email') {
        return {
            subject: `Payment Reminder: Invoice ${invoiceReference}`,
            body: `Dear ${clientName},

This is a friendly reminder that invoice ${invoiceReference} for ${currency === 'GBP' ? '£' : '$'}${invoiceAmount.toFixed(2)} is now ${daysOverdue} days overdue.

We completed the work as agreed and would appreciate payment at your earliest convenience.

You can make payment via the link below or by bank transfer.

${context.paymentLink || ''}

If you have any questions about this invoice, please don't hesitate to reach out.

Best regards,
${freelancerBusinessName}`,
            callToAction: 'Please make payment today',
            metadata: {
                tone: 'professional',
                wordCount: 50,
                estimatedReadTime: 20,
                complianceChecked: true,
            },
        };
    }

    if (options.messageType === 'sms') {
        return {
            body: `Hi ${clientName}, invoice ${invoiceReference} for £${invoiceAmount.toFixed(2)} is ${daysOverdue} days overdue. Pay here: ${context.paymentLink || 'contact us'}`,
            callToAction: 'Pay now',
            metadata: {
                tone: 'friendly',
                wordCount: 15,
                estimatedReadTime: 5,
                complianceChecked: true,
            },
        };
    }

    return {
        body: 'Payment reminder for overdue invoice',
        callToAction: 'Please pay',
        metadata: {
            tone: 'professional',
            wordCount: 5,
            estimatedReadTime: 2,
            complianceChecked: true,
        },
    };
}

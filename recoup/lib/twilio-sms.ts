/**
 * Twilio SMS integration
 * Handles SMS sending for collection reminders
 */

import { logInfo, logError } from '@/utils/logger';

export interface SMSTemplate {
    template: 'payment_reminder' | 'final_notice' | 'payment_link';
    variables: {
        debtorName: string;
        amount: number;
        invoiceNumber: string;
        businessName: string;
    };
}

export interface SMSOptions {
    recipientPhone: string;
    invoiceReference: string;
    amount: number;
    dueDate: string;
    template: string;
    paymentLink?: string;
    businessName: string;
    invoiceId: string;
    freelancerId: string;
}

export interface SMSResult {
    success: boolean;
    messageSid?: string;
    status?: string;
    cost?: number;
    error?: string;
}

// Lazy load Twilio to avoid build-time errors
let twilioClient: any = null;

function getTwilioClient() {
    if (!twilioClient) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || !authToken) {
            throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
        }

        // Import Twilio dynamically
        const twilio = require('twilio');
        twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
}

/**
 * Format amount in currency
 */
function formatAmount(amount: number, currency: string = 'GBP'): string {
    const symbols: Record<string, string> = {
        GBP: '£',
        USD: '$',
        EUR: '€',
    };
    return `${symbols[currency] || currency}${(amount / 100).toFixed(2)}`;
}

/**
 * Generate SMS message based on template
 */
function generateSMSMessage(options: SMSOptions): string {
    const { template, businessName, invoiceReference, amount, dueDate, paymentLink } = options;

    const formattedAmount = formatAmount(amount);

    switch (template) {
        case 'gentle_reminder':
            return `Reminder from ${businessName}: Invoice ${invoiceReference} (${formattedAmount}) was due on ${dueDate}. Please pay at your earliest convenience.${paymentLink ? ` Pay now: ${paymentLink}` : ''}`;

        case 'firm_reminder':
            return `URGENT: Invoice ${invoiceReference} from ${businessName} (${formattedAmount}) is now ${Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue. Please arrange payment immediately.${paymentLink ? ` ${paymentLink}` : ''}`;

        case 'final_notice':
            return `FINAL NOTICE: Invoice ${invoiceReference} (${formattedAmount}) remains unpaid. ${businessName} will escalate to collections if not resolved within 48 hours.${paymentLink ? ` Pay: ${paymentLink}` : ''}`;

        case 'payment_link':
            return `${businessName}: Pay invoice ${invoiceReference} (${formattedAmount}) securely: ${paymentLink}`;

        default:
            return `Payment reminder from ${businessName} for invoice ${invoiceReference} (${formattedAmount}).${paymentLink ? ` Pay: ${paymentLink}` : ''}`;
    }
}

/**
 * Send a collection SMS via Twilio
 */
export async function sendCollectionSMS(options: SMSOptions): Promise<SMSResult> {
    try {
        logInfo('Sending collection SMS', {
            invoiceId: options.invoiceId,
            template: options.template,
            recipientPhone: options.recipientPhone.substring(0, 6) + '****', // Mask phone for privacy
        });

        // Get Twilio client
        const client = getTwilioClient();
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!fromNumber) {
            throw new Error('TWILIO_PHONE_NUMBER not configured');
        }

        // Generate message
        const message = generateSMSMessage(options);

        // Send via Twilio
        const result = await client.messages.create({
            body: message,
            to: options.recipientPhone,
            from: fromNumber,
        });

        logInfo('SMS sent successfully', {
            messageSid: result.sid,
            status: result.status,
            invoiceId: options.invoiceId,
        });

        return {
            success: true,
            messageSid: result.sid,
            status: result.status,
            cost: 0.05, // Approximate cost for UK SMS
        };
    } catch (error) {
        logError('Failed to send collection SMS', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Email Template Renderer
 * Loads and populates email templates with dynamic variables
 * 
 * @see MASTER_IMPLEMENTATION_AUDIT_V1.md §4.3
 * @see email_reminder_best_practices.md
 */

import fs from 'fs';
import path from 'path';
import { calculateLateCharges, formatPounds, formatPercentage } from './latePaymentInterest';

export type ReminderLevel = 'day5' | 'day15' | 'day30';
export type TemplateFormat = 'html' | 'txt';

export interface EmailTemplateVariables {
    // Client details
    client_name: string;

    // Invoice details
    invoice_number: string;
    amount: string; // e.g., "500.00"
    due_date: string; // e.g., "15 Oct 2025"
    days_overdue: number;

    // Freelancer details
    freelancer_name: string;
    freelancer_email: string;
    freelancer_phone?: string;
    freelancer_company?: string;

    // Payment link
    payment_link: string;

    // For Day 30 template (interest calculation)
    statutory_interest?: string;
    fixed_compensation?: string;
    total_with_interest?: string;
    base_rate_percentage?: string;
    annual_rate_percentage?: string;
    fixed_fee_tier?: string;
    sent_date?: string;
}

/**
 * Load email template from file system
 * @internal
 */
function loadTemplate(level: ReminderLevel, format: TemplateFormat): string {
    const filename = `reminder-${level}.${format}`;
    const templatePath = path.join(process.cwd(), 'lib', 'email-templates', filename);

    try {
        return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
        throw new Error(`Failed to load email template: ${filename}. Error: ${error}`);
    }
}

/**
 * Replace template variables with actual values
 * @internal
 */
function replaceVariables(template: string, variables: EmailTemplateVariables): string {
    let result = template;

    // Replace all {{variable}} placeholders
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(value ?? ''));
    }

    return result;
}

/**
 * Calculate interest breakdown for Day 30 template
 * @internal
 */
function addInterestVariables(
    variables: EmailTemplateVariables,
    invoiceAmountPence: number,
    daysOverdue: number
): EmailTemplateVariables {
    const breakdown = calculateLateCharges(invoiceAmountPence, daysOverdue);

    return {
        ...variables,
        statutory_interest: formatPounds(breakdown.totalInterest),
        fixed_compensation: formatPounds(breakdown.fixedCompensationFee),
        total_with_interest: formatPounds(
            parseFloat(variables.amount) * 100 + breakdown.totalClaimable
        ),
        base_rate_percentage: formatPercentage(breakdown.baseRate),
        annual_rate_percentage: formatPercentage(breakdown.annualRate),
        fixed_fee_tier: `£${variables.amount} invoice`,
        sent_date: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }),
    };
}

/**
 * Render email template with variables
 * 
 * @param level - Reminder level (day5, day15, day30)
 * @param format - Output format (html or txt)
 * @param variables - Template variables to populate
 * @param invoiceAmountPence - Invoice amount in pence (required for day30 interest calculation)
 * 
 * @returns Rendered email content
 * 
 * @example
 * const html = renderEmailTemplate('day5', 'html', {
 *   client_name: 'John Smith',
 *   invoice_number: 'INV-001',
 *   amount: '500.00',
 *   due_date: '15 Oct 2025',
 *   days_overdue: 5,
 *   freelancer_name: 'Jane Doe',
 *   freelancer_email: 'jane@example.com',
 *   payment_link: 'https://recoup.app/pay/abc123',
 * });
 */
export function renderEmailTemplate(
    level: ReminderLevel,
    format: TemplateFormat,
    variables: EmailTemplateVariables,
    invoiceAmountPence?: number
): string {
    // Load template
    const template = loadTemplate(level, format);

    // Add interest calculation for Day 30 template
    let finalVariables = variables;
    if (level === 'day30' && invoiceAmountPence !== undefined) {
        finalVariables = addInterestVariables(
            variables,
            invoiceAmountPence,
            variables.days_overdue
        );
    }

    // Replace variables and return
    return replaceVariables(template, finalVariables);
}

/**
 * Get email subject line for reminder level
 */
export function getEmailSubject(level: ReminderLevel, invoiceNumber: string): string {
    switch (level) {
        case 'day5':
            return `Friendly Reminder: Invoice ${invoiceNumber}`;
        case 'day15':
            return `⚠️ Urgent: Payment Required - Invoice ${invoiceNumber}`;
        case 'day30':
            return `🚨 FINAL NOTICE - Legal Action May Follow - Invoice ${invoiceNumber}`;
    }
}

/**
 * Validate that all required variables are present
 * Throws error if missing required fields
 */
export function validateTemplateVariables(
    variables: EmailTemplateVariables,
    level: ReminderLevel
): void {
    const requiredFields: (keyof EmailTemplateVariables)[] = [
        'client_name',
        'invoice_number',
        'amount',
        'due_date',
        'days_overdue',
        'freelancer_name',
        'freelancer_email',
        'payment_link',
    ];

    // Day 30 requires additional fields
    if (level === 'day30') {
        requiredFields.push('freelancer_phone');
    }

    const missingFields = requiredFields.filter(field => !variables[field]);

    if (missingFields.length > 0) {
        throw new Error(
            `Missing required template variables: ${missingFields.join(', ')}`
        );
    }
}

/**
 * Preview email template (for testing/admin UI)
 * Returns both HTML and plain text versions
 */
export function previewEmailTemplate(
    level: ReminderLevel,
    variables: EmailTemplateVariables,
    invoiceAmountPence?: number
): { html: string; text: string; subject: string } {
    validateTemplateVariables(variables, level);

    return {
        html: renderEmailTemplate(level, 'html', variables, invoiceAmountPence),
        text: renderEmailTemplate(level, 'txt', variables, invoiceAmountPence),
        subject: getEmailSubject(level, variables.invoice_number),
    };
}

/**
 * Get recommended reminder schedule
 * Returns array of days to send reminders after due date
 */
export function getRecommendedSchedule(): number[] {
    return [5, 15, 30];
}

/**
 * Determine which reminder level to use based on days overdue
 */
export function getReminderLevelForDays(daysOverdue: number): ReminderLevel | null {
    if (daysOverdue >= 30) return 'day30';
    if (daysOverdue >= 15) return 'day15';
    if (daysOverdue >= 5) return 'day5';
    return null; // Not yet time for reminder
}

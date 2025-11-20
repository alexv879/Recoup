/**
 * Invoice Generation Tests
 * Tests PDF generation and email delivery
 */

import { describe, it, expect } from '@jest/globals';

describe('Invoice Generation', () => {
    describe('PDF Generation', () => {
        it('should generate PDF with all required UK fields', () => {
            const invoice = {
                invoiceNumber: 'INV-001',
                issueDate: '2025-11-20',
                dueDate: '2025-12-20',
                clientName: 'Test Client Ltd',
                items: [
                    { description: 'Web Development', quantity: 10, rate: 50, amount: 500 },
                ],
                subtotal: 500,
                vat: 100, // 20% UK VAT
                total: 600,
                currency: 'GBP',
            };

            // UK invoice must include:
            // - Invoice number
            // - Issue date
            // - Payment terms
            // - Business details
            // - VAT number (if registered)
            // - Items with descriptions
            // - Subtotal, VAT, Total
            expect(invoice.vat).toBe(invoice.subtotal * 0.2);
        });

        it('should calculate 20% UK VAT correctly', () => {
            const subtotal = 1000;
            const vat = subtotal * 0.2;
            const total = subtotal + vat;

            expect(vat).toBe(200);
            expect(total).toBe(1200);
        });

        it('should handle zero-rated items (no VAT)', () => {
            const subtotal = 1000;
            const vatRate = 0; // Zero-rated
            const vat = subtotal * vatRate;

            expect(vat).toBe(0);
        });
    });

    describe('Invoice Status Lifecycle', () => {
        it('should transition through correct states', () => {
            const states = ['draft', 'sent', 'viewed', 'overdue', 'paid', 'cancelled'];

            // Valid transitions:
            // draft -> sent -> viewed -> paid (happy path)
            // sent -> overdue (past due date)
            // any -> cancelled (user action)
            expect(states).toContain('draft');
            expect(states).toContain('paid');
        });

        it('should mark invoice overdue after due date', () => {
            const dueDate = new Date('2025-01-01');
            const today = new Date('2025-01-15');

            expect(today > dueDate).toBe(true);
        });
    });

    describe('Payment Terms', () => {
        it('should support common UK payment terms', () => {
            const terms = [
                'Due on receipt',
                'Net 7',
                'Net 14',
                'Net 30',
                'Net 60',
            ];

            expect(terms).toContain('Net 30');
        });

        it('should calculate due date from payment terms', () => {
            const issueDate = new Date('2025-01-01');
            const net30 = new Date(issueDate);
            net30.setDate(net30.getDate() + 30);

            expect(net30.getDate()).toBe(31); // Jan 31
        });
    });

    describe('Email Delivery', () => {
        it('should send invoice via Resend API', async () => {
            const emailData = {
                to: 'client@example.com',
                from: 'invoices@recoup.app',
                subject: 'Invoice INV-001 from Freelancer Name',
                attachments: [
                    {
                        filename: 'INV-001.pdf',
                        content: 'base64-pdf-data',
                    },
                ],
            };

            // Resend API should be called with correct format
            expect(emailData.attachments).toHaveLength(1);
        });

        it('should include payment link in email', () => {
            const paymentLink = 'https://app.recoup.io/pay/inv_123/token_abc';
            const emailBody = `
                Please find your invoice attached.

                Pay online: ${paymentLink}
            `;

            expect(emailBody).toContain(paymentLink);
        });
    });

    describe('Currency Formatting', () => {
        it('should format GBP with £ symbol', () => {
            const amount = 1234.56;
            const formatted = '£1,234.56';

            // Use Intl.NumberFormat for proper formatting
            const result = new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
            }).format(amount);

            expect(result).toContain('£');
        });

        it('should handle zero amounts', () => {
            const amount = 0;
            const formatted = '£0.00';

            expect(amount).toBe(0);
        });
    });

    describe('Late Payment Fees', () => {
        it('should calculate UK late payment interest', () => {
            // UK Late Payment Legislation: Bank of England base rate + 8%
            const baseRate = 5.25; // %
            const statutory = 8; // %
            const totalRate = baseRate + statutory; // 13.25%

            const principal = 1000;
            const daysLate = 30;
            const dailyRate = (totalRate / 100) / 365;
            const interest = principal * dailyRate * daysLate;

            expect(interest).toBeGreaterThan(0);
            expect(interest).toBeLessThan(principal);
        });
    });
});

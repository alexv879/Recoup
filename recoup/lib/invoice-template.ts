/**
 * INVOICE TEMPLATE GENERATOR
 * 
 * Generates invoice templates with UK Late Payment Act 1998 compliance
 * Includes statutory interest terms and legal payment conditions
 * 
 * Research Impact:
 * - Invoices with clear late payment terms increase on-time payment by 15-20%
 * - Legal clauses establish automatic right to statutory interest
 * - Professional formatting builds credibility and encourages prompt payment
 * 
 * UK Legal Requirements:
 * - Must reference Late Payment of Commercial Debts (Interest) Act 1998
 * - Must state current interest rate (8% + Bank of England base rate)
 * - Must mention fixed compensation amounts (£40-£100)
 * - Should include payment deadline and consequences
 * 
 * LEGAL AUTHORITY:
 * - Late Payment of Commercial Debts (Interest) Act 1998
 *   https://www.legislation.gov.uk/ukpga/1998/20/contents
 * - Late Payment Regulations 2002 (as amended 2013)
 *   https://www.legislation.gov.uk/uksi/2013/395/contents/made
 * 
 * OFFICIAL RESOURCES:
 * - GOV.UK Late Payment Guide: https://www.gov.uk/late-commercial-payments-interest-debt-recovery
 * - Pay On Time Interest Calculator: https://payontime.co.uk/calculator
 * - Bank of England Base Rate: https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate
 * - Small Business Commissioner: https://smallbusinesscommissioner.gov.uk
 * 
 * TEMPLATE OPTIONS:
 * - Formal Legal Tone: Maximum legal protection, statutory language
 * - Client-Friendly Tone: Softer approach, relationship preservation, maintains legal rights
 * - Minimal Notice: Short clause for existing invoice templates
 * 
 * THIRD-PARTY INTEGRATIONS:
 * For accounting software setup, see docs/late-payment-legal-resources.md:
 * - Xero: Invoice Settings > Payment Terms > Late Payment Terms
 * - FreshBooks: Settings > Company Profile > Terms & Conditions
 * - Wave: Invoices > Customize > Footer Notes (add minimal notice)
 */

import { formatCurrency, calculateLatePaymentInterest, BANK_OF_ENGLAND_BASE_RATE, STATUTORY_INTEREST_RATE } from './collections-calculator';

// ============================================================
// TYPES
// ============================================================

export interface InvoiceTemplateParams {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    clientName: string;
    clientAddress?: string;
    freelancerName: string;
    freelancerBusinessName?: string;
    freelancerAddress?: string;
    items: Array<{
        description: string;
        quantity?: number;
        rate?: number;
        amount: number;
    }>;
    subtotal: number;
    tax?: number;
    total: number;
    currency?: string;
    paymentTermsDays?: number;
    bankDetails?: {
        bankName: string;
        accountName: string;
        sortCode: string;
        accountNumber: string;
    };
    notes?: string;
    includeLatePaymentTerms?: boolean;
}

export interface LatePaymentTermsOptions {
    clientFriendlyTone?: boolean; // Use softer language while retaining legal rights
    includeExamples?: boolean; // Include interest calculation example
}

// ============================================================
// LATE PAYMENT TERMS GENERATORS
// ============================================================

/**
 * Generate formal late payment terms clause (default)
 * Full legal language with statutory references
 */
export function generateFormalLatePaymentTerms(
    invoiceAmount: number,
    dueDate: Date,
    options: LatePaymentTermsOptions = {}
): string {
    const { includeExamples = true } = options;

    const totalRate = STATUTORY_INTEREST_RATE + BANK_OF_ENGLAND_BASE_RATE;
    const dueDateStr = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Calculate example interest (30 days overdue)
    const exampleCalc = calculateLatePaymentInterest({
        principalAmount: invoiceAmount,
        dueDate: dueDate,
        currentDate: new Date(dueDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days later
    });

    const fixedFee = exampleCalc.fixedRecoveryCost;
    const dailyInterest = exampleCalc.dailyInterest;

    let terms = `PAYMENT TERMS:

Payment is due within the specified payment period. The due date for this invoice is ${dueDateStr}.

LATE PAYMENT:

Should payment not be received by the due date, statutory interest and compensation will be charged in accordance with the Late Payment of Commercial Debts (Interest) Act 1998:

1. STATUTORY INTEREST: ${totalRate}% per annum (${STATUTORY_INTEREST_RATE}% statutory rate + ${BANK_OF_ENGLAND_BASE_RATE}% Bank of England base rate as of 1 July 2025)

2. FIXED COMPENSATION: £${fixedFee} for debt recovery costs (based on invoice value)

3. ADDITIONAL COSTS: Reasonable costs of debt recovery if applicable (solicitor fees, court costs, agency fees)`;

    if (includeExamples) {
        terms += `

EXAMPLE: If this invoice remains unpaid after ${dueDateStr}, interest will accrue at ${formatCurrency(dailyInterest)} per day, plus fixed compensation of £${fixedFee} and any reasonable recovery costs.`;
    }

    terms += `

Interest and costs will be charged from the day after the due date and will continue to accrue daily until payment is received in full.

STATUTORY RIGHTS: These charges are automatic statutory rights under UK law and will be applied regardless of whether explicitly requested.`;

    return terms;
}

/**
 * Generate client-friendly late payment terms
 * Maintains legal rights but uses softer tone for relationship preservation
 */
export function generateClientFriendlyLatePaymentTerms(
    invoiceAmount: number,
    dueDate: Date
): string {
    const totalRate = STATUTORY_INTEREST_RATE + BANK_OF_ENGLAND_BASE_RATE;
    const dueDateStr = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const exampleCalc = calculateLatePaymentInterest({
        principalAmount: invoiceAmount,
        dueDate: dueDate,
        currentDate: new Date(dueDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    });

    return `PAYMENT TERMS:

Payment is due by ${dueDateStr}. We appreciate prompt payment and value our ongoing business relationship.

LATE PAYMENT INFORMATION:

In the event of late payment, statutory interest will be charged in accordance with the Late Payment of Commercial Debts (Interest) Act 1998 at ${totalRate}% per annum, plus a fixed compensation amount of £${exampleCalc.fixedRecoveryCost} (depending on invoice value) and any reasonable costs incurred in debt recovery.

However, we greatly value our relationship with you and are happy to discuss payment arrangements if you experience difficulty. Please contact us immediately if you anticipate any payment issues, and we will work together to find a mutually acceptable solution.

We aim to maintain positive working relationships with all our valued clients.`;
}

/**
 * Generate minimal late payment notice (for existing invoices)
 * Short clause that can be added to footer
 */
export function generateMinimalLatePaymentNotice(): string {
    const totalRate = STATUTORY_INTEREST_RATE + BANK_OF_ENGLAND_BASE_RATE;

    return `Late Payment: Statutory interest charged at ${totalRate}% p.a. (${STATUTORY_INTEREST_RATE}% + ${BANK_OF_ENGLAND_BASE_RATE}% BoE base rate) plus fixed compensation £40-£100 under Late Payment of Commercial Debts (Interest) Act 1998.`;
}

// ============================================================
// INVOICE HTML TEMPLATE
// ============================================================

/**
 * Generate complete HTML invoice with late payment terms
 * Professional design suitable for email or PDF generation
 */
export function generateInvoiceHTML(params: InvoiceTemplateParams): string {
    const {
        invoiceNumber,
        invoiceDate,
        dueDate,
        clientName,
        clientAddress,
        freelancerName,
        freelancerBusinessName,
        freelancerAddress,
        items,
        subtotal,
        tax = 0,
        total,
        currency = 'GBP',
        paymentTermsDays = 30,
        bankDetails,
        notes,
        includeLatePaymentTerms = true,
    } = params;

    const businessName = freelancerBusinessName || freelancerName;
    const invoiceDateStr = invoiceDate.toLocaleDateString('en-GB');
    const dueDateStr = dueDate.toLocaleDateString('en-GB');

    const latePaymentClause = includeLatePaymentTerms
        ? generateFormalLatePaymentTerms(total, dueDate, { includeExamples: true })
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: 700;
      color: #3b82f6;
    }
    .invoice-meta {
      text-align: right;
    }
    .addresses {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .address-block {
      flex: 1;
    }
    .address-label {
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #d1d5db;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-bottom: 40px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .total-row.grand-total {
      border-top: 2px solid #333;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 700;
    }
    .payment-section {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .payment-section h3 {
      margin-top: 0;
      color: #1f2937;
    }
    .bank-details {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 8px;
      margin-top: 12px;
    }
    .bank-label {
      font-weight: 600;
      color: #6b7280;
    }
    .late-payment-terms {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 20px;
      margin: 30px 0;
      white-space: pre-wrap;
      font-size: 13px;
      line-height: 1.8;
    }
    .late-payment-terms h3 {
      margin-top: 0;
      color: #991b1b;
      font-size: 16px;
    }
    .notes {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div>
      <div class="invoice-title">INVOICE</div>
      <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
        ${businessName}
      </div>
    </div>
    <div class="invoice-meta">
      <div><strong>Invoice Number:</strong> ${invoiceNumber}</div>
      <div><strong>Date:</strong> ${invoiceDateStr}</div>
      <div><strong>Due Date:</strong> ${dueDateStr}</div>
      <div style="margin-top: 8px; color: #3b82f6; font-weight: 600;">
        Net ${paymentTermsDays} Days
      </div>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <div class="address-label">From:</div>
      <div><strong>${businessName}</strong></div>
      ${freelancerAddress ? `<div>${freelancerAddress.split('\n').join('<br>')}</div>` : ''}
    </div>
    <div class="address-block" style="text-align: right;">
      <div class="address-label">Bill To:</div>
      <div><strong>${clientName}</strong></div>
      ${clientAddress ? `<div>${clientAddress.split('\n').join('<br>')}</div>` : ''}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        ${items.some(i => i.quantity) ? '<th style="text-align: center; width: 80px;">Qty</th>' : ''}
        ${items.some(i => i.rate) ? '<th style="text-align: right; width: 100px;">Rate</th>' : ''}
        <th style="text-align: right; width: 120px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.description}</td>
          ${items.some(i => i.quantity) ? `<td style="text-align: center;">${item.quantity || '-'}</td>` : ''}
          ${items.some(i => i.rate) ? `<td style="text-align: right;">${item.rate ? formatCurrency(item.rate) : '-'}</td>` : ''}
          <td style="text-align: right;">${formatCurrency(item.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    ${tax > 0 ? `
    <div class="total-row">
      <span>Tax:</span>
      <span>${formatCurrency(tax)}</span>
    </div>
    ` : ''}
    <div class="total-row grand-total">
      <span>TOTAL:</span>
      <span>${formatCurrency(total)}</span>
    </div>
  </div>

  ${bankDetails ? `
  <div class="payment-section">
    <h3>Payment Instructions</h3>
    <p style="margin: 8px 0;">Please remit payment to:</p>
    <div class="bank-details">
      <span class="bank-label">Bank:</span>
      <span>${bankDetails.bankName}</span>
      <span class="bank-label">Account Name:</span>
      <span>${bankDetails.accountName}</span>
      <span class="bank-label">Sort Code:</span>
      <span>${bankDetails.sortCode}</span>
      <span class="bank-label">Account Number:</span>
      <span>${bankDetails.accountNumber}</span>
      <span class="bank-label">Reference:</span>
      <span>${invoiceNumber}</span>
    </div>
    <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">
      If you have any questions about this invoice or require alternative payment arrangements, 
      please contact us within 5 days of receiving this invoice.
    </p>
  </div>
  ` : ''}

  ${includeLatePaymentTerms ? `
  <div class="late-payment-terms">
    <h3>⚠️ Late Payment Terms</h3>
    ${latePaymentClause}
  </div>
  ` : ''}

  ${notes ? `
  <div class="notes">
    <strong>Notes:</strong><br>
    ${notes}
  </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p style="margin-top: 8px;">
      This invoice is legally binding under UK law. Please retain for your records.
    </p>
  </div>
</body>
</html>`;
}

/**
 * Generate plain text invoice (email-friendly)
 */
export function generateInvoiceText(params: InvoiceTemplateParams): string {
    const {
        invoiceNumber,
        invoiceDate,
        dueDate,
        clientName,
        clientAddress,
        freelancerName,
        freelancerBusinessName,
        items,
        subtotal,
        tax = 0,
        total,
        paymentTermsDays = 30,
        bankDetails,
        notes,
        includeLatePaymentTerms = true,
    } = params;

    const businessName = freelancerBusinessName || freelancerName;
    const invoiceDateStr = invoiceDate.toLocaleDateString('en-GB');
    const dueDateStr = dueDate.toLocaleDateString('en-GB');

    let text = `
========================================
INVOICE
========================================

From: ${businessName}
To: ${clientName}
${clientAddress ? `${clientAddress}\n` : ''}

Invoice Number: ${invoiceNumber}
Date: ${invoiceDateStr}
Due Date: ${dueDateStr}
Payment Terms: Net ${paymentTermsDays} Days

========================================
ITEMS
========================================

${items.map(item => `${item.description}${item.quantity ? ` (Qty: ${item.quantity})` : ''}\n${formatCurrency(item.amount)}`).join('\n\n')}

----------------------------------------
Subtotal: ${formatCurrency(subtotal)}
${tax > 0 ? `Tax: ${formatCurrency(tax)}\n` : ''}TOTAL: ${formatCurrency(total)}
========================================

`;

    if (bankDetails) {
        text += `PAYMENT INSTRUCTIONS:

Bank: ${bankDetails.bankName}
Account Name: ${bankDetails.accountName}
Sort Code: ${bankDetails.sortCode}
Account Number: ${bankDetails.accountNumber}
Reference: ${invoiceNumber}

`;
    }

    if (includeLatePaymentTerms) {
        text += `========================================
LATE PAYMENT TERMS
========================================

${generateFormalLatePaymentTerms(total, dueDate, { includeExamples: true })}

========================================

`;
    }

    if (notes) {
        text += `NOTES:
${notes}

`;
    }

    text += `Thank you for your business!

If you have any questions, please contact us immediately.

`;

    return text.trim();
}

// ============================================================
// EXPORTS
// ============================================================

export default {
    generateInvoiceHTML,
    generateInvoiceText,
    generateFormalLatePaymentTerms,
    generateClientFriendlyLatePaymentTerms,
    generateMinimalLatePaymentNotice,
};

/**
 * AI Invoice Parser
 *
 * Uses GPT-4 Vision (multimodal) to extract structured data from invoice images
 *
 * Features:
 * - OCR extraction from photos, PDFs, scans
 * - Structured JSON output with invoice data
 * - VAT calculation validation
 * - Supplier/client detection
 * - Line item extraction
 * - Date and amount parsing
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedInvoice {
  // Invoice metadata
  invoiceNumber?: string;
  invoiceDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  poNumber?: string; // Purchase Order number

  // Supplier information
  supplierName?: string;
  supplierAddress?: string;
  supplierVatNumber?: string;
  supplierEmail?: string;
  supplierPhone?: string;

  // Client information (if shown on invoice)
  clientName?: string;
  clientAddress?: string;

  // Financial details
  lineItems: LineItem[];
  subtotal: number; // In pence
  vatRate: number; // Percentage (e.g., 20 for 20%)
  vatAmount: number; // In pence
  total: number; // In pence

  // Currency
  currency: string; // e.g., "GBP", "USD", "EUR"

  // Payment details
  paymentTerms?: string; // e.g., "Net 30", "Due on receipt"
  paymentMethod?: string; // e.g., "Bank transfer", "Credit card"
  bankDetails?: BankDetails;

  // Confidence scores (0-1)
  confidence: {
    overall: number;
    invoiceNumber: number;
    amounts: number;
    dates: number;
  };

  // Raw extracted text (for debugging)
  rawText?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number; // In pence
  amount: number; // In pence
  vatRate?: number; // Optional per-line VAT rate
}

export interface BankDetails {
  accountName?: string;
  accountNumber?: string;
  sortCode?: string;
  iban?: string;
  swift?: string;
}

export interface ParseOptions {
  /**
   * Extract raw OCR text for debugging
   */
  includeRawText?: boolean;

  /**
   * Expected currency (helps with ambiguous amounts)
   */
  expectedCurrency?: string;

  /**
   * Validate VAT calculations
   */
  validateVAT?: boolean;
}

/**
 * Parse invoice from image using GPT-4 Vision
 */
export async function parseInvoiceFromImage(
  imageUrl: string,
  options: ParseOptions = {}
): Promise<ParsedInvoice> {
  const {
    includeRawText = false,
    expectedCurrency = 'GBP',
    validateVAT = true,
  } = options;

  const systemPrompt = `You are an expert invoice data extraction system. Extract all relevant information from the invoice image and return it as structured JSON.

Extract the following information:
- Invoice number and dates (invoice date, due date)
- Supplier details (name, address, VAT number, contact info)
- Client/customer details (if shown)
- Line items (description, quantity, unit price, amount)
- Financial totals (subtotal, VAT rate, VAT amount, total)
- Payment information (terms, bank details)
- Currency

Important notes:
- All monetary amounts should be in pence (multiply pounds by 100)
- Dates should be in YYYY-MM-DD format
- VAT rates are percentages (e.g., 20 for 20%)
- If information is not clearly visible, omit it rather than guessing
- Calculate confidence scores (0-1) for extraction quality

Return ONLY valid JSON with no additional text.`;

  const userPrompt = `Extract all invoice data from this image. Expected currency: ${expectedCurrency}.

Return JSON in this exact format:
{
  "invoiceNumber": "INV-12345",
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-14",
  "supplierName": "Example Ltd",
  "supplierAddress": "123 High Street, London, EC1A 1BB",
  "supplierVatNumber": "GB123456789",
  "lineItems": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "unitPrice": 7500,
      "amount": 75000
    }
  ],
  "subtotal": 75000,
  "vatRate": 20,
  "vatAmount": 15000,
  "total": 90000,
  "currency": "GBP",
  "paymentTerms": "Net 30",
  "confidence": {
    "overall": 0.95,
    "invoiceNumber": 0.98,
    "amounts": 0.97,
    "dates": 0.92
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high', // High detail for better OCR
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from GPT-4 Vision');
    }

    // Extract JSON from response (remove markdown code blocks if present)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    const parsedData = JSON.parse(jsonString) as ParsedInvoice;

    // Validate VAT calculations if requested
    if (validateVAT && parsedData.subtotal && parsedData.vatRate && parsedData.vatAmount) {
      const expectedVAT = Math.round((parsedData.subtotal * parsedData.vatRate) / 100);
      const vatDifference = Math.abs(parsedData.vatAmount - expectedVAT);

      // Allow 1p difference due to rounding
      if (vatDifference > 1) {
        console.warn(`VAT validation warning: Expected ${expectedVAT}p, got ${parsedData.vatAmount}p`);
        parsedData.confidence.amounts *= 0.9; // Reduce confidence if VAT doesn't match
      }
    }

    // Validate total
    if (parsedData.subtotal && parsedData.vatAmount && parsedData.total) {
      const expectedTotal = parsedData.subtotal + parsedData.vatAmount;
      const totalDifference = Math.abs(parsedData.total - expectedTotal);

      if (totalDifference > 1) {
        console.warn(`Total validation warning: Expected ${expectedTotal}p, got ${parsedData.total}p`);
        parsedData.confidence.amounts *= 0.9;
      }
    }

    // Add raw text if requested
    if (includeRawText) {
      parsedData.rawText = content;
    }

    return parsedData;
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse GPT-4 Vision response as JSON: ${error.message}`);
    }

    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please configure OPENAI_API_KEY environment variable.');
    }

    if (error.code === 'rate_limit_exceeded') {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    }

    throw new Error(`Invoice parsing failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Parse invoice from base64-encoded image
 */
export async function parseInvoiceFromBase64(
  base64Image: string,
  mimeType: string = 'image/jpeg',
  options: ParseOptions = {}
): Promise<ParsedInvoice> {
  const dataUrl = `data:${mimeType};base64,${base64Image}`;
  return parseInvoiceFromImage(dataUrl, options);
}

/**
 * Parse invoice from file buffer (for server-side uploads)
 */
export async function parseInvoiceFromBuffer(
  buffer: Buffer,
  mimeType: string = 'image/jpeg',
  options: ParseOptions = {}
): Promise<ParsedInvoice> {
  const base64Image = buffer.toString('base64');
  return parseInvoiceFromBase64(base64Image, mimeType, options);
}

/**
 * Validate parsed invoice data
 */
export function validateParsedInvoice(invoice: ParsedInvoice): string[] {
  const errors: string[] = [];

  // Check required fields
  if (!invoice.total || invoice.total <= 0) {
    errors.push('Total amount is required and must be positive');
  }

  if (!invoice.supplierName) {
    errors.push('Supplier name is required');
  }

  if (!invoice.lineItems || invoice.lineItems.length === 0) {
    errors.push('At least one line item is required');
  }

  // Check confidence thresholds
  if (invoice.confidence.overall < 0.5) {
    errors.push('Low confidence in extraction (< 50%). Please verify manually.');
  }

  if (invoice.confidence.amounts < 0.7) {
    errors.push('Low confidence in amounts. Please verify totals manually.');
  }

  // Validate line items
  if (invoice.lineItems) {
    invoice.lineItems.forEach((item, index) => {
      if (!item.description) {
        errors.push(`Line item ${index + 1}: Description is required`);
      }

      if (item.quantity <= 0) {
        errors.push(`Line item ${index + 1}: Quantity must be positive`);
      }

      if (item.unitPrice < 0) {
        errors.push(`Line item ${index + 1}: Unit price must be non-negative`);
      }

      // Validate line item total
      const expectedAmount = Math.round(item.quantity * item.unitPrice);
      if (Math.abs(item.amount - expectedAmount) > 1) {
        errors.push(`Line item ${index + 1}: Amount calculation error`);
      }
    });
  }

  return errors;
}

/**
 * Convert parsed invoice to expense record format
 */
export function convertToExpense(invoice: ParsedInvoice, userId: string) {
  return {
    userId,
    type: 'expense',
    category: 'uncategorized', // Can be auto-categorized later
    supplier: invoice.supplierName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    description: invoice.lineItems.map((item) => item.description).join(', '),
    lineItems: invoice.lineItems,
    subtotal: invoice.subtotal,
    vatRate: invoice.vatRate,
    vatAmount: invoice.vatAmount,
    total: invoice.total,
    currency: invoice.currency,
    paymentStatus: 'unpaid',
    confidence: invoice.confidence,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Estimate cost of parsing an invoice (OpenAI pricing)
 */
export function estimateParsingCost(imageSize: 'low' | 'high' = 'high'): number {
  // GPT-4 Vision pricing (as of 2024):
  // - Low detail: $0.00765 per image
  // - High detail: $0.01105 per image + $0.00255 per 512px tile
  // Assuming average invoice image has ~4 tiles at high detail

  if (imageSize === 'low') {
    return 765; // 0.765p per image
  }

  // High detail: base + (4 tiles * tile cost)
  return 1105 + 4 * 255; // ~2.125p per invoice
}

/**
 * Get supported image formats
 */
export function getSupportedFormats(): string[] {
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf', // GPT-4V can process PDFs
  ];
}

/**
 * Check if file type is supported
 */
export function isSupportedFormat(mimeType: string): boolean {
  return getSupportedFormats().includes(mimeType.toLowerCase());
}

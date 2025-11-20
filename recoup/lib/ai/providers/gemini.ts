/**
 * Google Gemini AI Provider
 * Uses Gemini 1.5 Flash for OCR (90-96% accuracy)
 *
 * CRITICAL: Use gemini-1.5-flash, NOT gemini-2.0-flash
 * Research shows 1.5 is significantly better for OCR tasks
 *
 * Pricing (Nov 2025):
 * - Free tier: 1,500 requests/day, 1M tokens/day
 * - Paid tier: 2,000 RPM, 4M TPM
 * - Cost: $0.075/1M input tokens, $0.30/1M output tokens
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logInfo, logError } from '@/utils/logger';

// Initialize Gemini AI client
if (!process.env.GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY environment variable is not set');
}

const genai = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// CRITICAL: Use gemini-1.5-flash for OCR (proven best accuracy)
const OCR_MODEL = 'gemini-1.5-flash';
const CHAT_MODEL = 'gemini-1.5-flash';

/**
 * Invoice data structure extracted from UK invoices
 */
export interface InvoiceData {
  invoice_number: string;
  date: string; // YYYY-MM-DD
  supplier_name: string;
  supplier_address?: string;
  supplier_vat_number?: string;
  line_items: Array<{
    description: string;
    quantity?: number;
    unit_price?: number;
    amount: number;
  }>;
  subtotal: number;
  vat_amount: number;
  vat_rate: number;
  total: number;
  payment_terms?: string;
  due_date?: string; // YYYY-MM-DD
  currency: string; // Default: GBP
}

/**
 * Receipt data structure
 */
export interface ReceiptData {
  merchant: string;
  date: string; // YYYY-MM-DD
  items: Array<{
    description: string;
    amount: number;
  }>;
  total: number;
  vat_amount: number | null;
  payment_method?: string;
  currency: string; // Default: GBP
}

/**
 * Extract invoice data from image using Gemini 1.5 Flash
 * Optimized for UK invoices (£, DD/MM/YYYY, 20% VAT)
 */
export async function extractInvoiceData(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<InvoiceData> {
  if (!genai) {
    throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
  }

  const startTime = Date.now();

  try {
    const model = genai.getGenerativeModel({ model: OCR_MODEL });

    const prompt = `Extract all invoice data from this UK invoice image. Return ONLY valid JSON (no markdown, no code blocks).

CRITICAL UK FORMATTING RULES:
1. Convert dates from DD/MM/YYYY to YYYY-MM-DD format
2. Remove £ symbols from all amounts (return as numbers only)
3. UK VAT is typically 20% (but check the invoice)
4. Payment terms examples: "30 days", "Net 30", "14 days", "Due on receipt"
5. Line items should include description, quantity, unit_price, and amount
6. All amounts should be in pounds (GBP)

JSON Schema (STRICT - no additional fields):
{
  "invoice_number": "string",
  "date": "YYYY-MM-DD",
  "supplier_name": "string",
  "supplier_address": "string or null",
  "supplier_vat_number": "string or null",
  "line_items": [
    {
      "description": "string",
      "quantity": number or null,
      "unit_price": number or null,
      "amount": number
    }
  ],
  "subtotal": number,
  "vat_amount": number,
  "vat_rate": number (as decimal, e.g., 0.20 for 20%),
  "total": number,
  "payment_terms": "string or null",
  "due_date": "YYYY-MM-DD or null",
  "currency": "GBP"
}

Return ONLY the JSON object. No explanations, no markdown.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);

    const response = result.response;
    const text = response.text();

    // Clean up response (remove markdown code blocks if present)
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/^```json\n?/i, '');
    cleanedText = cleanedText.replace(/^```\n?/i, '');
    cleanedText = cleanedText.replace(/\n?```$/i, '');
    cleanedText = cleanedText.trim();

    // Parse JSON
    const data = JSON.parse(cleanedText) as InvoiceData;

    const latency = Date.now() - startTime;

    logInfo('Gemini invoice OCR success', {
      model: OCR_MODEL,
      invoice_number: data.invoice_number,
      total: data.total,
      currency: data.currency,
      latency_ms: latency
    });

    return data;
  } catch (error) {
    const latency = Date.now() - startTime;

    logError('Gemini invoice OCR failed', error as Error);

    throw new Error(
      `Invoice extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract receipt data from image using Gemini 1.5 Flash
 * Optimized for UK receipts (Tesco, Sainsbury's, etc.)
 */
export async function extractReceiptData(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ReceiptData> {
  if (!genai) {
    throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
  }

  const startTime = Date.now();

  try {
    const model = genai.getGenerativeModel({ model: OCR_MODEL });

    const prompt = `Extract receipt data from this UK receipt image. Return ONLY valid JSON (no markdown).

CRITICAL UK FORMATTING:
- Convert dates from DD/MM/YYYY to YYYY-MM-DD
- Remove £ symbols from amounts
- Extract VAT if shown (typically 20% in UK)
- Currency is GBP

JSON Schema:
{
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "items": [{"description": "string", "amount": number}],
  "total": number,
  "vat_amount": number or null,
  "payment_method": "string or null",
  "currency": "GBP"
}

Return ONLY the JSON object.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);

    const response = result.response;
    const text = response.text();

    // Clean up response
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/^```json\n?/i, '');
    cleanedText = cleanedText.replace(/^```\n?/i, '');
    cleanedText = cleanedText.replace(/\n?```$/i, '');
    cleanedText = cleanedText.trim();

    const data = JSON.parse(cleanedText) as ReceiptData;

    const latency = Date.now() - startTime;

    logInfo('Gemini receipt OCR success', {
      model: OCR_MODEL,
      merchant: data.merchant,
      total: data.total,
      latency_ms: latency
    });

    return data;
  } catch (error) {
    logError('Gemini receipt OCR failed', error as Error);

    throw new Error(
      `Receipt extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Basic chat completion (for free tier)
 * Uses Gemini 1.5 Flash for cost-effective responses
 */
export async function chatCompletion(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  if (!genai) {
    throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
  }

  const startTime = Date.now();

  try {
    const model = genai.getGenerativeModel({ model: CHAT_MODEL });

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    const latency = Date.now() - startTime;

    logInfo('Gemini chat completion success', {
      model: CHAT_MODEL,
      prompt_length: prompt.length,
      response_length: text.length,
      latency_ms: latency
    });

    return text;
  } catch (error) {
    logError('Gemini chat completion failed', error as Error);

    throw new Error(
      `Chat completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

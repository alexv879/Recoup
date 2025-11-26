/**
 * AI Invoice Parsing API
 *
 * Upload invoice images/PDFs and extract structured data using GPT-4 Vision
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  parseInvoiceFromBuffer,
  parseInvoiceFromImage,
  validateParsedInvoice,
  convertToExpense,
  isSupportedFormat,
  estimateParsingCost,
} from '@/lib/ai-invoice-parser';
import { logError } from '@/utils/logger';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * POST /api/ai/parse-invoice
 * Parse invoice from uploaded file or image URL
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    let parsedInvoice;
    let source = 'unknown';

    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      // Validate file type
      if (!isSupportedFormat(file.type)) {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload JPEG, PNG, GIF, WebP, or PDF' },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      source = 'file_upload';

      // Parse invoice
      parsedInvoice = await parseInvoiceFromBuffer(buffer, file.type, {
        includeRawText: false,
        expectedCurrency: 'GBP',
        validateVAT: true,
      });
    }
    // Handle JSON with image URL
    else if (contentType.includes('application/json')) {
      const body = await request.json();
      const { imageUrl, options } = body;

      if (!imageUrl) {
        return NextResponse.json(
          { error: 'Image URL is required' },
          { status: 400 }
        );
      }

      source = 'image_url';

      // Parse invoice from URL
      parsedInvoice = await parseInvoiceFromImage(imageUrl, {
        ...options,
        expectedCurrency: options?.expectedCurrency || 'GBP',
        validateVAT: options?.validateVAT !== false,
      });
    }
    else {
      return NextResponse.json(
        { error: 'Invalid content type. Use multipart/form-data or application/json' },
        { status: 400 }
      );
    }

    // Validate parsed data
    const validationErrors = validateParsedInvoice(parsedInvoice);

    // Check if we should auto-save as expense
    const shouldSaveAsExpense = validationErrors.length === 0 && parsedInvoice.confidence.overall >= 0.8;

    let expenseId: string | undefined;

    if (shouldSaveAsExpense) {
      try {
        const expense = convertToExpense(parsedInvoice, userId);

        // Store expense in Firestore
        const { db, COLLECTIONS, Timestamp } = await import('@/lib/firebase');
        const expenseRef = await db.collection(COLLECTIONS.EXPENSES).add({
          ...expense,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        expenseId = expenseRef.id;
      } catch (expenseError) {
        // Log but don't fail - expense auto-save is non-critical
        logError('Failed to auto-save expense', expenseError);
      }
    }

    // Estimate cost
    const estimatedCost = estimateParsingCost('high');

    return NextResponse.json({
      success: true,
      invoice: parsedInvoice,
      validation: {
        errors: validationErrors,
        isValid: validationErrors.length === 0,
      },
      metadata: {
        source,
        estimatedCost,
        autoSaved: !!expenseId,
        expenseId,
      },
    });
  } catch (error: any) {
    logError('Invoice parsing error', error);

    // Handle specific OpenAI errors
    if (error.message?.includes('Invalid OpenAI API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 503 }
      );
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few moments.' },
        { status: 429 }
      );
    }

    if (error.message?.includes('Failed to parse')) {
      return NextResponse.json(
        {
          error: 'Could not extract invoice data from image. Please ensure the image is clear and contains a valid invoice.',
          details: error.message,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to parse invoice' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/parse-invoice
 * Get information about the invoice parsing service
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'AI Invoice Parser',
    model: 'GPT-4 Vision',
    features: [
      'Extract invoice data from images and PDFs',
      'OCR with high accuracy',
      'Automatic VAT calculation',
      'Supplier and line item detection',
      'Confidence scoring',
    ],
    supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
    estimatedCost: {
      perInvoice: '~2p',
      currency: 'GBP',
    },
    usage: {
      endpoint: 'POST /api/ai/parse-invoice',
      methods: [
        {
          type: 'File upload',
          contentType: 'multipart/form-data',
          body: 'FormData with "file" field',
        },
        {
          type: 'Image URL',
          contentType: 'application/json',
          body: '{ "imageUrl": "https://...", "options": {} }',
        },
      ],
    },
  });
}

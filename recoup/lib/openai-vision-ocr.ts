/**
 * OpenAI Vision OCR for receipt processing
 * Uses gpt-4o-mini for cost-effective receipt data extraction
 * Cost: ~$0.10 per 1,000 images (15x cheaper than AWS Textract)
 */

import OpenAI from 'openai';
import type { OCRData, ExpenseCategory } from '@/types/models';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract data from receipt image using OpenAI Vision
 * @param imageUrl - Public URL to the receipt image
 * @returns Extracted receipt data
 */
export async function extractReceiptData(imageUrl: string): Promise<OCRData> {
  const startTime = Date.now();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this receipt image and extract the following information in JSON format:

{
  "merchant": "Merchant/vendor name",
  "amount": 23.45,
  "currency": "GBP",
  "date": "2025-11-21",
  "category": "one of: travel, office, marketing, professional, training, utilities, vehicle, mileage, subsistence, client_entertainment, premises, financial, other",
  "items": ["item 1", "item 2"]
}

Rules:
- Amount should be the TOTAL amount in decimal format (e.g., 23.45 not 2345)
- Date in YYYY-MM-DD format
- Category should be the most appropriate UK business expense category
- Currency defaults to GBP for UK receipts
- Return ONLY valid JSON, no other text`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low', // Low detail = cheaper, sufficient for receipts
              },
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.1, // Low temperature for more consistent extraction
    });

    const content = response.choices[0].message.content || '{}';
    const processingTime = Date.now() - startTime;

    // Parse JSON response
    let parsed: any;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Convert amount from pounds to pence
    const amountInPence = parsed.amount
      ? Math.round(parseFloat(parsed.amount) * 100)
      : undefined;

    // Build full extracted text
    const extractedText = `Merchant: ${parsed.merchant || 'Unknown'}
Date: ${parsed.date || 'Unknown'}
Amount: ${parsed.currency || 'GBP'} ${parsed.amount || '0.00'}
Category: ${parsed.category || 'other'}
Items: ${parsed.items?.join(', ') || 'N/A'}`;

    return {
      extractedText,
      confidence: 0.85, // OpenAI doesn't provide confidence scores
      merchant: parsed.merchant,
      amount: amountInPence,
      currency: parsed.currency || 'GBP',
      date: parsed.date,
      category: mapCategory(parsed.category),
      processingTime,
      provider: 'openai-vision',
    };
  } catch (error: any) {
    console.error('OpenAI Vision OCR failed:', error);

    // Return error state
    return {
      extractedText: `Error: ${error.message}`,
      confidence: 0,
      processingTime: Date.now() - startTime,
      provider: 'openai-vision',
    };
  }
}

/**
 * Map OpenAI's category to our ExpenseCategory type
 */
function mapCategory(category?: string): ExpenseCategory | undefined {
  if (!category) return undefined;

  const categoryMap: Record<string, ExpenseCategory> = {
    travel: 'travel',
    office: 'office',
    marketing: 'marketing',
    professional: 'professional',
    training: 'training',
    utilities: 'utilities',
    vehicle: 'vehicle',
    mileage: 'mileage',
    subsistence: 'subsistence',
    client_entertainment: 'client_entertainment',
    premises: 'premises',
    financial: 'financial',
    other: 'other',
  };

  return categoryMap[category.toLowerCase()] || 'other';
}

/**
 * Batch process multiple receipts (with rate limiting)
 * @param imageUrls - Array of image URLs
 * @param delayMs - Delay between requests (default 1000ms)
 * @returns Array of OCR results
 */
export async function batchExtractReceipts(
  imageUrls: string[],
  delayMs: number = 1000
): Promise<OCRData[]> {
  const results: OCRData[] = [];

  for (const url of imageUrls) {
    try {
      const result = await extractReceiptData(url);
      results.push(result);

      // Delay between requests to avoid rate limiting
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error('Batch OCR failed for URL:', url, error);
      results.push({
        extractedText: 'Error processing receipt',
        confidence: 0,
        processingTime: 0,
        provider: 'openai-vision',
      });
    }
  }

  return results;
}

/**
 * Validate if image is a receipt (basic check)
 * @param imageUrl - URL to image
 * @returns Boolean indicating if it looks like a receipt
 */
export async function validateReceipt(imageUrl: string): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Is this image a receipt or invoice? Answer with just "yes" or "no".',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low',
              },
            },
          ],
        },
      ],
      max_tokens: 10,
    });

    const content = response.choices[0].message.content?.toLowerCase() || '';
    return content.includes('yes');
  } catch (error) {
    console.error('Receipt validation failed:', error);
    return true; // Default to true to not block processing
  }
}

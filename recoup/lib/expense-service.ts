/**
 * Expense Management Service
 * Handles expense tracking, receipt scanning (OCR), and tax calculations
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Expense, ExpenseCategory, ReceiptOCRResult, EXPENSE_CATEGORY_LABELS } from '@/types/expense';
import { logger } from '@/utils/logger';

// Initialize Gemini for OCR (cheapest option: ~£0.0025 per image)
let gemini: GoogleGenerativeAI | null = null;

function getGemini(): GoogleGenerativeAI {
  if (!gemini) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    gemini = new GoogleGenerativeAI(apiKey);
  }
  return gemini;
}

/**
 * Scan receipt using Gemini Vision API
 * Extracts merchant, date, amount, and suggests category
 */
export async function scanReceipt(imageData: string | Buffer): Promise<ReceiptOCRResult> {
  const startTime = Date.now();

  try {
    const client = getGemini();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Prepare image data
    const imageBase64 = typeof imageData === 'string'
      ? imageData
      : imageData.toString('base64');

    const prompt = `You are a receipt scanning expert for UK businesses. Analyze this receipt image and extract the following information in JSON format:

{
  "merchant": "Name of the merchant/shop",
  "date": "ISO 8601 date (YYYY-MM-DD)",
  "amount": number (total amount paid),
  "currency": "GBP" or other currency code,
  "category": "one of: office_costs, travel_costs, meals, equipment, subscriptions, marketing, etc.",
  "description": "Brief description of what was purchased",
  "tax_deductible": true/false (based on HMRC rules for UK self-employed),
  "confidence": 0.0 to 1.0 (your confidence in the extraction)
}

HMRC UK Tax Deduction Rules:
- Office supplies, software, equipment: FULLY deductible
- Business travel (not commuting): Deductible
- Business meals with clients: Deductible
- Personal meals: NOT deductible
- Clothing (unless uniform): NOT deductible
- Training directly related to business: Deductible

Only extract information you can clearly see. If unsure, use null and lower confidence score.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
      { text: prompt },
    ]);

    const response = result.response;
    const text = response.text();

    logger.info('Receipt OCR response', { text: text.substring(0, 200) });

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const ocrResult: ReceiptOCRResult = {
      merchant: parsed.merchant || undefined,
      date: parsed.date ? new Date(parsed.date) : undefined,
      amount: parsed.amount || undefined,
      currency: parsed.currency || 'GBP',
      category: parsed.category as ExpenseCategory || undefined,
      confidence: parsed.confidence || 0.5,
      extractedText: text,
      suggestions: {
        description: parsed.description || '',
        taxDeductible: parsed.tax_deductible !== false,
      },
    };

    const duration = Date.now() - startTime;

    logger.info('Receipt scanned successfully', {
      merchant: ocrResult.merchant,
      amount: ocrResult.amount,
      confidence: ocrResult.confidence,
      duration,
    });

    return ocrResult;

  } catch (error) {
    logger.error('Receipt scanning failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return low-confidence result
    return {
      confidence: 0,
      extractedText: '',
      suggestions: {
        description: '',
        taxDeductible: true,
      },
    };
  }
}

/**
 * Auto-categorize expense using AI
 * Uses description to suggest appropriate HMRC category
 */
export async function categorizeExpense(description: string, merchant?: string): Promise<{
  category: ExpenseCategory;
  confidence: number;
  taxDeductible: boolean;
  reasoning: string;
}> {
  try {
    const client = getGemini();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a UK tax expert categorizing business expenses for self-employed individuals.

Expense: "${description}"
${merchant ? `Merchant: "${merchant}"` : ''}

Categorize this expense according to HMRC allowable expenses. Respond in JSON:

{
  "category": "one of: office_costs, travel_costs, meals, equipment, subscriptions, marketing, training_courses, professional_fees, vehicle_costs, phone_internet, etc.",
  "confidence": 0.0 to 1.0,
  "tax_deductible": true/false,
  "reasoning": "Brief explanation why this category and tax status"
}

Categories:
${Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => `- ${key}: ${label}`).join('\n')}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      category: parsed.category as ExpenseCategory || ExpenseCategory.OTHER,
      confidence: parsed.confidence || 0.5,
      taxDeductible: parsed.tax_deductible !== false,
      reasoning: parsed.reasoning || '',
    };

  } catch (error) {
    logger.error('Auto-categorization failed', { error });

    return {
      category: ExpenseCategory.OTHER,
      confidence: 0,
      taxDeductible: true,
      reasoning: 'Auto-categorization unavailable',
    };
  }
}

/**
 * Calculate total tax-deductible expenses for a period
 * Useful for self-assessment tax returns
 */
export function calculateTaxDeductions(expenses: Expense[]): {
  total: number;
  byCategory: Record<ExpenseCategory, number>;
  warnings: string[];
} {
  const byCategory: Record<ExpenseCategory, number> = {} as any;
  const warnings: string[] = [];
  let total = 0;

  for (const expense of expenses) {
    if (!expense.taxDeductible) {
      continue;
    }

    total += expense.amount;

    if (!byCategory[expense.category]) {
      byCategory[expense.category] = 0;
    }
    byCategory[expense.category] += expense.amount;

    // Warn about potential issues
    if (expense.category === ExpenseCategory.MEALS && expense.amount > 50) {
      warnings.push(
        `Large meal expense (£${expense.amount}) - ensure this was with a client or overnight business trip`
      );
    }

    if (expense.category === ExpenseCategory.CLOTHING && !expense.description.toLowerCase().includes('uniform')) {
      warnings.push(
        `Clothing expense (£${expense.amount}) - HMRC only allows uniforms/protective clothing`
      );
    }

    if (expense.category === ExpenseCategory.TRAVEL_COSTS && expense.amount > 500) {
      warnings.push(
        `Large travel expense (£${expense.amount}) - keep receipts and business purpose documentation`
      );
    }
  }

  return {
    total,
    byCategory,
    warnings,
  };
}

/**
 * Calculate home office allowance using simplified expenses
 * HMRC simplified expenses method
 */
export function calculateHomeOfficeAllowance(hoursPerMonth: number): number {
  if (hoursPerMonth < 25) {
    return 0;
  } else if (hoursPerMonth <= 50) {
    return 10; // £10 per month
  } else if (hoursPerMonth <= 100) {
    return 18; // £18 per month
  } else {
    return 26; // £26 per month
  }
}

/**
 * Calculate mileage allowance
 * UK HMRC rates: 45p/mile first 10,000, 25p after
 */
export function calculateMileageAllowance(
  miles: number,
  vehicleType: 'car' | 'motorcycle' | 'bicycle' = 'car'
): number {
  if (vehicleType === 'motorcycle') {
    return miles * 0.24;
  }

  if (vehicleType === 'bicycle') {
    return miles * 0.20;
  }

  // Car/van
  if (miles <= 10000) {
    return miles * 0.45;
  } else {
    return (10000 * 0.45) + ((miles - 10000) * 0.25);
  }
}

/**
 * Suggest tax deductions user might be missing
 * AI-powered analysis of expense patterns
 */
export async function suggestMissedDeductions(expenses: Expense[]): Promise<{
  suggestions: Array<{
    category: string;
    description: string;
    potentialSaving: number;
  }>;
}> {
  const suggestions: Array<{
    category: string;
    description: string;
    potentialSaving: number;
  }> = [];

  // Analyze patterns
  const hasHomeOffice = expenses.some(e =>
    e.description.toLowerCase().includes('rent') ||
    e.description.toLowerCase().includes('mortgage')
  );

  const hasVehicle = expenses.some(e =>
    e.category === ExpenseCategory.VEHICLE_COSTS
  );

  const hasPhone = expenses.some(e =>
    e.category === ExpenseCategory.PHONE_INTERNET
  );

  if (!hasHomeOffice) {
    suggestions.push({
      category: 'Home Office',
      description: 'You can claim £10-26/month for working from home using HMRC simplified expenses',
      potentialSaving: 26 * 12, // £312/year maximum
    });
  }

  if (hasVehicle && !expenses.some(e => e.description.toLowerCase().includes('mileage'))) {
    suggestions.push({
      category: 'Mileage',
      description: 'Consider tracking business mileage - you can claim 45p/mile (first 10k miles)',
      potentialSaving: 4500, // Assume 10k miles
    });
  }

  if (!hasPhone) {
    suggestions.push({
      category: 'Phone & Internet',
      description: 'You can claim business portion of phone and internet costs',
      potentialSaving: 600, // Assume £50/month
    });
  }

  const hasTraining = expenses.some(e =>
    e.category === ExpenseCategory.TRAINING_COURSES
  );

  if (!hasTraining) {
    suggestions.push({
      category: 'Training & Development',
      description: 'Professional courses directly related to your business are tax-deductible',
      potentialSaving: 500, // Average course cost
    });
  }

  return { suggestions };
}

/**
 * Generate expense report for accountant
 * Formats data for HMRC self-assessment
 */
export function generateExpenseReport(
  expenses: Expense[],
  startDate: Date,
  endDate: Date
): {
  period: { start: Date; end: Date };
  summary: {
    totalExpenses: number;
    taxDeductible: number;
    nonDeductible: number;
  };
  byCategory: Array<{
    category: string;
    categoryLabel: string;
    amount: number;
    count: number;
  }>;
  exportDate: Date;
} {
  const periodExpenses = expenses.filter(
    e => e.date >= startDate && e.date <= endDate
  );

  const summary = {
    totalExpenses: periodExpenses.reduce((sum, e) => sum + e.amount, 0),
    taxDeductible: periodExpenses
      .filter(e => e.taxDeductible)
      .reduce((sum, e) => sum + e.amount, 0),
    nonDeductible: periodExpenses
      .filter(e => !e.taxDeductible)
      .reduce((sum, e) => sum + e.amount, 0),
  };

  const categoryMap = new Map<ExpenseCategory, { amount: number; count: number }>();

  for (const expense of periodExpenses) {
    const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 };
    categoryMap.set(expense.category, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    });
  }

  const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    categoryLabel: EXPENSE_CATEGORY_LABELS[category],
    amount: data.amount,
    count: data.count,
  }));

  return {
    period: { start: startDate, end: endDate },
    summary,
    byCategory,
    exportDate: new Date(),
  };
}

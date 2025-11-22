/**
 * Tests for AI Invoice Parser
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  validateParsedInvoice,
  convertToExpense,
  estimateParsingCost,
  isSupportedFormat,
  getSupportedFormats,
} from '@/lib/ai-invoice-parser';
import type { ParsedInvoice } from '@/lib/ai-invoice-parser';

describe('AI Invoice Parser', () => {
  describe('validateParsedInvoice', () => {
    const validInvoice: ParsedInvoice = {
      invoiceNumber: 'INV-12345',
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-14',
      supplierName: 'Example Ltd',
      supplierAddress: '123 High Street, London',
      supplierVatNumber: 'GB123456789',
      lineItems: [
        {
          description: 'Consulting Services',
          quantity: 10,
          unitPrice: 7500,
          amount: 75000,
        },
      ],
      subtotal: 75000,
      vatRate: 20,
      vatAmount: 15000,
      total: 90000,
      currency: 'GBP',
      paymentTerms: 'Net 30',
      confidence: {
        overall: 0.95,
        invoiceNumber: 0.98,
        amounts: 0.97,
        dates: 0.92,
      },
    };

    it('should pass validation for valid invoice', () => {
      const errors = validateParsedInvoice(validInvoice);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation if total is missing', () => {
      const invalid = { ...validInvoice, total: 0 };
      const errors = validateParsedInvoice(invalid);
      expect(errors).toContain('Total amount is required and must be positive');
    });

    it('should fail validation if supplier name is missing', () => {
      const invalid = { ...validInvoice, supplierName: undefined };
      const errors = validateParsedInvoice(invalid);
      expect(errors).toContain('Supplier name is required');
    });

    it('should fail validation if no line items', () => {
      const invalid = { ...validInvoice, lineItems: [] };
      const errors = validateParsedInvoice(invalid);
      expect(errors).toContain('At least one line item is required');
    });

    it('should fail validation if overall confidence too low', () => {
      const invalid = { ...validInvoice, confidence: { ...validInvoice.confidence, overall: 0.3 } };
      const errors = validateParsedInvoice(invalid);
      expect(errors.some((e) => e.includes('Low confidence'))).toBe(true);
    });

    it('should warn if amounts confidence too low', () => {
      const invalid = { ...validInvoice, confidence: { ...validInvoice.confidence, amounts: 0.5 } };
      const errors = validateParsedInvoice(invalid);
      expect(errors.some((e) => e.includes('amounts'))).toBe(true);
    });

    it('should fail validation if line item description missing', () => {
      const invalid = {
        ...validInvoice,
        lineItems: [{ ...validInvoice.lineItems[0], description: '' }],
      };
      const errors = validateParsedInvoice(invalid);
      expect(errors).toContain('Line item 1: Description is required');
    });

    it('should fail validation if line item quantity is zero', () => {
      const invalid = {
        ...validInvoice,
        lineItems: [{ ...validInvoice.lineItems[0], quantity: 0 }],
      };
      const errors = validateParsedInvoice(invalid);
      expect(errors).toContain('Line item 1: Quantity must be positive');
    });

    it('should fail validation if line item quantity is negative', () => {
      const invalid = {
        ...validInvoice,
        lineItems: [{ ...validInvoice.lineItems[0], quantity: -5 }],
      };
      const errors = validateParsedInvoice(invalid);
      expect(errors).toContain('Line item 1: Quantity must be positive');
    });

    it('should fail validation if line item unit price is negative', () => {
      const invalid = {
        ...validInvoice,
        lineItems: [{ ...validInvoice.lineItems[0], unitPrice: -100 }],
      };
      const errors = validateParsedInvoice(invalid);
      expect(errors).toContain('Line item 1: Unit price must be non-negative');
    });

    it('should fail validation if line item amount calculation is wrong', () => {
      const invalid = {
        ...validInvoice,
        lineItems: [
          {
            description: 'Test',
            quantity: 10,
            unitPrice: 1000,
            amount: 5000, // Should be 10000
          },
        ],
      };
      const errors = validateParsedInvoice(invalid);
      expect(errors).toContain('Line item 1: Amount calculation error');
    });

    it('should collect multiple validation errors', () => {
      const invalid: ParsedInvoice = {
        ...validInvoice,
        total: 0,
        supplierName: undefined,
        lineItems: [],
      };
      const errors = validateParsedInvoice(invalid);
      expect(errors.length).toBeGreaterThan(1);
    });
  });

  describe('convertToExpense', () => {
    const parsedInvoice: ParsedInvoice = {
      invoiceNumber: 'INV-12345',
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-14',
      supplierName: 'Example Ltd',
      lineItems: [
        {
          description: 'Office Supplies',
          quantity: 5,
          unitPrice: 2000,
          amount: 10000,
        },
        {
          description: 'Software License',
          quantity: 1,
          unitPrice: 5000,
          amount: 5000,
        },
      ],
      subtotal: 15000,
      vatRate: 20,
      vatAmount: 3000,
      total: 18000,
      currency: 'GBP',
      confidence: {
        overall: 0.95,
        invoiceNumber: 0.98,
        amounts: 0.97,
        dates: 0.92,
      },
    };

    it('should convert parsed invoice to expense format', () => {
      const userId = 'user_123';
      const expense = convertToExpense(parsedInvoice, userId);

      expect(expense.userId).toBe(userId);
      expect(expense.type).toBe('expense');
      expect(expense.supplier).toBe('Example Ltd');
      expect(expense.invoiceNumber).toBe('INV-12345');
      expect(expense.total).toBe(18000);
      expect(expense.paymentStatus).toBe('unpaid');
    });

    it('should combine line item descriptions', () => {
      const userId = 'user_123';
      const expense = convertToExpense(parsedInvoice, userId);

      expect(expense.description).toBe('Office Supplies, Software License');
    });

    it('should preserve all financial data', () => {
      const userId = 'user_123';
      const expense = convertToExpense(parsedInvoice, userId);

      expect(expense.subtotal).toBe(15000);
      expect(expense.vatRate).toBe(20);
      expect(expense.vatAmount).toBe(3000);
      expect(expense.total).toBe(18000);
      expect(expense.currency).toBe('GBP');
    });

    it('should include confidence scores', () => {
      const userId = 'user_123';
      const expense = convertToExpense(parsedInvoice, userId);

      expect(expense.confidence.overall).toBe(0.95);
      expect(expense.confidence.amounts).toBe(0.97);
    });

    it('should set category as uncategorized by default', () => {
      const userId = 'user_123';
      const expense = convertToExpense(parsedInvoice, userId);

      expect(expense.category).toBe('uncategorized');
    });
  });

  describe('estimateParsingCost', () => {
    it('should estimate cost for low detail parsing', () => {
      const cost = estimateParsingCost('low');
      expect(cost).toBe(765); // 0.765p
    });

    it('should estimate cost for high detail parsing', () => {
      const cost = estimateParsingCost('high');
      expect(cost).toBeGreaterThan(1000);
      expect(cost).toBeLessThan(3000);
    });

    it('should default to high detail', () => {
      const cost = estimateParsingCost();
      expect(cost).toBe(estimateParsingCost('high'));
    });
  });

  describe('isSupportedFormat', () => {
    it('should support JPEG images', () => {
      expect(isSupportedFormat('image/jpeg')).toBe(true);
      expect(isSupportedFormat('image/jpg')).toBe(true);
    });

    it('should support PNG images', () => {
      expect(isSupportedFormat('image/png')).toBe(true);
    });

    it('should support GIF images', () => {
      expect(isSupportedFormat('image/gif')).toBe(true);
    });

    it('should support WebP images', () => {
      expect(isSupportedFormat('image/webp')).toBe(true);
    });

    it('should support PDF files', () => {
      expect(isSupportedFormat('application/pdf')).toBe(true);
    });

    it('should reject unsupported formats', () => {
      expect(isSupportedFormat('image/bmp')).toBe(false);
      expect(isSupportedFormat('image/tiff')).toBe(false);
      expect(isSupportedFormat('application/msword')).toBe(false);
      expect(isSupportedFormat('text/plain')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isSupportedFormat('IMAGE/JPEG')).toBe(true);
      expect(isSupportedFormat('Image/Png')).toBe(true);
      expect(isSupportedFormat('APPLICATION/PDF')).toBe(true);
    });
  });

  describe('getSupportedFormats', () => {
    it('should return array of supported formats', () => {
      const formats = getSupportedFormats();

      expect(Array.isArray(formats)).toBe(true);
      expect(formats.length).toBeGreaterThan(0);
    });

    it('should include common image formats', () => {
      const formats = getSupportedFormats();

      expect(formats).toContain('image/jpeg');
      expect(formats).toContain('image/png');
      expect(formats).toContain('image/gif');
      expect(formats).toContain('image/webp');
    });

    it('should include PDF', () => {
      const formats = getSupportedFormats();
      expect(formats).toContain('application/pdf');
    });
  });

  describe('Invoice Data Scenarios', () => {
    it('should validate invoice with multiple line items', () => {
      const invoice: ParsedInvoice = {
        supplierName: 'Tech Supplies Ltd',
        lineItems: [
          {
            description: 'Laptop',
            quantity: 2,
            unitPrice: 80000,
            amount: 160000,
          },
          {
            description: 'Mouse',
            quantity: 3,
            unitPrice: 1500,
            amount: 4500,
          },
          {
            description: 'Keyboard',
            quantity: 2,
            unitPrice: 4000,
            amount: 8000,
          },
        ],
        subtotal: 172500,
        vatRate: 20,
        vatAmount: 34500,
        total: 207000,
        currency: 'GBP',
        confidence: {
          overall: 0.92,
          invoiceNumber: 0.95,
          amounts: 0.90,
          dates: 0.88,
        },
      };

      const errors = validateParsedInvoice(invoice);
      expect(errors).toHaveLength(0);
    });

    it('should validate invoice with zero VAT (VAT exempt)', () => {
      const invoice: ParsedInvoice = {
        supplierName: 'Educational Services',
        lineItems: [
          {
            description: 'Training Course',
            quantity: 1,
            unitPrice: 50000,
            amount: 50000,
          },
        ],
        subtotal: 50000,
        vatRate: 0,
        vatAmount: 0,
        total: 50000,
        currency: 'GBP',
        confidence: {
          overall: 0.85,
          invoiceNumber: 0.90,
          amounts: 0.85,
          dates: 0.80,
        },
      };

      const errors = validateParsedInvoice(invoice);
      expect(errors).toHaveLength(0);
    });

    it('should validate invoice with fractional quantities', () => {
      const invoice: ParsedInvoice = {
        supplierName: 'Consulting Ltd',
        lineItems: [
          {
            description: 'Consulting Hours',
            quantity: 7.5,
            unitPrice: 10000,
            amount: 75000,
          },
        ],
        subtotal: 75000,
        vatRate: 20,
        vatAmount: 15000,
        total: 90000,
        currency: 'GBP',
        confidence: {
          overall: 0.93,
          invoiceNumber: 0.96,
          amounts: 0.94,
          dates: 0.91,
        },
      };

      const errors = validateParsedInvoice(invoice);
      expect(errors).toHaveLength(0);
    });
  });
});

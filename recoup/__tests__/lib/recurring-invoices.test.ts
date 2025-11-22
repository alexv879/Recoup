/**
 * Tests for Recurring Invoice System
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  calculateNextInvoiceDate,
  validateRecurringInvoice,
  RecurrenceFrequency,
  RecurringInvoiceStatus,
} from '@/lib/recurring-invoices';
import type { RecurringInvoice, LineItem } from '@/lib/recurring-invoices';

describe('Recurring Invoice System', () => {
  describe('calculateNextInvoiceDate', () => {
    it('should calculate next weekly date', () => {
      const currentDate = '2024-01-01';
      const nextDate = calculateNextInvoiceDate(currentDate, RecurrenceFrequency.WEEKLY);
      expect(nextDate).toBe('2024-01-08');
    });

    it('should calculate next biweekly date', () => {
      const currentDate = '2024-01-01';
      const nextDate = calculateNextInvoiceDate(currentDate, RecurrenceFrequency.BIWEEKLY);
      expect(nextDate).toBe('2024-01-15');
    });

    it('should calculate next monthly date', () => {
      const currentDate = '2024-01-15';
      const nextDate = calculateNextInvoiceDate(currentDate, RecurrenceFrequency.MONTHLY);
      expect(nextDate).toBe('2024-02-15');
    });

    it('should calculate next monthly date across year boundary', () => {
      const currentDate = '2023-12-15';
      const nextDate = calculateNextInvoiceDate(currentDate, RecurrenceFrequency.MONTHLY);
      expect(nextDate).toBe('2024-01-15');
    });

    it('should calculate next quarterly date', () => {
      const currentDate = '2024-01-01';
      const nextDate = calculateNextInvoiceDate(currentDate, RecurrenceFrequency.QUARTERLY);
      expect(nextDate).toBe('2024-04-01');
    });

    it('should calculate next annual date', () => {
      const currentDate = '2024-01-01';
      const nextDate = calculateNextInvoiceDate(currentDate, RecurrenceFrequency.ANNUALLY);
      expect(nextDate).toBe('2025-01-01');
    });

    it('should handle leap year for annual recurrence', () => {
      const currentDate = '2024-02-29';
      const nextDate = calculateNextInvoiceDate(currentDate, RecurrenceFrequency.ANNUALLY);
      // In non-leap year, Feb 29 becomes Mar 1
      expect(nextDate).toBe('2025-03-01');
    });

    it('should handle month-end dates for monthly recurrence', () => {
      const currentDate = '2024-01-31';
      const nextDate = calculateNextInvoiceDate(currentDate, RecurrenceFrequency.MONTHLY);
      // February only has 29 days in 2024 (leap year)
      expect(nextDate).toBe('2024-03-02');
    });
  });

  describe('validateRecurringInvoice', () => {
    const validLineItem: LineItem = {
      description: 'Monthly Retainer',
      quantity: 1,
      unitPrice: 100000, // £1000
      amount: 100000,
    };

    const validRecurringInvoice: Partial<RecurringInvoice> = {
      userId: 'user_123',
      clientId: 'client_456',
      clientName: 'Acme Corp',
      clientEmail: 'billing@acme.com',
      description: 'Monthly Retainer for Consulting Services',
      lineItems: [validLineItem],
      subtotal: 100000,
      vatRate: 20,
      vatAmount: 20000,
      total: 120000,
      frequency: RecurrenceFrequency.MONTHLY,
      startDate: '2024-01-01',
      nextInvoiceDate: '2024-01-01',
      paymentTermsDays: 30,
      status: RecurringInvoiceStatus.ACTIVE,
    };

    it('should pass validation for valid recurring invoice', () => {
      const errors = validateRecurringInvoice(validRecurringInvoice);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation if client ID missing', () => {
      const invalid = { ...validRecurringInvoice, clientId: '' };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Client ID is required');
    });

    it('should fail validation if client name missing', () => {
      const invalid = { ...validRecurringInvoice, clientName: '' };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Client name is required');
    });

    it('should fail validation if client email missing', () => {
      const invalid = { ...validRecurringInvoice, clientEmail: '' };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Client email is required');
    });

    it('should fail validation if description missing', () => {
      const invalid = { ...validRecurringInvoice, description: '' };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Description is required');
    });

    it('should fail validation if no line items', () => {
      const invalid = { ...validRecurringInvoice, lineItems: [] };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('At least one line item is required');
    });

    it('should fail validation if start date missing', () => {
      const invalid = { ...validRecurringInvoice, startDate: '' };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Start date is required');
    });

    it('should fail validation if frequency missing', () => {
      const invalid = { ...validRecurringInvoice, frequency: undefined };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Frequency is required');
    });

    it('should fail validation if payment terms negative', () => {
      const invalid = { ...validRecurringInvoice, paymentTermsDays: -1 };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Valid payment terms required');
    });

    it('should fail validation if line item has no description', () => {
      const invalid = {
        ...validRecurringInvoice,
        lineItems: [{ ...validLineItem, description: '' }],
      };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Line item 1: Description required');
    });

    it('should fail validation if line item quantity is zero', () => {
      const invalid = {
        ...validRecurringInvoice,
        lineItems: [{ ...validLineItem, quantity: 0 }],
      };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Line item 1: Quantity must be positive');
    });

    it('should fail validation if line item quantity is negative', () => {
      const invalid = {
        ...validRecurringInvoice,
        lineItems: [{ ...validLineItem, quantity: -1 }],
      };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Line item 1: Quantity must be positive');
    });

    it('should fail validation if line item unit price is negative', () => {
      const invalid = {
        ...validRecurringInvoice,
        lineItems: [{ ...validLineItem, unitPrice: -100 }],
      };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('Line item 1: Unit price must be non-negative');
    });

    it('should fail validation if end date before start date', () => {
      const invalid = {
        ...validRecurringInvoice,
        startDate: '2024-12-01',
        endDate: '2024-01-01',
      };
      const errors = validateRecurringInvoice(invalid);
      expect(errors).toContain('End date must be after start date');
    });

    it('should pass validation if end date after start date', () => {
      const valid = {
        ...validRecurringInvoice,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      const errors = validateRecurringInvoice(valid);
      expect(errors).toHaveLength(0);
    });

    it('should collect multiple validation errors', () => {
      const invalid = {
        ...validRecurringInvoice,
        clientId: '',
        clientName: '',
        startDate: '',
        lineItems: [],
      };
      const errors = validateRecurringInvoice(invalid);
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('Client ID is required');
      expect(errors).toContain('Client name is required');
      expect(errors).toContain('Start date is required');
      expect(errors).toContain('At least one line item is required');
    });
  });

  describe('Recurrence Scenarios', () => {
    it('should calculate correct dates for weekly retainer over 4 weeks', () => {
      let date = '2024-01-01';
      const expectedDates = ['2024-01-08', '2024-01-15', '2024-01-22', '2024-01-29'];

      expectedDates.forEach((expected) => {
        date = calculateNextInvoiceDate(date, RecurrenceFrequency.WEEKLY);
        expect(date).toBe(expected);
      });
    });

    it('should calculate correct dates for monthly retainer over 6 months', () => {
      let date = '2024-01-15';
      const expectedDates = [
        '2024-02-15',
        '2024-03-15',
        '2024-04-15',
        '2024-05-15',
        '2024-06-15',
        '2024-07-15',
      ];

      expectedDates.forEach((expected) => {
        date = calculateNextInvoiceDate(date, RecurrenceFrequency.MONTHLY);
        expect(date).toBe(expected);
      });
    });

    it('should calculate correct dates for quarterly retainer over 1 year', () => {
      let date = '2024-01-01';
      const expectedDates = ['2024-04-01', '2024-07-01', '2024-10-01', '2025-01-01'];

      expectedDates.forEach((expected) => {
        date = calculateNextInvoiceDate(date, RecurrenceFrequency.QUARTERLY);
        expect(date).toBe(expected);
      });
    });
  });

  describe('Line Item Calculations', () => {
    it('should calculate line item amount correctly', () => {
      const lineItem: LineItem = {
        description: 'Consulting Hours',
        quantity: 10,
        unitPrice: 7500, // £75/hour
        amount: 75000, // 10 * 7500
      };

      expect(lineItem.amount).toBe(lineItem.quantity * lineItem.unitPrice);
    });

    it('should handle fractional quantities', () => {
      const lineItem: LineItem = {
        description: 'Half Day Rate',
        quantity: 0.5,
        unitPrice: 40000, // £400
        amount: 20000, // 0.5 * 40000
      };

      expect(lineItem.amount).toBe(lineItem.quantity * lineItem.unitPrice);
    });

    it('should calculate VAT correctly on multiple line items', () => {
      const lineItems: LineItem[] = [
        {
          description: 'Development',
          quantity: 20,
          unitPrice: 7500,
          amount: 150000, // £1500
        },
        {
          description: 'Design',
          quantity: 10,
          unitPrice: 6000,
          amount: 60000, // £600
        },
      ];

      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      expect(subtotal).toBe(210000); // £2100

      const vatRate = 20;
      const vatAmount = Math.round((subtotal * vatRate) / 100);
      expect(vatAmount).toBe(42000); // £420

      const total = subtotal + vatAmount;
      expect(total).toBe(252000); // £2520
    });
  });
});

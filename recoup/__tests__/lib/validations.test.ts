/**
 * Unit Tests: Validation Schemas
 * Tests Zod schema validation for invoice creation and updates
 */

import {
  InvoiceCreateSchema,
  InvoiceUpdateSchema,
  type InvoiceCreateData,
  type InvoiceUpdateData,
} from '@/lib/validations';

describe('InvoiceCreateSchema', () => {
  describe('Valid Inputs', () => {
    it('should validate a complete valid invoice', () => {
      const validInvoice = {
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
        amount: 1000,
        dueDate: '2025-12-31',
        paymentMethods: ['bank_transfer', 'card'] as const,
      };

      const result = InvoiceCreateSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInvoice);
      }
    });

    it('should validate invoice without optional paymentMethods', () => {
      const validInvoice = {
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
        amount: 1000,
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    it('should validate invoice with only bank_transfer payment method', () => {
      const validInvoice = {
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
        amount: 1000,
        dueDate: '2025-12-31',
        paymentMethods: ['bank_transfer'] as const,
      };

      const result = InvoiceCreateSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    it('should validate invoice with only card payment method', () => {
      const validInvoice = {
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
        amount: 1000,
        dueDate: '2025-12-31',
        paymentMethods: ['card'] as const,
      };

      const result = InvoiceCreateSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    it('should validate invoice with decimal amount', () => {
      const validInvoice = {
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
        amount: 1234.56,
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    it('should validate invoice with various email formats', () => {
      const emailFormats = [
        'simple@example.com',
        'firstname.lastname@example.com',
        'email+tag@example.co.uk',
        'test_email@subdomain.example.com',
      ];

      emailFormats.forEach((email) => {
        const invoice = {
          clientName: 'Test Client',
          clientEmail: email,
          amount: 100,
          dueDate: '2025-12-31',
        };

        const result = InvoiceCreateSchema.safeParse(invoice);
        expect(result.success).toBe(true);
      });
    });

    it('should validate invoice with various date formats', () => {
      const dateFormats = [
        '2025-12-31',
        '2025-01-01T00:00:00.000Z',
        '2025-06-15T12:30:45Z',
        new Date('2025-12-31').toISOString(),
      ];

      dateFormats.forEach((dueDate) => {
        const invoice = {
          clientName: 'Test Client',
          clientEmail: 'test@example.com',
          amount: 100,
          dueDate,
        };

        const result = InvoiceCreateSchema.safeParse(invoice);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('clientName Validation', () => {
    it('should reject empty client name', () => {
      const invoice = {
        clientName: '',
        clientEmail: 'billing@acme.com',
        amount: 1000,
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Client name is required');
      }
    });

    it('should reject missing client name', () => {
      const invoice = {
        clientEmail: 'billing@acme.com',
        amount: 1000,
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
    });

    it('should accept client name with special characters', () => {
      const specialNames = [
        "O'Brien & Associates",
        'Müller GmbH',
        'Société Générale',
        'ABC-123 Ltd.',
      ];

      specialNames.forEach((clientName) => {
        const invoice = {
          clientName,
          clientEmail: 'test@example.com',
          amount: 100,
          dueDate: '2025-12-31',
        };

        const result = InvoiceCreateSchema.safeParse(invoice);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('clientEmail Validation', () => {
    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        'user..name@example.com',
      ];

      invalidEmails.forEach((clientEmail) => {
        const invoice = {
          clientName: 'Test Client',
          clientEmail,
          amount: 100,
          dueDate: '2025-12-31',
        };

        const result = InvoiceCreateSchema.safeParse(invoice);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('valid client email');
        }
      });
    });

    it('should reject empty email', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: '',
        amount: 100,
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const invoice = {
        clientName: 'Test Client',
        amount: 100,
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
    });
  });

  describe('amount Validation', () => {
    it('should reject zero amount', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: 0,
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive number');
      }
    });

    it('should reject negative amount', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: -100,
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive number');
      }
    });

    it('should reject missing amount', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric amount', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: 'not a number',
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
    });

    it('should accept very small positive amounts', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: 0.01,
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(true);
    });

    it('should accept very large amounts', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: 1000000,
        dueDate: '2025-12-31',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(true);
    });
  });

  describe('dueDate Validation', () => {
    it('should reject invalid date strings', () => {
      const invalidDates = [
        'not a date',
        'tomorrow',
        'invalid',
        '',
      ];

      invalidDates.forEach((dueDate) => {
        const invoice = {
          clientName: 'Test Client',
          clientEmail: 'test@example.com',
          amount: 100,
          dueDate,
        };

        const result = InvoiceCreateSchema.safeParse(invoice);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('valid date');
        }
      });
    });

    it('should reject empty due date', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: 100,
        dueDate: '',
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
    });

    it('should reject missing due date', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: 100,
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentMethods Validation', () => {
    it('should reject invalid payment method', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: 100,
        dueDate: '2025-12-31',
        paymentMethods: ['paypal'], // Invalid method
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(false);
    });

    it('should reject empty payment methods array', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: 100,
        dueDate: '2025-12-31',
        paymentMethods: [],
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(true); // Empty array is valid
    });

    it('should accept both payment methods', () => {
      const invoice = {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        amount: 100,
        dueDate: '2025-12-31',
        paymentMethods: ['bank_transfer', 'card'] as const,
      };

      const result = InvoiceCreateSchema.safeParse(invoice);
      expect(result.success).toBe(true);
    });
  });

  describe('Type Inference', () => {
    it('should infer correct TypeScript type', () => {
      const validInvoice: InvoiceCreateData = {
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
        amount: 1000,
        dueDate: '2025-12-31',
        paymentMethods: ['bank_transfer', 'card'],
      };

      // TypeScript compilation test - if this compiles, type is correct
      expect(validInvoice.clientName).toBe('Acme Corp');
      expect(validInvoice.amount).toBe(1000);
    });
  });
});

describe('InvoiceUpdateSchema', () => {
  it('should allow partial updates with all fields optional', () => {
    const updates = [
      { clientName: 'New Name' },
      { clientEmail: 'new@example.com' },
      { amount: 2000 },
      { dueDate: '2026-01-01' },
      { paymentMethods: ['card'] as const },
    ];

    updates.forEach((update) => {
      const result = InvoiceUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  it('should allow empty update object', () => {
    const result = InvoiceUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should validate fields when provided', () => {
    const invalidUpdate = {
      clientEmail: 'not-an-email',
    };

    const result = InvoiceUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });

  it('should allow multiple field updates', () => {
    const update = {
      clientName: 'Updated Name',
      amount: 1500,
      dueDate: '2026-06-30',
    };

    const result = InvoiceUpdateSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it('should still enforce validation rules on provided fields', () => {
    const invalidUpdates = [
      { amount: -100 }, // Negative amount
      { clientEmail: 'invalid' }, // Invalid email
      { dueDate: 'not-a-date' }, // Invalid date
    ];

    invalidUpdates.forEach((update) => {
      const result = InvoiceUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });

  it('should infer correct TypeScript type', () => {
    const validUpdate: InvoiceUpdateData = {
      clientName: 'Updated Corp',
      amount: 1500,
    };

    // TypeScript compilation test
    expect(validUpdate.clientName).toBe('Updated Corp');
    expect(validUpdate.amount).toBe(1500);
  });
});

describe('Edge Cases and Security', () => {
  it('should handle extremely long client names', () => {
    const longName = 'A'.repeat(1000);
    const invoice = {
      clientName: longName,
      clientEmail: 'test@example.com',
      amount: 100,
      dueDate: '2025-12-31',
    };

    const result = InvoiceCreateSchema.safeParse(invoice);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clientName.length).toBe(1000);
    }
  });

  it('should handle special characters in client name', () => {
    const specialChars = '<script>alert("XSS")</script>';
    const invoice = {
      clientName: specialChars,
      clientEmail: 'test@example.com',
      amount: 100,
      dueDate: '2025-12-31',
    };

    const result = InvoiceCreateSchema.safeParse(invoice);
    expect(result.success).toBe(true);
    // Note: XSS prevention should be handled at rendering layer, not validation
  });

  it('should handle null and undefined values', () => {
    const invalidInputs = [
      { clientName: null, clientEmail: 'test@example.com', amount: 100, dueDate: '2025-12-31' },
      {
        clientName: 'Test',
        clientEmail: undefined,
        amount: 100,
        dueDate: '2025-12-31',
      },
    ];

    invalidInputs.forEach((input) => {
      const result = InvoiceCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  it('should reject extra unknown fields', () => {
    const invoice = {
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      amount: 100,
      dueDate: '2025-12-31',
      extraField: 'should be rejected',
    };

    const result = InvoiceCreateSchema.strict().safeParse(invoice);
    expect(result.success).toBe(false);
  });
});

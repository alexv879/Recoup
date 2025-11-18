import { z } from 'zod';

/**
 * Schema for validating the creation of a new invoice.
 * Based on the API endpoint definition in the technical specification.
 */
export const InvoiceCreateSchema = z.object({
    clientName: z.string().min(1, { message: 'Client name is required.' }),
    clientEmail: z.string().email({ message: 'A valid client email is required.' }),
    amount: z.number().positive({ message: 'Amount must be a positive number.' }),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Due date must be a valid date.',
    }),
    paymentMethods: z.array(z.enum(['bank_transfer', 'card'])).optional(),
});

// Export the inferred TypeScript type for use in other parts of the application
export type InvoiceCreateData = z.infer<typeof InvoiceCreateSchema>;

/**
 * Schema for validating updates to an existing invoice.
 * All fields are optional.
 */
export const InvoiceUpdateSchema = InvoiceCreateSchema.partial();
export type InvoiceUpdateData = z.infer<typeof InvoiceUpdateSchema>;
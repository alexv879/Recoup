import { z } from 'zod';

/**
 * Validation schemas for Client Profitability Service
 * Prevents injection attacks and ensures data integrity
 */

export const TimeEntrySchema = z.object({
  id: z.string().optional(),
  hours: z.number().positive().max(1000), // Max 1000 hours per entry
  hourlyRate: z.number().positive().max(10000), // Max £10k/hour
  date: z.date().or(z.string().datetime()).optional(),
  description: z.string().max(500).optional(),
  billable: z.boolean().optional(),
});

export const CostToServeEntrySchema = z.object({
  id: z.string().optional(),
  type: z.enum(['meeting', 'email', 'revision', 'support', 'admin']),
  description: z.string().min(1).max(500),
  timeSpent: z.number().positive().max(480), // Max 8 hours (in minutes)
  hourlyRate: z.number().positive().max(10000),
  date: z.date().or(z.string().datetime()).optional(),
});

export const InvoiceDataSchema = z.object({
  amount: z.number().positive().max(10000000), // Max £10M per invoice
  amountPaid: z.number().nonnegative().max(10000000),
  date: z.date().or(z.string().datetime()).optional(),
});

export const ClientProfitabilityAnalysisSchema = z.object({
  clientId: z.string().uuid('Invalid client ID format'),
  clientName: z.string().min(1).max(200),
  invoices: z.array(InvoiceDataSchema).min(1).max(1000), // Max 1000 invoices
  timeEntries: z.array(TimeEntrySchema).max(10000), // Max 10k time entries
  costToServeEntries: z.array(CostToServeEntrySchema).max(5000),
  defaultHourlyRate: z.number().positive().max(10000),
});

export const ClientHealthCalculationSchema = z.object({
  clientId: z.string().uuid(),
  profitabilityAnalysis: z.object({
    profitability: z.object({
      grossMargin: z.number(),
      netMargin: z.number(),
    }),
  }),
  paymentHistory: z.object({
    onTimeRate: z.number().min(0).max(100),
    averageDaysLate: z.number().nonnegative(),
  }),
  engagement: z.object({
    daysSinceLastInvoice: z.number().nonnegative(),
    invoiceFrequency: z.number().positive(),
  }),
});

export const CostToServeTrackingSchema = z.object({
  clientId: z.string().uuid(),
  type: z.enum(['meeting', 'email', 'revision', 'support', 'admin']),
  description: z.string().min(1).max(500),
  timeSpent: z.number().positive().max(480), // Minutes
  hourlyRate: z.number().positive().max(10000),
});

export const PricingRecommendationSchema = z.object({
  analysis: z.object({
    costs: z.object({
      averageHourlyRate: z.number(),
    }),
    profitability: z.object({
      netMargin: z.number(),
    }),
  }),
  targetMargin: z.number().min(0).max(100), // Percentage
});

// Type exports
export type TimeEntry = z.infer<typeof TimeEntrySchema>;
export type CostToServeEntry = z.infer<typeof CostToServeEntrySchema>;
export type InvoiceData = z.infer<typeof InvoiceDataSchema>;
export type ClientProfitabilityAnalysisInput = z.infer<typeof ClientProfitabilityAnalysisSchema>;

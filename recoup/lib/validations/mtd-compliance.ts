import { z } from 'zod';

/**
 * Validation schemas for MTD Compliance Service
 * Critical for UK tax compliance - strict validation required
 */

export const HMRCCredentialsSchema = z.object({
  utr: z.string()
    .regex(/^[0-9]{10}$/, 'UTR must be 10 digits'),
  nino: z.string()
    .regex(/^[A-Z]{2}[0-9]{6}[A-D]$/, 'Invalid National Insurance Number format')
    .optional(),
  mtdId: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiry: z.date().or(z.string().datetime()).optional(),
});

export const BusinessDetailsSchema = z.object({
  tradingName: z.string().max(200).optional(),
  businessType: z.enum(['self_employed', 'partnership']),
  accountingPeriodStart: z.date().or(z.string().datetime()),
  accountingPeriodEnd: z.date().or(z.string().datetime()),
  cashBasis: z.boolean(),
});

export const ThresholdsSchema = z.object({
  annualIncome: z.number().nonnegative().max(100000000),
  mtdThreshold: z.number().positive(), // £50k, £30k, or £20k
  year: z.number().int().min(2020).max(2100),
});

export const QuarterlySubmissionSchema = z.object({
  id: z.string().uuid().optional(),
  quarter: z.number().int().min(1).max(4),
  taxYear: z.string().regex(/^\d{4}\/\d{4}$/, 'Tax year must be in format YYYY/YYYY'),

  income: z.object({
    totalIncome: z.number().nonnegative().max(100000000),
    bySource: z.record(z.string(), z.number().nonnegative()),
  }),

  expenses: z.object({
    totalAllowable: z.number().nonnegative().max(100000000),
    byCategory: z.record(z.string(), z.number().nonnegative()),
    simplifiedExpenses: z.object({
      homeOffice: z.number().nonnegative().max(5000), // Max £26/month * 12 = £312/year
      mileage: z.number().nonnegative().max(100000), // Max mileage expenses
    }).optional(),
  }),

  profit: z.object({
    grossProfit: z.number().max(100000000),
    netProfit: z.number().max(100000000),
  }),

  status: z.enum(['not_started', 'in_progress', 'ready', 'submitted', 'accepted', 'rejected']).optional(),
  dueDate: z.date().or(z.string().datetime()),
  validationErrors: z.array(z.string()).optional(),
});

export const MTDSettingsSchema = z.object({
  userId: z.string().min(1),
  enabled: z.boolean(),
  hmrcCredentials: HMRCCredentialsSchema.optional(),
  businessDetails: BusinessDetailsSchema,
  thresholds: ThresholdsSchema,
  submissions: z.array(QuarterlySubmissionSchema).max(20).optional(),
  readinessScore: z.number().min(0).max(100).optional(),
});

export const IncomeEntrySchema = z.object({
  amount: z.number().positive().max(10000000),
  source: z.string().min(1).max(200),
  date: z.date().or(z.string().datetime()),
  invoiceId: z.string().uuid().optional(),
});

export const ExpenseEntrySchema = z.object({
  amount: z.number().positive().max(1000000),
  category: z.string().min(1).max(200),
  taxDeductible: z.boolean(),
  date: z.date().or(z.string().datetime()),
  receiptUrl: z.string().url().optional(),
});

export const MileageEntrySchema = z.object({
  miles: z.number().positive().max(500000), // Max 500k miles
  vehicleType: z.enum(['car', 'motorcycle', 'bicycle']),
  date: z.date().or(z.string().datetime()),
  purpose: z.string().max(500).optional(),
});

export const QuarterlySubmissionGenerationSchema = z.object({
  userId: z.string().min(1),
  quarter: z.number().int().min(1).max(4),
  taxYear: z.string().regex(/^\d{4}\/\d{4}$/),
  income: z.array(IncomeEntrySchema).max(10000),
  expenses: z.array(ExpenseEntrySchema).max(10000),
  homeOfficeHours: z.number().nonnegative().max(8760).optional(), // Max hours in a year
  mileage: z.array(MileageEntrySchema).max(1000).optional(),
});

export const HMRCSubmissionSchema = z.object({
  submission: QuarterlySubmissionSchema,
  settings: MTDSettingsSchema,
});

export const MTDReadinessSchema = z.object({
  settings: MTDSettingsSchema,
  hasDigitalRecords: z.boolean(),
  quarterlySubmissionsOnTime: z.number().int().min(0).max(4),
});

export const MTDApplicabilitySchema = z.object({
  annualIncome: z.number().nonnegative().max(100000000),
  taxYear: z.number().int().min(2020).max(2100),
});

export const EndOfYearDeclarationSchema = z.object({
  userId: z.string().min(1),
  taxYear: z.string().regex(/^\d{4}\/\d{4}$/),
  quarterlySubmissions: z.array(QuarterlySubmissionSchema).length(4), // Must have 4 quarters
  capitalAllowances: z.number().nonnegative().max(10000000).optional(),
  lossesCarriedForward: z.number().nonnegative().max(10000000).optional(),
});

// Type exports
export type HMRCCredentials = z.infer<typeof HMRCCredentialsSchema>;
export type BusinessDetails = z.infer<typeof BusinessDetailsSchema>;
export type Thresholds = z.infer<typeof ThresholdsSchema>;
export type QuarterlySubmission = z.infer<typeof QuarterlySubmissionSchema>;
export type MTDSettings = z.infer<typeof MTDSettingsSchema>;
export type IncomeEntry = z.infer<typeof IncomeEntrySchema>;
export type ExpenseEntry = z.infer<typeof ExpenseEntrySchema>;
export type MileageEntry = z.infer<typeof MileageEntrySchema>;
export type QuarterlySubmissionGenerationInput = z.infer<typeof QuarterlySubmissionGenerationSchema>;
export type HMRCSubmissionInput = z.infer<typeof HMRCSubmissionSchema>;
export type MTDReadinessInput = z.infer<typeof MTDReadinessSchema>;
export type EndOfYearDeclarationInput = z.infer<typeof EndOfYearDeclarationSchema>;

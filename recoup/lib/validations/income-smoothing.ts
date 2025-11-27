import { z } from 'zod';

/**
 * Validation schemas for Income Smoothing Service
 */

export const SavingsRulesSchema = z.object({
  excessPercentage: z.number().min(0).max(100), // Percentage to save
  minimumSavings: z.number().nonnegative().max(10000000),
  emergencyFundGoal: z.number().positive().max(10000000),
  autoContribute: z.boolean(),
});

export const BufferTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.date().or(z.string().datetime()),
  amount: z.number().max(10000000), // Can be negative for withdrawals
  type: z.enum(['contribution', 'withdrawal']),
  reason: z.string().max(500).optional(),
});

export const BufferAccountSchema = z.object({
  currentBalance: z.number().nonnegative().max(10000000),
  transactions: z.array(BufferTransactionSchema).max(10000),
});

export const EmergencyFundSchema = z.object({
  currentBalance: z.number().nonnegative().max(10000000),
  goal: z.number().positive().max(10000000),
  monthsCovered: z.number().nonnegative().max(24), // Max 2 years
});

export const IncomeSmoothingSettingsSchema = z.object({
  userId: z.string().min(1),
  enabled: z.boolean(),
  targetMonthlyIncome: z.number().positive().max(1000000),
  savingsRules: SavingsRulesSchema,
  bufferAccount: BufferAccountSchema,
  emergencyFund: EmergencyFundSchema,
});

export const IncomeSmoothingActionSchema = z.object({
  monthlyIncome: z.number().nonnegative().max(10000000),
  targetMonthlyIncome: z.number().positive().max(1000000),
  savingsRules: SavingsRulesSchema,
  currentBufferBalance: z.number().nonnegative().max(10000000),
});

export const MonthlyForecastSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in format YYYY-MM'),
  projectedIncome: z.number().nonnegative().max(10000000),
  projectedExpenses: z.number().nonnegative().max(10000000),
  projectedSurplus: z.number().max(10000000),
  confidence: z.enum(['low', 'medium', 'high']),
  bufferBalance: z.number().nonnegative().max(10000000),
});

export const HistoricalDataSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.number().nonnegative().max(10000000),
});

export const PendingInvoiceSchema = z.object({
  amount: z.number().positive().max(10000000),
  dueDate: z.date().or(z.string().datetime()),
  probabilityScore: z.number().min(0).max(100),
});

export const RecurringExpenseSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().positive().max(1000000),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'annually']),
});

export const CashFlowForecastSchema = z.object({
  userId: z.string().min(1),
  months: z.number().int().min(3).max(24), // 3 to 24 months
  historicalIncome: z.array(HistoricalDataSchema)
    .min(3, 'Need at least 3 months of historical data')
    .max(120), // Max 10 years
  historicalExpenses: z.array(HistoricalDataSchema)
    .min(3)
    .max(120),
  pendingInvoices: z.array(PendingInvoiceSchema).max(1000),
  recurringExpenses: z.array(RecurringExpenseSchema).max(100),
  currentBufferBalance: z.number().nonnegative().max(10000000),
});

export const ClientDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  lastInvoiceDate: z.date().or(z.string().datetime()),
  totalRevenue: z.number().nonnegative().max(100000000),
  averageInvoiceValue: z.number().nonnegative().max(10000000).optional(),
});

export const IncomeDroughtDetectionSchema = z.object({
  userId: z.string().min(1),
  currentMonthIncome: z.number().nonnegative().max(10000000),
  historicalIncome: z.array(HistoricalDataSchema).min(3).max(120),
  targetMonthlyIncome: z.number().positive().max(1000000),
  clients: z.array(ClientDataSchema).max(1000),
});

export const ClientHistorySchema = z.object({
  invoices: z.array(z.object({
    amount: z.number().positive().max(10000000),
    dueDate: z.date().or(z.string().datetime()),
    paidDate: z.date().or(z.string().datetime()).optional(),
    status: z.enum(['paid', 'pending', 'overdue']),
  })).max(1000),
});

export const PaymentProbabilitySchema = z.object({
  clientId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  invoiceAmount: z.number().positive().max(10000000),
  dueDate: z.date().or(z.string().datetime()),
  clientHistory: ClientHistorySchema,
});

// Type exports
export type SavingsRules = z.infer<typeof SavingsRulesSchema>;
export type BufferTransaction = z.infer<typeof BufferTransactionSchema>;
export type BufferAccount = z.infer<typeof BufferAccountSchema>;
export type EmergencyFund = z.infer<typeof EmergencyFundSchema>;
export type IncomeSmoothingSettings = z.infer<typeof IncomeSmoothingSettingsSchema>;
export type IncomeSmoothingActionInput = z.infer<typeof IncomeSmoothingActionSchema>;
export type MonthlyForecast = z.infer<typeof MonthlyForecastSchema>;
export type HistoricalData = z.infer<typeof HistoricalDataSchema>;
export type PendingInvoice = z.infer<typeof PendingInvoiceSchema>;
export type RecurringExpense = z.infer<typeof RecurringExpenseSchema>;
export type CashFlowForecastInput = z.infer<typeof CashFlowForecastSchema>;
export type ClientData = z.infer<typeof ClientDataSchema>;
export type IncomeDroughtDetectionInput = z.infer<typeof IncomeDroughtDetectionSchema>;
export type ClientHistory = z.infer<typeof ClientHistorySchema>;
export type PaymentProbabilityInput = z.infer<typeof PaymentProbabilitySchema>;

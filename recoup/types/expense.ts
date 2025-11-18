/**
 * Expense Tracking Types
 * For UK freelancers and self-employed
 */

export interface Expense {
  id: string;
  userId: string;
  clientId?: string; // Optional: bill to client
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: Date;
  description: string;
  merchant?: string;
  receiptUrl?: string;
  taxDeductible: boolean;
  billable: boolean;
  billed: boolean;
  invoiceId?: string; // If billed, link to invoice
  paymentMethod?: PaymentMethod;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ExpenseCategory {
  // HMRC Allowable Expenses for Self-Employed
  OFFICE_COSTS = 'office_costs', // Stationery, phone bills
  TRAVEL_COSTS = 'travel_costs', // Fuel, parking, train/bus fares (not home to work)
  CLOTHING = 'clothing', // Uniforms, protective clothing only
  STAFF_COSTS = 'staff_costs', // Salaries, bonuses, pensions, benefits
  RESELLING_GOODS = 'reselling_goods', // Stock, raw materials
  LEGAL_FINANCIAL = 'legal_financial', // Insurance, accountant fees, legal fees
  MARKETING = 'marketing', // Advertising, website costs, trade shows
  TRAINING_COURSES = 'training_courses', // Professional development
  SUBSCRIPTIONS = 'subscriptions', // Software, professional memberships
  ACCOMMODATION = 'accommodation', // Hotels for business trips
  MEALS = 'meals', // Business meals with clients
  EQUIPMENT = 'equipment', // Computers, tools, machinery
  VEHICLE_COSTS = 'vehicle_costs', // Business vehicle expenses
  RENT = 'rent', // Office rent
  UTILITIES = 'utilities', // Electricity, gas, water for business premises
  BUSINESS_RATES = 'business_rates', // Council tax for business property
  PHONE_INTERNET = 'phone_internet', // Business portion
  PROFESSIONAL_FEES = 'professional_fees', // Accountant, solicitor
  BANK_CHARGES = 'bank_charges', // Business account fees
  SUBCONTRACTORS = 'subcontractors', // Payments to freelancers/contractors
  OTHER = 'other', // Other allowable expenses
}

export enum PaymentMethod {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  OTHER = 'other',
}

export interface ExpenseSummary {
  totalExpenses: number;
  taxDeductibleTotal: number;
  billableTotal: number;
  unbilledTotal: number;
  byCategory: Record<ExpenseCategory, number>;
  byMonth: Record<string, number>; // "2025-01": 500.00
  currency: string;
}

export interface ReceiptOCRResult {
  merchant?: string;
  date?: Date;
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  confidence: number; // 0-1
  extractedText: string;
  suggestions: {
    description: string;
    taxDeductible: boolean;
  };
}

// HMRC Simplified Expenses (alternative to actual costs)
export interface SimplifiedExpenses {
  useSimplified: boolean;
  homeOfficeHours: number; // Hours worked from home per month
  homeOfficeAllowance: number; // £4/month (25-50hrs), £10/month (51-100hrs), £18/month (100+hrs)
  vehicleMiles: number;
  vehicleAllowance: number; // 45p/mile first 10,000, 25p after
}

export const HMRC_MILEAGE_RATES = {
  CAR_VAN_FIRST_10K: 0.45, // £0.45 per mile
  CAR_VAN_OVER_10K: 0.25, // £0.25 per mile
  MOTORCYCLE: 0.24, // £0.24 per mile
  BICYCLE: 0.20, // £0.20 per mile
};

export const HMRC_HOME_OFFICE_RATES = {
  HOURS_25_TO_50: 10, // £10 per month
  HOURS_51_TO_100: 18, // £18 per month
  HOURS_OVER_100: 26, // £26 per month
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.OFFICE_COSTS]: 'Office Costs',
  [ExpenseCategory.TRAVEL_COSTS]: 'Travel Costs',
  [ExpenseCategory.CLOTHING]: 'Clothing (Uniforms)',
  [ExpenseCategory.STAFF_COSTS]: 'Staff Costs',
  [ExpenseCategory.RESELLING_GOODS]: 'Stock & Materials',
  [ExpenseCategory.LEGAL_FINANCIAL]: 'Legal & Financial',
  [ExpenseCategory.MARKETING]: 'Marketing & Advertising',
  [ExpenseCategory.TRAINING_COURSES]: 'Training & Development',
  [ExpenseCategory.SUBSCRIPTIONS]: 'Software & Subscriptions',
  [ExpenseCategory.ACCOMMODATION]: 'Accommodation',
  [ExpenseCategory.MEALS]: 'Business Meals',
  [ExpenseCategory.EQUIPMENT]: 'Equipment',
  [ExpenseCategory.VEHICLE_COSTS]: 'Vehicle Costs',
  [ExpenseCategory.RENT]: 'Rent',
  [ExpenseCategory.UTILITIES]: 'Utilities',
  [ExpenseCategory.BUSINESS_RATES]: 'Business Rates',
  [ExpenseCategory.PHONE_INTERNET]: 'Phone & Internet',
  [ExpenseCategory.PROFESSIONAL_FEES]: 'Professional Fees',
  [ExpenseCategory.BANK_CHARGES]: 'Bank Charges',
  [ExpenseCategory.SUBCONTRACTORS]: 'Subcontractors',
  [ExpenseCategory.OTHER]: 'Other',
};

export const TAX_DEDUCTIBLE_INFO: Record<ExpenseCategory, string> = {
  [ExpenseCategory.OFFICE_COSTS]: '✅ Fully deductible - stationery, postage, phone bills',
  [ExpenseCategory.TRAVEL_COSTS]: '✅ Deductible - business travel only (not home to work commute)',
  [ExpenseCategory.CLOTHING]: '⚠️ Only uniforms and protective clothing',
  [ExpenseCategory.STAFF_COSTS]: '✅ Fully deductible - salaries, bonuses, pensions',
  [ExpenseCategory.RESELLING_GOODS]: '✅ Fully deductible - stock, raw materials',
  [ExpenseCategory.LEGAL_FINANCIAL]: '✅ Fully deductible - insurance, accountant fees',
  [ExpenseCategory.MARKETING]: '✅ Fully deductible - advertising, website',
  [ExpenseCategory.TRAINING_COURSES]: '✅ Deductible - if directly related to business',
  [ExpenseCategory.SUBSCRIPTIONS]: '✅ Fully deductible - business software, memberships',
  [ExpenseCategory.ACCOMMODATION]: '✅ Deductible - business travel only',
  [ExpenseCategory.MEALS]: '⚠️ Deductible only if overnight business trip or with clients',
  [ExpenseCategory.EQUIPMENT]: '✅ Fully deductible - computers, tools, machinery',
  [ExpenseCategory.VEHICLE_COSTS]: '✅ Deductible - business use portion only',
  [ExpenseCategory.RENT]: '✅ Fully deductible - business premises only',
  [ExpenseCategory.UTILITIES]: '✅ Deductible - business portion only',
  [ExpenseCategory.BUSINESS_RATES]: '✅ Fully deductible',
  [ExpenseCategory.PHONE_INTERNET]: '✅ Deductible - business use portion',
  [ExpenseCategory.PROFESSIONAL_FEES]: '✅ Fully deductible',
  [ExpenseCategory.BANK_CHARGES]: '✅ Fully deductible - business accounts only',
  [ExpenseCategory.SUBCONTRACTORS]: '✅ Fully deductible',
  [ExpenseCategory.OTHER]: '⚠️ Check with HMRC guidelines',
};

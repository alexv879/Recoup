/**
 * UK HMRC Allowable Expense Categories
 * Source: gov.uk/expenses-if-youre-self-employed (November 2025)
 *
 * CRITICAL: These categories must match HMRC official guidelines
 * for UK self-employed individuals and freelancers.
 */

export enum ExpenseCategory {
  // FULLY DEDUCTIBLE - Standard business expenses
  OFFICE_COSTS = 'OFFICE_COSTS',
  SOFTWARE_SUBSCRIPTIONS = 'SOFTWARE_SUBSCRIPTIONS',
  TRAVEL_MILEAGE = 'TRAVEL_MILEAGE',
  TRAVEL_PUBLIC = 'TRAVEL_PUBLIC',
  ACCOMMODATION = 'ACCOMMODATION',
  HOME_OFFICE = 'HOME_OFFICE',
  PROFESSIONAL_FEES = 'PROFESSIONAL_FEES',
  PROFESSIONAL_SUBSCRIPTIONS = 'PROFESSIONAL_SUBSCRIPTIONS',
  INSURANCE = 'INSURANCE',
  MARKETING = 'MARKETING',
  TRAINING = 'TRAINING',
  STAFF_COSTS = 'STAFF_COSTS',
  CLOTHING_UNIFORM = 'CLOTHING_UNIFORM',
  PHONE_INTERNET = 'PHONE_INTERNET',
  BANK_CHARGES = 'BANK_CHARGES',
  LEGAL_COSTS = 'LEGAL_COSTS',
  REPAIRS_MAINTENANCE = 'REPAIRS_MAINTENANCE',

  // SPECIAL TREATMENT
  EQUIPMENT = 'EQUIPMENT', // Capital allowance, not expense
  VEHICLE_PURCHASE = 'VEHICLE_PURCHASE', // Capital allowance

  // NOT DEDUCTIBLE
  CLIENT_ENTERTAINMENT = 'CLIENT_ENTERTAINMENT',
  PERSONAL = 'PERSONAL',
  CLOTHING_NORMAL = 'CLOTHING_NORMAL',
  COMMUTE = 'COMMUTE'
}

export type TaxTreatment =
  | 'fully_deductible'
  | 'not_deductible'
  | 'capital_allowance'
  | 'proportional'
  | 'mileage_rate';

export interface CategoryInfo {
  name: string;
  tax_treatment: TaxTreatment;
  examples: string[];
  hmrc_notes?: string;
  rate?: number; // For mileage rates
  warning?: string; // Warnings for potentially non-deductible items
}

/**
 * Complete UK HMRC expense category definitions
 * Updated: November 2025
 */
export const UK_CATEGORIES: Record<ExpenseCategory, CategoryInfo> = {
  [ExpenseCategory.OFFICE_COSTS]: {
    name: 'Office Costs',
    tax_treatment: 'fully_deductible',
    examples: [
      'stationery',
      'postage',
      'printer ink',
      'office supplies',
      'printing costs'
    ],
    hmrc_notes: 'Office costs used exclusively for business are fully deductible'
  },

  [ExpenseCategory.SOFTWARE_SUBSCRIPTIONS]: {
    name: 'Software & Subscriptions',
    tax_treatment: 'fully_deductible',
    examples: [
      'Microsoft 365',
      'Adobe Creative Cloud',
      'accounting software',
      'ChatGPT Plus',
      'design tools',
      'project management tools',
      'cloud storage'
    ],
    hmrc_notes: 'Software subscriptions used for business are fully deductible'
  },

  [ExpenseCategory.TRAVEL_MILEAGE]: {
    name: 'Travel - Mileage',
    tax_treatment: 'mileage_rate',
    examples: [
      'fuel for business trips',
      'car maintenance for business use',
      'business mileage'
    ],
    hmrc_notes: '45p per mile for first 10,000 miles, then 25p per mile. Cannot claim both mileage and actual costs.',
    rate: 0.45 // First 10,000 miles
  },

  [ExpenseCategory.TRAVEL_PUBLIC]: {
    name: 'Travel - Public Transport',
    tax_treatment: 'fully_deductible',
    examples: [
      'train tickets',
      'bus fares',
      'tube fares',
      'taxi for business',
      'flights for business',
      'Uber for business meetings',
      'parking fees'
    ],
    hmrc_notes: 'Public transport for business travel is fully deductible'
  },

  [ExpenseCategory.ACCOMMODATION]: {
    name: 'Accommodation',
    tax_treatment: 'fully_deductible',
    examples: [
      'hotel for business trip',
      'overnight accommodation',
      'Airbnb for business travel'
    ],
    hmrc_notes: 'Accommodation for overnight business trips is fully deductible',
    warning: 'Must be for business purposes, not regular commute'
  },

  [ExpenseCategory.HOME_OFFICE]: {
    name: 'Home Office',
    tax_treatment: 'proportional',
    examples: [
      'portion of rent',
      'portion of utilities',
      'portion of council tax',
      'home internet business use',
      'home phone business use'
    ],
    hmrc_notes: 'Claim proportional amount or simplified £6/week flat rate',
    rate: 6 // £6 per week flat rate option
  },

  [ExpenseCategory.PROFESSIONAL_FEES]: {
    name: 'Professional Fees',
    tax_treatment: 'fully_deductible',
    examples: [
      'accountant fees',
      'bookkeeper fees',
      'legal advice',
      'business consultant',
      'tax advisor',
      'financial advisor'
    ],
    hmrc_notes: 'Professional fees for business purposes are fully deductible'
  },

  [ExpenseCategory.PROFESSIONAL_SUBSCRIPTIONS]: {
    name: 'Professional Subscriptions',
    tax_treatment: 'fully_deductible',
    examples: [
      'professional body membership',
      'trade association fees',
      'industry subscriptions',
      'professional magazines'
    ],
    hmrc_notes: 'Subscriptions to professional bodies are fully deductible'
  },

  [ExpenseCategory.INSURANCE]: {
    name: 'Insurance',
    tax_treatment: 'fully_deductible',
    examples: [
      'professional indemnity insurance',
      'public liability insurance',
      'business insurance',
      'equipment insurance'
    ],
    hmrc_notes: 'Business insurance is fully deductible'
  },

  [ExpenseCategory.MARKETING]: {
    name: 'Marketing & Advertising',
    tax_treatment: 'fully_deductible',
    examples: [
      'Google Ads',
      'Facebook ads',
      'website costs',
      'business cards',
      'promotional materials',
      'SEO services',
      'social media advertising'
    ],
    hmrc_notes: 'Marketing and advertising costs are fully deductible'
  },

  [ExpenseCategory.TRAINING]: {
    name: 'Training & Professional Development',
    tax_treatment: 'fully_deductible',
    examples: [
      'courses',
      'training',
      'professional development',
      'conferences',
      'workshops',
      'online learning'
    ],
    hmrc_notes: 'Training that maintains or improves skills for your current business is deductible',
    warning: 'Training for a new business or profession is not deductible'
  },

  [ExpenseCategory.STAFF_COSTS]: {
    name: 'Staff Costs',
    tax_treatment: 'fully_deductible',
    examples: [
      'employee salaries',
      'subcontractor fees',
      'employee benefits',
      'staff training',
      "employer's NI contributions"
    ],
    hmrc_notes: 'Staff costs are fully deductible, but IR35 rules may apply to contractors'
  },

  [ExpenseCategory.CLOTHING_UNIFORM]: {
    name: 'Clothing - Uniform Only',
    tax_treatment: 'fully_deductible',
    examples: [
      'uniform with company logo',
      'protective clothing',
      'safety equipment',
      'branded workwear'
    ],
    hmrc_notes: 'Only uniforms and protective clothing are deductible',
    warning: 'Everyday clothing, even if worn for work, is NOT deductible'
  },

  [ExpenseCategory.PHONE_INTERNET]: {
    name: 'Phone & Internet',
    tax_treatment: 'proportional',
    examples: [
      'business phone bill',
      'business internet',
      'mobile phone business use'
    ],
    hmrc_notes: 'Claim business proportion of phone and internet costs'
  },

  [ExpenseCategory.BANK_CHARGES]: {
    name: 'Bank Charges',
    tax_treatment: 'fully_deductible',
    examples: [
      'business bank charges',
      'merchant fees',
      'card processing fees',
      'overdraft interest',
      'business loan interest'
    ],
    hmrc_notes: 'Bank charges for business accounts are fully deductible'
  },

  [ExpenseCategory.LEGAL_COSTS]: {
    name: 'Legal Costs',
    tax_treatment: 'fully_deductible',
    examples: [
      'contract review',
      'debt collection',
      'business legal advice',
      'employment tribunal costs'
    ],
    hmrc_notes: 'Legal costs for business purposes are fully deductible'
  },

  [ExpenseCategory.REPAIRS_MAINTENANCE]: {
    name: 'Repairs & Maintenance',
    tax_treatment: 'fully_deductible',
    examples: [
      'equipment repairs',
      'computer repairs',
      'premises repairs',
      'website maintenance'
    ],
    hmrc_notes: 'Repairs and maintenance are deductible, but improvements are capital allowances'
  },

  // SPECIAL TREATMENT

  [ExpenseCategory.EQUIPMENT]: {
    name: 'Equipment (Capital Allowance)',
    tax_treatment: 'capital_allowance',
    examples: [
      'laptop',
      'computer',
      'tools',
      'machinery',
      'furniture over £500'
    ],
    hmrc_notes: 'Equipment is claimed through Annual Investment Allowance (AIA), currently £1,000,000',
    warning: 'This is not an expense - claim as capital allowance instead'
  },

  [ExpenseCategory.VEHICLE_PURCHASE]: {
    name: 'Vehicle Purchase (Capital Allowance)',
    tax_treatment: 'capital_allowance',
    examples: [
      'van purchase',
      'car purchase'
    ],
    hmrc_notes: 'Vehicles are claimed through capital allowances, not as expenses',
    warning: 'This is not an expense - claim as capital allowance instead'
  },

  // NOT DEDUCTIBLE

  [ExpenseCategory.CLIENT_ENTERTAINMENT]: {
    name: 'Client Entertainment (NOT Deductible)',
    tax_treatment: 'not_deductible',
    examples: [
      'client meals',
      'client drinks',
      'entertaining clients',
      'gifts over £50'
    ],
    hmrc_notes: 'Client entertainment is NOT deductible',
    warning: 'HMRC specifically excludes client entertainment from allowable expenses'
  },

  [ExpenseCategory.PERSONAL]: {
    name: 'Personal Expenses (NOT Deductible)',
    tax_treatment: 'not_deductible',
    examples: [
      'personal meals',
      'personal shopping',
      'personal travel',
      'personal entertainment'
    ],
    hmrc_notes: 'Personal expenses are NOT deductible',
    warning: 'Only business expenses are deductible'
  },

  [ExpenseCategory.CLOTHING_NORMAL]: {
    name: 'Normal Clothing (NOT Deductible)',
    tax_treatment: 'not_deductible',
    examples: [
      'business suit',
      'everyday clothes',
      'shoes',
      'accessories'
    ],
    hmrc_notes: 'Everyday clothing is NOT deductible, even if worn for work',
    warning: 'Only uniforms and protective clothing are deductible'
  },

  [ExpenseCategory.COMMUTE]: {
    name: 'Commute (NOT Deductible)',
    tax_treatment: 'not_deductible',
    examples: [
      'travel to regular workplace',
      'daily commute',
      'season tickets for commuting'
    ],
    hmrc_notes: 'Commuting to a regular place of work is NOT deductible',
    warning: 'Only travel between business locations is deductible'
  }
};

/**
 * Get category information by category enum
 */
export function getCategoryInfo(category: ExpenseCategory): CategoryInfo {
  return UK_CATEGORIES[category];
}

/**
 * Get all deductible categories
 */
export function getDeductibleCategories(): ExpenseCategory[] {
  return Object.keys(UK_CATEGORIES).filter(
    (key) =>
      UK_CATEGORIES[key as ExpenseCategory].tax_treatment === 'fully_deductible' ||
      UK_CATEGORIES[key as ExpenseCategory].tax_treatment === 'proportional' ||
      UK_CATEGORIES[key as ExpenseCategory].tax_treatment === 'mileage_rate'
  ) as ExpenseCategory[];
}

/**
 * Get categories that require capital allowance treatment
 */
export function getCapitalAllowanceCategories(): ExpenseCategory[] {
  return Object.keys(UK_CATEGORIES).filter(
    (key) => UK_CATEGORIES[key as ExpenseCategory].tax_treatment === 'capital_allowance'
  ) as ExpenseCategory[];
}

/**
 * Get non-deductible categories
 */
export function getNonDeductibleCategories(): ExpenseCategory[] {
  return Object.keys(UK_CATEGORIES).filter(
    (key) => UK_CATEGORIES[key as ExpenseCategory].tax_treatment === 'not_deductible'
  ) as ExpenseCategory[];
}

/**
 * Calculate mileage deduction for UK rates
 * 45p per mile for first 10,000 miles, then 25p per mile
 */
export function calculateMileageDeduction(miles: number): number {
  if (miles <= 0) return 0;

  const firstBandLimit = 10000;
  const firstBandRate = 0.45; // 45p
  const secondBandRate = 0.25; // 25p

  if (miles <= firstBandLimit) {
    return miles * firstBandRate;
  } else {
    return firstBandLimit * firstBandRate + (miles - firstBandLimit) * secondBandRate;
  }
}

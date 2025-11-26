/**
 * Industry classifications for ML benchmarking
 * Used to segment collection success rates by client industry
 */

export interface Industry {
  code: number;
  label: string;
  category: string;
}

/**
 * Industry options with numeric codes for ML features
 * Categories based on UK SIC (Standard Industrial Classification)
 */
export const INDUSTRIES: Industry[] = [
  // Professional Services
  { code: 1, label: 'Legal Services', category: 'Professional' },
  { code: 2, label: 'Accounting & Tax', category: 'Professional' },
  { code: 3, label: 'Management Consulting', category: 'Professional' },
  { code: 4, label: 'IT Consulting', category: 'Professional' },
  { code: 5, label: 'Marketing & Advertising', category: 'Professional' },
  { code: 6, label: 'Public Relations', category: 'Professional' },
  { code: 7, label: 'Architecture', category: 'Professional' },
  { code: 8, label: 'Engineering', category: 'Professional' },

  // Creative Industries
  { code: 10, label: 'Graphic Design', category: 'Creative' },
  { code: 11, label: 'Web Design', category: 'Creative' },
  { code: 12, label: 'Photography', category: 'Creative' },
  { code: 13, label: 'Videography', category: 'Creative' },
  { code: 14, label: 'Copywriting', category: 'Creative' },
  { code: 15, label: 'Content Creation', category: 'Creative' },
  { code: 16, label: 'UI/UX Design', category: 'Creative' },

  // Technology
  { code: 20, label: 'Software Development', category: 'Technology' },
  { code: 21, label: 'Mobile App Development', category: 'Technology' },
  { code: 22, label: 'Web Development', category: 'Technology' },
  { code: 23, label: 'Data Science', category: 'Technology' },
  { code: 24, label: 'Cybersecurity', category: 'Technology' },
  { code: 25, label: 'Cloud Computing', category: 'Technology' },
  { code: 26, label: 'DevOps', category: 'Technology' },

  // Construction & Trades
  { code: 30, label: 'Construction', category: 'Trades' },
  { code: 31, label: 'Plumbing', category: 'Trades' },
  { code: 32, label: 'Electrical', category: 'Trades' },
  { code: 33, label: 'Carpentry', category: 'Trades' },
  { code: 34, label: 'Painting & Decorating', category: 'Trades' },
  { code: 35, label: 'HVAC', category: 'Trades' },
  { code: 36, label: 'Landscaping', category: 'Trades' },

  // Healthcare
  { code: 40, label: 'Medical Consulting', category: 'Healthcare' },
  { code: 41, label: 'Therapy', category: 'Healthcare' },
  { code: 42, label: 'Nutrition', category: 'Healthcare' },
  { code: 43, label: 'Fitness Training', category: 'Healthcare' },

  // Education & Training
  { code: 50, label: 'Tutoring', category: 'Education' },
  { code: 51, label: 'Corporate Training', category: 'Education' },
  { code: 52, label: 'Language Teaching', category: 'Education' },
  { code: 53, label: 'Music Lessons', category: 'Education' },

  // Hospitality
  { code: 60, label: 'Event Planning', category: 'Hospitality' },
  { code: 61, label: 'Catering', category: 'Hospitality' },
  { code: 62, label: 'Travel Planning', category: 'Hospitality' },

  // Retail & E-commerce
  { code: 70, label: 'Retail', category: 'Retail' },
  { code: 71, label: 'E-commerce', category: 'Retail' },
  { code: 72, label: 'Dropshipping', category: 'Retail' },

  // Other
  { code: 99, label: 'Other', category: 'Other' },
];

/**
 * Get industry label from code
 */
export function getIndustryLabel(code: number): string | undefined {
  return INDUSTRIES.find(ind => ind.code === code)?.label;
}

/**
 * Get industry code from label
 */
export function getIndustryCode(label: string): number | undefined {
  return INDUSTRIES.find(ind => ind.label === label)?.code;
}

/**
 * Get industries by category
 */
export function getIndustriesByCategory(category: string): Industry[] {
  return INDUSTRIES.filter(ind => ind.category === category);
}

/**
 * Get all unique categories
 */
export function getIndustryCategories(): string[] {
  return [...new Set(INDUSTRIES.map(ind => ind.category))];
}

import { z } from 'zod';

/**
 * Validation schemas for AI Proposal Generator
 * Prevents prompt injection and ensures safe AI generation
 */

export const PricingStrategySchema = z.object({
  type: z.enum(['hourly', 'fixed', 'value_based', 'retainer']),
  hourlyRate: z.number().positive().max(10000).optional(),
  estimatedHours: z.number().positive().max(10000).optional(),
  fixedPrice: z.number().positive().max(10000000).optional(),
  targetMargin: z.number().min(0).max(100).optional(), // Percentage
});

export const TimelineSchema = z.object({
  startDate: z.date().or(z.string().datetime()),
  durationWeeks: z.number().positive().max(520), // Max 10 years
  keyMilestones: z.array(
    z.string().min(1).max(500)
  ).max(20), // Max 20 milestones
});

export const ClientHistorySchema = z.object({
  previousProjects: z.number().nonnegative().max(10000),
  totalRevenue: z.number().nonnegative().max(100000000),
  profitabilityTier: z.enum(['A', 'B', 'C', 'D', 'F']).optional(),
  paymentHistory: z.object({
    onTimeRate: z.number().min(0).max(100),
  }).optional(),
});

export const TestimonialSchema = z.object({
  text: z.string().min(10).max(1000),
  client: z.string().min(1).max(200),
  project: z.string().min(1).max(200),
});

export const CaseStudySchema = z.object({
  title: z.string().min(1).max(200),
  result: z.string().min(10).max(1000),
});

export const UserProfileSchema = z.object({
  businessName: z.string().min(1).max(200),
  expertise: z.array(z.string().min(1).max(100)).max(20),
  yearsExperience: z.number().nonnegative().max(100),
  testimonials: z.array(TestimonialSchema).max(20).optional(),
  caseStudies: z.array(CaseStudySchema).max(20).optional(),
});

export const ProposalGenerationSchema = z.object({
  userId: z.string().min(1),
  clientId: z.string().uuid('Invalid client ID'),
  templateId: z.string().uuid().optional(),

  // Project details
  projectName: z.string()
    .min(1, 'Project name is required')
    .max(500, 'Project name too long'),
  projectDescription: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description too long'),
  projectType: z.string().min(1).max(100),
  industry: z.string().min(1).max(100),

  // Requirements and deliverables
  requirements: z.array(
    z.string().min(1).max(1000)
  ).min(1, 'At least one requirement is required').max(50),

  deliverables: z.array(
    z.string().min(1).max(1000)
  ).min(1, 'At least one deliverable is required').max(50),

  constraints: z.array(
    z.string().min(1).max(1000)
  ).max(20).optional(),

  // Pricing
  pricingStrategy: PricingStrategySchema,

  // Timeline
  timeline: TimelineSchema.optional(),

  // Customization - STRICT validation to prevent prompt injection
  tone: z.enum(['professional', 'friendly', 'technical', 'creative']),
  length: z.enum(['concise', 'standard', 'detailed']),
  includeSections: z.array(
    z.enum(['intro', 'problem', 'solution', 'approach', 'deliverables', 'timeline', 'pricing', 'about', 'testimonials', 'terms'])
  ).min(1).max(10),

  // Optional context
  clientHistory: ClientHistorySchema.optional(),
  userProfile: UserProfileSchema.optional(),
});

export const ProposalImprovementSchema = z.object({
  proposalId: z.string().uuid(),
  feedback: z.string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(2000, 'Feedback too long'),
});

export const ProposalOutcomeSchema = z.object({
  proposalId: z.string().uuid(),
  outcome: z.enum(['accepted', 'declined']),
  declineReason: z.string().max(1000).optional(),
  finalValue: z.number().positive().max(10000000).optional(),
});

export const ProposalAnalyticsSchema = z.object({
  userId: z.string().min(1),
  period: z.object({
    start: z.date().or(z.string().datetime()),
    end: z.date().or(z.string().datetime()),
  }),
});

// Type exports
export type PricingStrategy = z.infer<typeof PricingStrategySchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
export type ClientHistory = z.infer<typeof ClientHistorySchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type ProposalGenerationInput = z.infer<typeof ProposalGenerationSchema>;
export type ProposalImprovementInput = z.infer<typeof ProposalImprovementSchema>;
export type ProposalOutcomeInput = z.infer<typeof ProposalOutcomeSchema>;
export type ProposalAnalyticsInput = z.infer<typeof ProposalAnalyticsSchema>;

/**
 * Sanitize user input to prevent prompt injection attacks
 */
export function sanitizeForAI(input: string): string {
  // Remove potential injection patterns
  return input
    .replace(/\bignore\s+(previous|all)\s+(instructions|prompts|commands)\b/gi, '[REDACTED]')
    .replace(/\bact\s+as\b/gi, '[REDACTED]')
    .replace(/\byou\s+are\s+(now|a)\b/gi, '[REDACTED]')
    .replace(/\bpretend\s+to\s+be\b/gi, '[REDACTED]')
    .replace(/\bforget\s+everything\b/gi, '[REDACTED]')
    .trim();
}

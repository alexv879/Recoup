import { z } from 'zod';

/**
 * Validation schemas for IR35 Assessment Service
 * Critical for tax compliance - strict validation required
 */

export const ControlFactorsSchema = z.object({
  whoDecidesTasks: z.enum(['client', 'you', 'both']),
  whoDecidesMethods: z.enum(['client', 'you', 'both']),
  whoDecidesTiming: z.enum(['client', 'you', 'both']),
  canRefuseWork: z.boolean(),
  mustFollowPolicies: z.boolean(),
});

export const SubstitutionFactorsSchema = z.object({
  canSendSubstitute: z.boolean(),
  clientMustAccept: z.boolean(),
  youPaySubstitute: z.boolean(),
  hasHappened: z.boolean(),
});

export const MutualObligationSchema = z.object({
  ongoingWork: z.boolean(),
  mustAcceptWork: z.boolean(),
  mustProvideWork: z.boolean(),
  noticePeriod: z.number().nonnegative().max(365), // Days
});

export const FinancialRiskSchema = z.object({
  fixedPrice: z.boolean(),
  mustFixMistakes: z.boolean(),
  ownEquipment: z.boolean(),
  ownExpenses: z.boolean(),
  canMakeLoss: z.boolean(),
});

export const PartAndParcelSchema = z.object({
  managerialRole: z.boolean(),
  clientEmail: z.boolean(),
  clientBadge: z.boolean(),
  teamMeetings: z.boolean(),
  benefitsOffered: z.boolean(),
});

export const BusinessFactorsSchema = z.object({
  multipleClients: z.boolean(),
  numberOfClients: z.number().nonnegative().max(1000),
  marketing: z.boolean(),
  businessInsurance: z.boolean(),
  investInBusiness: z.boolean(),
});

export const IR35AssessmentSchema = z.object({
  userId: z.string().min(1),
  clientId: z.string().uuid('Invalid client ID'),
  contractId: z.string().uuid().optional(),
  control: ControlFactorsSchema,
  substitution: SubstitutionFactorsSchema,
  mutualObligation: MutualObligationSchema,
  financialRisk: FinancialRiskSchema,
  partAndParcel: PartAndParcelSchema,
  business: BusinessFactorsSchema,
  currentAnnualIncome: z.number()
    .positive()
    .max(10000000, 'Income must be less than £10M'),
});

export const ContractReviewSchema = z.object({
  contractText: z.string()
    .min(100, 'Contract must be at least 100 characters')
    .max(100000, 'Contract must be less than 100k characters'),
  clientId: z.string().uuid().optional(),
});

export const IR35StatusChangeSchema = z.object({
  previousAssessment: z.object({
    status: z.enum(['outside_ir35', 'inside_ir35', 'uncertain']),
    scores: z.object({
      controlScore: z.number().min(0).max(100),
      substitutionScore: z.number().min(0).max(100),
      mutualObligationScore: z.number().min(0).max(100),
      financialRiskScore: z.number().min(0).max(100),
      partAndParcelScore: z.number().min(0).max(100),
      businessScore: z.number().min(0).max(100),
    }),
  }),
  newAssessment: z.object({
    status: z.enum(['outside_ir35', 'inside_ir35', 'uncertain']),
    scores: z.object({
      controlScore: z.number().min(0).max(100),
      substitutionScore: z.number().min(0).max(100),
      mutualObligationScore: z.number().min(0).max(100),
      financialRiskScore: z.number().min(0).max(100),
      partAndParcelScore: z.number().min(0).max(100),
      businessScore: z.number().min(0).max(100),
    }),
  }),
});

// Type exports
export type ControlFactors = z.infer<typeof ControlFactorsSchema>;
export type SubstitutionFactors = z.infer<typeof SubstitutionFactorsSchema>;
export type MutualObligation = z.infer<typeof MutualObligationSchema>;
export type FinancialRisk = z.infer<typeof FinancialRiskSchema>;
export type PartAndParcel = z.infer<typeof PartAndParcelSchema>;
export type BusinessFactors = z.infer<typeof BusinessFactorsSchema>;
export type IR35AssessmentInput = z.infer<typeof IR35AssessmentSchema>;
export type ContractReviewInput = z.infer<typeof ContractReviewSchema>;

import { z } from 'zod';

/**
 * Validation schemas for Scope Creep Protection Service
 */

export const DeliverableSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  estimatedHours: z.number().positive().max(10000),
  actualHours: z.number().nonnegative().max(10000).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  dueDate: z.date().or(z.string().datetime()).optional(),
  completed: z.boolean().optional(),
});

export const RevisionSettingsSchema = z.object({
  included: z.number().nonnegative().max(100), // Max 100 free revisions
  used: z.number().nonnegative().max(1000),
  costPerAdditional: z.number().nonnegative().max(100000),
});

export const ProjectScopeSchema = z.object({
  id: z.string().uuid().optional(),
  projectId: z.string().uuid(),
  userId: z.string().min(1),
  clientId: z.string().uuid(),

  scopeStatement: z.string()
    .min(10, 'Scope statement must be at least 10 characters')
    .max(5000, 'Scope statement too long'),

  deliverables: z.array(DeliverableSchema)
    .min(1, 'At least one deliverable required')
    .max(100),

  exclusions: z.array(z.string().min(1).max(500)).max(50).optional(),

  estimatedHours: z.number().positive().max(100000),
  estimatedCost: z.number().positive().max(10000000),
  buffer: z.number().min(0).max(100), // Percentage

  revisions: RevisionSettingsSchema,

  actualHours: z.number().nonnegative().max(100000).optional(),
  actualCost: z.number().nonnegative().max(10000000).optional(),

  status: z.enum(['active', 'completed', 'paused']).optional(),
  acceptedByClient: z.boolean().optional(),
});

export const ScopeChangeDetectionSchema = z.object({
  scope: z.object({
    scopeStatement: z.string(),
    deliverables: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
    })),
    exclusions: z.array(z.string()).optional(),
  }),
  clientRequest: z.string()
    .min(10, 'Client request must be at least 10 characters')
    .max(5000, 'Client request too long'),
});

export const ScopeChangeSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['addition', 'modification', 'removal']),
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),

  impact: z.object({
    hoursAdded: z.number().max(10000),
    costAdded: z.number().max(10000000),
    timelineImpact: z.number().max(1000), // Days
    newDeliverables: z.array(z.string().max(500)).max(50),
  }),

  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  changeOrderGenerated: z.boolean().optional(),
});

export const TimeTrackingSchema = z.object({
  scope: ProjectScopeSchema,
  hoursWorked: z.number().positive().max(1000), // Max 1000 hours per entry
  deliverableId: z.string().uuid().optional(),
  hourlyRate: z.number().positive().max(10000),
});

export const RevisionTrackingSchema = z.object({
  scope: ProjectScopeSchema,
  deliverableId: z.string().uuid(),
  description: z.string().max(1000).optional(),
});

export const ChangeOrderSchema = z.object({
  id: z.string().uuid().optional(),
  scope: ProjectScopeSchema,
  scopeChange: ScopeChangeSchema,
  hourlyRate: z.number().positive().max(10000),
});

export const ScopeCreepTemplateSchema = z.object({
  situation: z.enum(['revision_limit', 'additional_work', 'scope_change', 'hours_exceeded']),
  clientName: z.string().min(1).max(200),
  projectName: z.string().min(1).max(500),
  additionalCost: z.number().positive().max(10000000).optional(),
});

// Type exports
export type Deliverable = z.infer<typeof DeliverableSchema>;
export type RevisionSettings = z.infer<typeof RevisionSettingsSchema>;
export type ProjectScope = z.infer<typeof ProjectScopeSchema>;
export type ScopeChange = z.infer<typeof ScopeChangeSchema>;
export type TimeTrackingInput = z.infer<typeof TimeTrackingSchema>;
export type RevisionTrackingInput = z.infer<typeof RevisionTrackingSchema>;
export type ChangeOrderInput = z.infer<typeof ChangeOrderSchema>;
export type ScopeCreepTemplateInput = z.infer<typeof ScopeCreepTemplateSchema>;
export type ScopeChangeDetectionInput = z.infer<typeof ScopeChangeDetectionSchema>;

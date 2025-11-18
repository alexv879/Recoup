/**
 * [SECURITY FIX] Comprehensive Input Validation Schemas
 *
 * Zod schemas for all API endpoints to prevent injection attacks
 *
 * Security Features:
 * - Type-safe input validation
 * - SQL/NoSQL injection prevention
 * - XSS prevention through sanitization
 * - Business logic validation
 * - Clear error messages
 *
 * SECURITY AUDIT FIX: HIGH-1
 * Issue: Only 3 out of 38 API routes have input validation
 * Fix: Comprehensive Zod schemas for all endpoints
 */

import { z } from 'zod';

/**
 * [SECURITY FIX] Common validation patterns
 */
const patterns = {
  // UK phone number (E.164 format)
  ukPhone: /^\+44[1-9]\d{9,10}$/,

  // UK postcode
  ukPostcode: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,

  // UK account number (8 digits)
  ukAccountNumber: /^\d{8}$/,

  // UK sort code (6 digits or XX-XX-XX format)
  ukSortCode: /^(\d{6}|\d{2}-\d{2}-\d{2})$/,

  // Invoice reference
  invoiceReference: /^INV-\d{8}-[A-Z0-9]{5}$/,

  // UUID
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

/**
 * [SECURITY FIX] Sanitize string input
 * Removes potential XSS vectors
 */
function sanitizeString() {
  return z.string().transform((val) =>
    val
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .substring(0, 10000) // Max length防DoS
  );
}

/**
 * [SECURITY FIX] Invoice validation schemas
 */
export const invoiceSchemas = {
  create: z.object({
    clientName: z.string().min(1).max(100),
    clientEmail: z.string().email(),
    amount: z.number().min(0.01).max(1000000),
    currency: z.enum(['GBP', 'USD', 'EUR']).default('GBP'),
    description: z.string().max(500).optional(),
    dueDate: z.string().datetime().or(z.date()),
    invoiceDate: z.string().datetime().or(z.date()).optional(),
    paymentMethods: z.array(z.enum(['bank_transfer', 'card'])).min(1),
  }),

  update: z.object({
    clientName: z.string().min(1).max(100).optional(),
    clientEmail: z.string().email().optional(),
    amount: z.number().min(0.01).max(1000000).optional(),
    description: z.string().max(500).optional(),
    dueDate: z.string().datetime().or(z.date()).optional(),
    status: z
      .enum(['draft', 'sent', 'paid', 'overdue', 'in_collections', 'disputed', 'cancelled'])
      .optional(),
  }),

  claimPayment: z.object({
    paymentMethod: z.enum(['bank_transfer', 'cash', 'cheque']),
    paymentReference: z.string().max(100).optional(),
    paymentDate: z.string().datetime().or(z.date()),
    clientNotes: z.string().max(1000).optional(),
  }),

  verifyPayment: z.object({
    verified: z.boolean(),
    actualAmount: z.number().min(0).optional(),
    verificationNotes: z.string().max(1000).optional(),
    rejected: z.boolean().optional(),
    rejectionReason: z.string().max(500).optional(),
  }),
};

/**
 * [SECURITY FIX] Collections validation schemas
 */
export const collectionsSchemas = {
  sms: z.object({
    invoiceId: z.string().min(1),
    recipientPhone: z.string().regex(patterns.ukPhone, 'Must be a valid UK phone number in E.164 format'),
    template: z.enum(['gentle_reminder', 'firm_warning', 'final_notice']).default('gentle_reminder'),
  }),

  aiCall: z.object({
    invoiceId: z.string().min(1),
    recipientPhone: z.string().regex(patterns.ukPhone),
    recipientName: z.string().min(1).max(100),
  }),

  letter: z.object({
    invoiceId: z.string().min(1),
    recipientAddress: z.object({
      line1: z.string().min(1).max(100),
      line2: z.string().max(100).optional(),
      city: z.string().min(1).max(50),
      postcode: z.string().regex(patterns.ukPostcode, 'Must be a valid UK postcode'),
      country: z.string().default('United Kingdom'),
    }),
    template: z.enum(['gentle', 'final_warning', 'lba']).default('gentle'),
  }),

  agencyHandoff: z.object({
    invoiceId: z.string().min(1),
    agencyId: z.string().min(1),
    notes: z.string().max(2000).optional(),
    documents: z.array(z.string()).optional(),
  }),
};

/**
 * [SECURITY FIX] User/Settings validation schemas
 */
export const userSchemas = {
  updateProfile: z.object({
    fullName: z.string().min(1).max(100).optional(),
    businessName: z.string().max(100).optional(),
    phoneNumber: z.string().regex(patterns.ukPhone).optional(),
    timezone: z.string().optional(),
    language: z.enum(['en', 'es', 'fr']).optional(),
  }),

  updateBankDetails: z.object({
    accountHolderName: z.string().min(1).max(100),
    accountNumber: z.string().regex(patterns.ukAccountNumber, 'Must be an 8-digit account number'),
    sortCode: z.string().regex(patterns.ukSortCode, 'Must be a valid UK sort code'),
    bankName: z.string().min(1).max(100),
  }),

  updateAddress: z.object({
    companyName: z.string().max(100).optional(),
    addressLine1: z.string().min(1).max(100),
    addressLine2: z.string().max(100).optional(),
    city: z.string().min(1).max(50),
    postcode: z.string().regex(patterns.ukPostcode),
    country: z.string().default('United Kingdom'),
  }),

  updateConsent: z.object({
    smsConsent: z.boolean().optional(),
    callConsent: z.boolean().optional(),
    callRecordingConsent: z.boolean().optional(),
    physicalMailConsent: z.boolean().optional(),
    dataStorageConsent: z.boolean().optional(),
    ipAddress: z.string().ip().optional(),
  }),

  updateNotifications: z.object({
    emailNotifications: z.boolean().optional(),
    inAppNotifications: z.boolean().optional(),
    quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    notificationTypes: z.array(z.string()).optional(),
    onVacation: z.boolean().optional(),
    vacationUntil: z.string().datetime().or(z.date()).optional(),
  }),
};

/**
 * [SECURITY FIX] File upload validation schema
 */
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  invoiceId: z.string().min(1).optional(),
  purpose: z.enum(['payment_evidence', 'agency_document', 'profile_picture']),
});

/**
 * [SECURITY FIX] Dashboard/Analytics validation schemas
 */
export const dashboardSchemas = {
  dateRange: z.object({
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
  }),

  exportFormat: z.object({
    format: z.enum(['csv', 'pdf', 'json']),
    startDate: z.string().datetime().or(z.date()).optional(),
    endDate: z.string().datetime().or(z.date()).optional(),
    filters: z.record(z.any()).optional(),
  }),
};

/**
 * [SECURITY FIX] Feedback/Support validation schema
 */
export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'support', 'other']),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
  email: z.string().email().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  attachments: z.array(z.string()).max(5).optional(),
});

/**
 * [SECURITY FIX] Referral validation schemas
 */
export const referralSchemas = {
  generate: z.object({
    email: z.string().email().optional(),
  }),

  redeem: z.object({
    code: z.string().regex(/^REL-[A-HJ-NP-Z2-9]{6}$/, 'Invalid referral code format'),
  }),
};

/**
 * [SECURITY FIX] Webhook payload validation schemas
 */
export const webhookSchemas = {
  stripe: z.object({
    id: z.string(),
    type: z.string(),
    data: z.object({
      object: z.any(),
    }),
  }),

  clerk: z.object({
    type: z.string(),
    data: z.any(),
  }),

  sendgrid: z.array(
    z.object({
      email: z.string().email(),
      timestamp: z.number(),
      event: z.string(),
      sg_message_id: z.string().optional(),
    })
  ),

  twilio: z.object({
    CallSid: z.string().optional(),
    MessageSid: z.string().optional(),
    From: z.string(),
    To: z.string(),
    CallStatus: z.string().optional(),
    MessageStatus: z.string().optional(),
  }),
};

/**
 * [SECURITY FIX] Pagination validation schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * [SECURITY FIX] Search/Filter validation schema
 */
export const searchSchema = z.object({
  query: z.string().max(200).optional(),
  filters: z
    .object({
      status: z.array(z.string()).optional(),
      dateFrom: z.string().datetime().or(z.date()).optional(),
      dateTo: z.string().datetime().or(z.date()).optional(),
      amountMin: z.number().min(0).optional(),
      amountMax: z.number().max(1000000).optional(),
    })
    .optional(),
  ...paginationSchema.shape,
});

/**
 * [SECURITY FIX] Helper to validate and parse request body
 *
 * Usage:
 * ```typescript
 * const data = await validateRequestBody(req, invoiceSchemas.create);
 * ```
 */
export async function validateRequestBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  const body = await req.json();
  return schema.parse(body);
}

/**
 * [SECURITY FIX] Helper to validate query parameters
 */
export function validateQueryParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  const params: Record<string, any> = {};

  searchParams.forEach((value, key) => {
    // Try to parse as JSON for complex types
    try {
      params[key] = JSON.parse(value);
    } catch {
      params[key] = value;
    }
  });

  return schema.parse(params);
}

/**
 * [SECURITY FIX] Sanitize HTML input
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .substring(0, 50000);
}

/**
 * [SECURITY FIX] Validate and sanitize user input
 */
export function validateAndSanitize<T extends z.ZodType>(
  data: unknown,
  schema: T
): z.infer<T> {
  // First parse with schema
  const parsed = schema.parse(data);

  // Then sanitize string fields
  if (typeof parsed === 'object' && parsed !== null) {
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        (parsed as any)[key] = sanitizeHtml(value);
      }
    }
  }

  return parsed;
}

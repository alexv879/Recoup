/**
 * Anthropic Claude AI Provider
 * Uses Claude Sonnet 4 for complex IR35 legal reasoning
 *
 * Claude Sonnet 4 is chosen for:
 * - Superior legal reasoning capabilities
 * - Structured output support (critical for IR35 assessments)
 * - High accuracy for complex contract analysis
 *
 * Pricing (Nov 2025):
 * - Input: $3/1M tokens
 * - Output: $15/1M tokens
 * - Typical IR35 assessment: ~£0.003
 *
 * Beta Features:
 * - structured-outputs-2025-11-13: JSON schema validation
 */

import Anthropic from '@anthropic-ai/sdk';
import { logInfo, logError } from '@/utils/logger';

// Initialize Anthropic client
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY environment variable is not set');
}

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  : null;

const IR35_MODEL = 'claude-sonnet-4-20250514';
const STRUCTURED_OUTPUT_BETA = 'structured-outputs-2025-11-13';

/**
 * IR35 status determination
 */
export type IR35Status = 'inside' | 'outside' | 'borderline';

/**
 * IR35 risk level
 */
export type IR35RiskLevel = 'low' | 'medium' | 'high';

/**
 * IR35 contract details for assessment
 */
export interface IR35ContractDetails {
  // Control
  clientControlsHow: boolean; // Does client control HOW work is done?
  clientControlsWhen: boolean; // Does client control WHEN work is done?
  clientControlsWhere: boolean; // Does client control WHERE work is done?
  canSendSubstitute: boolean; // Can contractor send substitute?

  // Substitution
  substitutionClauseExists: boolean;
  substitutionEverUsed: boolean;
  clientMustAcceptSubstitute: boolean;

  // Mutuality of Obligation (MOO)
  clientMustProvideWork: boolean;
  contractorMustAcceptWork: boolean;
  minimumHoursGuaranteed: boolean;

  // Part and Parcel
  hasCompanyEmail: boolean;
  hasCompanyEquipment: boolean;
  attendsCompanyMeetings: boolean;
  listedOnCompanyWebsite: boolean;
  managesEmployees: boolean;

  // Financial Risk
  paysForOwnEquipment: boolean;
  paysForOwnTraining: boolean;
  canMakeProfit: boolean;
  canMakeLoss: boolean;
  fixedPrice: boolean; // Fixed price vs day rate

  // Contract Details
  contractDuration: string; // e.g., "6 months", "12 months"
  dailyRate?: number;
  industry: string;
  role: string;

  // Additional Context
  additionalContext?: string;
}

/**
 * IR35 assessment result with detailed analysis
 */
export interface IR35AssessmentResult {
  status: IR35Status;
  risk_level: IR35RiskLevel;
  risk_score: number; // 0-100
  confidence: number; // 0-1

  // Key findings
  control_assessment: {
    status: 'passes' | 'fails' | 'unclear';
    reasoning: string;
    risk_factors: string[];
  };

  substitution_assessment: {
    status: 'passes' | 'fails' | 'unclear';
    reasoning: string;
    risk_factors: string[];
  };

  mutuality_assessment: {
    status: 'passes' | 'fails' | 'unclear';
    reasoning: string;
    risk_factors: string[];
  };

  part_and_parcel_assessment: {
    status: 'passes' | 'fails' | 'unclear';
    reasoning: string;
    risk_factors: string[];
  };

  financial_risk_assessment: {
    status: 'passes' | 'fails' | 'unclear';
    reasoning: string;
    risk_factors: string[];
  };

  // Overall
  overall_reasoning: string;
  recommendations: string[];
  tax_implications: {
    if_inside: string;
    if_outside: string;
  };

  // Legal disclaimer
  disclaimer: string;
}

/**
 * Assess IR35 status using Claude Sonnet 4
 * Uses structured outputs for guaranteed JSON schema compliance
 */
export async function assessIR35(
  contractDetails: IR35ContractDetails
): Promise<IR35AssessmentResult> {
  if (!anthropic) {
    throw new Error(
      'Anthropic API not configured. Please set ANTHROPIC_API_KEY environment variable.'
    );
  }

  const startTime = Date.now();

  try {
    // Define JSON schema for structured output
    const schema = {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['inside', 'outside', 'borderline'] },
        risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
        risk_score: { type: 'number', minimum: 0, maximum: 100 },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        control_assessment: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['passes', 'fails', 'unclear'] },
            reasoning: { type: 'string' },
            risk_factors: { type: 'array', items: { type: 'string' } }
          },
          required: ['status', 'reasoning', 'risk_factors']
        },
        substitution_assessment: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['passes', 'fails', 'unclear'] },
            reasoning: { type: 'string' },
            risk_factors: { type: 'array', items: { type: 'string' } }
          },
          required: ['status', 'reasoning', 'risk_factors']
        },
        mutuality_assessment: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['passes', 'fails', 'unclear'] },
            reasoning: { type: 'string' },
            risk_factors: { type: 'array', items: { type: 'string' } }
          },
          required: ['status', 'reasoning', 'risk_factors']
        },
        part_and_parcel_assessment: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['passes', 'fails', 'unclear'] },
            reasoning: { type: 'string' },
            risk_factors: { type: 'array', items: { type: 'string' } }
          },
          required: ['status', 'reasoning', 'risk_factors']
        },
        financial_risk_assessment: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['passes', 'fails', 'unclear'] },
            reasoning: { type: 'string' },
            risk_factors: { type: 'array', items: { type: 'string' } }
          },
          required: ['status', 'reasoning', 'risk_factors']
        },
        overall_reasoning: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        tax_implications: {
          type: 'object',
          properties: {
            if_inside: { type: 'string' },
            if_outside: { type: 'string' }
          },
          required: ['if_inside', 'if_outside']
        },
        disclaimer: { type: 'string' }
      },
      required: [
        'status',
        'risk_level',
        'risk_score',
        'confidence',
        'control_assessment',
        'substitution_assessment',
        'mutuality_assessment',
        'part_and_parcel_assessment',
        'financial_risk_assessment',
        'overall_reasoning',
        'recommendations',
        'tax_implications',
        'disclaimer'
      ]
    };

    const systemPrompt = `You are a UK tax law expert specializing in IR35 (off-payroll working rules) compliance for freelancers and contractors.

Your task is to assess IR35 status based on contract details using the established CEST (Check Employment Status for Tax) criteria:

1. CONTROL: Does the client control HOW, WHEN, and WHERE work is done?
   - If YES → Inside IR35 indicator
   - If NO → Outside IR35 indicator

2. SUBSTITUTION: Can the contractor send a substitute to do the work?
   - If YES (unrestricted right) → Outside IR35 indicator
   - If NO → Inside IR35 indicator

3. MUTUALITY OF OBLIGATION (MOO): Is there obligation to provide/accept work?
   - If YES (guaranteed work/must accept) → Inside IR35 indicator
   - If NO → Outside IR35 indicator

4. PART AND PARCEL: Is contractor integrated into client's organization?
   - If YES (company email, manages staff, etc.) → Inside IR35 indicator
   - If NO → Outside IR35 indicator

5. FINANCIAL RISK: Does contractor bear financial risk?
   - If YES (own equipment, can make loss, fixed price) → Outside IR35 indicator
   - If NO → Inside IR35 indicator

DECISION FRAMEWORK:
- INSIDE IR35: Fails 3+ tests, or fails control + MOO
- OUTSIDE IR35: Passes 4+ tests, including substitution
- BORDERLINE: Mixed results, requires professional review

Provide detailed, accurate analysis based on UK case law and HMRC guidance.`;

    const userPrompt = `Assess this UK contractor arrangement for IR35 compliance:

CONTROL:
- Client controls HOW work is done: ${contractDetails.clientControlsHow ? 'YES' : 'NO'}
- Client controls WHEN work is done: ${contractDetails.clientControlsWhen ? 'YES' : 'NO'}
- Client controls WHERE work is done: ${contractDetails.clientControlsWhere ? 'YES' : 'NO'}
- Can send substitute: ${contractDetails.canSendSubstitute ? 'YES' : 'NO'}

SUBSTITUTION:
- Substitution clause exists: ${contractDetails.substitutionClauseExists ? 'YES' : 'NO'}
- Substitution ever used: ${contractDetails.substitutionEverUsed ? 'YES' : 'NO'}
- Client must accept substitute: ${contractDetails.clientMustAcceptSubstitute ? 'YES' : 'NO'}

MUTUALITY OF OBLIGATION:
- Client must provide work: ${contractDetails.clientMustProvideWork ? 'YES' : 'NO'}
- Contractor must accept work: ${contractDetails.contractorMustAcceptWork ? 'YES' : 'NO'}
- Minimum hours guaranteed: ${contractDetails.minimumHoursGuaranteed ? 'YES' : 'NO'}

PART AND PARCEL:
- Has company email: ${contractDetails.hasCompanyEmail ? 'YES' : 'NO'}
- Has company equipment: ${contractDetails.hasCompanyEquipment ? 'YES' : 'NO'}
- Attends company meetings: ${contractDetails.attendsCompanyMeetings ? 'YES' : 'NO'}
- Listed on company website: ${contractDetails.listedOnCompanyWebsite ? 'YES' : 'NO'}
- Manages employees: ${contractDetails.managesEmployees ? 'YES' : 'NO'}

FINANCIAL RISK:
- Pays for own equipment: ${contractDetails.paysForOwnEquipment ? 'YES' : 'NO'}
- Pays for own training: ${contractDetails.paysForOwnTraining ? 'YES' : 'NO'}
- Can make profit: ${contractDetails.canMakeProfit ? 'YES' : 'NO'}
- Can make loss: ${contractDetails.canMakeLoss ? 'YES' : 'NO'}
- Fixed price contract: ${contractDetails.fixedPrice ? 'YES' : 'NO'}

CONTRACT DETAILS:
- Duration: ${contractDetails.contractDuration}${contractDetails.dailyRate ? `\n- Daily rate: £${contractDetails.dailyRate}` : ''}
- Industry: ${contractDetails.industry}
- Role: ${contractDetails.role}${contractDetails.additionalContext ? `\n\nAdditional context:\n${contractDetails.additionalContext}` : ''}

Provide a comprehensive IR35 assessment following the JSON schema.`;

    // Note: Using type assertion for beta features not yet in SDK types
    // This is safer than @ts-ignore as it's explicit about what we're overriding
    interface AnthropicMessageCreateParams {
      model: string;
      max_tokens: number;
      system: string;
      messages: Array<{ role: string; content: string }>;
      response_format?: {
        type: string;
        json_schema?: {
          name: string;
          strict: boolean;
          schema: any;
        };
      };
      [key: string]: any; // Allow beta headers
    }

    const params: AnthropicMessageCreateParams = {
      model: IR35_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ir35_assessment',
          strict: true,
          schema: schema
        }
      },
      anthropic_beta: STRUCTURED_OUTPUT_BETA
    };

    const message = await anthropic.messages.create(params as any);

    const content = message.content[0];

    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const result = JSON.parse(content.text) as IR35AssessmentResult;

    // CRITICAL: Add professional disclaimer for legal protection
    result.disclaimer = `IMPORTANT LEGAL NOTICE: This IR35 assessment is generated by AI and is for informational purposes only. It does NOT constitute professional legal or tax advice. IR35 determinations can have significant tax implications, and the rules are complex and subject to change. You should ALWAYS consult with a qualified tax advisor, accountant, or employment status specialist before making any decisions based on this assessment. Recoup accepts no liability for any tax consequences arising from reliance on this assessment.`;

    const latency = Date.now() - startTime;

    logInfo('Claude IR35 assessment success', {
      model: IR35_MODEL,
      status: result.status,
      risk_level: result.risk_level,
      risk_score: result.risk_score,
      confidence: result.confidence,
      latency_ms: latency
    });

    return result;
  } catch (error) {
    const latency = Date.now() - startTime;

    logError('Claude IR35 assessment failed', error as Error);

    throw new Error(
      `IR35 assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if Anthropic API is configured
 */
export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

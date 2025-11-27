/**
 * Smart Contract Templates Service
 * AI-powered contract generation and review for freelancers
 */

import { logger } from '@/utils/logger';
import { getGemini } from '@/lib/ai-service';

export enum ContractType {
  SERVICE_AGREEMENT = 'service_agreement',
  FREELANCE_CONTRACT = 'freelance_contract',
  NDA = 'nda',
  RETAINER_AGREEMENT = 'retainer_agreement',
  STATEMENT_OF_WORK = 'statement_of_work',
  CONSULTING_AGREEMENT = 'consulting_agreement',
  DESIGN_CONTRACT = 'design_contract',
  DEVELOPMENT_CONTRACT = 'development_contract',
  CONTENT_CREATION = 'content_creation',
  MARKETING_SERVICES = 'marketing_services',
}

export interface ContractTemplate {
  id: string;
  type: ContractType;
  name: string;
  description: string;
  jurisdiction: 'UK' | 'US' | 'EU' | 'International';
  industry?: string;
  templateContent: string; // Markdown format
  variables: ContractVariable[];
  clauses: ContractClause[];
  isStandard: boolean; // Standard template or user-created
  createdBy?: string; // userId if custom
  timesUsed: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'select';
  required: boolean;
  defaultValue?: string;
  options?: string[]; // For select type
  placeholder?: string;
  helpText?: string;
}

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  category: 'payment' | 'scope' | 'termination' | 'ip' | 'liability' | 'confidentiality' | 'general';
  isRequired: boolean;
  isEditable: boolean;
}

export interface GeneratedContract {
  id: string;
  templateId: string;
  userId: string;
  clientId?: string;
  clientName: string;
  contractType: ContractType;
  title: string;
  content: string; // Filled template in markdown
  variables: Record<string, any>;
  status: 'draft' | 'pending_review' | 'sent' | 'signed' | 'active' | 'terminated';
  aiReviewSummary?: AIReviewResult;
  pdfUrl?: string;
  signatureUrl?: string; // For e-signature integration
  signedDate?: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIReviewResult {
  score: number; // 0-100
  summary: string;
  strengths: string[];
  warnings: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  jurisdiction: string;
  reviewedAt: Date;
}

// ==============================================================================
// STANDARD UK FREELANCE CONTRACT TEMPLATES
// ==============================================================================

export const UK_FREELANCE_SERVICE_AGREEMENT: ContractTemplate = {
  id: 'uk-service-agreement-001',
  type: ContractType.SERVICE_AGREEMENT,
  name: 'UK Freelance Service Agreement',
  description: 'Standard service agreement for UK-based freelancers',
  jurisdiction: 'UK',
  templateContent: `# FREELANCE SERVICE AGREEMENT

**This Agreement** is made on {{contract_date}} between:

**The Client:**
{{client_name}}
{{client_address}}
{{client_company_number}}

**The Freelancer:**
{{freelancer_name}}
{{freelancer_address}}
{{freelancer_utr}}

## 1. SERVICES

The Freelancer agrees to provide the following services:

{{services_description}}

## 2. PAYMENT TERMS

- **Total Fee:** {{total_fee}} ({{currency}})
- **Payment Structure:** {{payment_structure}}
- **Payment Terms:** {{payment_terms}} days from invoice date
- **Late Payment:** Interest will be charged at {{late_fee_rate}}% per month on overdue amounts

## 3. TERM AND TERMINATION

- **Start Date:** {{start_date}}
- **End Date:** {{end_date}} (if applicable)
- **Termination Notice:** Either party may terminate with {{termination_notice_days}} days written notice
- **Immediate Termination:** Either party may terminate immediately for material breach

## 4. INTELLECTUAL PROPERTY

{{ip_clause}}

## 5. CONFIDENTIALITY

Both parties agree to maintain confidentiality of any proprietary information disclosed during this engagement.

## 6. LIABILITY

The Freelancer's total liability under this Agreement shall not exceed the total fees paid.

## 7. GENERAL

- **Governing Law:** This Agreement is governed by the laws of England and Wales
- **Entire Agreement:** This Agreement constitutes the entire agreement between parties
- **Amendments:** Any changes must be made in writing and signed by both parties

**Signed:**

Client: _________________________ Date: _____________

Freelancer: _________________________ Date: _____________
`,
  variables: [
    { key: 'contract_date', label: 'Contract Date', type: 'date', required: true },
    { key: 'client_name', label: 'Client Name', type: 'text', required: true },
    { key: 'client_address', label: 'Client Address', type: 'text', required: true },
    { key: 'client_company_number', label: 'Client Company Number', type: 'text', required: false },
    { key: 'freelancer_name', label: 'Your Name', type: 'text', required: true },
    { key: 'freelancer_address', label: 'Your Address', type: 'text', required: true },
    { key: 'freelancer_utr', label: 'Your UTR Number', type: 'text', required: false },
    { key: 'services_description', label: 'Services Description', type: 'text', required: true, placeholder: 'Describe the services in detail...' },
    { key: 'total_fee', label: 'Total Fee', type: 'currency', required: true },
    { key: 'currency', label: 'Currency', type: 'select', required: true, options: ['GBP', 'USD', 'EUR'], defaultValue: 'GBP' },
    { key: 'payment_structure', label: 'Payment Structure', type: 'select', required: true, options: ['50% upfront, 50% on completion', 'Monthly retainer', 'Hourly rate', 'Fixed price', 'Milestone-based'], defaultValue: 'Fixed price' },
    { key: 'payment_terms', label: 'Payment Terms (days)', type: 'number', required: true, defaultValue: '30' },
    { key: 'late_fee_rate', label: 'Late Fee Rate (%)', type: 'number', required: true, defaultValue: '8' },
    { key: 'start_date', label: 'Start Date', type: 'date', required: true },
    { key: 'end_date', label: 'End Date (leave blank for ongoing)', type: 'date', required: false },
    { key: 'termination_notice_days', label: 'Termination Notice (days)', type: 'number', required: true, defaultValue: '30' },
    { key: 'ip_clause', label: 'IP Rights', type: 'select', required: true, options: [
      'All IP transfers to Client upon full payment',
      'Freelancer retains IP, Client gets license to use',
      'Joint ownership of IP created',
    ], defaultValue: 'All IP transfers to Client upon full payment' },
  ],
  clauses: [],
  isStandard: true,
  timesUsed: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ==============================================================================
// CONTRACT GENERATION
// ==============================================================================

/**
 * Generate contract from template
 */
export function generateContract(params: {
  templateId: string;
  template: ContractTemplate;
  userId: string;
  clientId?: string;
  clientName: string;
  variables: Record<string, any>;
}): GeneratedContract {
  const { templateId, template, userId, clientId, clientName, variables } = params;

  // Replace variables in template
  let content = template.templateContent;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), String(value));
  }

  const contract: GeneratedContract = {
    id: generateId(),
    templateId,
    userId,
    clientId,
    clientName,
    contractType: template.type,
    title: `${template.name} - ${clientName}`,
    content,
    variables,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  logger.info('Generated contract from template', {
    templateId,
    contractType: template.type,
    clientName,
  });

  return contract;
}

/**
 * AI-powered contract review using Gemini
 */
export async function reviewContractWithAI(params: {
  contract: GeneratedContract;
  jurisdiction: 'UK' | 'US' | 'EU' | 'International';
  focusAreas?: string[];
}): Promise<AIReviewResult> {
  const { contract, jurisdiction, focusAreas = [] } = params;

  const client = getGemini();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are a legal expert specializing in freelance contracts in ${jurisdiction}.

Review the following contract and provide analysis:

${contract.content}

Focus on:
- Legal compliance for ${jurisdiction}
- Payment terms fairness
- IP rights clarity
- Liability protection
- Termination clauses
${focusAreas.length > 0 ? `- Additional focus: ${focusAreas.join(', ')}` : ''}

Provide analysis in JSON format:
{
  "score": 0-100,
  "summary": "Overall assessment",
  "strengths": ["Strength 1", "Strength 2", ...],
  "warnings": ["Warning 1", "Warning 2", ...],
  "suggestions": ["Suggestion 1", "Suggestion 2", ...],
  "riskLevel": "low" | "medium" | "high"
}

Focus on practical, actionable feedback for a self-employed freelancer.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI contract review');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const review: AIReviewResult = {
    score: parsed.score,
    summary: parsed.summary,
    strengths: parsed.strengths || [],
    warnings: parsed.warnings || [],
    suggestions: parsed.suggestions || [],
    riskLevel: parsed.riskLevel || 'medium',
    jurisdiction,
    reviewedAt: new Date(),
  };

  logger.info('AI contract review completed', {
    contractId: contract.id,
    score: review.score,
    riskLevel: review.riskLevel,
  });

  return review;
}

/**
 * AI-powered contract generation from scratch
 */
export async function generateContractWithAI(params: {
  userId: string;
  clientName: string;
  projectDescription: string;
  budget: number;
  duration: string;
  paymentTerms: string;
  specialRequirements?: string;
  jurisdiction: 'UK' | 'US' | 'EU';
}): Promise<GeneratedContract> {
  const {
    userId,
    clientName,
    projectDescription,
    budget,
    duration,
    paymentTerms,
    specialRequirements,
    jurisdiction,
  } = params;

  const client = getGemini();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are a legal expert creating freelance service agreements for ${jurisdiction}.

Generate a comprehensive freelance service agreement with the following details:
- Client: ${clientName}
- Project: ${projectDescription}
- Budget: £${budget}
- Duration: ${duration}
- Payment Terms: ${paymentTerms}
${specialRequirements ? `- Special Requirements: ${specialRequirements}` : ''}

The contract must include:
1. Clear service scope
2. Payment terms and schedule
3. Intellectual property rights (default: transfers to client on full payment)
4. Termination clauses
5. Liability limitations
6. Confidentiality clause
7. ${jurisdiction}-specific legal requirements

Format in clean markdown. Make it professional but easy to understand for freelancers and clients.`;

  const result = await model.generateContent(prompt);
  const content = result.response.text();

  const contract: GeneratedContract = {
    id: generateId(),
    templateId: 'ai-generated',
    userId,
    clientName,
    contractType: ContractType.SERVICE_AGREEMENT,
    title: `Service Agreement - ${clientName}`,
    content,
    variables: {
      projectDescription,
      budget,
      duration,
      paymentTerms,
      specialRequirements,
    },
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  logger.info('AI-generated contract created', {
    clientName,
    budget,
  });

  return contract;
}

/**
 * Extract key terms from contract (AI-powered)
 */
export async function extractContractTerms(params: {
  contractContent: string;
}): Promise<{
  paymentTerms?: string;
  deliverables?: string[];
  timeline?: string;
  terminationClause?: string;
  ipRights?: string;
  liability?: string;
  keyObligations?: string[];
}> {
  const { contractContent } = params;

  const client = getGemini();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Extract key terms from this contract:

${contractContent}

Provide in JSON format:
{
  "paymentTerms": "Summary of payment terms",
  "deliverables": ["Deliverable 1", "Deliverable 2"],
  "timeline": "Project timeline",
  "terminationClause": "How either party can terminate",
  "ipRights": "Who owns IP created",
  "liability": "Liability limitations",
  "keyObligations": ["Obligation 1", "Obligation 2"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {};
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Compare contract to standard template (identify deviations)
 */
export async function compareToStandardTerms(params: {
  contract: GeneratedContract;
  standardTemplate: ContractTemplate;
}): Promise<{
  deviations: Array<{
    section: string;
    standardTerm: string;
    actualTerm: string;
    risk: 'low' | 'medium' | 'high';
    explanation: string;
  }>;
  overallRisk: 'low' | 'medium' | 'high';
}> {
  const { contract, standardTemplate } = params;

  const client = getGemini();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Compare this contract to standard terms and identify deviations:

**Actual Contract:**
${contract.content}

**Standard Template:**
${standardTemplate.templateContent}

Identify any deviations from standard freelance terms. Focus on:
- Payment terms
- IP rights
- Liability clauses
- Termination rights

Provide in JSON format:
{
  "deviations": [
    {
      "section": "Payment Terms",
      "standardTerm": "Standard 30 days",
      "actualTerm": "60 days",
      "risk": "medium",
      "explanation": "Longer payment terms increase cash flow risk"
    }
  ],
  "overallRisk": "low" | "medium" | "high"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { deviations: [], overallRisk: 'low' };
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Send contract for e-signature
 */
export async function sendForSignature(params: {
  contract: GeneratedContract;
  clientEmail: string;
  message?: string;
}): Promise<{
  signatureUrl: string;
  expiresAt: Date;
}> {
  const { contract, clientEmail, message } = params;

  // TODO: Integrate with DocuSign, HelloSign, or PandaDoc
  const signatureUrl = `https://sign.recoup.com/contracts/${contract.id}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to sign

  logger.info('Contract sent for signature', {
    contractId: contract.id,
    clientEmail,
  });

  return {
    signatureUrl,
    expiresAt,
  };
}

/**
 * Check tier limits for contract features
 */
export function checkContractTemplateLimit(params: {
  tier: 'free' | 'starter' | 'professional' | 'business';
}): {
  allowed: boolean;
  features: {
    standardTemplates: boolean;
    customTemplates: boolean;
    aiReview: boolean;
    aiGeneration: boolean;
    eSignature: boolean;
    unlimitedContracts: boolean;
  };
  maxContractsPerMonth: number | 'unlimited';
} {
  const limits = {
    free: {
      allowed: false,
      features: {
        standardTemplates: false,
        customTemplates: false,
        aiReview: false,
        aiGeneration: false,
        eSignature: false,
        unlimitedContracts: false,
      },
      maxContractsPerMonth: 0,
    },
    starter: {
      allowed: false,
      features: {
        standardTemplates: false,
        customTemplates: false,
        aiReview: false,
        aiGeneration: false,
        eSignature: false,
        unlimitedContracts: false,
      },
      maxContractsPerMonth: 0,
    },
    professional: {
      allowed: true,
      features: {
        standardTemplates: true,
        customTemplates: true,
        aiReview: true,
        aiGeneration: false,
        eSignature: true,
        unlimitedContracts: false,
      },
      maxContractsPerMonth: 10,
    },
    business: {
      allowed: true,
      features: {
        standardTemplates: true,
        customTemplates: true,
        aiReview: true,
        aiGeneration: true,
        eSignature: true,
        unlimitedContracts: true,
      },
      maxContractsPerMonth: 'unlimited',
    },
  };

  return limits[params.tier];
}

// ==============================================================================
// UTILITIES
// ==============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all standard templates
 */
export function getStandardTemplates(jurisdiction?: string): ContractTemplate[] {
  const templates = [UK_FREELANCE_SERVICE_AGREEMENT];

  if (jurisdiction) {
    return templates.filter((t) => t.jurisdiction === jurisdiction);
  }

  return templates;
}

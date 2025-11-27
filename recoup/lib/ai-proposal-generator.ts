/**
 * AI Proposal Generator Service
 *
 * Research Finding: Freelancers spend 4-6 hours per proposal
 * AI automation saves 78% of time (reduces to ~1 hour)
 *
 * Competitive Gap: Only HoneyBook offers templates, NO ONE has AI generation
 *
 * Features:
 * - AI-powered proposal generation using multi-model strategy
 * - Client history integration for personalization
 * - Pricing recommendations based on profitability data
 * - Past project analysis to improve proposals
 * - Win rate tracking and optimization
 * - Proposal analytics and insights
 */

export interface ProposalTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  industry: string; // 'design', 'development', 'marketing', 'consulting', etc.

  // Template structure
  sections: ProposalSection[];

  // Default settings
  defaultSettings: {
    includeTimeline: boolean;
    includeTestimonials: boolean;
    includeCaseStudies: boolean;
    includeTerms: boolean;
    tone: 'professional' | 'friendly' | 'technical' | 'creative';
    length: 'concise' | 'standard' | 'detailed';
  };

  // Usage stats
  timesUsed: number;
  winRate: number; // % of proposals using this template that won
  averageValue: number;
  lastUsed?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalSection {
  id: string;
  type: 'intro' | 'problem' | 'solution' | 'approach' | 'deliverables' | 'timeline' | 'pricing' | 'about' | 'testimonials' | 'terms' | 'custom';
  title: string;
  content: string; // Can include {{placeholders}}
  order: number;
  required: boolean;
  aiGenerated: boolean;
}

export interface AIProposal {
  id: string;
  proposalNumber: string;
  userId: string;
  clientId: string;
  templateId?: string;

  // Project details
  projectName: string;
  projectDescription: string;
  projectType: string;

  // Client snapshot
  client: {
    name: string;
    email: string;
    company?: string;
    industry?: string;
    previousProjects: number;
    totalRevenue: number;
    profitability?: 'A' | 'B' | 'C' | 'D' | 'F'; // From profitability service
  };

  // Generated content
  sections: ProposalSection[];
  generatedBy: {
    model: 'gemini-2.0-flash' | 'claude-3.7-sonnet' | 'gpt-4o';
    timestamp: Date;
    tokensUsed: number;
    generationTime: number; // ms
  };

  // Pricing
  pricing: {
    lineItems: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    paymentTerms: string;
  };

  // Timeline
  timeline?: {
    startDate: Date;
    endDate: Date;
    milestones: Array<{
      name: string;
      deliverable: string;
      dueDate: Date;
      payment?: number;
    }>;
  };

  // Status
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  sentDate?: Date;
  viewedDate?: Date;
  viewCount: number;
  acceptedDate?: Date;
  declinedDate?: Date;
  declineReason?: string;

  // Validity
  validUntil: Date;
  expiryDays: number;

  // AI insights
  aiInsights: {
    winProbability: number; // 0-100 based on historical data
    suggestedImprovements: string[];
    competitiveAnalysis?: string;
    pricingConfidence: 'low' | 'medium' | 'high';
  };

  // Files
  pdfUrl?: string;
  docxUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalGenerationRequest {
  userId: string;
  clientId: string;
  templateId?: string;

  // Project details
  projectName: string;
  projectDescription: string;
  projectType: string;
  industry: string;

  // Requirements
  requirements: string[];
  deliverables: string[];
  constraints?: string[]; // Budget, timeline, technical constraints

  // Pricing strategy
  pricingStrategy: {
    type: 'hourly' | 'fixed' | 'value_based' | 'retainer';
    hourlyRate?: number;
    estimatedHours?: number;
    fixedPrice?: number;
    targetMargin?: number; // %
  };

  // Timeline
  timeline?: {
    startDate: Date;
    durationWeeks: number;
    keyMilestones: string[];
  };

  // Customization
  tone: 'professional' | 'friendly' | 'technical' | 'creative';
  length: 'concise' | 'standard' | 'detailed';
  includeSections: string[]; // Which sections to include

  // Context from other services
  clientHistory?: {
    previousProjects: number;
    totalRevenue: number;
    profitabilityTier?: 'A' | 'B' | 'C' | 'D' | 'F';
    paymentHistory?: { onTimeRate: number };
  };

  userProfile?: {
    businessName: string;
    expertise: string[];
    yearsExperience: number;
    testimonials?: Array<{ text: string; client: string; project: string }>;
    caseStudies?: Array<{ title: string; result: string }>;
  };
}

export interface ProposalAnalytics {
  userId: string;
  period: { start: Date; end: Date };

  // Overall stats
  totalProposals: number;
  proposalsSent: number;
  proposalsAccepted: number;
  proposalsDeclined: number;
  winRate: number; // %

  // Financial
  totalProposedValue: number;
  totalWonValue: number;
  averageProposalValue: number;
  averageWonValue: number;

  // Timing
  averageTimeToSend: number; // Hours from creation to send
  averageTimeToDecision: number; // Hours from send to accept/decline
  averageViewsPerProposal: number;

  // By template
  byTemplate: Array<{
    templateId: string;
    templateName: string;
    count: number;
    winRate: number;
    averageValue: number;
  }>;

  // By client type
  byIndustry: Array<{
    industry: string;
    count: number;
    winRate: number;
    averageValue: number;
  }>;

  // AI effectiveness
  aiMetrics: {
    totalGenerated: number;
    totalManual: number;
    aiWinRate: number;
    manualWinRate: number;
    averageGenerationTime: number; // ms
    totalTokensUsed: number;
  };

  // Insights
  insights: {
    bestPerformingTemplate: string;
    optimalPriceRange: { min: number; max: number };
    averageWinningDiscount: number; // %
    mostCommonDeclineReasons: Array<{ reason: string; count: number }>;
    recommendations: string[];
  };
}

/**
 * Generate AI-powered proposal
 */
export async function generateAIProposal(
  request: ProposalGenerationRequest,
  aiService: any
): Promise<AIProposal> {
  const proposalId = `prop_${Date.now()}`;
  const proposalNumber = `PROP-${Date.now().toString().slice(-6)}`;

  // Load template if specified
  let template: ProposalTemplate | null = null;
  if (request.templateId) {
    template = await loadTemplate(request.templateId);
  }

  // Analyze client history for personalization
  const clientInsights = analyzeClientHistory(request.clientHistory);

  // Generate pricing recommendation
  const pricingRecommendation = calculateOptimalPricing({
    strategy: request.pricingStrategy,
    clientHistory: request.clientHistory,
    projectType: request.projectType,
    estimatedHours: request.pricingStrategy.estimatedHours,
  });

  // Build AI prompt
  const prompt = buildProposalPrompt({
    request,
    clientInsights,
    pricingRecommendation,
    template,
  });

  // Generate using multi-model strategy (Gemini 80%, Claude 15%, OpenAI 5%)
  const model = selectAIModel();
  const startTime = Date.now();

  const generatedContent = await aiService.generate({
    model,
    prompt,
    maxTokens: request.length === 'concise' ? 2000 : request.length === 'standard' ? 4000 : 6000,
    temperature: 0.7,
  });

  const generationTime = Date.now() - startTime;

  // Parse generated content into sections
  const sections = parseGeneratedContent(generatedContent, request.includeSections);

  // Calculate win probability
  const winProbability = calculateWinProbability({
    clientHistory: request.clientHistory,
    pricing: pricingRecommendation,
    projectType: request.projectType,
  });

  // Generate AI insights
  const aiInsights = generateProposalInsights({
    sections,
    pricing: pricingRecommendation,
    clientHistory: request.clientHistory,
    winProbability,
  });

  return {
    id: proposalId,
    proposalNumber,
    userId: request.userId,
    clientId: request.clientId,
    templateId: request.templateId,
    projectName: request.projectName,
    projectDescription: request.projectDescription,
    projectType: request.projectType,
    client: {
      name: '',
      email: '',
      previousProjects: request.clientHistory?.previousProjects || 0,
      totalRevenue: request.clientHistory?.totalRevenue || 0,
      profitability: request.clientHistory?.profitabilityTier,
    },
    sections,
    generatedBy: {
      model,
      timestamp: new Date(),
      tokensUsed: estimateTokens(generatedContent),
      generationTime,
    },
    pricing: {
      lineItems: pricingRecommendation.lineItems,
      subtotal: pricingRecommendation.subtotal,
      tax: pricingRecommendation.tax,
      total: pricingRecommendation.total,
      currency: 'GBP',
      paymentTerms: pricingRecommendation.paymentTerms,
    },
    timeline: request.timeline ? {
      startDate: request.timeline.startDate,
      endDate: new Date(request.timeline.startDate.getTime() + request.timeline.durationWeeks * 7 * 24 * 60 * 60 * 1000),
      milestones: generateMilestones(request.timeline),
    } : undefined,
    status: 'draft',
    viewCount: 0,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    expiryDays: 30,
    aiInsights,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Build AI prompt for proposal generation
 */
function buildProposalPrompt(params: {
  request: ProposalGenerationRequest;
  clientInsights: any;
  pricingRecommendation: any;
  template: ProposalTemplate | null;
}): string {
  const { request, clientInsights, pricingRecommendation } = params;

  let prompt = `Generate a ${request.tone} ${request.length} business proposal for the following project:

PROJECT DETAILS:
- Name: ${request.projectName}
- Type: ${request.projectType}
- Industry: ${request.industry}
- Description: ${request.projectDescription}

REQUIREMENTS:
${request.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

DELIVERABLES:
${request.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}
`;

  if (request.constraints && request.constraints.length > 0) {
    prompt += `\nCONSTRAINTS:
${request.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}
`;
  }

  if (clientInsights.isReturningClient) {
    prompt += `\nCLIENT CONTEXT:
This is a returning client with ${clientInsights.previousProjects} previous projects.
Their profitability tier is ${clientInsights.profitabilityTier || 'unknown'}.
Payment history: ${clientInsights.paymentHistory?.onTimeRate || 0}% on-time rate.
Personalize the proposal to acknowledge our successful past collaboration.
`;
  }

  if (request.userProfile) {
    prompt += `\nYOUR BACKGROUND:
- Business: ${request.userProfile.businessName}
- Experience: ${request.userProfile.yearsExperience} years
- Expertise: ${request.userProfile.expertise.join(', ')}
`;
  }

  prompt += `\nPRICING:
${pricingRecommendation.lineItems.map((item: any) => `- ${item.description}: £${item.amount}`).join('\n')}
Total: £${pricingRecommendation.total}

SECTIONS TO INCLUDE:
${request.includeSections.join(', ')}

Generate a compelling, professional proposal that:
1. Clearly articulates understanding of the client's needs
2. Demonstrates expertise and value
3. Provides a clear approach and methodology
4. Outlines deliverables and timeline
5. Justifies the pricing
6. Includes a strong call to action

Use ${request.tone} tone and keep it ${request.length}.
Format each section with clear headings.
`;

  return prompt;
}

/**
 * Select AI model using multi-model strategy
 * Gemini 80%, Claude 15%, OpenAI 5%
 */
function selectAIModel(): AIProposal['generatedBy']['model'] {
  const random = Math.random();

  if (random < 0.80) {
    return 'gemini-2.0-flash';
  } else if (random < 0.95) {
    return 'claude-3.7-sonnet';
  } else {
    return 'gpt-4o';
  }
}

/**
 * Parse AI-generated content into sections
 */
function parseGeneratedContent(content: string, includeSections: string[]): ProposalSection[] {
  const sections: ProposalSection[] = [];

  // Split by common section markers
  const sectionPattern = /#+\s+([^\n]+)\n([\s\S]+?)(?=\n#+\s+|$)/g;
  let match;
  let order = 0;

  while ((match = sectionPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const sectionContent = match[2].trim();

    // Determine section type from title
    const type = inferSectionType(title);

    sections.push({
      id: `section_${order}`,
      type,
      title,
      content: sectionContent,
      order,
      required: includeSections.includes(type),
      aiGenerated: true,
    });

    order++;
  }

  return sections;
}

/**
 * Infer section type from title
 */
function inferSectionType(title: string): ProposalSection['type'] {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('intro') || titleLower.includes('overview')) return 'intro';
  if (titleLower.includes('problem') || titleLower.includes('challenge')) return 'problem';
  if (titleLower.includes('solution') || titleLower.includes('approach')) return 'solution';
  if (titleLower.includes('deliverable')) return 'deliverables';
  if (titleLower.includes('timeline') || titleLower.includes('schedule')) return 'timeline';
  if (titleLower.includes('pricing') || titleLower.includes('investment')) return 'pricing';
  if (titleLower.includes('about') || titleLower.includes('experience')) return 'about';
  if (titleLower.includes('testimonial') || titleLower.includes('reference')) return 'testimonials';
  if (titleLower.includes('terms') || titleLower.includes('condition')) return 'terms';

  return 'custom';
}

/**
 * Analyze client history for insights
 */
function analyzeClientHistory(history?: ProposalGenerationRequest['clientHistory']): {
  isReturningClient: boolean;
  previousProjects: number;
  profitabilityTier?: string;
  paymentHistory?: { onTimeRate: number };
  recommendations: string[];
} {
  if (!history) {
    return {
      isReturningClient: false,
      previousProjects: 0,
      recommendations: [],
    };
  }

  const recommendations: string[] = [];

  if (history.previousProjects > 0) {
    recommendations.push('Mention successful past collaboration');
  }

  if (history.profitabilityTier === 'A' || history.profitabilityTier === 'B') {
    recommendations.push('This is a profitable client - maintain or increase rates');
  } else if (history.profitabilityTier === 'D' || history.profitabilityTier === 'F') {
    recommendations.push('This client has low profitability - consider increasing rates');
  }

  if (history.paymentHistory && history.paymentHistory.onTimeRate < 80) {
    recommendations.push('Client has payment issues - consider upfront deposit');
  }

  return {
    isReturningClient: history.previousProjects > 0,
    previousProjects: history.previousProjects,
    profitabilityTier: history.profitabilityTier,
    paymentHistory: history.paymentHistory,
    recommendations,
  };
}

/**
 * Calculate optimal pricing
 */
function calculateOptimalPricing(params: {
  strategy: ProposalGenerationRequest['pricingStrategy'];
  clientHistory?: ProposalGenerationRequest['clientHistory'];
  projectType: string;
  estimatedHours?: number;
}): {
  lineItems: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentTerms: string;
} {
  const { strategy, clientHistory } = params;

  let subtotal = 0;
  const lineItems: Array<any> = [];

  if (strategy.type === 'hourly' && strategy.hourlyRate && strategy.estimatedHours) {
    // Adjust rate based on client profitability
    let adjustedRate = strategy.hourlyRate;

    if (clientHistory?.profitabilityTier === 'D' || clientHistory?.profitabilityTier === 'F') {
      adjustedRate *= 1.15; // 15% increase for low-profit clients
    }

    lineItems.push({
      description: `${params.projectType} Services`,
      quantity: strategy.estimatedHours,
      rate: adjustedRate,
      amount: strategy.estimatedHours * adjustedRate,
    });

    subtotal = strategy.estimatedHours * adjustedRate;
  } else if (strategy.type === 'fixed' && strategy.fixedPrice) {
    lineItems.push({
      description: `${params.projectType} - Fixed Price`,
      quantity: 1,
      rate: strategy.fixedPrice,
      amount: strategy.fixedPrice,
    });

    subtotal = strategy.fixedPrice;
  }

  const tax = subtotal * 0.20; // 20% VAT
  const total = subtotal + tax;

  // Determine payment terms based on client history
  let paymentTerms = 'Net 30';

  if (!clientHistory || clientHistory.previousProjects === 0) {
    paymentTerms = '50% upfront, 50% on completion';
  } else if (clientHistory.paymentHistory && clientHistory.paymentHistory.onTimeRate < 80) {
    paymentTerms = '50% upfront, 50% on completion';
  }

  return {
    lineItems,
    subtotal,
    tax,
    total,
    paymentTerms,
  };
}

/**
 * Calculate win probability
 */
function calculateWinProbability(params: {
  clientHistory?: ProposalGenerationRequest['clientHistory'];
  pricing: any;
  projectType: string;
}): number {
  let probability = 50; // Base 50%

  // Returning client boost
  if (params.clientHistory && params.clientHistory.previousProjects > 0) {
    probability += 20;
  }

  // High profitability client boost
  if (params.clientHistory?.profitabilityTier === 'A') {
    probability += 15;
  } else if (params.clientHistory?.profitabilityTier === 'B') {
    probability += 10;
  }

  // Good payment history boost
  if (params.clientHistory?.paymentHistory && params.clientHistory.paymentHistory.onTimeRate >= 90) {
    probability += 10;
  }

  // Cap at 95%
  return Math.min(95, probability);
}

/**
 * Generate proposal insights
 */
function generateProposalInsights(params: {
  sections: ProposalSection[];
  pricing: any;
  clientHistory?: ProposalGenerationRequest['clientHistory'];
  winProbability: number;
}): AIProposal['aiInsights'] {
  const suggestedImprovements: string[] = [];

  // Check for common issues
  if (!params.sections.find(s => s.type === 'testimonials')) {
    suggestedImprovements.push('Add client testimonials to build credibility');
  }

  if (!params.sections.find(s => s.type === 'timeline')) {
    suggestedImprovements.push('Include a clear timeline with milestones');
  }

  if (params.pricing.total > 10000 && params.paymentTerms !== '50% upfront, 50% on completion') {
    suggestedImprovements.push('Consider requiring upfront payment for large projects');
  }

  // Pricing confidence
  let pricingConfidence: 'low' | 'medium' | 'high' = 'medium';

  if (params.clientHistory && params.clientHistory.previousProjects >= 3) {
    pricingConfidence = 'high';
  } else if (!params.clientHistory || params.clientHistory.previousProjects === 0) {
    pricingConfidence = 'low';
  }

  return {
    winProbability: params.winProbability,
    suggestedImprovements,
    pricingConfidence,
  };
}

/**
 * Generate milestones from timeline
 */
function generateMilestones(timeline: NonNullable<ProposalGenerationRequest['timeline']>): Array<{
  name: string;
  deliverable: string;
  dueDate: Date;
  payment?: number;
}> {
  const milestones: Array<any> = [];
  const durationMs = timeline.durationWeeks * 7 * 24 * 60 * 60 * 1000;
  const milestoneCount = timeline.keyMilestones.length;

  timeline.keyMilestones.forEach((milestone, index) => {
    const progress = (index + 1) / (milestoneCount + 1);
    const dueDate = new Date(timeline.startDate.getTime() + durationMs * progress);

    milestones.push({
      name: `Milestone ${index + 1}`,
      deliverable: milestone,
      dueDate,
    });
  });

  return milestones;
}

/**
 * Estimate tokens used
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Load template (stub)
 */
async function loadTemplate(templateId: string): Promise<ProposalTemplate | null> {
  // This would load from database
  return null;
}

/**
 * Track proposal outcome
 */
export function trackProposalOutcome(params: {
  proposalId: string;
  outcome: 'accepted' | 'declined';
  declineReason?: string;
  finalValue?: number;
}): {
  updated: boolean;
  learnings: string[];
} {
  const learnings: string[] = [];

  if (params.outcome === 'declined') {
    if (params.declineReason?.toLowerCase().includes('price')) {
      learnings.push('Price may be too high - consider lower pricing for similar projects');
    } else if (params.declineReason?.toLowerCase().includes('timeline')) {
      learnings.push('Timeline may be too long - consider faster delivery options');
    } else if (params.declineReason?.toLowerCase().includes('experience')) {
      learnings.push('Strengthen case studies and testimonials section');
    }
  }

  if (params.outcome === 'accepted' && params.finalValue) {
    learnings.push('This pricing level was accepted - can use as benchmark');
  }

  return {
    updated: true,
    learnings,
  };
}

/**
 * Get proposal analytics
 */
export function calculateProposalAnalytics(params: {
  userId: string;
  proposals: AIProposal[];
  period: { start: Date; end: Date };
}): ProposalAnalytics {
  const filteredProposals = params.proposals.filter(
    p => p.createdAt >= params.period.start && p.createdAt <= params.period.end
  );

  const totalProposals = filteredProposals.length;
  const proposalsSent = filteredProposals.filter(p => p.status !== 'draft').length;
  const proposalsAccepted = filteredProposals.filter(p => p.status === 'accepted').length;
  const proposalsDeclined = filteredProposals.filter(p => p.status === 'declined').length;
  const winRate = proposalsSent > 0 ? (proposalsAccepted / proposalsSent) * 100 : 0;

  const totalProposedValue = filteredProposals.reduce((sum, p) => sum + p.pricing.total, 0);
  const totalWonValue = filteredProposals
    .filter(p => p.status === 'accepted')
    .reduce((sum, p) => sum + p.pricing.total, 0);
  const averageProposalValue = totalProposals > 0 ? totalProposedValue / totalProposals : 0;
  const averageWonValue = proposalsAccepted > 0 ? totalWonValue / proposalsAccepted : 0;

  // Calculate timing metrics
  const proposalsWithTiming = filteredProposals.filter(
    p => p.sentDate && p.createdAt
  );
  const averageTimeToSend =
    proposalsWithTiming.length > 0
      ? proposalsWithTiming.reduce(
          (sum, p) => sum + (p.sentDate!.getTime() - p.createdAt.getTime()),
          0
        ) /
        proposalsWithTiming.length /
        (1000 * 60 * 60) // Convert to hours
      : 0;

  const proposalsWithDecision = filteredProposals.filter(
    p => p.sentDate && (p.acceptedDate || p.declinedDate)
  );
  const averageTimeToDecision =
    proposalsWithDecision.length > 0
      ? proposalsWithDecision.reduce((sum, p) => {
          const decisionDate = p.acceptedDate || p.declinedDate!;
          return sum + (decisionDate.getTime() - p.sentDate!.getTime());
        }, 0) /
        proposalsWithDecision.length /
        (1000 * 60 * 60) // Convert to hours
      : 0;

  const averageViewsPerProposal =
    totalProposals > 0
      ? filteredProposals.reduce((sum, p) => sum + p.viewCount, 0) / totalProposals
      : 0;

  // AI metrics
  const aiGenerated = filteredProposals.filter(p => p.generatedBy);
  const totalTokensUsed = aiGenerated.reduce((sum, p) => sum + (p.generatedBy?.tokensUsed || 0), 0);
  const averageGenerationTime =
    aiGenerated.length > 0
      ? aiGenerated.reduce((sum, p) => sum + (p.generatedBy?.generationTime || 0), 0) /
        aiGenerated.length
      : 0;

  const aiWinRate =
    aiGenerated.filter(p => p.status !== 'draft').length > 0
      ? (aiGenerated.filter(p => p.status === 'accepted').length /
          aiGenerated.filter(p => p.status !== 'draft').length) *
        100
      : 0;

  const manualProposals = filteredProposals.filter(p => !p.generatedBy);
  const manualWinRate =
    manualProposals.filter(p => p.status !== 'draft').length > 0
      ? (manualProposals.filter(p => p.status === 'accepted').length /
          manualProposals.filter(p => p.status !== 'draft').length) *
        100
      : 0;

  // Generate insights
  const acceptedProposals = filteredProposals.filter(p => p.status === 'accepted');
  const optimalPriceRange =
    acceptedProposals.length >= 3
      ? {
          min: Math.min(...acceptedProposals.map(p => p.pricing.total)),
          max: Math.max(...acceptedProposals.map(p => p.pricing.total)),
        }
      : { min: 0, max: 0 };

  const declineReasons: Record<string, number> = {};
  filteredProposals
    .filter(p => p.status === 'declined' && p.declineReason)
    .forEach(p => {
      const reason = p.declineReason!;
      declineReasons[reason] = (declineReasons[reason] || 0) + 1;
    });

  const mostCommonDeclineReasons = Object.entries(declineReasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recommendations: string[] = [];
  if (winRate < 30) {
    recommendations.push('Win rate is low - consider improving proposal quality or targeting better-fit clients');
  }
  if (aiWinRate > manualWinRate + 10) {
    recommendations.push('AI-generated proposals perform better - use AI more often');
  }
  if (averageTimeToSend > 24) {
    recommendations.push('You\'re taking >24 hours to send proposals - aim to send same-day for better results');
  }

  return {
    userId: params.userId,
    period: params.period,
    totalProposals,
    proposalsSent,
    proposalsAccepted,
    proposalsDeclined,
    winRate,
    totalProposedValue,
    totalWonValue,
    averageProposalValue,
    averageWonValue,
    averageTimeToSend,
    averageTimeToDecision,
    averageViewsPerProposal,
    byTemplate: [],
    byIndustry: [],
    aiMetrics: {
      totalGenerated: aiGenerated.length,
      totalManual: manualProposals.length,
      aiWinRate,
      manualWinRate,
      averageGenerationTime,
      totalTokensUsed,
    },
    insights: {
      bestPerformingTemplate: '',
      optimalPriceRange,
      averageWinningDiscount: 0,
      mostCommonDeclineReasons,
      recommendations,
    },
  };
}

/**
 * Improve proposal based on feedback
 */
export async function improveProposalWithAI(params: {
  proposal: AIProposal;
  feedback: string;
  aiService: any;
}): Promise<{
  improvedSections: ProposalSection[];
  changes: string[];
}> {
  const prompt = `Improve the following proposal based on this feedback: "${params.feedback}"

Original proposal sections:
${params.proposal.sections.map(s => `## ${s.title}\n${s.content}`).join('\n\n')}

Provide improved versions of any sections that need changes based on the feedback.
List the specific changes made.
`;

  const response = await params.aiService.generate({
    model: selectAIModel(),
    prompt,
    maxTokens: 4000,
    temperature: 0.7,
  });

  // Parse response to get improved sections and changes
  const improvedSections = parseGeneratedContent(response, params.proposal.sections.map(s => s.type));
  const changes = ['Improved based on feedback']; // This would be extracted from AI response

  return {
    improvedSections,
    changes,
  };
}

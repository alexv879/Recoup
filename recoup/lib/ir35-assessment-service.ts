/**
 * IR35 Assessment & Compliance Service
 *
 * IR35 legislation determines if a contractor should be taxed as an employee.
 * Being "inside IR35" means 15-25% less take-home pay due to employer taxes.
 *
 * Research Finding: IR35 causes massive stress for UK freelancers
 * Competitive Gap: ZERO invoicing software offers IR35 assessment
 *
 * Features:
 * - Per-client IR35 status determination
 * - Contract clause suggestions for staying "outside IR35"
 * - IR35 impact calculator (inside vs outside comparison)
 * - Compliance record keeping
 * - Status tracking per client contract
 */

export interface IR35Assessment {
  id: string;
  userId: string;
  clientId: string;
  contractId?: string;

  // Assessment details
  assessmentDate: Date;
  taxYear: string;

  // IR35 Status
  status: 'outside_ir35' | 'inside_ir35' | 'uncertain';
  confidence: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';

  // Assessment factors (CEST - Check Employment Status for Tax)
  factors: {
    control: IR35Factor; // Who controls what, how, when work is done
    substitution: IR35Factor; // Can you send someone else
    mutualObligation: IR35Factor; // Ongoing obligation to provide/accept work
    financialRisk: IR35Factor; // Do you risk your own money
    partAndParcel: IR35Factor; // Are you part of client's organization
    businessOnOwnAccount: IR35Factor; // Running your own business
  };

  // Overall scores
  scores: {
    controlScore: number; // 0-100 (higher = more outside IR35)
    substitutionScore: number;
    mutualObligationScore: number;
    financialRiskScore: number;
    partAndParcelScore: number;
    businessScore: number;
    overallScore: number; // Weighted average
  };

  // Recommendations
  recommendations: {
    contractClauses: string[]; // Clauses to add/modify
    workingPractices: string[]; // How to change working relationship
    documentation: string[]; // What records to keep
    urgency: 'low' | 'medium' | 'high';
  };

  // Financial impact
  financialImpact: {
    currentAnnualIncome: number;
    insideIR35TakeHome: number;
    outsideIR35TakeHome: number;
    potentialLoss: number;
    lossPercentage: number;
  };

  // History
  previousAssessments: Array<{
    date: Date;
    status: string;
    overallScore: number;
  }>;

  // Notes
  notes: string;
  reviewDate: Date; // When to reassess

  createdAt: Date;
  updatedAt: Date;
}

export interface IR35Factor {
  question: string;
  answer: 'yes' | 'no' | 'sometimes' | 'unknown';
  score: number; // 0-100 (contribution to overall)
  weight: number; // Importance of this factor
  evidence: string[]; // Supporting evidence
  redFlags: string[]; // Warning signs
  improvements: string[]; // How to improve this factor
}

export interface IR35ContractReview {
  contractId: string;
  clientId: string;

  // Contract analysis
  hasSubstitutionClause: boolean;
  hasControlClause: boolean;
  hasMutualObligationClause: boolean;
  hasNoticeClause: boolean;

  // Problematic clauses
  riskyPhrases: Array<{
    phrase: string;
    location: string; // Section/paragraph
    risk: 'high' | 'medium' | 'low';
    reason: string;
    suggestedReplacement: string;
  }>;

  // Missing protections
  missingClauses: Array<{
    clause: string;
    importance: 'critical' | 'recommended' | 'optional';
    template: string;
  }>;

  // Overall contract health
  contractScore: number; // 0-100
  recommendation: 'safe' | 'needs_improvement' | 'risky';
}

export interface IR35StatusDeclaration {
  id: string;
  userId: string;
  clientId: string;
  contractId: string;

  // Client's determination (for medium/large companies)
  clientDetermination?: {
    status: 'inside_ir35' | 'outside_ir35';
    determinationDate: Date;
    reasoning: string;
    canDispute: boolean;
    disputeDeadline?: Date;
  };

  // Your assessment
  selfAssessment: {
    status: 'inside_ir35' | 'outside_ir35';
    assessmentDate: Date;
    evidence: string[];
  };

  // Agreed status
  agreedStatus: 'inside_ir35' | 'outside_ir35';
  statusDate: Date;

  // Records
  statusDeclarationSent: boolean;
  statusDeclarationAccepted: boolean;
  records: Array<{
    date: Date;
    event: string;
    documents: string[];
  }>;
}

export interface IR35ComplianceRecord {
  userId: string;
  clientId: string;

  // Working practices evidence
  workingPractices: {
    workLocation: 'client_site' | 'own_office' | 'mixed' | 'remote';
    workHours: 'set_by_client' | 'flexible' | 'own_choice';
    supervision: 'closely_supervised' | 'some_oversight' | 'autonomous';
    integration: 'fully_integrated' | 'partially' | 'separate';
    equipment: 'client_provided' | 'own_equipment' | 'mixed';
  };

  // Financial records
  financialEvidence: {
    hasBusinessInsurance: boolean;
    hasProfessionalIndemnity: boolean;
    hasPublicLiability: boolean;
    hasMultipleClients: boolean;
    numberOfClients: number;
    investsInBusiness: boolean;
    marketingActivities: string[];
  };

  // Substitution evidence
  substitutionEvidence: {
    hasSubstitutes: boolean;
    substitutesSent: number;
    clientApprovedSubstitutes: boolean;
    substitutionClauseInContract: boolean;
  };

  // Control evidence
  controlEvidence: {
    whoSetsDeadlines: 'client' | 'you' | 'agreed';
    whoDefinesWork: 'client' | 'you' | 'collaborative';
    canRefuseWork: boolean;
    mustFollowPolicies: boolean;
    requiresApproval: boolean;
  };

  // Documentation
  documents: Array<{
    type: 'contract' | 'sow' | 'invoice' | 'correspondence' | 'working_practice';
    filename: string;
    uploadDate: Date;
    description: string;
  }>;

  lastUpdated: Date;
}

export interface IR35Settings {
  userId: string;

  // User preferences
  defaultStatus: 'outside_ir35' | 'inside_ir35';
  autoAssess: boolean; // Automatically assess new contracts

  // Alerts
  alerts: {
    reviewDueReminder: boolean;
    riskLevelChange: boolean;
    newLegislation: boolean;
    clientDetermination: boolean;
  };

  // Professional advice
  hasAccountant: boolean;
  accountantDetails?: {
    name: string;
    firm: string;
    email: string;
    phone: string;
  };

  // Tax setup
  taxSetup: {
    hasLimitedCompany: boolean;
    companyNumber?: string;
    utr?: string;
    payrollProvider?: string;
  };
}

/**
 * Calculate IR35 status based on CEST factors
 */
export function assessIR35Status(params: {
  userId: string;
  clientId: string;
  contractId?: string;

  // CEST questions
  control: {
    whoDecidesTasks: 'client' | 'you' | 'both';
    whoDecidesMethods: 'client' | 'you' | 'both';
    whoDecidesTiming: 'client' | 'you' | 'both';
    canRefuseWork: boolean;
    mustFollowPolicies: boolean;
  };

  substitution: {
    canSendSubstitute: boolean;
    clientMustAccept: boolean;
    youPaySubstitute: boolean;
    hasHappened: boolean;
  };

  mutualObligation: {
    ongoingWork: boolean;
    mustAcceptWork: boolean;
    mustProvideWork: boolean;
    noticePeriod: number; // Days
  };

  financialRisk: {
    fixedPrice: boolean;
    mustFixMistakes: boolean;
    ownEquipment: boolean;
    ownExpenses: boolean;
    canMakeLoss: boolean;
  };

  partAndParcel: {
    managerialRole: boolean;
    clientEmail: boolean;
    clientBadge: boolean;
    teamMeetings: boolean;
    benefitsOffered: boolean;
  };

  business: {
    multipleClients: boolean;
    numberOfClients: number;
    marketing: boolean;
    businessInsurance: boolean;
    investInBusiness: boolean;
  };

  currentAnnualIncome: number;
}): IR35Assessment {
  const assessmentId = `ir35_${Date.now()}`;

  // Score each factor (0-100, higher = more outside IR35)
  const controlScore = calculateControlScore(params.control);
  const substitutionScore = calculateSubstitutionScore(params.substitution);
  const mutualObligationScore = calculateMutualObligationScore(params.mutualObligation);
  const financialRiskScore = calculateFinancialRiskScore(params.financialRisk);
  const partAndParcelScore = calculatePartAndParcelScore(params.partAndParcel);
  const businessScore = calculateBusinessScore(params.business);

  // Weights based on case law importance
  const weights = {
    control: 0.25, // Most important factor
    substitution: 0.20, // Very important
    mutualObligation: 0.15,
    financialRisk: 0.15,
    partAndParcel: 0.15,
    business: 0.10,
  };

  const overallScore =
    controlScore * weights.control +
    substitutionScore * weights.substitution +
    mutualObligationScore * weights.mutualObligation +
    financialRiskScore * weights.financialRisk +
    partAndParcelScore * weights.partAndParcel +
    businessScore * weights.business;

  // Determine status
  let status: IR35Assessment['status'];
  let confidence: number;
  let riskLevel: IR35Assessment['riskLevel'];

  if (overallScore >= 70) {
    status = 'outside_ir35';
    confidence = Math.min(95, overallScore);
    riskLevel = 'low';
  } else if (overallScore >= 50) {
    status = 'uncertain';
    confidence = 60;
    riskLevel = 'medium';
  } else {
    status = 'inside_ir35';
    confidence = Math.min(95, 100 - overallScore);
    riskLevel = 'high';
  }

  // Generate recommendations
  const recommendations = generateIR35Recommendations({
    status,
    scores: {
      controlScore,
      substitutionScore,
      mutualObligationScore,
      financialRiskScore,
      partAndParcelScore,
      businessScore,
    },
    params,
  });

  // Calculate financial impact
  const financialImpact = calculateIR35FinancialImpact({
    annualIncome: params.currentAnnualIncome,
  });

  return {
    id: assessmentId,
    userId: params.userId,
    clientId: params.clientId,
    contractId: params.contractId,
    assessmentDate: new Date(),
    taxYear: getCurrentTaxYear(),
    status,
    confidence,
    riskLevel,
    factors: {
      control: createFactorDetails('control', params.control, controlScore, weights.control),
      substitution: createFactorDetails('substitution', params.substitution, substitutionScore, weights.substitution),
      mutualObligation: createFactorDetails('mutualObligation', params.mutualObligation, mutualObligationScore, weights.mutualObligation),
      financialRisk: createFactorDetails('financialRisk', params.financialRisk, financialRiskScore, weights.financialRisk),
      partAndParcel: createFactorDetails('partAndParcel', params.partAndParcel, partAndParcelScore, weights.partAndParcel),
      businessOnOwnAccount: createFactorDetails('business', params.business, businessScore, weights.business),
    },
    scores: {
      controlScore,
      substitutionScore,
      mutualObligationScore,
      financialRiskScore,
      partAndParcelScore,
      businessScore,
      overallScore,
    },
    recommendations,
    financialImpact,
    previousAssessments: [],
    notes: '',
    reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Review in 90 days
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Calculate control score (0-100)
 * Higher score = more outside IR35
 */
function calculateControlScore(control: any): number {
  let score = 0;

  if (control.whoDecidesTasks === 'you') score += 30;
  else if (control.whoDecidesTasks === 'both') score += 15;

  if (control.whoDecidesMethods === 'you') score += 30;
  else if (control.whoDecidesMethods === 'both') score += 15;

  if (control.whoDecidesTiming === 'you') score += 20;
  else if (control.whoDecidesTiming === 'both') score += 10;

  if (control.canRefuseWork) score += 15;
  if (!control.mustFollowPolicies) score += 5;

  return score;
}

/**
 * Calculate substitution score (0-100)
 */
function calculateSubstitutionScore(substitution: any): number {
  let score = 0;

  if (substitution.canSendSubstitute) score += 40;
  if (!substitution.clientMustAccept) score += 30; // Client can't refuse
  if (substitution.youPaySubstitute) score += 20;
  if (substitution.hasHappened) score += 10;

  return score;
}

/**
 * Calculate mutual obligation score (0-100)
 */
function calculateMutualObligationScore(mutualObligation: any): number {
  let score = 0;

  if (!mutualObligation.ongoingWork) score += 40;
  if (!mutualObligation.mustAcceptWork) score += 30;
  if (!mutualObligation.mustProvideWork) score += 20;
  if (mutualObligation.noticePeriod === 0) score += 10;
  else if (mutualObligation.noticePeriod <= 7) score += 5;

  return score;
}

/**
 * Calculate financial risk score (0-100)
 */
function calculateFinancialRiskScore(financialRisk: any): number {
  let score = 0;

  if (financialRisk.fixedPrice) score += 25;
  if (financialRisk.mustFixMistakes) score += 25;
  if (financialRisk.ownEquipment) score += 20;
  if (financialRisk.ownExpenses) score += 15;
  if (financialRisk.canMakeLoss) score += 15;

  return score;
}

/**
 * Calculate part and parcel score (0-100)
 */
function calculatePartAndParcelScore(partAndParcel: any): number {
  let score = 100; // Start at 100, deduct for integration

  if (partAndParcel.managerialRole) score -= 25;
  if (partAndParcel.clientEmail) score -= 20;
  if (partAndParcel.clientBadge) score -= 20;
  if (partAndParcel.teamMeetings) score -= 15;
  if (partAndParcel.benefitsOffered) score -= 20;

  return Math.max(0, score);
}

/**
 * Calculate business on own account score (0-100)
 */
function calculateBusinessScore(business: any): number {
  let score = 0;

  if (business.multipleClients) score += 30;
  if (business.numberOfClients >= 5) score += 20;
  else if (business.numberOfClients >= 3) score += 10;

  if (business.marketing) score += 20;
  if (business.businessInsurance) score += 15;
  if (business.investInBusiness) score += 15;

  return score;
}

/**
 * Create detailed factor information
 */
function createFactorDetails(
  factorName: string,
  answers: any,
  score: number,
  weight: number
): IR35Factor {
  const factorQuestions: Record<string, string> = {
    control: 'Who controls what work is done, how it is done, and when?',
    substitution: 'Can you send a substitute to do the work?',
    mutualObligation: 'Is there ongoing obligation to provide/accept work?',
    financialRisk: 'Do you risk your own money in the contract?',
    partAndParcel: 'Are you integrated into the client\'s organization?',
    business: 'Are you in business on your own account?',
  };

  // Generate evidence, red flags, and improvements based on score
  const evidence: string[] = [];
  const redFlags: string[] = [];
  const improvements: string[] = [];

  if (factorName === 'control') {
    if (answers.whoDecidesTasks === 'you') {
      evidence.push('You decide what tasks to work on');
    } else {
      redFlags.push('Client controls task assignment');
      improvements.push('Negotiate more autonomy in task selection');
    }

    if (answers.canRefuseWork) {
      evidence.push('You can refuse additional work');
    } else {
      redFlags.push('Must accept all work assigned');
      improvements.push('Add clause allowing you to decline work');
    }
  }

  if (factorName === 'substitution') {
    if (answers.canSendSubstitute) {
      evidence.push('Contract includes right of substitution');
    } else {
      redFlags.push('No substitution right in contract');
      improvements.push('Add unrestricted substitution clause');
    }

    if (answers.hasHappened) {
      evidence.push('Substitution has been used in practice');
    } else {
      improvements.push('Document ability to use substitutes');
    }
  }

  return {
    question: factorQuestions[factorName] || '',
    answer: 'unknown',
    score,
    weight,
    evidence,
    redFlags,
    improvements,
  };
}

/**
 * Generate recommendations based on assessment
 */
function generateIR35Recommendations(params: {
  status: IR35Assessment['status'];
  scores: any;
  params: any;
}): IR35Assessment['recommendations'] {
  const contractClauses: string[] = [];
  const workingPractices: string[] = [];
  const documentation: string[] = [];
  let urgency: 'low' | 'medium' | 'high' = 'low';

  if (params.status === 'inside_ir35') {
    urgency = 'high';

    contractClauses.push(
      'Add unrestricted right of substitution clause',
      'Remove any "personal service" requirements',
      'Specify you control methods and timing of work',
      'Include statement: "This is a contract for services, not of service"',
      'Add notice period of zero or minimal days'
    );

    workingPractices.push(
      'Work from your own office when possible',
      'Use your own equipment and tools',
      'Do not use client email address or badge',
      'Maintain separate business identity',
      'Take on additional clients to demonstrate business activity',
      'Do not attend all-hands meetings or social events',
      'Invoice via limited company, not as individual'
    );

    documentation.push(
      'Keep records of working autonomously',
      'Document any substitute arrangements',
      'Save evidence of multiple client work',
      'Keep receipts for business investments',
      'Maintain professional indemnity insurance',
      'Record instances of declining additional work'
    );
  } else if (params.status === 'uncertain') {
    urgency = 'medium';

    if (params.scores.substitutionScore < 60) {
      contractClauses.push('Strengthen substitution rights in contract');
      workingPractices.push('Identify potential substitutes and inform client');
    }

    if (params.scores.controlScore < 60) {
      contractClauses.push('Clarify you control methods and timing');
      workingPractices.push('Work more autonomously, report on outcomes not hours');
    }

    if (params.scores.businessScore < 60) {
      workingPractices.push('Actively market your services to other clients');
      workingPractices.push('Invest in business development and training');
    }
  }

  return {
    contractClauses,
    workingPractices,
    documentation,
    urgency,
  };
}

/**
 * Calculate financial impact of IR35 status
 */
export function calculateIR35FinancialImpact(params: {
  annualIncome: number;
}): IR35Assessment['financialImpact'] {
  const annualIncome = params.annualIncome;

  // Outside IR35: Take dividend route (more tax efficient)
  // Assume: £12,570 salary (personal allowance) + dividends
  const salary = 12570;
  const dividends = annualIncome - salary;

  // Dividend tax rates 2025/26
  const dividendAllowance = 500;
  const basicRateDividendTax = 0.0875;
  const higherRateDividendTax = 0.3375;
  const additionalRateDividendTax = 0.3935;

  // Basic rate threshold: £50,270
  const basicRateThreshold = 50270;
  const higherRateThreshold = 125140;

  let dividendTax = 0;
  let taxableDividends = Math.max(0, dividends - dividendAllowance);

  if (annualIncome <= basicRateThreshold) {
    dividendTax = taxableDividends * basicRateDividendTax;
  } else if (annualIncome <= higherRateThreshold) {
    const basicRateDividends = Math.max(0, basicRateThreshold - salary);
    const higherRateDividends = Math.max(0, taxableDividends - basicRateDividends);
    dividendTax =
      basicRateDividends * basicRateDividendTax +
      higherRateDividends * higherRateDividendTax;
  } else {
    const basicRateDividends = Math.max(0, basicRateThreshold - salary);
    const higherRateDividends = Math.max(0, higherRateThreshold - basicRateThreshold);
    const additionalRateDividends = Math.max(0, taxableDividends - basicRateDividends - higherRateDividends);
    dividendTax =
      basicRateDividends * basicRateDividendTax +
      higherRateDividends * higherRateDividendTax +
      additionalRateDividends * additionalRateDividendTax;
  }

  // Outside IR35: Corporation tax on company profit
  const corporationTaxRate = 0.19; // 19% for small companies
  const corporationTax = annualIncome * corporationTaxRate;
  const afterCorpTax = annualIncome - corporationTax;

  const outsideIR35TakeHome = afterCorpTax - dividendTax;

  // Inside IR35: Deemed employment
  // Pay employer NI (13.8%) + employee NI (12% up to UEL, 2% above)
  const employerNI = annualIncome * 0.138;
  const upperEarningsLimit = 50270;

  let employeeNI = 0;
  if (annualIncome <= upperEarningsLimit) {
    employeeNI = annualIncome * 0.12;
  } else {
    employeeNI = upperEarningsLimit * 0.12 + (annualIncome - upperEarningsLimit) * 0.02;
  }

  // Income tax
  let incomeTax = 0;
  const personalAllowance = 12570;

  if (annualIncome <= personalAllowance) {
    incomeTax = 0;
  } else if (annualIncome <= basicRateThreshold) {
    incomeTax = (annualIncome - personalAllowance) * 0.20;
  } else if (annualIncome <= higherRateThreshold) {
    incomeTax =
      (basicRateThreshold - personalAllowance) * 0.20 +
      (annualIncome - basicRateThreshold) * 0.40;
  } else {
    incomeTax =
      (basicRateThreshold - personalAllowance) * 0.20 +
      (higherRateThreshold - basicRateThreshold) * 0.40 +
      (annualIncome - higherRateThreshold) * 0.45;
  }

  const insideIR35TakeHome = annualIncome - employerNI - employeeNI - incomeTax;

  const potentialLoss = outsideIR35TakeHome - insideIR35TakeHome;
  const lossPercentage = (potentialLoss / outsideIR35TakeHome) * 100;

  return {
    currentAnnualIncome: annualIncome,
    insideIR35TakeHome: Math.round(insideIR35TakeHome),
    outsideIR35TakeHome: Math.round(outsideIR35TakeHome),
    potentialLoss: Math.round(potentialLoss),
    lossPercentage: Math.round(lossPercentage * 10) / 10,
  };
}

/**
 * Review contract for IR35 compliance
 */
export async function reviewContractForIR35(params: {
  contractText: string;
  aiService: any; // AI service for text analysis
}): Promise<IR35ContractReview> {
  const contractId = `contract_${Date.now()}`;

  // Check for key clauses
  const hasSubstitutionClause = /substitut(e|ion)/i.test(params.contractText);
  const hasControlClause = /control|direct|supervis/i.test(params.contractText);
  const hasMutualObligationClause = /ongoing|continuous|must (accept|provide)/i.test(params.contractText);
  const hasNoticeClause = /notice period|termination/i.test(params.contractText);

  // Find risky phrases using AI
  const riskyPhrases = await findRiskyPhrases(params.contractText, params.aiService);

  // Find missing clauses
  const missingClauses = findMissingClauses({
    hasSubstitutionClause,
    hasControlClause,
    hasMutualObligationClause,
    hasNoticeClause,
  });

  // Calculate contract score
  let contractScore = 50;
  if (hasSubstitutionClause) contractScore += 20;
  if (!hasControlClause) contractScore += 15;
  if (!hasMutualObligationClause) contractScore += 15;
  contractScore -= riskyPhrases.length * 5;
  contractScore = Math.max(0, Math.min(100, contractScore));

  let recommendation: IR35ContractReview['recommendation'];
  if (contractScore >= 70) recommendation = 'safe';
  else if (contractScore >= 50) recommendation = 'needs_improvement';
  else recommendation = 'risky';

  return {
    contractId,
    clientId: '',
    hasSubstitutionClause,
    hasControlClause,
    hasMutualObligationClause,
    hasNoticeClause,
    riskyPhrases,
    missingClauses,
    contractScore,
    recommendation,
  };
}

async function findRiskyPhrases(contractText: string, aiService: any): Promise<Array<any>> {
  // This would use AI to find problematic phrases
  // For now, return common risky phrases
  const riskyPatterns = [
    { phrase: 'personal service', risk: 'high' as const, reason: 'Suggests you must personally do the work' },
    { phrase: 'under the direction of', risk: 'high' as const, reason: 'Indicates client control' },
    { phrase: 'part of the team', risk: 'medium' as const, reason: 'Suggests integration' },
    { phrase: 'employee benefits', risk: 'high' as const, reason: 'Treated like employee' },
    { phrase: 'must attend', risk: 'medium' as const, reason: 'Reduced autonomy' },
  ];

  const found: Array<any> = [];

  for (const pattern of riskyPatterns) {
    if (new RegExp(pattern.phrase, 'i').test(contractText)) {
      found.push({
        phrase: pattern.phrase,
        location: 'Contract body',
        risk: pattern.risk,
        reason: pattern.reason,
        suggestedReplacement: getSuggestedReplacement(pattern.phrase),
      });
    }
  }

  return found;
}

function getSuggestedReplacement(phrase: string): string {
  const replacements: Record<string, string> = {
    'personal service': 'The Contractor may provide services through substitutes',
    'under the direction of': 'The Contractor shall deliver agreed outcomes',
    'part of the team': 'The Contractor is engaged as an independent business',
    'employee benefits': 'No employee benefits are provided',
    'must attend': 'The Contractor may attend if relevant to deliverables',
  };

  return replacements[phrase.toLowerCase()] || 'Remove this phrase';
}

function findMissingClauses(clauses: {
  hasSubstitutionClause: boolean;
  hasControlClause: boolean;
  hasMutualObligationClause: boolean;
  hasNoticeClause: boolean;
}): Array<any> {
  const missing: Array<any> = [];

  if (!clauses.hasSubstitutionClause) {
    missing.push({
      clause: 'Right of Substitution',
      importance: 'critical' as const,
      template: 'The Contractor reserves the right to provide a substitute to perform the Services, and the Client may not unreasonably refuse such substitute.',
    });
  }

  if (clauses.hasControlClause) {
    missing.push({
      clause: 'Autonomy Clause',
      importance: 'critical' as const,
      template: 'The Contractor shall have sole discretion as to the manner, method, and means by which the Services are performed.',
    });
  }

  if (clauses.hasMutualObligationClause) {
    missing.push({
      clause: 'No Obligation Clause',
      importance: 'recommended' as const,
      template: 'Neither party is obliged to offer or accept further work beyond this specific engagement.',
    });
  }

  return missing;
}

/**
 * Get current UK tax year
 */
function getCurrentTaxYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // UK tax year runs April 6 to April 5
  if (month < 3 || (month === 3 && now.getDate() < 6)) {
    return `${year - 1}/${year}`;
  } else {
    return `${year}/${year + 1}`;
  }
}

/**
 * Track IR35 status change
 */
export function trackIR35StatusChange(params: {
  previousAssessment: IR35Assessment;
  newAssessment: IR35Assessment;
}): {
  hasChanged: boolean;
  changes: Array<{
    factor: string;
    previousScore: number;
    newScore: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  recommendation: string;
} {
  const changes: Array<any> = [];

  const factorKeys: Array<keyof typeof params.previousAssessment.scores> = [
    'controlScore',
    'substitutionScore',
    'mutualObligationScore',
    'financialRiskScore',
    'partAndParcelScore',
    'businessScore',
  ];

  for (const key of factorKeys) {
    const previousScore = params.previousAssessment.scores[key];
    const newScore = params.newAssessment.scores[key];

    if (Math.abs(previousScore - newScore) > 5) {
      // Significant change
      changes.push({
        factor: key.replace('Score', ''),
        previousScore,
        newScore,
        impact: newScore > previousScore ? 'positive' : 'negative',
      });
    }
  }

  const hasChanged = changes.length > 0 ||
    params.previousAssessment.status !== params.newAssessment.status;

  let recommendation = '';
  if (hasChanged) {
    if (params.newAssessment.status === 'outside_ir35' &&
        params.previousAssessment.status !== 'outside_ir35') {
      recommendation = 'Great! Your IR35 status has improved to outside IR35. Continue current working practices.';
    } else if (params.newAssessment.status === 'inside_ir35' &&
        params.previousAssessment.status !== 'inside_ir35') {
      recommendation = 'WARNING: Your IR35 status has changed to inside IR35. Review contract and working practices urgently.';
    } else {
      recommendation = 'Your IR35 factors have changed. Review the detailed changes and adjust accordingly.';
    }
  }

  return {
    hasChanged,
    changes,
    recommendation,
  };
}

/**
 * Generate IR35 status report for client
 */
export function generateIR35StatusReport(params: {
  assessment: IR35Assessment;
  includeFinancialImpact: boolean;
}): {
  summary: string;
  details: string[];
  contractSuggestions: string[];
} {
  const summary = `IR35 Assessment Result: ${params.assessment.status.toUpperCase().replace('_', ' ')}
Overall Score: ${Math.round(params.assessment.scores.overallScore)}/100
Risk Level: ${params.assessment.riskLevel.toUpperCase()}
Confidence: ${params.assessment.confidence}%`;

  const details = [
    `Control: ${Math.round(params.assessment.scores.controlScore)}/100`,
    `Substitution: ${Math.round(params.assessment.scores.substitutionScore)}/100`,
    `Mutual Obligation: ${Math.round(params.assessment.scores.mutualObligationScore)}/100`,
    `Financial Risk: ${Math.round(params.assessment.scores.financialRiskScore)}/100`,
    `Part and Parcel: ${Math.round(params.assessment.scores.partAndParcelScore)}/100`,
    `Business on Own Account: ${Math.round(params.assessment.scores.businessScore)}/100`,
  ];

  if (params.includeFinancialImpact) {
    details.push('');
    details.push('Financial Impact:');
    details.push(`Annual Income: £${params.assessment.financialImpact.currentAnnualIncome.toLocaleString()}`);
    details.push(`Outside IR35: £${params.assessment.financialImpact.outsideIR35TakeHome.toLocaleString()}`);
    details.push(`Inside IR35: £${params.assessment.financialImpact.insideIR35TakeHome.toLocaleString()}`);
    details.push(`Potential Loss: £${params.assessment.financialImpact.potentialLoss.toLocaleString()} (${params.assessment.financialImpact.lossPercentage}%)`);
  }

  return {
    summary,
    details,
    contractSuggestions: params.assessment.recommendations.contractClauses,
  };
}

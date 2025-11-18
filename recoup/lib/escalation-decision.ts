/**
 * ESCALATION DECISION ENGINE
 * 
 * Helps users decide between County Court claim vs Debt Collection Agency
 * Based on UK legal system costs, timelines, and success rates
 * 
 * Research Impact:
 * - County Court: 66-75% success rate with judgment, 30-90 day timeline
 * - Debt Agency: 50-60% success rate, 60+ day timeline, 15-25% commission
 * - Clear decision logic improves recovery rates by reducing hesitation
 * 
 * Decision Factors:
 * - Invoice amount (Court cost-effective for >£1k, Agency for >£5k)
 * - Debt clarity (Court better for clear debt, Agency for disputed)
 * - Debtor type (Court for businesses, Agency for individuals)
 * - Relationship importance (Agency less damaging than Court)
 * - Time sensitivity (Court faster for clear cases)
 * 
 * COUNTY COURT CLAIMS:
 * - Money Claim Online (MCOL): https://www.moneyclaim.gov.uk
 * - GOV.UK Guide: https://www.gov.uk/make-court-claim-for-money
 * - Find Court: https://www.gov.uk/find-court-tribunal
 * - HMCTS Helpline: 0300 123 1057 (Mon-Fri 9am-5pm)
 * 
 * COURT PROCESS (Standard UK):
 * 1. File claim online via MCOL (£35-£455 fee, 15-30 mins)
 * 2. Court serves claim on debtor (5-7 days postal)
 * 3. Debtor has 14 days to respond:
 *    a) Admit claim → Payment plan or immediate settlement
 *    b) Defend claim → Case allocated to hearing (8-12 weeks)
 *    c) No response → Default Judgment entered automatically
 * 4. Default Judgment (most common, ~60% of cases):
 *    - Automatically granted if no response after 14 days
 *    - Creditor can immediately enforce (bailiffs, charging orders)
 *    - CCJ registered against debtor (credit record impact)
 * 5. Defended Hearing:
 *    - Small Claims Track (<£10k) or Fast Track (£10k-£25k)
 *    - Parties file evidence and witness statements
 *    - Hearing date set (8-12 weeks typical wait)
 *    - Judge hears both sides and makes decision
 *    - Costs awarded to winner (typically £50-£100 for small claims)
 * 6. Enforcement Options:
 *    - Warrant of Control (bailiffs visit debtor) - £110 fee
 *    - Attachment of Earnings (deduct from salary) - £110 fee
 *    - Charging Order (secure against property) - £110 fee
 *    - Third Party Debt Order (freeze bank account) - £110 fee
 * 
 * DEBT AGENCY PROCESS:
 * - Agency sends 14-day demand letter (FCA CONC 7 compliant)
 * - Intensive 60-90 day collection period (phone/email/letter)
 * - Office hours only (8am-9pm Mon-Sat, no Sundays per FCA rules)
 * - Negotiated settlements (often 70-90% of debt)
 * - Commission deducted from recovered amount (15-25%)
 * - If unsuccessful, may recommend Court or write-off
 * 
 * EXTERNAL SUPPORT:
 * - Small Business Commissioner: https://smallbusinesscommissioner.gov.uk (free dispute resolution)
 * - Citizens Advice: https://www.citizensadvice.org.uk (free legal advice)
 * - FSB Legal Helpline: https://www.fsb.org.uk (members only, 0808 20 20 888)
 * 
 * For complete legal resources, see: docs/late-payment-legal-resources.md
 */

// ============================================================
// TYPES
// ============================================================

export interface EscalationDecisionParams {
    invoiceAmount: number;
    daysOverdue: number;
    isDisputedDebt?: boolean;
    debtorType?: 'business' | 'individual' | 'unknown';
    previousAttempts?: number; // Number of collection attempts made
    relationshipValue?: 'low' | 'medium' | 'high'; // Importance of ongoing relationship
    hasWrittenContract?: boolean;
    hasProofOfDelivery?: boolean;
    debtorHasAssets?: boolean | 'unknown';
}

export interface EscalationRecommendation {
    primaryOption: 'county_court' | 'debt_agency' | 'write_off' | 'continue_internal';
    confidence: number; // 0-100
    reasoning: string[];
    costs: {
        countyCourtFee?: number;
        agencyCommission?: {
            min: number;
            max: number;
            percentage: string;
        };
        netRecovery?: {
            courtOption: number;
            agencyOption: number;
        };
    };
    timeline: {
        courtDays?: string;
        agencyDays?: string;
    };
    successRate: {
        court?: string;
        agency?: string;
    };
    nextSteps: string[];
    warnings?: string[];
}

// ============================================================
// COUNTY COURT FEE SCHEDULE
// ============================================================

/**
 * UK County Court fees (Money Claim Online)
 * Updated: November 2024
 * Source: https://www.gov.uk/make-court-claim-for-money
 */
export function getCountyCourtFee(claimAmount: number): number {
    if (claimAmount <= 300) return 35;
    if (claimAmount <= 500) return 50;
    if (claimAmount <= 1000) return 70;
    if (claimAmount <= 1500) return 80;
    if (claimAmount <= 3000) return 115;
    if (claimAmount <= 5000) return 205;
    if (claimAmount <= 10000) return 455;

    // Above £10,000: 5% of claim value (max £10,000 fee)
    const fee = claimAmount * 0.05;
    return Math.min(fee, 10000);
}

/**
 * Calculate agency commission range
 */
export function calculateAgencyCommission(amount: number): {
    min: number;
    max: number;
    percentage: string;
} {
    const minRate = 0.15; // 15%
    const maxRate = 0.25; // 25%

    return {
        min: amount * minRate,
        max: amount * maxRate,
        percentage: '15-25%',
    };
}

// ============================================================
// DECISION ENGINE
// ============================================================

/**
 * Generate escalation recommendation based on invoice and debtor characteristics
 */
export function generateEscalationRecommendation(
    params: EscalationDecisionParams
): EscalationRecommendation {
    const {
        invoiceAmount,
        daysOverdue,
        isDisputedDebt = false,
        debtorType = 'unknown',
        previousAttempts = 0,
        relationshipValue = 'medium',
        hasWrittenContract = false,
        hasProofOfDelivery = false,
        debtorHasAssets = 'unknown',
    } = params;

    const courtFee = getCountyCourtFee(invoiceAmount);
    const agencyCommission = calculateAgencyCommission(invoiceAmount);

    const netRecoveryIfCourt = invoiceAmount - courtFee;
    const netRecoveryIfAgencyMin = invoiceAmount - agencyCommission.max; // Worst case (25%)
    const netRecoveryIfAgencyMax = invoiceAmount - agencyCommission.min; // Best case (15%)

    let score = {
        court: 0,
        agency: 0,
        writeOff: 0,
        continueInternal: 0,
    };

    const reasoning: string[] = [];
    const warnings: string[] = [];
    const nextSteps: string[] = [];

    // ============================================================
    // SCORING LOGIC
    // ============================================================

    // Factor 1: Invoice Amount
    if (invoiceAmount < 500) {
        score.writeOff += 30;
        score.continueInternal += 20;
        reasoning.push(`Low invoice amount (${formatCurrency(invoiceAmount)}) - recovery costs may exceed debt`);
        warnings.push(`Court fee (£${courtFee}) is ${((courtFee / invoiceAmount) * 100).toFixed(0)}% of invoice value`);
    } else if (invoiceAmount >= 500 && invoiceAmount < 1500) {
        score.court += 20;
        score.continueInternal += 30;
        reasoning.push(`Moderate amount (${formatCurrency(invoiceAmount)}) - County Court cost-effective`);
    } else if (invoiceAmount >= 1500 && invoiceAmount < 5000) {
        score.court += 40;
        score.agency += 20;
        reasoning.push(`Good amount for County Court (${formatCurrency(invoiceAmount)}), also viable for agency`);
    } else {
        score.court += 30;
        score.agency += 40;
        reasoning.push(`High value debt (${formatCurrency(invoiceAmount)}) - both Court and Agency viable, Agency may be more effective`);
    }

    // Factor 2: Days Overdue
    if (daysOverdue < 45) {
        score.continueInternal += 30;
        reasoning.push(`Only ${daysOverdue} days overdue - continue internal collection efforts`);
    } else if (daysOverdue >= 45 && daysOverdue < 90) {
        score.court += 25;
        score.agency += 25;
        reasoning.push(`${daysOverdue} days overdue - escalation recommended`);
    } else {
        score.court += 35;
        score.agency += 35;
        reasoning.push(`Severely overdue (${daysOverdue} days) - urgent escalation required`);
        warnings.push(`Long overdue debts have lower recovery rates`);
    }

    // Factor 3: Debt Clarity
    if (isDisputedDebt) {
        score.agency += 30;
        score.court -= 20;
        reasoning.push(`Disputed debt - Agency negotiation may be more effective than Court`);
        warnings.push(`Court requires clear, undisputed debt. Gather evidence before filing.`);
    } else {
        score.court += 30;
        reasoning.push(`Clear, undisputed debt - ideal for County Court`);
    }

    // Factor 4: Evidence Strength
    if (hasWrittenContract && hasProofOfDelivery) {
        score.court += 35;
        reasoning.push(`Strong evidence (contract + proof of delivery) - excellent for Court claim`);
    } else if (hasWrittenContract || hasProofOfDelivery) {
        score.court += 20;
        reasoning.push(`Good evidence available - suitable for Court`);
    } else {
        score.court -= 15;
        score.agency += 10;
        warnings.push(`Weak evidence - may struggle in Court. Gather documentation.`);
    }

    // Factor 5: Debtor Type
    if (debtorType === 'business') {
        score.court += 25;
        reasoning.push(`Business debtor - County Court effective for B2B disputes`);
    } else if (debtorType === 'individual') {
        score.agency += 20;
        reasoning.push(`Individual debtor - Agency may be more persistent`);
    }

    // Factor 6: Debtor Assets
    if (debtorHasAssets === true) {
        score.court += 25;
        reasoning.push(`Debtor has known assets - Court judgment enables enforcement`);
    } else if (debtorHasAssets === false) {
        score.writeOff += 30;
        warnings.push(`Debtor has no known assets - recovery may be impossible even with judgment`);
    }

    // Factor 7: Relationship Value
    if (relationshipValue === 'high') {
        score.agency += 15;
        score.court -= 10;
        score.continueInternal += 20;
        reasoning.push(`High relationship value - Agency less damaging than Court action`);
        warnings.push(`Legal action will likely end the business relationship`);
    } else if (relationshipValue === 'low') {
        score.court += 15;
        reasoning.push(`Low relationship value - no concern about damaging relationship`);
    }

    // Factor 8: Previous Attempts
    if (previousAttempts < 3) {
        score.continueInternal += 25;
        reasoning.push(`Only ${previousAttempts} previous attempts - try more internal collection first`);
    } else if (previousAttempts >= 3 && previousAttempts < 6) {
        score.court += 20;
        score.agency += 20;
        reasoning.push(`${previousAttempts} failed attempts - escalation appropriate`);
    } else {
        score.court += 30;
        score.agency += 30;
        reasoning.push(`${previousAttempts} failed attempts - immediate escalation recommended`);
    }

    // ============================================================
    // DETERMINE RECOMMENDATION
    // ============================================================

    const maxScore = Math.max(score.court, score.agency, score.writeOff, score.continueInternal);
    let primaryOption: EscalationRecommendation['primaryOption'];
    let confidence: number;

    if (score.court === maxScore) {
        primaryOption = 'county_court';
        confidence = Math.min((score.court / 200) * 100, 95); // Scale to 0-95%
    } else if (score.agency === maxScore) {
        primaryOption = 'debt_agency';
        confidence = Math.min((score.agency / 200) * 100, 95);
    } else if (score.continueInternal === maxScore) {
        primaryOption = 'continue_internal';
        confidence = Math.min((score.continueInternal / 200) * 100, 90);
    } else {
        primaryOption = 'write_off';
        confidence = Math.min((score.writeOff / 200) * 100, 85);
    }

    // ============================================================
    // GENERATE NEXT STEPS
    // ============================================================

    if (primaryOption === 'county_court') {
        nextSteps.push(
            '1. Gather all evidence: invoice, contract, proof of delivery, correspondence',
            '2. Send formal "Letter Before Action" giving 14 days to pay',
            '3. If no response, file claim via Money Claim Online (moneyclaim.gov.uk)',
            `4. Pay court fee: £${courtFee} (added to your claim)`,
            '5. Wait 14 days for debtor response',
            '6. If no response, request default judgment',
            '7. Once judgment obtained, enforce via bailiffs or charging order'
        );
    } else if (primaryOption === 'debt_agency') {
        nextSteps.push(
            '1. Choose reputable agency: Lowell, Cabot, Moorcroft, or ARC Europe',
            '2. Provide invoice, contract, proof of delivery, and collection history',
            `3. Expect commission: ${agencyCommission.percentage} of recovered amount`,
            `4. Net recovery: ${formatCurrency(netRecoveryIfAgencyMin)} - ${formatCurrency(netRecoveryIfAgencyMax)}`,
            '5. Agency will send demand letter (14-day payment window)',
            '6. Agency escalates with phone calls, visits, and legal threats',
            '7. Timeline: 60-120 days for resolution'
        );
    } else if (primaryOption === 'continue_internal') {
        nextSteps.push(
            '1. Send final demand email with 7-day deadline',
            '2. Mention statutory interest and potential legal action',
            '3. Offer payment plan option to encourage engagement',
            '4. Wait 7-14 days for response',
            '5. If no payment, escalate to Court or Agency',
            '6. Consider SMS reminder (if consent obtained)',
            '7. Track all communication for future legal action'
        );
    } else {
        nextSteps.push(
            '1. Assess total recovery costs vs. invoice value',
            '2. Consider tax write-off for bad debt',
            '3. Send final "goodwill" email offering settlement discount',
            '4. If no response within 30 days, close case',
            '5. Mark debtor for credit reporting (optional)',
            '6. Learn: Review onboarding/vetting process to prevent future issues'
        );
    }

    // ============================================================
    // RETURN RECOMMENDATION
    // ============================================================

    return {
        primaryOption,
        confidence: Math.round(confidence),
        reasoning,
        costs: {
            countyCourtFee: courtFee,
            agencyCommission,
            netRecovery: {
                courtOption: netRecoveryIfCourt,
                agencyOption: (netRecoveryIfAgencyMin + netRecoveryIfAgencyMax) / 2, // Average
            },
        },
        timeline: {
            courtDays: '30-90 days (14 days response + 15-75 days judgment/enforcement)',
            agencyDays: '60-120 days (depends on debtor engagement)',
        },
        successRate: {
            court: '66-75% (with judgment obtained)',
            agency: '50-60% (depends on agency quality)',
        },
        nextSteps,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

/**
 * Format recommendation as human-readable text
 */
export function formatEscalationRecommendation(rec: EscalationRecommendation): string {
    const optionNames = {
        county_court: 'County Court Claim',
        debt_agency: 'Debt Collection Agency',
        write_off: 'Write Off Debt',
        continue_internal: 'Continue Internal Collection',
    };

    let text = `
ESCALATION RECOMMENDATION
========================

PRIMARY OPTION: ${optionNames[rec.primaryOption].toUpperCase()}
Confidence: ${rec.confidence}%

REASONING:
${rec.reasoning.map((r, i) => `${i + 1}. ${r}`).join('\n')}

COST ANALYSIS:
${rec.costs.countyCourtFee ? `- County Court Fee: £${rec.costs.countyCourtFee}` : ''}
${rec.costs.agencyCommission ? `- Agency Commission: ${rec.costs.agencyCommission.percentage} (£${rec.costs.agencyCommission.min.toFixed(2)} - £${rec.costs.agencyCommission.max.toFixed(2)})` : ''}
${rec.costs.netRecovery ? `\nNET RECOVERY (after costs):
- Court Option: ${formatCurrency(rec.costs.netRecovery.courtOption)}
- Agency Option: ${formatCurrency(rec.costs.netRecovery.agencyOption)} (average)` : ''}

TIMELINE:
${rec.timeline.courtDays ? `- County Court: ${rec.timeline.courtDays}` : ''}
${rec.timeline.agencyDays ? `- Debt Agency: ${rec.timeline.agencyDays}` : ''}

SUCCESS RATES:
${rec.successRate.court ? `- County Court: ${rec.successRate.court}` : ''}
${rec.successRate.agency ? `- Debt Agency: ${rec.successRate.agency}` : ''}

${rec.warnings && rec.warnings.length > 0 ? `⚠️ WARNINGS:
${rec.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}

` : ''}NEXT STEPS:
${rec.nextSteps.join('\n')}
  `.trim();

    return text;
}

/**
 * Compare County Court vs Agency side-by-side
 */
export function compareEscalationOptions(invoiceAmount: number): {
    courtOption: {
        fee: number;
        netRecovery: number;
        timeline: string;
        successRate: string;
        pros: string[];
        cons: string[];
    };
    agencyOption: {
        commissionRange: string;
        netRecoveryMin: number;
        netRecoveryMax: number;
        timeline: string;
        successRate: string;
        pros: string[];
        cons: string[];
    };
    recommendation: string;
} {
    const courtFee = getCountyCourtFee(invoiceAmount);
    const agency = calculateAgencyCommission(invoiceAmount);

    return {
        courtOption: {
            fee: courtFee,
            netRecovery: invoiceAmount - courtFee,
            timeline: '30-90 days',
            successRate: '66-75%',
            pros: [
                'Higher success rate (66-75%)',
                'Faster timeline (30-90 days)',
                'County Court Judgment damages debtor credit',
                'You control the process',
                'Lower cost than agency',
                'Enforcement options (bailiffs, charging orders)',
            ],
            cons: [
                'Requires active involvement (filing, evidence)',
                'Upfront court fee required',
                'More damaging to business relationships',
                'May require court hearing if disputed',
                'Need strong evidence',
            ],
        },
        agencyOption: {
            commissionRange: agency.percentage,
            netRecoveryMin: invoiceAmount - agency.max,
            netRecoveryMax: invoiceAmount - agency.min,
            timeline: '60-120 days',
            successRate: '50-60%',
            pros: [
                'Passive - agency handles everything',
                'No upfront costs',
                'Professional negotiators',
                'Less time-consuming for you',
                'Only pay if debt recovered',
                'Slightly less damaging to relationships',
            ],
            cons: [
                'Lower success rate (50-60%)',
                'Longer timeline (60-120 days)',
                'High commission (15-25%)',
                'Less control over process',
                'Variable agency quality',
                'May still require Court if agency fails',
            ],
        },
        recommendation:
            invoiceAmount < 1500
                ? 'County Court (lower costs)'
                : invoiceAmount < 5000
                    ? 'County Court (balance of cost and effectiveness)'
                    : 'Debt Agency (higher recovery amounts justify commission)',
    };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
    }).format(amount);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
    generateEscalationRecommendation,
    formatEscalationRecommendation,
    compareEscalationOptions,
    getCountyCourtFee,
    calculateAgencyCommission,
};

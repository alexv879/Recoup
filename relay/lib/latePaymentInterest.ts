/**
 * Late Payment Interest Calculator
 * IMPORTANT: Display-only calculation. Does NOT auto-apply to invoices.
 * Freelancer manually decides whether to claim interest under UK law.
 * 
 * Legal basis: Late Payment of Commercial Debts (Interest) Act 1998
 * Formula: Base Rate (BoE 5.25%) + 8% statutory = 13.25% annual
 * 
 * Regulatory Status: Pure calculator (NOT fintech - no money flows through platform)
 * 
 * @see MASTER_IMPLEMENTATION_AUDIT_V1.md §4.3
 * @see late-payment-law-guide.md
 */

export interface LatePaymentBreakdown {
    /** Original invoice amount in pence */
    principalAmount: number;
    /** Days past due date */
    daysOverdue: number;
    /** Daily interest rate (13.25% annual / 365) */
    dailyInterestRate: number;
    /** Total interest accrued in pence */
    totalInterest: number;
    /** Fixed compensation fee per Late Payment Act */
    fixedCompensationFee: number;
    /** Total claimable amount (interest + fixed fee) in pence */
    totalClaimable: number;
    /** Annual interest rate as decimal (0.1325) */
    annualRate: number;
    /** Base rate used (updated semi-annually) */
    baseRate: number;
}

/**
 * Current Bank of England base rate (updated semi-annually)
 * Last updated: Nov 2025
 * Source: https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate
 */
const CURRENT_BASE_RATE = 0.0525; // 5.25%

/**
 * Statutory interest addition per Late Payment Act 1998
 */
const STATUTORY_ADDITION = 0.08; // 8%

/**
 * Annual interest rate = Base Rate + Statutory Addition
 */
const ANNUAL_INTEREST_RATE = CURRENT_BASE_RATE + STATUTORY_ADDITION; // 13.25%

/**
 * Fixed compensation thresholds (in pence) per Late Payment Act 1998
 */
const FIXED_FEE_THRESHOLDS = [
    { max: 99999, fee: 4000 },      // £999.99 or less → £40
    { max: 999999, fee: 7000 },     // £1,000 - £9,999.99 → £70
    { max: Infinity, fee: 10000 },  // £10,000+ → £100
] as const;

/**
 * Calculate late payment interest and fixed compensation
 * 
 * @param principalAmountPence - Original invoice amount in pence
 * @param daysOverdue - Number of days past due date (use 0 for not overdue)
 * @returns Breakdown of interest calculation (DISPLAY ONLY)
 * 
 * @example
 * const breakdown = calculateLateCharges(50000, 45); // £500 invoice, 45 days late
 * console.log(`Interest: £${breakdown.totalInterest / 100}`);
 * console.log(`Fixed fee: £${breakdown.fixedCompensationFee / 100}`);
 * console.log(`Total claimable: £${breakdown.totalClaimable / 100}`);
 */
export function calculateLateCharges(
    principalAmountPence: number,
    daysOverdue: number
): LatePaymentBreakdown {
    // Validate inputs
    if (principalAmountPence < 0) {
        throw new Error('Principal amount cannot be negative');
    }
    if (daysOverdue < 0) {
        return {
            principalAmount: principalAmountPence,
            daysOverdue: 0,
            dailyInterestRate: 0,
            totalInterest: 0,
            fixedCompensationFee: 0,
            totalClaimable: 0,
            annualRate: ANNUAL_INTEREST_RATE,
            baseRate: CURRENT_BASE_RATE,
        };
    }

    // Calculate daily interest rate
    const dailyRate = ANNUAL_INTEREST_RATE / 365;

    // Calculate total interest (compound daily, but UK law typically uses simple)
    // Using simple interest as per standard practice
    const totalInterest = Math.round(
        (principalAmountPence * dailyRate * daysOverdue)
    );

    // Determine fixed compensation fee based on principal amount
    const fixedFee = FIXED_FEE_THRESHOLDS.find(
        ({ max }) => principalAmountPence <= max
    )!.fee;

    return {
        principalAmount: principalAmountPence,
        daysOverdue,
        dailyInterestRate: dailyRate,
        totalInterest,
        fixedCompensationFee: fixedFee,
        totalClaimable: totalInterest + fixedFee,
        annualRate: ANNUAL_INTEREST_RATE,
        baseRate: CURRENT_BASE_RATE,
    };
}

/**
 * Format pence to pounds with 2 decimal places
 * @internal
 */
export function formatPounds(pence: number): string {
    return (pence / 100).toFixed(2);
}

/**
 * Format percentage for display
 * @internal
 */
export function formatPercentage(decimal: number): string {
    return `${(decimal * 100).toFixed(2)}%`;
}

/**
 * Get human-readable description of fixed fee tier
 */
export function getFixedFeeTierDescription(principalAmountPence: number): string {
    if (principalAmountPence <= 99999) {
        return '£999.99 or less';
    } else if (principalAmountPence <= 999999) {
        return '£1,000 - £9,999.99';
    } else {
        return '£10,000 or more';
    }
}

/**
 * Check if base rate needs updating (semi-annual review)
 * Returns date of next scheduled review
 */
export function getNextBaseRateReviewDate(): Date {
    const now = new Date();
    const year = now.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const jul1 = new Date(year, 6, 1);

    if (now < jan1) {
        return jan1;
    } else if (now < jul1) {
        return jul1;
    } else {
        return new Date(year + 1, 0, 1);
    }
}

/**
 * IMPORTANT DISCLAIMER for UI components
 */
export const LEGAL_DISCLAIMER = `This calculation is for informational purposes only and does not constitute legal or financial advice. 
Under the Late Payment of Commercial Debts (Interest) Act 1998, you have the RIGHT to claim this amount, 
but YOU decide whether to do so. Recoup does not automatically add interest to invoices or collect interest payments. 
You are responsible for any interest claimed and must add it manually to your invoice if you choose to claim it.`;

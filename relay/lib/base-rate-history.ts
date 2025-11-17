/**
 * BANK OF ENGLAND BASE RATE HISTORY
 * 
 * UK Late Payment Act 1998 requires using the base rate that was in force
 * on either 30 June or 31 December immediately before the payment became overdue.
 * 
 * This module maintains historical base rates and provides lookup functionality.
 * 
 * Update Schedule:
 * - Base rate changes twice per year: 1 January and 1 July
 * - Check Bank of England official rates: https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate
 * 
 * Admin Alert System:
 * - System should check for rate changes on these dates
 * - Send notification to admin to update CURRENT_BASE_RATE in collections-calculator.ts
 * - Add new entry to BASE_RATE_HISTORY array below
 * 
 * LEGAL AUTHORITY:
 * - Late Payment of Commercial Debts (Rate of Interest) (No. 3) Order 2002
 *   https://www.legislation.gov.uk/uksi/2002/1675/contents/made
 * - Specifies interest rate = 8% + "reference rate" (BoE base rate)
 * - Reference rate = last rate in effect on 30 June or 31 Dec before due date
 * 
 * OFFICIAL DATA SOURCES:
 * - Current Bank Rate: https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate
 * - Historical Rates Database: https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp
 * - MPC Meeting Dates: https://www.bankofengland.co.uk/monetary-policy/monetary-policy-committee
 * - Rate Announcements: https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes
 * 
 * ADMIN UPDATE PROCESS (twice yearly):
 * 1. Check BoE website for new rate (7 days before 1 Jan or 1 Jul)
 * 2. Add new entry to BASE_RATE_HISTORY array (top of array, sorted descending)
 * 3. Update BANK_OF_ENGLAND_BASE_RATE constant in lib/collections-calculator.ts
 * 4. Deploy to production before effective date
 * 5. Test with sample calculation using new rate
 * 6. Document change in admin activity log
 * 
 * IMPORTANT NOTE:
 * Even if Bank of England changes rate multiple times between reference dates,
 * the statutory interest rate only changes on 1 January and 1 July. Do NOT update
 * for mid-period BoE rate changes.
 */

// ============================================================
// TYPES
// ============================================================

export interface BaseRateEntry {
    effectiveFrom: Date; // 1 January or 1 July
    rate: number; // Percentage (e.g., 5.25)
    referenceDate: Date; // 31 December or 30 June (for legal calculations)
}

// ============================================================
// BASE RATE HISTORY
// ============================================================

/**
 * Historical Bank of England base rates
 * Source: https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp
 * 
 * IMPORTANT: Add new entries when BoE changes rates (1 Jan or 1 July)
 */
export const BASE_RATE_HISTORY: BaseRateEntry[] = [
    // 2025
    {
        effectiveFrom: new Date('2025-07-01'),
        rate: 5.25,
        referenceDate: new Date('2025-06-30'),
    },
    {
        effectiveFrom: new Date('2025-01-01'),
        rate: 5.00,
        referenceDate: new Date('2024-12-31'),
    },
    // 2024
    {
        effectiveFrom: new Date('2024-07-01'),
        rate: 5.25,
        referenceDate: new Date('2024-06-30'),
    },
    {
        effectiveFrom: new Date('2024-01-01'),
        rate: 5.25,
        referenceDate: new Date('2023-12-31'),
    },
    // 2023
    {
        effectiveFrom: new Date('2023-07-01'),
        rate: 5.00,
        referenceDate: new Date('2023-06-30'),
    },
    {
        effectiveFrom: new Date('2023-01-01'),
        rate: 3.50,
        referenceDate: new Date('2022-12-31'),
    },
    // 2022
    {
        effectiveFrom: new Date('2022-07-01'),
        rate: 1.25,
        referenceDate: new Date('2022-06-30'),
    },
    {
        effectiveFrom: new Date('2022-01-01'),
        rate: 0.25,
        referenceDate: new Date('2021-12-31'),
    },
    // 2021 and earlier
    {
        effectiveFrom: new Date('2021-07-01'),
        rate: 0.10,
        referenceDate: new Date('2021-06-30'),
    },
    {
        effectiveFrom: new Date('2021-01-01'),
        rate: 0.10,
        referenceDate: new Date('2020-12-31'),
    },
    {
        effectiveFrom: new Date('2020-07-01'),
        rate: 0.10,
        referenceDate: new Date('2020-06-30'),
    },
    {
        effectiveFrom: new Date('2020-01-01'),
        rate: 0.75,
        referenceDate: new Date('2019-12-31'),
    },
].sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime()); // Sort descending (newest first)

// ============================================================
// RATE LOOKUP FUNCTIONS
// ============================================================

/**
 * Get the legally correct base rate for a due date
 * Uses the rate in force on 30 June or 31 Dec before the due date
 * 
 * @param dueDate - Invoice due date
 * @returns Base rate percentage and reference date
 */
export function getBaseRateForDueDate(dueDate: Date): {
    rate: number;
    referenceDate: Date;
    effectiveFrom: Date;
} {
    // Determine which reference date to use (30 June or 31 Dec before due date)
    const year = dueDate.getFullYear();
    const month = dueDate.getMonth(); // 0-11

    let referenceDate: Date;

    if (month >= 6) {
        // Due date is July-December, use 30 June of same year
        referenceDate = new Date(year, 5, 30); // Month 5 = June (0-indexed)
    } else {
        // Due date is January-June, use 31 December of previous year
        referenceDate = new Date(year - 1, 11, 31); // Month 11 = December
    }

    // Find the rate that was in effect on that reference date
    const rateEntry = BASE_RATE_HISTORY.find(
        entry => entry.referenceDate <= referenceDate
    );

    if (!rateEntry) {
        // Fallback to oldest known rate if reference date predates history
        const oldestRate = BASE_RATE_HISTORY[BASE_RATE_HISTORY.length - 1];
        console.warn(
            `No base rate found for reference date ${referenceDate.toISOString()}. Using oldest rate: ${oldestRate.rate}%`
        );
        return {
            rate: oldestRate.rate,
            referenceDate: oldestRate.referenceDate,
            effectiveFrom: oldestRate.effectiveFrom,
        };
    }

    return {
        rate: rateEntry.rate,
        referenceDate: rateEntry.referenceDate,
        effectiveFrom: rateEntry.effectiveFrom,
    };
}

/**
 * Get current base rate (most recent)
 */
export function getCurrentBaseRate(): number {
    return BASE_RATE_HISTORY[0].rate;
}

/**
 * Check if a base rate update is due
 * Returns true if we're within 7 days of 1 Jan or 1 July and no rate exists for that date
 * 
 * @returns Alert info if update is due
 */
export function checkBaseRateUpdateDue(): {
    updateDue: boolean;
    nextUpdateDate?: Date;
    daysUntilUpdate?: number;
    message?: string;
} {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    // Determine next update date
    let nextUpdateDate: Date;

    if (month < 6) {
        // Before July, next update is 1 July
        nextUpdateDate = new Date(year, 6, 1); // Month 6 = July
    } else if (month === 6 && now.getDate() === 1) {
        // It's 1 July today
        nextUpdateDate = new Date(year, 6, 1);
    } else {
        // After 1 July, next update is 1 January next year
        nextUpdateDate = new Date(year + 1, 0, 1); // Month 0 = January
    }

    const daysUntilUpdate = Math.ceil(
        (nextUpdateDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if we're within 7 days and no rate exists for that date
    if (daysUntilUpdate <= 7 && daysUntilUpdate >= 0) {
        const hasRateForDate = BASE_RATE_HISTORY.some(
            entry => entry.effectiveFrom.getTime() === nextUpdateDate.getTime()
        );

        if (!hasRateForDate) {
            return {
                updateDue: true,
                nextUpdateDate,
                daysUntilUpdate,
                message: `Base rate update due in ${daysUntilUpdate} days (${nextUpdateDate.toLocaleDateString('en-GB')}). Check Bank of England website and update BASE_RATE_HISTORY.`,
            };
        }
    }

    return {
        updateDue: false,
        nextUpdateDate,
        daysUntilUpdate,
    };
}

/**
 * Get base rate info for display/debugging
 */
export function getBaseRateInfo(dueDate?: Date): {
    currentRate: number;
    historicalCount: number;
    oldestDate: Date;
    newestDate: Date;
    dueDateRate?: {
        rate: number;
        referenceDate: string;
        effectiveFrom: string;
    };
} {
    const info = {
        currentRate: getCurrentBaseRate(),
        historicalCount: BASE_RATE_HISTORY.length,
        oldestDate: BASE_RATE_HISTORY[BASE_RATE_HISTORY.length - 1].effectiveFrom,
        newestDate: BASE_RATE_HISTORY[0].effectiveFrom,
    };

    if (dueDate) {
        const rateInfo = getBaseRateForDueDate(dueDate);
        return {
            ...info,
            dueDateRate: {
                rate: rateInfo.rate,
                referenceDate: rateInfo.referenceDate.toLocaleDateString('en-GB'),
                effectiveFrom: rateInfo.effectiveFrom.toLocaleDateString('en-GB'),
            },
        };
    }

    return info;
}

// ============================================================
// ADMIN NOTIFICATION HELPER
// ============================================================

/**
 * Generate admin notification for base rate update
 * Call this from a cron job or admin dashboard
 */
export function generateBaseRateUpdateNotification(): string | null {
    const check = checkBaseRateUpdateDue();

    if (!check.updateDue) {
        return null;
    }

    return `🔔 BASE RATE UPDATE REQUIRED

The Bank of England base rate update date is approaching: ${check.nextUpdateDate?.toLocaleDateString('en-GB')}

ACTION REQUIRED (${check.daysUntilUpdate} days):

1. Visit: https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate

2. Check if the base rate has changed effective ${check.nextUpdateDate?.toLocaleDateString('en-GB')}

3. If changed, update TWO files:
   
   a) lib/base-rate-history.ts - Add new entry to BASE_RATE_HISTORY:
   {
     effectiveFrom: new Date('${check.nextUpdateDate?.toISOString().split('T')[0]}'),
     rate: [NEW_RATE], // e.g., 5.50
     referenceDate: new Date('${check.nextUpdateDate ? new Date(check.nextUpdateDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] : ''}'),
   }
   
   b) lib/collections-calculator.ts - Update BANK_OF_ENGLAND_BASE_RATE constant:
   export const BANK_OF_ENGLAND_BASE_RATE = [NEW_RATE];

4. Commit and deploy changes immediately

IMPACT:
- Interest calculations for new overdue invoices will use the updated rate
- Existing calculations will continue using historical rates (legally correct)
- Users will see updated rate in invoice templates and email reminders

Current Rate: ${getCurrentBaseRate()}%
Historical Rates: ${BASE_RATE_HISTORY.length} entries from ${BASE_RATE_HISTORY[BASE_RATE_HISTORY.length - 1].effectiveFrom.toLocaleDateString('en-GB')} to ${BASE_RATE_HISTORY[0].effectiveFrom.toLocaleDateString('en-GB')}`;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
    getBaseRateForDueDate,
    getCurrentBaseRate,
    checkBaseRateUpdateDue,
    getBaseRateInfo,
    generateBaseRateUpdateNotification,
    BASE_RATE_HISTORY,
};

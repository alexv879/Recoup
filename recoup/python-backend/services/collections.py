"""
COLLECTIONS INTEREST CALCULATOR

Calculates late payment interest and fees according to UK law
Late Payment of Commercial Debts (Interest) Act 1998

Converted from relay/lib/collections-calculator.ts
"""

from datetime import datetime, date, timedelta
from typing import Optional, Dict, List
from dataclasses import dataclass

from ..utils.base_rate_history import get_base_rate_for_due_date, get_current_base_rate


# ============================================================
# TYPES
# ============================================================

@dataclass
class InterestCalculation:
    """Interest calculation result"""
    principal_amount: float
    interest_rate: float  # Annual percentage (e.g., 13.25%)
    bank_base_rate: float
    statutory_rate: float  # Always 8%
    days_overdue: int
    interest_accrued: float
    fixed_recovery_cost: float
    total_owed: float
    daily_interest: float
    breakdown: Dict[str, float]


@dataclass
class InterestCalculationParams:
    """Interest calculation parameters"""
    principal_amount: float
    due_date: date
    current_date: Optional[date] = None
    custom_base_rate: Optional[float] = None
    use_historical_rate: bool = True  # Use legally correct historical rate (recommended)


# ============================================================
# CONSTANTS
# ============================================================

# Bank of England base rate (updated periodically)
# Current rate: 5.25% (as of November 2024)
# NOTE: Update this when BoE changes rates
# Check: https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate
BANK_OF_ENGLAND_BASE_RATE = 5.25

# Statutory interest rate (fixed by law)
# Late Payment of Commercial Debts (Interest) Act 1998
STATUTORY_INTEREST_RATE = 8.0

# Fixed debt recovery costs (UK law)
# Based on invoice amount
FIXED_RECOVERY_COSTS = {
    'TIER_1': {'max': 999.99, 'fee': 40},
    'TIER_2': {'max': 9999.99, 'fee': 70},
    'TIER_3': {'max': float('inf'), 'fee': 100},
}


# ============================================================
# INTEREST CALCULATION
# ============================================================

def calculate_late_payment_interest(params: InterestCalculationParams) -> InterestCalculation:
    """
    Calculate late payment interest according to UK law

    Formula:
    Daily Interest = (Principal × Interest Rate) / 365
    Total Interest = Daily Interest × Days Overdue
    Total Owed = Principal + Interest + Fixed Recovery Cost

    LEGAL COMPLIANCE:
    By default, uses the historically correct base rate (30 June or 31 Dec before due date)
    as required by UK Late Payment Act 1998.

    Args:
        params: Calculation parameters

    Returns:
        Interest calculation breakdown

    Raises:
        ValueError: If principal amount is invalid or due date is in the future
    """
    principal_amount = params.principal_amount
    due_date = params.due_date
    current_date = params.current_date or date.today()
    custom_base_rate = params.custom_base_rate
    use_historical_rate = params.use_historical_rate

    # Validate inputs
    if principal_amount <= 0:
        raise ValueError('Principal amount must be greater than 0')

    if due_date > current_date:
        raise ValueError('Due date cannot be in the future')

    # Calculate days overdue
    days_overdue = (current_date - due_date).days

    # Get interest rate - use historical rate for legal accuracy
    if custom_base_rate is not None:
        # Custom rate provided (e.g., for testing or special cases)
        bank_base_rate = custom_base_rate
    elif use_historical_rate:
        # Use legally correct historical rate (30 June or 31 Dec before due date)
        rate_info = get_base_rate_for_due_date(due_date)
        bank_base_rate = rate_info['rate']
    else:
        # Use current rate (less legally accurate but simpler)
        bank_base_rate = get_current_base_rate()

    interest_rate = STATUTORY_INTEREST_RATE + bank_base_rate

    # Calculate daily interest
    daily_interest = (principal_amount * (interest_rate / 100)) / 365

    # Calculate total interest accrued
    interest_accrued = daily_interest * days_overdue

    # Get fixed recovery cost
    fixed_recovery_cost = get_fixed_recovery_cost(principal_amount)

    # Calculate total owed
    total_owed = principal_amount + interest_accrued + fixed_recovery_cost

    return InterestCalculation(
        principal_amount=principal_amount,
        interest_rate=round(interest_rate, 2),
        bank_base_rate=bank_base_rate,
        statutory_rate=STATUTORY_INTEREST_RATE,
        days_overdue=days_overdue,
        interest_accrued=round(interest_accrued, 2),
        fixed_recovery_cost=fixed_recovery_cost,
        total_owed=round(total_owed, 2),
        daily_interest=round(daily_interest, 2),
        breakdown={
            'principal': round(principal_amount, 2),
            'interest': round(interest_accrued, 2),
            'fixed_fee': fixed_recovery_cost,
        },
    )


def get_fixed_recovery_cost(principal_amount: float) -> float:
    """
    Get fixed debt recovery cost based on principal amount
    UK Late Payment of Commercial Debts (Interest) Act 1998

    Args:
        principal_amount: Invoice principal amount

    Returns:
        Fixed recovery cost in GBP
    """
    if principal_amount <= FIXED_RECOVERY_COSTS['TIER_1']['max']:
        return FIXED_RECOVERY_COSTS['TIER_1']['fee']
    elif principal_amount <= FIXED_RECOVERY_COSTS['TIER_2']['max']:
        return FIXED_RECOVERY_COSTS['TIER_2']['fee']
    else:
        return FIXED_RECOVERY_COSTS['TIER_3']['fee']


def calculate_interest_for_days(
    principal_amount: float,
    days: int,
    custom_base_rate: Optional[float] = None
) -> float:
    """
    Calculate interest for a specific number of days
    Useful for projecting future interest

    Args:
        principal_amount: Invoice principal
        days: Number of days
        custom_base_rate: Optional custom base rate

    Returns:
        Interest amount
    """
    bank_base_rate = custom_base_rate if custom_base_rate is not None else BANK_OF_ENGLAND_BASE_RATE
    interest_rate = STATUTORY_INTEREST_RATE + bank_base_rate
    daily_interest = (principal_amount * (interest_rate / 100)) / 365
    return round(daily_interest * days, 2)


def project_interest_accrual(
    principal_amount: float,
    due_date: date,
    projection_days: int = 90
) -> List[Dict[str, any]]:
    """
    Project interest accrual over time
    Returns array of daily snapshots

    Args:
        principal_amount: Invoice principal
        due_date: Invoice due date
        projection_days: Number of days to project (default: 90)

    Returns:
        List of daily interest snapshots
    """
    fixed_recovery_cost = get_fixed_recovery_cost(principal_amount)
    bank_base_rate = BANK_OF_ENGLAND_BASE_RATE
    interest_rate = STATUTORY_INTEREST_RATE + bank_base_rate
    daily_interest = (principal_amount * (interest_rate / 100)) / 365

    projections = []

    for day in range(projection_days + 1):
        current_date = due_date + timedelta(days=day)
        interest_accrued = daily_interest * day
        total_owed = principal_amount + interest_accrued + fixed_recovery_cost

        projections.append({
            'day': day,
            'date': current_date,
            'interest_accrued': round(interest_accrued, 2),
            'total_owed': round(total_owed, 2),
        })

    return projections


# ============================================================
# FORMATTING HELPERS
# ============================================================

def format_interest_calculation(calculation: InterestCalculation) -> str:
    """
    Format interest calculation as human-readable text

    Args:
        calculation: Interest calculation result

    Returns:
        Formatted text description
    """
    return f"""
Late Payment Interest Breakdown:

Principal Amount:        £{calculation.principal_amount:.2f}
Days Overdue:            {calculation.days_overdue} days
Interest Rate:           {calculation.interest_rate}% per annum
                        ({calculation.statutory_rate}% statutory + {calculation.bank_base_rate}% BoE base rate)

Daily Interest:          £{calculation.daily_interest:.2f}
Interest Accrued:        £{calculation.interest_accrued:.2f}
Fixed Recovery Cost:     £{calculation.fixed_recovery_cost:.2f}

TOTAL OWED:             £{calculation.total_owed:.2f}
    """.strip()


def format_interest_calculation_html(calculation: InterestCalculation) -> str:
    """
    Format interest calculation as email-friendly HTML

    Args:
        calculation: Interest calculation result

    Returns:
        HTML string
    """
    return f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h3 style="color: #dc2626; margin-bottom: 16px;">Late Payment Interest Breakdown</h3>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Principal Amount</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">£{calculation.principal_amount:.2f}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Days Overdue</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{calculation.days_overdue} days</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Interest Rate</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{calculation.interest_rate}% per annum</td>
    </tr>
    <tr>
      <td colspan="2" style="padding: 4px 0; font-size: 12px; color: #6b7280;">
        ({calculation.statutory_rate}% statutory + {calculation.bank_base_rate}% Bank of England base rate)
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Interest Accrued</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">£{calculation.interest_accrued:.2f}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Fixed Recovery Cost</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">£{calculation.fixed_recovery_cost:.2f}</td>
    </tr>
    <tr>
      <td style="padding: 12px 0; font-weight: 700; font-size: 18px;">TOTAL OWED</td>
      <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: #dc2626;">£{calculation.total_owed:.2f}</td>
    </tr>
  </table>

  <div style="background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #dc2626; margin-top: 16px;">
    <p style="margin: 0; font-size: 12px; color: #991b1b;">
      <strong>Legal Note:</strong> Interest charged under the Late Payment of Commercial Debts (Interest) Act 1998.
      Daily interest: £{calculation.daily_interest:.2f}/day until payment is received.
    </p>
  </div>
</div>
    """.strip()


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def is_invoice_overdue(due_date: date, current_date: Optional[date] = None) -> bool:
    """
    Check if an invoice is overdue

    Args:
        due_date: Invoice due date
        current_date: Current date (default: today)

    Returns:
        True if overdue
    """
    current = current_date or date.today()
    return due_date < current


def get_days_until_due(due_date: date, current_date: Optional[date] = None) -> int:
    """
    Get days until due (negative if overdue)

    Args:
        due_date: Invoice due date
        current_date: Current date (default: today)

    Returns:
        Days until due (negative if overdue)
    """
    current = current_date or date.today()
    return (due_date - current).days


def format_currency(amount: float) -> str:
    """
    Format currency (GBP)

    Args:
        amount: Amount in GBP

    Returns:
        Formatted string (e.g., "£1,234.56")
    """
    return f"£{amount:,.2f}"

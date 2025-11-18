"""
BANK OF ENGLAND BASE RATE HISTORY

UK Late Payment Act 1998 requires using the base rate that was in force
on either 30 June or 31 December immediately before the payment became overdue.

This module maintains historical base rates and provides lookup functionality.

Converted from relay/lib/base-rate-history.ts
"""

from datetime import datetime, date
from typing import Optional, Dict, List
from dataclasses import dataclass


@dataclass
class BaseRateEntry:
    """Base rate entry"""
    effective_from: date  # 1 January or 1 July
    rate: float  # Percentage (e.g., 5.25)
    reference_date: date  # 31 December or 30 June (for legal calculations)


# Historical Bank of England base rates
# Source: https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp
# IMPORTANT: Add new entries when BoE changes rates (1 Jan or 1 July)
BASE_RATE_HISTORY: List[BaseRateEntry] = [
    # 2025
    BaseRateEntry(
        effective_from=date(2025, 7, 1),
        rate=5.25,
        reference_date=date(2025, 6, 30),
    ),
    BaseRateEntry(
        effective_from=date(2025, 1, 1),
        rate=5.00,
        reference_date=date(2024, 12, 31),
    ),
    # 2024
    BaseRateEntry(
        effective_from=date(2024, 7, 1),
        rate=5.25,
        reference_date=date(2024, 6, 30),
    ),
    BaseRateEntry(
        effective_from=date(2024, 1, 1),
        rate=5.25,
        reference_date=date(2023, 12, 31),
    ),
    # 2023
    BaseRateEntry(
        effective_from=date(2023, 7, 1),
        rate=5.00,
        reference_date=date(2023, 6, 30),
    ),
    BaseRateEntry(
        effective_from=date(2023, 1, 1),
        rate=3.50,
        reference_date=date(2022, 12, 31),
    ),
    # 2022
    BaseRateEntry(
        effective_from=date(2022, 7, 1),
        rate=1.25,
        reference_date=date(2022, 6, 30),
    ),
    BaseRateEntry(
        effective_from=date(2022, 1, 1),
        rate=0.25,
        reference_date=date(2021, 12, 31),
    ),
    # 2021 and earlier
    BaseRateEntry(
        effective_from=date(2021, 7, 1),
        rate=0.10,
        reference_date=date(2021, 6, 30),
    ),
    BaseRateEntry(
        effective_from=date(2021, 1, 1),
        rate=0.10,
        reference_date=date(2020, 12, 31),
    ),
    BaseRateEntry(
        effective_from=date(2020, 7, 1),
        rate=0.10,
        reference_date=date(2020, 6, 30),
    ),
    BaseRateEntry(
        effective_from=date(2020, 1, 1),
        rate=0.75,
        reference_date=date(2019, 12, 31),
    ),
]

# Sort descending (newest first)
BASE_RATE_HISTORY.sort(key=lambda x: x.effective_from, reverse=True)


def get_base_rate_for_due_date(due_date: date) -> Dict[str, any]:
    """
    Get the legally correct base rate for a due date
    Uses the rate in force on 30 June or 31 Dec before the due date

    Args:
        due_date: Invoice due date

    Returns:
        Dict with rate, reference_date, and effective_from
    """
    # Determine which reference date to use (30 June or 31 Dec before due date)
    year = due_date.year
    month = due_date.month

    if month >= 7:
        # Due date is July-December, use 30 June of same year
        reference_date = date(year, 6, 30)
    else:
        # Due date is January-June, use 31 December of previous year
        reference_date = date(year - 1, 12, 31)

    # Find the rate that was in effect on that reference date
    rate_entry = next(
        (entry for entry in BASE_RATE_HISTORY if entry.reference_date <= reference_date),
        None
    )

    if not rate_entry:
        # Fallback to oldest known rate if reference date predates history
        oldest_rate = BASE_RATE_HISTORY[-1]
        print(
            f"Warning: No base rate found for reference date {reference_date.isoformat()}. "
            f"Using oldest rate: {oldest_rate.rate}%"
        )
        return {
            'rate': oldest_rate.rate,
            'reference_date': oldest_rate.reference_date,
            'effective_from': oldest_rate.effective_from,
        }

    return {
        'rate': rate_entry.rate,
        'reference_date': rate_entry.reference_date,
        'effective_from': rate_entry.effective_from,
    }


def get_current_base_rate() -> float:
    """Get current base rate (most recent)"""
    return BASE_RATE_HISTORY[0].rate


def check_base_rate_update_due() -> Dict[str, any]:
    """
    Check if a base rate update is due
    Returns info if we're within 7 days of 1 Jan or 1 July and no rate exists for that date

    Returns:
        Dict with update_due, next_update_date, days_until_update, and message
    """
    now = date.today()
    year = now.year
    month = now.month

    # Determine next update date
    if month < 7:
        # Before July, next update is 1 July
        next_update_date = date(year, 7, 1)
    elif month == 7 and now.day == 1:
        # It's 1 July today
        next_update_date = date(year, 7, 1)
    else:
        # After 1 July, next update is 1 January next year
        next_update_date = date(year + 1, 1, 1)

    days_until_update = (next_update_date - now).days

    # Check if we're within 7 days and no rate exists for that date
    if 0 <= days_until_update <= 7:
        has_rate_for_date = any(
            entry.effective_from == next_update_date
            for entry in BASE_RATE_HISTORY
        )

        if not has_rate_for_date:
            return {
                'update_due': True,
                'next_update_date': next_update_date,
                'days_until_update': days_until_update,
                'message': f"Base rate update due in {days_until_update} days ({next_update_date.strftime('%d/%m/%Y')}). "
                          f"Check Bank of England website and update BASE_RATE_HISTORY.",
            }

    return {
        'update_due': False,
        'next_update_date': next_update_date,
        'days_until_update': days_until_update,
    }


def get_base_rate_info(due_date: Optional[date] = None) -> Dict[str, any]:
    """
    Get base rate info for display/debugging

    Args:
        due_date: Optional due date for rate lookup

    Returns:
        Dict with current rate, historical count, and date range
    """
    info = {
        'current_rate': get_current_base_rate(),
        'historical_count': len(BASE_RATE_HISTORY),
        'oldest_date': BASE_RATE_HISTORY[-1].effective_from,
        'newest_date': BASE_RATE_HISTORY[0].effective_from,
    }

    if due_date:
        rate_info = get_base_rate_for_due_date(due_date)
        info['due_date_rate'] = {
            'rate': rate_info['rate'],
            'reference_date': rate_info['reference_date'].strftime('%d/%m/%Y'),
            'effective_from': rate_info['effective_from'].strftime('%d/%m/%Y'),
        }

    return info


def generate_base_rate_update_notification() -> Optional[str]:
    """
    Generate admin notification for base rate update
    Call this from a cron job or admin dashboard

    Returns:
        Notification message or None if no update due
    """
    check = check_base_rate_update_due()

    if not check['update_due']:
        return None

    next_date = check['next_update_date']
    days = check['days_until_update']

    return f"""🔔 BASE RATE UPDATE REQUIRED

The Bank of England base rate update date is approaching: {next_date.strftime('%d/%m/%Y')}

ACTION REQUIRED ({days} days):

1. Visit: https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate

2. Check if the base rate has changed effective {next_date.strftime('%d/%m/%Y')}

3. If changed, update TWO files:

   a) utils/base_rate_history.py - Add new entry to BASE_RATE_HISTORY:
   BaseRateEntry(
       effective_from=date({next_date.year}, {next_date.month}, {next_date.day}),
       rate=[NEW_RATE],  # e.g., 5.50
       reference_date=date({next_date.year}, {next_date.month - 1 if next_date.month > 1 else 12}, {30 if next_date.month == 7 else 31}),
   )

   b) services/collections.py - Update BANK_OF_ENGLAND_BASE_RATE constant:
   BANK_OF_ENGLAND_BASE_RATE = [NEW_RATE]

4. Commit and deploy changes immediately

IMPACT:
- Interest calculations for new overdue invoices will use the updated rate
- Existing calculations will continue using historical rates (legally correct)
- Users will see updated rate in invoice templates and email reminders

Current Rate: {get_current_base_rate()}%
Historical Rates: {len(BASE_RATE_HISTORY)} entries from {BASE_RATE_HISTORY[-1].effective_from.strftime('%d/%m/%Y')} to {BASE_RATE_HISTORY[0].effective_from.strftime('%d/%m/%Y')}"""

"""
Application Constants
Converted from relay/utils/constants.ts
"""

from typing import Final, Literal
from enum import Enum

# ============ APPLICATION CONSTANTS ============

APP_NAME: Final[str] = 'Recoup'
APP_DESCRIPTION: Final[str] = 'Smart invoicing and payment tracking for freelancers'

# ============ COMMISSION & PRICING ============

RECOUP_COMMISSION_RATE: Final[float] = 0.03  # 3%
COLLECTIONS_DEMO_LIMIT_FREE: Final[int] = 1  # 1 free collection per month

# ============ TIMING CONSTANTS ============

COLLECTION_DAY_7_REMINDER: Final[int] = 7  # Days after due date (Email)
COLLECTION_DAY_14_REMINDER: Final[int] = 14  # Days after due date (SMS - PREMIUM)
COLLECTION_DAY_21_REMINDER: Final[int] = 21  # Days after due date (Email)
COLLECTION_DAY_30_REMINDER: Final[int] = 30  # Days after due date (Physical Letter - PREMIUM)
COLLECTION_DAY_45_AGENCY_HANDOFF: Final[int] = 45  # Days after due date (Agency Escalation - PREMIUM)
PAYMENT_CONFIRMATION_TOKEN_EXPIRY_DAYS: Final[int] = 30
NOTIFICATION_EXPIRY_DAYS: Final[int] = 30

# ============ NOTIFICATION CONSTANTS ============


class NotificationType(str, Enum):
    """Notification types"""
    INVOICE_DROUGHT = 'invoice_drought'
    PAYMENT_DELAY = 'payment_delay'
    WIN = 'win'
    PREDICTION = 'prediction'
    OPPORTUNITY = 'opportunity'
    DAILY_DIGEST = 'daily_digest'


MAX_NOTIFICATIONS_PER_DAY: Final[int] = 3
NOTIFICATION_CONFIDENCE_THRESHOLD: Final[float] = 0.6

# ============ STATUS CONSTANTS ============


class InvoiceStatus(str, Enum):
    """Invoice status"""
    DRAFT = 'draft'
    SENT = 'sent'
    PAID = 'paid'
    OVERDUE = 'overdue'
    IN_COLLECTIONS = 'in_collections'
    DISPUTED = 'disputed'
    CANCELLED = 'cancelled'


class PaymentConfirmationStatus(str, Enum):
    """Payment confirmation status"""
    PENDING_CLIENT = 'pending_client'
    CLIENT_CONFIRMED = 'client_confirmed'
    BOTH_CONFIRMED = 'both_confirmed'
    EXPIRED = 'expired'
    CANCELLED = 'cancelled'


class UserStatus(str, Enum):
    """User status"""
    ACTIVE = 'active'
    SUSPENDED = 'suspended'
    DELETED = 'deleted'


# ============ PAYMENT METHODS ============


class PaymentMethod(str, Enum):
    """Payment methods"""
    BANK_TRANSFER = 'bank_transfer'
    CARD = 'card'


# ============ SUBSCRIPTION TIERS ============


class SubscriptionTier(str, Enum):
    """Subscription tiers"""
    FREE = 'free'
    PAID = 'paid'  # Kept for backward compatibility
    STARTER = 'starter'  # £19 standard
    GROWTH = 'growth'  # £39 standard
    PRO = 'pro'  # £75 standard
    BUSINESS = 'business'  # Legacy


def normalize_tier(tier: str) -> str:
    """
    Normalize legacy 'paid' tier to new tier system
    Maps old 'paid' tier to 'growth' (default paid tier)

    Args:
        tier: User's subscription tier

    Returns:
        Normalized tier string
    """
    if tier == 'paid':
        return 'growth'  # Legacy support: paid → growth
    return tier


# Tier hierarchy levels (for upgrade logic)
# Higher number = higher tier
TIER_LEVELS: Final[dict] = {
    'free': 0,
    'starter': 1,
    'growth': 2,
    'pro': 3,
    'business': 3,  # Same level as pro
    # Legacy support
    'paid': 2,  # Map old 'paid' to 'growth' level
}

# Collection limits per tier (monthly)
# Based on invoice volume percentiles from business plan
COLLECTIONS_LIMITS: Final[dict] = {
    'free': 1,  # 1 demo collection per month
    'starter': 10,  # 50th percentile: 6-8 invoices/month
    'growth': 50,  # 75th percentile: 12-15 invoices/month
    'pro': None,  # Unlimited
    'business': None,  # Unlimited
    # Legacy support
    'paid': 50,  # Old 'paid' tier gets growth limits
}

# Founding member pricing (50% off for life)
# First 50 signups lock in these prices forever
FOUNDING_MEMBER_PRICING: Final[dict] = {
    'starter': 12,  # £12/month (vs £24 standard)
    'growth': 22,  # £22/month (vs £45 standard)
    'pro': 75,  # £75/month (vs £150 standard)
}

# Standard pricing (after founding 50)
STANDARD_PRICING: Final[dict] = {
    'starter': 24,  # £24/month
    'growth': 45,  # £45/month
    'pro': 150,  # £150/month
}

# Founding member program limit
FOUNDING_MEMBER_LIMIT: Final[int] = 50

# ============ BUSINESS TYPES ============


class BusinessType(str, Enum):
    """Business types"""
    FREELANCER = 'freelancer'
    AGENCY = 'agency'
    CONSULTANT = 'consultant'


# ============ GAMIFICATION CONSTANTS ============

ACHIEVEMENTS: Final[dict] = {
    'FIRST_INVOICE': {
        'id': 'first_invoice',
        'name': 'First Invoice',
        'description': 'Created your first invoice',
        'threshold': 500,
    },
    'COLLECTOR_5K': {
        'id': 'collector_5k',
        'name': 'Collector 5K',
        'description': 'Collected £5,000',
        'threshold': 5000,
    },
    'COLLECTOR_50K': {
        'id': 'collector_50k',
        'name': 'Collector 50K',
        'description': 'Collected £50,000',
        'threshold': 50000,
    },
    'RELIABLE': {
        'id': 'reliable',
        'name': 'Reliable',
        'description': '90% on-time payments',
        'threshold': 90,
    },
    'WEEK_STREAK': {
        'id': 'week_streak',
        'name': 'Week Streak',
        'description': '7 days without overdue',
        'threshold': 7,
    },
    'MONTH_STREAK': {
        'id': 'month_streak',
        'name': 'Month Streak',
        'description': '30 days without overdue',
        'threshold': 30,
    },
    'TOP_100': {
        'id': 'top_100',
        'name': 'Top 100',
        'description': 'Ranked in top 100 users',
        'threshold': 100,
    },
}

POINTS_PER_1000_COLLECTED: Final[int] = 1
POINTS_PER_STREAK_DAY: Final[int] = 1
POINTS_PER_BADGE: Final[int] = 10
POINTS_PER_LEVEL: Final[int] = 100

# ============ REFERRAL CONSTANTS ============

REFERRAL_CREDIT_REFERRER: Final[float] = 5.0  # £5
REFERRAL_CREDIT_REFERRED: Final[float] = 5.0  # £5

# ============ RATE LIMITING ============

RATE_LIMIT: Final[dict] = {
    'GENERAL': {'requests': 10, 'window': '10s'},
    'AUTH': {'requests': 5, 'window': '60s'},
    'AI': {'requests': 3, 'window': '60s'},
}

# ============ CURRENCY ============

DEFAULT_CURRENCY: Final[str] = 'GBP'
SUPPORTED_CURRENCIES: Final[tuple] = ('GBP', 'USD', 'EUR')

# ============ LANGUAGES ============

SUPPORTED_LANGUAGES: Final[tuple] = ('en', 'es', 'fr')
DEFAULT_LANGUAGE: Final[str] = 'en'

# ============ TIMEZONES ============

DEFAULT_TIMEZONE: Final[str] = 'Europe/London'

# ============ DEFAULT QUIET HOURS ============

DEFAULT_QUIET_HOURS: Final[dict] = {
    'start': '21:00',
    'end': '08:00',
}

# ============ EMAIL TEMPLATES ============


class EmailTemplate(str, Enum):
    """Email template types"""
    INVOICE = 'invoice'
    REMINDER_DAY_7 = 'reminder_day_7'
    REMINDER_DAY_21 = 'reminder_day_21'
    PAYMENT_CONFIRMED = 'payment_confirmed'
    NOTIFICATION = 'notification'


# ============ VALIDATION CONSTANTS ============

class Validation:
    """Validation constants"""
    MAX_INVOICE_DESCRIPTION_LENGTH: Final[int] = 500
    MAX_CLIENT_NAME_LENGTH: Final[int] = 100
    MAX_BUSINESS_NAME_LENGTH: Final[int] = 100
    MAX_NOTE_LENGTH: Final[int] = 1000
    MIN_INVOICE_AMOUNT: Final[float] = 0.01
    MAX_INVOICE_AMOUNT: Final[float] = 1000000
    UK_ACCOUNT_NUMBER_LENGTH: Final[int] = 8
    UK_SORT_CODE_LENGTH: Final[int] = 6

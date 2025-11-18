"""
Data Models for Recoup Application
Converted from TypeScript to Python with Pydantic
"""

from .user import User
from .invoice import Invoice, InvoiceStatus
from .payment import PaymentClaim, PaymentConfirmation, PaymentClaimStatus
from .collection import CollectionAttempt
from .notification import Notification
from .client import Client
from .stats import UserStats, UserBehaviorProfile
from .agency import AgencyHandoff
from .onboarding import OnboardingProgress

__all__ = [
    'User',
    'Invoice',
    'InvoiceStatus',
    'PaymentClaim',
    'PaymentConfirmation',
    'PaymentClaimStatus',
    'CollectionAttempt',
    'Notification',
    'Client',
    'UserStats',
    'UserBehaviorProfile',
    'AgencyHandoff',
    'OnboardingProgress',
]

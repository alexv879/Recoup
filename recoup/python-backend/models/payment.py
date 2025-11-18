"""
Payment Models (Claims and Confirmations)
Converted from relay/types/models.ts
"""

from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel
from enum import Enum


class PaymentClaimStatus(str, Enum):
    """Payment claim status enum"""
    PENDING_VERIFICATION = 'pending_verification'
    VERIFIED = 'verified'
    REJECTED = 'rejected'


class PaymentConfirmationStatus(str, Enum):
    """Payment confirmation status enum"""
    PENDING_CLIENT = 'pending_client'
    CLIENT_CONFIRMED = 'client_confirmed'
    BOTH_CONFIRMED = 'both_confirmed'
    EXPIRED = 'expired'
    CANCELLED = 'cancelled'


class EvidenceFile(BaseModel):
    """Evidence file metadata"""
    type: Literal['screenshot', 'receipt', 'bank_statement', 'confirmation']
    url: str  # File path in Cloud Storage
    uploaded_at: datetime


class PaymentClaim(BaseModel):
    """Payment claim model"""
    # Identifiers
    claim_id: str  # document ID
    invoice_id: str
    freelancer_id: str
    client_name: str
    client_email: str

    # Claim Details
    amount: int  # Amount claimed to be paid (in pence)
    payment_method: Literal['bank_transfer', 'cash', 'cheque', 'card', 'paypal', 'other']
    payment_reference: Optional[str] = None
    payment_date: datetime
    client_notes: Optional[str] = None

    # Verification Status
    status: PaymentClaimStatus = PaymentClaimStatus.PENDING_VERIFICATION
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None  # User ID who verified
    rejected_at: Optional[datetime] = None
    rejected_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    auto_rejected: Optional[bool] = False

    # Evidence Fields
    evidence_file_url: Optional[str] = None
    evidence_file_name: Optional[str] = None
    evidence_file_size: Optional[int] = None
    evidence_file_type: Optional[str] = None
    evidence_uploaded_at: Optional[datetime] = None
    evidence_uploaded_by: Optional[str] = None

    # Verification Deadline
    verification_deadline: Optional[datetime] = None  # 48 hours after creation
    reminder_24h_sent: Optional[bool] = False
    reminder_24h_sent_at: Optional[datetime] = None
    reminder_6h_sent: Optional[bool] = False
    reminder_6h_sent_at: Optional[datetime] = None

    # Verification Details
    actual_amount: Optional[int] = None  # Actual amount received (if different)
    verification_notes: Optional[str] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        use_enum_values = True


class PaymentConfirmation(BaseModel):
    """Payment confirmation model (dual confirmation system)"""
    # Identifiers
    confirmation_id: str  # document ID
    invoice_id: str
    freelancer_id: str
    client_email: str

    # Token (for unauthenticated client confirmation)
    confirmation_token: str
    token_expires_at: datetime

    # Confirmation Status
    status: PaymentConfirmationStatus = PaymentConfirmationStatus.PENDING_CLIENT

    # Client Confirmation
    client_confirmed_at: Optional[datetime] = None
    client_confirmed_amount: Optional[int] = None
    client_payment_method: Optional[Literal['bank_transfer', 'card']] = None
    client_confirmed_date: Optional[str] = None  # Date they say they paid
    client_notes: Optional[str] = None

    # Freelancer Confirmation
    freelancer_confirmed_at: Optional[datetime] = None
    freelancer_verified_received: bool = False

    # Payment Details
    expected_amount: int
    actual_amount_paid: Optional[int] = None

    # Timestamps
    created_at: datetime
    expires_at: datetime

    class Config:
        use_enum_values = True

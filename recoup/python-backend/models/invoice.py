"""
Invoice Model
Converted from relay/types/models.ts
"""

from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field
from enum import Enum


class InvoiceStatus(str, Enum):
    """Invoice status enum"""
    DRAFT = 'draft'
    SENT = 'sent'
    PAID = 'paid'
    OVERDUE = 'overdue'
    IN_COLLECTIONS = 'in_collections'
    DISPUTED = 'disputed'
    CANCELLED = 'cancelled'


class EscalationLevel(str, Enum):
    """Escalation level enum"""
    PENDING = 'pending'
    GENTLE = 'gentle'
    FIRM = 'firm'
    FINAL = 'final'
    AGENCY = 'agency'


class LineItem(BaseModel):
    """Invoice line item"""
    description: str
    quantity: int
    unit_price: int  # in pence
    amount: int  # in pence


class Invoice(BaseModel):
    """Invoice model"""
    # Identifiers
    invoice_id: str  # document ID
    reference: str  # INV-YYYYMMDD-XXXXX
    freelancer_id: str  # User ID

    # Client Info
    client_name: str
    client_email: str
    client_id: Optional[str] = None  # If repeat client

    # Invoice Details
    amount: int  # in pence (GBP)
    currency: str = "GBP"
    description: Optional[str] = None

    # Dates
    invoice_date: datetime
    due_date: datetime
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None

    # Status
    status: InvoiceStatus = InvoiceStatus.DRAFT

    # Escalation Tracking
    escalation_level: Optional[EscalationLevel] = None
    template_level: Optional[str] = None

    # Payment Options
    payment_methods: List[Literal['bank_transfer', 'card']] = Field(default_factory=lambda: ['bank_transfer'])
    stripe_payment_link_id: Optional[str] = None
    stripe_payment_link_url: Optional[str] = None

    # Collection Tracking
    collections_enabled: bool = False
    first_reminder_sent_at: Optional[datetime] = None
    second_reminder_sent_at: Optional[datetime] = None
    collections_attempts: int = 0

    # BACS Payment Claims
    payment_claim_id: Optional[str] = None
    payment_claim_status: Optional[Literal['pending_verification', 'verified', 'rejected']] = None
    payment_claim_date: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None

    # Confirmation
    dual_confirmation_required: bool = False

    # Notes
    internal_notes: Optional[str] = None

    # Line Items
    line_items: Optional[List[LineItem]] = None

    # Metadata
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "invoice_id": "inv_123",
                "reference": "INV-20241118-00001",
                "freelancer_id": "user_abc",
                "client_name": "Acme Corp",
                "client_email": "accounts@acme.com",
                "amount": 100000,  # £1000.00
                "currency": "GBP",
                "status": "sent",
                "collections_enabled": True,
            }
        }

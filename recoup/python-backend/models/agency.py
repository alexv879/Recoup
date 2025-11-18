"""
Agency Handoff Model
Converted from relay/types/models.ts
"""

from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel


class DocumentMetadata(BaseModel):
    """Document metadata"""
    storage_path: str
    uploaded_at: datetime
    document_type: Literal['invoice', 'communication_history', 'evidence']


class CommunicationHistory(BaseModel):
    """Communication history entry"""
    date: datetime
    type: Literal['email', 'sms', 'call', 'letter']
    summary: str


class AgencyUpdate(BaseModel):
    """Agency status update"""
    date: datetime
    status: str
    notes: str
    action_taken: Optional[str] = None


class AgencyHandoff(BaseModel):
    """Agency handoff model (PREMIUM)"""
    # Identifiers
    handoff_id: str  # document ID
    invoice_id: str
    freelancer_id: str
    agency_id: str  # ID of collection agency partner

    # Handoff Details
    handoff_date: datetime
    handoff_status: Literal['pending', 'in_progress', 'collected', 'failed', 'closed']

    # Agency Info
    agency_name: str
    agency_contact_email: str
    agency_contact_phone: Optional[str] = None

    # Invoice Details at Handoff
    original_amount: int  # in pence
    outstanding_amount: int  # in pence
    days_past_due: int

    # Documents & Evidence
    documents: List[str] = []  # Storage paths to Firebase Storage
    document_urls: Optional[List[DocumentMetadata]] = None
    communication_history: List[CommunicationHistory] = []

    # Financial Terms
    commission_percentage: float  # e.g., 25 = 25%
    commission_amount: Optional[float] = None  # Calculated on recovery
    minimum_recovery: Optional[float] = None  # Agency minimum threshold

    # Notes & Updates
    notes: Optional[str] = None
    last_update: Optional[datetime] = None
    agency_notes: Optional[str] = None

    # Recovery Outcome
    recovery_outcome: Optional[Literal['full_recovery', 'partial_recovery', 'no_recovery', 'settlement', 'legal_action']] = None
    recovery_amount: Optional[int] = None  # in pence
    recovery_date: Optional[datetime] = None
    settlement_details: Optional[str] = None

    # Transaction Link
    transaction_id: Optional[str] = None
    transaction_created_at: Optional[datetime] = None

    # Legal Escalation
    legal_action_taken: Optional[bool] = False
    legal_action_date: Optional[datetime] = None
    court_reference: Optional[str] = None

    # Status Updates from Agency
    agency_updates: List[AgencyUpdate] = []

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

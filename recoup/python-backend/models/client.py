"""
Client Model
Converted from relay/types/models.ts
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class BillingAddress(BaseModel):
    """Client billing address"""
    line1: str
    line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    postcode: str
    country: str = "United Kingdom"


class Contact(BaseModel):
    """Client contact"""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None


class Client(BaseModel):
    """Client model"""
    id: str
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None
    billing_address: Optional[BillingAddress] = None
    currency: Optional[str] = "GBP"
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    contacts: Optional[List[Contact]] = None
    archived: Optional[bool] = False
    status: Optional[str] = "active"

    # Statistics
    total_owed: Optional[float] = 0
    last_invoice_date: Optional[str] = None
    invoice_count: Optional[int] = 0
    total_paid: Optional[float] = 0
    preferred_payment_method: Optional[str] = None

    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Additional fields
    po_number: Optional[str] = None

    # For Firestore compatibility
    freelancer_id: Optional[str] = None  # Owner user ID
    total_invoiced: Optional[float] = 0
    total_overdue: Optional[float] = 0
    last_invoiced_at: Optional[datetime] = None
    last_paid_at: Optional[datetime] = None
    rating: Optional[int] = None  # 1-5 star rating

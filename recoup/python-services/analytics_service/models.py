"""
Data Models for Analytics Service
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum


class InvoiceStatus(str, Enum):
    """Invoice status enum"""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    IN_COLLECTIONS = "in_collections"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"


@dataclass
class InvoiceData:
    """Invoice data model"""
    invoice_id: str
    freelancer_id: str
    client_name: str
    client_email: str
    amount: float
    status: str
    invoice_date: datetime
    due_date: datetime
    paid_at: Optional[datetime] = None
    collections_enabled: bool = False
    currency: str = "GBP"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'InvoiceData':
        """Create InvoiceData from dict"""
        # Parse dates
        invoice_date = cls._parse_date(data.get('invoiceDate') or data.get('invoice_date'))
        due_date = cls._parse_date(data.get('dueDate') or data.get('due_date'))
        paid_at = cls._parse_date(data.get('paidAt') or data.get('paid_at'))

        return cls(
            invoice_id=data.get('invoiceId') or data.get('invoice_id') or '',
            freelancer_id=data.get('freelancerId') or data.get('freelancer_id') or '',
            client_name=data.get('clientName') or data.get('client_name') or '',
            client_email=data.get('clientEmail') or data.get('client_email') or '',
            amount=float(data.get('amount', 0)),
            status=data.get('status', 'draft'),
            invoice_date=invoice_date,
            due_date=due_date,
            paid_at=paid_at,
            collections_enabled=data.get('collectionsEnabled') or data.get('collections_enabled') or False,
            currency=data.get('currency', 'GBP')
        )

    @staticmethod
    def _parse_date(date_value: Any) -> Optional[datetime]:
        """Parse date from various formats"""
        if not date_value:
            return None

        if isinstance(date_value, datetime):
            return date_value

        if isinstance(date_value, str):
            try:
                return datetime.fromisoformat(date_value.replace('Z', '+00:00'))
            except:
                pass

        # Firestore Timestamp format
        if isinstance(date_value, dict) and '_seconds' in date_value:
            return datetime.fromtimestamp(date_value['_seconds'])

        return None


@dataclass
class PredictionResponse:
    """Standard prediction response format"""
    type: str
    title: str
    prediction: str
    description: str
    confidence: float
    metrics: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'type': self.type,
            'title': self.title,
            'prediction': self.prediction,
            'description': self.description,
            'confidence': self.confidence,
            'metrics': self.metrics
        }

"""
Notification Model
Converted from relay/types/models.ts
"""

from datetime import datetime
from typing import Optional, Literal, Dict, Any, List
from pydantic import BaseModel


class NotificationContextData(BaseModel):
    """Context data for notifications"""
    days_since_last: Optional[int] = None
    last_amount: Optional[float] = None
    client_name: Optional[str] = None
    relevant_resources: Optional[List[str]] = None
    action_suggestions: Optional[List[str]] = None
    percentile: Optional[int] = None
    predicted_outcome: Optional[str] = None


class Notification(BaseModel):
    """Notification model"""
    # Identifiers
    notification_id: str  # document ID
    user_id: str

    # Content
    type: Literal[
        'invoice_drought',
        'payment_delay',
        'win',
        'prediction',
        'opportunity',
        'daily_digest',
        'behavioral_trigger_incomplete_invoice',
        'behavioral_trigger_invoice_created_not_sent'
    ]
    title: str
    message: str
    action_url: Optional[str] = None

    # Context Data
    context_data: Optional[NotificationContextData] = None

    # Delivery
    channel: Optional[Literal['email', 'in_app', 'both']] = 'in_app'
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None

    # Status
    status: Optional[Literal['pending', 'sent', 'delivered', 'opened', 'clicked', 'failed']] = 'pending'
    delivery_attempts: Optional[int] = 0
    last_attempt_at: Optional[datetime] = None

    # Tracking
    efficacy: Optional[Literal['pending', 'effective', 'ignored', 'negative']] = 'pending'
    action_taken: Optional[str] = None

    # Read Status
    read: bool = False
    read_at: Optional[datetime] = None

    # Optional metadata
    metadata: Optional[Dict[str, Any]] = None

    # Timestamps
    created_at: datetime
    expires_at: Optional[datetime] = None  # Auto-delete after 30 days

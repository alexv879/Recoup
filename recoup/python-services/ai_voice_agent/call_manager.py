"""
Call Manager Module
Manages call records and state
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import json
import logging

logger = logging.getLogger(__name__)


@dataclass
class CallRecord:
    """Call record data structure"""
    call_sid: str
    invoice_id: str
    freelancer_id: str
    recipient_phone: str
    amount: float
    initiated_at: datetime
    status: str = "initiated"
    duration: Optional[int] = None
    transcript: Optional[str] = None
    outcome: Optional[str] = None
    payment_collected: bool = False
    total_cost: Optional[float] = None
    completed_at: Optional[datetime] = None
    full_transcript: List[Dict] = field(default_factory=list)

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            "call_sid": self.call_sid,
            "invoice_id": self.invoice_id,
            "freelancer_id": self.freelancer_id,
            "recipient_phone": self.recipient_phone,
            "amount": self.amount,
            "initiated_at": self.initiated_at.isoformat(),
            "status": self.status,
            "duration": self.duration,
            "transcript": self.transcript,
            "outcome": self.outcome,
            "payment_collected": self.payment_collected,
            "total_cost": self.total_cost,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "full_transcript": self.full_transcript
        }


class CallManager:
    """
    Manages call records
    In production, this would connect to Firestore or PostgreSQL
    """

    def __init__(self):
        # In-memory storage (replace with database in production)
        self.calls: Dict[str, CallRecord] = {}
        self.invoice_call_history: Dict[str, List[datetime]] = {}

    def save_call(self, call_record: CallRecord):
        """Save call record"""
        self.calls[call_record.call_sid] = call_record

        # Track call history for invoice
        if call_record.invoice_id not in self.invoice_call_history:
            self.invoice_call_history[call_record.invoice_id] = []
        self.invoice_call_history[call_record.invoice_id].append(call_record.initiated_at)

        logger.info(f"Call saved: {call_record.call_sid}")

    def get_call(self, call_sid: str) -> Optional[CallRecord]:
        """Get call record by SID"""
        return self.calls.get(call_sid)

    def update_call(self, call_record: CallRecord):
        """Update existing call record"""
        if call_record.call_sid in self.calls:
            self.calls[call_record.call_sid] = call_record
            logger.info(f"Call updated: {call_record.call_sid}")

    def is_in_cooldown(self, invoice_id: str, cooldown_hours: int = 24) -> bool:
        """
        Check if invoice is in cooldown period
        (prevents calling same client too frequently)

        Args:
            invoice_id: Invoice ID
            cooldown_hours: Cooldown period in hours (default: 24)

        Returns:
            True if in cooldown, False otherwise
        """
        if invoice_id not in self.invoice_call_history:
            return False

        last_calls = self.invoice_call_history[invoice_id]
        if not last_calls:
            return False

        last_call_time = max(last_calls)
        cooldown_end = last_call_time + timedelta(hours=cooldown_hours)

        return datetime.now() < cooldown_end

    def add_transcript_entry(self, call_sid: str, speaker: str, text: str):
        """
        Add transcript entry to call record

        Args:
            call_sid: Call SID
            speaker: "user" or "ai"
            text: Transcript text
        """
        call_record = self.get_call(call_sid)
        if not call_record:
            return

        entry = {
            "timestamp": datetime.now().isoformat(),
            "speaker": speaker,
            "text": text
        }

        call_record.full_transcript.append(entry)
        self.update_call(call_record)

    def finalize_call(
        self,
        call_sid: str,
        outcome: str,
        payment_collected: bool = False,
        total_cost: Optional[float] = None
    ):
        """
        Finalize call with outcome

        Args:
            call_sid: Call SID
            outcome: Call outcome (e.g., "payment_promised", "disputed", "no_answer")
            payment_collected: Whether payment was collected
            total_cost: Total cost of the call
        """
        call_record = self.get_call(call_sid)
        if not call_record:
            return

        call_record.outcome = outcome
        call_record.payment_collected = payment_collected
        call_record.total_cost = total_cost
        call_record.completed_at = datetime.now()

        # Compile full transcript
        transcript_text = "\n".join([
            f"[{entry['speaker'].upper()}]: {entry['text']}"
            for entry in call_record.full_transcript
        ])
        call_record.transcript = transcript_text

        self.update_call(call_record)
        logger.info(f"Call finalized: {call_sid}, outcome: {outcome}")

    def get_calls_for_invoice(self, invoice_id: str) -> List[CallRecord]:
        """Get all calls for an invoice"""
        return [
            call for call in self.calls.values()
            if call.invoice_id == invoice_id
        ]

    def get_calls_for_freelancer(self, freelancer_id: str) -> List[CallRecord]:
        """Get all calls for a freelancer"""
        return [
            call for call in self.calls.values()
            if call.freelancer_id == freelancer_id
        ]

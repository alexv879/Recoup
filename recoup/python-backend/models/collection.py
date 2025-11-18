"""
Collection Attempt Model
Converted from relay/types/models.ts
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel


class RecipientAddress(BaseModel):
    """Physical mail recipient address"""
    line1: str
    line2: Optional[str] = None
    city: str
    postcode: str
    country: str = "United Kingdom"


class CollectionAttempt(BaseModel):
    """Collection attempt model"""
    # Identifiers
    attempt_id: str  # document ID
    invoice_id: str
    freelancer_id: str

    # Attempt Details
    attempt_type: Literal['email_reminder', 'sms_reminder', 'physical_letter', 'ai_call', 'manual_contact', 'payment_received']
    attempt_date: datetime
    attempt_number: int

    # Results
    result: Literal['success', 'failed', 'pending', 'ignored']
    result_details: Optional[str] = None

    # Email Specifics
    email_type: Optional[Literal['day7', 'day21', 'follow_up']] = None
    email_sent_at: Optional[datetime] = None
    email_opened_at: Optional[datetime] = None
    email_clicked_at: Optional[datetime] = None

    # SMS Specifics (PREMIUM - Twilio)
    sms_day_14_sent: Optional[bool] = False
    sms_day_14_sid: Optional[str] = None
    sms_day_14_sent_at: Optional[datetime] = None
    twilio_message_id: Optional[str] = None
    sms_sent_at: Optional[datetime] = None
    sms_status: Optional[Literal['sent', 'failed', 'delivered', 'undelivered']] = None
    sms_delivered_at: Optional[datetime] = None
    sms_error_code: Optional[str] = None
    sms_error_message: Optional[str] = None

    # Physical Letter Specifics (PREMIUM - Lob.com)
    letter_day_30_sent: Optional[bool] = False
    letter_day_30_lob_id: Optional[str] = None
    letter_day_30_sent_at: Optional[datetime] = None
    letter_api_ref: Optional[str] = None
    letter_sent_at: Optional[datetime] = None
    letter_status: Optional[Literal['sent', 'failed', 'delivered', 'returned']] = None
    template_used: Optional[Literal['gentle', 'final_warning', 'lba']] = None  # Letter Before Action
    recipient_address: Optional[RecipientAddress] = None
    letter_tracking_url: Optional[str] = None
    letter_expected_delivery: Optional[datetime] = None

    # AI Voice Agent Call Specifics (PREMIUM - OpenAI Realtime + Twilio)
    call_sid: Optional[str] = None  # Twilio call session ID
    call_duration: Optional[int] = None  # seconds
    call_recording_url: Optional[str] = None
    call_transcript: Optional[str] = None  # Full transcript from OpenAI Whisper
    transcribed_at: Optional[datetime] = None
    call_outcome: Optional[Literal['paid', 'promise', 'partial', 'refused', 'no_answer', 'voicemail', 'error']] = None
    call_notes: Optional[str] = None  # AI-generated summary
    client_proposed_date: Optional[str] = None  # If client promises payment by date
    partial_amount_agreed: Optional[int] = None  # If partial payment agreed
    payment_link_sent_in_call: Optional[bool] = False
    payment_method: Optional[Literal['sms_link', 'ivr', 'bank_transfer']] = None
    ivr_confirmed: Optional[bool] = False
    call_started_at: Optional[datetime] = None
    call_ended_at: Optional[datetime] = None
    call_error_message: Optional[str] = None

    # Post-Call Actions (PREMIUM)
    next_action: Optional[Literal['accept_partial', 'schedule_followup', 'escalate', 'pause', 'complete', 'agency_handoff']] = None
    scheduled_followup_date: Optional[datetime] = None
    direct_debit_setup: Optional[bool] = False
    partial_amount_collected: Optional[int] = None

    # Agency Escalation (PREMIUM)
    escalated_to_agency: Optional[bool] = False
    agency_handoff_id: Optional[str] = None
    escalation_date: Optional[datetime] = None

    # Outcomes
    payment_recovered: Optional[int] = None
    payment_date: Optional[datetime] = None

    # Metadata
    is_premium_feature: Optional[bool] = False
    consent_given: Optional[bool] = False  # GDPR/UK comms law consent
    created_at: datetime
    updated_at: Optional[datetime] = None

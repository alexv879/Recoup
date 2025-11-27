"""
Twilio Integration Module
Handles Twilio voice calls and SMS
"""

import logging
from dataclasses import dataclass
from typing import Optional, Dict, Any
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)


@dataclass
class CallParams:
    """Parameters for initiating a call"""
    to_phone: str
    recipient_name: str
    invoice_reference: str
    amount: float
    due_date: str
    days_past_due: int
    business_name: str
    enable_payment: bool = True


class TwilioVoiceClient:
    """Twilio voice call manager"""

    def __init__(self, account_sid: str, auth_token: str, phone_number: str):
        if not all([account_sid, auth_token, phone_number]):
            raise ValueError("Twilio credentials not configured")

        self.client = Client(account_sid, auth_token)
        self.phone_number = phone_number

    async def initiate_call(self, params: CallParams) -> Dict[str, Any]:
        """
        Initiate outbound call via Twilio

        Args:
            params: Call parameters

        Returns:
            dict with success status and call_sid
        """
        try:
            # UK FCA compliance checks
            if not self._is_allowed_time():
                return {
                    "success": False,
                    "error": "Calls not allowed outside 8am-9pm Mon-Sat (FCA rules)"
                }

            # Create call
            call = self.client.calls.create(
                to=params.to_phone,
                from_=self.phone_number,
                url=f"{self._get_base_url()}/webhook/twilio/voice",
                status_callback=f"{self._get_base_url()}/webhook/twilio/status",
                status_callback_event=['initiated', 'ringing', 'answered', 'completed'],
                record=True,  # Record for compliance
                recording_status_callback=f"{self._get_base_url()}/webhook/twilio/recording"
            )

            logger.info(f"Call initiated: {call.sid}")

            return {
                "success": True,
                "call_sid": call.sid
            }

        except TwilioRestException as e:
            logger.error(f"Twilio error: {e.msg}")
            return {
                "success": False,
                "error": e.msg
            }
        except Exception as e:
            logger.error(f"Call initiation failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def get_call_status(self, call_sid: str) -> Dict[str, Any]:
        """
        Get call status from Twilio

        Args:
            call_sid: Twilio call SID

        Returns:
            dict with status, duration, etc.
        """
        try:
            call = self.client.calls(call_sid).fetch()

            return {
                "status": call.status,
                "duration": call.duration,
                "start_time": call.start_time,
                "end_time": call.end_time,
                "direction": call.direction,
                "price": call.price
            }

        except TwilioRestException as e:
            logger.error(f"Error fetching call status: {e.msg}")
            return {"status": "error", "error": e.msg}

    async def send_payment_sms(
        self,
        to_phone: str,
        payment_link: str,
        amount: float,
        business_name: str
    ) -> bool:
        """
        Send SMS with payment link

        Args:
            to_phone: Recipient phone number
            payment_link: Payment URL
            amount: Invoice amount
            business_name: Business name

        Returns:
            Success boolean
        """
        try:
            message_body = (
                f"{business_name} - Payment link for £{amount:.2f}: {payment_link}\n\n"
                f"Reply STOP to opt out."
            )

            message = self.client.messages.create(
                to=to_phone,
                from_=self.phone_number,
                body=message_body
            )

            logger.info(f"SMS sent: {message.sid}")
            return True

        except TwilioRestException as e:
            logger.error(f"SMS send error: {e.msg}")
            return False

    def _is_allowed_time(self) -> bool:
        """
        Check if current time is within FCA allowed hours
        Office hours: 8am-9pm Mon-Sat (no Sundays)

        Returns:
            True if allowed, False otherwise
        """
        from datetime import datetime

        now = datetime.now()
        hour = now.hour
        day = now.weekday()  # 0 = Monday, 6 = Sunday

        # No Sundays
        if day == 6:
            return False

        # 8am to 9pm
        if hour < 8 or hour >= 21:
            return False

        return True

    def _get_base_url(self) -> str:
        """Get base URL for webhooks"""
        import os
        return os.getenv("BASE_URL", "http://localhost:8003")

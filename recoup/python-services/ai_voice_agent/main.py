"""
AI Voice Agent Microservice
Handles AI-powered collection calls using Twilio + OpenAI Realtime API

Features:
- Automated collection calls with natural conversation
- Bidirectional audio streaming (Twilio ↔ OpenAI)
- Payment collection during call via IVR/SMS
- Call recording and transcription
- UK FCA compliance

Endpoints:
- POST /initiate-call - Start AI collection call
- GET /call-status/{call_sid} - Get call status and transcript
- POST /webhook/twilio/voice - Twilio voice webhook
- POST /webhook/twilio/status - Twilio status callback
- GET /health - Health check
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import os

from twilio_integration import TwilioVoiceClient, CallParams
from openai_realtime import OpenAIRealtimeAgent
from call_manager import CallManager, CallRecord

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Recoup AI Voice Agent",
    description="AI-powered collection calls",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
twilio_client = TwilioVoiceClient(
    account_sid=os.getenv("TWILIO_ACCOUNT_SID"),
    auth_token=os.getenv("TWILIO_AUTH_TOKEN"),
    phone_number=os.getenv("TWILIO_PHONE_NUMBER")
)

call_manager = CallManager()

# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class InitiateCallRequest(BaseModel):
    """Request to initiate AI collection call"""
    recipient_phone: str
    recipient_name: str
    invoice_reference: str
    amount: float
    due_date: str
    days_past_due: int
    business_name: str
    invoice_id: str
    freelancer_id: str
    enable_payment_during_call: bool = True


class InitiateCallResponse(BaseModel):
    """Response from call initiation"""
    success: bool
    call_sid: Optional[str] = None
    error: Optional[str] = None
    estimated_cost: Optional[Dict[str, float]] = None


class CallStatusResponse(BaseModel):
    """Call status and details"""
    call_sid: str
    status: str
    duration: Optional[int] = None
    transcript: Optional[str] = None
    outcome: Optional[str] = None
    payment_collected: bool = False
    cost: Optional[float] = None


class CostEstimateRequest(BaseModel):
    """Request for cost estimate"""
    estimated_duration_minutes: int
    include_sms: bool = True
    include_recording: bool = True


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai_voice_agent",
        "version": "1.0.0"
    }


@app.post("/initiate-call", response_model=InitiateCallResponse)
async def initiate_call(request: InitiateCallRequest):
    """
    Initiate AI-powered collection call

    Args:
        request: Call parameters including recipient details and invoice info

    Returns:
        Call SID and estimated cost
    """
    try:
        logger.info(f"Initiating AI call to {request.recipient_phone} for invoice {request.invoice_reference}")

        # Validate minimum amount (£50+)
        if request.amount < 50:
            raise HTTPException(
                status_code=400,
                detail="Minimum invoice amount for AI calls is £50"
            )

        # Check cooldown period (24 hours)
        if call_manager.is_in_cooldown(request.invoice_id):
            raise HTTPException(
                status_code=429,
                detail="24-hour cooldown period between calls for same invoice"
            )

        # Prepare call parameters
        call_params = CallParams(
            to_phone=request.recipient_phone,
            recipient_name=request.recipient_name,
            invoice_reference=request.invoice_reference,
            amount=request.amount,
            due_date=request.due_date,
            days_past_due=request.days_past_due,
            business_name=request.business_name,
            enable_payment=request.enable_payment_during_call
        )

        # Estimate cost
        estimated_cost = estimate_call_cost(
            estimated_duration_minutes=3,  # Average call duration
            include_sms=request.enable_payment_during_call,
            include_recording=True
        )

        # Initiate call via Twilio
        call_result = await twilio_client.initiate_call(call_params)

        if not call_result["success"]:
            return InitiateCallResponse(
                success=False,
                error=call_result.get("error", "Unknown error")
            )

        # Record call in database
        call_record = CallRecord(
            call_sid=call_result["call_sid"],
            invoice_id=request.invoice_id,
            freelancer_id=request.freelancer_id,
            recipient_phone=request.recipient_phone,
            amount=request.amount,
            initiated_at=datetime.now()
        )
        call_manager.save_call(call_record)

        logger.info(f"Call initiated successfully: {call_result['call_sid']}")

        return InitiateCallResponse(
            success=True,
            call_sid=call_result["call_sid"],
            estimated_cost=estimated_cost
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Call initiation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/call-status/{call_sid}", response_model=CallStatusResponse)
async def get_call_status(call_sid: str):
    """
    Get status and transcript for a call

    Args:
        call_sid: Twilio call SID

    Returns:
        Call status, transcript, and outcome
    """
    try:
        call_record = call_manager.get_call(call_sid)

        if not call_record:
            raise HTTPException(status_code=404, detail="Call not found")

        # Get latest status from Twilio
        twilio_status = await twilio_client.get_call_status(call_sid)

        return CallStatusResponse(
            call_sid=call_sid,
            status=twilio_status.get("status", "unknown"),
            duration=twilio_status.get("duration"),
            transcript=call_record.transcript,
            outcome=call_record.outcome,
            payment_collected=call_record.payment_collected,
            cost=call_record.total_cost
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get call status error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/webhook/twilio/voice")
async def twilio_voice_webhook(request: Request):
    """
    Twilio voice webhook - handles incoming call events
    Connects Twilio call to OpenAI Realtime API via WebSocket
    """
    try:
        form_data = await request.form()
        call_sid = form_data.get("CallSid")

        logger.info(f"Twilio voice webhook: {call_sid}")

        # TwiML response to connect to WebSocket
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Please wait while we connect you to our payment assistant.</Say>
    <Connect>
        <Stream url="wss://{request.url.hostname}/ws/voice/{call_sid}" />
    </Connect>
</Response>"""

        return Response(content=twiml, media_type="application/xml")

    except Exception as e:
        logger.error(f"Twilio webhook error: {str(e)}", exc_info=True)
        return Response(
            content='<?xml version="1.0" encoding="UTF-8"?><Response><Say>We apologize, but there was an error. Goodbye.</Say></Response>',
            media_type="application/xml"
        )


@app.post("/webhook/twilio/status")
async def twilio_status_callback(request: Request):
    """
    Twilio status callback - updates call status
    """
    try:
        form_data = await request.form()
        call_sid = form_data.get("CallSid")
        call_status = form_data.get("CallStatus")
        duration = form_data.get("CallDuration")

        logger.info(f"Call {call_sid} status: {call_status}, duration: {duration}s")

        # Update call record
        call_record = call_manager.get_call(call_sid)
        if call_record:
            call_record.status = call_status
            if duration:
                call_record.duration = int(duration)
            call_manager.update_call(call_record)

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Status callback error: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}


@app.post("/estimate-cost")
async def estimate_cost_endpoint(request: CostEstimateRequest):
    """
    Estimate cost of AI collection call

    Returns breakdown of Twilio and OpenAI costs
    """
    cost = estimate_call_cost(
        estimated_duration_minutes=request.estimated_duration_minutes,
        include_sms=request.include_sms,
        include_recording=request.include_recording
    )
    return cost


def estimate_call_cost(
    estimated_duration_minutes: int,
    include_sms: bool = True,
    include_recording: bool = True
) -> Dict[str, float]:
    """
    Calculate estimated cost for AI call

    Pricing (approximate UK rates):
    - Twilio call: £0.013/minute
    - Twilio SMS: £0.04 per message
    - Twilio recording: £0.002/minute
    - OpenAI Realtime: £0.06/minute

    Args:
        estimated_duration_minutes: Expected call duration
        include_sms: Include SMS cost for payment link
        include_recording: Include recording cost

    Returns:
        Cost breakdown dict
    """
    twilio_call_cost = 0.013 * estimated_duration_minutes
    twilio_sms_cost = 0.04 if include_sms else 0.0
    recording_cost = 0.002 * estimated_duration_minutes if include_recording else 0.0
    openai_cost = 0.06 * estimated_duration_minutes

    total = twilio_call_cost + twilio_sms_cost + recording_cost + openai_cost

    return {
        "twilio_call_cost": round(twilio_call_cost, 3),
        "twilio_sms_cost": round(twilio_sms_cost, 3),
        "recording_cost": round(recording_cost, 3),
        "openai_cost": round(openai_cost, 3),
        "total": round(total, 3)
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8003))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

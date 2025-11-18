"""
Voice Processing Microservice
Handles voice-to-text transcription and invoice parsing

FastAPI service that provides:
- Audio transcription via Deepgram (primary) and OpenAI Whisper (fallback)
- Invoice data extraction from transcripts using NLP
- Audio quality validation
- Real-time streaming support

Endpoints:
- POST /transcribe - Transcribe audio file
- POST /transcribe/streaming - WebSocket streaming transcription
- POST /parse-invoice - Extract invoice data from transcript
- GET /health - Health check
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import logging

from transcribe import transcribe_with_deepgram, transcribe_with_whisper, validate_audio
from parse_invoice import parse_invoice_from_transcript, InvoiceData
from streaming import DeepgramStreamingTranscriber

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Recoup Voice Service",
    description="Voice transcription and invoice parsing service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# MODELS
# ============================================================

class TranscriptionResponse(BaseModel):
    transcript: str
    confidence: float
    latency: int
    provider: str
    metadata: Optional[Dict[str, Any]] = None


class InvoiceParseRequest(BaseModel):
    transcript: str


class InvoiceParseResponse(BaseModel):
    client_name: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "GBP"
    description: Optional[str] = None
    due_date: Optional[str] = None
    raw_transcript: str
    confidence: float


class TranscribeAndParseResponse(BaseModel):
    transcription: TranscriptionResponse
    invoice_data: InvoiceParseResponse


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "voice_service",
        "version": "1.0.0"
    }


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    provider: str = "deepgram",
    language: str = "en-GB"
):
    """
    Transcribe audio file to text

    Args:
        audio: Audio file (webm, wav, mp3, ogg)
        provider: "deepgram" or "whisper" (default: deepgram)
        language: Language code (default: en-GB)

    Returns:
        TranscriptionResponse with transcript and metadata
    """
    try:
        # Read audio file
        audio_bytes = await audio.read()

        # Validate audio quality
        validation = validate_audio(audio_bytes, audio.content_type)
        if not validation["valid"]:
            raise HTTPException(
                status_code=400,
                detail={"errors": validation["errors"]}
            )

        # Transcribe with selected provider
        if provider == "whisper":
            result = await transcribe_with_whisper(audio_bytes, audio.filename, language)
        else:
            # Try Deepgram first, fallback to Whisper on failure
            try:
                result = await transcribe_with_deepgram(audio_bytes, audio.content_type, language)
            except Exception as e:
                logger.warning(f"Deepgram failed, falling back to Whisper: {str(e)}")
                result = await transcribe_with_whisper(audio_bytes, audio.filename, language)

        return TranscriptionResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/parse-invoice", response_model=InvoiceParseResponse)
async def parse_invoice(request: InvoiceParseRequest):
    """
    Parse invoice data from transcript text

    Args:
        transcript: Voice transcript text

    Returns:
        Parsed invoice data with confidence score
    """
    try:
        result = parse_invoice_from_transcript(request.transcript)
        return InvoiceParseResponse(**result)

    except Exception as e:
        logger.error(f"Invoice parsing error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe-and-parse", response_model=TranscribeAndParseResponse)
async def transcribe_and_parse(
    audio: UploadFile = File(...),
    provider: str = "deepgram",
    language: str = "en-GB"
):
    """
    Transcribe audio and parse invoice data in one request

    Args:
        audio: Audio file
        provider: Transcription provider
        language: Language code

    Returns:
        Both transcription and parsed invoice data
    """
    try:
        # Transcribe
        transcription = await transcribe_audio(audio, provider, language)

        # Parse invoice
        invoice_data = parse_invoice_from_transcript(transcription.transcript)

        return TranscribeAndParseResponse(
            transcription=transcription,
            invoice_data=InvoiceParseResponse(**invoice_data)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcribe and parse error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """
    WebSocket endpoint for real-time streaming transcription

    Client sends audio chunks, server returns interim and final transcripts
    """
    await websocket.accept()

    transcriber = DeepgramStreamingTranscriber(
        api_key=os.getenv("DEEPGRAM_API_KEY"),
        language="en-GB"
    )

    try:
        # Connect to Deepgram
        await transcriber.connect()

        async def send_to_client(data):
            """Send transcription results to client"""
            await websocket.send_json(data)

        # Set callback
        transcriber.on_transcript = send_to_client

        # Receive audio chunks from client
        while True:
            data = await websocket.receive_bytes()
            await transcriber.send_audio(data)

    except WebSocketDisconnect:
        logger.info("Client disconnected from WebSocket")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}", exc_info=True)
    finally:
        await transcriber.disconnect()
        await websocket.close()


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8001))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

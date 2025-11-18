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

from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError
from typing import Optional, List, Dict, Any
import logging
import time
import traceback
from contextlib import asynccontextmanager

from transcribe import transcribe_with_deepgram, transcribe_with_whisper, validate_audio
from parse_invoice import parse_invoice_from_transcript, InvoiceData
from streaming import DeepgramStreamingTranscriber
from config import get_config

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - [%(pathname)s:%(lineno)d]'
)
logger = logging.getLogger(__name__)


# Custom exceptions
class ServiceError(Exception):
    """Base service exception"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class TranscriptionError(ServiceError):
    """Transcription-specific error"""
    def __init__(self, message: str):
        super().__init__(message, status_code=503)


class ValidationError(ServiceError):
    """Validation error"""
    def __init__(self, message: str):
        super().__init__(message, status_code=400)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    config = get_config()
    logger.info(f"Starting Voice Service v1.0.0 on port {config.PORT}")
    logger.info(f"Environment: {config.ENV}")
    logger.info(f"Deepgram API: {'configured' if config.DEEPGRAM_API_KEY else 'not configured'}")
    logger.info(f"OpenAI API: {'configured' if config.OPENAI_API_KEY else 'not configured'}")

    yield

    # Shutdown
    logger.info("Shutting down Voice Service")


# Initialize FastAPI with lifespan
app = FastAPI(
    title="Recoup Voice Service",
    description="Voice transcription and invoice parsing service",
    version="1.0.0",
    lifespan=lifespan
)

# Get configuration
config = get_config()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(ServiceError)
async def service_error_handler(request: Request, exc: ServiceError):
    """Handle custom service errors"""
    logger.error(f"Service error: {exc.message}", exc_info=True)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "type": exc.__class__.__name__
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation failed",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "message": str(exc) if config.is_development else "An unexpected error occurred"
        }
    )


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests with timing"""
    start_time = time.time()
    request_id = f"{int(time.time() * 1000)}"

    logger.info(f"[{request_id}] {request.method} {request.url.path} started")

    try:
        response = await call_next(request)
        duration = int((time.time() - start_time) * 1000)

        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"completed in {duration}ms with status {response.status_code}"
        )

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration}ms"

        return response

    except Exception as exc:
        duration = int((time.time() - start_time) * 1000)
        logger.error(
            f"[{request_id}] {request.method} {request.url.path} "
            f"failed after {duration}ms: {str(exc)}"
        )
        raise

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
    """
    Comprehensive health check endpoint
    Checks service status and external dependencies
    """
    health_status = {
        "status": "healthy",
        "service": "voice_service",
        "version": "1.0.0",
        "timestamp": time.time(),
        "environment": config.ENV,
        "dependencies": {}
    }

    # Check Deepgram availability
    if config.DEEPGRAM_API_KEY:
        health_status["dependencies"]["deepgram"] = "configured"
    else:
        health_status["dependencies"]["deepgram"] = "not_configured"
        health_status["status"] = "degraded"

    # Check OpenAI availability
    if config.OPENAI_API_KEY:
        health_status["dependencies"]["openai"] = "configured"
    else:
        health_status["dependencies"]["openai"] = "not_configured"
        if not config.DEEPGRAM_API_KEY:
            health_status["status"] = "unhealthy"

    return health_status


@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "service": "Recoup Voice Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "transcribe": "/transcribe",
            "parse_invoice": "/parse-invoice",
            "transcribe_and_parse": "/transcribe-and-parse",
            "streaming": "/ws/transcribe",
            "health": "/health",
            "docs": "/docs"
        }
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
    start_time = time.time()

    # Validate provider
    if provider not in ["deepgram", "whisper"]:
        raise ValidationError(f"Invalid provider: {provider}. Must be 'deepgram' or 'whisper'")

    # Check if provider is configured
    if provider == "deepgram" and not config.DEEPGRAM_API_KEY:
        raise ValidationError("Deepgram provider requested but API key not configured")
    if provider == "whisper" and not config.OPENAI_API_KEY:
        raise ValidationError("Whisper provider requested but API key not configured")

    # Read and validate audio file
    try:
        audio_bytes = await audio.read()
    except Exception as e:
        logger.error(f"Failed to read audio file: {str(e)}")
        raise ValidationError("Failed to read audio file")

    # Validate audio size
    file_size_mb = len(audio_bytes) / (1024 * 1024)
    if file_size_mb > config.MAX_AUDIO_SIZE_MB:
        raise ValidationError(
            f"Audio file too large: {file_size_mb:.2f}MB (max {config.MAX_AUDIO_SIZE_MB}MB)"
        )

    # Validate audio format
    if audio.content_type not in config.ALLOWED_AUDIO_FORMATS:
        raise ValidationError(
            f"Unsupported audio format: {audio.content_type}. "
            f"Allowed formats: {', '.join(config.ALLOWED_AUDIO_FORMATS)}"
        )

    # Validate audio quality
    validation = validate_audio(audio_bytes, audio.content_type)
    if not validation["valid"]:
        raise ValidationError(f"Audio validation failed: {', '.join(validation['errors'])}")

    # Transcribe with selected provider
    try:
        if provider == "whisper":
            logger.info("Transcribing with Whisper")
            result = await transcribe_with_whisper(audio_bytes, audio.filename, language)
        else:
            # Try Deepgram first, fallback to Whisper on failure
            try:
                logger.info("Transcribing with Deepgram")
                result = await transcribe_with_deepgram(
                    audio_bytes,
                    audio.content_type,
                    language,
                    timeout=config.DEEPGRAM_TIMEOUT
                )
            except Exception as e:
                logger.warning(f"Deepgram failed, falling back to Whisper: {str(e)}")
                if not config.OPENAI_API_KEY:
                    raise TranscriptionError("Deepgram failed and no fallback provider available")

                result = await transcribe_with_whisper(
                    audio_bytes,
                    audio.filename,
                    language,
                    timeout=config.OPENAI_TIMEOUT
                )

        duration = int((time.time() - start_time) * 1000)
        logger.info(
            f"Transcription successful: {len(result['transcript'])} chars, "
            f"{result['provider']}, {duration}ms total"
        )

        return TranscriptionResponse(**result)

    except TranscriptionError:
        raise
    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}", exc_info=True)
        raise TranscriptionError(f"Transcription failed: {str(e)}")


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
    if not config.DEEPGRAM_API_KEY:
        await websocket.close(code=1008, reason="Deepgram not configured for streaming")
        return

    await websocket.accept()
    logger.info("WebSocket client connected")

    transcriber = DeepgramStreamingTranscriber(
        api_key=config.DEEPGRAM_API_KEY,
        language="en-GB"
    )

    try:
        # Connect to Deepgram
        await transcriber.connect()
        logger.info("Connected to Deepgram streaming API")

        async def send_to_client(data):
            """Send transcription results to client"""
            try:
                await websocket.send_json(data)
            except Exception as e:
                logger.error(f"Failed to send to client: {str(e)}")

        # Set callback
        transcriber.on_transcript = send_to_client

        # Receive audio chunks from client
        while True:
            try:
                data = await websocket.receive_bytes()
                await transcriber.send_audio(data)
            except WebSocketDisconnect:
                logger.info("Client disconnected normally")
                break
            except Exception as e:
                logger.error(f"Error receiving audio: {str(e)}")
                break

    except WebSocketDisconnect:
        logger.info("Client disconnected from WebSocket")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}", exc_info=True)
        try:
            await websocket.send_json({
                "error": "Transcription error",
                "message": str(e)
            })
        except:
            pass
    finally:
        await transcriber.disconnect()
        try:
            await websocket.close()
        except:
            pass
        logger.info("WebSocket connection closed")


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

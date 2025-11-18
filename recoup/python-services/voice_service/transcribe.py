"""
Audio Transcription Module
Handles Deepgram and OpenAI Whisper transcription with retry logic
"""

import time
import logging
import asyncio
from typing import Dict, Any, Optional
import httpx
import openai

from config import get_config

logger = logging.getLogger(__name__)

# Get configuration
config = get_config()

# Initialize OpenAI client
if config.OPENAI_API_KEY:
    openai.api_key = config.OPENAI_API_KEY


async def retry_with_backoff(
    func,
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
    *args,
    **kwargs
):
    """
    Retry function with exponential backoff

    Args:
        func: Async function to retry
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        backoff_factor: Multiplier for delay after each retry

    Returns:
        Function result

    Raises:
        Last exception if all retries fail
    """
    last_exception = None
    delay = initial_delay

    for attempt in range(max_retries):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            last_exception = e
            if attempt < max_retries - 1:
                logger.warning(
                    f"Attempt {attempt + 1}/{max_retries} failed: {str(e)}. "
                    f"Retrying in {delay}s..."
                )
                await asyncio.sleep(delay)
                delay *= backoff_factor
            else:
                logger.error(f"All {max_retries} attempts failed")

    raise last_exception


async def _transcribe_with_deepgram_internal(
    audio_bytes: bytes,
    content_type: str,
    language: str,
    timeout: int
) -> Dict[str, Any]:
    """Internal Deepgram transcription function (for retry logic)"""
    start_time = time.time()

    # Deepgram API endpoint
    url = "https://api.deepgram.com/v1/listen"

    # Query parameters
    params = {
        "model": "nova-2",  # Latest Deepgram model
        "language": language,
        "punctuate": "true",
        "diarize": "false",
        "smart_format": "true"
    }

    # Headers
    headers = {
        "Authorization": f"Token {config.DEEPGRAM_API_KEY}",
        "Content-Type": content_type or "audio/webm"
    }

    # Make request with retry-friendly client
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            url,
            params=params,
            headers=headers,
            content=audio_bytes
        )

    if response.status_code != 200:
        error_msg = f"Deepgram API error: {response.status_code}"
        try:
            error_detail = response.json()
            error_msg += f" - {error_detail}"
        except:
            error_msg += f" - {response.text[:200]}"
        raise Exception(error_msg)

    result = response.json()
    latency = int((time.time() - start_time) * 1000)

    # Extract transcript and metadata
    channel = result.get("results", {}).get("channels", [{}])[0]
    alternative = channel.get("alternatives", [{}])[0]

    if not alternative.get("transcript"):
        raise Exception("No transcript returned from Deepgram")

    transcript = alternative["transcript"]
    confidence = alternative.get("confidence", 0.0)
    words = alternative.get("words", [])

    logger.info(f"Deepgram transcription successful: {len(transcript)} chars, {latency}ms")

    # Check latency target
    if latency > 1500:
        logger.warning(f"Deepgram latency exceeded 1.5s target: {latency}ms")

    return {
        "transcript": transcript,
        "confidence": confidence,
        "latency": latency,
        "provider": "deepgram",
        "metadata": {
            "words": words,
            "word_count": len(words),
            "duration": result.get("metadata", {}).get("duration", 0)
        }
    }


async def transcribe_with_deepgram(
    audio_bytes: bytes,
    content_type: str,
    language: str = "en-GB",
    timeout: int = 30
) -> Dict[str, Any]:
    """
    Transcribe audio using Deepgram API with retry logic
    Ultra-low latency streaming transcription

    Args:
        audio_bytes: Audio file bytes
        content_type: MIME type of audio
        language: Language code (default: en-GB)
        timeout: Request timeout in seconds (default: 30)

    Returns:
        dict with transcript, confidence, latency, provider, metadata
    """
    if not config.DEEPGRAM_API_KEY:
        raise Exception("DEEPGRAM_API_KEY not configured")

    try:
        return await retry_with_backoff(
            _transcribe_with_deepgram_internal,
            max_retries=2,  # Only 2 retries for latency-sensitive operations
            initial_delay=0.5,
            audio_bytes=audio_bytes,
            content_type=content_type,
            language=language,
            timeout=timeout
        )
    except Exception as e:
        logger.error(f"Deepgram transcription failed after retries: {str(e)}")
        raise


async def _transcribe_with_whisper_internal(
    audio_bytes: bytes,
    filename: str,
    language: str,
    timeout: int
) -> Dict[str, Any]:
    """Internal Whisper transcription function (for retry logic)"""
    start_time = time.time()

    # Prepare file for upload
    files = {
        "file": (filename, audio_bytes, "audio/webm")
    }

    data = {
        "model": "whisper-1",
        "language": language[:2] if language else "en",  # Whisper uses 2-letter codes
        "response_format": "verbose_json"
    }

    # Make request to OpenAI API
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {config.OPENAI_API_KEY}"},
            files=files,
            data=data
        )

    if response.status_code != 200:
        error_msg = f"Whisper API error: {response.status_code}"
        try:
            error_detail = response.json()
            error_msg += f" - {error_detail.get('error', {}).get('message', response.text[:200])}"
        except:
            error_msg += f" - {response.text[:200]}"
        raise Exception(error_msg)

    result = response.json()
    latency = int((time.time() - start_time) * 1000)

    if not result.get("text"):
        raise Exception("No transcript returned from Whisper")

    transcript = result["text"]
    words = result.get("words", [])

    logger.info(f"Whisper transcription successful: {len(transcript)} chars, {latency}ms")

    return {
        "transcript": transcript,
        "confidence": 0.95,  # Whisper doesn't provide confidence, use high default
        "latency": latency,
        "provider": "whisper",
        "metadata": {
            "words": words,
            "word_count": len(words),
            "duration": result.get("duration", 0),
            "language": result.get("language", language)
        }
    }


async def transcribe_with_whisper(
    audio_bytes: bytes,
    filename: str,
    language: str = "en",
    timeout: int = 60
) -> Dict[str, Any]:
    """
    Transcribe audio using OpenAI Whisper API with retry logic
    Higher accuracy but slower (batch processing)

    Args:
        audio_bytes: Audio file bytes
        filename: Original filename
        language: Language code (default: en)
        timeout: Request timeout in seconds (default: 60)

    Returns:
        dict with transcript, confidence, latency, provider, metadata
    """
    if not config.OPENAI_API_KEY:
        raise Exception("OPENAI_API_KEY not configured")

    try:
        return await retry_with_backoff(
            _transcribe_with_whisper_internal,
            max_retries=3,  # More retries for batch operations
            initial_delay=1.0,
            audio_bytes=audio_bytes,
            filename=filename,
            language=language,
            timeout=timeout
        )
    except Exception as e:
        logger.error(f"Whisper transcription failed after retries: {str(e)}")
        raise


def validate_audio(audio_bytes: bytes, content_type: str) -> Dict[str, Any]:
    """
    Validate audio quality before transcription

    Args:
        audio_bytes: Audio file bytes
        content_type: MIME type

    Returns:
        dict with valid (bool) and errors (list)
    """
    errors = []

    # Check file size (use configured max)
    max_size = config.MAX_AUDIO_SIZE_MB * 1024 * 1024
    if len(audio_bytes) > max_size:
        file_size_mb = len(audio_bytes) / 1024 / 1024
        errors.append(
            f"Audio file too large: {file_size_mb:.2f}MB (max {config.MAX_AUDIO_SIZE_MB}MB)"
        )

    # Check minimum size (at least 0.1s of audio)
    min_size = 1024  # ~0.1s at 16kHz
    if len(audio_bytes) < min_size:
        errors.append("Audio too short. Please speak for at least 1 second.")

    # Check audio format (use configured allowed formats)
    if content_type and content_type not in config.ALLOWED_AUDIO_FORMATS:
        errors.append(
            f"Unsupported audio format: {content_type}. "
            f"Allowed: {', '.join(config.ALLOWED_AUDIO_FORMATS)}"
        )

    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


def calculate_wer(reference: str, hypothesis: str) -> float:
    """
    Calculate Word Error Rate (WER) using Levenshtein distance
    WER = (Substitutions + Deletions + Insertions) / Total Words

    Args:
        reference: Ground truth text
        hypothesis: Transcribed text

    Returns:
        WER percentage (0-100)
    """
    ref_words = reference.lower().split()
    hyp_words = hypothesis.lower().split()

    ref_len = len(ref_words)
    hyp_len = len(hyp_words)

    # Levenshtein distance matrix
    dp = [[0] * (hyp_len + 1) for _ in range(ref_len + 1)]

    # Initialize first row and column
    for i in range(ref_len + 1):
        dp[i][0] = i
    for j in range(hyp_len + 1):
        dp[0][j] = j

    # Fill matrix
    for i in range(1, ref_len + 1):
        for j in range(1, hyp_len + 1):
            if ref_words[i - 1] == hyp_words[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = min(
                    dp[i - 1][j] + 1,      # deletion
                    dp[i][j - 1] + 1,      # insertion
                    dp[i - 1][j - 1] + 1   # substitution
                )

    wer = (dp[ref_len][hyp_len] / ref_len) * 100 if ref_len > 0 else 0
    return round(wer, 2)

"""
Audio Transcription Module
Handles Deepgram and OpenAI Whisper transcription
"""

import os
import time
import logging
from typing import Dict, Any
import httpx
import openai

logger = logging.getLogger(__name__)

# Environment variables
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY


async def transcribe_with_deepgram(
    audio_bytes: bytes,
    content_type: str,
    language: str = "en-GB"
) -> Dict[str, Any]:
    """
    Transcribe audio using Deepgram API
    Ultra-low latency streaming transcription

    Args:
        audio_bytes: Audio file bytes
        content_type: MIME type of audio
        language: Language code (default: en-GB)

    Returns:
        dict with transcript, confidence, latency, provider, metadata
    """
    if not DEEPGRAM_API_KEY:
        raise Exception("DEEPGRAM_API_KEY not configured")

    start_time = time.time()

    try:
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
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": content_type or "audio/webm"
        }

        # Make request
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                params=params,
                headers=headers,
                content=audio_bytes
            )

        if response.status_code != 200:
            raise Exception(f"Deepgram API error: {response.status_code} - {response.text}")

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

    except Exception as e:
        logger.error(f"Deepgram transcription failed: {str(e)}")
        raise


async def transcribe_with_whisper(
    audio_bytes: bytes,
    filename: str,
    language: str = "en"
) -> Dict[str, Any]:
    """
    Transcribe audio using OpenAI Whisper API
    Higher accuracy but slower (batch processing)

    Args:
        audio_bytes: Audio file bytes
        filename: Original filename
        language: Language code (default: en)

    Returns:
        dict with transcript, confidence, latency, provider, metadata
    """
    if not OPENAI_API_KEY:
        raise Exception("OPENAI_API_KEY not configured")

    start_time = time.time()

    try:
        # Prepare file for upload
        files = {
            "file": (filename, audio_bytes, "audio/webm")
        }

        data = {
            "model": "whisper-1",
            "language": language,
            "response_format": "verbose_json"
        }

        # Make request to OpenAI API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                files=files,
                data=data
            )

        if response.status_code != 200:
            raise Exception(f"Whisper API error: {response.status_code} - {response.text}")

        result = response.json()
        latency = int((time.time() - start_time) * 1000)

        if not result.get("text"):
            raise Exception("No transcript returned from Whisper")

        transcript = result["text"]
        words = result.get("words", [])

        logger.info(f"Whisper transcription successful: {len(transcript)} chars, {latency}ms")

        return {
            "transcript": transcript,
            "confidence": 1.0,  # Whisper doesn't provide confidence scores
            "latency": latency,
            "provider": "whisper",
            "metadata": {
                "words": words,
                "word_count": len(words),
                "duration": result.get("duration", 0),
                "language": result.get("language", language)
            }
        }

    except Exception as e:
        logger.error(f"Whisper transcription failed: {str(e)}")
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

    # Check file size (max 25MB for Whisper)
    max_size = 25 * 1024 * 1024  # 25MB
    if len(audio_bytes) > max_size:
        file_size_mb = len(audio_bytes) / 1024 / 1024
        errors.append(f"Audio file too large: {file_size_mb:.2f}MB (max 25MB)")

    # Check minimum size (at least 0.1s of audio)
    min_size = 1024  # ~0.1s at 16kHz
    if len(audio_bytes) < min_size:
        errors.append("Audio too short. Please speak for at least 1 second.")

    # Check audio format
    valid_formats = ["audio/webm", "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/x-wav"]
    if content_type and not any(fmt in content_type for fmt in valid_formats):
        errors.append(f"Unsupported audio format: {content_type}")

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

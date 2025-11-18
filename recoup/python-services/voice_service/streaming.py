"""
Real-time Streaming Transcription
WebSocket-based streaming for Deepgram
"""

import asyncio
import json
import logging
from typing import Optional, Callable
import websockets

logger = logging.getLogger(__name__)


class DeepgramStreamingTranscriber:
    """
    Real-time audio transcription using Deepgram WebSocket API
    """

    def __init__(self, api_key: str, language: str = "en-GB", model: str = "nova-2"):
        self.api_key = api_key
        self.language = language
        self.model = model
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.on_transcript: Optional[Callable] = None
        self.start_time = None

    async def connect(self):
        """Connect to Deepgram WebSocket"""
        if not self.api_key:
            raise Exception("Deepgram API key not configured")

        # WebSocket URL with parameters
        url = (
            f"wss://api.deepgram.com/v1/listen"
            f"?model={self.model}"
            f"&language={self.language}"
            f"&punctuate=true"
            f"&interim_results=true"
            f"&encoding=linear16"
            f"&sample_rate=16000"
        )

        headers = {
            "Authorization": f"Token {self.api_key}"
        }

        try:
            self.websocket = await websockets.connect(
                url,
                extra_headers=headers,
                ping_interval=5,
                ping_timeout=10
            )

            logger.info("Connected to Deepgram WebSocket")
            self.start_time = asyncio.get_event_loop().time()

            # Start receiving messages
            asyncio.create_task(self._receive_messages())

        except Exception as e:
            logger.error(f"Failed to connect to Deepgram: {str(e)}")
            raise

    async def send_audio(self, audio_chunk: bytes):
        """Send audio chunk to Deepgram"""
        if not self.websocket:
            raise Exception("Not connected to Deepgram")

        try:
            await self.websocket.send(audio_chunk)
        except Exception as e:
            logger.error(f"Error sending audio: {str(e)}")
            raise

    async def _receive_messages(self):
        """Receive and process messages from Deepgram"""
        try:
            async for message in self.websocket:
                await self._handle_message(message)
        except websockets.exceptions.ConnectionClosed:
            logger.info("Deepgram WebSocket connection closed")
        except Exception as e:
            logger.error(f"Error receiving messages: {str(e)}")

    async def _handle_message(self, message: str):
        """Process incoming message from Deepgram"""
        try:
            data = json.loads(message)

            # Check message type
            if data.get("type") == "Metadata":
                logger.debug(f"Received metadata: {data}")
                return

            # Handle transcription result
            channel = data.get("channel", {})
            alternatives = channel.get("alternatives", [])

            if not alternatives:
                return

            alternative = alternatives[0]
            transcript = alternative.get("transcript", "")

            if not transcript:
                return

            is_final = data.get("is_final", False)
            confidence = alternative.get("confidence", 0.0)

            # Calculate latency
            latency = 0
            if self.start_time:
                latency = int((asyncio.get_event_loop().time() - self.start_time) * 1000)

            # Prepare response
            response = {
                "transcript": transcript,
                "is_final": is_final,
                "confidence": confidence,
                "latency": latency,
                "metadata": {
                    "words": alternative.get("words", []),
                }
            }

            # Call callback if set
            if self.on_transcript:
                await self.on_transcript(response)

            # Log final transcripts
            if is_final:
                logger.info(f"Final transcript: {transcript} (confidence: {confidence:.2f})")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse message: {str(e)}")
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")

    async def disconnect(self):
        """Close WebSocket connection"""
        if self.websocket:
            try:
                await self.websocket.close()
                logger.info("Disconnected from Deepgram WebSocket")
            except Exception as e:
                logger.error(f"Error disconnecting: {str(e)}")
            finally:
                self.websocket = None

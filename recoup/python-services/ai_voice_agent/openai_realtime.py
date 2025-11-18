"""
OpenAI Realtime API Integration
Handles bidirectional audio streaming for AI conversations
"""

import asyncio
import json
import logging
from typing import Optional, Callable
import websockets
import os

logger = logging.getLogger(__name__)


class OpenAIRealtimeAgent:
    """
    OpenAI Realtime API agent for natural voice conversations
    """

    def __init__(
        self,
        api_key: str,
        system_prompt: str,
        model: str = "gpt-4o-realtime-preview"
    ):
        self.api_key = api_key
        self.model = model
        self.system_prompt = system_prompt
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.on_audio_response: Optional[Callable] = None
        self.on_transcript: Optional[Callable] = None

    async def connect(self):
        """Connect to OpenAI Realtime API via WebSocket"""
        if not self.api_key:
            raise Exception("OpenAI API key not configured")

        url = "wss://api.openai.com/v1/realtime"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "OpenAI-Beta": "realtime=v1"
        }

        try:
            self.websocket = await websockets.connect(
                url,
                extra_headers=headers,
                ping_interval=5,
                ping_timeout=10
            )

            logger.info("Connected to OpenAI Realtime API")

            # Configure session
            await self._configure_session()

            # Start receiving messages
            asyncio.create_task(self._receive_messages())

        except Exception as e:
            logger.error(f"Failed to connect to OpenAI: {str(e)}")
            raise

    async def _configure_session(self):
        """Configure the Realtime session"""
        config = {
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": self.system_prompt,
                "voice": "alloy",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1"
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 500
                }
            }
        }

        await self.websocket.send(json.dumps(config))
        logger.info("Session configured")

    async def send_audio(self, audio_chunk: bytes):
        """
        Send audio chunk to OpenAI

        Args:
            audio_chunk: Audio data in PCM16 format
        """
        if not self.websocket:
            raise Exception("Not connected to OpenAI")

        message = {
            "type": "input_audio_buffer.append",
            "audio": audio_chunk.hex()  # Send as hex string
        }

        await self.websocket.send(json.dumps(message))

    async def commit_audio(self):
        """Commit audio buffer (finish user's turn)"""
        if not self.websocket:
            return

        message = {
            "type": "input_audio_buffer.commit"
        }

        await self.websocket.send(json.dumps(message))

    async def _receive_messages(self):
        """Receive and process messages from OpenAI"""
        try:
            async for message in self.websocket:
                await self._handle_message(message)
        except websockets.exceptions.ConnectionClosed:
            logger.info("OpenAI WebSocket connection closed")
        except Exception as e:
            logger.error(f"Error receiving messages: {str(e)}")

    async def _handle_message(self, message: str):
        """Process incoming message from OpenAI"""
        try:
            data = json.loads(message)
            msg_type = data.get("type")

            # Handle different message types
            if msg_type == "response.audio.delta":
                # Audio response chunk
                audio_data = bytes.fromhex(data.get("delta", ""))
                if self.on_audio_response and audio_data:
                    await self.on_audio_response(audio_data)

            elif msg_type == "response.audio_transcript.delta":
                # Transcript of AI response
                transcript = data.get("delta", "")
                if self.on_transcript and transcript:
                    await self.on_transcript({
                        "speaker": "ai",
                        "text": transcript
                    })

            elif msg_type == "conversation.item.input_audio_transcription.completed":
                # Transcript of user input
                transcript = data.get("transcript", "")
                if self.on_transcript and transcript:
                    await self.on_transcript({
                        "speaker": "user",
                        "text": transcript
                    })

            elif msg_type == "error":
                error_msg = data.get("error", {}).get("message", "Unknown error")
                logger.error(f"OpenAI error: {error_msg}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse message: {str(e)}")
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")

    async def disconnect(self):
        """Close WebSocket connection"""
        if self.websocket:
            try:
                await self.websocket.close()
                logger.info("Disconnected from OpenAI")
            except Exception as e:
                logger.error(f"Error disconnecting: {str(e)}")
            finally:
                self.websocket = None


def create_collections_prompt(
    recipient_name: str,
    business_name: str,
    invoice_reference: str,
    amount: float,
    due_date: str,
    days_past_due: int
) -> str:
    """
    Create system prompt for collections AI agent

    Args:
        recipient_name: Client name
        business_name: Freelancer business name
        invoice_reference: Invoice reference number
        amount: Invoice amount
        due_date: Original due date
        days_past_due: Days overdue

    Returns:
        System prompt string
    """
    return f"""You are a professional debt collection assistant calling on behalf of {business_name}.

**IMPORTANT GUIDELINES:**
1. Be polite, professional, and empathetic at all times
2. Comply with UK FCA regulations - no harassment or pressure tactics
3. Clearly state you are calling about an overdue payment
4. Record explicit consent before continuing the call
5. Offer payment options and be flexible
6. If they dispute the debt, stop collection attempts and escalate

**CALL STRUCTURE:**
1. Introduction: "Hello, is this {recipient_name}? This is a call from {business_name} regarding invoice {invoice_reference}."
2. Consent: "This call may be recorded for quality and training purposes. Do you consent to continue?"
3. If yes, proceed. If no, end call politely.
4. State the debt: "We're calling about an outstanding payment of £{amount:.2f} for invoice {invoice_reference}, which was due on {due_date}. It is now {days_past_due} days overdue."
5. Listen to their response and be empathetic
6. Offer payment options:
   - Pay now by card (you can send SMS link)
   - Set up payment plan
   - Discuss if financial difficulty
7. If they agree to pay: "Great! I'll send you a secure payment link via SMS right now."
8. If they need time: "I understand. When can you make the payment? Can I call back on [date]?"
9. If they dispute: "I understand you have concerns. Let me note this and have our team review it. Please contact {business_name} directly to resolve this."
10. Thank them and end call professionally

**DO NOT:**
- Use aggressive or threatening language
- Call before 8am or after 9pm
- Call on Sundays
- Ignore requests to stop calling
- Discuss the debt with third parties
- Make false statements

**TONE:** Professional, empathetic, solution-focused

**GOAL:** Secure payment or payment plan while maintaining positive relationship."""

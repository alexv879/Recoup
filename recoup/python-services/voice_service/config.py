"""
Configuration Management for Voice Service
Validates and manages environment variables
"""

import os
import logging
from typing import Optional
from functools import lru_cache

logger = logging.getLogger(__name__)


class Config:
    """Application configuration with validation"""

    def __init__(self):
        self.PORT = int(os.getenv("PORT", 8001))
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
        self.ENV = os.getenv("ENV", "development")

        # API Keys
        self.DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

        # Rate Limiting
        self.RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", 10))
        self.RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", 60))  # seconds

        # Audio Processing
        self.MAX_AUDIO_SIZE_MB = int(os.getenv("MAX_AUDIO_SIZE_MB", 25))
        self.ALLOWED_AUDIO_FORMATS = os.getenv(
            "ALLOWED_AUDIO_FORMATS",
            "audio/webm,audio/wav,audio/mp3,audio/mpeg,audio/ogg,audio/x-wav"
        ).split(",")

        # Timeouts
        self.DEEPGRAM_TIMEOUT = int(os.getenv("DEEPGRAM_TIMEOUT", 30))
        self.OPENAI_TIMEOUT = int(os.getenv("OPENAI_TIMEOUT", 60))

        # CORS
        self.CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

        # Validate required settings
        self.validate()

    def validate(self):
        """Validate required configuration"""
        errors = []

        if not self.DEEPGRAM_API_KEY and not self.OPENAI_API_KEY:
            errors.append("Either DEEPGRAM_API_KEY or OPENAI_API_KEY must be set")

        if self.ENV == "production":
            if not self.DEEPGRAM_API_KEY:
                logger.warning("DEEPGRAM_API_KEY not set - using OpenAI Whisper only")
            if not self.OPENAI_API_KEY:
                logger.warning("OPENAI_API_KEY not set - using Deepgram only")

        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")

        logger.info(f"Configuration validated for {self.ENV} environment")

    @property
    def is_production(self) -> bool:
        return self.ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.ENV == "development"


@lru_cache()
def get_config() -> Config:
    """Get cached configuration instance"""
    return Config()

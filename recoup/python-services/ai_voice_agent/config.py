"""
Configuration Management for AI Voice Agent
Validates and manages environment variables for Twilio and OpenAI
"""

import os
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


class Config:
    """Application configuration with validation"""

    def __init__(self):
        self.PORT = int(os.getenv("PORT", 8003))
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
        self.ENV = os.getenv("ENV", "development")

        # Twilio Configuration
        self.TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
        self.TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
        self.TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

        # OpenAI Configuration
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

        # Base URL for webhooks
        self.BASE_URL = os.getenv("BASE_URL", "http://localhost:8003")

        # Call Settings
        self.MIN_INVOICE_AMOUNT = float(os.getenv("MIN_INVOICE_AMOUNT", 50.0))  # £50 minimum
        self.CALL_COOLDOWN_HOURS = int(os.getenv("CALL_COOLDOWN_HOURS", 24))
        self.MAX_CALL_DURATION_MINUTES = int(os.getenv("MAX_CALL_DURATION_MINUTES", 10))

        # FCA Compliance Settings
        self.ALLOWED_CALL_HOURS_START = int(os.getenv("ALLOWED_CALL_HOURS_START", 8))  # 8am
        self.ALLOWED_CALL_HOURS_END = int(os.getenv("ALLOWED_CALL_HOURS_END", 21))  # 9pm
        self.ALLOWED_CALL_DAYS = os.getenv("ALLOWED_CALL_DAYS", "1,2,3,4,5,6").split(",")  # Mon-Sat
        self.RECORD_CALLS = os.getenv("RECORD_CALLS", "true").lower() == "true"  # FCA requirement

        # Rate Limiting
        self.RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", 5))  # 5 calls per hour
        self.RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", 3600))  # 1 hour in seconds

        # CORS
        self.CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

        # Timeouts
        self.TWILIO_TIMEOUT = int(os.getenv("TWILIO_TIMEOUT", 30))
        self.OPENAI_TIMEOUT = int(os.getenv("OPENAI_TIMEOUT", 30))

        # Validate required settings
        self.validate()

    def validate(self):
        """Validate required configuration"""
        errors = []

        # Check required Twilio credentials
        if not self.TWILIO_ACCOUNT_SID:
            errors.append("TWILIO_ACCOUNT_SID is required")
        if not self.TWILIO_AUTH_TOKEN:
            errors.append("TWILIO_AUTH_TOKEN is required")
        if not self.TWILIO_PHONE_NUMBER:
            errors.append("TWILIO_PHONE_NUMBER is required")

        # Check required OpenAI credentials
        if not self.OPENAI_API_KEY:
            errors.append("OPENAI_API_KEY is required")

        # Validate call settings
        if self.MIN_INVOICE_AMOUNT < 0:
            errors.append("MIN_INVOICE_AMOUNT must be positive")

        if self.CALL_COOLDOWN_HOURS < 1:
            errors.append("CALL_COOLDOWN_HOURS must be at least 1")

        # Validate FCA compliance settings
        if self.ALLOWED_CALL_HOURS_START < 0 or self.ALLOWED_CALL_HOURS_START > 23:
            errors.append("ALLOWED_CALL_HOURS_START must be between 0 and 23")

        if self.ALLOWED_CALL_HOURS_END < 0 or self.ALLOWED_CALL_HOURS_END > 23:
            errors.append("ALLOWED_CALL_HOURS_END must be between 0 and 23")

        if self.ALLOWED_CALL_HOURS_START >= self.ALLOWED_CALL_HOURS_END:
            errors.append("ALLOWED_CALL_HOURS_START must be before ALLOWED_CALL_HOURS_END")

        # Production-specific validation
        if self.ENV == "production":
            if not self.BASE_URL.startswith("https://"):
                logger.warning("BASE_URL should use HTTPS in production")

            if not self.RECORD_CALLS:
                logger.warning("Call recording is disabled - may not be FCA compliant")

        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")

        logger.info(f"Configuration validated for {self.ENV} environment")
        logger.info(f"Twilio phone: {self.TWILIO_PHONE_NUMBER}")
        logger.info(f"Call hours: {self.ALLOWED_CALL_HOURS_START}:00-{self.ALLOWED_CALL_HOURS_END}:00")
        logger.info(f"Recording calls: {self.RECORD_CALLS}")

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

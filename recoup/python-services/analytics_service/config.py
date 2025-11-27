"""
Configuration Management for Analytics Service
Validates and manages environment variables
"""

import os
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


class Config:
    """Application configuration with validation"""

    def __init__(self):
        self.PORT = int(os.getenv("PORT", 8002))
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
        self.ENV = os.getenv("ENV", "development")

        # Rate Limiting
        self.RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", 10))
        self.RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", 60))  # seconds

        # CORS
        self.CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

        # ML/Analytics Settings
        self.MIN_DATA_POINTS = int(os.getenv("MIN_DATA_POINTS", 3))  # Minimum invoices for predictions
        self.FORECAST_CONFIDENCE_THRESHOLD = float(os.getenv("FORECAST_CONFIDENCE_THRESHOLD", 0.7))
        self.CACHE_PREDICTIONS_TTL = int(os.getenv("CACHE_PREDICTIONS_TTL", 300))  # 5 minutes

        # Timeouts
        self.PREDICTION_TIMEOUT = int(os.getenv("PREDICTION_TIMEOUT", 30))  # seconds

        # Validate required settings
        self.validate()

    def validate(self):
        """Validate required configuration"""
        errors = []

        if self.MIN_DATA_POINTS < 1:
            errors.append("MIN_DATA_POINTS must be at least 1")

        if self.FORECAST_CONFIDENCE_THRESHOLD < 0 or self.FORECAST_CONFIDENCE_THRESHOLD > 1:
            errors.append("FORECAST_CONFIDENCE_THRESHOLD must be between 0 and 1")

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

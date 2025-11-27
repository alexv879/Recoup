"""
Configuration Management for Decision Engine
Validates and manages environment variables for escalation decisions
"""

import os
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


class Config:
    """Application configuration with validation"""

    def __init__(self):
        self.PORT = int(os.getenv("PORT", 8004))
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
        self.ENV = os.getenv("ENV", "development")

        # Decision Thresholds
        self.MIN_CLAIM_AMOUNT = float(os.getenv("MIN_CLAIM_AMOUNT", 100.0))  # £100 minimum
        self.COURT_THRESHOLD = float(os.getenv("COURT_THRESHOLD", 500.0))  # £500+ consider court
        self.AGENCY_MIN_AMOUNT = float(os.getenv("AGENCY_MIN_AMOUNT", 200.0))  # £200+ for agency
        self.WRITEOFF_THRESHOLD = float(os.getenv("WRITEOFF_THRESHOLD", 50.0))  # <£50 consider write-off

        # Success Rate Estimates (percentages)
        self.COURT_SUCCESS_RATE_BASE = float(os.getenv("COURT_SUCCESS_RATE_BASE", 70.0))
        self.AGENCY_SUCCESS_RATE_BASE = float(os.getenv("AGENCY_SUCCESS_RATE_BASE", 60.0))

        # Cost Settings (UK)
        self.AGENCY_COMMISSION_RATE = float(os.getenv("AGENCY_COMMISSION_RATE", 15.0))  # 15% commission
        self.SOLICITOR_FEE_FIXED = float(os.getenv("SOLICITOR_FEE_FIXED", 100.0))  # £100 fixed fee

        # Timeouts
        self.DECISION_TIMEOUT = int(os.getenv("DECISION_TIMEOUT", 10))  # seconds

        # Rate Limiting
        self.RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", 20))
        self.RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", 60))  # seconds

        # CORS
        self.CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

        # Validate required settings
        self.validate()

    def validate(self):
        """Validate required configuration"""
        errors = []

        # Validate thresholds
        if self.MIN_CLAIM_AMOUNT < 0:
            errors.append("MIN_CLAIM_AMOUNT must be positive")

        if self.COURT_THRESHOLD < self.MIN_CLAIM_AMOUNT:
            errors.append("COURT_THRESHOLD must be >= MIN_CLAIM_AMOUNT")

        if self.AGENCY_MIN_AMOUNT < self.MIN_CLAIM_AMOUNT:
            errors.append("AGENCY_MIN_AMOUNT must be >= MIN_CLAIM_AMOUNT")

        # Validate success rates
        if self.COURT_SUCCESS_RATE_BASE < 0 or self.COURT_SUCCESS_RATE_BASE > 100:
            errors.append("COURT_SUCCESS_RATE_BASE must be between 0 and 100")

        if self.AGENCY_SUCCESS_RATE_BASE < 0 or self.AGENCY_SUCCESS_RATE_BASE > 100:
            errors.append("AGENCY_SUCCESS_RATE_BASE must be between 0 and 100")

        # Validate commission rate
        if self.AGENCY_COMMISSION_RATE < 0 or self.AGENCY_COMMISSION_RATE > 100:
            errors.append("AGENCY_COMMISSION_RATE must be between 0 and 100")

        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")

        logger.info(f"Configuration validated for {self.ENV} environment")
        logger.info(f"Court threshold: £{self.COURT_THRESHOLD}")
        logger.info(f"Agency commission: {self.AGENCY_COMMISSION_RATE}%")

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

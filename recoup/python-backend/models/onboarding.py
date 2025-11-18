"""
Onboarding Progress Model
Converted from relay/types/models.ts
"""

from datetime import datetime
from typing import Optional, Dict, List, Literal
from pydantic import BaseModel


class OnboardingProgress(BaseModel):
    """Onboarding progress model"""
    # Identifiers
    user_id: str  # document ID

    # Steps
    completed_steps: List[str] = []
    current_step: str
    completed_at: Optional[datetime] = None

    # Timing
    steps_started_at: Dict[str, datetime] = {}
    steps_completed_at: Dict[str, datetime] = {}

    # Status
    status: Literal['in_progress', 'completed', 'abandoned'] = 'in_progress'

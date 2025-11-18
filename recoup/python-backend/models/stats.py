"""
User Stats and Behavior Profile Models
Converted from relay/types/models.ts
"""

from datetime import datetime
from typing import Optional, List, Dict, Literal
from pydantic import BaseModel


class Achievement(BaseModel):
    """User achievement"""
    badge: str
    earned_at: datetime
    progress: int = 0  # 0-100 for in-progress


class InvoicingPattern(BaseModel):
    """User invoicing patterns"""
    average_per_week: float
    average_per_month: float
    days_of_week_preferred: List[str]
    time_of_day_preferred: str
    average_amount: float
    last_invoice_date: datetime
    invoicing_gaps: List[int]


class PaymentPattern(BaseModel):
    """User payment patterns"""
    average_days_to_payment: float
    best_paying_clients: List[str]
    worst_paying_clients: List[str]
    seasonality: Dict[str, float]
    payment_reliability: float


class EngagementPattern(BaseModel):
    """User engagement patterns"""
    average_open_per_week: float
    last_open_date: datetime
    days_of_week_most_active: List[str]
    feature_usage: Dict[str, int]


class CurrentContext(BaseModel):
    """User current context"""
    days_without_invoice: int
    invoice_debt_status: str
    recent_successes: int
    churn_risk_score: float


class UserBehaviorProfile(BaseModel):
    """User behavior profile for behavioral triggers"""
    # Identifiers
    user_id: str  # document ID

    # Patterns
    invoicing: InvoicingPattern
    payments: PaymentPattern
    engagement: EngagementPattern
    current_context: CurrentContext

    # Timestamps
    last_updated: datetime


class UserStats(BaseModel):
    """User statistics and gamification"""
    # Identifiers
    user_id: str  # document ID

    # Financial Metrics
    total_invoiced: float = 0  # Total amount invoiced (aka totalRevenue)
    total_collected: float = 0  # Total amount collected (aka totalPaid)
    total_invoices: int = 0  # Count of invoices created
    average_payment_days: float = 0
    on_time_percentage: float = 0

    # Gamification
    streak: int = 0  # Days without overdue (aka currentStreak)
    badges: List[str] = []
    level: int = 1
    rank: int = 0
    gamification_xp: int = 0  # Experience points for level calculation
    gamification_level: int = 1  # Cached level (same as level, for backward compat)
    current_streak: int = 0  # Alias for streak
    longest_streak: int = 0  # Longest payment streak achieved
    last_streak_date: Optional[datetime] = None  # Last date streak was updated

    # Achievements
    achievements: List[Achievement] = []

    # Engagement
    days_active_past_month: int = 0
    sessions_this_month: int = 0
    avg_session_duration: float = 0

    # Calculated Metrics
    churn_risk_score: float = 0  # 0-100
    engagement_level: Literal['high', 'medium', 'low'] = 'medium'

    # Timestamps
    calculated_at: datetime

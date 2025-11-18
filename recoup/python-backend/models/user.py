"""
User Model
Converted from relay/types/models.ts
"""

from datetime import datetime
from typing import Optional, Literal, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field


class BankDetails(BaseModel):
    """Banking information (encrypted)"""
    account_holder_name: str
    account_number: str  # encrypted
    sort_code: str  # encrypted
    bank_name: str


class BusinessAddress(BaseModel):
    """Business address for physical letters"""
    company_name: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    postcode: str
    country: str = "United Kingdom"


class NotificationPreferences(BaseModel):
    """User notification preferences"""
    email_notifications: bool = True
    in_app_notifications: bool = True
    quiet_hours_start: str = "21:00"
    quiet_hours_end: str = "08:00"
    notification_types: List[str] = Field(default_factory=list)
    on_vacation: bool = False
    vacation_until: Optional[datetime] = None
    invoice_drought_reminder: Optional[bool] = True
    payment_delay_alert: Optional[bool] = True
    opportunity_alert: Optional[bool] = True


class CollectionsConsent(BaseModel):
    """GDPR/UK Communications Law consent"""
    sms_consent: bool = False
    call_consent: bool = False
    call_recording_consent: bool = False
    physical_mail_consent: bool = False
    data_storage_consent: bool = False
    consent_date: Optional[datetime] = None
    consent_version: Optional[str] = None
    ip_address: Optional[str] = None

    # Opt-out tracking (PECR compliance)
    sms_opted_out: Optional[bool] = False
    sms_opt_out_date: Optional[datetime] = None
    call_opted_out: Optional[bool] = False
    call_opt_out_date: Optional[datetime] = None
    physical_mail_opted_out: Optional[bool] = False
    physical_mail_opt_out_date: Optional[datetime] = None


class CustomSchedule(BaseModel):
    """Custom escalation schedule"""
    gentle: Optional[int] = None  # Override day 5 default
    firm: Optional[int] = None  # Override day 15 default
    final: Optional[int] = None  # Override day 30 default
    agency: Optional[int] = None  # Override day 60 default


class CollectionsAutomation(BaseModel):
    """Collections automation settings"""
    enabled: bool = True
    custom_schedule: Optional[CustomSchedule] = None


class User(BaseModel):
    """User/Freelancer model"""
    # Authentication
    user_id: str  # Clerk user ID (document ID)
    email: EmailStr
    name: str
    phone_number: Optional[str] = None  # E.164 format: +44xxxxxxxxxx

    # Business
    business_name: Optional[str] = None
    business_type: Literal['freelancer', 'agency', 'consultant'] = 'freelancer'

    # Subscription (PRICING V3)
    subscription_tier: Literal['free', 'paid', 'starter', 'growth', 'pro', 'business'] = 'free'
    subscription_start_date: Optional[datetime] = None
    collections_enabled: bool = False
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    clerk_subscription_id: Optional[str] = None
    pricing_model: Optional[Literal['commission', 'subscription', 'hybrid']] = None

    # Pricing V3 Billing
    billing_cycle: Optional[Literal['monthly', 'annual']] = 'monthly'
    annual_discount_applied: Optional[bool] = False
    next_billing_date: Optional[datetime] = None
    subscription_status: Optional[Literal['active', 'trialing', 'past_due', 'canceled', 'paused']] = 'active'

    # Founding Member Tracking
    is_founding_member: Optional[bool] = False
    founding_member_number: Optional[int] = None  # 1-50
    founding_member_joined_at: Optional[datetime] = None
    locked_in_price: Optional[float] = None  # £12/£22/£75 for life

    # Banking (Encrypted)
    bank_details: Optional[BankDetails] = None

    # Business Address
    business_address: Optional[BusinessAddress] = None

    # Collections Demo Tracking
    collections_demo_used_this_month: int = 0
    last_demo_reset_date: Optional[datetime] = None

    # Usage Tracking for Paid Tiers
    collections_used_this_month: Optional[int] = 0
    monthly_usage_reset_date: Optional[datetime] = None
    collections_limit_per_month: Optional[int] = None

    # Referral Tracking
    referral_code: str
    referred_by: Optional[str] = None
    referral_credits_earned: Optional[float] = 0
    referral_credits_spent: Optional[float] = 0
    referral_credits_balance: Optional[float] = 0

    # Profile
    profile_picture: Optional[str] = None
    timezone: str = "Europe/London"
    language: Literal['en', 'es', 'fr'] = 'en'

    # Preferences
    notifications: NotificationPreferences = Field(default_factory=NotificationPreferences)
    notification_preferences: Optional[Dict[str, Any]] = None  # Backward compatibility

    # Premium Collections Consent
    collections_consent: Optional[CollectionsConsent] = None

    # Collections Automation Settings
    collections_automation: Optional[CollectionsAutomation] = None

    # Status
    is_active: bool = True
    status: Literal['active', 'suspended', 'deleted'] = 'active'

    # Timestamps
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_2abc123",
                "email": "freelancer@example.com",
                "name": "John Doe",
                "business_type": "freelancer",
                "subscription_tier": "starter",
                "referral_code": "JOHN123",
                "timezone": "Europe/London",
                "language": "en",
                "is_active": True,
                "status": "active",
            }
        }

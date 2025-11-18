"""
Pricing Utilities & Calculations
Converted from relay/lib/pricing.ts

Pricing V3 Structure:
- Starter: £19/month or £182/year (10 collections)
- Growth: £39/month or £374/year (50 collections)
- Pro: £75/month or £720/year (unlimited)

Annual discount: 20% (equivalent to 2.4 months free)
"""

from typing import Optional, Literal, Dict
from dataclasses import dataclass

PricingTier = Literal['starter', 'growth', 'pro']
LegacyTier = Literal['free', 'paid', 'business']
AllTiers = Literal['starter', 'growth', 'pro', 'free', 'paid', 'business']


@dataclass
class TierPricing:
    """Pricing tier information"""
    monthly: float
    annual: float
    annual_savings: float
    collections_limit: Optional[int]  # None = unlimited
    team_members: Optional[int]  # None = unlimited
    features: list[str]


PRICING_TIERS: Dict[str, TierPricing] = {
    'starter': TierPricing(
        monthly=19,
        annual=182,  # £19 × 12 × 0.8 = £182.40 (rounded down)
        annual_savings=46,  # £228 - £182 = £46
        collections_limit=10,
        team_members=1,
        features=[
            'Email reminders',
            'Manual collection tracking',
            'Invoice management',
            'Payment claims',
            'Email support (48h response)',
        ],
    ),
    'growth': TierPricing(
        monthly=39,
        annual=374,  # £39 × 12 × 0.8 = £374.40 (rounded down)
        annual_savings=94,  # £468 - £374 = £94
        collections_limit=50,
        team_members=5,
        features=[
            'Smart reminders (Email + SMS + WhatsApp)',
            'Payment verification system',
            'Collections escalation automation',
            'Basic AI analytics',
            'Behavioral email sequences',
            'Email support (24h response)',
        ],
    ),
    'pro': TierPricing(
        monthly=75,
        annual=720,  # £75 × 12 × 0.8 = £720
        annual_savings=180,  # £900 - £720 = £180
        collections_limit=None,  # Unlimited
        team_members=None,  # Unlimited
        features=[
            'All channels (Email/SMS/WhatsApp/Phone)',
            'AI-powered recovery strategies',
            'Advanced analytics & insights',
            'Custom escalation workflows',
            'API access & integrations',
            'Dedicated account manager',
            'Priority support (2h response)',
        ],
    ),
}


def get_tier_price(tier: PricingTier, is_annual: bool = False) -> float:
    """
    Get price for a tier

    Args:
        tier: Tier name
        is_annual: Whether annual billing

    Returns:
        Price in GBP
    """
    pricing = PRICING_TIERS[tier]
    return pricing.annual if is_annual else pricing.monthly


def get_tier_collections_limit(tier: PricingTier) -> Optional[int]:
    """
    Get collections limit for a tier

    Args:
        tier: Tier name

    Returns:
        Collections per month (None = unlimited)
    """
    return PRICING_TIERS[tier].collections_limit


def get_tier_team_members_limit(tier: PricingTier) -> Optional[int]:
    """
    Get team members limit for a tier

    Args:
        tier: Tier name

    Returns:
        Team members allowed (None = unlimited)
    """
    return PRICING_TIERS[tier].team_members


def get_annual_savings(tier: PricingTier) -> float:
    """
    Calculate annual savings

    Args:
        tier: Tier name

    Returns:
        Savings in GBP when paying annually
    """
    return PRICING_TIERS[tier].annual_savings


def get_monthly_equivalent_price(tier: PricingTier) -> float:
    """
    Calculate monthly equivalent price for annual plans

    Args:
        tier: Tier name

    Returns:
        Monthly equivalent price (annual / 12)
    """
    return round(PRICING_TIERS[tier].annual / 12)


def map_legacy_tier_to_v3(legacy_tier: LegacyTier) -> PricingTier:
    """
    Map legacy tier to Pricing V3 tier

    Migration mapping:
    - free → starter (with trial)
    - paid → growth (legacy catch-all)
    - business → pro (upgrade path)

    Args:
        legacy_tier: Old subscription tier

    Returns:
        Equivalent V3 tier
    """
    mapping: Dict[LegacyTier, PricingTier] = {
        'free': 'starter',
        'paid': 'growth',
        'business': 'pro',
    }

    return mapping[legacy_tier]


def has_exceeded_collections_limit(tier: PricingTier, collections_used: int) -> bool:
    """
    Check if user has exceeded their collections limit

    Args:
        tier: User's subscription tier
        collections_used: Collections used this month

    Returns:
        True if limit exceeded
    """
    limit = get_tier_collections_limit(tier)

    # Unlimited tiers never exceed
    if limit is None:
        return False

    return collections_used >= limit


def calculate_overage_cost(tier: PricingTier, collections_used: int) -> float:
    """
    Calculate overage cost for additional collections

    Based on pricing framework (£1-2 per collection)

    Args:
        tier: User's subscription tier
        collections_used: Collections used this month

    Returns:
        Overage cost in GBP
    """
    limit = get_tier_collections_limit(tier)

    # No overage for unlimited tiers
    if limit is None:
        return 0

    # No overage if under limit
    if collections_used <= limit:
        return 0

    overage = collections_used - limit

    # Tiered overage pricing
    if tier == 'starter':
        return overage * 2  # £2 per collection for Starter
    elif tier == 'growth':
        return overage * 1.5  # £1.50 per collection for Growth

    return 0  # Pro has unlimited, no overage


def get_recommended_upgrade(
    current_tier: PricingTier,
    collections_used: int
) -> Optional[PricingTier]:
    """
    Get recommended upgrade tier

    Suggests upgrade if user is consistently hitting limits

    Args:
        current_tier: User's current tier
        collections_used: Collections used this month

    Returns:
        Recommended tier or None if no upgrade needed
    """
    limit = get_tier_collections_limit(current_tier)

    # No upgrade needed for Pro tier
    if current_tier == 'pro':
        return None

    # If no limit, no upgrade needed
    if limit is None:
        return None

    # Recommend upgrade if using >80% of limit
    usage_percentage = (collections_used / limit) * 100

    if usage_percentage >= 80:
        if current_tier == 'starter':
            return 'growth'
        if current_tier == 'growth':
            return 'pro'

    return None


def calculate_ltv(tier: PricingTier, is_annual: bool = False) -> float:
    """
    Calculate LTV (Lifetime Value) for a tier

    Assumptions:
    - Average retention: 12 months (industry standard for SMB SaaS)
    - Churn rate: ~8.3% per month (1/12)

    Args:
        tier: Subscription tier
        is_annual: Whether annual billing

    Returns:
        Estimated LTV in GBP
    """
    monthly_price = get_tier_price(tier, False)
    average_retention_months = 12

    if is_annual:
        # Annual customers typically have 1.5x longer retention
        return get_tier_price(tier, True) * 1.5

    return monthly_price * average_retention_months


def format_price(price: float, show_pence: bool = False) -> str:
    """
    Format price for display

    Args:
        price: Price in GBP
        show_pence: Whether to show .00 decimals

    Returns:
        Formatted price string (e.g., "£39" or "£39.00")
    """
    if show_pence or price % 1 != 0:
        return f"£{price:.2f}"
    return f"£{int(price)}"


def get_annual_discount_percentage(tier: PricingTier) -> int:
    """
    Calculate discount percentage for annual plans

    Args:
        tier: Tier name

    Returns:
        Discount percentage (e.g., 20 for 20%)
    """
    monthly = get_tier_price(tier, False)
    annual = get_tier_price(tier, True)

    full_year_cost = monthly * 12
    savings = full_year_cost - annual

    return round((savings / full_year_cost) * 100)

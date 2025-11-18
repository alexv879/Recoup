"""
Escalation Decision Engine
Multi-factor algorithm for debt recovery escalation decisions
"""

from dataclasses import dataclass
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class EscalationParams:
    """Parameters for escalation decision"""
    invoice_amount: float
    days_overdue: int
    is_disputed_debt: bool = False
    debtor_type: str = "unknown"
    previous_attempts: int = 0
    relationship_value: str = "medium"
    has_written_contract: bool = False
    has_proof_of_delivery: bool = False
    debtor_has_assets: Optional[bool] = None


def calculate_court_fee(claim_amount: float) -> float:
    """
    UK County Court fees (Money Claim Online)
    Updated: November 2024

    Args:
        claim_amount: Amount being claimed

    Returns:
        Court fee in GBP
    """
    if claim_amount <= 300:
        return 35
    elif claim_amount <= 500:
        return 50
    elif claim_amount <= 1000:
        return 70
    elif claim_amount <= 1500:
        return 80
    elif claim_amount <= 3000:
        return 115
    elif claim_amount <= 5000:
        return 205
    elif claim_amount <= 10000:
        return 455
    else:
        # Above £10,000: 5% of claim (max £10,000 fee)
        fee = claim_amount * 0.05
        return min(fee, 10000)


def calculate_agency_commission(amount: float) -> Dict[str, Any]:
    """
    Calculate debt collection agency commission

    Args:
        amount: Debt amount

    Returns:
        dict with min, max, and percentage
    """
    min_rate = 0.15  # 15%
    max_rate = 0.25  # 25%

    return {
        "min": round(amount * min_rate, 2),
        "max": round(amount * max_rate, 2),
        "percentage": "15-25%"
    }


def generate_escalation_recommendation(params: EscalationParams) -> Dict[str, Any]:
    """
    Generate escalation recommendation using multi-factor scoring

    Factors:
    1. Invoice amount
    2. Days overdue
    3. Debt clarity (disputed vs clear)
    4. Debtor type
    5. Previous collection attempts
    6. Relationship value
    7. Evidence strength
    8. Debtor asset status

    Returns:
        dict with recommendation, reasoning, costs, and next steps
    """
    scores = {
        "court": 0,
        "agency": 0,
        "write_off": 0,
        "continue_internal": 0
    }

    reasoning = []
    warnings = []
    next_steps = []

    # Calculate costs
    court_fee = calculate_court_fee(params.invoice_amount)
    agency_commission = calculate_agency_commission(params.invoice_amount)

    net_recovery_court = params.invoice_amount - court_fee
    net_recovery_agency_min = params.invoice_amount - agency_commission["max"]
    net_recovery_agency_max = params.invoice_amount - agency_commission["min"]

    # =================================================================
    # FACTOR 1: Invoice Amount
    # =================================================================
    if params.invoice_amount < 500:
        scores["write_off"] += 30
        scores["continue_internal"] += 20
        reasoning.append(f"Low invoice amount (£{params.invoice_amount:.2f}) - recovery costs may exceed debt")
        warnings.append(f"Court fee (£{court_fee}) is {(court_fee/params.invoice_amount*100):.0f}% of invoice value")

    elif 500 <= params.invoice_amount < 1500:
        scores["court"] += 20
        scores["agency"] += 10
        reasoning.append(f"Medium invoice amount (£{params.invoice_amount:.2f}) - County Court is cost-effective")

    elif 1500 <= params.invoice_amount < 5000:
        scores["court"] += 30
        scores["agency"] += 20
        reasoning.append(f"Good amount for County Court (£{params.invoice_amount:.2f})")

    else:  # >= £5000
        scores["court"] += 25
        scores["agency"] += 35
        reasoning.append(f"High value debt (£{params.invoice_amount:.2f}) - both options viable")

    # =================================================================
    # FACTOR 2: Days Overdue
    # =================================================================
    if params.days_overdue < 30:
        scores["continue_internal"] += 40
        reasoning.append(f"Recently overdue ({params.days_overdue} days) - continue internal attempts")

    elif 30 <= params.days_overdue < 60:
        scores["continue_internal"] += 20
        scores["court"] += 20
        scores["agency"] += 10
        reasoning.append(f"Moderately overdue ({params.days_overdue} days) - consider escalation soon")

    elif 60 <= params.days_overdue < 90:
        scores["court"] += 30
        scores["agency"] += 30
        reasoning.append(f"Significantly overdue ({params.days_overdue} days) - escalation recommended")

    else:  # >= 90 days
        scores["court"] += 40
        scores["agency"] += 35
        scores["write_off"] += 10
        reasoning.append(f"Severely overdue ({params.days_overdue} days) - urgent escalation needed")

    # =================================================================
    # FACTOR 3: Debt Clarity (Disputed vs Clear)
    # =================================================================
    if params.is_disputed_debt:
        scores["court"] += 40
        scores["agency"] -= 20
        scores["write_off"] += 10
        reasoning.append("Disputed debt - County Court better for formal judgment")
        warnings.append("Disputed debts have lower success rates with agencies")

    else:
        scores["agency"] += 25
        scores["court"] += 20
        reasoning.append("Clear debt - both court and agency viable")

    # =================================================================
    # FACTOR 4: Debtor Type
    # =================================================================
    if params.debtor_type == "business":
        scores["court"] += 30
        reasoning.append("Business debtor - County Court CCJ has strong impact on credit rating")

    elif params.debtor_type == "individual":
        scores["agency"] += 25
        reasoning.append("Individual debtor - Agency may be more flexible with payment plans")

    else:  # unknown
        scores["court"] += 10
        scores["agency"] += 10

    # =================================================================
    # FACTOR 5: Previous Collection Attempts
    # =================================================================
    if params.previous_attempts < 3:
        scores["continue_internal"] += 30
        reasoning.append(f"Few collection attempts ({params.previous_attempts}) - try more internal methods first")

    elif 3 <= params.previous_attempts < 6:
        scores["court"] += 20
        scores["agency"] += 20
        reasoning.append(f"Multiple attempts made ({params.previous_attempts}) - escalation reasonable")

    else:  # >= 6
        scores["court"] += 30
        scores["agency"] += 30
        reasoning.append(f"Many failed attempts ({params.previous_attempts}) - escalation strongly recommended")

    # =================================================================
    # FACTOR 6: Relationship Value
    # =================================================================
    if params.relationship_value == "high":
        scores["agency"] += 25
        scores["court"] -= 15
        reasoning.append("High-value relationship - Agency less damaging than Court action")

    elif params.relationship_value == "medium":
        scores["court"] += 10
        scores["agency"] += 10

    else:  # low
        scores["court"] += 20
        reasoning.append("Low relationship value - Court action acceptable")

    # =================================================================
    # FACTOR 7: Evidence Strength
    # =================================================================
    evidence_score = 0
    if params.has_written_contract:
        evidence_score += 1
        reasoning.append("Written contract strengthens case")

    if params.has_proof_of_delivery:
        evidence_score += 1
        reasoning.append("Proof of delivery available")

    if evidence_score >= 2:
        scores["court"] += 30
        reasoning.append("Strong evidence - excellent for County Court")
    elif evidence_score == 1:
        scores["court"] += 15
        scores["agency"] += 10
    else:
        scores["agency"] += 20
        scores["court"] -= 10
        warnings.append("Weak evidence may reduce Court success rate")

    # =================================================================
    # FACTOR 8: Debtor Asset Status
    # =================================================================
    if params.debtor_has_assets is True:
        scores["court"] += 25
        reasoning.append("Debtor has assets - Court judgment can be enforced")

    elif params.debtor_has_assets is False:
        scores["write_off"] += 20
        scores["agency"] += 10
        warnings.append("Debtor has no assets - recovery may be difficult")

    # =================================================================
    # DETERMINE PRIMARY RECOMMENDATION
    # =================================================================
    primary_option = max(scores, key=scores.get)
    confidence = min(95, max(50, scores[primary_option]))

    # =================================================================
    # BUILD NEXT STEPS
    # =================================================================
    if primary_option == "court":
        next_steps = [
            "1. File claim online via Money Claim Online: https://www.moneyclaim.gov.uk",
            f"2. Pay court fee of £{court_fee:.2f}",
            "3. Court serves claim on debtor (5-7 days)",
            "4. Debtor has 14 days to respond",
            "5. If no response → Default Judgment (automatic)",
            "6. If defended → Hearing in 8-12 weeks",
            "7. Upon judgment, enforce via bailiffs/charging order"
        ]

    elif primary_option == "agency":
        next_steps = [
            "1. Select registered UK debt collection agency",
            f"2. Expected commission: {agency_commission['percentage']} of recovered amount",
            "3. Agency sends formal demand letter (14-day notice)",
            "4. Intensive collection period (60-90 days)",
            "5. If successful, receive net amount after commission",
            "6. If unsuccessful, agency may recommend Court or write-off"
        ]

    elif primary_option == "continue_internal":
        next_steps = [
            "1. Send formal Letter Before Action (LBA)",
            "2. Make final phone call attempt",
            "3. Offer payment plan or settlement discount",
            f"4. If no response after 14 days, re-evaluate escalation",
            "5. Document all communication for potential Court case"
        ]

    else:  # write_off
        next_steps = [
            "1. Send final demand letter",
            "2. Inform client that account will be closed",
            "3. Record as bad debt for tax purposes",
            "4. Consider selling debt to recovery company (10-20% of value)",
            "5. Focus efforts on higher-value debts"
        ]

    # =================================================================
    # CALCULATE SUCCESS RATES (estimates)
    # =================================================================
    court_success = "66-75%"  # Based on UK statistics
    agency_success = "50-60%"  # Based on industry averages

    if params.is_disputed_debt:
        court_success = "40-50%"  # Lower for disputed
        agency_success = "30-40%"

    # =================================================================
    # BUILD RESPONSE
    # =================================================================
    return {
        "primary_option": primary_option,
        "confidence": confidence,
        "reasoning": reasoning,
        "costs": {
            "county_court_fee": court_fee,
            "agency_commission": {
                "min": agency_commission["min"],
                "max": agency_commission["max"],
                "percentage": agency_commission["percentage"]
            },
            "net_recovery": {
                "court_option": round(net_recovery_court, 2),
                "agency_option_min": round(net_recovery_agency_min, 2),
                "agency_option_max": round(net_recovery_agency_max, 2)
            }
        },
        "timeline": {
            "court_days": "30-90 days (default judgment) or 90-180 days (defended)",
            "agency_days": "60-90 days typical collection period"
        },
        "success_rate": {
            "court": court_success,
            "agency": agency_success
        },
        "next_steps": next_steps,
        "warnings": warnings if warnings else None
    }

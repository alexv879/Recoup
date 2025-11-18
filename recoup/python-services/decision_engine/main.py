"""
Decision Engine Microservice
Helps decide between County Court claims vs Debt Collection Agency

Features:
- Multi-factor decision algorithm
- UK legal cost calculations
- Success rate estimation
- ROI analysis
- Compliance checking

Endpoints:
- POST /recommend-escalation - Get escalation recommendation
- POST /calculate-court-fee - Calculate county court fees
- POST /estimate-agency-commission - Calculate agency commission
- GET /health - Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

from escalation import (
    generate_escalation_recommendation,
    calculate_court_fee,
    calculate_agency_commission,
    EscalationParams
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Recoup Decision Engine",
    description="Escalation decision support system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class EscalationRequest(BaseModel):
    """Request for escalation recommendation"""
    invoice_amount: float
    days_overdue: int
    is_disputed_debt: bool = False
    debtor_type: str = "unknown"  # 'business', 'individual', 'unknown'
    previous_attempts: int = 0
    relationship_value: str = "medium"  # 'low', 'medium', 'high'
    has_written_contract: bool = False
    has_proof_of_delivery: bool = False
    debtor_has_assets: str = "unknown"  # 'true', 'false', 'unknown'


class CourtFeeRequest(BaseModel):
    """Request for court fee calculation"""
    claim_amount: float


class AgencyCommissionRequest(BaseModel):
    """Request for agency commission calculation"""
    debt_amount: float


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "decision_engine",
        "version": "1.0.0"
    }


@app.post("/recommend-escalation")
async def recommend_escalation(request: EscalationRequest) -> Dict[str, Any]:
    """
    Generate escalation recommendation

    Analyzes invoice and debtor characteristics to recommend:
    - County Court claim
    - Debt Collection Agency
    - Write off
    - Continue internal collections

    Returns detailed reasoning, costs, timelines, and next steps
    """
    try:
        logger.info(f"Generating escalation recommendation for £{request.invoice_amount}")

        # Convert request to params
        params = EscalationParams(
            invoice_amount=request.invoice_amount,
            days_overdue=request.days_overdue,
            is_disputed_debt=request.is_disputed_debt,
            debtor_type=request.debtor_type,
            previous_attempts=request.previous_attempts,
            relationship_value=request.relationship_value,
            has_written_contract=request.has_written_contract,
            has_proof_of_delivery=request.has_proof_of_delivery,
            debtor_has_assets=request.debtor_has_assets == "true"
        )

        # Generate recommendation
        recommendation = generate_escalation_recommendation(params)

        logger.info(f"Recommendation: {recommendation['primary_option']} (confidence: {recommendation['confidence']}%)")

        return recommendation

    except Exception as e:
        logger.error(f"Escalation recommendation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate-court-fee")
async def calculate_court_fee_endpoint(request: CourtFeeRequest) -> Dict[str, float]:
    """
    Calculate UK County Court fees

    Based on Money Claim Online fee schedule
    """
    try:
        fee = calculate_court_fee(request.claim_amount)

        return {
            "claim_amount": request.claim_amount,
            "court_fee": fee,
            "percentage_of_claim": round((fee / request.claim_amount) * 100, 2) if request.claim_amount > 0 else 0
        }

    except Exception as e:
        logger.error(f"Court fee calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/estimate-agency-commission")
async def estimate_agency_commission_endpoint(request: AgencyCommissionRequest) -> Dict[str, Any]:
    """
    Estimate debt collection agency commission

    Typical UK rates: 15-25% of recovered amount
    """
    try:
        commission = calculate_agency_commission(request.debt_amount)

        return {
            "debt_amount": request.debt_amount,
            "commission_min": commission["min"],
            "commission_max": commission["max"],
            "percentage": commission["percentage"],
            "net_recovery_min": request.debt_amount - commission["max"],
            "net_recovery_max": request.debt_amount - commission["min"]
        }

    except Exception as e:
        logger.error(f"Agency commission calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.getenv("PORT", 8004))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

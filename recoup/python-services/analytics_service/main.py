"""
Analytics & Predictions Microservice
Provides ML-based forecasting and analytics for Recoup

Features:
- Revenue forecasting with time series analysis
- Payment timing predictions
- Client value analysis (LTV)
- Cashflow predictions
- Collections success estimation
- Trend analysis

Endpoints:
- POST /predictions - Generate all predictions
- POST /forecast/revenue - Revenue forecasting
- POST /forecast/cashflow - Cashflow predictions
- POST /analyze/clients - Client analysis
- GET /health - Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from predictions import (
    forecast_revenue,
    predict_payment_timing,
    predict_recovery,
    predict_collections_success,
    analyze_client_patterns,
    forecast_cashflow
)

from models import InvoiceData, PredictionResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Recoup Analytics Service",
    description="ML-powered analytics and predictions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class PredictionsRequest(BaseModel):
    """Request for generating predictions"""
    user_id: str
    invoices: List[Dict[str, Any]]
    months_history: int = 6


class RevenueForcastRequest(BaseModel):
    """Request for revenue forecasting"""
    invoices: List[Dict[str, Any]]
    forecast_months: int = 6


class ClientAnalysisRequest(BaseModel):
    """Request for client analysis"""
    invoices: List[Dict[str, Any]]
    top_n: int = 5


class CashflowRequest(BaseModel):
    """Request for cashflow prediction"""
    invoices: List[Dict[str, Any]]
    days_ahead: int = 30


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "analytics_service",
        "version": "1.0.0"
    }


@app.post("/predictions")
async def generate_predictions(request: PredictionsRequest) -> Dict[str, Any]:
    """
    Generate all predictions for a user

    Returns comprehensive predictions including:
    - Revenue forecasts
    - Payment timing
    - Recovery estimates
    - Collections success
    - Client insights
    - Cashflow predictions
    """
    try:
        logger.info(f"Generating predictions for user {request.user_id} with {len(request.invoices)} invoices")

        predictions = []

        # Convert invoices to InvoiceData objects
        invoices = [InvoiceData.from_dict(inv) for inv in request.invoices]

        # 1. Revenue Forecast
        try:
            revenue_pred = forecast_revenue(invoices, months_ahead=6)
            if revenue_pred:
                predictions.append(revenue_pred)
        except Exception as e:
            logger.error(f"Revenue forecast error: {str(e)}")

        # 2. Payment Timing
        try:
            payment_pred = predict_payment_timing(invoices)
            if payment_pred:
                predictions.append(payment_pred)
        except Exception as e:
            logger.error(f"Payment timing error: {str(e)}")

        # 3. Recovery Prediction
        try:
            recovery_pred = predict_recovery(invoices)
            if recovery_pred:
                predictions.append(recovery_pred)
        except Exception as e:
            logger.error(f"Recovery prediction error: {str(e)}")

        # 4. Collections Success
        try:
            collections_pred = predict_collections_success(invoices)
            if collections_pred:
                predictions.append(collections_pred)
        except Exception as e:
            logger.error(f"Collections prediction error: {str(e)}")

        # 5. Client Insights
        try:
            client_pred = analyze_client_patterns(invoices)
            if client_pred:
                predictions.append(client_pred)
        except Exception as e:
            logger.error(f"Client analysis error: {str(e)}")

        # 6. Cashflow Prediction
        try:
            cashflow_pred = forecast_cashflow(invoices, days_ahead=30)
            if cashflow_pred:
                predictions.append(cashflow_pred)
        except Exception as e:
            logger.error(f"Cashflow prediction error: {str(e)}")

        logger.info(f"Generated {len(predictions)} predictions")

        return {
            "predictions": predictions,
            "total": len(predictions),
            "generated_at": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Predictions error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/forecast/revenue")
async def forecast_revenue_endpoint(request: RevenueForcastRequest) -> Dict[str, Any]:
    """
    Forecast revenue using time series analysis

    Uses exponential smoothing and trend analysis for accurate predictions
    """
    try:
        invoices = [InvoiceData.from_dict(inv) for inv in request.invoices]
        prediction = forecast_revenue(invoices, months_ahead=request.forecast_months)

        if not prediction:
            return {"prediction": None, "message": "Insufficient data for forecasting"}

        return {"prediction": prediction}

    except Exception as e:
        logger.error(f"Revenue forecast error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/forecast/cashflow")
async def forecast_cashflow_endpoint(request: CashflowRequest) -> Dict[str, Any]:
    """
    Predict cashflow for the next N days

    Analyzes upcoming invoices and historical payment patterns
    """
    try:
        invoices = [InvoiceData.from_dict(inv) for inv in request.invoices]
        prediction = forecast_cashflow(invoices, days_ahead=request.days_ahead)

        if not prediction:
            return {"prediction": None, "message": "No upcoming invoices"}

        return {"prediction": prediction}

    except Exception as e:
        logger.error(f"Cashflow forecast error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/clients")
async def analyze_clients_endpoint(request: ClientAnalysisRequest) -> Dict[str, Any]:
    """
    Analyze client patterns and identify top/worst clients

    Returns insights on client behavior, payment patterns, and lifetime value
    """
    try:
        invoices = [InvoiceData.from_dict(inv) for inv in request.invoices]
        prediction = analyze_client_patterns(invoices, top_n=request.top_n)

        if not prediction:
            return {"prediction": None, "message": "No client data available"}

        return {"prediction": prediction}

    except Exception as e:
        logger.error(f"Client analysis error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.getenv("PORT", 8002))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

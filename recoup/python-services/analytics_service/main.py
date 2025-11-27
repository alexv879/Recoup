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

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import time
import traceback
from contextlib import asynccontextmanager

from predictions import (
    forecast_revenue,
    predict_payment_timing,
    predict_recovery,
    predict_collections_success,
    analyze_client_patterns,
    forecast_cashflow
)

from models import InvoiceData, PredictionResponse
from config import get_config

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - [%(pathname)s:%(lineno)d]'
)
logger = logging.getLogger(__name__)


# Custom exceptions
class ServiceError(Exception):
    """Base service exception"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class InsufficientDataError(ServiceError):
    """Insufficient data for prediction"""
    def __init__(self, message: str = "Insufficient data for prediction"):
        super().__init__(message, status_code=422)


class PredictionError(ServiceError):
    """Prediction calculation error"""
    def __init__(self, message: str):
        super().__init__(message, status_code=503)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    config = get_config()
    logger.info(f"Starting Analytics Service v1.0.0 on port {config.PORT}")
    logger.info(f"Environment: {config.ENV}")
    logger.info(f"Min data points for predictions: {config.MIN_DATA_POINTS}")

    yield

    # Shutdown
    logger.info("Shutting down Analytics Service")

app = FastAPI(
    title="Recoup Analytics Service",
    description="ML-powered analytics and predictions",
    version="1.0.0",
    lifespan=lifespan
)

# Get configuration
config = get_config()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(ServiceError)
async def service_error_handler(request: Request, exc: ServiceError):
    """Handle custom service errors"""
    logger.error(f"Service error: {exc.message}", exc_info=True)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "type": exc.__class__.__name__
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation failed",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "message": str(exc) if config.is_development else "An unexpected error occurred"
        }
    )


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests with timing"""
    start_time = time.time()
    request_id = f"{int(time.time() * 1000)}"

    logger.info(f"[{request_id}] {request.method} {request.url.path} started")

    try:
        response = await call_next(request)
        duration = int((time.time() - start_time) * 1000)

        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"completed in {duration}ms with status {response.status_code}"
        )

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration}ms"

        return response

    except Exception as exc:
        duration = int((time.time() - start_time) * 1000)
        logger.error(
            f"[{request_id}] {request.method} {request.url.path} "
            f"failed after {duration}ms: {str(exc)}"
        )
        raise

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
    """
    Comprehensive health check endpoint
    Checks service status and ML capabilities
    """
    health_status = {
        "status": "healthy",
        "service": "analytics_service",
        "version": "1.0.0",
        "timestamp": time.time(),
        "environment": config.ENV,
        "capabilities": {
            "revenue_forecast": True,
            "payment_timing": True,
            "recovery_prediction": True,
            "collections_success": True,
            "client_analysis": True,
            "cashflow_forecast": True
        },
        "config": {
            "min_data_points": config.MIN_DATA_POINTS,
            "confidence_threshold": config.FORECAST_CONFIDENCE_THRESHOLD
        }
    }

    return health_status


@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "service": "Recoup Analytics Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "predictions": "/predictions",
            "revenue_forecast": "/forecast/revenue",
            "cashflow_forecast": "/forecast/cashflow",
            "client_analysis": "/analyze/clients",
            "health": "/health",
            "docs": "/docs"
        }
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
    start_time = time.time()

    logger.info(f"Generating predictions for user {request.user_id} with {len(request.invoices)} invoices")

    # Validate minimum data points
    if len(request.invoices) < config.MIN_DATA_POINTS:
        raise InsufficientDataError(
            f"Insufficient data: {len(request.invoices)} invoices provided, "
            f"minimum {config.MIN_DATA_POINTS} required"
        )

    # Convert invoices to InvoiceData objects
    try:
        invoices = [InvoiceData.from_dict(inv) for inv in request.invoices]
    except Exception as e:
        logger.error(f"Failed to parse invoices: {str(e)}")
        raise ServiceError(f"Invalid invoice data: {str(e)}", status_code=400)

    predictions = []
    errors = {}

    # 1. Revenue Forecast
    try:
        revenue_pred = forecast_revenue(invoices, months_ahead=6)
        if revenue_pred:
            predictions.append(revenue_pred)
    except Exception as e:
        logger.error(f"Revenue forecast error: {str(e)}")
        errors["revenue_forecast"] = str(e)

    # 2. Payment Timing
    try:
        payment_pred = predict_payment_timing(invoices)
        if payment_pred:
            predictions.append(payment_pred)
    except Exception as e:
        logger.error(f"Payment timing error: {str(e)}")
        errors["payment_timing"] = str(e)

    # 3. Recovery Prediction
    try:
        recovery_pred = predict_recovery(invoices)
        if recovery_pred:
            predictions.append(recovery_pred)
    except Exception as e:
        logger.error(f"Recovery prediction error: {str(e)}")
        errors["recovery"] = str(e)

    # 4. Collections Success
    try:
        collections_pred = predict_collections_success(invoices)
        if collections_pred:
            predictions.append(collections_pred)
    except Exception as e:
        logger.error(f"Collections prediction error: {str(e)}")
        errors["collections"] = str(e)

    # 5. Client Insights
    try:
        client_pred = analyze_client_patterns(invoices)
        if client_pred:
            predictions.append(client_pred)
    except Exception as e:
        logger.error(f"Client analysis error: {str(e)}")
        errors["client_analysis"] = str(e)

    # 6. Cashflow Prediction
    try:
        cashflow_pred = forecast_cashflow(invoices, days_ahead=30)
        if cashflow_pred:
            predictions.append(cashflow_pred)
    except Exception as e:
        logger.error(f"Cashflow prediction error: {str(e)}")
        errors["cashflow"] = str(e)

    duration = int((time.time() - start_time) * 1000)
    logger.info(
        f"Generated {len(predictions)} predictions for user {request.user_id} "
        f"in {duration}ms ({len(errors)} errors)"
    )

    # If no predictions were generated, raise error
    if len(predictions) == 0:
        raise PredictionError("Failed to generate any predictions. Check data quality.")

    return {
        "predictions": predictions,
        "total": len(predictions),
        "generated_at": datetime.now().isoformat(),
        "duration_ms": duration,
        "errors": errors if errors else None
    }


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

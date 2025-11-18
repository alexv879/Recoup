"""
Recoup Python Backend - FastAPI Application
Main entry point for the Python backend services
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os

from config.firebase import initialize_firebase
from api import (
    collections_router,
    dashboard_router,
    invoices_router,
    payments_router,
    webhooks_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Recoup Python Backend...")

    # Initialize Firebase
    try:
        initialize_firebase()
        logger.info("✅ Firebase initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Firebase: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down Recoup Python Backend...")


# Create FastAPI app
app = FastAPI(
    title="Recoup API",
    description="Smart invoicing and payment tracking for freelancers",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "message": str(exc) if os.getenv("DEBUG") == "true" else "An error occurred",
        },
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "recoup-python-backend",
        "version": "3.0.0",
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Recoup Python Backend API",
        "version": "3.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# Include routers (to be created)
# app.include_router(collections_router, prefix="/api/collections", tags=["Collections"])
# app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
# app.include_router(invoices_router, prefix="/api/invoices", tags=["Invoices"])
# app.include_router(payments_router, prefix="/api/payments", tags=["Payments"])
# app.include_router(webhooks_router, prefix="/api/webhooks", tags=["Webhooks"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true",
        log_level="info",
    )

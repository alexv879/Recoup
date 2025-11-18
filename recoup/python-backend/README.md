# Recoup Python Backend

This is the Python backend for the Recoup application, converted from TypeScript/Node.js to Python/FastAPI.

## Overview

The Python backend provides:
- **FastAPI** web framework for high-performance async APIs
- **Pydantic** models for type-safe data validation
- **Firebase Admin SDK** for Firestore database and authentication
- **SendGrid** for email delivery
- **Stripe** for payment processing
- **Twilio** for SMS and voice communications
- **OpenAI** for AI-powered features
- **Celery** for background job processing

## Project Structure

```
python-backend/
├── api/                    # FastAPI route handlers
│   ├── collections.py      # Collections API endpoints
│   ├── dashboard.py        # Dashboard API endpoints
│   ├── invoices.py         # Invoice API endpoints
│   ├── payments.py         # Payment API endpoints
│   └── webhooks.py         # Webhook handlers
├── config/                 # Configuration modules
│   └── firebase.py         # Firebase initialization
├── models/                 # Pydantic data models
│   ├── user.py
│   ├── invoice.py
│   ├── payment.py
│   ├── collection.py
│   ├── notification.py
│   ├── client.py
│   ├── stats.py
│   ├── agency.py
│   └── onboarding.py
├── services/               # Business logic services
│   ├── pricing.py          # Pricing calculations
│   ├── collections.py      # Collections interest calculator
│   ├── email.py            # SendGrid email service
│   └── analytics.py        # Analytics service
├── workers/                # Background job workers
│   ├── escalation_worker.py
│   └── email_worker.py
├── utils/                  # Utility functions
│   ├── constants.py        # Application constants
│   └── base_rate_history.py # Bank of England base rates
├── tests/                  # Test suite
├── main.py                 # FastAPI application entry point
└── requirements.txt        # Python dependencies
```

## Setup

### Prerequisites

- Python 3.11 or higher
- Firebase project with Firestore
- SendGrid account with API key
- Stripe account (for payment processing)
- Redis (for Celery task queue)

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

Required environment variables:

```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
# OR
FIREBASE_SERVICE_ACCOUNT_JSON=/path/to/service-account.json

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@recoup.com
SENDGRID_FROM_NAME=Recoup
SENDGRID_INVOICE_TEMPLATE_ID=d-xxx
SENDGRID_REMINDER_DAY5_TEMPLATE_ID=d-xxx
SENDGRID_REMINDER_DAY15_TEMPLATE_ID=d-xxx
SENDGRID_REMINDER_DAY30_TEMPLATE_ID=d-xxx
SENDGRID_PAYMENT_CONFIRMED_TEMPLATE_ID=d-xxx
SENDGRID_NOTIFICATION_TEMPLATE_ID=d-xxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+44xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0

# Application
DEBUG=true
PORT=8000
CORS_ORIGINS=http://localhost:3000,https://app.recoup.com
```

## Running the Application

### Development Server

```bash
uvicorn main:app --reload --port 8000
```

### Production Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Background Workers

```bash
# Start Celery worker
celery -A workers worker --loglevel=info

# Start Celery beat (scheduled tasks)
celery -A workers beat --loglevel=info
```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_pricing.py

# Run with verbose output
pytest -v
```

## Code Quality

```bash
# Format code with Black
black .

# Sort imports with isort
isort .

# Lint with flake8
flake8 .

# Type checking with mypy
mypy .
```

## Migration from TypeScript

This backend is a direct conversion from the TypeScript/Node.js codebase. Key differences:

### Type System
- TypeScript interfaces → Pydantic models
- Type annotations preserved and enhanced

### Async/Await
- TypeScript async/await → Python async/await (compatible syntax)
- Promise → Coroutine

### Collections
- Firestore SDK: Node.js → Python Admin SDK
- Similar API, minor syntax differences

### Email Service
- @sendgrid/mail → sendgrid-python
- Similar API structure

### API Framework
- Next.js API Routes → FastAPI routes
- Express-like middleware → FastAPI dependencies

## Features Implemented

✅ **Core Models**
- User model with subscriptions and consent tracking
- Invoice model with escalation levels
- Payment claims and confirmations
- Collection attempts tracking
- Notifications system
- Client management
- User stats and gamification

✅ **Services**
- Pricing calculations (V3 tiers)
- Collections interest calculator (UK Late Payment Act 1998)
- Bank of England base rate history
- SendGrid email service with templates

✅ **Infrastructure**
- Firebase Admin SDK integration
- Firestore database access
- FastAPI application setup
- Environment configuration
- Logging and error handling

## Roadmap

🔲 **API Endpoints** (38 routes to convert)
- Collections API
- Dashboard API
- Invoice API
- Payment API
- Webhooks

🔲 **Background Workers**
- Collections escalation worker
- Email sequence worker
- Behavioral email worker

🔲 **Additional Services**
- Analytics service
- Voice processing service
- Payment service
- Client service

🔲 **Testing**
- Unit tests for all modules
- Integration tests for API endpoints
- E2E tests for critical workflows

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linters
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For questions or issues, contact the development team.

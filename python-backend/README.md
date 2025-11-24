# Recoup Python Backend

FastAPI backend service for AI-powered collections, voice calls, and specialized processing.

## Features

- **AI Voice Collections**: Twilio + OpenAI GPT-4 for automated debt collection calls
- **Payment Prediction**: Machine learning model to predict payment likelihood
- **Rate Limiting**: Multi-tier rate limiting with Redis
- **Idempotency**: Webhook deduplication with Redis
- **Collection Templates**: UK FCA-compliant email/SMS templates
- **Multi-channel Support**: Email, SMS, voice, physical letters

## Tech Stack

- **Framework**: FastAPI 0.115.0+
- **Runtime**: Python 3.11+
- **Database**: PostgreSQL (primary), Firebase Firestore (integration)
- **Cache/Queue**: Redis (Upstash)
- **AI/ML**: OpenAI GPT-4, scikit-learn, NumPy
- **Communications**: Twilio (SMS/Voice), SendGrid (Email)
- **Deployment**: Docker, Render.com

## Project Structure

```
python-backend/
├── app.py                      # Main FastAPI application
├── ai_collection_system.py     # AI voice calls & payment prediction
├── collection_templates.py     # Email/SMS templates
├── rate_limiter_py.py         # Rate limiting service
├── idempotency_py.py          # Webhook idempotency
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Production Docker image
├── render.yaml               # Render.com deployment config
└── README.md                 # This file
```

## Local Development

### Prerequisites

- Python 3.11 or higher
- Redis (local or Upstash)
- PostgreSQL (optional, for historical data)
- Firebase Admin credentials

### Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run development server**:
   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Access API**:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc
   - Health check: http://localhost:8000/health

## Environment Variables

### Required

```bash
# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+447...

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@recoup.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase
FIREBASE_PROJECT_ID=recoup-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@recoup-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Database (Optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/recoup

# Application
API_BASE_URL=https://app.recoup.com
COMPANY_NAME=Recoup
PAYMENT_BASE_URL=https://pay.recoup.com
```

### Optional

```bash
# Celery (for background tasks)
CELERY_BROKER_URL=redis://localhost:6379

# Database connection (if using PostgreSQL)
DB_HOST=localhost
DB_NAME=recoup
DB_USER=postgres
DB_PASSWORD=password
```

## Docker Deployment

### Build Image

```bash
docker build -t recoup-python-backend .
```

### Run Container

```bash
docker run -d \
  --name recoup-backend \
  -p 8000:8000 \
  --env-file .env \
  recoup-python-backend
```

### Docker Compose

```yaml
services:
  python-backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

## Render.com Deployment

### via Dashboard

1. Connect GitHub repository
2. Select `python-backend` directory as root
3. Set environment variables from `render.yaml`
4. Deploy

### via Render CLI

```bash
render deploy --service recoup-python-backend
```

### Auto-deploy

Pushes to `main` branch automatically trigger deployment when `render.yaml` is present.

## API Endpoints

### Health & Status

- `GET /health` - Health check endpoint
- `GET /api/admin/metrics` - Platform metrics (admin only)

### Invoices

- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/{invoice_id}` - Get invoice details
- `GET /api/collections/strategy/{invoice_id}` - Get AI collection strategy

### Collections

- `POST /api/collections/escalate` - Manually trigger collection action
- `POST /api/webhooks/twilio/ai-collect` - Twilio voice webhook
- `POST /api/webhooks/twilio/ai-respond` - Twilio speech response

### Payments

- `POST /api/payments/stripe` - Process Stripe webhooks
- `POST /api/payment-plans` - Create payment plan

## AI Voice Collections

### How It Works

1. **Initiation**: System detects overdue invoice → Triggers AI call
2. **Call Setup**: Twilio dials client → Plays AI greeting
3. **Conversation**: OpenAI GPT-4 processes speech → Generates responses
4. **Outcome Tracking**: Payment commitments recorded → SMS confirmation sent

### Features

- British English voice (Polly.Amy-Neural)
- Natural conversation flow
- Payment negotiation capability
- Automatic commitment extraction
- SMS follow-up confirmation

### Rate Limits

| Tier | AI Calls/Month | Daily Limit |
|------|----------------|-------------|
| Starter | 0 | 0 |
| Growth | 10 | 2 |
| Pro | 50 | 5 |

### Cost Controls

- Maximum call duration: 2 minutes
- Cost per call: ~£1.70 (Twilio + OpenAI)
- Daily spend limits enforced
- 80% warning threshold

## Payment Prediction ML Model

### Features Used

- Invoice amount
- Days overdue
- Previous late payments
- Client age (days)
- Industry code
- Collection stage
- Previous disputes
- Payment method on file
- Email open rates
- SMS response rates
- Partial payment history

### Model

- Algorithm: Random Forest Classifier
- Training: 10,000+ historical invoices
- Accuracy: ~85% (varies by cohort)
- Output: Payment probability (0-1)

### Recommendations

Based on predicted payment probability:

- **>70%**: Gentle reminder (high probability)
- **40-70%**: Standard escalation (medium)
- **20-40%**: Immediate escalation (low)
- **<20%**: Consider write-off (very low)

## Rate Limiting

### Tier-Based Limits

```python
'starter': {
    'monthly': {'collections': 10, 'emails': 500},
    'daily': {'emails': 50, 'total_cost_gbp': 5.00},
    'hourly': {'emails': 10, 'api_calls': 100}
}
'growth': {
    'monthly': {'collections': 50, 'emails': 2000, 'sms': 100, 'ai_calls': 10},
    'daily': {'emails': 200, 'sms': 20, 'ai_calls': 2, 'total_cost_gbp': 25.00},
    'hourly': {'emails': 30, 'sms': 5, 'api_calls': 500}
}
'pro': {
    'monthly': {'collections': 200, 'emails': 5000, 'sms': 500, 'ai_calls': 50},
    'daily': {'emails': 500, 'sms': 50, 'ai_calls': 5, 'total_cost_gbp': 100.00},
    'hourly': {'emails': 50, 'sms': 10, 'api_calls': 1000}
}
```

## Webhook Idempotency

Prevents duplicate processing of webhooks from Stripe, Twilio, etc.

- **TTL**: 2 days for webhook events
- **Key Format**: `idempotency:{provider}:{event_id}`
- **States**: `processing`, `completed`, `failed`
- **Failure Record**: 1 hour retention

## Testing

### Unit Tests

```bash
pytest tests/
```

### Integration Tests

```bash
pytest tests/integration/ -v
```

### Load Testing

```bash
locust -f tests/load/locustfile.py
```

## Monitoring

### Health Checks

- Endpoint: `/health`
- Checks: Database, Redis, Stripe
- Response: `{"status": "healthy", "services": {...}}`

### Metrics

- Request duration
- Error rates
- AI call success rate
- Payment prediction accuracy
- Rate limit violations

### Logging

- **Level**: INFO (production), DEBUG (development)
- **Format**: Structured JSON
- **Destinations**: stdout, Sentry

## Security

- **Authentication**: Firebase ID token validation
- **API Keys**: Environment variables only
- **Webhook Validation**: Stripe/Twilio signature verification
- **Rate Limiting**: Multi-tier with Redis
- **CORS**: Configured for Next.js frontend
- **Non-root User**: Docker container runs as `recoup` user

## Performance

- **Workers**: 2 uvicorn workers (Render Starter)
- **Concurrent Requests**: ~200 (growth) → ~500 (pro)
- **Response Time**: <100ms (median), <500ms (p95)
- **Redis Caching**: Aggressive caching for user tier lookups

## Troubleshooting

### Redis Connection Issues

```bash
# Test Redis connectivity
redis-cli -u $REDIS_URL ping
```

### Firebase Auth Errors

```bash
# Verify Firebase credentials
python -c "import firebase_admin; from firebase_admin import credentials; cred = credentials.Certificate({'project_id': '...'}); firebase_admin.initialize_app(cred)"
```

### Import Errors

```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test
3. Run linting: `black . && flake8`
4. Submit PR

## License

Proprietary - Recoup Platform © 2025

## Support

- **Documentation**: https://docs.recoup.com
- **Issues**: https://github.com/recoup/backend/issues
- **Email**: support@recoup.com

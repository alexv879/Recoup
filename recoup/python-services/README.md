# Recoup Python Microservices

Python-based microservices for AI, ML, and compute-intensive tasks.

## Overview

This directory contains Python microservices that handle computationally intensive and AI/ML tasks that are better suited for Python than TypeScript/Node.js.

## Services

### 1. Voice Service (Port 8001)
**Purpose**: Audio transcription and invoice parsing

**Features**:
- Deepgram & OpenAI Whisper transcription
- NLP-based invoice data extraction
- Real-time WebSocket streaming
- Audio quality validation
- Word Error Rate (WER) calculation

**Tech Stack**: FastAPI, Deepgram SDK, OpenAI SDK, WebSockets

**Documentation**: [voice_service/README.md](./voice_service/README.md)

---

### 2. Analytics Service (Port 8002)
**Purpose**: ML-powered analytics and forecasting

**Features**:
- Revenue forecasting (Exponential Smoothing)
- Payment timing predictions
- Recovery rate estimation
- Collections success prediction
- Client lifetime value analysis
- Cashflow forecasting

**Tech Stack**: FastAPI, pandas, numpy, statsmodels

**Documentation**: [analytics_service/README.md](./analytics_service/README.md)

---

### 3. AI Voice Agent (Port 8003)
**Purpose**: Automated collection calls with AI

**Features**:
- OpenAI Realtime API integration
- Twilio voice calls
- Bidirectional audio streaming
- UK FCA compliance
- Payment collection during call
- Call recording & transcription

**Tech Stack**: FastAPI, Twilio SDK, OpenAI Realtime API, WebSockets

**Documentation**: [ai_voice_agent/README.md](./ai_voice_agent/README.md)

---

### 4. Decision Engine (Port 8004)
**Purpose**: Escalation decision support

**Features**:
- Multi-factor decision algorithm (8 factors)
- UK County Court fee calculations
- Agency commission estimates
- Success rate predictions
- ROI analysis

**Tech Stack**: FastAPI

**Documentation**: [decision_engine/README.md](./decision_engine/README.md)

---

### 5. PDF Service (Port 8000) ✅ Existing
**Purpose**: PDF generation for testing

**Features**:
- Test PDF generation for CI/CD
- ReportLab integration

---

## Architecture Diagram

```
┌─────────────────┐
│   Next.js App   │
│   (TypeScript)  │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────┴────────────────────────────────────────────┐
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  │  Voice   │  │Analytics │  │ AI Voice │  │Decision  │
│  │ Service  │  │ Service  │  │  Agent   │  │  Engine  │
│  │  :8001   │  │  :8002   │  │  :8003   │  │  :8004   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘
│                                                     │
│            Python Microservices Layer              │
└─────────────────────────────────────────────────────┘
         │                           │
         │                           │
    ┌────┴────┐                 ┌───┴────┐
    │Deepgram │                 │Twilio  │
    │ OpenAI  │                 │OpenAI  │
    └─────────┘                 └────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- Docker & Docker Compose (recommended)
- API keys (see `.env.example`)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Navigate to python-services directory
cd python-services

# 2. Copy environment variables
cp .env.example .env

# 3. Edit .env with your API keys
vim .env

# 4. Start all services
docker-compose up --build

# Services will be available at:
# - Voice Service: http://localhost:8001
# - Analytics Service: http://localhost:8002
# - AI Voice Agent: http://localhost:8003
# - Decision Engine: http://localhost:8004
# - PDF Service: http://localhost:8000
```

### Option 2: Manual Setup

```bash
# Install and run each service individually

# Voice Service
cd voice_service
pip install -r requirements.txt
python main.py

# Analytics Service
cd analytics_service
pip install -r requirements.txt
python main.py

# AI Voice Agent
cd ai_voice_agent
pip install -r requirements.txt
python main.py

# Decision Engine
cd decision_engine
pip install -r requirements.txt
python main.py
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Voice Service
DEEPGRAM_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# AI Voice Agent
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+44xxxxxxxxxx
BASE_URL=https://your-domain.com

# Analytics & Decision Engine
# No specific env vars needed
```

## Integration with Next.js

Update your Next.js `.env.local`:

```bash
# Python Microservices URLs
PYTHON_VOICE_SERVICE_URL=http://localhost:8001
PYTHON_ANALYTICS_SERVICE_URL=http://localhost:8002
PYTHON_AI_VOICE_SERVICE_URL=http://localhost:8003
PYTHON_DECISION_ENGINE_URL=http://localhost:8004
```

Use the new TypeScript routes:
- Voice: `/api/voice/transcribe-python`
- Analytics: `/api/dashboard/predictions-python`
- AI Calls: `/api/collections/ai-call-python`
- Decisions: `/api/collections/escalation-decision-python`

## Testing All Services

```bash
# Voice Service
curl http://localhost:8001/health

# Analytics Service
curl http://localhost:8002/health

# AI Voice Agent
curl http://localhost:8003/health

# Decision Engine
curl http://localhost:8004/health

# PDF Service
curl http://localhost:8000/health
```

## Development Workflow

### Adding a New Service

1. Create service directory: `mkdir new_service`
2. Create files:
   - `main.py` (FastAPI app)
   - `requirements.txt` (dependencies)
   - `Dockerfile`
   - `README.md`
3. Add to `docker-compose.yml`
4. Create TypeScript route in Next.js
5. Document integration

### Hot Reloading

All services use `uvicorn --reload` for development hot reloading.

## Production Deployment

### Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to cloud (example: AWS ECS, GCP Cloud Run, etc.)
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Configs

- **Development**: `docker-compose.yml`
- **Production**: `docker-compose.prod.yml` (add this file)
- **Staging**: `docker-compose.staging.yml` (add this file)

## Monitoring & Logging

All services log to stdout using Python's `logging` module.

### Log Levels
- `INFO`: Normal operations
- `WARNING`: Unexpected but handled
- `ERROR`: Failures and exceptions

### Example Log Output
```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

## Performance

### Benchmarks (Approximate)

| Service | Avg Response Time | Throughput |
|---------|------------------|------------|
| Voice | 1-3s (transcription) | 20 req/s |
| Analytics | 200-500ms | 100 req/s |
| AI Voice Agent | N/A (async calls) | 10 calls/hour |
| Decision Engine | 50-100ms | 200 req/s |

### Scaling

- **Horizontal**: Run multiple instances behind load balancer
- **Vertical**: Increase container resources
- **Caching**: Add Redis for frequently accessed data

## Cost Estimates

### Per Month (100 users, moderate usage)

| Service | API Costs | Infrastructure | Total |
|---------|-----------|----------------|-------|
| Voice | £30 (Deepgram/OpenAI) | £10 (compute) | £40 |
| Analytics | £0 | £5 (compute) | £5 |
| AI Voice Agent | £265 (100 calls) | £10 (compute) | £275 |
| Decision Engine | £0 | £5 (compute) | £5 |
| **Total** | **£295** | **£30** | **£325** |

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs voice_service

# Check port conflicts
lsof -i :8001

# Rebuild container
docker-compose build voice_service
docker-compose up voice_service
```

### API Key Errors

```bash
# Verify environment variables are loaded
docker-compose config

# Check .env file exists
ls -la .env

# Restart services after .env changes
docker-compose restart
```

### Connection Refused

```bash
# Check service is running
docker-compose ps

# Check network
docker network ls
docker network inspect recoup-network

# Test connectivity
curl http://localhost:8001/health
```

## Security

### API Authentication

In production, add authentication to Python services:

```python
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    # Verify JWT token from Next.js
    pass
```

### CORS Configuration

Update `allow_origins` in each service for production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],  # Specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Migration Guide

### Replacing TypeScript Routes

1. Test Python service independently
2. Create new route with `-python` suffix
3. A/B test both routes
4. Monitor errors and performance
5. Migrate traffic gradually
6. Deprecate old route

### Example Migration

```typescript
// Old route
app/api/voice/transcribe/route.ts  (TypeScript logic)

// New route
app/api/voice/transcribe-python/route.ts  (Calls Python service)

// Frontend change
const endpoint = USE_PYTHON_SERVICES
  ? '/api/voice/transcribe-python'
  : '/api/voice/transcribe';
```

## Contributing

1. Follow Python PEP 8 style guide
2. Add type hints to all functions
3. Write docstrings for modules, classes, functions
4. Add tests (pytest)
5. Update README for new features

## License

MIT - Same as main Recoup project

## Support

- **Issues**: Open GitHub issue
- **Documentation**: See individual service READMEs
- **Questions**: Contact development team

---

**Status**: ✅ All 4 services migrated and ready for use
**Last Updated**: November 2025

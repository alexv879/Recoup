# Recoup Voice Server

WebSocket server for AI-powered voice debt collection using OpenAI Realtime API + Twilio.

## Features

- **FCA-Compliant Voice AI**: Follows FCA CONC 7.3 debt collection regulations
- **OpenAI Realtime API**: Natural conversation with GPT-4o
- **Twilio Integration**: Handles phone calls via Media Streams
- **Professional & Empathetic**: Designed to maximize payment recovery while maintaining compliance
- **Real-time Transcription**: Records all conversations for audit trail

## Architecture

```
Twilio Call → Twilio Media Stream (WebSocket) → Recoup Voice Server → OpenAI Realtime API
                                                          ↓
                                                  Recoup Main App (webhook)
```

## Deployment on Render.com

### 1. Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select `render-server` directory as root
5. Use settings from `render.yaml`

### 2. Set Environment Variables

In Render dashboard, add these environment variables:

```bash
NODE_ENV=production
PORT=8080
OPENAI_API_KEY=sk-proj-...
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
FCA_FIRM_REFERENCE=123456
COMPANY_NAME=Recoup Collections Ltd
COMPANY_ADDRESS=123 Collection Street, London, UK
RECOUP_API_URL=https://recoup-app.vercel.app
RECOUP_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Deploy

Render will automatically:
- Install dependencies
- Build TypeScript
- Start the server
- Provide a URL: `https://recoup-voice-server.onrender.com`

## Local Development

### Prerequisites

- Node.js 20+
- OpenAI API key with Realtime API access
- Twilio account with Media Streams enabled

### Setup

```bash
cd render-server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

Server runs on `http://localhost:8080`

### Testing Locally with Ngrok

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Expose with ngrok
ngrok http 8080
```

Use ngrok URL for Twilio webhook: `wss://xyz.ngrok.io/voice-stream`

## API Endpoints

### WebSocket: `/voice-stream`

Twilio Media Stream endpoint. Requires query parameters:

```
wss://your-server.onrender.com/voice-stream?invoiceId=inv_123&invoiceReference=INV-001&amount=500&dueDate=2025-01-01&daysOverdue=60&clientName=John+Doe&businessName=Acme+Corp
```

### HTTP: `GET /health`

Health check endpoint.

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T10:00:00.000Z",
  "environment": "production"
}
```

## FCA Compliance

This server implements FCA CONC 7.3 requirements:

1. **Company Identification**: Every call identifies the company and FCA firm reference
2. **Debt Validation**: Provides invoice details and validates with debtor
3. **Debtor Rights**: Informs of dispute rights, documentation requests, and FCA complaints process
4. **No Harassment**: Professional, empathetic tone with no aggressive language
5. **Data Protection**: GDPR-compliant data handling with explicit notices
6. **Call Recording**: All calls recorded for quality and compliance audit

## Call Outcomes

The AI tracks call outcomes and reports back to Recoup app:

- `payment_committed`: Debtor agreed to pay today
- `payment_plan`: Payment plan arranged
- `dispute`: Debtor disputes the debt
- `no_resolution`: Call ended without commitment
- `error`: Technical error during call

## Monitoring

### Logs

View logs in Render dashboard or via CLI:

```bash
render logs -s recoup-voice-server
```

### Metrics

Monitor in Render dashboard:
- Request count
- Active WebSocket connections
- Response times
- Error rates

## Cost Estimation

**Render.com:**
- Starter: $7/month (512MB RAM, good for testing)
- Standard: $25/month (2GB RAM, recommended for production)

**OpenAI Realtime API:**
- Audio input: $0.06 per minute
- Audio output: $0.24 per minute
- Average 3-minute call: ~$0.90

**Twilio:**
- Inbound call: £0.01/min
- Media Streams: £0.004/min
- Average 3-minute call: ~£0.04

**Total per 3-minute call: ~£0.95**

## Security

- Environment variables for all secrets
- Webhook signature verification
- HTTPS/WSS only in production
- No sensitive data in logs

## Support

For issues or questions, contact [support@recoup.com](mailto:support@recoup.com)

## License

Proprietary - Recoup Collections Ltd

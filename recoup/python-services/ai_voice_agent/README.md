# AI Voice Agent Service

AI-powered collection calls using Twilio + OpenAI Realtime API.

## Features

- **Natural Conversations**: OpenAI GPT-4o Realtime API for human-like interactions
- **Twilio Integration**: Professional voice calls with recording
- **UK FCA Compliance**: Respects calling hours and consent requirements
- **Payment Collection**: Can send payment links via SMS during call
- **Call Recording**: Full transcripts and audio recordings
- **Cooldown System**: 24-hour cooldown between calls to same client

## Architecture

```
ai_voice_agent/
├── main.py                  # FastAPI server
├── twilio_integration.py    # Twilio calls and SMS
├── openai_realtime.py       # OpenAI Realtime API
├── call_manager.py          # Call tracking and state
└── requirements.txt         # Python dependencies
```

## API Endpoints

### POST /initiate-call
Start AI-powered collection call

**Request:**
```json
{
  "recipient_phone": "+447123456789",
  "recipient_name": "John Smith",
  "invoice_reference": "INV-001",
  "amount": 500.00,
  "due_date": "2025-10-31",
  "days_past_due": 18,
  "business_name": "Acme Consulting",
  "invoice_id": "inv_123",
  "freelancer_id": "user_456",
  "enable_payment_during_call": true
}
```

**Response:**
```json
{
  "success": true,
  "call_sid": "CAxxxxxxxxxxxxx",
  "estimated_cost": {
    "twilio_call_cost": 0.039,
    "twilio_sms_cost": 0.04,
    "recording_cost": 0.006,
    "openai_cost": 0.18,
    "total": 0.265
  }
}
```

### GET /call-status/{call_sid}
Get call status and transcript

**Response:**
```json
{
  "call_sid": "CAxxxxxxxxxxxxx",
  "status": "completed",
  "duration": 180,
  "transcript": "[AI]: Hello, is this John Smith?\n[USER]: Yes...",
  "outcome": "payment_promised",
  "payment_collected": false,
  "cost": 0.27
}
```

### POST /estimate-cost
Estimate call cost

**Request:**
```json
{
  "estimated_duration_minutes": 3,
  "include_sms": true,
  "include_recording": true
}
```

## Call Flow

1. **Initiation**: TypeScript API calls Python service
2. **Twilio Call**: Service initiates outbound call via Twilio
3. **WebSocket Bridge**: Twilio connects to OpenAI via WebSocket
4. **AI Conversation**: OpenAI Realtime API handles bidirectional audio
5. **Transcript Capture**: Full conversation transcribed in real-time
6. **Payment Link**: If agreed, SMS with payment link sent
7. **Recording**: Call recorded for compliance
8. **Outcome Tracking**: Result saved to database

## UK FCA Compliance

### Calling Hours
- **Allowed**: Monday-Saturday, 8am-9pm
- **Prohibited**: Sundays, before 8am, after 9pm

### Consent Requirements
1. State purpose of call
2. Request recording consent
3. Provide opt-out option
4. Stop if debt disputed

### Prohibited Practices
- ❌ Harassment or pressure tactics
- ❌ False statements
- ❌ Sharing debt details with third parties
- ❌ Ignoring cease communication requests

## Environment Variables

```bash
# Twilio (Required)
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+44xxxxxxx

# OpenAI (Required)
OPENAI_API_KEY=sk-xxxxxxxx

# Service Config
PORT=8003
BASE_URL=https://your-domain.com

# Optional
LOG_LEVEL=info
```

## Setup

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run Server
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

## Integration with Next.js

```typescript
// app/api/collections/ai-call/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Call Python AI voice agent service
  const response = await fetch('http://localhost:8003/initiate-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient_phone: body.phone,
      recipient_name: body.clientName,
      invoice_reference: body.invoiceReference,
      amount: body.amount,
      due_date: body.dueDate,
      days_past_due: body.daysOverdue,
      business_name: body.businessName,
      invoice_id: body.invoiceId,
      freelancer_id: userId,
      enable_payment_during_call: true
    })
  });

  const result = await response.json();
  return NextResponse.json(result);
}
```

## Testing

```bash
# Health check
curl http://localhost:8003/health

# Estimate cost
curl -X POST http://localhost:8003/estimate-cost \
  -H "Content-Type: application/json" \
  -d '{"estimated_duration_minutes": 3, "include_sms": true, "include_recording": true}'

# Initiate call (test mode)
curl -X POST http://localhost:8003/initiate-call \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_phone": "+447123456789",
    "recipient_name": "Test Client",
    "invoice_reference": "TEST-001",
    "amount": 500.00,
    "due_date": "2025-10-31",
    "days_past_due": 18,
    "business_name": "Test Business",
    "invoice_id": "test_inv_123",
    "freelancer_id": "test_user_456"
  }'
```

## Cost Estimates

### Per 3-Minute Call
- Twilio call: £0.039 (£0.013/min)
- OpenAI Realtime: £0.180 (£0.06/min)
- Recording: £0.006 (£0.002/min)
- SMS (optional): £0.040
- **Total**: £0.265

### Per Month (100 calls)
- **Total cost**: £26.50
- **Average recovery**: £500/call
- **Total revenue**: £50,000
- **ROI**: 188,600%

## Limitations

### Minimum Requirements
- Invoice amount: £50+
- Days overdue: 7+
- Valid UK phone number

### Cooldown Period
- 24 hours between calls to same client
- Prevents harassment
- Maintains compliance

## Security

- API authentication required (add in production)
- Webhook signature verification
- Encrypted call recordings
- PCI DSS compliance for payment links
- GDPR-compliant data handling

## Future Enhancements

- [ ] Multi-language support
- [ ] Sentiment analysis during call
- [ ] Auto-escalation based on call outcome
- [ ] Integration with UK debt collection agencies
- [ ] A/B testing of different AI personas
- [ ] Real-time supervisor dashboard

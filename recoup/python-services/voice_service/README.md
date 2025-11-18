# Voice Processing Service

AI-powered voice transcription and invoice parsing microservice for Recoup.

## Features

- **Audio Transcription**: Deepgram (primary) and OpenAI Whisper (fallback)
- **Invoice Parsing**: NLP-based extraction of invoice data from transcripts
- **Real-time Streaming**: WebSocket support for live transcription
- **Audio Validation**: Quality checks before processing
- **WER Calculation**: Word Error Rate monitoring

## Architecture

```
voice_service/
├── main.py              # FastAPI server
├── transcribe.py        # Transcription logic (Deepgram/Whisper)
├── parse_invoice.py     # Invoice parsing with NLP
├── streaming.py         # WebSocket streaming
└── requirements.txt     # Python dependencies
```

## API Endpoints

### POST /transcribe
Transcribe audio file to text

**Request:**
```bash
curl -X POST http://localhost:8001/transcribe \
  -F "audio=@recording.webm" \
  -F "provider=deepgram" \
  -F "language=en-GB"
```

**Response:**
```json
{
  "transcript": "Invoice for John Smith five hundred pounds for web design due next week",
  "confidence": 0.95,
  "latency": 1234,
  "provider": "deepgram",
  "metadata": {
    "words": [...],
    "word_count": 12,
    "duration": 5.2
  }
}
```

### POST /parse-invoice
Extract invoice data from transcript

**Request:**
```bash
curl -X POST http://localhost:8001/parse-invoice \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Invoice for John Smith five hundred pounds for web design due next week"}'
```

**Response:**
```json
{
  "client_name": "John Smith",
  "amount": 500.0,
  "currency": "GBP",
  "description": "web design",
  "due_date": "2025-11-25",
  "raw_transcript": "...",
  "confidence": 0.85
}
```

### POST /transcribe-and-parse
Combined transcription and parsing

**Request:**
```bash
curl -X POST http://localhost:8001/transcribe-and-parse \
  -F "audio=@recording.webm"
```

**Response:**
```json
{
  "transcription": { ... },
  "invoice_data": { ... }
}
```

### WebSocket /ws/transcribe
Real-time streaming transcription

**Client:**
```javascript
const ws = new WebSocket('ws://localhost:8001/ws/transcribe');

// Send audio chunks
ws.send(audioChunk);

// Receive transcripts
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.transcript, data.is_final);
};
```

## Environment Variables

```bash
# Required
DEEPGRAM_API_KEY=your_deepgram_key
OPENAI_API_KEY=your_openai_key

# Optional
PORT=8001
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
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Integration with Next.js

Update the TypeScript API route to call this Python service:

```typescript
// app/api/voice/transcribe/route.ts
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  // Forward to Python service
  const response = await fetch('http://localhost:8001/transcribe-and-parse', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return NextResponse.json(result);
}
```

## Testing

```bash
# Test transcription
curl -X POST http://localhost:8001/transcribe \
  -F "audio=@test_audio.webm"

# Test parsing
curl -X POST http://localhost:8001/parse-invoice \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Invoice for ABC Ltd two thousand pounds for consultancy"}'

# Health check
curl http://localhost:8001/health
```

## Performance

- **Deepgram latency**: <1.5s target
- **Whisper latency**: 2-5s (batch processing)
- **Parsing**: <100ms
- **Max audio file**: 25MB

## Supported Audio Formats

- WebM (browser MediaRecorder)
- WAV
- MP3
- OGG
- M4A

## NLP Patterns

### Client Name Extraction
- "invoice for [Name]"
- "invoice to [Name]"
- "client [Name]"

### Amount Extraction
- Numeric: "£500", "1,500.50", "$2000"
- Written: "five hundred pounds", "two thousand"
- Mixed: "1.5 thousand"

### Due Date Extraction
- Relative: "due next week", "due in 7 days"
- Specific: "due Monday", "due by Friday"
- Default: 30 days if not specified

## Future Enhancements

- [ ] spaCy NLP for better entity extraction
- [ ] Multi-language support beyond English
- [ ] Audio enhancement (noise reduction)
- [ ] Speaker diarization
- [ ] Confidence thresholds for auto-approval

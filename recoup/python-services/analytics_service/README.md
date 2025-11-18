# Analytics & Predictions Service

ML-powered analytics and forecasting microservice for Recoup.

## Features

- **Revenue Forecasting**: Time series analysis with Exponential Smoothing
- **Payment Timing**: Predict average payment days based on historical data
- **Recovery Estimation**: Calculate expected recovery for outstanding invoices
- **Collections Success**: Predict success rate for collections
- **Client Analysis**: Identify top clients and payment patterns
- **Cashflow Predictions**: Forecast incoming payments

## Architecture

```
analytics_service/
├── main.py              # FastAPI server
├── predictions.py       # ML prediction logic
├── models.py           # Data models
└── requirements.txt    # Python dependencies
```

## API Endpoints

### POST /predictions
Generate all predictions for a user

**Request:**
```json
{
  "user_id": "user_123",
  "invoices": [...],
  "months_history": 6
}
```

**Response:**
```json
{
  "predictions": [
    {
      "type": "revenue",
      "title": "Next Month Revenue Forecast",
      "prediction": "£2,500.00",
      "description": "Based on 6 months of data...",
      "confidence": 0.85,
      "metrics": {...}
    },
    ...
  ],
  "total": 6,
  "generated_at": "2025-11-18T..."
}
```

### POST /forecast/revenue
Revenue forecasting only

### POST /forecast/cashflow
Cashflow prediction only

### POST /analyze/clients
Client analysis only

## ML Models

### Revenue Forecasting
- **Primary**: Exponential Smoothing (Holt-Winters)
- **Fallback**: Moving Average (when < 6 data points)
- **Confidence**: Based on data points and variance

### Payment Timing
- **Method**: Statistical analysis of historical payment days
- **Metrics**: Mean, median, standard deviation
- **Confidence**: Sample size dependent

### Recovery Prediction
- **Method**: Historical recovery rate adjusted for overdue status
- **Factors**: Total outstanding, overdue count
- **Confidence**: 0.7 (moderate)

### Collections Success
- **Method**: Success rate from historical collections
- **Application**: Applied to eligible invoices (7+ days overdue)
- **Confidence**: Sample size dependent (max 0.85)

### Client Analysis
- **Method**: Aggregation by client email
- **Metrics**: Total paid, invoice count, average payment days
- **Output**: Top N clients ranked by revenue

### Cashflow Forecasting
- **Method**: Sum of upcoming invoices within time window
- **Confidence**: 0.75 (moderate, assumes sent = will pay)

## Environment Variables

```bash
# Optional
PORT=8002
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
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

## Integration with Next.js

Replace the TypeScript predictions logic:

```typescript
// app/api/dashboard/predictions/route.ts
export async function GET(req: NextRequest) {
  const { userId } = await auth();

  // Get invoices from Firestore
  const invoices = await getInvoicesForUser(userId);

  // Call Python service
  const response = await fetch('http://localhost:8002/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      invoices: invoices,
      months_history: 6
    })
  });

  const predictions = await response.json();
  return NextResponse.json(predictions);
}
```

## Testing

```bash
# Health check
curl http://localhost:8002/health

# Generate predictions
curl -X POST http://localhost:8002/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "invoices": [
      {
        "invoice_id": "inv_1",
        "amount": 1000,
        "status": "paid",
        "invoice_date": "2025-10-01",
        "due_date": "2025-10-31",
        "paid_at": "2025-11-05",
        ...
      }
    ]
  }'
```

## Data Requirements

### Minimum Data Points
- **Revenue Forecast**: 3+ months of paid invoices
- **Payment Timing**: 5+ paid invoices
- **Recovery**: 1+ outstanding invoice
- **Collections**: 3+ collection attempts
- **Client Analysis**: 1+ invoice
- **Cashflow**: 1+ upcoming invoice

### Data Quality
- Dates must be valid ISO format or datetime objects
- Amounts must be numeric (float/int)
- Status must match enum values
- Missing dates reduce prediction accuracy

## Performance

- **Response time**: <500ms for typical datasets
- **Memory**: ~100MB for 10,000 invoices
- **Concurrency**: Async support for multiple requests

## Advanced Features (Optional)

### Facebook Prophet
Uncomment in requirements.txt for seasonal forecasting:
```python
from fbprophet import Prophet

# More accurate for seasonal patterns
model = Prophet()
model.fit(df)
forecast = model.predict(future_df)
```

### scikit-learn
For ML-based predictions:
```python
from sklearn.linear_model import LinearRegression

# Regression-based forecasting
model = LinearRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
```

## Future Enhancements

- [ ] Seasonal pattern detection
- [ ] Client churn prediction
- [ ] Anomaly detection in payment behavior
- [ ] Monte Carlo simulations for risk analysis
- [ ] A/B testing framework for collections
- [ ] LTV (Lifetime Value) calculations
- [ ] Cohort analysis

# Decision Engine Service

Escalation decision support system for debt recovery.

## Features

- **Multi-Factor Analysis**: 8-factor decision algorithm
- **UK Legal Costs**: Accurate County Court fee calculations
- **Agency Commission**: Debt collection agency cost estimates
- **Success Rate Estimation**: Based on UK statistics
- **ROI Analysis**: Net recovery calculations
- **Compliance Guidance**: UK legal process steps

## Architecture

```
decision_engine/
├── main.py              # FastAPI server
├── escalation.py        # Decision algorithm
└── requirements.txt     # Python dependencies
```

## Decision Factors

The algorithm considers 8 key factors:

1. **Invoice Amount** - Cost-effectiveness analysis
2. **Days Overdue** - Urgency assessment
3. **Debt Clarity** - Disputed vs clear debt
4. **Debtor Type** - Business vs individual
5. **Previous Attempts** - Collection history
6. **Relationship Value** - Client retention importance
7. **Evidence Strength** - Documentation quality
8. **Debtor Assets** - Enforcement viability

## API Endpoints

### POST /recommend-escalation
Get escalation recommendation

**Request:**
```json
{
  "invoice_amount": 2500.00,
  "days_overdue": 75,
  "is_disputed_debt": false,
  "debtor_type": "business",
  "previous_attempts": 5,
  "relationship_value": "low",
  "has_written_contract": true,
  "has_proof_of_delivery": true,
  "debtor_has_assets": "true"
}
```

**Response:**
```json
{
  "primary_option": "county_court",
  "confidence": 85,
  "reasoning": [
    "Good amount for County Court (£2,500.00)",
    "Significantly overdue (75 days) - escalation recommended",
    ...
  ],
  "costs": {
    "county_court_fee": 115,
    "agency_commission": {
      "min": 375.00,
      "max": 625.00,
      "percentage": "15-25%"
    },
    "net_recovery": {
      "court_option": 2385.00,
      "agency_option_min": 1875.00,
      "agency_option_max": 2125.00
    }
  },
  "timeline": {
    "court_days": "30-90 days (default judgment) or 90-180 days (defended)",
    "agency_days": "60-90 days typical collection period"
  },
  "success_rate": {
    "court": "66-75%",
    "agency": "50-60%"
  },
  "next_steps": [
    "1. File claim online via Money Claim Online: https://www.moneyclaim.gov.uk",
    ...
  ],
  "warnings": null
}
```

### POST /calculate-court-fee
Calculate UK County Court fees

**Request:**
```json
{
  "claim_amount": 2500.00
}
```

**Response:**
```json
{
  "claim_amount": 2500.00,
  "court_fee": 115,
  "percentage_of_claim": 4.6
}
```

### POST /estimate-agency-commission
Estimate agency commission

**Request:**
```json
{
  "debt_amount": 2500.00
}
```

**Response:**
```json
{
  "debt_amount": 2500.00,
  "commission_min": 375.00,
  "commission_max": 625.00,
  "percentage": "15-25%",
  "net_recovery_min": 1875.00,
  "net_recovery_max": 2125.00
}
```

## Decision Outcomes

### County Court
**When Recommended:**
- Clear debt with strong evidence
- Business debtor
- £1,000+ invoice amount
- Need formal judgment for credit impact

**Pros:**
- Legal judgment (enforceable)
- CCJ damages debtor's credit rating
- Fixed costs (court fees)
- 66-75% success rate

**Cons:**
- Damages client relationship permanently
- Upfront costs required
- Time-consuming (30-180 days)
- Requires evidence and documentation

### Debt Collection Agency
**When Recommended:**
- High-value relationship
- Individual debtor
- £5,000+ invoice amount
- Prefer flexible approach

**Pros:**
- No upfront costs
- Professional negotiation
- Less relationship damage than Court
- Payment plan flexibility

**Cons:**
- Commission-based (15-25%)
- Lower success rate (50-60%)
- No legal judgment
- Longer process (60-90 days)

### Continue Internal
**When Recommended:**
- < 30 days overdue
- Few previous attempts
- Want to preserve relationship

**Pros:**
- No external costs
- Maintain relationship
- Full control

**Cons:**
- May not be effective
- Time-intensive
- Delays escalation

### Write Off
**When Recommended:**
- Very low invoice amount (< £500)
- No debtor assets
- Court fees exceed recovery potential

**Pros:**
- Stop wasting resources
- Tax deduction
- Focus on better prospects

**Cons:**
- No recovery
- Sets bad precedent

## UK County Court Fees

| Claim Amount | Court Fee |
|--------------|-----------|
| Up to £300 | £35 |
| £301 - £500 | £50 |
| £501 - £1,000 | £70 |
| £1,001 - £1,500 | £80 |
| £1,501 - £3,000 | £115 |
| £3,001 - £5,000 | £205 |
| £5,001 - £10,000 | £455 |
| Over £10,000 | 5% (max £10,000) |

## Environment Variables

```bash
# Optional
PORT=8004
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
uvicorn main:app --host 0.0.0.0 --port 8004 --reload
```

## Integration with Next.js

```typescript
// Use decision engine in escalation route
export async function POST(req: NextRequest) {
  const body = await req.json();

  const response = await fetch('http://localhost:8004/recommend-escalation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoice_amount: body.amount,
      days_overdue: body.daysOverdue,
      is_disputed_debt: body.isDisputed,
      debtor_type: body.clientType,
      previous_attempts: body.attempts,
      relationship_value: body.relationshipValue,
      has_written_contract: body.hasContract,
      has_proof_of_delivery: body.hasProof,
      debtor_has_assets: body.hasAssets ? "true" : "false"
    })
  });

  const recommendation = await response.json();
  return NextResponse.json(recommendation);
}
```

## Testing

```bash
# Health check
curl http://localhost:8004/health

# Get recommendation
curl -X POST http://localhost:8004/recommend-escalation \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_amount": 2500,
    "days_overdue": 75,
    "is_disputed_debt": false,
    "debtor_type": "business",
    "previous_attempts": 5,
    "relationship_value": "low",
    "has_written_contract": true,
    "has_proof_of_delivery": true,
    "debtor_has_assets": "true"
  }'
```

## Future Enhancements

- [ ] Machine learning model for success prediction
- [ ] Historical success rate tracking per user
- [ ] Integration with actual court filing systems
- [ ] Debt collection agency marketplace
- [ ] Automated Letter Before Action generation
- [ ] Cost-benefit analysis dashboard

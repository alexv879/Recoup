# app.py
"""
Main application backend for Recoup - Invoice and Collection Platform
Combines Node.js/Express patterns with Python/FastAPI for optimal performance
"""

from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import stripe
import sendgrid
from sendgrid.helpers.mail import Mail
from twilio.twiml.voice_response import VoiceResponse
import redis.asyncio as redis
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os
import json
import hashlib
import hmac
from pydantic import BaseModel, Field
import logging

# Import our modules
from ai_collection_system import AIVoiceCallHandler, PaymentPredictor, Invoice
from collection_templates import CollectionTemplates
from rate_limiter_py import RateLimiter
from idempotency_py import IdempotencyHandler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Recoup API",
    description="Automated Invoice and Collection Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://recoup.uk"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
redis_client = redis.from_url(os.environ.get('REDIS_URL'))

# Database setup
DATABASE_URL = os.environ.get('DATABASE_URL')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Initialize our custom handlers
rate_limiter = RateLimiter()
idempotency_handler = IdempotencyHandler()
ai_handler = AIVoiceCallHandler()
predictor = PaymentPredictor()
templates = CollectionTemplates()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models
class InvoiceCreate(BaseModel):
    client_id: str
    amount: float = Field(gt=0)
    currency: str = "GBP"
    description: str
    due_date: datetime
    line_items: List[Dict]
    tax_rate: float = 0.20
    send_immediately: bool = True

class PaymentPlan(BaseModel):
    invoice_id: str
    initial_payment: float
    num_installments: int
    frequency: str = "weekly"  # weekly, biweekly, monthly

class WebhookEvent(BaseModel):
    provider: str
    event_id: str
    event_type: str
    data: Dict

class CollectionAction(BaseModel):
    invoice_id: str
    action: str
    force: bool = False


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": await check_database(),
            "redis": await check_redis(),
            "stripe": await check_stripe()
        }
    }

async def check_database():
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return "connected"
    except:
        return "disconnected"

async def check_redis():
    try:
        await redis_client.ping()
        return "connected"
    except:
        return "disconnected"

async def check_stripe():
    try:
        stripe.Account.retrieve()
        return "connected"
    except:
        return "disconnected"


# Invoice endpoints
@app.post("/api/invoices")
async def create_invoice(
    invoice: InvoiceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Create a new invoice with automatic sending"""
    
    # Check rate limits
    limit_check = await rate_limiter.check_limit(user_id, 'invoices', 1)
    if not limit_check['allowed']:
        raise HTTPException(status_code=429, detail=limit_check['reason'])
    
    # Generate invoice number
    invoice_number = generate_invoice_number(user_id, db)
    
    # Calculate totals
    subtotal = sum(item['quantity'] * item['price'] for item in invoice.line_items)
    tax_amount = subtotal * invoice.tax_rate
    total = subtotal + tax_amount
    
    # Create invoice in database
    db_invoice = {
        'id': generate_uuid(),
        'user_id': user_id,
        'client_id': invoice.client_id,
        'invoice_number': invoice_number,
        'amount': total,
        'subtotal': subtotal,
        'tax_amount': tax_amount,
        'currency': invoice.currency,
        'description': invoice.description,
        'due_date': invoice.due_date,
        'line_items': json.dumps(invoice.line_items),
        'status': 'draft',
        'created_at': datetime.utcnow()
    }
    
    db.execute(
        """INSERT INTO invoices 
           (id, user_id, client_id, invoice_number, amount, subtotal, 
            tax_amount, currency, description, due_date, line_items, status, created_at)
           VALUES (:id, :user_id, :client_id, :invoice_number, :amount, :subtotal,
                   :tax_amount, :currency, :description, :due_date, :line_items, :status, :created_at)""",
        db_invoice
    )
    db.commit()
    
    # Generate PDF
    pdf_url = await generate_invoice_pdf(db_invoice, db)
    
    # Send immediately if requested
    if invoice.send_immediately:
        background_tasks.add_task(send_invoice_email, db_invoice['id'], user_id)
        db_invoice['status'] = 'sent'
        db.execute(
            "UPDATE invoices SET status = 'sent', sent_date = NOW() WHERE id = :id",
            {'id': db_invoice['id']}
        )
        db.commit()
    
    # Consume rate limit
    await rate_limiter.consume_limit(user_id, 'invoices', 1)
    
    return {
        'invoice_id': db_invoice['id'],
        'invoice_number': invoice_number,
        'amount': total,
        'pdf_url': pdf_url,
        'status': db_invoice['status']
    }


@app.get("/api/invoices/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get invoice details"""
    
    invoice = db.execute(
        """SELECT i.*, c.name as client_name, c.email as client_email
           FROM invoices i
           JOIN clients c ON i.client_id = c.id
           WHERE i.id = :id AND i.user_id = :user_id""",
        {'id': invoice_id, 'user_id': user_id}
    ).fetchone()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get payment history
    payments = db.execute(
        "SELECT * FROM payments WHERE invoice_id = :id ORDER BY created_at DESC",
        {'id': invoice_id}
    ).fetchall()
    
    # Get collection events
    collection_events = db.execute(
        "SELECT * FROM collection_events WHERE invoice_id = :id ORDER BY created_at DESC",
        {'id': invoice_id}
    ).fetchall()
    
    return {
        'invoice': dict(invoice),
        'payments': [dict(p) for p in payments],
        'collection_events': [dict(e) for e in collection_events]
    }


# Payment endpoints
@app.post("/api/payments/stripe")
async def process_stripe_payment(
    request: Request,
    db: Session = Depends(get_db)
):
    """Process Stripe payment with idempotency"""
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle with idempotency
    result = await idempotency_handler.handle_webhook('stripe', event['id'], 
        lambda: process_stripe_event(event, db))
    
    return {"received": True, "processed": result}


async def process_stripe_event(event: Dict, db: Session):
    """Process individual Stripe events"""
    
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        # Find invoice
        invoice_id = payment_intent['metadata'].get('invoice_id')
        if not invoice_id:
            logger.error(f"No invoice_id in payment intent {payment_intent['id']}")
            return False
        
        # Record payment
        db.execute(
            """INSERT INTO payments 
               (id, invoice_id, amount, currency, stripe_payment_intent_id, 
                status, created_at)
               VALUES (:id, :invoice_id, :amount, :currency, :stripe_id, 
                       'completed', NOW())""",
            {
                'id': generate_uuid(),
                'invoice_id': invoice_id,
                'amount': payment_intent['amount'] / 100,  # Convert from cents
                'currency': payment_intent['currency'].upper(),
                'stripe_id': payment_intent['id']
            }
        )
        
        # Update invoice status
        db.execute(
            """UPDATE invoices 
               SET status = 'paid', paid_date = NOW(), 
                   collection_status = 'recovered'
               WHERE id = :id""",
            {'id': invoice_id}
        )
        
        db.commit()
        
        # Stop any active collections
        await stop_collections(invoice_id)
        
        # Send confirmation
        await send_payment_confirmation(invoice_id, payment_intent['amount'] / 100)
        
        return True
    
    elif event['type'] == 'payment_intent.payment_failed':
        # Log failed payment attempt
        payment_intent = event['data']['object']
        invoice_id = payment_intent['metadata'].get('invoice_id')
        
        if invoice_id:
            db.execute(
                """INSERT INTO payment_attempts 
                   (invoice_id, amount, status, error_message, created_at)
                   VALUES (:invoice_id, :amount, 'failed', :error, NOW())""",
                {
                    'invoice_id': invoice_id,
                    'amount': payment_intent['amount'] / 100,
                    'error': payment_intent.get('last_payment_error', {}).get('message')
                }
            )
            db.commit()
    
    return True


# Collection endpoints
@app.post("/api/collections/escalate")
async def escalate_collection(
    action: CollectionAction,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Manually escalate a collection"""
    
    # Get invoice and check ownership
    invoice = db.execute(
        """SELECT i.*, c.name, c.email, c.phone, u.tier
           FROM invoices i
           JOIN clients c ON i.client_id = c.id
           JOIN users u ON i.user_id = u.id
           WHERE i.id = :id AND i.user_id = :user_id""",
        {'id': action.invoice_id, 'user_id': user_id}
    ).fetchone()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check if action is allowed for tier
    allowed_actions = {
        'starter': ['email'],
        'growth': ['email', 'sms', 'ai_call', 'letter'],
        'pro': ['email', 'sms', 'ai_call', 'letter', 'agency']
    }
    
    if action.action not in allowed_actions.get(invoice['tier'], []):
        raise HTTPException(
            status_code=403,
            detail=f"Action {action.action} not available in {invoice['tier']} tier"
        )
    
    # Check rate limits for the action
    action_type = action.action.replace('_', '')  # email, sms, aicall, etc.
    limit_check = await rate_limiter.check_limit(user_id, action_type, 1)
    
    if not limit_check['allowed'] and not action.force:
        raise HTTPException(status_code=429, detail=limit_check['reason'])
    
    # Execute collection action
    if action.action == 'email':
        background_tasks.add_task(send_collection_email, invoice, 'firm_reminder_email')
    elif action.action == 'sms':
        background_tasks.add_task(send_collection_sms, invoice)
    elif action.action == 'ai_call':
        result = await ai_handler.initiate_call(invoice)
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error'])
    elif action.action == 'letter':
        background_tasks.add_task(send_physical_letter, invoice)
    elif action.action == 'agency':
        background_tasks.add_task(refer_to_agency, invoice)
    
    # Consume rate limit
    await rate_limiter.consume_limit(user_id, action_type, 1)
    
    # Log the action
    db.execute(
        """INSERT INTO collection_events 
           (invoice_id, event_type, event_status, manual, created_at)
           VALUES (:invoice_id, :action, 'initiated', true, NOW())""",
        {'invoice_id': action.invoice_id, 'action': action.action}
    )
    db.commit()
    
    return {
        'success': True,
        'action': action.action,
        'invoice_id': action.invoice_id,
        'remaining_limits': limit_check.get('remaining')
    }


@app.get("/api/collections/strategy/{invoice_id}")
async def get_collection_strategy(
    invoice_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get AI-recommended collection strategy"""
    
    # Get invoice details
    invoice_data = db.execute(
        """SELECT i.*, 
           DATE_PART('day', NOW() - i.due_date) as days_overdue,
           c.name as client_name, c.email as client_email, c.phone as client_phone
           FROM invoices i
           JOIN clients c ON i.client_id = c.id
           WHERE i.id = :id AND i.user_id = :user_id""",
        {'id': invoice_id, 'user_id': user_id}
    ).fetchone()
    
    if not invoice_data:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Create invoice object
    invoice = Invoice(
        id=invoice_data['id'],
        user_id=invoice_data['user_id'],
        client_id=invoice_data['client_id'],
        amount=float(invoice_data['amount']),
        currency=invoice_data['currency'],
        due_date=invoice_data['due_date'],
        days_overdue=int(invoice_data['days_overdue']),
        client_name=invoice_data['client_name'],
        client_email=invoice_data['client_email'],
        client_phone=invoice_data['client_phone'],
        collection_stage=invoice_data.get('collection_stage', 0),
        payment_history=[]
    )
    
    # Get AI strategy recommendation
    strategy = predictor.recommend_collection_strategy(invoice)
    
    # Get collection history
    events = db.execute(
        """SELECT event_type, event_status, created_at 
           FROM collection_events 
           WHERE invoice_id = :id 
           ORDER BY created_at DESC 
           LIMIT 10""",
        {'id': invoice_id}
    ).fetchall()
    
    return {
        'strategy': strategy,
        'invoice': {
            'id': invoice_id,
            'amount': invoice.amount,
            'days_overdue': invoice.days_overdue
        },
        'collection_history': [dict(e) for e in events],
        'next_recommended_action': determine_next_action(invoice, strategy)
    }


# Twilio webhooks for AI calls
@app.post("/webhooks/twilio/ai-collect")
async def handle_twilio_voice(request: Request):
    """Handle Twilio voice webhook for AI collections"""
    
    form_data = await request.form()
    call_sid = form_data.get('CallSid')
    call_status = form_data.get('CallStatus')
    
    # Get context from Redis
    context_key = form_data.get('context_key')
    context = json.loads(await redis_client.get(context_key) or '{}')
    
    response = VoiceResponse()
    
    if call_status == 'in-progress':
        # Initial greeting
        gather = response.gather(
            input='speech',
            action='/webhooks/twilio/ai-respond',
            method='POST',
            speech_timeout='auto',
            language='en-GB'
        )
        
        gather.say(
            f"Hello, this is {context['company_name']} calling about invoice "
            f"number {context['invoice_number']} for {context['amount']} pounds. "
            f"Am I speaking with {context['customer_name']}?",
            voice='Polly.Amy-Neural'
        )
    
    return Response(str(response), mimetype='text/xml')


@app.post("/webhooks/twilio/ai-respond")
async def handle_twilio_response(request: Request, db: Session = Depends(get_db)):
    """Handle customer response in AI call"""
    
    form_data = await request.form()
    speech_result = form_data.get('SpeechResult', '')
    call_sid = form_data.get('CallSid')
    
    # Get context
    context = json.loads(await redis_client.get(f"call_context:{call_sid}") or '{}')
    
    # Get AI response
    ai_response = await ai_handler.handle_customer_response(
        call_sid, speech_result, context
    )
    
    # Create Twilio response
    response = VoiceResponse()
    
    # Check if we should end the call
    if any(phrase in ai_response.lower() for phrase in ['goodbye', 'thank you for your time', 'have a good day']):
        response.say(ai_response, voice='Polly.Amy-Neural')
        response.hangup()
    else:
        # Continue conversation
        gather = response.gather(
            input='speech',
            action='/webhooks/twilio/ai-respond',
            method='POST',
            speech_timeout='auto',
            language='en-GB'
        )
        gather.say(ai_response, voice='Polly.Amy-Neural')
    
    return Response(str(response), mimetype='text/xml')


# Payment plan endpoints
@app.post("/api/payment-plans")
async def create_payment_plan(
    plan: PaymentPlan,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Create a payment plan for an invoice"""
    
    # Get invoice
    invoice = db.execute(
        "SELECT * FROM invoices WHERE id = :id AND user_id = :user_id",
        {'id': plan.invoice_id, 'user_id': user_id}
    ).fetchone()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Calculate plan details
    remaining = float(invoice['amount']) - plan.initial_payment
    installment_amount = remaining / plan.num_installments
    
    # Create payment schedule
    schedule = []
    current_date = datetime.now()
    
    if plan.frequency == 'weekly':
        delta = timedelta(weeks=1)
    elif plan.frequency == 'biweekly':
        delta = timedelta(weeks=2)
    else:  # monthly
        delta = timedelta(days=30)
    
    for i in range(plan.num_installments):
        current_date += delta
        schedule.append({
            'date': current_date.isoformat(),
            'amount': installment_amount
        })
    
    # Save payment plan
    plan_id = generate_uuid()
    db.execute(
        """INSERT INTO payment_plans 
           (id, invoice_id, total_amount, initial_payment, num_installments, 
            installment_amount, frequency, schedule, status, created_at)
           VALUES (:id, :invoice_id, :total, :initial, :num, :installment, 
                   :frequency, :schedule, 'active', NOW())""",
        {
            'id': plan_id,
            'invoice_id': plan.invoice_id,
            'total': invoice['amount'],
            'initial': plan.initial_payment,
            'num': plan.num_installments,
            'installment': installment_amount,
            'frequency': plan.frequency,
            'schedule': json.dumps(schedule)
        }
    )
    
    # Update invoice status
    db.execute(
        """UPDATE invoices 
           SET status = 'payment_plan', collection_status = 'paused'
           WHERE id = :id""",
        {'id': plan.invoice_id}
    )
    
    db.commit()
    
    # Send confirmation email
    await send_payment_plan_confirmation(plan.invoice_id, plan_id, schedule)
    
    return {
        'plan_id': plan_id,
        'initial_payment': plan.initial_payment,
        'installment_amount': installment_amount,
        'schedule': schedule
    }


# Admin endpoints
@app.get("/api/admin/metrics")
async def get_metrics(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get platform metrics for admin dashboard"""
    
    # Check if user is admin
    user = db.execute(
        "SELECT role FROM users WHERE id = :id",
        {'id': user_id}
    ).fetchone()
    
    if not user or user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get metrics
    metrics = {}
    
    # Total invoices and amounts
    metrics['invoices'] = dict(db.execute(
        """SELECT 
           COUNT(*) as total,
           SUM(amount) as total_amount,
           COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
           SUM(amount) FILTER (WHERE status = 'paid') as paid_amount
           FROM invoices"""
    ).fetchone())
    
    # Collection performance
    metrics['collections'] = dict(db.execute(
        """SELECT 
           COUNT(DISTINCT invoice_id) as active_collections,
           AVG(DATE_PART('day', paid_date - due_date)) as avg_days_to_payment,
           COUNT(*) FILTER (WHERE event_type = 'ai_call') as total_ai_calls,
           COUNT(*) FILTER (WHERE event_type = 'letter') as total_letters
           FROM collection_events"""
    ).fetchone())
    
    # Cost tracking
    metrics['costs'] = dict(db.execute(
        """SELECT 
           SUM(cost) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_cost,
           SUM(cost) FILTER (WHERE DATE_PART('month', created_at) = DATE_PART('month', CURRENT_DATE)) as month_cost,
           SUM(cost) as total_cost
           FROM collection_events
           WHERE cost > 0"""
    ).fetchone())
    
    # Success rates by stage
    metrics['success_by_stage'] = db.execute(
        """SELECT 
           collection_stage,
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'paid') as recovered,
           ROUND(COUNT(*) FILTER (WHERE status = 'paid')::numeric / COUNT(*) * 100, 2) as success_rate
           FROM invoices
           WHERE collection_stage > 0
           GROUP BY collection_stage
           ORDER BY collection_stage"""
    ).fetchall()
    
    return metrics


# Utility functions
def generate_uuid():
    import uuid
    return str(uuid.uuid4())

def generate_invoice_number(user_id: str, db: Session) -> str:
    """Generate sequential invoice number"""
    
    result = db.execute(
        """SELECT COUNT(*) + 1 as next_num 
           FROM invoices 
           WHERE user_id = :user_id 
           AND DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE)""",
        {'user_id': user_id}
    ).fetchone()
    
    year = datetime.now().year
    number = result['next_num']
    
    return f"INV-{year}-{number:05d}"

async def get_current_user(request: Request) -> str:
    """Get current user from auth token"""
    # Implement your auth logic here
    # For now, return a dummy user ID
    return "user_123"

async def send_collection_email(invoice: Dict, template_name: str):
    """Send collection email using SendGrid"""
    # Implementation here
    pass

async def send_collection_sms(invoice: Dict):
    """Send collection SMS using Twilio"""
    # Implementation here
    pass

async def send_physical_letter(invoice: Dict):
    """Send physical letter using Lob"""
    # Implementation here
    pass

async def refer_to_agency(invoice: Dict):
    """Refer invoice to collection agency"""
    # Implementation here
    pass

async def stop_collections(invoice_id: str):
    """Stop all collection activities for an invoice"""
    # Implementation here
    pass

async def send_payment_confirmation(invoice_id: str, amount: float):
    """Send payment confirmation email"""
    # Implementation here
    pass

async def send_payment_plan_confirmation(invoice_id: str, plan_id: str, schedule: List):
    """Send payment plan confirmation"""
    # Implementation here
    pass

def determine_next_action(invoice, strategy: Dict) -> str:
    """Determine next collection action based on invoice and strategy"""
    
    if strategy['payment_probability'] > 0.7:
        return "Send gentle reminder"
    elif invoice.days_overdue < 15:
        return "Send firm email reminder"
    elif invoice.days_overdue < 25:
        return "Send SMS reminder"
    elif invoice.days_overdue < 35:
        return "Make AI collection call"
    elif invoice.days_overdue < 45:
        return "Send physical letter"
    else:
        return "Refer to collection agency"


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

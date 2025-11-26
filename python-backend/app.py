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

# Initialize Firebase Admin
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

# Initialize Firebase only if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.environ.get('FIREBASE_PROJECT_ID'),
        "private_key": os.environ.get('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
        "client_email": os.environ.get('FIREBASE_CLIENT_EMAIL'),
    })
    firebase_admin.initialize_app(cred)

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
    """Get current user from Firebase auth token"""
    import firebase_admin
    from firebase_admin import auth as firebase_auth

    # Get authorization header
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    # Extract token
    token = authorization.split("Bearer ")[1]

    try:
        # Verify Firebase ID token
        decoded_token = firebase_auth.verify_id_token(token)
        user_id = decoded_token["uid"]
        return user_id
    except Exception as e:
        logger.error(f"Firebase auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def send_collection_email(invoice: Dict, template_name: str):
    """Send collection email using SendGrid with dynamic templates"""
    try:
        # Get template ID from environment based on template name
        template_map = {
            'gentle_reminder': os.environ.get('SENDGRID_TEMPLATE_GENTLE_REMINDER'),
            'firm_reminder': os.environ.get('SENDGRID_TEMPLATE_FIRM_REMINDER'),
            'final_notice': os.environ.get('SENDGRID_TEMPLATE_FINAL_NOTICE'),
            'payment_plan_offer': os.environ.get('SENDGRID_TEMPLATE_PAYMENT_PLAN'),
        }

        template_id = template_map.get(template_name)
        if not template_id:
            logger.error(f"Unknown template name: {template_name}")
            raise ValueError(f"Unknown template: {template_name}")

        # Prepare template data
        template_data = {
            'invoice_reference': invoice.get('reference'),
            'amount': f"£{invoice.get('amount', 0) / 100:.2f}",
            'due_date': invoice.get('dueDate'),
            'client_name': invoice.get('clientName'),
            'business_name': invoice.get('businessName', 'Recoup'),
            'payment_link': f"{os.environ.get('APP_URL', 'https://recoup.uk')}/pay/{invoice.get('invoiceId')}",
        }

        # Send email via SendGrid
        message = Mail(
            from_email=os.environ.get('SENDGRID_FROM_EMAIL', 'collections@recoup.uk'),
            to_emails=invoice.get('clientEmail')
        )
        message.template_id = template_id
        message.dynamic_template_data = template_data

        response = sg.send(message)

        logger.info(f"Collection email sent: {template_name} for invoice {invoice.get('invoiceId')}")
        return {
            'success': True,
            'status_code': response.status_code,
            'message_id': response.headers.get('X-Message-Id')
        }

    except Exception as e:
        logger.error(f"Failed to send collection email: {e}")
        return {'success': False, 'error': str(e)}

async def send_collection_sms(invoice: Dict):
    """Send collection SMS using Twilio"""
    try:
        from twilio.rest import Client

        # Initialize Twilio client
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_number = os.environ.get('TWILIO_PHONE_NUMBER')

        if not all([account_sid, auth_token, from_number]):
            logger.error("Twilio credentials not configured")
            return {'success': False, 'error': 'Twilio credentials missing'}

        client = Client(account_sid, auth_token)
        to_number = invoice.get('clientPhone')

        if not to_number:
            logger.error(f"No phone number for invoice {invoice.get('invoiceId')}")
            return {'success': False, 'error': 'No client phone number'}

        # Format message (UK compliant - non-threatening, clear identification)
        amount = f"£{invoice.get('amount', 0) / 100:.2f}"
        payment_link = f"{os.environ.get('APP_URL', 'https://recoup.uk')}/pay/{invoice.get('invoiceId')}"

        message_body = (
            f"{invoice.get('businessName', 'Recoup')}: Invoice {invoice.get('reference')} "
            f"for {amount} is overdue. Pay securely: {payment_link} "
            f"Reply STOP to opt out."
        )

        # Send SMS
        message = client.messages.create(
            body=message_body,
            from_=from_number,
            to=to_number
        )

        logger.info(f"Collection SMS sent for invoice {invoice.get('invoiceId')}: {message.sid}")
        return {
            'success': True,
            'message_sid': message.sid,
            'status': message.status
        }

    except Exception as e:
        logger.error(f"Failed to send collection SMS: {e}")
        return {'success': False, 'error': str(e)}

async def send_physical_letter(invoice: Dict):
    """Send physical letter using Lob API"""
    try:
        import lob

        # Initialize Lob client
        lob_api_key = os.environ.get('LOB_API_KEY')
        if not lob_api_key:
            logger.error("Lob API key not configured")
            return {'success': False, 'error': 'Lob API key missing'}

        lob_client = lob.Client(api_key=lob_api_key)

        # Get business address (from address)
        from_address = invoice.get('businessAddress', {})
        if not from_address:
            logger.error("Business address not configured")
            return {'success': False, 'error': 'Business address missing'}

        # Get client address (to address)
        to_address = invoice.get('clientAddress', {})
        if not to_address:
            logger.error(f"No client address for invoice {invoice.get('invoiceId')}")
            return {'success': False, 'error': 'Client address missing'}

        # Prepare letter content
        amount = f"£{invoice.get('amount', 0) / 100:.2f}"
        days_overdue = invoice.get('daysOverdue', 0)

        # Use Lob HTML template
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ font-weight: bold; font-size: 18px; margin-bottom: 20px; }}
                .body {{ line-height: 1.6; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="header">{invoice.get('businessName', 'Recoup')}</div>
            <div class="body">
                <p>Dear {invoice.get('clientName')},</p>
                <p>This is a formal notice regarding overdue invoice <strong>{invoice.get('reference')}</strong>.</p>
                <p><strong>Amount Due:</strong> {amount}<br>
                <strong>Due Date:</strong> {invoice.get('dueDate')}<br>
                <strong>Days Overdue:</strong> {days_overdue}</p>
                <p>We kindly request immediate payment to avoid further action.</p>
                <p>To pay online, visit: {os.environ.get('APP_URL', 'https://recoup.uk')}/pay/{invoice.get('invoiceId')}</p>
                <p>If you have already paid or dispute this debt, please contact us immediately.</p>
                <p>Yours sincerely,<br>{invoice.get('businessName', 'Recoup')}</p>
            </div>
            <div class="footer">
                This letter is sent in accordance with UK debt collection regulations.
            </div>
        </body>
        </html>
        """

        # Send letter via Lob
        letter = lob_client.Letter.create(
            description=f"Collection letter for invoice {invoice.get('reference')}",
            to_address=to_address,
            from_address=from_address,
            file=html_content,
            color=False,  # Black and white to save costs
            double_sided=False
        )

        logger.info(f"Physical letter sent for invoice {invoice.get('invoiceId')}: {letter.id}")
        return {
            'success': True,
            'letter_id': letter.id,
            'expected_delivery': letter.expected_delivery_date
        }

    except Exception as e:
        logger.error(f"Failed to send physical letter: {e}")
        return {'success': False, 'error': str(e)}

async def refer_to_agency(invoice: Dict):
    """Refer invoice to collection agency"""
    try:
        # Agency API endpoint (configurable for different agencies)
        agency_api_url = os.environ.get('COLLECTION_AGENCY_API_URL')
        agency_api_key = os.environ.get('COLLECTION_AGENCY_API_KEY')

        if not all([agency_api_url, agency_api_key]):
            logger.error("Collection agency API not configured")
            return {'success': False, 'error': 'Agency API not configured'}

        # Prepare handoff data
        handoff_data = {
            'invoice_id': invoice.get('invoiceId'),
            'reference': invoice.get('reference'),
            'debtor_name': invoice.get('clientName'),
            'debtor_email': invoice.get('clientEmail'),
            'debtor_phone': invoice.get('clientPhone'),
            'debtor_address': invoice.get('clientAddress'),
            'amount': invoice.get('amount', 0) / 100,  # Convert to pounds
            'currency': invoice.get('currency', 'GBP'),
            'due_date': invoice.get('dueDate'),
            'days_overdue': invoice.get('daysOverdue'),
            'creditor_name': invoice.get('businessName'),
            'creditor_email': invoice.get('businessEmail'),
            'invoice_date': invoice.get('invoiceDate'),
            'line_items': invoice.get('items', []),
            'communication_history': invoice.get('collectionHistory', []),
            'notes': f"Escalated after {invoice.get('daysOverdue')} days overdue"
        }

        # Send to agency API
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                agency_api_url,
                json=handoff_data,
                headers={
                    'Authorization': f'Bearer {agency_api_key}',
                    'Content-Type': 'application/json'
                },
                timeout=30.0
            )

            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                logger.info(f"Invoice {invoice.get('invoiceId')} referred to agency: {result.get('case_id')}")
                return {
                    'success': True,
                    'agency_case_id': result.get('case_id'),
                    'agency_reference': result.get('reference')
                }
            else:
                logger.error(f"Agency API error: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f'Agency API returned {response.status_code}'
                }

    except Exception as e:
        logger.error(f"Failed to refer to agency: {e}")
        return {'success': False, 'error': str(e)}

async def stop_collections(invoice_id: str):
    """Stop all collection activities for an invoice"""
    try:
        from firebase_admin import firestore

        # Get Firestore client
        db = firestore.client()

        # Update invoice to mark collections as stopped
        invoice_ref = db.collection('invoices').document(invoice_id)
        invoice_doc = invoice_ref.get()

        if not invoice_doc.exists:
            logger.error(f"Invoice {invoice_id} not found")
            return {'success': False, 'error': 'Invoice not found'}

        # Update invoice escalation status
        from datetime import datetime, timezone
        invoice_ref.update({
            'collectionsEnabled': False,
            'escalation.status': 'stopped',
            'escalation.stoppedAt': datetime.now(timezone.utc),
            'escalation.stoppedReason': 'Manual stop requested',
            'updatedAt': datetime.now(timezone.utc)
        })

        # Cancel any scheduled collection tasks in Redis
        try:
            # Remove from escalation queue
            await redis_client.srem(f'escalation_queue', invoice_id)

            # Cancel any scheduled reminders
            await redis_client.delete(f'scheduled_reminder:{invoice_id}')

            logger.info(f"Cancelled scheduled tasks for invoice {invoice_id}")
        except Exception as redis_error:
            logger.warning(f"Failed to cancel Redis tasks: {redis_error}")
            # Continue anyway - invoice is still marked as stopped in Firestore

        # Log the stop action
        activity_ref = db.collection('collectionActivities').document()
        activity_ref.set({
            'invoiceId': invoice_id,
            'activityType': 'collections_stopped',
            'outcome': 'stopped',
            'timestamp': datetime.now(timezone.utc),
            'notes': 'Collections manually stopped'
        })

        logger.info(f"Collections stopped for invoice {invoice_id}")
        return {'success': True, 'message': 'Collections stopped successfully'}

    except Exception as e:
        logger.error(f"Failed to stop collections: {e}")
        return {'success': False, 'error': str(e)}

async def send_payment_confirmation(invoice_id: str, amount: float):
    """Send payment confirmation email"""
    try:
        from firebase_admin import firestore

        # Get invoice details from Firestore
        db = firestore.client()
        invoice_ref = db.collection('invoices').document(invoice_id)
        invoice_doc = invoice_ref.get()

        if not invoice_doc.exists:
            logger.error(f"Invoice {invoice_id} not found")
            return {'success': False, 'error': 'Invoice not found'}

        invoice_data = invoice_doc.to_dict()

        # Get SendGrid template ID for payment confirmation
        template_id = os.environ.get('SENDGRID_TEMPLATE_PAYMENT_CONFIRMATION')
        if not template_id:
            logger.error("Payment confirmation template not configured")
            return {'success': False, 'error': 'Email template not configured'}

        # Prepare template data
        template_data = {
            'invoice_reference': invoice_data.get('reference'),
            'amount_paid': f"£{amount / 100:.2f}",
            'payment_date': datetime.now(timezone.utc).strftime('%d %B %Y'),
            'client_name': invoice_data.get('clientName'),
            'business_name': invoice_data.get('businessName', 'Recoup'),
            'invoice_amount': f"£{invoice_data.get('amount', 0) / 100:.2f}",
            'receipt_url': f"{os.environ.get('APP_URL', 'https://recoup.uk')}/invoices/{invoice_id}/receipt",
        }

        # Send confirmation email
        message = Mail(
            from_email=os.environ.get('SENDGRID_FROM_EMAIL', 'payments@recoup.uk'),
            to_emails=invoice_data.get('clientEmail')
        )
        message.template_id = template_id
        message.dynamic_template_data = template_data

        response = sg.send(message)

        logger.info(f"Payment confirmation sent for invoice {invoice_id}")
        return {
            'success': True,
            'status_code': response.status_code,
            'message_id': response.headers.get('X-Message-Id')
        }

    except Exception as e:
        logger.error(f"Failed to send payment confirmation: {e}")
        return {'success': False, 'error': str(e)}

async def send_payment_plan_confirmation(invoice_id: str, plan_id: str, schedule: List):
    """Send payment plan confirmation email with installment schedule"""
    try:
        from firebase_admin import firestore

        # Get invoice details from Firestore
        db = firestore.client()
        invoice_ref = db.collection('invoices').document(invoice_id)
        invoice_doc = invoice_ref.get()

        if not invoice_doc.exists:
            logger.error(f"Invoice {invoice_id} not found")
            return {'success': False, 'error': 'Invoice not found'}

        invoice_data = invoice_doc.to_dict()

        # Get SendGrid template ID for payment plan confirmation
        template_id = os.environ.get('SENDGRID_TEMPLATE_PAYMENT_PLAN')
        if not template_id:
            logger.error("Payment plan template not configured")
            return {'success': False, 'error': 'Email template not configured'}

        # Format schedule for email
        formatted_schedule = []
        total_plan_amount = 0
        for installment in schedule:
            formatted_schedule.append({
                'due_date': installment.get('dueDate'),
                'amount': f"£{installment.get('amount', 0) / 100:.2f}",
                'installment_number': installment.get('installmentNumber', 1)
            })
            total_plan_amount += installment.get('amount', 0)

        # Prepare template data
        template_data = {
            'invoice_reference': invoice_data.get('reference'),
            'plan_id': plan_id,
            'client_name': invoice_data.get('clientName'),
            'business_name': invoice_data.get('businessName', 'Recoup'),
            'original_amount': f"£{invoice_data.get('amount', 0) / 100:.2f}",
            'total_plan_amount': f"£{total_plan_amount / 100:.2f}",
            'number_of_installments': len(schedule),
            'installments': formatted_schedule,
            'first_payment_date': formatted_schedule[0]['due_date'] if formatted_schedule else 'N/A',
            'first_payment_amount': formatted_schedule[0]['amount'] if formatted_schedule else 'N/A',
            'plan_url': f"{os.environ.get('APP_URL', 'https://recoup.uk')}/payment-plans/{plan_id}",
        }

        # Send confirmation email
        message = Mail(
            from_email=os.environ.get('SENDGRID_FROM_EMAIL', 'payments@recoup.uk'),
            to_emails=invoice_data.get('clientEmail')
        )
        message.template_id = template_id
        message.dynamic_template_data = template_data

        response = sg.send(message)

        # Store payment plan in Firestore
        plan_ref = db.collection('paymentPlans').document(plan_id)
        plan_ref.set({
            'invoiceId': invoice_id,
            'planId': plan_id,
            'freelancerId': invoice_data.get('freelancerId'),
            'clientEmail': invoice_data.get('clientEmail'),
            'clientName': invoice_data.get('clientName'),
            'originalAmount': invoice_data.get('amount'),
            'totalPlanAmount': total_plan_amount,
            'installments': schedule,
            'status': 'active',
            'createdAt': datetime.now(timezone.utc),
            'updatedAt': datetime.now(timezone.utc)
        })

        logger.info(f"Payment plan confirmation sent for invoice {invoice_id}, plan {plan_id}")
        return {
            'success': True,
            'status_code': response.status_code,
            'message_id': response.headers.get('X-Message-Id'),
            'plan_id': plan_id
        }

    except Exception as e:
        logger.error(f"Failed to send payment plan confirmation: {e}")
        return {'success': False, 'error': str(e)}

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

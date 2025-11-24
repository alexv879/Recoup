# ai_collection_system.py
"""
AI-Powered Collection System for Recoup
Handles voice calls, payment prediction, and intelligent escalation
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

import openai
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
import redis.asyncio as redis
import psycopg2
from psycopg2.extras import RealDictCursor
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import httpx
from celery import Celery
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
openai.api_key = os.environ.get('OPENAI_API_KEY')
twilio_client = Client(
    os.environ.get('TWILIO_ACCOUNT_SID'),
    os.environ.get('TWILIO_AUTH_TOKEN')
)
redis_client = redis.from_url(os.environ.get('REDIS_URL'))
celery_app = Celery('recoup', broker=os.environ.get('CELERY_BROKER_URL'))

# Database connection
def get_db():
    return psycopg2.connect(
        host=os.environ.get('DB_HOST'),
        database=os.environ.get('DB_NAME'),
        user=os.environ.get('DB_USER'),
        password=os.environ.get('DB_PASSWORD'),
        cursor_factory=RealDictCursor
    )

class CollectionStage(Enum):
    """Collection escalation stages"""
    NONE = 0
    GENTLE_EMAIL = 7
    FIRM_EMAIL = 14
    FIRST_SMS = 15
    SECOND_REMINDER = 20
    FIRST_AI_CALL = 25
    FINAL_NOTICE = 30
    SECOND_AI_CALL = 35
    PHYSICAL_LETTER = 40
    FINAL_AI_CALL = 45
    AGENCY_REFERRAL = 50

@dataclass
class Invoice:
    """Invoice data model"""
    id: str
    user_id: str
    client_id: str
    amount: float
    currency: str
    due_date: datetime
    days_overdue: int
    client_name: str
    client_email: str
    client_phone: str
    collection_stage: int
    payment_history: List[Dict]
    dispute_status: Optional[str] = None

class AIVoiceCallHandler:
    """Handles AI-powered collection calls using Twilio and OpenAI"""
    
    def __init__(self):
        self.twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
        self.webhook_base = os.environ.get('API_BASE_URL')
        self.max_call_duration = 120  # 2 minutes max
        self.cost_per_minute = 0.85  # £0.85 per minute (Twilio + OpenAI)
        
        # Call script templates
        self.scripts = {
            'opening': {
                'text': "Hello, this is an automated call from {company} regarding invoice number {invoice_number} for {amount} pounds. Am I speaking with {customer_name}?",
                'voice': 'Polly.Amy',  # British English voice
                'language': 'en-GB'
            },
            'payment_inquiry': {
                'text': "The invoice of {amount} pounds was due {days_ago} days ago. Are you able to make this payment today?",
                'voice': 'Polly.Amy',
                'language': 'en-GB'
            },
            'negotiation': {
                'cannot_pay_full': "I understand you cannot pay the full amount today. What amount would you be able to pay right now as a good faith payment?",
                'payment_plan': "Would you be able to commit to paying {suggested_amount} pounds today, and the remaining balance in {installments} weekly installments?",
                'when_pay': "When would you be able to pay the full amount of {amount} pounds?",
                'partial_accepted': "Thank you. I'm recording that you've committed to pay {agreed_amount} pounds by {agreed_date}. You'll receive an SMS confirmation shortly."
            },
            'closing': {
                'success': "Thank you for your cooperation. The payment details have been sent to you via SMS. Have a good day.",
                'failed': "I'm sorry we couldn't reach an agreement today. This matter will be escalated to our collections team. You will receive a formal notice within 24 hours.",
                'voicemail': "This is {company} calling about an overdue invoice for {amount} pounds. Please call us immediately at {callback_number} to avoid further collection action."
            }
        }
    
    async def check_call_limits(self, user_id: str, tier: str) -> Tuple[bool, str]:
        """Check if user can make an AI call within limits"""
        
        # Check tier limits
        limits = {
            'starter': 0,
            'growth': 10,
            'pro': 50
        }
        
        if tier not in limits or limits[tier] == 0:
            return False, f"AI calls not available in {tier} tier"
        
        # Check monthly usage
        month_key = f"ai_calls:{user_id}:{datetime.now().strftime('%Y-%m')}"
        current_usage = int(await redis_client.get(month_key) or 0)

        if current_usage >= limits[tier]:
            return False, f"Monthly AI call limit reached ({limits[tier]} calls)"

        # Check daily limit
        day_key = f"ai_calls:daily:{user_id}:{datetime.now().strftime('%Y-%m-%d')}"
        daily_usage = int(await redis_client.get(day_key) or 0)
        daily_limits = {'starter': 0, 'growth': 2, 'pro': 5}
        
        if daily_usage >= daily_limits[tier]:
            return False, f"Daily AI call limit reached ({daily_limits[tier]} calls)"
        
        # Check cost limits
        estimated_cost = self.cost_per_minute * 2  # Assume 2-minute average call
        cost_check = await self.check_cost_limit(user_id, estimated_cost)
        
        if not cost_check[0]:
            return False, cost_check[1]
        
        return True, "OK"
    
    async def check_cost_limit(self, user_id: str, estimated_cost: float) -> Tuple[bool, str]:
        """Check if call would exceed cost limits"""
        
        day_key = f"daily_cost:{user_id}:{datetime.now().strftime('%Y-%m-%d')}"
        current_spend = float(await redis_client.get(day_key) or 0)
        
        # Get user tier for limit
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT tier FROM users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                tier = user['tier'] if user else 'starter'
        
        daily_limits = {'starter': 5.0, 'growth': 25.0, 'pro': 100.0}
        limit = daily_limits.get(tier, 5.0)
        
        if current_spend + estimated_cost > limit:
            return False, f"Daily spend limit would be exceeded (£{current_spend + estimated_cost:.2f} > £{limit:.2f})"
        
        # Warn at 80%
        if current_spend + estimated_cost > limit * 0.8:
            logger.warning(f"User {user_id} approaching daily spend limit: £{current_spend + estimated_cost:.2f} / £{limit:.2f}")
        
        return True, "OK"
    
    async def initiate_call(self, invoice: Invoice) -> Dict:
        """Initiate an AI collection call"""
        
        # Check limits
        can_call, reason = await self.check_call_limits(invoice.user_id, 'pro')  # Get actual tier
        if not can_call:
            logger.error(f"Cannot initiate call for invoice {invoice.id}: {reason}")
            return {'success': False, 'error': reason}
        
        try:
            # Generate call context
            context = self.prepare_call_context(invoice)
            
            # Store context in Redis for webhook handling
            context_key = f"call_context:{invoice.id}:{datetime.now().timestamp()}"
            await redis_client.setex(
                context_key,
                300,  # 5 minutes TTL
                json.dumps(context)
            )
            
            # Initiate call via Twilio
            call = twilio_client.calls.create(
                to=invoice.client_phone,
                from_=self.twilio_phone,
                url=f"{self.webhook_base}/webhooks/twilio/ai-collect",
                status_callback=f"{self.webhook_base}/webhooks/twilio/call-status",
                status_callback_event=['initiated', 'ringing', 'answered', 'completed'],
                status_callback_method='POST',
                timeout=30,  # Ring for max 30 seconds
                time_limit=self.max_call_duration,
                machine_detection='DetectMessageEnd',
                async_amd=True,
                send_digits='wwww',  # Wait before speaking
                record=True,  # Record for compliance
                recording_status_callback=f"{self.webhook_base}/webhooks/twilio/recording",
                metadata={
                    'invoice_id': invoice.id,
                    'context_key': context_key
                }
            )
            
            # Increment usage counters
            await self.increment_usage(invoice.user_id)
            
            # Log call initiation
            await self.log_call_attempt(invoice.id, call.sid, 'initiated')
            
            return {
                'success': True,
                'call_sid': call.sid,
                'estimated_cost': self.cost_per_minute * 2
            }
            
        except Exception as e:
            logger.error(f"Failed to initiate call: {e}")
            return {'success': False, 'error': str(e)}
    
    def prepare_call_context(self, invoice: Invoice) -> Dict:
        """Prepare context for AI call"""
        
        # Calculate negotiation parameters
        min_payment = max(invoice.amount * 0.3, 50)  # 30% or £50 minimum
        max_discount = min(invoice.amount * 0.1, 100)  # 10% or £100 max discount
        suggested_installments = 3 if invoice.amount > 500 else 2
        
        return {
            'invoice_id': invoice.id,
            'customer_name': invoice.client_name,
            'amount': invoice.amount,
            'days_overdue': invoice.days_overdue,
            'min_acceptable_payment': min_payment,
            'max_discount': max_discount,
            'suggested_installments': suggested_installments,
            'payment_history': invoice.payment_history,
            'dispute_status': invoice.dispute_status,
            'escalation_stage': invoice.collection_stage,
            'callback_number': os.environ.get('COMPANY_PHONE'),
            'company_name': os.environ.get('COMPANY_NAME'),
            'payment_url': f"{os.environ.get('PAYMENT_BASE_URL')}/pay/{invoice.id}"
        }
    
    async def handle_customer_response(self, call_sid: str, speech_text: str, context: Dict) -> str:
        """Process customer speech and generate appropriate response"""
        
        try:
            # Use GPT-4 to understand and respond
            response = await openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are a professional debt collector for {context['company_name']}. 
                        You must be firm but polite. Your goal is to collect payment for an overdue invoice.
                        
                        Invoice amount: £{context['amount']}
                        Days overdue: {context['days_overdue']}
                        Minimum acceptable payment: £{context['min_acceptable_payment']}
                        Maximum discount allowed: £{context['max_discount']}
                        
                        IMPORTANT RULES:
                        1. Always try to get payment commitment today
                        2. If customer can't pay full amount, negotiate partial payment
                        3. If customer disputes, note it but still try to collect undisputed portion
                        4. If customer already paid, ask for payment confirmation details
                        5. Record any payment commitment with specific date and amount
                        6. Be understanding but persistent
                        7. Keep responses under 50 words
                        8. If customer is hostile or abusive, politely end the call
                        
                        Respond in a clear, professional British English manner."""
                    },
                    {
                        "role": "user",
                        "content": f"Customer said: {speech_text}"
                    }
                ],
                temperature=0.3,  # Low temperature for consistency
                max_tokens=100
            )
            
            ai_response = response.choices[0].message.content
            
            # Log the interaction
            await self.log_conversation(call_sid, speech_text, ai_response)
            
            # Check for payment commitment in response
            if any(word in ai_response.lower() for word in ['commit', 'agree', 'pay', 'confirmed']):
                await self.record_payment_commitment(context['invoice_id'], speech_text, ai_response)
            
            return ai_response
            
        except Exception as e:
            logger.error(f"Error handling customer response: {e}")
            return "I apologize, but I'm having technical difficulties. A human agent will contact you shortly."
    
    async def record_payment_commitment(self, invoice_id: str, customer_speech: str, ai_response: str):
        """Record payment commitment from call"""
        
        try:
            # Extract commitment details using GPT
            extraction = await openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": """Extract payment commitment details from the conversation.
                        Return JSON with: 
                        - amount: committed amount in GBP
                        - date: payment date (YYYY-MM-DD format)
                        - type: 'full', 'partial', or 'installment'
                        - confidence: 0-1 score
                        If no clear commitment, return null."""
                    },
                    {
                        "role": "user",
                        "content": f"Customer: {customer_speech}\nAgent: {ai_response}"
                    }
                ],
                temperature=0,
                response_format={"type": "json_object"}
            )
            
            commitment = json.loads(extraction.choices[0].message.content)
            
            if commitment and commitment.get('confidence', 0) > 0.7:
                with get_db() as conn:
                    with conn.cursor() as cur:
                        cur.execute("""
                            INSERT INTO payment_commitments 
                            (invoice_id, amount, payment_date, type, source, confidence, transcript, created_at)
                            VALUES (%s, %s, %s, %s, 'ai_call', %s, %s, NOW())
                        """, (
                            invoice_id,
                            commitment['amount'],
                            commitment['date'],
                            commitment['type'],
                            commitment['confidence'],
                            json.dumps({'customer': customer_speech, 'agent': ai_response})
                        ))
                        conn.commit()
                
                # Send confirmation SMS
                await self.send_commitment_sms(invoice_id, commitment)
                
        except Exception as e:
            logger.error(f"Failed to record payment commitment: {e}")
    
    async def increment_usage(self, user_id: str):
        """Increment AI call usage counters"""

        # Monthly counter
        month_key = f"ai_calls:{user_id}:{datetime.now().strftime('%Y-%m')}"
        await redis_client.incr(month_key)
        await redis_client.expire(month_key, 31 * 24 * 60 * 60)  # 31 days

        # Daily counter
        day_key = f"ai_calls:daily:{user_id}:{datetime.now().strftime('%Y-%m-%d')}"
        await redis_client.incr(day_key)
        await redis_client.expire(day_key, 24 * 60 * 60)  # 24 hours

        # Cost tracking
        cost_key = f"daily_cost:{user_id}:{datetime.now().strftime('%Y-%m-%d')}"
        await redis_client.incrbyfloat(cost_key, self.cost_per_minute * 2)  # Assume 2-min call
        await redis_client.expire(cost_key, 24 * 60 * 60)
    
    async def log_call_attempt(self, invoice_id: str, call_sid: str, status: str):
        """Log call attempt to database"""
        
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO collection_events 
                    (invoice_id, event_type, event_status, call_sid, cost, created_at)
                    VALUES (%s, 'ai_call', %s, %s, %s, NOW())
                """, (invoice_id, status, call_sid, self.cost_per_minute * 2))
                conn.commit()
    
    async def log_conversation(self, call_sid: str, customer_speech: str, ai_response: str):
        """Log conversation turn to database"""
        
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO call_transcripts 
                    (call_sid, speaker, text, timestamp)
                    VALUES 
                    (%s, 'customer', %s, NOW()),
                    (%s, 'ai', %s, NOW())
                """, (call_sid, customer_speech, call_sid, ai_response))
                conn.commit()
    
    async def send_commitment_sms(self, invoice_id: str, commitment: Dict):
        """Send SMS confirmation of payment commitment"""
        
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT i.*, c.phone 
                    FROM invoices i
                    JOIN clients c ON i.client_id = c.id
                    WHERE i.id = %s
                """, (invoice_id,))
                invoice = cur.fetchone()
        
        if invoice and invoice['phone']:
            message = f"""Payment confirmation:
Amount: £{commitment['amount']}
Due by: {commitment['date']}
Pay at: {os.environ.get('PAYMENT_BASE_URL')}/pay/{invoice_id}
Reply STOP to opt out"""
            
            twilio_client.messages.create(
                to=invoice['phone'],
                from_=self.twilio_phone,
                body=message
            )


class PaymentPredictor:
    """ML model to predict payment likelihood and optimize collection strategy"""
    
    def __init__(self):
        self.model = None
        self.feature_names = [
            'amount', 'days_overdue', 'previous_late_payments',
            'client_age_days', 'industry_code', 'collection_stage',
            'previous_disputes', 'payment_method_on_file',
            'email_opens', 'sms_responses', 'partial_payments'
        ]
        self.load_or_train_model()
    
    def load_or_train_model(self):
        """Load existing model or train new one"""
        
        model_path = 'models/payment_predictor.pkl'
        
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            logger.info("Loaded existing payment prediction model")
        else:
            self.train_model()
    
    def train_model(self):
        """Train payment prediction model on historical data"""
        
        try:
            # Get training data
            X, y = self.prepare_training_data()
            
            # Train Random Forest
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42
            )
            
            self.model.fit(X, y)
            
            # Save model
            os.makedirs('models', exist_ok=True)
            joblib.dump(self.model, 'models/payment_predictor.pkl')
            
            logger.info(f"Trained payment prediction model with {len(X)} samples")
            
        except Exception as e:
            logger.error(f"Failed to train model: {e}")
            # Use simple rule-based fallback
            self.model = None
    
    def prepare_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and labels from historical data"""
        
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        i.amount,
                        i.days_overdue,
                        COUNT(DISTINCT p.id) as previous_late_payments,
                        EXTRACT(DAY FROM NOW() - c.created_at) as client_age_days,
                        COALESCE(c.industry_code, 0) as industry_code,
                        i.collection_stage,
                        COUNT(DISTINCT d.id) as previous_disputes,
                        CASE WHEN c.payment_method_id IS NOT NULL THEN 1 ELSE 0 END as payment_method_on_file,
                        COUNT(DISTINCT e.id) FILTER (WHERE e.opened = true) as email_opens,
                        COUNT(DISTINCT s.id) FILTER (WHERE s.responded = true) as sms_responses,
                        COUNT(DISTINCT pp.id) as partial_payments,
                        CASE WHEN i.paid_date IS NOT NULL THEN 1 ELSE 0 END as was_paid
                    FROM invoices i
                    LEFT JOIN clients c ON i.client_id = c.id
                    LEFT JOIN payments p ON p.client_id = c.id AND p.late = true
                    LEFT JOIN disputes d ON d.client_id = c.id
                    LEFT JOIN email_events e ON e.invoice_id = i.id
                    LEFT JOIN sms_events s ON s.invoice_id = i.id
                    LEFT JOIN partial_payments pp ON pp.invoice_id = i.id
                    WHERE i.due_date < NOW() - INTERVAL '60 days'
                    GROUP BY i.id, c.id
                    LIMIT 10000
                """)
                
                data = cur.fetchall()
        
        if not data:
            # Return dummy data if no historical data
            return np.array([[0] * len(self.feature_names)]), np.array([0])
        
        # Convert to numpy arrays
        features = []
        labels = []
        
        for row in data:
            features.append([
                row['amount'],
                row['days_overdue'],
                row['previous_late_payments'],
                row['client_age_days'] or 0,
                row['industry_code'] or 0,
                row['collection_stage'],
                row['previous_disputes'],
                row['payment_method_on_file'],
                row['email_opens'],
                row['sms_responses'],
                row['partial_payments']
            ])
            labels.append(row['was_paid'])
        
        return np.array(features), np.array(labels)
    
    def predict_payment_probability(self, invoice: Invoice) -> float:
        """Predict probability of payment for an invoice"""
        
        if self.model is None:
            # Fallback to rule-based prediction
            return self.rule_based_prediction(invoice)
        
        try:
            # Prepare features
            features = self.extract_features(invoice)
            
            # Predict probability
            prob = self.model.predict_proba([features])[0][1]
            
            return float(prob)
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return self.rule_based_prediction(invoice)
    
    def extract_features(self, invoice: Invoice) -> List[float]:
        """Extract features from invoice for prediction"""
        
        # Get additional data
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        COUNT(DISTINCT p.id) as previous_late_payments,
                        EXTRACT(DAY FROM NOW() - c.created_at) as client_age_days,
                        COALESCE(c.industry_code, 0) as industry_code,
                        COUNT(DISTINCT d.id) as previous_disputes,
                        CASE WHEN c.payment_method_id IS NOT NULL THEN 1 ELSE 0 END as payment_method_on_file,
                        COUNT(DISTINCT e.id) FILTER (WHERE e.opened = true) as email_opens,
                        COUNT(DISTINCT s.id) FILTER (WHERE s.responded = true) as sms_responses,
                        COUNT(DISTINCT pp.id) as partial_payments
                    FROM clients c
                    LEFT JOIN payments p ON p.client_id = c.id AND p.late = true
                    LEFT JOIN disputes d ON d.client_id = c.id
                    LEFT JOIN email_events e ON e.invoice_id = %s
                    LEFT JOIN sms_events s ON s.invoice_id = %s
                    LEFT JOIN partial_payments pp ON pp.invoice_id = %s
                    WHERE c.id = %s
                    GROUP BY c.id
                """, (invoice.id, invoice.id, invoice.id, invoice.client_id))
                
                data = cur.fetchone()
        
        return [
            invoice.amount,
            invoice.days_overdue,
            data['previous_late_payments'] if data else 0,
            data['client_age_days'] if data else 0,
            data['industry_code'] if data else 0,
            invoice.collection_stage,
            data['previous_disputes'] if data else 0,
            data['payment_method_on_file'] if data else 0,
            data['email_opens'] if data else 0,
            data['sms_responses'] if data else 0,
            data['partial_payments'] if data else 0
        ]
    
    def rule_based_prediction(self, invoice: Invoice) -> float:
        """Simple rule-based fallback prediction"""
        
        score = 0.5  # Base probability
        
        # Adjust based on days overdue
        if invoice.days_overdue < 15:
            score += 0.2
        elif invoice.days_overdue < 30:
            score += 0.1
        elif invoice.days_overdue > 60:
            score -= 0.3
        
        # Adjust based on amount
        if invoice.amount < 100:
            score += 0.1
        elif invoice.amount > 1000:
            score -= 0.1
        
        # Adjust based on dispute
        if invoice.dispute_status:
            score -= 0.2
        
        # Ensure valid probability
        return max(0.1, min(0.9, score))
    
    def recommend_collection_strategy(self, invoice: Invoice) -> Dict:
        """Recommend optimal collection strategy based on prediction"""
        
        payment_prob = self.predict_payment_probability(invoice)
        
        strategy = {
            'payment_probability': payment_prob,
            'recommended_action': None,
            'urgency': None,
            'estimated_recovery': invoice.amount * payment_prob
        }
        
        if payment_prob > 0.7:
            # High probability - gentle approach
            strategy['recommended_action'] = 'gentle_reminder'
            strategy['urgency'] = 'low'
            strategy['message'] = "Customer likely to pay with gentle reminder"
            
        elif payment_prob > 0.4:
            # Medium probability - standard escalation
            strategy['recommended_action'] = 'standard_escalation'
            strategy['urgency'] = 'medium'
            strategy['message'] = "Follow standard collection timeline"
            
        elif payment_prob > 0.2:
            # Low probability - aggressive approach
            strategy['recommended_action'] = 'immediate_escalation'
            strategy['urgency'] = 'high'
            strategy['message'] = "Consider immediate phone call or letter"
            
        else:
            # Very low probability - consider write-off
            strategy['recommended_action'] = 'evaluate_writeoff'
            strategy['urgency'] = 'critical'
            strategy['message'] = "Consider debt sale or write-off"
            
            # Calculate write-off vs collection cost
            collection_cost = self.estimate_collection_cost(invoice)
            if collection_cost > invoice.amount * 0.3:
                strategy['cost_benefit'] = 'negative'
                strategy['recommendation'] = 'write_off'
        
        return strategy
    
    def estimate_collection_cost(self, invoice: Invoice) -> float:
        """Estimate cost to collect this invoice"""
        
        base_cost = 5.0  # £5 base cost
        
        # Add costs per action
        costs = {
            'email': 0.10,
            'sms': 0.20,
            'ai_call': 2.50,
            'letter': 1.50,
            'agency': invoice.amount * 0.25  # 25% commission
        }
        
        # Estimate actions needed based on stage
        if invoice.days_overdue < 30:
            estimated_cost = base_cost + costs['email'] * 3 + costs['sms'] * 2
        elif invoice.days_overdue < 60:
            estimated_cost = base_cost + costs['email'] * 5 + costs['sms'] * 3 + costs['ai_call'] * 2
        else:
            estimated_cost = base_cost + costs['email'] * 5 + costs['sms'] * 3 + costs['ai_call'] * 3 + costs['letter'] + costs['agency']
        
        return estimated_cost


# Celery Tasks for async processing
@celery_app.task
def process_collection_escalation():
    """Daily task to process collection escalations"""
    
    with get_db() as conn:
        with conn.cursor() as cur:
            # Get all overdue invoices
            cur.execute("""
                SELECT i.*, c.name as client_name, c.email as client_email, 
                       c.phone as client_phone, u.tier as user_tier,
                       DATE_PART('day', NOW() - i.due_date) as days_overdue
                FROM invoices i
                JOIN clients c ON i.client_id = c.id
                JOIN users u ON i.user_id = u.id
                WHERE i.status = 'overdue' 
                  AND i.collection_status = 'active'
                  AND i.paid_date IS NULL
                ORDER BY i.due_date ASC
            """)
            
            invoices = cur.fetchall()
    
    handler = AIVoiceCallHandler()
    predictor = PaymentPredictor()
    
    for invoice_data in invoices:
        invoice = Invoice(
            id=invoice_data['id'],
            user_id=invoice_data['user_id'],
            client_id=invoice_data['client_id'],
            amount=invoice_data['amount'],
            currency=invoice_data['currency'],
            due_date=invoice_data['due_date'],
            days_overdue=int(invoice_data['days_overdue']),
            client_name=invoice_data['client_name'],
            client_email=invoice_data['client_email'],
            client_phone=invoice_data['client_phone'],
            collection_stage=invoice_data.get('collection_stage', 0),
            payment_history=[],
            dispute_status=invoice_data.get('dispute_status')
        )
        
        # Get collection strategy
        strategy = predictor.recommend_collection_strategy(invoice)
        
        # Determine action based on days overdue and strategy
        action = determine_collection_action(invoice, strategy, invoice_data['user_tier'])
        
        if action:
            execute_collection_action.delay(invoice.id, action)


@celery_app.task
def execute_collection_action(invoice_id: str, action: str):
    """Execute a specific collection action"""
    
    # Implementation for each action type
    # This would call the appropriate handler based on action
    pass


async def determine_collection_action(invoice: Invoice, strategy: Dict, user_tier: str) -> Optional[str]:
    """Determine which collection action to take"""

    # Check what actions have already been taken today
    action_key = f"collection_action:{invoice.id}:{datetime.now().strftime('%Y-%m-%d')}"
    if await redis_client.exists(action_key):
        return None  # Already acted today
    
    # Map days overdue to actions based on tier
    action_map = {
        7: 'gentle_email',
        14: 'firm_email',
        15: 'first_sms' if user_tier in ['growth', 'pro'] else None,
        20: 'second_reminder',
        25: 'first_ai_call' if user_tier in ['growth', 'pro'] else None,
        30: 'final_notice',
        35: 'second_ai_call' if user_tier == 'pro' else None,
        40: 'physical_letter' if user_tier in ['growth', 'pro'] else None,
        45: 'final_ai_call' if user_tier == 'pro' else None,
        50: 'agency_referral' if user_tier == 'pro' else None
    }
    
    # Check if we should act today
    action = action_map.get(invoice.days_overdue)
    
    # Override with strategy recommendation if urgent
    if strategy['urgency'] in ['high', 'critical'] and strategy['payment_probability'] < 0.3:
        if invoice.days_overdue >= 20 and user_tier in ['growth', 'pro']:
            action = 'immediate_ai_call'
    
    return action


if __name__ == "__main__":
    # Run tests or initialization
    logger.info("AI Collection System initialized")

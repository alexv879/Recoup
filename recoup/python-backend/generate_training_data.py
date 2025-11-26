"""
Synthetic Training Data Generator

Generates realistic payment prediction training data with:
- Multiple client archetypes (fast payers, slow payers, non-payers)
- Seasonal patterns
- Engagement correlations
- Invoice complexity effects
"""

import random
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any


def generate_synthetic_data(num_samples: int = 500) -> List[Dict[str, Any]]:
    """
    Generate synthetic payment training data

    Client Archetypes:
    - Fast Payer (30%): Pays in 5-15 days, high engagement
    - Reliable Payer (40%): Pays in 20-35 days, medium engagement
    - Slow Payer (20%): Pays in 40-70 days, low engagement
    - Non-Payer (10%): Never pays, very low engagement
    """

    samples = []

    # Define client archetypes
    archetypes = [
        {
            'name': 'fast_payer',
            'weight': 0.30,
            'payment_time_range': (5, 15),
            'payment_rate': 0.98,
            'engagement': {'email_open': (0.7, 0.95), 'sms_response': (0.6, 0.9), 'call_answer': (0.5, 0.8)},
            'payment_variance': (2, 5),
        },
        {
            'name': 'reliable_payer',
            'weight': 0.40,
            'payment_time_range': (20, 35),
            'payment_rate': 0.85,
            'engagement': {'email_open': (0.4, 0.7), 'sms_response': (0.3, 0.6), 'call_answer': (0.2, 0.5)},
            'payment_variance': (5, 10),
        },
        {
            'name': 'slow_payer',
            'weight': 0.20,
            'payment_time_range': (40, 70),
            'payment_rate': 0.65,
            'engagement': {'email_open': (0.2, 0.4), 'sms_response': (0.1, 0.3), 'call_answer': (0.05, 0.2)},
            'payment_variance': (10, 20),
        },
        {
            'name': 'non_payer',
            'weight': 0.10,
            'payment_time_range': (90, 180),  # Eventually paid or written off
            'payment_rate': 0.15,
            'engagement': {'email_open': (0.0, 0.1), 'sms_response': (0.0, 0.05), 'call_answer': (0.0, 0.05)},
            'payment_variance': (20, 40),
        },
    ]

    for i in range(num_samples):
        # Select archetype
        archetype = random.choices(archetypes, weights=[a['weight'] for a in archetypes])[0]

        # Generate client history
        client_invoice_count = random.randint(1, 20)
        client_avg_payment_time = random.randint(*archetype['payment_time_range'])
        client_payment_variance = random.randint(*archetype['payment_variance'])
        client_payment_rate = archetype['payment_rate'] + random.uniform(-0.1, 0.1)
        client_payment_rate = max(0.0, min(1.0, client_payment_rate))

        # Invoice characteristics
        invoice_amount = random.choice([
            random.uniform(100, 500),      # Small invoices
            random.uniform(500, 2000),     # Medium invoices
            random.uniform(2000, 10000),   # Large invoices
        ])

        invoice_age = random.randint(1, 90)
        days_overdue = max(0, invoice_age - 30)  # Assume 30-day payment terms
        days_since_last_reminder = random.randint(0, min(invoice_age, 30))

        # Client total paid (correlated with invoice count)
        client_total_paid = client_invoice_count * random.uniform(500, 3000)
        client_avg_invoice_amount = client_total_paid / max(client_invoice_count, 1)

        # Engagement metrics (correlated with archetype)
        email_open_rate = random.uniform(*archetype['engagement']['email_open'])
        email_click_rate = email_open_rate * random.uniform(0.2, 0.5)  # Click rate < open rate
        sms_response_rate = random.uniform(*archetype['engagement']['sms_response'])
        call_answer_rate = random.uniform(*archetype['engagement']['call_answer'])

        total_comms = random.randint(1, 10)
        days_since_last_engagement = random.randint(0, min(invoice_age, 20))

        # Invoice-specific patterns
        is_recurring = random.random() < 0.3
        has_payment_plan = random.random() < 0.15
        has_dispute_history = random.random() < 0.1

        # Invoice complexity (number of line items)
        invoice_complexity = random.randint(1, 10)

        # Temporal features
        day_of_week = random.randint(0, 6)
        day_of_month = random.randint(1, 28)
        month_of_year = random.randint(1, 12)
        is_end_of_month = day_of_month >= 25
        is_end_of_quarter = month_of_year in [3, 6, 9, 12] and is_end_of_month

        # Calculate actual payment time based on archetype + noise
        base_payment_time = client_avg_payment_time

        # Modifiers
        if invoice_amount > 5000:
            base_payment_time += random.randint(5, 15)  # Large invoices take longer

        if is_recurring:
            base_payment_time -= random.randint(3, 7)  # Recurring invoices paid faster

        if has_payment_plan:
            base_payment_time += random.randint(10, 20)  # Payment plans extend time

        if has_dispute_history:
            base_payment_time += random.randint(15, 30)  # Disputes delay payment

        # Seasonal effects (faster at end of month/quarter)
        if is_end_of_month:
            base_payment_time -= random.randint(2, 5)

        if is_end_of_quarter:
            base_payment_time -= random.randint(3, 8)

        # Add noise
        noise = random.randint(-client_payment_variance, client_payment_variance)
        actual_payment_time = max(1, base_payment_time + noise)

        # Determine if paid
        was_paid = random.random() < client_payment_rate

        # If not paid, set very high payment time
        if not was_paid:
            actual_payment_time = random.randint(90, 365)

        # Create training sample
        sample = {
            'features': {
                # Invoice characteristics
                'invoiceAmount': round(invoice_amount, 2),
                'invoiceAge': invoice_age,
                'daysOverdue': days_overdue,
                'daysSinceLastReminder': days_since_last_reminder,

                # Client historical behavior
                'clientPreviousInvoiceCount': client_invoice_count,
                'clientAveragePaymentTime': client_avg_payment_time,
                'clientPaymentVariance': client_payment_variance,
                'clientTotalPaid': round(client_total_paid, 2),
                'clientPaymentRate': round(client_payment_rate, 3),
                'clientAverageInvoiceAmount': round(client_avg_invoice_amount, 2),

                # Communication engagement
                'emailOpenRate': round(email_open_rate, 3),
                'emailClickRate': round(email_click_rate, 3),
                'smsResponseRate': round(sms_response_rate, 3),
                'callAnswerRate': round(call_answer_rate, 3),
                'totalCommunicationsSent': total_comms,
                'daysSinceLastEngagement': days_since_last_engagement,

                # Invoice-specific patterns
                'isRecurringInvoice': is_recurring,
                'hasPaymentPlan': has_payment_plan,
                'hasDisputeHistory': has_dispute_history,
                'invoiceComplexity': invoice_complexity,

                # Temporal features
                'dayOfWeek': day_of_week,
                'dayOfMonth': day_of_month,
                'monthOfYear': month_of_year,
                'isEndOfMonth': is_end_of_month,
                'isEndOfQuarter': is_end_of_quarter,
            },
            'actualDaysToPayment': actual_payment_time,
            'wasPaid': was_paid,
            'archetype': archetype['name'],
            'timestamp': (datetime.utcnow() - timedelta(days=random.randint(0, 365))).isoformat(),
        }

        samples.append(sample)

    return samples


def save_training_data(samples: List[Dict[str, Any]], filename: str = 'training_data.json'):
    """Save training data to file"""
    import os
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(model_dir, exist_ok=True)

    filepath = os.path.join(model_dir, filename)
    with open(filepath, 'w') as f:
        json.dump(samples, f, indent=2)

    print(f"Saved {len(samples)} training samples to {filepath}")

    # Print statistics
    paid_count = sum(1 for s in samples if s['wasPaid'])
    unpaid_count = len(samples) - paid_count

    archetypes = {}
    for sample in samples:
        arch = sample.get('archetype', 'unknown')
        archetypes[arch] = archetypes.get(arch, 0) + 1

    print(f"\nStatistics:")
    print(f"  Total samples: {len(samples)}")
    print(f"  Paid: {paid_count} ({paid_count/len(samples)*100:.1f}%)")
    print(f"  Unpaid: {unpaid_count} ({unpaid_count/len(samples)*100:.1f}%)")
    print(f"\n  Archetypes:")
    for arch, count in archetypes.items():
        print(f"    {arch}: {count} ({count/len(samples)*100:.1f}%)")

    if paid_count > 0:
        avg_payment_time = sum(s['actualDaysToPayment'] for s in samples if s['wasPaid']) / paid_count
        print(f"\n  Average payment time (paid invoices): {avg_payment_time:.1f} days")


if __name__ == '__main__':
    # Generate 1000 synthetic training samples
    print("Generating synthetic payment prediction training data...")
    samples = generate_synthetic_data(1000)
    save_training_data(samples)
    print("\nDone!")

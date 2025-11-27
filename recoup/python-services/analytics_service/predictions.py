"""
ML-based Predictions Module
Uses statistical models and machine learning for forecasting
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from collections import defaultdict

from models import InvoiceData, PredictionResponse

logger = logging.getLogger(__name__)

# Try to import advanced forecasting libraries
try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    logger.warning("statsmodels not available, using simple forecasting")


def forecast_revenue(
    invoices: List[InvoiceData],
    months_ahead: int = 6
) -> Optional[Dict[str, Any]]:
    """
    Forecast revenue using time series analysis

    Uses Exponential Smoothing if available, otherwise simple moving average

    Args:
        invoices: List of invoice data
        months_ahead: Number of months to forecast

    Returns:
        Prediction dict or None if insufficient data
    """
    # Get paid invoices with paid dates
    paid_invoices = [inv for inv in invoices if inv.status == 'paid' and inv.paid_at]

    if len(paid_invoices) < 3:
        return None

    # Group by month
    monthly_revenue = defaultdict(float)
    for inv in paid_invoices:
        month_key = inv.paid_at.strftime('%Y-%m')
        monthly_revenue[month_key] += inv.amount

    if len(monthly_revenue) < 3:
        return None

    # Convert to sorted list
    sorted_months = sorted(monthly_revenue.items())
    revenues = [amount for _, amount in sorted_months]

    # Calculate forecast
    if STATSMODELS_AVAILABLE and len(revenues) >= 6:
        # Use Exponential Smoothing for better accuracy
        try:
            model = ExponentialSmoothing(
                revenues,
                trend='add',
                seasonal=None,
                seasonal_periods=None
            )
            fitted = model.fit()
            forecast = fitted.forecast(steps=1)
            predicted_next_month = float(forecast[0])
        except Exception as e:
            logger.warning(f"Exponential smoothing failed, using simple average: {e}")
            predicted_next_month = np.mean(revenues[-3:])
    else:
        # Simple moving average
        predicted_next_month = np.mean(revenues[-3:])

    # Calculate trend
    if len(revenues) >= 2:
        recent_avg = np.mean(revenues[-3:])
        older_avg = np.mean(revenues[:-3]) if len(revenues) > 3 else revenues[0]
        trend = (recent_avg - older_avg) / older_avg if older_avg > 0 else 0
    else:
        trend = 0

    # Calculate confidence based on data points and variance
    confidence = min(0.95, 0.5 + (len(revenues) / 20))
    if len(revenues) >= 3:
        variance = np.var(revenues)
        mean = np.mean(revenues)
        cv = np.sqrt(variance) / mean if mean > 0 else 1  # Coefficient of variation
        confidence *= (1 - min(0.5, cv))  # Reduce confidence for high variability

    avg_monthly = np.mean(revenues)

    return {
        'type': 'revenue',
        'title': 'Next Month Revenue Forecast',
        'prediction': f'£{predicted_next_month:.2f}',
        'description': f"Based on {len(revenues)} months of data, predicting {'growth' if trend > 0 else 'decline'} of {abs(trend * 100):.1f}%.",
        'confidence': round(confidence, 2),
        'metrics': {
            'historical_avg': round(avg_monthly, 2),
            'predicted': round(predicted_next_month, 2),
            'trend_percent': round(trend * 100, 2),
            'data_points': len(revenues)
        }
    }


def predict_payment_timing(invoices: List[InvoiceData]) -> Optional[Dict[str, Any]]:
    """
    Predict average payment timing based on historical patterns

    Args:
        invoices: List of invoice data

    Returns:
        Prediction dict or None
    """
    paid_invoices = [
        inv for inv in invoices
        if inv.status == 'paid' and inv.paid_at and inv.invoice_date
    ]

    if len(paid_invoices) < 5:
        return None

    # Calculate payment days for each invoice
    payment_days = []
    for inv in paid_invoices:
        days = (inv.paid_at - inv.invoice_date).days
        if days >= 0:  # Ignore negative values (data issues)
            payment_days.append(days)

    if not payment_days:
        return None

    avg_days = np.mean(payment_days)
    median_days = np.median(payment_days)
    std_days = np.std(payment_days)
    fastest = min(payment_days)
    slowest = max(payment_days)

    confidence = min(0.9, len(paid_invoices) / 20)

    return {
        'type': 'payment_timing',
        'title': 'Average Payment Time',
        'prediction': f'{int(round(avg_days))} days',
        'description': f'Your clients typically pay within {int(round(avg_days))} days of invoice being sent (median: {int(median_days)} days).',
        'confidence': round(confidence, 2),
        'metrics': {
            'average_days': int(round(avg_days)),
            'median_days': int(median_days),
            'std_deviation': round(std_days, 2),
            'fastest_payment': fastest,
            'slowest_payment': slowest,
            'sample_size': len(payment_days)
        }
    }


def predict_recovery(invoices: List[InvoiceData]) -> Optional[Dict[str, Any]]:
    """
    Predict payment recovery rate for outstanding invoices

    Args:
        invoices: List of invoice data

    Returns:
        Prediction dict or None
    """
    outstanding = [inv for inv in invoices if inv.status not in ['paid', 'cancelled']]
    paid = [inv for inv in invoices if inv.status == 'paid']

    if len(outstanding) == 0:
        return None

    total_outstanding = sum(inv.amount for inv in outstanding)

    # Calculate historical recovery rate
    if len(invoices) > 0:
        recovery_rate = len(paid) / len(invoices)
    else:
        recovery_rate = 0.7  # Default assumption

    # Count overdue
    now = datetime.now()
    overdue_count = sum(1 for inv in outstanding if inv.due_date and inv.due_date < now)

    # Adjust recovery rate based on overdue status
    if overdue_count > 0:
        # Reduce expected recovery for overdue invoices
        overdue_factor = 1 - (overdue_count / len(outstanding)) * 0.3
        adjusted_rate = recovery_rate * overdue_factor
    else:
        adjusted_rate = recovery_rate

    expected_recovery = total_outstanding * adjusted_rate

    return {
        'type': 'recovery',
        'title': 'Expected Payment Recovery',
        'prediction': f'£{expected_recovery:.2f}',
        'description': f"Of £{total_outstanding:.2f} outstanding, expecting to recover {(adjusted_rate * 100):.0f}% based on historical patterns.",
        'confidence': 0.7,
        'metrics': {
            'total_outstanding': round(total_outstanding, 2),
            'expected_recovery': round(expected_recovery, 2),
            'overdue_count': overdue_count,
            'recovery_rate_percent': round(recovery_rate * 100, 2),
            'adjusted_rate_percent': round(adjusted_rate * 100, 2)
        }
    }


def predict_collections_success(invoices: List[InvoiceData]) -> Optional[Dict[str, Any]]:
    """
    Predict success rate for collections-enabled invoices

    Args:
        invoices: List of invoice data

    Returns:
        Prediction dict or None
    """
    collections_invoices = [inv for inv in invoices if inv.collections_enabled]
    successful_collections = [
        inv for inv in collections_invoices if inv.status == 'paid'
    ]

    if len(collections_invoices) < 3:
        return None

    success_rate = (len(successful_collections) / len(collections_invoices)) * 100

    # Find eligible invoices for collections
    now = datetime.now()
    outstanding = [inv for inv in invoices if inv.status not in ['paid', 'cancelled']]
    eligible = [
        inv for inv in outstanding
        if not inv.collections_enabled and inv.due_date and (now - inv.due_date).days >= 7
    ]

    if len(eligible) == 0:
        return None

    potential_amount = sum(inv.amount for inv in eligible)
    predicted_recovery = potential_amount * (success_rate / 100)

    confidence = min(0.85, len(collections_invoices) / 10)

    return {
        'type': 'collections',
        'title': 'Collections Potential',
        'prediction': f'£{predicted_recovery:.2f}',
        'description': f"{len(eligible)} invoice{'s' if len(eligible) > 1 else ''} eligible for collections. Historical success rate: {success_rate:.0f}%.",
        'confidence': round(confidence, 2),
        'metrics': {
            'eligible_count': len(eligible),
            'potential_amount': round(potential_amount, 2),
            'predicted_recovery': round(predicted_recovery, 2),
            'success_rate_percent': round(success_rate, 2),
            'historical_attempts': len(collections_invoices),
            'successful_attempts': len(successful_collections)
        }
    }


def analyze_client_patterns(
    invoices: List[InvoiceData],
    top_n: int = 5
) -> Optional[Dict[str, Any]]:
    """
    Analyze client patterns and identify best/worst clients

    Args:
        invoices: List of invoice data
        top_n: Number of top clients to return

    Returns:
        Prediction dict with client insights
    """
    # Group by client
    client_data = defaultdict(lambda: {
        'name': '',
        'email': '',
        'invoices': 0,
        'total_paid': 0.0,
        'payment_days': []
    })

    for inv in invoices:
        client = client_data[inv.client_email]
        client['name'] = inv.client_name
        client['email'] = inv.client_email
        client['invoices'] += 1

        if inv.status == 'paid' and inv.paid_at and inv.invoice_date:
            client['total_paid'] += inv.amount
            days = (inv.paid_at - inv.invoice_date).days
            if days >= 0:
                client['payment_days'].append(days)

    if not client_data:
        return None

    # Calculate averages
    client_list = []
    for email, data in client_data.items():
        avg_days = int(np.mean(data['payment_days'])) if data['payment_days'] else 0
        client_list.append({
            'name': data['name'],
            'email': email,
            'invoices': data['invoices'],
            'total_paid': data['total_paid'],
            'avg_days': avg_days
        })

    # Sort by total paid
    best_clients = sorted(client_list, key=lambda x: x['total_paid'], reverse=True)[:top_n]

    if not best_clients:
        return None

    top_client = best_clients[0]

    return {
        'type': 'client_value',
        'title': 'Top Client Insight',
        'prediction': top_client['name'],
        'description': f"Your best client with {top_client['invoices']} invoices (£{top_client['total_paid']:.2f} paid). Average payment: {top_client['avg_days']} days.",
        'confidence': 0.95,
        'metrics': {
            'name': top_client['name'],
            'invoices': top_client['invoices'],
            'total_paid': round(top_client['total_paid'], 2),
            'avg_days': top_client['avg_days'],
            'top_clients': [
                {
                    'name': c['name'],
                    'total_paid': round(c['total_paid'], 2),
                    'avg_days': c['avg_days']
                }
                for c in best_clients
            ]
        }
    }


def forecast_cashflow(
    invoices: List[InvoiceData],
    days_ahead: int = 30
) -> Optional[Dict[str, Any]]:
    """
    Forecast cashflow for the next N days

    Args:
        invoices: List of invoice data
        days_ahead: Number of days to forecast

    Returns:
        Prediction dict with cashflow forecast
    """
    now = datetime.now()
    future_date = now + timedelta(days=days_ahead)

    # Get sent invoices due within the period
    upcoming = [
        inv for inv in invoices
        if inv.status == 'sent' and inv.due_date and now < inv.due_date <= future_date
    ]

    if len(upcoming) == 0:
        return None

    total_expected = sum(inv.amount for inv in upcoming)
    avg_per_invoice = total_expected / len(upcoming)

    return {
        'type': 'cashflow',
        'title': f'Next {days_ahead} Days Cashflow',
        'prediction': f'£{total_expected:.2f}',
        'description': f"{len(upcoming)} invoice{'s' if len(upcoming) > 1 else ''} expected within {days_ahead} days.",
        'confidence': 0.75,
        'metrics': {
            'count': len(upcoming),
            'total_amount': round(total_expected, 2),
            'average_amount': round(avg_per_invoice, 2),
            'days_ahead': days_ahead
        }
    }

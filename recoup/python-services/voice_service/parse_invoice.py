"""
Invoice Parsing Module
Extracts structured invoice data from voice transcripts using NLP
"""

import re
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class InvoiceData:
    """Structured invoice data"""
    client_name: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "GBP"
    description: Optional[str] = None
    due_date: Optional[str] = None
    raw_transcript: str = ""
    confidence: float = 0.0


# Number word mappings
NUMBER_WORDS = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000, 'million': 1000000
}


def parse_invoice_from_transcript(transcript: str) -> Dict[str, Any]:
    """
    Parse invoice details from voice transcript

    Extracts:
    - Client name
    - Amount (numeric or written)
    - Currency
    - Description
    - Due date

    Args:
        transcript: Voice transcript text

    Returns:
        dict with parsed invoice data and confidence score
    """
    transcript = transcript.strip()

    if not transcript:
        return {
            "client_name": None,
            "amount": None,
            "currency": "GBP",
            "description": None,
            "due_date": None,
            "raw_transcript": "",
            "confidence": 0.0
        }

    parsed = {
        "raw_transcript": transcript,
        "client_name": None,
        "amount": None,
        "currency": "GBP",
        "description": None,
        "due_date": None
    }

    confidence_scores = []

    # Extract client name
    client_name, client_confidence = extract_client_name(transcript)
    if client_name:
        parsed["client_name"] = client_name
        confidence_scores.append(client_confidence)

    # Extract amount
    amount, amount_confidence = extract_amount(transcript)
    if amount:
        parsed["amount"] = amount
        confidence_scores.append(amount_confidence)

    # Extract currency
    currency = extract_currency(transcript)
    if currency:
        parsed["currency"] = currency

    # Extract description
    description, desc_confidence = extract_description(transcript)
    if description:
        parsed["description"] = description
        confidence_scores.append(desc_confidence)

    # Extract due date
    due_date, date_confidence = extract_due_date(transcript)
    if due_date:
        parsed["due_date"] = due_date
        confidence_scores.append(date_confidence)

    # Calculate overall confidence
    parsed["confidence"] = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0

    logger.info(f"Parsed invoice: {parsed['client_name']}, £{parsed['amount']}, confidence: {parsed['confidence']:.2f}")

    return parsed


def extract_client_name(transcript: str) -> tuple[Optional[str], float]:
    """
    Extract client name from transcript

    Patterns:
    - "invoice for John Smith"
    - "invoice to ABC Company"
    - "for client Jane Doe"

    Returns:
        (client_name, confidence)
    """
    patterns = [
        r'(?:invoice|bill)\s+(?:for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Ltd|Limited|Inc|LLC|Corp|Corporation|Company))?)',
        r'(?:for|to)\s+(?:client|customer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'(?:client|customer)\s+(?:is|named?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
    ]

    for pattern in patterns:
        match = re.search(pattern, transcript, re.IGNORECASE)
        if match:
            client_name = match.group(1).strip()
            # Higher confidence for longer names (more specific)
            confidence = min(0.95, 0.7 + (len(client_name.split()) * 0.1))
            return client_name, confidence

    return None, 0.0


def extract_amount(transcript: str) -> tuple[Optional[float], float]:
    """
    Extract invoice amount from transcript

    Handles:
    - Numeric: "500", "1,500.50", "£2000"
    - Written: "five hundred pounds", "one thousand five hundred"
    - Mixed: "1.5 thousand"

    Returns:
        (amount, confidence)
    """
    # Try numeric patterns first (higher confidence)
    numeric_patterns = [
        r'£?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:pounds?|gbp|£)?',
        r'\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',
        r'€\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',
    ]

    for pattern in numeric_patterns:
        match = re.search(pattern, transcript, re.IGNORECASE)
        if match:
            amount_str = match.group(1).replace(',', '')
            try:
                amount = float(amount_str)
                return amount, 0.95  # High confidence for numeric
            except ValueError:
                pass

    # Try written numbers
    amount = parse_written_number(transcript)
    if amount:
        return amount, 0.75  # Medium confidence for written

    return None, 0.0


def parse_written_number(text: str) -> Optional[float]:
    """
    Parse written numbers to numeric value

    Examples:
    - "five hundred" -> 500
    - "one thousand five hundred" -> 1500
    - "two point five thousand" -> 2500
    """
    text = text.lower()

    # Pattern for written numbers
    pattern = r'\b((?:' + '|'.join(NUMBER_WORDS.keys()) + r')+(?:\s+(?:' + '|'.join(NUMBER_WORDS.keys()) + r'))*)\b\s*(?:pounds?|dollars?|euros?)'

    match = re.search(pattern, text)
    if not match:
        return None

    words = match.group(1).split()
    total = 0
    current = 0

    for word in words:
        word = word.strip()
        if word in NUMBER_WORDS:
            value = NUMBER_WORDS[word]

            if value >= 100:
                # Multiplier
                if current == 0:
                    current = 1
                current *= value
            else:
                # Add to current
                current += value

    total += current

    return float(total) if total > 0 else None


def extract_currency(transcript: str) -> str:
    """
    Extract currency from transcript

    Returns:
        Currency code (GBP, USD, EUR)
    """
    text = transcript.lower()

    if re.search(r'\$|dollars?|usd', text):
        return 'USD'
    elif re.search(r'€|euros?|eur', text):
        return 'EUR'
    elif re.search(r'£|pounds?|gbp', text):
        return 'GBP'

    # Default to GBP
    return 'GBP'


def extract_description(transcript: str) -> tuple[Optional[str], float]:
    """
    Extract service description from transcript

    Patterns:
    - "for web design"
    - "regarding consultancy work"
    - "payment for software development"

    Returns:
        (description, confidence)
    """
    patterns = [
        r'(?:for|regarding|payment for|invoice for)\s+([a-z\s]+?)\s+(?:due|on|by|\.|$)',
        r'(?:service|work|project):\s*([a-z\s]+?)(?:\.|$)',
    ]

    for pattern in patterns:
        match = re.search(pattern, transcript, re.IGNORECASE)
        if match:
            description = match.group(1).strip()
            if len(description) > 3:  # Avoid single word descriptions
                return description, 0.8
            return description, 0.5

    return None, 0.0


def extract_due_date(transcript: str) -> tuple[Optional[str], float]:
    """
    Extract due date from transcript

    Patterns:
    - "due next week"
    - "due in 7 days"
    - "due by Friday"
    - "payment due next month"

    Returns:
        (ISO date string, confidence)
    """
    text = transcript.lower()
    today = datetime.now()

    # Relative dates
    if re.search(r'due\s+(?:in\s+)?(?:next\s+)?week', text):
        due_date = today + timedelta(days=7)
        return due_date.strftime('%Y-%m-%d'), 0.85

    if re.search(r'due\s+(?:in\s+)?(?:next\s+)?month', text):
        due_date = today + timedelta(days=30)
        return due_date.strftime('%Y-%m-%d'), 0.85

    # Specific days
    day_match = re.search(r'due\s+(?:in\s+)?(\d+)\s+days?', text)
    if day_match:
        days = int(day_match.group(1))
        due_date = today + timedelta(days=days)
        return due_date.strftime('%Y-%m-%d'), 0.95

    # Weekdays
    weekdays = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6
    }

    for day_name, day_num in weekdays.items():
        if re.search(rf'due\s+(?:by\s+)?(?:next\s+)?{day_name}', text):
            days_ahead = (day_num - today.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7  # Next week if same day
            due_date = today + timedelta(days=days_ahead)
            return due_date.strftime('%Y-%m-%d'), 0.9

    # Default: 30 days if "due" mentioned but no specific date
    if 'due' in text:
        due_date = today + timedelta(days=30)
        return due_date.strftime('%Y-%m-%d'), 0.5

    return None, 0.0

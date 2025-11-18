"""
Firebase Admin SDK Configuration
Converted from relay/lib/firebase.ts
"""

import os
import json
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore, storage
from google.cloud.firestore_v1 import Client


# Firebase app instance
_app: Optional[firebase_admin.App] = None
_db: Optional[Client] = None


def initialize_firebase() -> firebase_admin.App:
    """
    Initialize Firebase Admin SDK

    Returns:
        Firebase app instance
    """
    global _app, _db

    if _app is not None:
        return _app

    # Get credentials from environment variable or service account file
    service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')

    if service_account_json:
        # Load from JSON string (environment variable)
        try:
            service_account_dict = json.loads(service_account_json)
            cred = credentials.Certificate(service_account_dict)
        except json.JSONDecodeError:
            # Assume it's a file path
            cred = credentials.Certificate(service_account_json)
    else:
        # Use individual environment variables
        project_id = os.getenv('FIREBASE_PROJECT_ID')
        private_key = os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')
        client_email = os.getenv('FIREBASE_CLIENT_EMAIL')

        if not all([project_id, private_key, client_email]):
            raise ValueError(
                "Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON "
                "or FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL"
            )

        cred = credentials.Certificate({
            'type': 'service_account',
            'project_id': project_id,
            'private_key': private_key,
            'client_email': client_email,
        })

    _app = firebase_admin.initialize_app(cred)
    _db = firestore.client()

    return _app


def get_db() -> Client:
    """
    Get Firestore database client

    Returns:
        Firestore client instance
    """
    global _db

    if _db is None:
        initialize_firebase()

    return _db


def get_storage_bucket():
    """
    Get Firebase Storage bucket

    Returns:
        Storage bucket instance
    """
    if _app is None:
        initialize_firebase()

    return storage.bucket()


# Collection name constants
class Collections:
    """Firestore collection names"""
    USERS = 'users'
    INVOICES = 'invoices'
    PAYMENT_CONFIRMATIONS = 'payment_confirmations'
    PAYMENT_CLAIMS = 'payment_claims'
    COLLECTION_ATTEMPTS = 'collection_attempts'
    CLIENTS = 'clients'
    NOTIFICATIONS = 'notifications'
    TRANSACTIONS = 'transactions'
    REFERRALS = 'referrals'
    REFERRAL_CREDITS = 'referral_credits'
    REFERRAL_PAYOUTS = 'referral_payouts'
    USER_BEHAVIOR_PROFILE = 'user_behavior_profile'
    USER_STATS = 'user_stats'
    USER_EVENTS = 'user_events'
    DAILY_SUMMARIES = 'daily_summaries'
    EMAILS_SENT = 'emails_sent'
    ONBOARDING_PROGRESS = 'onboarding_progress'
    AGENCY_HANDOFFS = 'agency_handoffs'
    ESCALATION_STATES = 'escalation_states'
    ESCALATION_TIMELINE = 'escalation_timeline'


# Helper functions
def timestamp_to_datetime(timestamp):
    """
    Convert Firestore timestamp to Python datetime

    Args:
        timestamp: Firestore timestamp

    Returns:
        datetime object
    """
    if timestamp is None:
        return None
    return timestamp.to_datetime() if hasattr(timestamp, 'to_datetime') else timestamp


def datetime_to_timestamp(dt):
    """
    Convert Python datetime to Firestore timestamp

    Args:
        dt: datetime object

    Returns:
        Firestore timestamp
    """
    if dt is None:
        return None
    return firestore.SERVER_TIMESTAMP if dt == 'now' else dt


def get_server_timestamp():
    """Get server timestamp for Firestore"""
    return firestore.SERVER_TIMESTAMP

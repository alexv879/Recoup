#!/usr/bin/env python3
import os
from typing import List, Dict

# Optional: stripe + firebase admin
try:
    import stripe
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
except Exception:
    stripe = None

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except Exception:
    firebase_admin = None

PLAN_MAP = {
    'starter_monthly_v1': 'starter_monthly_v2',
    'pro_monthly_v1': 'pro_monthly_v2',
    'business_monthly_v1': 'pro_monthly_v2'
}


def initialize_firestore() -> object:
    key_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', 'firebase-service-account.json')
    if not os.path.exists(key_path) and firebase_admin is None:
        raise RuntimeError('Missing firebase-admin or service account json')
    if not firebase_admin._apps:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    return firestore.client()


def migrate_pricing(subscriptions: List[Dict], dry_run: bool = True):
    result = { 'migrated': 0, 'skipped': 0, 'errors': [] }
    for sub in subscriptions:
        target = PLAN_MAP.get(sub.get('legacyPlanId'))
        if not target:
            result['skipped'] += 1
            continue
        try:
            # Placeholder: Update stripe subscription here
            # For now, log to console
            print('[pricing-migration] simulate', sub.get('id'), '->', target)
            result['migrated'] += 1
        except Exception as e:
            result['errors'].append({'id': sub.get('id'), 'error': str(e)})
    return result


if __name__ == '__main__':
    # Example run
    subs = [
        {'id': 'sub_1', 'legacyPlanId': 'starter_monthly_v1'},
        {'id': 'sub_2', 'legacyPlanId': 'business_monthly_v1'},
    ]
    print(migrate_pricing(subs, dry_run=True))

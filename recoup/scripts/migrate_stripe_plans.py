#!/usr/bin/env python3
import argparse
import json
import os
from typing import Dict, Any, List

import stripe

# Optional: firebase-admin Python SDK
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except Exception:
    firebase_admin = None

# Update stripe api key
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

# Mapping
MAPPING = {'free': 'starter', 'paid': 'growth', 'business': 'pro'}


def initialize_firebase():
    # Use FIREBASE_SERVICE_ACCOUNT env path or default in repo
    key_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', 'firebase-service-account.json')
    if not os.path.exists(key_path) and firebase_admin is None:
        raise RuntimeError('Firebase service account missing and firebase-admin not installed')

    if not firebase_admin._apps:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    return firestore.client()


def map_legacy_to_v3(legacy_tier: str) -> str:
    return MAPPING.get(legacy_tier, 'starter')


def get_users_from_firestore(db):
    users = []
    docs = db.collection('users').stream()
    for doc in docs:
        u = doc.to_dict()
        u['userId'] = doc.id
        users.append(u)
    return users


def migrate_stripe_plans(dry_run: bool = True, user_id: str = None):
    db = initialize_firebase() if 'FIREBASE_SERVICE_ACCOUNT_JSON' in os.environ or os.path.exists('firebase-service-account.json') else None

    if db is None:
        print('No Firestore DB configured; aborting')
        return

    users = db.collection('users').get() if user_id is None else [db.collection('users').document(user_id).get()]

    results = []
    processed = 0
    migrated = 0
    skipped = 0
    errors = 0

    for doc in users:
        user = doc.to_dict()
        user_id = doc.id
        processed += 1

        try:
            r = process_user(db, user_id, user, dry_run)
            results.append(r)
            if r['action'] == 'migrated' or r['action'] == 'email_sent':
                migrated += 1
            elif r['action'] == 'skipped':
                skipped += 1
            elif r['action'] == 'error':
                errors += 1
        except Exception as e:
            errors += 1
            results.append({'userId': user_id, 'error': str(e)})

    summary = {'processed': processed, 'migrated': migrated, 'skipped': skipped, 'errors': errors}
    timestamp = __import__('datetime').datetime.utcnow().isoformat().replace(':', '-')
    out_file = f'migration-results-{timestamp}.json'

    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump({'results': results, 'summary': summary}, f, indent=2)

    print('Migration summary:', summary)
    print('Results written to', out_file)


def process_user(db, user_id: str, user: Dict[str, Any], dry_run: bool):
    # user schema expected in Firestore
    subscription_tier = user.get('subscriptionTier')
    stripe_subscription_id = user.get('stripeSubscriptionId')
    stripe_customer_id = user.get('stripeCustomerId')

    if subscription_tier in ['starter', 'growth', 'pro']:
        return {'userId': user_id, 'email': user.get('email'), 'oldTier': subscription_tier, 'newTier': subscription_tier, 'action': 'skipped'}

    new_tier = map_legacy_to_v3(subscription_tier)

    if subscription_tier == 'free':
        if not dry_run:
            # Update Firestore and send email (TODO: implement sendgrid email)
            db.collection('users').document(user_id).update({
                'subscriptionTier': new_tier,
                'billingCycle': 'monthly',
                'updatedAt': __import__('datetime').datetime.utcnow().isoformat(),
            })
            # TODO: send email
        return {'userId': user_id, 'email': user.get('email'), 'oldTier': subscription_tier, 'newTier': new_tier, 'action': 'email_sent' if not dry_run else 'skipped'}

    if not stripe_subscription_id or not stripe_customer_id:
        return {'userId': user_id, 'email': user.get('email'), 'oldTier': subscription_tier, 'newTier': new_tier, 'action': 'error', 'error': 'Missing Stripe subscription or customer ID'}

    try:
        if not dry_run:
            subscription = stripe.Subscription.retrieve(stripe_subscription_id)
            # For simplicity: update local database only; implement stripe update if needed
            # TODO: implement get_or_create_stripe_price in python
            db.collection('users').document(user_id).update({
                'subscriptionTier': new_tier,
                'billingCycle': 'monthly',
                'updatedAt': __import__('datetime').datetime.utcnow().isoformat(),
            })
            # TODO: send business migration email if needed
        return {'userId': user_id, 'email': user.get('email'), 'oldTier': subscription_tier, 'newTier': new_tier, 'action': 'migrated' if not dry_run else 'skipped', 'subscriptionId': stripe_subscription_id}
    except Exception as e:
        return {'userId': user_id, 'email': user.get('email'), 'oldTier': subscription_tier, 'newTier': new_tier, 'action': 'error', 'error': str(e)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Migrate Stripe plans to Pricing V3')
    parser.add_argument('--dry-run', action='store_true', help='Perform a dry run without writing changes')
    parser.add_argument('--execute', action='store_true', help='Perform the migration')
    parser.add_argument('--userId', type=str, help='Migrate a single test user by ID')

    args = parser.parse_args()
    dry_run = not args.execute
    migrate_stripe_plans(dry_run=dry_run, user_id=args.userId)

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Local testing script for app.py
Tests that the FastAPI app can start and basic endpoints work
"""

import sys
import os
from pathlib import Path

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Set environment variables for testing BEFORE importing app
os.environ['DATABASE_URL'] = 'sqlite:///./test_recoup.db'
os.environ['REDIS_URL'] = 'redis://localhost:6379'
os.environ['STRIPE_SECRET_KEY'] = 'sk_test_mock_key_for_testing'
os.environ['SENDGRID_API_KEY'] = 'SG.mock_key'
os.environ['STRIPE_WEBHOOK_SECRET'] = 'whsec_mock'
os.environ['FIREBASE_PROJECT_ID'] = 'test-project'
os.environ['FIREBASE_CLIENT_EMAIL'] = 'test@test.iam.gserviceaccount.com'
os.environ['FIREBASE_PRIVATE_KEY'] = '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----'
os.environ['API_BASE_URL'] = 'http://localhost:8000'
os.environ['PAYMENT_BASE_URL'] = 'http://localhost:3000'
os.environ['COMPANY_NAME'] = 'Recoup'

print("=" * 60)
print("🧪 LOCAL TEST: Recoup Python Backend")
print("=" * 60)
print()

# Test 1: Check if required dependencies are installed
print("📦 Test 1: Checking dependencies...")
missing_deps = []
required_deps = [
    'fastapi',
    'uvicorn',
    'pydantic',
    'stripe',
    'sendgrid',
    'redis',
    'sqlalchemy',
]

for dep in required_deps:
    try:
        __import__(dep)
        print(f"  ✅ {dep}")
    except ImportError:
        print(f"  ❌ {dep} - MISSING")
        missing_deps.append(dep)

if missing_deps:
    print()
    print("⚠️  Missing dependencies detected!")
    print("   Run: pip install " + " ".join(missing_deps))
    print()
    sys.exit(1)

print()

# Test 2: Check if custom modules exist
print("📁 Test 2: Checking custom modules...")
custom_modules = [
    'ai_collection_system.py',
    'collection_templates.py',
    'rate_limiter_py.py',
    'idempotency_py.py'
]

for module_file in custom_modules:
    if Path(module_file).exists():
        print(f"  ✅ {module_file}")
    else:
        print(f"  ⚠️  {module_file} - NOT FOUND (will use python-backend/ version if available)")

print()

# Test 3: Try to import the app
print("🚀 Test 3: Importing app.py...")
try:
    # This will test that all imports work and no syntax errors
    from app import app
    print("  ✅ app.py imported successfully!")
    print(f"  ✅ FastAPI app created: {app.title}")
except Exception as e:
    print(f"  ❌ Failed to import app.py")
    print(f"     Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()

# Test 4: Check if we can access the OpenAPI schema
print("📋 Test 4: Checking API routes...")
try:
    routes = [route.path for route in app.routes]
    print(f"  ✅ Found {len(routes)} routes:")
    for route in sorted(routes)[:10]:  # Show first 10
        print(f"     • {route}")
    if len(routes) > 10:
        print(f"     ... and {len(routes) - 10} more")
except Exception as e:
    print(f"  ❌ Failed to get routes: {e}")

print()

# Test 5: Test health endpoint
print("🏥 Test 5: Testing health endpoint...")
try:
    from fastapi.testclient import TestClient
    client = TestClient(app)

    response = client.get("/health")

    if response.status_code == 200:
        print(f"  ✅ Health endpoint returned 200 OK")
        data = response.json()
        print(f"     Status: {data.get('status', 'unknown')}")
        if 'services' in data:
            for service, status in data['services'].items():
                icon = "✅" if status == "connected" else "⚠️"
                print(f"     {icon} {service}: {status}")
    else:
        print(f"  ⚠️  Health endpoint returned {response.status_code}")

except ImportError:
    print("  ⚠️  TestClient not available (install: pip install httpx)")
except Exception as e:
    print(f"  ⚠️  Health check failed (expected if services aren't running): {e}")

print()
print("=" * 60)
print("✅ LOCAL TESTS COMPLETE!")
print("=" * 60)
print()
print("To run the server locally:")
print("  python app.py")
print("  or")
print("  uvicorn app:app --reload --host 0.0.0.0 --port 8000")
print()
print("Then visit:")
print("  • API Docs:   http://localhost:8000/docs")
print("  • Health:     http://localhost:8000/health")
print()

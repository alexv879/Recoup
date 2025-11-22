#!/usr/bin/env ts-node
/**
 * Production Readiness Verification Script
 *
 * Checks all critical systems before production deployment
 */

import { config } from 'dotenv';
import Stripe from 'stripe';
import { db, COLLECTIONS } from '../lib/firebase';

// Load environment variables
config({ path: '.env.production.local' });

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

function addResult(result: CheckResult) {
  results.push(result);
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Checking Environment Variables...\n');

  const required = {
    // Core
    'NEXT_PUBLIC_APP_URL': true,
    'NODE_ENV': true,

    // Firebase
    'FIREBASE_PROJECT_ID': true,
    'FIREBASE_CLIENT_EMAIL': true,
    'FIREBASE_PRIVATE_KEY': true,

    // Clerk
    'CLERK_SECRET_KEY': true,
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': true,
    'CLERK_WEBHOOK_SECRET': true,

    // Stripe
    'STRIPE_SECRET_KEY': true,
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': true,
    'STRIPE_WEBHOOK_SECRET': true,

    // Stripe Price IDs
    'STRIPE_PRICE_STARTER_MONTHLY': true,
    'STRIPE_PRICE_GROWTH_MONTHLY': true,
    'STRIPE_PRICE_PRO_MONTHLY': true,

    // Optional but recommended
    'HMRC_CLIENT_ID': false,
    'HMRC_CLIENT_SECRET': false,
    'TWILIO_ACCOUNT_SID': false,
    'SENDGRID_API_KEY': false,
    'OPENAI_API_KEY': false,
  };

  for (const [key, critical] of Object.entries(required)) {
    const value = process.env[key];

    if (!value || value === '' || value === 'undefined') {
      addResult({
        name: key,
        status: critical ? 'fail' : 'warn',
        message: critical ? 'MISSING (CRITICAL)' : 'Not configured (optional)',
        critical,
      });
    } else {
      // Check if it looks like a placeholder
      if (value.includes('xxx') || value.includes('your-') || value.includes('...')) {
        addResult({
          name: key,
          status: 'fail',
          message: 'Contains placeholder value',
          critical: true,
        });
      } else {
        addResult({
          name: key,
          status: 'pass',
          message: `Configured (${value.substring(0, 10)}...)`,
          critical,
        });
      }
    }
  }
}

async function checkFirebaseConnection() {
  console.log('\n🔥 Checking Firebase Connection...\n');

  try {
    // Try to access Firestore
    const testDoc = await db.collection(COLLECTIONS.USERS).limit(1).get();

    addResult({
      name: 'Firebase/Firestore',
      status: 'pass',
      message: `Connected successfully (${testDoc.size} documents queried)`,
      critical: true,
    });

    // Check collections exist
    const collections = [
      COLLECTIONS.USERS,
      COLLECTIONS.INVOICES,
      COLLECTIONS.CLIENTS,
    ];

    for (const collectionName of collections) {
      try {
        await db.collection(collectionName).limit(1).get();
        addResult({
          name: `Collection: ${collectionName}`,
          status: 'pass',
          message: 'Exists and accessible',
          critical: false,
        });
      } catch (error) {
        addResult({
          name: `Collection: ${collectionName}`,
          status: 'warn',
          message: 'Not accessible or empty',
          critical: false,
        });
      }
    }
  } catch (error) {
    addResult({
      name: 'Firebase/Firestore',
      status: 'fail',
      message: `Connection failed: ${(error as Error).message}`,
      critical: true,
    });
  }
}

async function checkStripeConnection() {
  console.log('\n💳 Checking Stripe Connection...\n');

  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    addResult({
      name: 'Stripe Connection',
      status: 'fail',
      message: 'STRIPE_SECRET_KEY not configured',
      critical: true,
    });
    return;
  }

  // Check if using production key
  if (apiKey.startsWith('sk_test_')) {
    addResult({
      name: 'Stripe API Key',
      status: 'warn',
      message: 'Using TEST key (switch to LIVE for production)',
      critical: true,
    });
  } else if (apiKey.startsWith('sk_live_')) {
    addResult({
      name: 'Stripe API Key',
      status: 'pass',
      message: 'Using PRODUCTION key',
      critical: true,
    });
  } else {
    addResult({
      name: 'Stripe API Key',
      status: 'fail',
      message: 'Invalid API key format',
      critical: true,
    });
    return;
  }

  try {
    const stripe = new Stripe(apiKey, {
      apiVersion: '2025-10-29.clover',
    });

    // Test connection by listing products
    const products = await stripe.products.list({ limit: 3 });

    addResult({
      name: 'Stripe Connection',
      status: 'pass',
      message: `Connected (${products.data.length} products found)`,
      critical: true,
    });

    // Check if required products exist
    const requiredProducts = ['Starter', 'Growth', 'Pro'];
    const foundProducts = products.data.map(p => p.name);

    for (const requiredProduct of requiredProducts) {
      if (foundProducts.includes(requiredProduct)) {
        addResult({
          name: `Product: ${requiredProduct}`,
          status: 'pass',
          message: 'Found in Stripe',
          critical: false,
        });
      } else {
        addResult({
          name: `Product: ${requiredProduct}`,
          status: 'warn',
          message: 'Not found (create in Stripe dashboard)',
          critical: false,
        });
      }
    }

    // Check price IDs
    const priceIds = [
      process.env.STRIPE_PRICE_STARTER_MONTHLY,
      process.env.STRIPE_PRICE_GROWTH_MONTHLY,
      process.env.STRIPE_PRICE_PRO_MONTHLY,
    ];

    for (const priceId of priceIds) {
      if (priceId && !priceId.includes('xxx')) {
        try {
          await stripe.prices.retrieve(priceId);
          addResult({
            name: `Price ID: ${priceId.substring(0, 20)}...`,
            status: 'pass',
            message: 'Valid and accessible',
            critical: false,
          });
        } catch (error) {
          addResult({
            name: `Price ID: ${priceId}`,
            status: 'fail',
            message: 'Invalid or not found in Stripe',
            critical: true,
          });
        }
      }
    }
  } catch (error) {
    addResult({
      name: 'Stripe Connection',
      status: 'fail',
      message: `Connection failed: ${(error as Error).message}`,
      critical: true,
    });
  }
}

async function checkTypeScript() {
  console.log('\n📘 Checking TypeScript Compilation...\n');

  const { execSync } = require('child_process');

  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    addResult({
      name: 'TypeScript Compilation',
      status: 'pass',
      message: '0 errors found',
      critical: true,
    });
  } catch (error) {
    addResult({
      name: 'TypeScript Compilation',
      status: 'fail',
      message: 'Compilation errors detected (run: npx tsc --noEmit)',
      critical: true,
    });
  }
}

async function checkTests() {
  console.log('\n🧪 Checking Tests...\n');

  const { execSync } = require('child_process');

  try {
    const output = execSync('npm test -- --passWithNoTests 2>&1', { encoding: 'utf-8' });

    // Parse test results
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const totalMatch = output.match(/Tests:\s+.*?(\d+) total/);

    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;

    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

    if (failed === 0) {
      addResult({
        name: 'Test Suite',
        status: 'pass',
        message: `${passed}/${total} passing (${passRate}%)`,
        critical: true,
      });
    } else if (parseFloat(passRate) >= 95) {
      addResult({
        name: 'Test Suite',
        status: 'warn',
        message: `${passed}/${total} passing (${passRate}%), ${failed} failing`,
        critical: false,
      });
    } else {
      addResult({
        name: 'Test Suite',
        status: 'fail',
        message: `${passed}/${total} passing (${passRate}%), ${failed} failing`,
        critical: true,
      });
    }
  } catch (error) {
    addResult({
      name: 'Test Suite',
      status: 'fail',
      message: 'Tests failed to run',
      critical: true,
    });
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PRODUCTION READINESS SUMMARY');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const criticalFailed = results.filter(r => r.status === 'fail' && r.critical).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🚨 Critical Failures: ${criticalFailed}\n`);

  if (criticalFailed > 0) {
    console.log('🚨 CRITICAL ISSUES FOUND - NOT READY FOR PRODUCTION\n');
    console.log('Fix the following critical issues:\n');

    results
      .filter(r => r.status === 'fail' && r.critical)
      .forEach(r => {
        console.log(`   ❌ ${r.name}: ${r.message}`);
      });

    console.log('\n');
    process.exit(1);
  } else if (failed > 0) {
    console.log('⚠️  NON-CRITICAL ISSUES FOUND - REVIEW BEFORE DEPLOYMENT\n');

    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`   ⚠️  ${r.name}: ${r.message}`);
      });

    console.log('\n');
  }

  if (warnings > 0) {
    console.log('ℹ️  WARNINGS (optional features):\n');

    results
      .filter(r => r.status === 'warn')
      .forEach(r => {
        console.log(`   ⚠️  ${r.name}: ${r.message}`);
      });

    console.log('\n');
  }

  console.log('✅ PRODUCTION READY - All critical checks passed!\n');
  console.log('Next steps:');
  console.log('1. Deploy to Vercel: vercel --prod');
  console.log('2. Configure webhooks (Stripe, Clerk)');
  console.log('3. Test critical flows manually');
  console.log('4. Monitor error logs (Sentry)');
  console.log('5. Check cost dashboards daily\n');

  process.exit(0);
}

async function main() {
  console.log('🚀 Production Readiness Verification');
  console.log('=====================================\n');

  await checkEnvironmentVariables();
  await checkTypeScript();
  await checkTests();
  await checkFirebaseConnection();
  await checkStripeConnection();

  await printSummary();
}

main().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});

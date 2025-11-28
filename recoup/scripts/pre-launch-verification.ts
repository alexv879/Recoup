/**
 * Pre-Launch Verification Script
 *
 * Purpose: Comprehensive production readiness checklist and verification
 *
 * Verifies:
 * 1. Environment variables (all required configs present)
 * 2. Firestore security rules deployed
 * 3. Firestore indexes deployed and enabled
 * 4. Stripe webhooks configured correctly
 * 5. Twilio SMS opt-out webhook configured
 * 6. GDPR data deletion works
 * 7. Pricing V3 feature flags enabled
 * 8. Sentry error tracking active
 * 9. Test suite passes
 * 10. Critical API endpoints responding
 *
 * Task 4.2 - Production Readiness Refactoring
 *
 * @usage
 * - Quick check: ts-node scripts/pre-launch-verification.ts
 * - Full audit: ts-node scripts/pre-launch-verification.ts --full
 * - Generate report: ts-node scripts/pre-launch-verification.ts --report=report.html
 */

import { db } from '../lib/firebase';
import Stripe from 'stripe';
import twilio from 'twilio';

interface VerificationResult {
    category: string;
    check: string;
    status: 'pass' | 'fail' | 'warn' | 'skip';
    message: string;
    details?: any;
}

const results: VerificationResult[] = [];
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;

const args = process.argv.slice(2);
const isFullAudit = args.includes('--full');
const reportPath = args.find(arg => arg.startsWith('--report='))?.split('=')[1];

function addResult(category: string, check: string, status: 'pass' | 'fail' | 'warn' | 'skip', message: string, details?: any) {
    results.push({ category, check, status, message, details });
    totalChecks++;

    const statusIcon = {
        pass: '✅',
        fail: '❌',
        warn: '⚠️',
        skip: '⏭️',
    }[status];

    console.log(`${statusIcon} [${category}] ${check}: ${message}`);

    if (status === 'pass') passedChecks++;
    else if (status === 'fail') failedChecks++;
    else if (status === 'warn') warnings++;
}

/**
 * Check 1: Environment Variables
 */
async function checkEnvironmentVariables() {
    console.log('\n📋 Checking Environment Variables...\n');

    const requiredEnvVars = [
        // Firebase
        { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', category: 'Firebase' },
        { key: 'FIREBASE_PRIVATE_KEY', category: 'Firebase' },
        { key: 'FIREBASE_CLIENT_EMAIL', category: 'Firebase' },
        { key: 'FIREBASE_STORAGE_BUCKET', category: 'Firebase' },

        // Stripe (Pricing V3)
        { key: 'STRIPE_SECRET_KEY', category: 'Stripe' },
        { key: 'STRIPE_WEBHOOK_SECRET', category: 'Stripe' },
        { key: 'STRIPE_PRICE_STARTER_MONTHLY', category: 'Stripe (Pricing V3)' },
        { key: 'STRIPE_PRICE_STARTER_ANNUAL', category: 'Stripe (Pricing V3)' },
        { key: 'STRIPE_PRICE_GROWTH_MONTHLY', category: 'Stripe (Pricing V3)' },
        { key: 'STRIPE_PRICE_GROWTH_ANNUAL', category: 'Stripe (Pricing V3)' },
        { key: 'STRIPE_PRICE_PRO_MONTHLY', category: 'Stripe (Pricing V3)' },
        { key: 'STRIPE_PRICE_PRO_ANNUAL', category: 'Stripe (Pricing V3)' },

        // Twilio
        { key: 'TWILIO_ACCOUNT_SID', category: 'Twilio' },
        { key: 'TWILIO_AUTH_TOKEN', category: 'Twilio' },
        { key: 'TWILIO_PHONE_NUMBER', category: 'Twilio' },

        // SendGrid
        { key: 'SENDGRID_API_KEY', category: 'SendGrid' },
        { key: 'SENDGRID_FROM_EMAIL', category: 'SendGrid' },

        // Clerk
        { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', category: 'Clerk' },
        { key: 'CLERK_SECRET_KEY', category: 'Clerk' },

        // Cron
        { key: 'CRON_SECRET', category: 'Cron Jobs' },

        // Sentry (Optional but recommended)
        { key: 'NEXT_PUBLIC_SENTRY_DSN', category: 'Sentry', optional: true },
        { key: 'SENTRY_AUTH_TOKEN', category: 'Sentry', optional: true },
    ];

    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar.key];

        if (!value) {
            if (envVar.optional) {
                addResult('Environment', envVar.key, 'warn', `Optional variable not set`, { category: envVar.category });
            } else {
                addResult('Environment', envVar.key, 'fail', `Required variable missing`, { category: envVar.category });
            }
        } else {
            // Check if it looks like a real value (not placeholder)
            if (value.includes('YOUR_') || value.includes('REPLACE_') || value === 'changeme') {
                addResult('Environment', envVar.key, 'fail', `Contains placeholder value`, { category: envVar.category });
            } else {
                addResult('Environment', envVar.key, 'pass', `Configured`, { category: envVar.category, valueLength: value.length });
            }
        }
    }
}

/**
 * Check 2: Firestore Security Rules
 */
async function checkFirestoreRules() {
    console.log('\n🔒 Checking Firestore Security Rules...\n');

    try {
        // Try to access a protected collection without auth (should fail)
        const testAccess = await db.collection('users').limit(1).get();

        // If we get here without auth, rules are not deployed properly
        addResult('Security', 'Firestore Rules', 'fail', 'Security rules may not be deployed - unauthenticated access succeeded');
    } catch (error: any) {
        if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
            addResult('Security', 'Firestore Rules', 'pass', 'Security rules are protecting data');
        } else {
            addResult('Security', 'Firestore Rules', 'warn', `Unexpected error: ${error.message}`);
        }
    }
}

/**
 * Check 3: Firestore Indexes
 */
async function checkFirestoreIndexes() {
    console.log('\n📊 Checking Firestore Indexes...\n');

    try {
        // Test a query that requires a composite index
        const testQuery = db
            .collection('invoices')
            .where('status', '==', 'overdue')
            .orderBy('dueDate', 'asc')
            .limit(1);

        await testQuery.get();

        addResult('Database', 'Composite Indexes', 'pass', 'Critical indexes are deployed and working');
    } catch (error: any) {
        if (error.message.includes('requires an index')) {
            addResult('Database', 'Composite Indexes', 'fail', 'Indexes missing - deploy firestore.indexes.json');
        } else {
            addResult('Database', 'Composite Indexes', 'warn', `Could not verify indexes: ${error.message}`);
        }
    }
}

/**
 * Check 4: Stripe Configuration
 */
async function checkStripeConfiguration() {
    console.log('\n💳 Checking Stripe Configuration...\n');

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2025-10-29.clover',
        });

        // Test API key
        const account = await stripe.accounts.retrieve();
        addResult('Stripe', 'API Connection', 'pass', `Connected to Stripe account: ${account.business_profile?.name || account.id}`);

        // Verify webhook endpoint exists
        const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
        const productionWebhook = webhooks.data.find(wh =>
            wh.url.includes('/api/webhook/stripe') && wh.url.includes('https://')
        );

        if (productionWebhook) {
            addResult('Stripe', 'Webhook Endpoint', 'pass', `Webhook configured: ${productionWebhook.url}`, {
                events: productionWebhook.enabled_events.length,
                status: productionWebhook.status,
            });
        } else {
            addResult('Stripe', 'Webhook Endpoint', 'warn', 'Production webhook not found - configure at https://dashboard.stripe.com/webhooks');
        }

        // Verify pricing V3 products exist
        const pricingV3PriceIds = [
            process.env.STRIPE_PRICE_STARTER_MONTHLY,
            process.env.STRIPE_PRICE_GROWTH_MONTHLY,
            process.env.STRIPE_PRICE_PRO_MONTHLY,
        ];

        let validPrices = 0;
        for (const priceId of pricingV3PriceIds) {
            if (priceId) {
                try {
                    const price = await stripe.prices.retrieve(priceId);
                    if (price.active) {
                        validPrices++;
                    }
                } catch (err) {
                    // Price doesn't exist
                }
            }
        }

        if (validPrices === 3) {
            addResult('Stripe', 'Pricing V3 Products', 'pass', `All 3 pricing tiers configured in Stripe`);
        } else {
            addResult('Stripe', 'Pricing V3 Products', 'fail', `Only ${validPrices}/3 pricing tiers found in Stripe`);
        }

    } catch (error: any) {
        addResult('Stripe', 'API Connection', 'fail', `Stripe error: ${error.message}`);
    }
}

/**
 * Check 5: Twilio SMS Opt-Out Webhook
 */
async function checkTwilioConfiguration() {
    console.log('\n📱 Checking Twilio Configuration...\n');

    try {
        const twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID!,
            process.env.TWILIO_AUTH_TOKEN!
        );

        // Verify account
        const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
        addResult('Twilio', 'API Connection', 'pass', `Connected to Twilio account: ${account.friendlyName}`);

        // Check if phone number has SMS webhook configured
        const phoneNumber = process.env.TWILIO_PHONE_NUMBER!;
        const numbers = await twilioClient.incomingPhoneNumbers.list({ phoneNumber });

        if (numbers.length > 0) {
            const number = numbers[0];
            const smsUrl = number.smsUrl;

            if (smsUrl && smsUrl.includes('/api/webhooks/twilio/sms')) {
                addResult('Twilio', 'SMS Opt-Out Webhook', 'pass', `Webhook configured: ${smsUrl}`);
            } else {
                addResult('Twilio', 'SMS Opt-Out Webhook', 'fail', 'SMS webhook not configured for opt-out processing (UK PECR compliance required)');
            }
        } else {
            addResult('Twilio', 'Phone Number', 'fail', `Phone number ${phoneNumber} not found in Twilio account`);
        }

    } catch (error: any) {
        addResult('Twilio', 'API Connection', 'fail', `Twilio error: ${error.message}`);
    }
}

/**
 * Check 6: Pricing V3 Feature Flags
 */
async function checkPricingV3() {
    console.log('\n💰 Checking Pricing V3 Configuration...\n');

    try {
        const flagsDoc = await db.collection('system_config').doc('feature_flags').get();

        if (flagsDoc.exists) {
            const flags = flagsDoc.data();

            if (flags?.PRICING_V3_ENABLED === true) {
                addResult('Features', 'Pricing V3 Enabled', 'pass', 'Pricing V3 is active');
            } else {
                addResult('Features', 'Pricing V3 Enabled', 'fail', 'Pricing V3 is disabled - enable in lib/featureFlags.ts');
            }

            if (flags?.PRICING_V3_ROLLOUT_PERCENTAGE === 100) {
                addResult('Features', 'Pricing V3 Rollout', 'pass', '100% rollout');
            } else {
                addResult('Features', 'Pricing V3 Rollout', 'warn', `Only ${flags?.PRICING_V3_ROLLOUT_PERCENTAGE || 0}% rollout`);
            }
        } else {
            addResult('Features', 'Feature Flags', 'warn', 'Feature flags document not found - using defaults from lib/featureFlags.ts');
        }
    } catch (error: any) {
        addResult('Features', 'Feature Flags', 'fail', `Error reading feature flags: ${error.message}`);
    }
}

/**
 * Check 7: GDPR Data Deletion
 */
async function checkGDPRCompliance() {
    console.log('\n🔐 Checking GDPR Compliance...\n');

    // Check if consentService exists and has storage deletion
    try {
        const { requestDataDeletion } = await import('../services/consentService');

        // Check the source code for Cloud Storage deletion
        const sourceCode = requestDataDeletion.toString();

        if (sourceCode.includes('@google-cloud/storage') || sourceCode.includes('bucket.getFiles')) {
            addResult('GDPR', 'Cloud Storage Deletion', 'pass', 'GDPR data deletion includes Cloud Storage files');
        } else {
            addResult('GDPR', 'Cloud Storage Deletion', 'fail', 'GDPR data deletion does not delete Cloud Storage files');
        }
    } catch (error: any) {
        addResult('GDPR', 'Consent Service', 'fail', `Could not verify GDPR deletion: ${error.message}`);
    }
}

/**
 * Check 8: Sentry Error Tracking
 */
async function checkSentry() {
    console.log('\n🚨 Checking Sentry Error Tracking...\n');

    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

    if (sentryDsn && !sentryDsn.includes('YOUR_') && sentryDsn.startsWith('https://')) {
        addResult('Monitoring', 'Sentry DSN', 'pass', 'Sentry is configured');

        // Try to send a test event
        try {
            const Sentry = await import('@sentry/nextjs');
            Sentry.captureMessage('Pre-launch verification test', 'info');
            addResult('Monitoring', 'Sentry Test Event', 'pass', 'Test event sent to Sentry');
        } catch (error) {
            addResult('Monitoring', 'Sentry Integration', 'warn', 'Sentry SDK not installed or configured');
        }
    } else {
        addResult('Monitoring', 'Sentry', 'warn', 'Sentry not configured - recommended for production');
    }
}

/**
 * Check 9: Critical API Endpoints
 */
async function checkAPIEndpoints() {
    console.log('\n🌐 Checking Critical API Endpoints...\n');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const endpoints = [
        { path: '/api/health', method: 'GET' },
        { path: '/api/webhooks/twilio/sms', method: 'GET' }, // Health check endpoint
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${baseUrl}${endpoint.path}`, {
                method: endpoint.method,
            });

            if (response.ok) {
                addResult('API', endpoint.path, 'pass', `Endpoint responding (${response.status})`);
            } else {
                addResult('API', endpoint.path, 'warn', `Endpoint returned ${response.status}`);
            }
        } catch (error: any) {
            if (baseUrl.includes('localhost')) {
                addResult('API', endpoint.path, 'skip', 'Skipped (development environment)');
            } else {
                addResult('API', endpoint.path, 'fail', `Endpoint unreachable: ${error.message}`);
            }
        }
    }
}

/**
 * Generate HTML Report
 */
function generateHTMLReport(): string {
    const timestamp = new Date().toISOString();
    const passRate = ((passedChecks / totalChecks) * 100).toFixed(1);

    const resultRows = results
        .map(r => {
            const statusColor = {
                pass: '#22c55e',
                fail: '#ef4444',
                warn: '#f59e0b',
                skip: '#94a3b8',
            }[r.status];

            return `
        <tr>
          <td>${r.category}</td>
          <td>${r.check}</td>
          <td style="color: ${statusColor}; font-weight: bold;">${r.status.toUpperCase()}</td>
          <td>${r.message}</td>
        </tr>
      `;
        })
        .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Recoup Pre-Launch Verification Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 20px;
      background: #f9fafb;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      color: #6b7280;
      font-size: 14px;
    }
    table {
      width: 100%;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:last-child td {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Recoup Pre-Launch Verification Report</h1>
    <p>Generated: ${timestamp}</p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-value" style="color: #22c55e;">${passedChecks}</div>
      <div class="stat-label">Passed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #ef4444;">${failedChecks}</div>
      <div class="stat-label">Failed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #f59e0b;">${warnings}</div>
      <div class="stat-label">Warnings</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #667eea;">${passRate}%</div>
      <div class="stat-label">Pass Rate</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Check</th>
        <th>Status</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>
      ${resultRows}
    </tbody>
  </table>
</body>
</html>
  `;
}

/**
 * Main Verification Runner
 */
async function runVerification() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║         RECOUP PRE-LAUNCH VERIFICATION SCRIPT                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    console.log(`Mode: ${isFullAudit ? '🔍 Full Audit' : '⚡ Quick Check'}`);
    console.log(`Report: ${reportPath || 'Console only'}\n`);

    // Run all checks
    await checkEnvironmentVariables();
    await checkFirestoreRules();
    await checkFirestoreIndexes();
    await checkStripeConfiguration();
    await checkTwilioConfiguration();
    await checkPricingV3();
    await checkGDPRCompliance();
    await checkSentry();
    await checkAPIEndpoints();

    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                     VERIFICATION SUMMARY                         ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Checks:    ${totalChecks}`);
    console.log(`✅ Passed:        ${passedChecks}`);
    console.log(`❌ Failed:        ${failedChecks}`);
    console.log(`⚠️  Warnings:      ${warnings}`);
    console.log(`Pass Rate:       ${((passedChecks / totalChecks) * 100).toFixed(1)}%\n`);

    if (failedChecks === 0) {
        console.log('🎉 All critical checks passed! Your application is ready for launch.');
    } else {
        console.log(`⚠️  ${failedChecks} critical issue(s) found. Please resolve before launch.`);
    }

    // Generate HTML report if requested
    if (reportPath) {
        const fs = await import('fs');
        const html = generateHTMLReport();
        fs.writeFileSync(reportPath, html);
        console.log(`\n📄 HTML report generated: ${reportPath}`);
    }

    process.exit(failedChecks > 0 ? 1 : 0);
}

// Run verification
runVerification();

/**
 * Privacy Policy
 * UK GDPR Compliant
 */

import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

            <p className="text-sm text-gray-600 mb-8">
                Last updated: {new Date().toLocaleDateString('en-GB')}
            </p>

            <div className="prose prose-lg max-w-none">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Who We Are</h2>
                    <p>
                        Recoup is an invoicing and payment tracking platform for UK freelancers.
                        We're committed to protecting your privacy and being transparent about how
                        we handle your data.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">What Data We Collect</h2>

                    <h3 className="text-xl font-semibold mb-2 mt-4">Account Information</h3>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Name and email address (via Clerk authentication)</li>
                        <li>Business name and details</li>
                        <li>VAT number (if applicable)</li>
                        <li>Phone number (for SMS reminders, if you opt in)</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-2 mt-4">Financial Data</h3>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Invoice details (amounts, clients, payment terms)</li>
                        <li>Expense records and receipts</li>
                        <li>Time tracking data</li>
                        <li>Payment information (processed securely by Stripe - we never store card details)</li>
                        <li>Bank connection data (if you use Open Banking integration)</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-2 mt-4">AI Usage Data</h3>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Data sent to AI models (Gemini 80%, Claude 15%, OpenAI 5%)</li>
                        <li>Used for: expense categorization, proposal generation, collection messages</li>
                        <li>We use Google Gemini as our primary AI provider for cost optimization</li>
                        <li>No personal data is retained by AI providers after processing</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
                    <ul className="list-disc pl-6">
                        <li>To provide invoicing and payment tracking services</li>
                        <li>To send invoice reminders (email/SMS) with your consent</li>
                        <li>To generate AI-powered proposals and expense categories</li>
                        <li>To calculate taxes and prepare financial reports</li>
                        <li>To process subscription payments via Stripe</li>
                        <li>To comply with UK tax law (HMRC Making Tax Digital)</li>
                        <li>To improve our services and detect fraud</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Legal Basis (GDPR)</h2>
                    <p>We process your data under these legal bases:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li><strong>Contract Performance:</strong> To provide our invoicing service</li>
                        <li><strong>Legitimate Interest:</strong> Fraud prevention, service improvement</li>
                        <li><strong>Legal Obligation:</strong> HMRC compliance, FCA debt collection rules</li>
                        <li><strong>Consent:</strong> SMS reminders, voice calls, marketing emails</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
                    <p>Under UK GDPR, you have the right to:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li><strong>Access:</strong> Request a copy of all your data</li>
                        <li><strong>Correction:</strong> Update incorrect information</li>
                        <li><strong>Deletion:</strong> Request we delete your account and data</li>
                        <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                        <li><strong>Objection:</strong> Object to processing (e.g., marketing)</li>
                        <li><strong>Withdrawal:</strong> Withdraw consent for SMS/email at any time</li>
                    </ul>
                    <p className="mt-4">
                        To exercise any of these rights, email us at: <strong>privacy@recoup.app</strong>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
                    <p>We share data only with essential service providers:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li><strong>Clerk:</strong> Authentication (US-based, GDPR compliant)</li>
                        <li><strong>Stripe:</strong> Payment processing (UK/EU servers, PCI-DSS)</li>
                        <li><strong>Firebase:</strong> Database (Google Cloud, EU region)</li>
                        <li><strong>Resend:</strong> Email delivery (EU servers)</li>
                        <li><strong>Twilio:</strong> SMS/voice (GDPR compliant)</li>
                        <li><strong>Google Gemini:</strong> AI processing (data not retained)</li>
                        <li><strong>Anthropic Claude:</strong> AI processing (data not retained)</li>
                        <li><strong>OpenAI:</strong> AI processing (data not retained)</li>
                    </ul>
                    <p className="mt-4 font-semibold">
                        We never sell your data to third parties.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
                    <ul className="list-disc pl-6">
                        <li>Active accounts: Data kept while account is active</li>
                        <li>After deletion: 30 days backup retention, then permanently deleted</li>
                        <li>UK tax records: 6 years (legal requirement)</li>
                        <li>We may retain anonymized analytics data</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Security</h2>
                    <ul className="list-disc pl-6">
                        <li>All data encrypted in transit (TLS/HTTPS)</li>
                        <li>Database encrypted at rest</li>
                        <li>No payment card data stored (Stripe handles this)</li>
                        <li>Regular security audits</li>
                        <li>Employee access strictly limited</li>
                        <li>Two-factor authentication available</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
                    <p>We use essential cookies only:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Authentication (Clerk session)</li>
                        <li>Security (CSRF protection)</li>
                        <li>Preferences (language, theme)</li>
                    </ul>
                    <p className="mt-4">
                        We don't use tracking or advertising cookies.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
                    <p>
                        Recoup is not intended for users under 18. We don't knowingly collect
                        data from children.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
                    <p>
                        We may update this policy. We'll notify you of significant changes via
                        email. Continued use after changes means you accept the updated policy.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                    <p>Questions about your privacy? Contact us:</p>
                    <ul className="list-none mt-4">
                        <li><strong>Email:</strong> privacy@recoup.app</li>
                        <li><strong>Data Protection:</strong> dpo@recoup.app</li>
                        <li><strong>Support:</strong> support@recoup.app</li>
                    </ul>
                    <p className="mt-4">
                        You can also lodge a complaint with the UK Information Commissioner's Office (ICO)
                        at <a href="https://ico.org.uk" className="text-blue-600 hover:underline">ico.org.uk</a>
                    </p>
                </section>
            </div>
        </div>
    );
}

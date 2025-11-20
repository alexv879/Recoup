/**
 * Terms of Service
 * UK-compliant terms for Recoup
 */

import React from 'react';

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

            <p className="text-sm text-gray-600 mb-8">
                Last updated: {new Date().toLocaleDateString('en-GB')}
            </p>

            <div className="prose prose-lg max-w-none">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                    <p>
                        By using Recoup, you agree to these Terms of Service. If you don't agree,
                        please don't use our service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. The Service</h2>
                    <p>Recoup provides:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Online invoicing and payment tracking</li>
                        <li>Expense and time tracking</li>
                        <li>AI-powered features (proposals, categorization, collections)</li>
                        <li>Automated payment reminders (email/SMS with consent)</li>
                        <li>UK tax compliance tools (MTD, IR35 assessments)</li>
                        <li>Financial reports and analytics</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. Subscription & Pricing</h2>

                    <h3 className="text-xl font-semibold mb-2 mt-4">Free Tier</h3>
                    <p>
                        Up to 5 clients, 20 invoices/month. No payment required.
                    </p>

                    <h3 className="text-xl font-semibold mb-2 mt-4">Starter (£9/month or £90/year)</h3>
                    <p>
                        Up to 15 clients, unlimited invoices, SMS reminders, recurring invoices.
                    </p>

                    <h3 className="text-xl font-semibold mb-2 mt-4">Professional (£19/month or £190/year)</h3>
                    <p>
                        Unlimited everything, AI features, voice calls, advanced analytics.
                    </p>

                    <h3 className="text-xl font-semibold mb-2 mt-4">Billing</h3>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Monthly plans: Billed monthly, cancel anytime</li>
                        <li>Annual plans: 17% discount, billed yearly</li>
                        <li>Prices in GBP, exclude VAT</li>
                        <li>Payment via Stripe (credit/debit card)</li>
                        <li>Auto-renewal until cancelled</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-2 mt-4">Cancellation</h3>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Cancel anytime from account settings</li>
                        <li>No refunds for partial months</li>
                        <li>Access continues until end of billing period</li>
                        <li>Downgrade to Free tier after cancellation</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. Your Responsibilities</h2>
                    <p>You agree to:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Provide accurate business and tax information</li>
                        <li>Keep your account secure (strong password, 2FA)</li>
                        <li>Not share your account with others</li>
                        <li>Comply with UK tax law (HMRC, VAT, IR35)</li>
                        <li>Obtain client consent before sending SMS/voice reminders</li>
                        <li>Follow UK FCA debt collection regulations</li>
                        <li>Not use the service for illegal purposes</li>
                        <li>Not abuse AI features or attempt to bypass limits</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">5. AI Features</h2>
                    <p>Our AI features use:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Google Gemini (80% of requests - cost optimized)</li>
                        <li>Anthropic Claude (15% - complex tasks)</li>
                        <li>OpenAI GPT (5% + voice features)</li>
                    </ul>
                    <p className="mt-4">
                        AI output may contain errors. You're responsible for reviewing and
                        approving all AI-generated content before use.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">6. Payment Processing</h2>
                    <ul className="list-disc pl-6">
                        <li>We use Stripe for payments (PCI-DSS compliant)</li>
                        <li>We never see or store your card details</li>
                        <li>Invoice payments: 3% commission (Stripe fees + platform fee)</li>
                        <li>Subscription payments: No additional fees</li>
                        <li>Payouts to your bank: Within 2-7 business days</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">7. Data & Privacy</h2>
                    <p>
                        See our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> for
                        details. Key points:
                    </p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Your data is yours - we never sell it</li>
                        <li>UK GDPR compliant</li>
                        <li>You can export or delete your data anytime</li>
                        <li>We retain tax records for 6 years (legal requirement)</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
                    <ul className="list-disc pl-6">
                        <li>We aim for 99.9% uptime</li>
                        <li>Scheduled maintenance will be announced</li>
                        <li>No liability for downtime or data loss</li>
                        <li>Keep local backups of critical data</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
                    <p className="font-semibold">
                        Recoup is provided "as is" without warranties.
                    </p>
                    <ul className="list-disc pl-6 mt-4">
                        <li>We're not liable for lost profits, data, or opportunities</li>
                        <li>Maximum liability: Amount you paid in last 12 months</li>
                        <li>We're not responsible for:
                            <ul className="list-disc pl-6 mt-2">
                                <li>Tax calculation errors (verify with your accountant)</li>
                                <li>Late payment fees from clients</li>
                                <li>AI output accuracy</li>
                                <li>Third-party service failures (Stripe, Twilio, etc.)</li>
                            </ul>
                        </li>
                    </ul>
                    <p className="mt-4 text-sm italic">
                        Note: This doesn't affect your statutory rights under UK consumer law.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
                    <p>
                        You agree to indemnify Recoup against claims arising from your:
                    </p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Breach of these terms</li>
                        <li>Violation of law (tax evasion, fraud, etc.)</li>
                        <li>Infringement of third-party rights</li>
                        <li>Misuse of AI features</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">11. Account Termination</h2>
                    <p>We may suspend or terminate your account if you:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Violate these terms</li>
                        <li>Fail to pay subscription fees</li>
                        <li>Engage in fraudulent activity</li>
                        <li>Abuse the service or AI features</li>
                    </ul>
                    <p className="mt-4">
                        You can export your data before termination.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">12. Intellectual Property</h2>
                    <ul className="list-disc pl-6">
                        <li>You own your data (invoices, expenses, etc.)</li>
                        <li>We own the platform and software</li>
                        <li>AI-generated content: You own it once generated</li>
                        <li>Our name, logo, and branding are trademarked</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
                    <p>
                        We may update these terms. We'll notify you of material changes via email.
                        Continued use means you accept the new terms.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
                    <p>
                        These terms are governed by the laws of England and Wales.
                        Disputes will be resolved in UK courts.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">15. Contact</h2>
                    <p>Questions about these terms?</p>
                    <ul className="list-none mt-4">
                        <li><strong>Email:</strong> legal@recoup.app</li>
                        <li><strong>Support:</strong> support@recoup.app</li>
                    </ul>
                </section>

                <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm">
                        <strong>Plain English Summary:</strong> Use Recoup honestly, pay your subscription,
                        don't break UK law, and we'll provide a great service. We're not liable if things
                        go wrong. Cancel anytime, no hassle.
                    </p>
                </div>
            </div>
        </div>
    );
}

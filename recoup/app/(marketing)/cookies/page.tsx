/**
 * Cookie Policy
 * UK PECR and UK GDPR compliant cookie policy
 */

import React from 'react';
import Link from 'next/link';

export default function CookiePolicyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>

            <p className="text-sm text-gray-600 mb-8">
                Last updated: {new Date().toLocaleDateString('en-GB')}
            </p>

            <div className="prose prose-lg max-w-none">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
                    <p>
                        Cookies are small text files stored on your device when you visit our website.
                        They help us provide you with a better experience by remembering your preferences
                        and understanding how you use our service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Why We Use Cookies</h2>
                    <p>We use cookies to:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Keep you signed in securely (Clerk authentication)</li>
                        <li>Remember your preferences and settings</li>
                        <li>Understand how you use our service (analytics)</li>
                        <li>Improve our platform and fix bugs (error tracking)</li>
                        <li>Provide customer support</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>

                    <h3 className="text-xl font-semibold mb-2 mt-4">3.1 Strictly Necessary Cookies</h3>
                    <p>
                        <strong>Required for service functionality. Cannot be disabled.</strong>
                    </p>
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full border border-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left border-b">Cookie</th>
                                    <th className="px-4 py-2 text-left border-b">Purpose</th>
                                    <th className="px-4 py-2 text-left border-b">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-4 py-2 border-b"><code>__session</code></td>
                                    <td className="px-4 py-2 border-b">Clerk authentication session</td>
                                    <td className="px-4 py-2 border-b">7 days</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 border-b"><code>__client</code></td>
                                    <td className="px-4 py-2 border-b">Clerk client identifier</td>
                                    <td className="px-4 py-2 border-b">1 year</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 border-b"><code>csrf_token</code></td>
                                    <td className="px-4 py-2 border-b">Security - prevent CSRF attacks</td>
                                    <td className="px-4 py-2 border-b">Session</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h3 className="text-xl font-semibold mb-2 mt-6">3.2 Analytics Cookies</h3>
                    <p>
                        <strong>Help us understand how users interact with our service.</strong>
                    </p>
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full border border-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left border-b">Service</th>
                                    <th className="px-4 py-2 text-left border-b">Purpose</th>
                                    <th className="px-4 py-2 text-left border-b">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-4 py-2 border-b">Mixpanel</td>
                                    <td className="px-4 py-2 border-b">User behavior analytics</td>
                                    <td className="px-4 py-2 border-b">1 year</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 border-b">Vercel Analytics</td>
                                    <td className="px-4 py-2 border-b">Performance monitoring</td>
                                    <td className="px-4 py-2 border-b">Session</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h3 className="text-xl font-semibold mb-2 mt-6">3.3 Error Tracking Cookies</h3>
                    <p>
                        <strong>Help us identify and fix bugs.</strong>
                    </p>
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full border border-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left border-b">Service</th>
                                    <th className="px-4 py-2 text-left border-b">Purpose</th>
                                    <th className="px-4 py-2 text-left border-b">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-4 py-2 border-b">Sentry</td>
                                    <td className="px-4 py-2 border-b">Error tracking and debugging</td>
                                    <td className="px-4 py-2 border-b">Session</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
                    <p>Some cookies are set by third-party services we use:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li><strong>Clerk (clerk.com):</strong> Authentication and user management</li>
                        <li><strong>Stripe (stripe.com):</strong> Payment processing</li>
                        <li><strong>Mixpanel (mixpanel.com):</strong> Analytics</li>
                        <li><strong>Sentry (sentry.io):</strong> Error tracking</li>
                    </ul>
                    <p className="mt-4">
                        These services have their own cookie policies:
                    </p>
                    <ul className="list-disc pl-6 mt-2">
                        <li><a href="https://clerk.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Clerk Privacy Policy</a></li>
                        <li><a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe Privacy Policy</a></li>
                        <li><a href="https://mixpanel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mixpanel Privacy Policy</a></li>
                        <li><a href="https://sentry.io/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Sentry Privacy Policy</a></li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">5. How to Manage Cookies</h2>

                    <h3 className="text-xl font-semibold mb-2 mt-4">Browser Settings</h3>
                    <p>
                        You can control cookies through your browser settings:
                    </p>
                    <ul className="list-disc pl-6 mt-2">
                        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Chrome Cookie Settings</a></li>
                        <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firefox Cookie Settings</a></li>
                        <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Safari Cookie Settings</a></li>
                        <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Edge Cookie Settings</a></li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-2 mt-4">Important Note</h3>
                    <p className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-2">
                        <strong>Warning:</strong> Disabling necessary cookies will prevent you from using Recoup.
                        You won't be able to sign in or access your account.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">6. Your UK GDPR Rights</h2>
                    <p>Under UK GDPR, you have the right to:</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>Know what data we collect via cookies</li>
                        <li>Access your data</li>
                        <li>Delete your data (except legally required records)</li>
                        <li>Object to analytics cookies</li>
                        <li>Withdraw consent at any time</li>
                    </ul>
                    <p className="mt-4">
                        To exercise these rights, email us at{' '}
                        <a href="mailto:privacy@recoup.app" className="text-blue-600 hover:underline">
                            privacy@recoup.app
                        </a>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">7. PECR Compliance</h2>
                    <p>
                        We comply with the UK Privacy and Electronic Communications Regulations (PECR):
                    </p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>
                            <strong>Strictly necessary cookies:</strong> Used without consent (legal basis: legitimate interest)
                        </li>
                        <li>
                            <strong>Analytics cookies:</strong> By continuing to use our service, you consent to these cookies
                        </li>
                        <li>
                            <strong>No marketing cookies:</strong> We don't use cookies for advertising
                        </li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">8. Updates to This Policy</h2>
                    <p>
                        We may update this Cookie Policy to reflect changes in our practices or legal requirements.
                        We'll notify you of material changes via email or prominent notice on our website.
                    </p>
                    <p className="mt-4">
                        Last updated: {new Date().toLocaleDateString('en-GB')}
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
                    <p>Questions about our cookie usage?</p>
                    <ul className="list-none mt-4">
                        <li><strong>Email:</strong> privacy@recoup.app</li>
                        <li><strong>Support:</strong> support@recoup.app</li>
                    </ul>
                </section>

                <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm">
                        <strong>Summary:</strong> We use cookies to keep you signed in and improve our service.
                        Most are necessary for Recoup to work. You can control analytics cookies through your
                        browser settings, but disabling necessary cookies will prevent you from using Recoup.
                    </p>
                </div>

                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <strong>Related Policies:</strong>
                    </p>
                    <ul className="list-none mt-2 space-y-1">
                        <li>
                            <Link href="/privacy" className="text-blue-600 hover:underline">
                                Privacy Policy
                            </Link>
                            {' '}- How we collect, use, and protect your data
                        </li>
                        <li>
                            <Link href="/terms" className="text-blue-600 hover:underline">
                                Terms of Service
                            </Link>
                            {' '}- Rules for using Recoup
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

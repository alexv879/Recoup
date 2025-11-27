/**
 * Expense Pricing Page (Revenue Recovery SaaS)
 * Shows Free/Pro/MTD-Pro tiers with Clerk subscription checkout
 *
 * Tiers:
 * - Free: £0 - 50 expenses, 10 OCR per month
 * - Pro: £10/month - Unlimited expenses & OCR
 * - MTD-Pro: £20/month - All Pro + HMRC quarterly filing
 */

'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function ExpensePricingPage() {
  const { user } = useUser();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for trying out revenue recovery',
      monthlyPrice: 0,
      annualPrice: 0,
      annualSavings: 0,
      icon: '🎯',
      features: [
        '50 expenses per month',
        '10 receipt OCR per month',
        '100MB receipt storage',
        'Revenue recovery dashboard',
        'Billable expense tracking',
        'Tax deduction tracking',
        'Basic invoicing',
        'Client expense reports',
        'Export data (CSV)',
      ],
      limitations: [
        'Limited OCR processing',
        'No bulk import',
        'No HMRC filing',
      ],
      cta: user ? 'Current Plan' : 'Get Started Free',
      ctaLink: user ? null : '/sign-up',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For freelancers serious about revenue recovery',
      monthlyPrice: 10,
      annualPrice: 96, // £96/year (20% discount)
      annualSavings: 24,
      icon: '💼',
      features: [
        'Unlimited expenses',
        'Unlimited receipt OCR',
        '1GB receipt storage',
        'All Free features',
        'Bulk expense import',
        'AI revenue forecasting',
        'Advanced collections (25/month)',
        'Email + SMS reminders',
        'Branded invoices',
        'Priority email support',
      ],
      roiMessage: 'Pays for itself with just 1-2 recovered expenses per month',
      cta: 'Upgrade to Pro',
      ctaLink: null, // Will use Clerk checkout
      popular: true,
    },
    {
      id: 'mtd-pro',
      name: 'MTD-Pro',
      description: 'All Pro features + HMRC quarterly filing',
      monthlyPrice: 20,
      annualPrice: 192, // £192/year (20% discount)
      annualSavings: 48,
      icon: '🇬🇧',
      features: [
        'All Pro features',
        'HMRC quarterly submissions',
        'VAT filing integration',
        'Annual tax declarations',
        'Audit-proof digital records',
        'Compliance reports',
        'Unlimited collections',
        'Priority support',
        'Early access to new features',
      ],
      roiMessage: 'Save hours on tax admin + recover more revenue',
      badge: 'Coming Soon',
      badgeColor: 'bg-purple-100 text-purple-700',
      cta: 'Join Waitlist',
      ctaLink: '/pricing?plan=mtd-pro#waitlist',
      popular: false,
      comingSoon: true,
    },
  ];

  const handleUpgradeClick = (planId: string) => {
    if (!user) {
      window.location.href = '/sign-up';
      return;
    }

    // For MTD-Pro, show waitlist modal
    if (planId === 'mtd-pro') {
      // TODO: Show MTD waitlist modal
      window.location.href = '/pricing?plan=mtd-pro#waitlist';
      return;
    }

    // For Pro, redirect to Clerk subscription checkout
    if (planId === 'pro') {
      // Option 1: Use Clerk's subscription URL (replace with your Clerk domain)
      // window.location.href = `https://your-clerk-domain.clerk.accounts.dev/subscribe?plan=pro`;

      // Option 2: Use custom upgrade page that uses Clerk Elements
      window.location.href = '/dashboard/upgrade?plan=pro';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Find Money You're Leaving on the Table
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
              Track expenses, recover revenue from client recharges, and maximize tax deductions.
            </p>
            <p className="text-lg text-gray-500">
              Join thousands of UK freelancers recovering thousands in lost revenue.
            </p>

            {/* Social Proof */}
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-semibold text-gray-900">£2.4M+</div>
                  <div className="text-xs">Revenue recovered</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-semibold text-gray-900">10,000+</div>
                  <div className="text-xs">Freelancers</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="font-semibold text-gray-900">4.9/5</div>
                  <div className="text-xs">User rating</div>
                </div>
              </div>
            </div>

            {/* Billing Toggle */}
            <div className="mt-10 inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const displayPrice = billingCycle === 'annual' ? price / 12 : price;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl ${
                  plan.popular
                    ? 'border-4 border-blue-500 scale-105 z-10'
                    : 'border-2 border-gray-200'
                } overflow-hidden transition-transform hover:scale-105`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl">
                    ⭐ MOST POPULAR
                  </div>
                )}

                {/* Coming Soon Badge */}
                {plan.badge && (
                  <div className={`absolute top-0 right-0 ${plan.badgeColor} text-xs font-bold px-4 py-2 rounded-bl-2xl`}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-8">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{plan.icon}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">
                        £{displayPrice.toFixed(displayPrice % 1 === 0 ? 0 : 2)}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    {billingCycle === 'annual' && plan.annualSavings > 0 && (
                      <p className="text-sm text-green-600 font-semibold mt-2">
                        Save £{plan.annualSavings}/year
                      </p>
                    )}
                    {billingCycle === 'annual' && plan.annualPrice > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Billed annually at £{plan.annualPrice}
                      </p>
                    )}
                  </div>

                  {/* ROI Message */}
                  {plan.roiMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                      <p className="text-xs text-green-900 font-semibold mb-1">💡 ROI</p>
                      <p className="text-xs text-green-700">{plan.roiMessage}</p>
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgradeClick(plan.id)}
                    disabled={plan.comingSoon && plan.id !== 'mtd-pro'}
                    className={`block w-full text-center py-4 px-6 rounded-lg font-semibold text-lg transition-all mb-6 ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-300'
                    } ${plan.comingSoon && plan.id !== 'mtd-pro' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {plan.cta}
                  </button>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Includes:</p>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-green-600 font-bold flex-shrink-0 mt-0.5">✓</span>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations && plan.limitations.length > 0 && (
                    <div className="pt-6 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                        Limitations:
                      </p>
                      {plan.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-start gap-3 mb-2">
                          <span className="text-gray-400 flex-shrink-0 mt-0.5">—</span>
                          <span className="text-xs text-gray-500">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Signals */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">
            All plans include: Unlimited invoices • Revenue recovery dashboard • Tax deduction tracking
          </p>
          <p className="text-xs text-gray-500">
            No hidden fees • Cancel anytime • 14-day money-back guarantee
          </p>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12">Compare Plans</h2>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Feature
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">
                  Free
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-blue-600 uppercase bg-blue-50">
                  Pro
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">
                  MTD-Pro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td className="px-6 py-4 font-semibold">Price</td>
                <td className="px-6 py-4 text-center font-bold text-green-600">£0</td>
                <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50">£10/mo</td>
                <td className="px-6 py-4 text-center font-bold">£20/mo</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Expenses per month</td>
                <td className="px-6 py-4 text-center">50</td>
                <td className="px-6 py-4 text-center font-semibold bg-blue-50">Unlimited</td>
                <td className="px-6 py-4 text-center font-semibold">Unlimited</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Receipt OCR</td>
                <td className="px-6 py-4 text-center">10/month</td>
                <td className="px-6 py-4 text-center font-semibold bg-blue-50">Unlimited</td>
                <td className="px-6 py-4 text-center font-semibold">Unlimited</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Receipt storage</td>
                <td className="px-6 py-4 text-center">100MB</td>
                <td className="px-6 py-4 text-center bg-blue-50">1GB</td>
                <td className="px-6 py-4 text-center">1GB</td>
              </tr>
              <tr>
                <td className="px-6 py-4">HMRC quarterly filing</td>
                <td className="px-6 py-4 text-center text-gray-400">—</td>
                <td className="px-6 py-4 text-center text-gray-400 bg-blue-50">—</td>
                <td className="px-6 py-4 text-center text-green-600 font-semibold">✓</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Collections per month</td>
                <td className="px-6 py-4 text-center">1</td>
                <td className="px-6 py-4 text-center bg-blue-50">25</td>
                <td className="px-6 py-4 text-center font-semibold">Unlimited</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Priority support</td>
                <td className="px-6 py-4 text-center text-gray-400">—</td>
                <td className="px-6 py-4 text-center text-green-600 bg-blue-50">✓</td>
                <td className="px-6 py-4 text-center text-green-600">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">What is revenue recovery?</h3>
            <p className="text-gray-600">
              Revenue recovery helps you find money you're leaving on the table. Track billable expenses,
              convert them to invoices, and recover money from client recharges. Plus, maximize tax deductions
              to save even more.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
            <p className="text-gray-600">
              Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades
              take effect at the end of your current billing period.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">When will MTD-Pro be available?</h3>
            <p className="text-gray-600">
              MTD-Pro is awaiting HMRC production approval (8-12 weeks). Join the waitlist to be notified
              when we launch. The feature is built and ready—we're just waiting for HMRC approval.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Do you handle client payments?</h3>
            <p className="text-gray-600">
              No. Client payments go directly to your bank account via Stripe Payment Links. We never touch
              your funds—we just track payment status for you.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-gray-600">
              The Free plan is free forever (no credit card required). Try it risk-free with 50 expenses
              and 10 OCR receipts per month. Upgrade to Pro when you're ready for unlimited.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to recover your revenue?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of UK freelancers finding money they're leaving on the table.
        </p>
        <a
          href="/sign-up"
          className="inline-block bg-blue-600 text-white px-10 py-5 rounded-lg text-xl font-semibold hover:bg-blue-700 transition shadow-lg"
        >
          Get Started Free
        </a>
        <p className="mt-4 text-sm text-gray-500">No credit card required • Free forever</p>
      </div>
    </div>
  );
}

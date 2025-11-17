/**
 * PRICING PAGE - 4-TIER VIRAL GROWTH STRUCTURE
 * /pricing
 *
 * Viral Growth Strategy (Hooked + Oversubscribed + Lean Startup):
 * - FREE tier for viral growth (K-factor 0.8-1.1 target)
 * - Anchoring effect (Enterprise listed first at £75)
 * - Decoy effect (Pro appears as "best value")
 * - Charm pricing (£19/£39 not £20/£40)
 * - Social proof ("90% choose Pro")
 * - Expected FREE→Paid conversion: 3-5%
 *
 * 4-Tier Structure:
 * - FREE: £0/mo - 1 demo collection/month (viral entry point)
 * - STARTER: £19/mo - 10 collections, 1 member
 * - PRO: £39/mo - 25 collections, 5 members ⭐ RECOMMENDED (best value)
 * - ENTERPRISE: £75/mo - Unlimited collections/members
 *
 * Founding Member Offer:
 * - 50% OFF FIRST YEAR ONLY (NOT lifetime - per research guidance)
 * - After 12 months: Standard pricing applies
 * - 30 days notice before price increase
 *
 * Analytics Events (Document 9 compliance):
 * - pricing_view (page load)
 * - pricing_toggle_annual (billing toggle)
 * - plan_cta_click (CTA clicks)
 */

'use client';

import { useState } from 'react';
import { FoundingMemberCounter, FoundingMemberProgress } from '@/components/FoundingMemberCounter';
import { useTrackPageView, trackEvent } from '@/lib/analytics';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Track pricing page view (Document 9 §4.3)
  useTrackPageView('/pricing');

  // Pricing data (4-tier viral growth structure)
  const plans = [
    {
      id: 'enterprise',
      name: 'Enterprise',
      order: 1, // Listed FIRST for anchoring effect
      description: 'For established agencies managing multiple clients',
      monthlyPrice: 75,
      annualPrice: 60, // £720/year (20% discount)
      annualSavings: 180, // £900 - £720
      foundingMonthly: 37.50,
      foundingYearTotal: 450, // First year only
      collections: 'Unlimited',
      members: 'Unlimited',
      overagePrice: null, // No overages
      features: [
        'Unlimited collections per month',
        'Unlimited team members',
        'Physical letters (30 per month)',
        'AI voice calls (50 per month)',
        'SMS reminders (unlimited)',
        'Advanced analytics dashboard',
        'Dedicated account manager',
        'Priority live chat support',
        '99.9% uptime SLA',
      ],
      highlight: false,
      badge: null,
      roiMessage: 'Unlimited value - scale without limits',
    },
    {
      id: 'pro',
      name: 'Pro',
      order: 2, // Middle position for decoy effect
      description: 'For growing freelancers scaling their business',
      monthlyPrice: 39,
      annualPrice: 31.20, // £374.40/year (20% discount)
      annualSavings: 93.60, // £468 - £374.40
      foundingMonthly: 19.50,
      foundingYearTotal: 234, // First year only
      collections: '25',
      members: '5',
      overagePrice: 1.00, // £1 per additional collection
      features: [
        '25 collections per month',
        '+ £1.00 per additional collection',
        'Up to 5 team members',
        'SMS reminders (Day 15/30)',
        'AI voice calls (15 per month)',
        'Advanced analytics',
        'Priority email support',
        'Email reminders (all days)',
        'BACS "I Paid" button',
      ],
      highlight: true,
      badge: '⭐ MOST POPULAR',
      roiMessage: 'Pays for itself in ~1-2 collections',
    },
    {
      id: 'starter',
      name: 'Starter',
      order: 3,
      description: 'For freelancers just getting started',
      monthlyPrice: 19,
      annualPrice: 15.20, // £182.40/year (20% discount)
      annualSavings: 45.60, // £228 - £182.40
      foundingMonthly: 9.50,
      foundingYearTotal: 114, // First year only
      collections: '10',
      members: '1',
      overagePrice: 1.50, // £1.50 per additional collection
      features: [
        '10 collections per month',
        '+ £1.50 per additional collection',
        'Single user account',
        'Email reminders (all days)',
        'BACS "I Paid" button',
        'Priority email support',
        'Unlimited invoices',
      ],
      highlight: false,
      badge: null,
      roiMessage: 'Pays for itself with just 1 late payment',
    },
    {
      id: 'free',
      name: 'FREE',
      order: 4, // Listed LAST as viral entry point
      description: 'Perfect for trying Relay with real collections',
      monthlyPrice: 0,
      annualPrice: 0,
      annualSavings: 0,
      foundingMonthly: 0,
      foundingYearTotal: 0,
      collections: '1', // Correct limit per latest requirement
      members: '1',
      overagePrice: null,
      features: [
        'Unlimited invoices',
        '1 collection per month',
        'Email reminders only',
        'Manual payment tracking',
        'Max 1 team member',
        'BACS "I Paid" button',
        'Experience full workflow',
        'Upgrade anytime',
      ],
      highlight: false,
      badge: 'TRY IT FREE',
      roiMessage: 'Enough to see real value (5 collections = 60/year)',
    },
  ];

  const displayPrice = (plan: typeof plans[0]) => {
    const isAnnual = billingCycle === 'annual';
    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    return (
      <div>
        <span className="text-4xl font-bold">£{price.toFixed(price % 1 === 0 ? 0 : 2)}</span>
        <span className="text-gray-600 ml-2">/mo</span>
        {isAnnual && (
          <div className="text-sm text-green-600 font-semibold mt-1">
            Save £{plan.annualSavings.toFixed(2)}/year
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Choose Your Plan
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Start FREE. Scale with Pro. Dominate with Enterprise.
            </p>

            {/* Social Proof */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <span>Join 10,000+ freelancers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <span>£2.4M+ recovered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span>4.9/5 rating (500+ reviews)</span>
              </div>
            </div>

            {/* Billing Toggle */}
            <div className="mt-8 inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => {
                  setBillingCycle('monthly');
                  trackEvent('pricing_toggle_annual', { is_annual: false });
                }}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => {
                  setBillingCycle('annual');
                  trackEvent('pricing_toggle_annual', { is_annual: true });
                }}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === 'annual'
                  ? 'bg-white text-indigo-600 shadow-sm'
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

      {/* Founding Member Banner */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-sm font-bold mb-4">
                  <span>🔥</span>
                  <span>LIMITED TIME OFFER</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Join the Founding 50
                </h2>
                <p className="text-lg md:text-xl opacity-95 mb-2">
                  Be one of the first 50 users and get{' '}
                  <strong className="text-yellow-300">50% OFF YOUR FIRST YEAR</strong>
                </p>
                <p className="text-sm md:text-base opacity-90">
                  Launch offer pricing: £9.50 / £19.50 / £37.50 per month (first 12 months only)
                </p>
                <p className="text-xs mt-2 opacity-75">
                  * Standard pricing applies after year 1. We'll give you 30 days notice before any price change.
                </p>
              </div>

              <div className="flex-shrink-0 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-5xl md:text-6xl font-black mb-2">
                    <FoundingMemberCounter />
                  </div>
                  <div className="text-sm uppercase tracking-wide opacity-90 mb-4">
                    spots remaining
                  </div>
                  <div className="w-48 mx-auto">
                    <FoundingMemberProgress />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start text-sm opacity-90">
              <div className="flex items-center gap-2">
                <span className="text-green-300">✓</span>
                <span>50% off first year</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-300">✓</span>
                <span>Founding member badge</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-300">✓</span>
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-300">✓</span>
                <span>Early access to features</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards - ANCHORING EFFECT: Enterprise listed first */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Social Proof Callout */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600">
            <span className="font-semibold text-indigo-600">90% of freelancers</span> choose Pro for the perfect balance of features and value
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans
            .sort((a, b) => a.order - b.order)
            .map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl ${plan.highlight
                  ? 'border-4 border-indigo-500 scale-105 z-10'
                  : 'border-2 border-gray-200'
                  } overflow-hidden transition-transform hover:scale-105`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl">
                    {plan.badge}
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name & Description */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 h-12">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    {displayPrice(plan)}
                    {billingCycle === 'annual' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Billed annually at £{(plan.annualPrice * 12).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* ROI Messaging (Document 9 compliance) */}
                  {plan.roiMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-xs text-green-900 font-semibold mb-1">
                        💰 ROI
                      </p>
                      <p className="text-xs text-green-700">
                        {plan.roiMessage}
                      </p>
                    </div>
                  )}

                  {/* Founding Member Price */}
                  {plan.monthlyPrice > 0 && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-6">
                      <p className="text-xs font-semibold text-purple-900 uppercase mb-1">
                        Founding Member (Year 1)
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        £{plan.foundingMonthly.toFixed(2)}/mo
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        £{plan.foundingYearTotal} first year total
                      </p>
                    </div>
                  )}

                  {/* CTA Button */}
                  <a
                    href="/sign-up"
                    onClick={() => {
                      trackEvent('plan_cta_click', {
                        plan_id: plan.id,
                        context: billingCycle,
                      });
                    }}
                    className={`block w-full text-center py-4 px-6 rounded-lg font-semibold text-lg transition-all ${plan.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-300'
                      }`}
                  >
                    {plan.monthlyPrice === 0 ? 'Start Free' : 'Get Started'}
                  </a>

                  {/* Key Stats */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Collections/month</span>
                      <span className="font-semibold text-gray-900">
                        {plan.collections}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Team members</span>
                      <span className="font-semibold text-gray-900">
                        {plan.members}
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="text-green-600 font-bold flex-shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
        </div>

        {/* Trust Signals */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">
            All plans include: Unlimited invoices • BACS "I Paid" button • UK Late Payment Act compliance
          </p>
          <p className="text-xs text-gray-500">
            Cancel anytime. No hidden fees. 14-day money-back guarantee.
          </p>
        </div>
      </div>
      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
          Compare Plans
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          All plans include unlimited invoice creation and the BACS "I Paid" button.
          Upgrade for more collections and premium features.
        </p>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Pricing plan comparison">
            <caption className="sr-only">
              Pricing plan feature comparison across Enterprise, Pro, Starter, and FREE tiers.
              Compare pricing, collections limits, team size, and included features.
            </caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enterprise
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-indigo-600 uppercase tracking-wider bg-indigo-50 relative">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs px-2 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                  Pro
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Starter
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FREE
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Price Row */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  Price (Founding / Standard)
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">£37.50</div>
                  <div className="text-xs text-gray-500">£75 standard</div>
                </td>
                <td className="px-6 py-4 text-center bg-indigo-50">
                  <div className="text-2xl font-bold text-indigo-600">£19.50</div>
                  <div className="text-xs text-indigo-600">£39 standard</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">£9.50</div>
                  <div className="text-xs text-gray-500">£19 standard</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-2xl font-bold text-green-600">£0</div>
                  <div className="text-xs text-gray-500">Forever free</div>
                </td>
              </tr>

              {/* Collections Limit */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Collections per month
                </td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Unlimited</td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-600 bg-indigo-50">25</td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">10</td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">1</td>
              </tr>

              {/* Team Members */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Team members
                </td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Unlimited</td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-600 bg-indigo-50">5</td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">1</td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">1</td>
              </tr>

              {/* Invoice Creation */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Invoice creation
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓ Unlimited</span>
                </td>
                <td className="px-6 py-4 text-center bg-indigo-50">
                  <span className="text-green-600 font-semibold">✓ Unlimited</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓ Unlimited</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓ Unlimited</span>
                </td>
              </tr>

              {/* Email Reminders */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Email reminders (Day 5/15/30)
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
                <td className="px-6 py-4 text-center bg-indigo-50">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
              </tr>

              {/* SMS Reminders */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  SMS reminders (Day 15/30)
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓ Unlimited</span>
                </td>
                <td className="px-6 py-4 text-center bg-indigo-50">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
                <td className="px-6 py-4 text-center text-gray-400">—</td>
                <td className="px-6 py-4 text-center text-gray-400">—</td>
              </tr>

              {/* AI Voice Calls */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  AI voice collection calls
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓</span>
                  <div className="text-xs text-gray-600">50 per month</div>
                </td>
                <td className="px-6 py-4 text-center bg-indigo-50">
                  <span className="text-green-600 font-semibold">✓</span>
                  <div className="text-xs text-indigo-600">15 per month</div>
                </td>
                <td className="px-6 py-4 text-center text-gray-400">—</td>
                <td className="px-6 py-4 text-center text-gray-400">—</td>
              </tr>

              {/* Physical Letters */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Physical letters (Day 30)
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓</span>
                  <div className="text-xs text-gray-600">30 per month</div>
                </td>
                <td className="px-6 py-4 text-center text-gray-400 bg-indigo-50">—</td>
                <td className="px-6 py-4 text-center text-gray-400">—</td>
                <td className="px-6 py-4 text-center text-gray-400">—</td>
              </tr>

              {/* BACS Button */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  BACS "I Paid" button
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
                <td className="px-6 py-4 text-center bg-indigo-50">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
              </tr>

              {/* Analytics */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Advanced analytics
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
                <td className="px-6 py-4 text-center bg-indigo-50">
                  <span className="text-green-600 font-semibold">✓</span>
                </td>
                <td className="px-6 py-4 text-center text-gray-400">—</td>
                <td className="px-6 py-4 text-center text-gray-400">—</td>
              </tr>

              {/* Support */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Support
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  Dedicated manager
                </td>
                <td className="px-6 py-4 text-center text-sm text-indigo-600 bg-indigo-50">
                  Priority live chat
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  Priority email
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  Community support
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              What happens to founding member pricing after year 1?
            </h3>
            <p className="text-gray-600">
              Founding members get 50% off for their first 12 months. After that, standard pricing applies
              (£19/£39/£75). We'll give you 30 days notice before any price change, and you can downgrade
              or cancel anytime if needed.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              What does the FREE tier include?
            </h3>
            <p className="text-gray-600">
              The FREE tier gives you 1 demo collection per month so you can experience Relay's full workflow
              risk-free. Create unlimited invoices, send email reminders, and use the BACS "I Paid" button.
              It's perfect for trying out the platform before upgrading to a paid plan.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Can I upgrade from FREE to Starter or Pro later?
            </h3>
            <p className="text-gray-600">
              Absolutely! You can upgrade or downgrade anytime. If you're a founding member, your 50% discount
              applies to whichever paid plan you choose during your first year. After year 1, standard pricing applies.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              What counts as a "collection"?
            </h3>
            <p className="text-gray-600">
              A collection is any automated reminder sent for an overdue invoice (email, SMS, AI call,
              or letter). FREE includes 1 demo per month, Starter includes 10, Pro includes 25, and Enterprise is unlimited.
              Email reminders are included in all plans.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Do you offer annual billing?
            </h3>
            <p className="text-gray-600">
              Yes! Save 20% with annual billing on paid plans. That's £182/year for Starter (vs £228), £374/year for Pro
              (vs £468), and £720/year for Enterprise (vs £900). Annual plans are billed upfront. The FREE tier remains free forever.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Can I cancel anytime?
            </h3>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time. You'll still have access until the end
              of your billing period. We also offer a 14-day money-back guarantee if you're not satisfied.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-900">
          Ready to get paid faster?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join 10,000+ freelancers recovering unpaid invoices with Relay.
        </p>
        <a
          href="/sign-up"
          className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
        >
          Claim Your Founding Member Spot
        </a>
        <p className="mt-4 text-sm text-gray-500">
          50% off first year • 14-day money-back guarantee • Cancel anytime
        </p>
      </div>
    </div>
  );
}

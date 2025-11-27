/**
 * Upgrade Flow Component
 * Handles Pro and MTD-Pro upgrades via Clerk
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UpgradeFlowProps {
  selectedPlan: string;
}

export function UpgradeFlow({ selectedPlan }: UpgradeFlowProps) {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = {
    pro: {
      name: 'Pro',
      monthlyPrice: 10,
      annualPrice: 96,
      annualSavings: 24,
      icon: '💼',
      features: [
        'Unlimited expenses',
        'Unlimited receipt OCR',
        '1GB receipt storage',
        'Bulk expense import',
        'AI revenue forecasting',
        'Advanced collections (25/month)',
        'Email + SMS reminders',
        'Priority support',
      ],
    },
    'mtd-pro': {
      name: 'MTD-Pro',
      monthlyPrice: 20,
      annualPrice: 192,
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
      ],
      badge: 'Coming Soon',
    },
  };

  const plan = plans[selectedPlan as keyof typeof plans] || plans.pro;
  const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const displayPrice = billingCycle === 'annual' ? price / 12 : price;

  const handleUpgrade = async () => {
    setIsProcessing(true);

    try {
      // MTD-Pro is not yet available - show waitlist
      if (selectedPlan === 'mtd-pro') {
        router.push('/pricing?plan=mtd-pro#waitlist');
        return;
      }

      // TODO: Replace with your actual Clerk checkout URL
      // Option 1: Direct Clerk subscription URL
      // window.location.href = `https://your-clerk-domain.clerk.accounts.dev/subscribe?plan=${selectedPlan}_${billingCycle}`;

      // Option 2: Custom API endpoint that creates Clerk checkout session
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again or contact support.');
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Upgrade to {plan.name}</h1>
        <p className="text-xl text-gray-600">
          Unlock unlimited expenses and revenue recovery features
        </p>
      </div>

      {/* Plan Card */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 overflow-hidden mb-8">
        <div className="bg-blue-600 text-white text-center py-4">
          <span className="text-4xl">{plan.icon}</span>
          <h2 className="text-2xl font-bold mt-2">{plan.name}</h2>
          {'badge' in plan && plan.badge && (
            <span className="inline-block bg-purple-500 text-white text-xs px-3 py-1 rounded-full mt-2">
              {plan.badge}
            </span>
          )}
        </div>

        <div className="p-8">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-6xl font-bold text-gray-900">
                £{displayPrice.toFixed(displayPrice % 1 === 0 ? 0 : 2)}
              </span>
              <span className="text-xl text-gray-600">/month</span>
            </div>
            {billingCycle === 'annual' && plan.annualSavings > 0 && (
              <div>
                <p className="text-green-600 font-semibold mb-1">
                  Save £{plan.annualSavings}/year
                </p>
                <p className="text-sm text-gray-500">
                  Billed annually at £{plan.annualPrice}
                </p>
              </div>
            )}
            {billingCycle === 'monthly' && (
              <p className="text-sm text-gray-500">Billed monthly</p>
            )}
          </div>

          {/* Features */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              What you'll get:
            </h3>
            <div className="space-y-3">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-green-600 font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-3">
                <span className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full" />
                Processing...
              </span>
            ) : selectedPlan === 'mtd-pro' ? (
              'Join Waitlist'
            ) : (
              `Upgrade to ${plan.name} Now`
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            14-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-4">💡 Common Questions</h3>
        <div className="space-y-4 text-sm text-blue-800">
          <div>
            <p className="font-semibold mb-1">When does my upgrade take effect?</p>
            <p className="text-blue-700">
              Immediately! You'll have access to all Pro features as soon as payment is confirmed.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Can I cancel anytime?</p>
            <p className="text-blue-700">
              Yes. Cancel anytime from your dashboard. You'll still have access until the end of your
              billing period.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Do you offer refunds?</p>
            <p className="text-blue-700">
              Yes! We offer a 14-day money-back guarantee. If you're not satisfied, we'll refund you—no
              questions asked.
            </p>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Back to pricing
        </button>
      </div>
    </div>
  );
}

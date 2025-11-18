'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Confetti from './Confetti';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'freelancer',
    industry: '',
    monthlyInvoices: '',
    mainGoal: '',
    preferredCurrency: 'GBP',
    notificationPreference: 'all',
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Recoup!',
      description: "Let's get you set up in just a few minutes",
      icon: '👋',
      completed: currentStep > 0,
    },
    {
      id: 'business-details',
      title: 'Tell us about your business',
      description: 'Help us customize your experience',
      icon: '💼',
      completed: currentStep > 1,
    },
    {
      id: 'goals',
      title: 'What brings you to Recoup?',
      description: 'We\'ll help you achieve your goals',
      icon: '🎯',
      completed: currentStep > 2,
    },
    {
      id: 'preferences',
      title: 'Set your preferences',
      description: 'Customize how Recoup works for you',
      icon: '⚙️',
      completed: currentStep > 3,
    },
    {
      id: 'complete',
      title: 'You\'re all set!',
      description: 'Let\'s create your first invoice',
      icon: '🚀',
      completed: currentStep > 4,
    },
  ];

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // Save onboarding completion
      await completeOnboarding();
      setShowConfetti(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } else {
      setCurrentStep(currentStep + 1);
      // Save progress to Firestore
      await saveProgress();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.push('/dashboard');
  };

  const saveProgress = async () => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: steps[currentStep].id,
          completedSteps: steps.slice(0, currentStep).map(s => s.id),
          formData,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save progress');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      });

      if (!response.ok) {
        console.error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.businessName.trim().length > 0;
      case 2:
        return formData.mainGoal.trim().length > 0;
      default:
        return true;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Recoup</h1>
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-xs text-gray-600">
                {Math.round(progress)}% complete
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-center space-x-2 sm:space-x-4">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full text-lg sm:text-xl
                        transition-all duration-300
                        ${index === currentStep
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg scale-110'
                          : step.completed
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                        }
                      `}
                    >
                      {step.completed ? '✓' : step.icon}
                    </div>
                    <span className={`mt-2 text-xs sm:text-sm font-medium hidden sm:block ${
                      index === currentStep ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      {step.title.split(' ')[0]}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-6 sm:px-12 py-8 sm:py-12">
              {/* Step Content */}
              {currentStep === 0 && (
                <div className="text-center">
                  <div className="text-6xl mb-6">{steps[0].icon}</div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    Welcome to Recoup!
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    We're here to help you get paid faster and easier. Let's get you set up in just a few minutes.
                  </p>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8">
                    <h3 className="font-semibold text-indigo-900 mb-3">What you'll do:</h3>
                    <ul className="text-left text-indigo-800 space-y-2">
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Tell us about your business</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Set your goals and preferences</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Get personalized tips to get started</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-500">
                    This will take about 2-3 minutes
                  </p>
                </div>
              )}

              {currentStep === 1 && (
                <div>
                  <div className="text-5xl mb-6">{steps[1].icon}</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Tell us about your business
                  </h2>
                  <p className="text-gray-600 mb-8">
                    This helps us personalize your experience
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => updateFormData('businessName', e.target.value)}
                        placeholder="e.g., Smith Design Studio"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Type
                      </label>
                      <select
                        value={formData.businessType}
                        onChange={(e) => updateFormData('businessType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="freelancer">Freelancer / Sole Trader</option>
                        <option value="limited-company">Limited Company</option>
                        <option value="agency">Agency</option>
                        <option value="consultant">Consultant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry
                      </label>
                      <select
                        value={formData.industry}
                        onChange={(e) => updateFormData('industry', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select your industry</option>
                        <option value="design">Design & Creative</option>
                        <option value="development">Development & IT</option>
                        <option value="marketing">Marketing & PR</option>
                        <option value="consulting">Consulting</option>
                        <option value="writing">Writing & Content</option>
                        <option value="photography">Photography & Video</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How many invoices do you send per month?
                      </label>
                      <select
                        value={formData.monthlyInvoices}
                        onChange={(e) => updateFormData('monthlyInvoices', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select a range</option>
                        <option value="1-5">1-5 invoices</option>
                        <option value="6-15">6-15 invoices</option>
                        <option value="16-30">16-30 invoices</option>
                        <option value="31+">31+ invoices</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <div className="text-5xl mb-6">{steps[2].icon}</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    What brings you to Recoup?
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Select your main goal so we can help you achieve it
                  </p>

                  <div className="space-y-3">
                    {[
                      { value: 'get-paid-faster', label: 'Get paid faster', icon: '⚡' },
                      { value: 'reduce-late-payments', label: 'Reduce late payments', icon: '📉' },
                      { value: 'automate-reminders', label: 'Automate payment reminders', icon: '🤖' },
                      { value: 'track-invoices', label: 'Better invoice tracking', icon: '📊' },
                      { value: 'professional-image', label: 'Look more professional', icon: '✨' },
                      { value: 'other', label: 'Something else', icon: '💡' },
                    ].map((goal) => (
                      <button
                        key={goal.value}
                        onClick={() => updateFormData('mainGoal', goal.value)}
                        className={`
                          w-full flex items-center p-4 rounded-lg border-2 transition-all
                          ${formData.mainGoal === goal.value
                            ? 'border-indigo-600 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <span className="text-2xl mr-4">{goal.icon}</span>
                        <span className={`font-medium ${
                          formData.mainGoal === goal.value ? 'text-indigo-900' : 'text-gray-700'
                        }`}>
                          {goal.label}
                        </span>
                        {formData.mainGoal === goal.value && (
                          <span className="ml-auto text-indigo-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <div className="text-5xl mb-6">{steps[3].icon}</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Set your preferences
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Customize how Recoup works for you
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Currency
                      </label>
                      <select
                        value={formData.preferredCurrency}
                        onChange={(e) => updateFormData('preferredCurrency', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Notification Preferences
                      </label>
                      <div className="space-y-3">
                        {[
                          { value: 'all', label: 'All notifications', description: 'Get updates about everything' },
                          { value: 'important', label: 'Important only', description: 'Payments and urgent matters' },
                          { value: 'minimal', label: 'Minimal', description: 'Only critical updates' },
                        ].map((pref) => (
                          <button
                            key={pref.value}
                            onClick={() => updateFormData('notificationPreference', pref.value)}
                            className={`
                              w-full text-left p-4 rounded-lg border-2 transition-all
                              ${formData.notificationPreference === pref.value
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className={`font-medium ${
                                  formData.notificationPreference === pref.value ? 'text-indigo-900' : 'text-gray-900'
                                }`}>
                                  {pref.label}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {pref.description}
                                </div>
                              </div>
                              {formData.notificationPreference === pref.value && (
                                <span className="text-indigo-600">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="text-center">
                  <div className="text-6xl mb-6">{steps[4].icon}</div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    You're all set!
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Your Recoup account is ready. Let's create your first invoice and start getting paid.
                  </p>

                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-indigo-900 mb-4">Quick Tips to Get Started:</h3>
                    <div className="space-y-3 text-left">
                      <div className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                        <span className="text-2xl mr-3">1️⃣</span>
                        <div>
                          <div className="font-medium text-gray-900">Create your first invoice</div>
                          <div className="text-sm text-gray-600">Use our quick invoice builder</div>
                        </div>
                      </div>
                      <div className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                        <span className="text-2xl mr-3">2️⃣</span>
                        <div>
                          <div className="font-medium text-gray-900">Enable automatic reminders</div>
                          <div className="text-sm text-gray-600">Never chase payments manually again</div>
                        </div>
                      </div>
                      <div className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                        <span className="text-2xl mr-3">3️⃣</span>
                        <div>
                          <div className="font-medium text-gray-900">Track your payments</div>
                          <div className="text-sm text-gray-600">See everything in your dashboard</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">💡</span>
                      <div className="text-left">
                        <div className="font-medium text-yellow-900">Pro Tip</div>
                        <div className="text-sm text-yellow-800">
                          Enable collections to automatically escalate overdue invoices. You'll get paid faster!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bg-gray-50 px-6 sm:px-12 py-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className={`
                    px-6 py-2 rounded-lg font-medium transition-all
                    ${currentStep === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  Back
                </button>

                <button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className={`
                    px-8 py-3 rounded-lg font-medium transition-all shadow-md
                    ${isStepValid()
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {currentStep === steps.length - 1 ? 'Go to Dashboard' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

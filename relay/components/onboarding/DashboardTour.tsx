'use client';

import { useEffect } from 'react';
import FeatureTour, { TourStep, useTour } from './FeatureTour';
import { useRouter } from 'next/navigation';

export default function DashboardTour() {
  const router = useRouter();
  const { isTourActive, startTour, setIsTourActive, isTourCompleted } = useTour('dashboard');

  useEffect(() => {
    // Auto-start tour for new users after a brief delay
    if (!isTourCompleted()) {
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="dashboard-summary"]',
      title: 'Welcome to Your Dashboard! 👋',
      content: 'This is your command center. Here you can see an overview of your invoices, payments, and cash flow at a glance.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="create-invoice-button"]',
      title: 'Create Your First Invoice',
      content: 'Click here to create a new invoice. You can use our quick form or even dictate using voice input!',
      placement: 'left',
      action: {
        label: 'Create Invoice Now',
        onClick: () => {
          // Don't navigate, just show the feature
        },
      },
    },
    {
      target: '[data-tour="invoice-list"]',
      title: 'Track All Your Invoices',
      content: 'All your invoices appear here. You can filter by status (draft, sent, paid, overdue) and search by client name.',
      placement: 'top',
    },
    {
      target: '[data-tour="collections-toggle"]',
      title: 'Enable Collections Mode',
      content: 'Turn on Collections to automatically send payment reminders and escalate overdue invoices. We\'ll handle it all for you!',
      placement: 'left',
    },
    {
      target: '[data-tour="notifications"]',
      title: 'Stay Updated',
      content: 'Get notified when invoices are viewed, when payments are received, and when reminders are sent.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="analytics"]',
      title: 'Understand Your Cash Flow',
      content: 'View detailed analytics about your payment patterns, average days to payment, and predicted revenue.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="help-center"]',
      title: 'Need Help?',
      content: 'Access our help center, video tutorials, and support anytime. We\'re here to help you succeed!',
      placement: 'bottom',
    },
  ];

  const handleTourComplete = async () => {
    // Track analytics
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'feature_tour_completed',
          properties: { tourId: 'dashboard' },
        }),
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  const handleTourSkip = async () => {
    // Track skip event
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'feature_tour_skipped',
          properties: { tourId: 'dashboard' },
        }),
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  return (
    <FeatureTour
      steps={tourSteps}
      tourId="dashboard"
      autoStart={false}
      onComplete={handleTourComplete}
      onSkip={handleTourSkip}
    />
  );
}

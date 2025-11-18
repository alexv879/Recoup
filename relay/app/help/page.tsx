import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';

export default async function HelpCenterPage() {
  const { userId } = await auth();

  const categories = [
    {
      title: 'Getting Started',
      icon: '🚀',
      description: 'Learn the basics and get up and running quickly',
      articles: [
        { title: 'Creating your first invoice', href: '/help/creating-first-invoice' },
        { title: 'Setting up payment methods', href: '/help/payment-methods' },
        { title: 'Understanding the dashboard', href: '/help/dashboard-guide' },
        { title: 'Inviting clients', href: '/help/inviting-clients' },
      ],
    },
    {
      title: 'Invoicing',
      icon: '📄',
      description: 'Everything about creating and managing invoices',
      articles: [
        { title: 'Creating invoices', href: '/help/creating-invoices' },
        { title: 'Using voice input', href: '/help/voice-input' },
        { title: 'Customizing invoice templates', href: '/help/invoice-templates' },
        { title: 'Managing invoice statuses', href: '/help/invoice-statuses' },
        { title: 'Bulk invoice actions', href: '/help/bulk-actions' },
      ],
    },
    {
      title: 'Collections & Reminders',
      icon: '⚡',
      description: 'Automate payment reminders and collections',
      articles: [
        { title: 'How Collections Mode works', href: '/help/collections-mode' },
        { title: 'Setting up automatic reminders', href: '/help/automatic-reminders' },
        { title: 'Understanding escalation timeline', href: '/help/escalation-timeline' },
        { title: 'Customizing reminder emails', href: '/help/custom-reminders' },
        { title: 'Legal rights and late fees', href: '/help/late-fees' },
      ],
    },
    {
      title: 'Payments',
      icon: '💳',
      description: 'Accept and track payments from clients',
      articles: [
        { title: 'Payment methods supported', href: '/help/payment-methods' },
        { title: 'Stripe integration', href: '/help/stripe-integration' },
        { title: 'Marking invoices as paid', href: '/help/mark-paid' },
        { title: 'Payment confirmations', href: '/help/payment-confirmations' },
        { title: 'Refunds and disputes', href: '/help/refunds-disputes' },
      ],
    },
    {
      title: 'Analytics & Reports',
      icon: '📊',
      description: 'Track your business performance',
      articles: [
        { title: 'Understanding your metrics', href: '/help/metrics' },
        { title: 'Cash flow predictions', href: '/help/cash-flow' },
        { title: 'Exporting data', href: '/help/exporting-data' },
        { title: 'Payment history reports', href: '/help/payment-reports' },
      ],
    },
    {
      title: 'Account & Settings',
      icon: '⚙️',
      description: 'Manage your account and preferences',
      articles: [
        { title: 'Account settings', href: '/help/account-settings' },
        { title: 'Notification preferences', href: '/help/notifications' },
        { title: 'Subscription plans', href: '/help/subscription-plans' },
        { title: 'Team members', href: '/help/team-members' },
        { title: 'Security and privacy', href: '/help/security' },
      ],
    },
  ];

  const quickActions = [
    { title: 'Watch video tutorials', icon: '🎥', href: '/help/videos' },
    { title: 'Join community forum', icon: '💬', href: '/help/community' },
    { title: 'Contact support', icon: '📧', href: '/help/contact' },
    { title: 'Request a feature', icon: '💡', href: '/feedback' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200" data-tour="help-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How can we help you?
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Find answers, learn best practices, and get the most out of Recoup
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help articles..."
                  className="w-full px-6 py-4 pl-12 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <span className="text-3xl mr-3">{action.icon}</span>
              <span className="font-medium text-gray-900">{action.title}</span>
            </Link>
          ))}
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.title}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start mb-4">
                <span className="text-4xl mr-3">{category.icon}</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {category.title}
                  </h2>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>

              <ul className="space-y-2">
                {category.articles.map((article) => (
                  <li key={article.title}>
                    <Link
                      href={article.href}
                      className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Still Need Help Section */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Still need help?</h2>
          <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
            Our support team is here to help you succeed. Get in touch and we'll respond as quickly as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/help/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </Link>
            <Link
              href="/help/videos"
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-700 text-white font-medium rounded-lg hover:bg-indigo-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Tutorials
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-gray-200">
        <div className="text-center text-sm text-gray-600">
          <p>
            Looking for something specific?{' '}
            <Link href="/help/contact" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Let us know
            </Link>
            {' '}and we'll help you find it.
          </p>
        </div>
      </div>
    </div>
  );
}

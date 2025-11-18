import Link from 'next/link';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              💡 Share Your Feedback
            </h1>
            <p className="text-indigo-100">
              Help us make Recoup better for everyone
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            <div className="text-center mb-8">
              <p className="text-lg text-gray-700 mb-4">
                We'd love to hear from you! Your feedback helps us improve and build features that matter most to you.
              </p>
            </div>

            {/* Feedback Types */}
            <div className="space-y-4 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🐛</span>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Report a Bug</h3>
                    <p className="text-sm text-blue-800">
                      Found something broken? Let us know so we can fix it quickly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">💡</span>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-1">Request a Feature</h3>
                    <p className="text-sm text-purple-800">
                      Have an idea for a new feature? We're all ears!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">💬</span>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">General Feedback</h3>
                    <p className="text-sm text-green-800">
                      Share your thoughts, suggestions, or just say hello!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                Click the feedback button in the bottom right corner to get started,
                or send us an email directly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Dashboard
                </Link>

                <a
                  href="mailto:support@recoup.app"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Us
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">24h</div>
                  <div className="text-xs text-gray-600">Avg Response Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">500+</div>
                  <div className="text-xs text-gray-600">Features Shipped</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-pink-600">95%</div>
                  <div className="text-xs text-gray-600">User Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Your feedback is confidential and helps us prioritize what to build next
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          rating,
          message,
          email,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          setMessage('');
          setRating(null);
          setFeedbackType('general');
        }, 2000);
      } else {
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof window === 'undefined') return null;

  return (
    <>
      {/* Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 lg:bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 z-40 flex items-center space-x-2"
        aria-label="Send feedback"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <span className="hidden sm:inline font-medium">Feedback</span>
      </button>

      {/* Feedback Modal */}
      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">
                      {isSuccess ? '✓ Thank you!' : '💬 Send Feedback'}
                    </h2>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-white/80 hover:text-white transition-colors"
                      aria-label="Close"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                  {isSuccess ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">🎉</div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Feedback received!
                      </p>
                      <p className="text-gray-600">
                        We appreciate your input and will review it carefully.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-5">
                        {/* Feedback Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            What type of feedback do you have?
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: 'bug', label: 'Bug Report', icon: '🐛' },
                              { value: 'feature', label: 'Feature Idea', icon: '💡' },
                              { value: 'general', label: 'General', icon: '💬' },
                            ].map((type) => (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => setFeedbackType(type.value as any)}
                                className={`
                                  flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                                  ${feedbackType === type.value
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                                    : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                                  }
                                `}
                              >
                                <span className="text-2xl mb-1">{type.icon}</span>
                                <span className="text-xs font-medium">{type.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rating */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            How would you rate your experience?
                          </label>
                          <div className="flex justify-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="text-3xl hover:scale-110 transition-transform"
                              >
                                {rating && star <= rating ? '⭐' : '☆'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Message */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tell us more *
                          </label>
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            rows={4}
                            placeholder="What can we improve? What do you love? Any bugs to report?"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email (optional)
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            We'll only use this if we need to follow up
                          </p>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="mt-6 flex space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !message.trim()}
                          className={`
                            flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all
                            ${isSubmitting || !message.trim()
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:scale-105'
                            }
                          `}
                        >
                          {isSubmitting ? 'Sending...' : 'Send Feedback'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
